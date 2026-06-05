import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { env } from '../config/env.js';

export type FoodEstimate = {
  normalizedFoodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
};

export type ExerciseEstimate = {
  name: string;
  description: string;
  category: string | null;
  bodyPart: string | null;
  defaultSets: number | null;
  defaultReps: number | null;
  defaultDurationMinutes: number | null;
  confidence: number;
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type ChatChannel = 'web' | 'sms';

export interface AiProvider {
  lookupFood(input: string): Promise<FoodEstimate[]>;
  lookupFoodFromImage(image: { data: string; mimeType: string }, input?: string): Promise<FoodEstimate[]>;
  lookupExercises(input: string): Promise<ExerciseEstimate[]>;
  chat(messages: ChatMessage[], context: string, channel?: ChatChannel): Promise<string>;
}

const foodEstimateSchema = z.object({
  normalizedFoodName: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  confidence: z.number().min(0).max(1)
});

const foodLookupResponseSchema = z.union([
  z.object({ items: z.array(foodEstimateSchema).min(1) }),
  foodEstimateSchema.transform((item) => ({ items: [item] }))
]);

function normalizeExerciseCategory(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('cardio') || normalized.includes('endurance') || normalized.includes('run')) return 'Cardio';
  if (normalized.includes('recover') || normalized.includes('mobil') || normalized.includes('stretch') || normalized.includes('yoga')) {
    return 'Recovery';
  }
  if (normalized.includes('strength') || normalized.includes('resist') || normalized.includes('weight')) return 'Strength';
  return null;
}

const EXERCISE_BODY_PARTS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Legs',
  'Glutes',
  'Calves',
  'Full Body'
] as const;

function normalizeExerciseBodyPart(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const exact = EXERCISE_BODY_PARTS.find((part) => part.toLowerCase() === normalized);
  if (exact) return exact;
  if (normalized.includes('bicep')) return 'Biceps';
  if (normalized.includes('tricep')) return 'Triceps';
  if (normalized.includes('chest')) return 'Chest';
  if (normalized.includes('back') || normalized.includes('lat')) return 'Back';
  if (normalized.includes('shoulder')) return 'Shoulders';
  if (normalized.includes('forearm')) return 'Forearms';
  if (normalized.includes('core') || normalized.includes('abs') || normalized.includes('ab ')) return 'Core';
  if (normalized.includes('glute')) return 'Glutes';
  if (normalized.includes('calf') || normalized.includes('calves')) return 'Calves';
  if (normalized.includes('leg') || normalized.includes('quad') || normalized.includes('hamstring')) return 'Legs';
  if (normalized.includes('full')) return 'Full Body';
  return null;
}

const exerciseCategorySchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => normalizeExerciseCategory(value ?? null));

const exerciseBodyPartSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => normalizeExerciseBodyPart(value ?? null));

const optionalInt = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
  });

const exerciseEstimateSchema = z.object({
  name: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1)),
  description: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      const text = value == null ? '' : String(value).trim();
      return text || 'Perform with controlled form and steady breathing.';
    })
    .pipe(z.string().min(1).max(500)),
  category: exerciseCategorySchema,
  bodyPart: exerciseBodyPartSchema,
  defaultSets: optionalInt,
  defaultReps: optionalInt,
  defaultDurationMinutes: optionalInt,
  confidence: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value) => {
      const parsed = value == null || value === '' ? 0.75 : Number(value);
      return roundConfidence(Number.isFinite(parsed) ? parsed : 0.75);
    })
});

const exerciseLookupResponseSchema = z.object({
  items: z.array(exerciseEstimateSchema).min(1).max(8)
});

const FOOD_LOOKUP_PROMPT = `Estimate nutrition for each distinct food in the input.
Return JSON only: { "items": [ { "normalizedFoodName": string (include portion), "calories": number, "protein": grams, "carbs": grams, "fat": grams, "confidence": 0-1 }, ... ] }
Each food line must be its own item. Never combine multiple foods into one entry.`;

