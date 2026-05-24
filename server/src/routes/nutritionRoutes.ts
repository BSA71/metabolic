import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { addMealItem, copyMealFromPreviousDay, createMeal, deleteMealItem, getMealsForDate, markMealEatenAsPlanned, setPlannedItemLogged, updateMealItem } from '../services/nutritionService.js';
import { ensureDailyLogByUserId } from '../services/dailyLogService.js';
import { prisma } from '../db/prisma.js';

export async function nutritionRoutes(app: FastifyInstance) {
  app.get('/api/daily-logs/:date/meals', { preHandler: requireAuth }, async (request) => getMealsForDate(request.appUser!.id, (request.params as { date: string }).date));
  app.post('/api/daily-logs/:date/ensure', { preHandler: requireAuth }, async (request) => {
    const date = (request.params as { date: string }).date;
    const log = await ensureDailyLogByUserId(request.appUser!.id, date);
    if (!log) {
      const error = new Error('No active program found. Visit the dashboard first or contact your coach.');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }
    return getMealsForDate(request.appUser!.id, date);
  });
  app.post('/api/daily-logs/:date/meals', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ name: z.string(), mealNumber: z.number() }).parse(request.body);
    return createMeal(request.appUser!.id, (request.params as { date: string }).date, body);
  });
  app.patch('/api/meals/:id', { preHandler: requireAuth }, async (request) => prisma.meal.update({ where: { id: (request.params as { id: string }).id, userId: request.appUser!.id }, data: request.body as object }));
  app.post('/api/meals/:id/mark-eaten-as-planned', { preHandler: requireAuth }, async (request) => markMealEatenAsPlanned(request.appUser!.id, (request.params as { id: string }).id));
  app.post('/api/meals/:id/copy-from-previous-day', { preHandler: requireAuth }, async (request) => copyMealFromPreviousDay(request.appUser!.id, (request.params as { id: string }).id));
  app.post('/api/meals/:id/items', { preHandler: requireAuth }, async (request) => addMealItem(request.appUser!.id, (request.params as { id: string }).id, request.body as Record<string, unknown>));
  app.patch('/api/meal-items/:id', { preHandler: requireAuth }, async (request) => updateMealItem(request.appUser!.id, (request.params as { id: string }).id, request.body as Record<string, unknown>));
  app.post('/api/meal-items/:id/set-logged', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ logged: z.boolean() }).parse(request.body);
    await setPlannedItemLogged(request.appUser!.id, (request.params as { id: string }).id, body.logged);
    return { ok: true };
  });
  app.delete('/api/meal-items/:id', { preHandler: requireAuth }, async (request) => deleteMealItem(request.appUser!.id, (request.params as { id: string }).id));
}
