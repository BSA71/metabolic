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

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export interface AiProvider {
  lookupFood(input: string): Promise<FoodEstimate[]>;
  chat(messages: ChatMessage[], context: string): Promise<string>;
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

const FOOD_LOOKUP_PROMPT = `Estimate nutrition for each distinct food in the input.
Return JSON only: { "items": [ { "normalizedFoodName": string (include portion), "calories": number, "protein": grams, "carbs": grams, "fat": grams, "confidence": 0-1 }, ... ] }
Each food line must be its own item. Never combine multiple foods into one entry.`;

const ASSISTANT_SYSTEM = `You are a concise metabolic health coach assistant for the Metabolic app.
Answer using the user's live program data when relevant. Be practical and specific.
Keep responses short unless the user asks for detail. Use plain language, not markdown headers.
If data is missing, say what you would need rather than inventing numbers.`;

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

function splitFoodLines(input: string) {
  return input
    .split(/\n|,|;|•/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);
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

  async chat(messages: ChatMessage[], context: string): Promise<string> {
    const last = messages.at(-1)?.content.toLowerCase() ?? '';
    if (last.includes('meal')) return `Based on your data: ${context.slice(0, 200)}… (mock provider — set AI_PROVIDER=gemini to enable Gemini.)`;
    if (last.includes('calorie')) return 'Calorie guidance is available once Gemini is configured.';
    return 'AI assistant is running in mock mode. Set AI_PROVIDER=gemini and GEMINI_API_KEY in server/.env.';
  }
}

function wrapAiError(error: unknown, action: string): Error {
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

  async chat(messages: ChatMessage[], context: string): Promise<string> {
    try {
      const history = messages.slice(0, -1).map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      }));
      const last = messages.at(-1);
      if (!last) throw new Error('Message required');

      const chat = this.chatModel().startChat({
        history,
        systemInstruction: `${ASSISTANT_SYSTEM}\n\nUser context (JSON):\n${context}`
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
