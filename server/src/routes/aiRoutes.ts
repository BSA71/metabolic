import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { acceptFoodLookup, acceptFoodLookups, lookupFood } from '../services/foodLookupService.js';
import { chatWithAssistant } from '../services/assistantService.js';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000)
});

export async function aiRoutes(app: FastifyInstance) {
  app.post('/api/ai/food-lookup', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ inputText: z.string().min(2) }).parse(request.body);
    return lookupFood(request.appUser!.id, body.inputText);
  });
  app.post('/api/ai/food-lookup/accept-batch', { preHandler: requireAuth }, async (request) => {
    const body = z.object({
      lookupIds: z.array(z.string()).min(1),
      mealId: z.string().optional(),
      type: z.enum(['PLANNED', 'ACTUAL']).optional()
    }).parse(request.body);
    return acceptFoodLookups(request.appUser!.id, body.lookupIds, body.mealId, body.type);
  });
  app.post('/api/ai/food-lookup/:lookupId/accept', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ mealId: z.string().optional(), type: z.enum(['PLANNED', 'ACTUAL']).optional() }).parse(request.body ?? {});
    return acceptFoodLookup(request.appUser!.id, (request.params as { lookupId: string }).lookupId, body.mealId, body.type);
  });
  app.post('/api/ai/chat', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ messages: z.array(chatMessageSchema).min(1).max(20) }).parse(request.body);
    return chatWithAssistant(request.appUser!.id, body.messages);
  });
}
