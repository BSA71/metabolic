import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { getExercises, getScheduledExercises, markDone, markScheduledExercise } from '../services/exerciseService.js';
import { prisma } from '../db/prisma.js';

export async function exerciseRoutes(app: FastifyInstance) {
  app.get('/api/exercises', { preHandler: requireAuth }, async () => getExercises());
  app.post('/api/exercises', { preHandler: requireAuth }, async (request) => {
    const body = z.object({ name: z.string(), category: z.string().optional(), description: z.string().optional() }).parse(request.body);
    return prisma.exercise.create({ data: body });
  });
  app.get('/api/daily-logs/:date/exercises', { preHandler: requireAuth }, async (request) => getScheduledExercises(request.appUser!.id, (request.params as { date: string }).date));
  app.post('/api/scheduled-exercises/:id/mark-done', { preHandler: requireAuth }, async (request) => markDone(request.appUser!.id, (request.params as { id: string }).id));
  app.post('/api/scheduled-exercises/:id/skip', { preHandler: requireAuth }, async (request) => markScheduledExercise(request.appUser!.id, (request.params as { id: string }).id, 'SKIPPED'));
}