const EXERCISE_LOOKUP_PROMPT = `Suggest relevant exercises for the user's query.
Return JSON only: { "items": [ { "name": string, "description": string (1 short sentence on form and cues), "category": "Strength"|"Cardio"|"Recovery"|null, "bodyPart": "Chest"|"Back"|"Shoulders"|"Biceps"|"Triceps"|"Forearms"|"Core"|"Legs"|"Glutes"|"Calves"|"Full Body"|null, "defaultSets": number|null, "defaultReps": number|null, "defaultDurationMinutes": number|null, "confidence": 0-1 }, ... ] }
Return exactly 4 distinct exercises. Keep descriptions under 140 characters. Use Strength for resistance work, Cardio for endurance, Recovery for mobility/stretching. Set bodyPart to the primary muscle group trained.`;

const ASSISTANT_SYSTEM = `You are a concise metabolic health coach assistant for the Metabolic app.
Answer using the user's live program data when relevant. Be practical and specific.
Keep responses short unless the user asks for detail. Use plain language, not markdown headers.
If data is missing, say what you would need rather than inventing numbers.
Be warm and encouraging when the user is doing well — celebrate meals logged, exercises completed, and consistency.
Keep motivation genuine and tied to their actual progress, not generic hype.`;

const SMS_ASSISTANT_ADDENDUM = `You are replying over SMS or WhatsApp.
Keep answers under 320 characters when you can. Hard limit 1500 characters.
Use plain text only — no markdown, bullets, asterisks, or headers.
When listing meals or exercises, use short numbered lines.
For meal-planning questions, use the user's actual meals, macros, and targets from context — do not invent foods or numbers.
You cannot change the user's data. Never say you marked exercises or meals complete unless program data already shows that status.
If the user wants to mark a meal eaten, tell them to say "mark this meal complete" or "mark lunch as eaten".
If the user wants to mark exercises done, tell them to say "mark all exercises done" or "mark done" for the next one.
End with a brief line of encouragement when it fits — e.g. sticking to the plan, finishing workouts, or hitting protein. One short sentence, not cheesy.`;

function normalizeEstimate(parsed: z.infer<typeof foodEstimateSchema>): FoodEstimate {
  return {
    ...parsed,
    normalizedFoodName: parsed.normalizedFoodName.trim(),
    calories: Math.round(parsed.calories),
    protein: roundMacro(parsed.protein),
    carbs: roundMacro(parsed.carbs),
    fat: roundMacro(parsed.fat),
    confidence: roundConfidence(parsed.confidence)
  };
}

function normalizeExerciseEstimate(parsed: z.infer<typeof exerciseEstimateSchema>): ExerciseEstimate {
  return {
    name: parsed.name.trim(),
    description: parsed.description.trim(),
    category: parsed.category ?? null,
    bodyPart: parsed.bodyPart ?? null,
    defaultSets: parsed.defaultSets ?? null,
    defaultReps: parsed.defaultReps ?? null,
    defaultDurationMinutes: parsed.defaultDurationMinutes ?? null,
    confidence: roundConfidence(parsed.confidence)
  };
}

function splitFoodLines(input: string) {
  return input
    .split(/\n|,|;|•/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);
}

function parseModelJson(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model returned invalid JSON');
    return JSON.parse(match[0]);
  }
}

function parseExerciseLookupResponse(text: string) {
  const parsed = parseModelJson(text);
  const result = exerciseLookupResponseSchema.safeParse(parsed);
  if (result.success) return result.data.items.map(normalizeExerciseEstimate);

  const items = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [parsed];
  const normalized: ExerciseEstimate[] = [];
  for (const item of items) {
    const parsedItem = exerciseEstimateSchema.safeParse(item);
    if (parsedItem.success) normalized.push(normalizeExerciseEstimate(parsedItem.data));
  }

  if (!normalized.length) {
    throw result.error;
  }

  return normalized;
}

class MockAiProvider implements AiProvider {
  async lookupFood(input: string): Promise<FoodEstimate[]> {
    const lines = splitFoodLines(input);
    const items = lines.length ? lines : [input.trim()];
    return items.map((line) => {
      const lower = line.toLowerCase();
      const protein = lower.includes('chicken') ? 42 : lower.includes('egg') ? 18 : lower.includes('almond') ? 30 : 24;
      const carbs = lower.includes('rice') ? 45 : lower.includes('banana') ? 27 : lower.includes('corn') ? 15 : 20;
      const fat = lower.includes('salmon') ? 14 : lower.includes('avocado') ? 18 : lower.includes('almond') ? 72 : 6;
      return {
        normalizedFoodName: line.replace(/\s+/g, ' '),
        calories: Math.round(protein * 4 + carbs * 4 + fat * 9),
        protein,
        carbs,
        fat,
        confidence: 0.72
      };
    });
  }

