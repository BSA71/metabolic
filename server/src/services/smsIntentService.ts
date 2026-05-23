import { prisma } from '../db/prisma.js';
import { getTodayDashboard } from './dashboardService.js';
import { markDone } from './exerciseService.js';

export type SmsIntent = 'NEXT_MEAL' | 'CALORIE_STATUS' | 'PROTEIN_REMAINING' | 'EXERCISES_LEFT' | 'MARK_EXERCISE_DONE' | 'LOG_FOOD' | 'UNKNOWN';

export function parseSmsIntent(message: string): { intent: SmsIntent; foodText?: string; mealName?: string } {
  const text = message.toLowerCase();
  if (text.includes('meal') && text.includes('next')) return { intent: 'NEXT_MEAL' };
  if (text.includes('calorie')) return { intent: 'CALORIE_STATUS' };
  if (text.includes('protein')) return { intent: 'PROTEIN_REMAINING' };
  if (text.includes('exercise') || text.includes('workout')) return { intent: 'EXERCISES_LEFT' };
  if (text.includes('mark') && text.includes('done')) return { intent: 'MARK_EXERCISE_DONE' };
  const logMatch = message.match(/log\s+(.+?)\s+for\s+(.+)/i);
  if (logMatch) return { intent: 'LOG_FOOD', foodText: logMatch[1], mealName: logMatch[2] };
  return { intent: 'UNKNOWN' };
}

export async function handleSms(phone: string, message: string) {
  const user = await prisma.user.findFirst({ where: { phone } });
  const parsed = parseSmsIntent(message);
  const inbound = await prisma.smsMessage.create({ data: { phone, userId: user?.id, direction: 'INBOUND', message, intent: parsed.intent } });
  if (!user) {
    const response = 'We could not find a Metabolic user for this phone number.';
    await prisma.smsMessage.create({ data: { phone, direction: 'OUTBOUND', message: response, response, status: 'PROCESSED' } });
    return { inbound, response };
  }

  const dashboard = await getTodayDashboard(user.id);
  let response = 'I did not understand that yet. Try asking what meal is next, calories left, protein left, or exercises left.';
  if (parsed.intent === 'NEXT_MEAL') response = `Next meal: ${dashboard.summary?.nextMeal ?? 'No active meal found'}.`;
  if (parsed.intent === 'CALORIE_STATUS') response = `You have ${dashboard.summary?.caloriesRemaining ?? 0} calories remaining today.`;
  if (parsed.intent === 'PROTEIN_REMAINING') response = `You have ${dashboard.summary?.proteinRemaining ?? 0}g protein remaining today.`;
  if (parsed.intent === 'EXERCISES_LEFT') response = `You have ${dashboard.summary?.exercisesLeft ?? 0} exercises left today.`;
  if (parsed.intent === 'MARK_EXERCISE_DONE') {
    const next = dashboard.exercises.find((exercise) => exercise.status === 'PLANNED');
    response = next ? `Marked ${next.exercise.name} done.` : 'No planned exercises left today.';
    if (next) await markDone(user.id, next.id);
  }
  if (parsed.intent === 'LOG_FOOD') response = `I parsed "${parsed.foodText}" for ${parsed.mealName}. Food logging by SMS is queued for the AI parser.`;

  await prisma.smsMessage.update({ where: { id: inbound.id }, data: { status: 'PROCESSED', response } });
  await prisma.smsMessage.create({ data: { phone, userId: user.id, direction: 'OUTBOUND', message: response, response, status: 'PROCESSED' } });
  return { inbound, response };
}
