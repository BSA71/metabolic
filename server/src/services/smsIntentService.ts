import { SmsDirection } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { getTodayDashboard } from './dashboardService.js';
import { markAllPlannedExercisesDone, markDone } from './exerciseService.js';
import { markMealEatenAsPlanned } from './nutritionService.js';
import { chatWithSmsAssistant } from './assistantService.js';
import { toDateKey } from '../utils/dates.js';
import type { ChatMessage } from './aiService.js';
import { lookupFoodFromImage, type FoodLookupResult } from './foodLookupService.js';
import { env } from '../config/env.js';

export type SmsIntent =
  | 'MARK_ALL_EXERCISES_DONE'
  | 'MARK_EXERCISE_DONE'
  | 'MARK_MEAL_COMPLETE'
  | 'LOG_FOOD'
  | 'FOOD_PHOTO'
  | 'AI_CHAT';

type SmsAction =
  | { intent: 'MARK_ALL_EXERCISES_DONE' }
  | { intent: 'MARK_EXERCISE_DONE'; exerciseName?: string }
  | { intent: 'MARK_MEAL_COMPLETE'; mealName?: string }
  | { intent: 'LOG_FOOD'; foodText: string; mealName: string }
  | { intent: null };

const MEAL_NAME_PATTERN = /\b(breakfast|lunch|dinner|snack|brunch)\b/i;
const EXERCISE_COMPLETE_PATTERN = /\b(done|complete|completed|finished|check(?:ed)?\s+off)\b/i;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SMS_IMAGE_BYTES = 10 * 1024 * 1024;

type SmsMedia = {
  url: string;
  mimeType?: string;
};

function wantsMarkMealComplete(text: string) {
  if (/\bmeal\b/i.test(text) && /\b(complete|completed|done|eaten|as planned)\b/i.test(text)) return true;
  if (/\bmark\b.*\b(breakfast|lunch|dinner|snack|brunch)\b/i.test(text)) return true;
  if (/\b(ate|finished|completed|done with)\b.*\b(this )?(my )?(breakfast|lunch|dinner|snack|meal)\b/i.test(text)) return true;
  return false;
}

function parseMealName(text: string) {
  const match = text.match(MEAL_NAME_PATTERN);
  return match?.[1];
}

