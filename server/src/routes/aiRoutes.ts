import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { acceptFoodLookup, lookupFood } from '../services/foodLookupService.js';

export async function aiRoutes(app: FastifyInstance) {
  app.post('/api/ai/food-lookup', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ inputText: z.string().min(2) }).parse(request.body);
    return lookupFood(request.appUser!.id, body.inputText);
  });
  app.post('/api/ai/food-lookup/:lookupId/accept', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ mealId: z.string().optional(), type: z.enum(['PLANNED', 'ACTUAL']).optional() }).parse(request.body ?? {});
    return acceptFoodLookup(request.appUser!.id, (request.params as { lookupId: string }).lookupId, body.mealId, body.type);
  });
}