  async lookupFoodFromImage(_image: { data: string; mimeType: string }, input = 'uploaded meal photo'): Promise<FoodEstimate[]> {
    return this.lookupFood(input || 'uploaded meal photo');
  }

  async lookupExercises(input: string): Promise<ExerciseEstimate[]> {
    const query = input.trim();
    const lower = query.toLowerCase();
    if (lower.includes('bicep') || lower.includes('biceps')) {
      return [
        {
          name: 'Dumbbell Bicep Curl',
          description: 'Stand tall with dumbbells at your sides. Curl up without swinging, then lower under control.',
          category: 'Strength',
          bodyPart: 'Biceps',
          defaultSets: 3,
          defaultReps: 10,
          defaultDurationMinutes: null,
          confidence: 0.84
        },
        {
          name: 'Hammer Curl',
          description: 'Hold dumbbells with neutral palms facing in. Curl while keeping elbows close to your ribs.',
          category: 'Strength',
          bodyPart: 'Biceps',
          defaultSets: 3,
          defaultReps: 10,
          defaultDurationMinutes: null,
          confidence: 0.82
        },
        {
          name: 'Cable Curl',
          description: 'Use a low cable handle and curl with steady tension. Avoid leaning back at the top.',
          category: 'Strength',
          bodyPart: 'Biceps',
          defaultSets: 3,
          defaultReps: 12,
          defaultDurationMinutes: null,
          confidence: 0.8
        }
      ];
    }

    if (lower.includes('abs') || lower.includes('core')) {
      return [
        {
          name: 'Plank',
          description: 'Hold a straight line from head to heels with ribs down and glutes engaged.',
          category: 'Strength',
          bodyPart: 'Core',
          defaultSets: 3,
          defaultReps: null,
          defaultDurationMinutes: 1,
          confidence: 0.86
        },
        {
          name: 'Dead Bug',
          description: 'Press your lower back into the floor while extending opposite arm and leg slowly.',
          category: 'Strength',
          bodyPart: 'Core',
          defaultSets: 3,
          defaultReps: 10,
          defaultDurationMinutes: null,
          confidence: 0.84
        },
        {
          name: 'Bicycle Crunch',
          description: 'Rotate through the ribs and bring elbow to knee without pulling on your neck.',
          category: 'Strength',
          bodyPart: 'Core',
          defaultSets: 3,
          defaultReps: 20,
          defaultDurationMinutes: null,
          confidence: 0.82
        },
        {
          name: 'Hollow Body Hold',
          description: 'Lower back stays glued to the floor while arms and legs hover in a tight hollow shape.',
          category: 'Strength',
          bodyPart: 'Core',
          defaultSets: 3,
          defaultReps: null,
          defaultDurationMinutes: 1,
          confidence: 0.8
        }
      ];
    }

    return [
      {
        name: query.replace(/\s+/g, ' ').slice(0, 60) || 'Custom exercise',
        description: 'Perform with controlled form, full range of motion, and steady breathing throughout each rep.',
        category: 'Strength',
        bodyPart: null,
        defaultSets: 3,
        defaultReps: 10,
        defaultDurationMinutes: null,
        confidence: 0.65
      }
    ];
  }

  async chat(messages: ChatMessage[], context: string, channel: ChatChannel = 'web'): Promise<string> {
    const last = messages.at(-1)?.content.toLowerCase() ?? '';
    const suffix = channel === 'sms' ? ' (mock SMS — set AI_PROVIDER=gemini.)' : ' (mock — set AI_PROVIDER=gemini.)';
    if (last.includes('meal')) return `Based on your program data: ${context.slice(0, 180)}…${suffix}`;
    if (last.includes('calorie')) return `Calorie guidance uses your live targets.${suffix}`;
    return `AI assistant is in mock mode. Set AI_PROVIDER=gemini and GEMINI_API_KEY in server/.env.${suffix}`;
  }
}

