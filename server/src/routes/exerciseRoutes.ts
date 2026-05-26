import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import {
  copyExercisesFromDate,
  copyExercisesFromPreviousDay,
  createScheduledExercise,
  deleteScheduledExercise,
  ensureExercisesForDate,
  getExercises,
  getScheduledExercises,
  markDone,
  markScheduledExercise,
  updateScheduledExercise
} from '../services/exerciseService.js';
import { prisma } from '../db/prisma.js';

const optionalNumber = z.union([z.number(), z.null()]).optional();
const optionalString = z.union([z.string(), z.null()]).optional();

const scheduleBodySchema = z.object({
  exerciseId: z.string(),
  sets: optionalNumber,
  reps: optionalNumber,
  durationMinutes: optionalNumber,
  distance: optionalNumber,
  weight: optionalNumber,
  description: optionalString,
  category: optionalString,
  bodyPart: optionalString
});

const updateScheduleSchema = z.object({
  sets: optionalNumber,
  reps: optionalNumber,
  durationMinutes: optionalNumber,
  distance: optionalNumber,
  weight: optionalNumber,
  description: optionalString,
  category: optionalString,
  bodyPart: optionalString
});

export async function exerciseRoutes(app: FastifyInstance) {
  app.get('/api/exercises', { preHandler: requireAuth }, async () => getExercises());
  app.post('/api/exercises', { preHandler: requireAuth }, async (request) => {
    const body = z.object({
      name: z.string(),
      category: z.string().optional(),
      bodyPart: z.string().optional(),
      description: z.string().optional()
    }).parse(request.body);
    return prisma.exercise.create({ data: body });
  });

  app.get('/api/daily-logs/:date/exercises', { preHandler: requireAuth }, async (request) =>
    getScheduledExercises(request.appUser!.id, (request.params as { date: string }).date)
  );
  app.post('/api/daily-logs/:date/exercises/ensure', { preHandler: requireAuth }, async (request) => {
    const date = (request.params as { date: string }).date;
    const exercises = await ensureExercisesForDate(request.appUser!.id, date);
    if (exercises === null) {
      const error = new Error('No active program found.');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }
    return exercises;
  });
  app.post('/api/daily-logs/:date/exercises', { preHandler: requireAuth }, async (request) => {
    const date = (request.params as { date: string }).date;
    const body = scheduleBodySchema.parse(request.body);
    return createScheduledExercise(request.appUser!.id, date, body);
  });
  app.post('/api/daily-logs/:date/exercises/copy-from-previous-day', { preHandler: requireAuth }, async (request) =>
    copyExercisesFromPreviousDay(request.appUser!.id, (request.params as { date: string }).date)
  );
  app.post('/api/daily-logs/:date/exercises/copy-from-date', { preHandler: requireAuth }, async (request) => {
    const date = (request.params as { date: string }).date;
    const body = z.object({ sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(request.body);
    return copyExercisesFromDate(request.appUser!.id, date, body.sourceDate, { replace: true });
  });

  app.patch('/api/scheduled-exercises/:id', { preHandler: requireAuth }, async (request) => {
    const body = updateScheduleSchema.parse(request.body);
    return updateScheduledExercise(request.appUser!.id, (request.params as { id: string }).id, body);
  });
  app.delete('/api/scheduled-exercises/:id', { preHandler: requireAuth }, async (request) =>
    deleteScheduledExercise(request.appUser!.id, (request.params as { id: string }).id)
  );
  app.post('/api/scheduled-exercises/:id/mark-done', { preHandler: requireAuth }, async (request) =>
    markDone(request.appUser!.id, (request.params as { id: string }).id)
  );
  app.post('/api/scheduled-exercises/:id/skip', { preHandler: requireAuth }, async (request) =>
    markScheduledExercise(request.appUser!.id, (request.params as { id: string }).id, 'SKIPPED')
  );
}
