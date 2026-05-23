import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { addMealItem, createMeal, deleteMealItem, getMealsForDate, markMealEatenAsPlanned, updateMealItem } from '../services/nutritionService.js';
import { prisma } from '../db/prisma.js';

export async function nutritionRoutes(app: FastifyInstance) {
  app.get('/api/daily-logs/:date/meals', { preHandler: requireAuth }, async (request) => getMealsForDate(request.appUser!.id, (request.params as { date: string }).date));
  app.post('/api/daily-logs/:date/meals', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ name: z.string(), mealNumber: z.number() }).parse(request.body);
    return createMeal(request.appUser!.id, (request.params as { date: string }).date, body);
  });
  app.patch('/api/meals/:id', { preHandler: requireAuth }, async (request) => prisma.meal.update({ where: { id: (request.params as { id: string }).id, userId: request.appUser!.id }, data: request.body as object }));
  app.post('/api/meals/:id/mark-eaten-as-planned', { preHandler: requireAuth }, async (request) => markMealEatenAsPlanned(request.appUser!.id, (request.params as { id: string }).id));
  app.post('/api/meals/:id/items', { preHandler: requireAuth }, async (request) => addMealItem(request.appUser!.id, (request.params as { id: string }).id, request.body as Record<string, unknown>));
  app.patch('/api/meal-items/:id', { preHandler: requireAuth }, async (request) => updateMealItem(request.appUser!.id, (request.params as { id: string }).id, request.body as Record<string, unknown>));
  app.delete('/api/meal-items/:id', { preHandler: requireAuth }, async (request) => deleteMealItem(request.appUser!.id, (request.params as { id: string }).id));
}