function wrapAiError(error: unknown, action: string): Error {
  if (error instanceof z.ZodError) {
    const detail = error.issues[0]?.message ?? 'Invalid AI response';
    return new Error(`AI ${action} failed: ${detail}`);
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('404 Not Found') && message.includes('model')) {
    return new Error(`Gemini model "${env.GEMINI_MODEL}" is unavailable. Set GEMINI_MODEL=gemini-2.5-flash in server/.env and restart the API.`);
  }
  if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
    return new Error('Gemini API key is invalid. Check GEMINI_API_KEY in server/.env.');
  }
  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    return new Error('Gemini API quota exceeded. Check billing in Google AI Studio.');
  }
  return new Error(`AI ${action} failed: ${message}`);
}

class GeminiAiProvider implements AiProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  private foodModel() {
    return this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });
  }

  private exerciseModel() {
    return this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    });
  }

  private chatModel() {
    return this.client.getGenerativeModel({
      model: this.model,
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
    });
  }

  async lookupFood(input: string): Promise<FoodEstimate[]> {
    try {
      const lines = splitFoodLines(input);
      const prompt = lines.length > 1
        ? `${FOOD_LOOKUP_PROMPT}\n\nFoods (${lines.length} items, one JSON entry each):\n${lines.map((line, index) => `${index + 1}. ${line}`).join('\n')}`
        : `${FOOD_LOOKUP_PROMPT}\n\nFood: ${input.trim()}`;

      const result = await this.foodModel().generateContent(prompt);
      const parsed = foodLookupResponseSchema.parse(JSON.parse(result.response.text()));
      return parsed.items.map(normalizeEstimate);
    } catch (error) {
      throw wrapAiError(error, 'food lookup');
    }
  }

  async lookupFoodFromImage(image: { data: string; mimeType: string }, input = ''): Promise<FoodEstimate[]> {
    try {
      const prompt = `${FOOD_LOOKUP_PROMPT}

Estimate the visible food in this image. Use the optional user note only as context; do not invent foods that are not visible.
Optional user note: ${input.trim() || 'none'}`;

      const result = await this.foodModel().generateContent([
        { text: prompt },
        { inlineData: { mimeType: image.mimeType, data: image.data } }
      ]);
      const parsed = foodLookupResponseSchema.parse(JSON.parse(result.response.text()));
      return parsed.items.map(normalizeEstimate);
    } catch (error) {
      throw wrapAiError(error, 'food photo lookup');
    }
  }

  async lookupExercises(input: string): Promise<ExerciseEstimate[]> {
    const query = input.trim();
    const prompt = `${EXERCISE_LOOKUP_PROMPT}\n\nUser query: ${query}`;

    try {
      const result = await this.exerciseModel().generateContent(prompt);
      return parseExerciseLookupResponse(result.response.text());
    } catch (error) {
      try {
        const retry = await this.exerciseModel().generateContent(
          `${prompt}\n\nImportant: respond with valid JSON only and no more than 4 items.`
        );
        return parseExerciseLookupResponse(retry.response.text());
      } catch {
        try {
          return await new MockAiProvider().lookupExercises(query);
        } catch {
          throw wrapAiError(error, 'exercise lookup');
        }
      }
    }
  }

  async chat(messages: ChatMessage[], context: string, channel: ChatChannel = 'web'): Promise<string> {
    try {
      const channelInstruction = channel === 'sms' ? `\n\n${SMS_ASSISTANT_ADDENDUM}` : '';
      const contextTurn = [
        { role: 'user' as const, parts: [{ text: `Program data (JSON):\n${context}` }] },
        { role: 'model' as const, parts: [{ text: 'Understood. I will answer using this program data.' }] }
      ];
      const history = [
        ...contextTurn,
        ...messages.slice(0, -1).map((message) => ({
          role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: message.content }]
        }))
      ];
      const last = messages.at(-1);
      if (!last) throw new Error('Message required');

      const chat = this.chatModel().startChat({
        history,
        systemInstruction: {
          role: 'user',
          parts: [{ text: `${ASSISTANT_SYSTEM}${channelInstruction}` }]
        }
      });
      const result = await chat.sendMessage(last.content);
      return result.response.text().trim();
    } catch (error) {
      throw wrapAiError(error, 'chat');
    }
  }
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function roundConfidence(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
}

let cachedProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  if (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
    cachedProvider = new GeminiAiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
    return cachedProvider;
  }

  cachedProvider = new MockAiProvider();
  return cachedProvider;
}