function wantsMarkAllExercises(text: string) {
  if (/\bmark\b.*\b(all|every)\b.*\b(exercise|workout)/i.test(text)) return true;
  if (/\bmark\b.*\b(exercise )?list\b.*\b(as )?(done|complete)/i.test(text)) return true;
  if (/\b(all|every)\b.*\b(exercise|workout)s?\b.*\b(done|complete|finished)/i.test(text)) return true;
  if (/\b(i'?ve?|i have|i)\b.*\b(done|finished|completed)\b.*\b(all|every)\b.*\b(exercise|workout)/i.test(text)) return true;
  if (/\b(i'?ve?|i have|i)\b.*\b(done|finished|completed)\b.*\b(all of )?(the )?(my )?(exercise|workout)/i.test(text)) return true;
  return false;
}

function parseExerciseNameFromMarkDone(text: string) {
  const markMatch = text.match(/\bmark\s+(.+?)\s+(?:as\s+)?(?:done|complete(?:d)?|finished)\b/i);
  if (markMatch) {
    const name = markMatch[1].trim();
    if (!/^(all|every|exercise|workout|the|my|this|it)$/i.test(name) && !/^(all|every)\b/i.test(name)) {
      return name;
    }
  }

  if (/\bmark\s+(?:as\s+)?(?:done|complete(?:d)?|finished)\b/i.test(text)) return undefined;

  const finishedMatch = text.match(/\b(?:finished|completed|did)\s+(?:my\s+|the\s+)?(.+?)(?:\s+(?:exercise|workout))?\.?$/i);
  if (finishedMatch) return finishedMatch[1].trim();

  const namedMatch = text.match(/\b(.+?)\s+(?:is\s+)?(?:done|complete(?:d)?|finished)\b/i);
  if (namedMatch) {
    const name = namedMatch[1].trim();
    if (!/^(i|it|that|this|all|everything|mark)$/i.test(name) && !MEAL_NAME_PATTERN.test(name)) {
      return name;
    }
  }

  const checkOffMatch = text.match(/\bcheck(?:ed)?\s+off\s+(.+?)(?:\s+(?:exercise|workout))?\.?$/i);
  if (checkOffMatch) return checkOffMatch[1].trim();

  return undefined;
}

function wantsMarkExerciseDone(text: string) {
  if (wantsMarkMealComplete(text)) return false;
  if (/\bmeal\b/i.test(text) && !/\b(exercise|workout|walk|run|lift)\b/i.test(text)) return false;

  if (/\bmark\b/i.test(text) && EXERCISE_COMPLETE_PATTERN.test(text)) {
    if (wantsMarkAllExercises(text)) return false;
    return true;
  }

  if (/\b(finished|completed|did)\b/i.test(text) && !MEAL_NAME_PATTERN.test(text) && !/\bmeal\b/i.test(text)) {
    return true;
  }

  const namedCompleteMatch = text.match(/\b([a-z][\w\s]{2,}?)\s+(?:is\s+)?(?:done|complete(?:d)?|finished)\b/i);
  if (namedCompleteMatch && !MEAL_NAME_PATTERN.test(text) && !/\bmeal\b/i.test(text)) {
    const prefix = namedCompleteMatch[1].trim();
    if (!/^(i|it|that|this|all|everything|not|you|are|we|they|am|im|i'm)$/i.test(prefix)) {
      return true;
    }
  }

  return false;
}

/** Detects SMS actions that write to the database. Everything else goes to AI. */
export function parseSmsAction(message: string): SmsAction {
  const text = message.toLowerCase().trim();

  const logMatch = message.match(/log\s+(.+?)\s+for\s+(.+)/i);
  if (logMatch) return { intent: 'LOG_FOOD', foodText: logMatch[1], mealName: logMatch[2] };

  if (wantsMarkAllExercises(text)) return { intent: 'MARK_ALL_EXERCISES_DONE' };

  if (wantsMarkMealComplete(text)) {
    return { intent: 'MARK_MEAL_COMPLETE', mealName: parseMealName(text) };
  }

  if (wantsMarkExerciseDone(text)) {
    return { intent: 'MARK_EXERCISE_DONE', exerciseName: parseExerciseNameFromMarkDone(text) };
  }

  return { intent: null };
}

async function loadSmsChatHistory(userId: string, phone: string, limit = 8): Promise<ChatMessage[]> {
  const rows = await prisma.smsMessage.findMany({
    where: { userId, phone },
    orderBy: { createdAt: 'desc' },
    take: limit * 2
  });

  const messages: ChatMessage[] = [];
  for (const row of rows.reverse()) {
    if (row.direction === SmsDirection.INBOUND) {
      messages.push({ role: 'user', content: row.message });
    } else if (row.response) {
      messages.push({ role: 'assistant', content: row.response });
    }
  }
  return messages;
}

function findPlannedExercise(
  exercises: Awaited<ReturnType<typeof getTodayDashboard>>['exercises'],
  exerciseName?: string
) {
  const planned = exercises.filter((exercise) => exercise.status === 'PLANNED');
  if (!exerciseName) return planned[0];

  const query = exerciseName.toLowerCase();
  return planned.find((entry) => entry.exercise.name.toLowerCase().includes(query));
}

function findMealToMark(
  meals: Awaited<ReturnType<typeof getTodayDashboard>>['meals'],
  mealName?: string
) {
  const incomplete = meals
    .filter((meal) => !['EATEN_AS_PLANNED', 'SKIPPED', 'MISSED'].includes(meal.status))
    .sort((a, b) => a.mealNumber - b.mealNumber);
  if (!mealName) return incomplete[0];

  const query = mealName.toLowerCase();
  return incomplete.find((meal) => meal.name.toLowerCase().includes(query));
}

function pickEncouragement() {
  const lines = [
    'Way to go on sticking to the plan!',
    'Nice work — keep that momentum going.',
    'That is a win. Stack another one tomorrow.',
    'Love the consistency. Keep showing up.'
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

async function handleWriteAction(userId: string, action: Exclude<SmsAction, { intent: null }>) {
  const dashboard = await getTodayDashboard(userId);
  const todayKey = dashboard.dailyLog ? toDateKey(dashboard.dailyLog.date) : toDateKey(new Date());

  if (action.intent === 'MARK_ALL_EXERCISES_DONE') {
    const completed = await markAllPlannedExercisesDone(userId, todayKey);
    if (!completed.length) return 'No planned exercises left today.';
    return `Marked done: ${completed.join(', ')}. ${pickEncouragement()}`;
  }

  if (action.intent === 'MARK_EXERCISE_DONE') {
    const next = findPlannedExercise(dashboard.exercises, action.exerciseName);
    if (!next) {
      return action.exerciseName
        ? `I could not find a planned exercise matching "${action.exerciseName}".`
        : 'No planned exercises left today.';
    }
    await markDone(userId, next.id);
    const remaining = dashboard.exercises.filter((exercise) => exercise.status === 'PLANNED').length - 1;
    const cheer = remaining === 0 ? pickEncouragement() : 'One down — keep going.';
    return `Marked ${next.exercise.name} done. ${cheer}`;
  }

  if (action.intent === 'MARK_MEAL_COMPLETE') {
    const meal = findMealToMark(dashboard.meals, action.mealName);
    if (!meal) {
      return action.mealName
        ? `I could not find an open meal matching "${action.mealName}".`
        : 'No meals left to mark complete today.';
    }
    await markMealEatenAsPlanned(userId, meal.id);
    const updated = await getTodayDashboard(userId);
    const nextMeal = updated.meals.find((entry) => !['EATEN_AS_PLANNED', 'SKIPPED', 'MISSED'].includes(entry.status));
    const nextPart = nextMeal
      ? ` Next up: ${nextMeal.name}${nextMeal.plannedTime ? ` at ${nextMeal.plannedTime}` : ''}.`
      : ' All meals are complete for today.';
    return `Got it — ${meal.name} marked as eaten as planned. You have ${updated.summary?.caloriesRemaining ?? 0} calories and ${updated.summary?.proteinRemaining ?? 0}g protein remaining.${nextPart} ${pickEncouragement()}`;
  }

  return `I parsed "${action.foodText}" for ${action.mealName}. Food logging by SMS is coming soon — use the app for now.`;
}

async function handleAiChat(userId: string, phone: string, message: string) {
  const priorMessages = await loadSmsChatHistory(userId, phone);
  const withoutCurrent = priorMessages.at(-1)?.role === 'user' ? priorMessages.slice(0, -1) : priorMessages;
  const messages: ChatMessage[] = [...withoutCurrent, { role: 'user', content: message }];
  const { reply } = await chatWithSmsAssistant(userId, messages);
  return reply;
}

async function downloadSmsImage(media: SmsMedia) {
  const headers: HeadersInit = {};
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    const token = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
    headers.Authorization = `Basic ${token}`;
  }
  const response = await fetch(media.url, { headers });
  if (!response.ok) {
    throw new Error('Could not download the WhatsApp photo.');
  }

  const mimeType = (media.mimeType || response.headers.get('content-type') || '').split(';')[0]!.trim().toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new Error('Send a JPEG, PNG, or WebP food photo.');
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_SMS_IMAGE_BYTES) {
    throw new Error('Image must be 10 MB or smaller.');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_SMS_IMAGE_BYTES) {
    throw new Error('Image must be 10 MB or smaller.');
  }

  return { data: buffer.toString('base64'), mimeType };
}

function summarizeFoodPhotoEstimate(result: FoodLookupResult) {
  const estimates = result.items
    .filter((item) => item.source === 'ai')
    .map((item) => item.estimate);

  if (!estimates.length) {
    return 'I could not estimate the food from that photo. Try sending a clearer plate photo with the whole meal visible.';
  }

  const totals = estimates.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const foodList = estimates.map((item) => item.normalizedFoodName).join(', ');

  return `Estimated from your plate: ${Math.round(totals.calories)} cal, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat. I see: ${foodList}. Photo estimates are approximate.`;
}

async function handleFoodPhoto(userId: string, media: SmsMedia, message: string) {
  const image = await downloadSmsImage(media);
  const result = await lookupFoodFromImage(userId, image, message);
  return summarizeFoodPhotoEstimate(result);
}

export async function handleSms(phone: string, message: string, media?: SmsMedia) {
  const user = await prisma.user.findFirst({ where: { phone } });
  const action = parseSmsAction(message);
  const isFoodPhoto = Boolean(media);
  const intent = isFoodPhoto ? 'FOOD_PHOTO' : action.intent ?? 'AI_CHAT';
  const inboundMessage = message.trim() || (isFoodPhoto ? '[WhatsApp image]' : '');

  const inbound = await prisma.smsMessage.create({
    data: { phone, userId: user?.id, direction: 'INBOUND', message: inboundMessage, intent }
  });

  if (!user) {
    const response = 'We could not find a Metabolic user for this phone number.';
    await prisma.smsMessage.create({ data: { phone, direction: 'OUTBOUND', message: response, response, status: 'PROCESSED' } });
    return { inbound, response };
  }

  let response: string;
  try {
    if (media) {
      response = await handleFoodPhoto(user.id, media, message);
    } else {
      response = action.intent ? await handleWriteAction(user.id, action) : await handleAiChat(user.id, phone, message);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Assistant unavailable';
    response = `Sorry, I could not answer that right now. ${detail}`;
  }

  await prisma.smsMessage.update({ where: { id: inbound.id }, data: { status: 'PROCESSED', response } });
  await prisma.smsMessage.create({
    data: { phone, userId: user.id, direction: 'OUTBOUND', message: response, response, status: 'PROCESSED' }
  });
  return { inbound, response };
}
