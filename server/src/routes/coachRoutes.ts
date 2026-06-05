import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { FoodSource, Visibility } from '@prisma/client';
import { requireAuth } from '../auth/requireAuth.js';
import { requireRole } from '../auth/requireRole.js';
import {
  applyCoachExerciseTemplate,
  applyCoachNutritionTemplate,
  getCoachClientDashboard,
  getCoachClientEngagement,
  getCoachSettings,
  listCoachClients,
  updateCoachSettings
} from '../services/coachService.js';
import {
  addTemplateMealItem,
  cloneTemplate,
  createTemplate,
  createTemplateMeal,
  deleteTemplate,
  deleteTemplateMeal,
  deleteTemplateMealItem,
  getTemplateForActor,
  listTemplatesForActor,
  updateTemplate,
  updateTemplateMeal,
  updateTemplateMealItem
} from '../services/nutritionTemplateService.js';
import {
  addTemplateItem,
  cloneTemplate as cloneExerciseTemplate,
  createTemplate as createExerciseTemplate,
  deleteTemplate as deleteExerciseTemplate,
  deleteTemplateItem,
  getTemplateForActor as getExerciseTemplateForActor,
  listTemplatesForActor as listExerciseTemplatesForActor,
  reorderTemplateItems,
  updateTemplate as updateExerciseTemplate,
  updateTemplateItem
} from '../services/exerciseTemplateService.js';
import { prisma } from '../db/prisma.js';

const coachOnly = [requireAuth, requireRole(['COACH'])];

const templateCreateBody = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  calorieTarget: z.number().finite().min(0).optional(),
  proteinTarget: z.number().finite().min(0).optional(),
  carbTarget: z.number().finite().min(0).optional(),
  fatTarget: z.number().finite().min(0).optional()
});

const templateUpdateBody = templateCreateBody.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'At least one field is required'
});

const exerciseTemplateCreateBody = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  visibility: z.nativeEnum(Visibility).optional()
});

const exerciseTemplateUpdateBody = exerciseTemplateCreateBody.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'At least one field is required'
});

const templateCloneBody = z.object({ name: z.string().trim().min(1).optional() });
const applyTemplateBody = z.object({
  templateId: z.string().trim().min(1),
  setAsDefault: z.boolean().optional()
});
const templateMealCreateBody = z.object({
  name: z.string().trim().min(1),
  mealNumber: z.number().int().min(1),
  plannedTime: z.string().trim().nullable().optional()
});
const templateMealUpdateBody = templateMealCreateBody.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'At least one field is required'
});
const templateMealItemBody = z.object({
  foodId: z.string().trim().optional(),
  nameSnapshot: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  quantity: z.number().finite().positive().optional(),
  unit: z.string().trim().min(1).optional(),
  calories: z.number().finite().min(0).optional(),
  protein: z.number().finite().min(0).optional(),
  carbs: z.number().finite().min(0).optional(),
  fat: z.number().finite().min(0).optional()
});
const templateMealItemUpdateBody = templateMealItemBody.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'At least one field is required'
});
const templateExerciseItemBody = z.object({
  exerciseId: z.string().trim().min(1),
  sets: z.number().int().min(0).nullable().optional(),
  reps: z.number().int().min(0).nullable().optional(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  distance: z.number().finite().min(0).nullable().optional(),
  weight: z.number().finite().min(0).nullable().optional()
});
const templateExerciseItemUpdateBody = templateExerciseItemBody.omit({ exerciseId: true }).partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: 'At least one field is required' }
);
const exerciseTemplateReorderBody = z.object({ orderedIds: z.array(z.string()).min(1) });
const coachSettingsBody = z.object({
  coachCode: z.string().trim().max(20).nullable().optional(),
  defaultNutritionTemplateId: z.string().trim().min(1).nullable().optional(),
  defaultExerciseTemplateId: z.string().trim().min(1).nullable().optional()
});

export async function coachRoutes(app: FastifyInstance) {
  app.get('/api/coach/settings', { preHandler: coachOnly }, async (request) => getCoachSettings(request.appUser!.id));

  app.patch('/api/coach/settings', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = coachSettingsBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid settings' });
    try {
      return await updateCoachSettings(request.appUser!.id, parsed.data);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update settings' });
    }
  });

  app.get('/api/coach/users', { preHandler: coachOnly }, async (request) => listCoachClients(request.appUser!.id));

  app.get('/api/coach/users/:userId/dashboard', { preHandler: coachOnly }, async (request, reply) => {
    try {
      return await getCoachClientDashboard(request.appUser!, (request.params as { userId: string }).userId);
    } catch (error) {
      return reply.code(403).send({ error: error instanceof Error ? error.message : 'Unable to load client' });
    }
  });

  app.get('/api/coach/users/:userId/engagement', { preHandler: coachOnly }, async (request, reply) => {
    try {
      return await getCoachClientEngagement(request.appUser!, (request.params as { userId: string }).userId);
    } catch (error) {
      return reply.code(403).send({ error: error instanceof Error ? error.message : 'Unable to load engagement' });
    }
  });

  app.post('/api/coach/users/:userId/daily-logs/:date/apply-template', { preHandler: coachOnly }, async (request, reply) => {
    const { userId, date } = request.params as { userId: string; date: string };
    const parsed = applyTemplateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid template' });
    try {
      return await applyCoachNutritionTemplate(request.appUser!, userId, date, parsed.data.templateId, {
        setAsDefault: parsed.data.setAsDefault
      });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to apply template' });
    }
  });

  app.post('/api/coach/users/:userId/daily-logs/:date/apply-exercise-template', { preHandler: coachOnly }, async (request, reply) => {
    const { userId, date } = request.params as { userId: string; date: string };
    const parsed = applyTemplateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid template' });
    try {
      return await applyCoachExerciseTemplate(request.appUser!, userId, date, parsed.data.templateId, {
        setAsDefault: parsed.data.setAsDefault
      });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to apply template' });
    }
  });

  app.get('/api/coach/nutrition-templates', { preHandler: coachOnly }, async (request) =>
    listTemplatesForActor(request.appUser!)
  );
  app.get('/api/coach/nutrition-templates/:id', { preHandler: coachOnly }, async (request, reply) => {
    try {
      return await getTemplateForActor((request.params as { id: string }).id, request.appUser!);
    } catch {
      return reply.code(404).send({ error: 'Template not found' });
    }
  });
  app.post('/api/coach/nutrition-templates', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateCreateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid template' });
    try {
      return await createTemplate({ ...parsed.data, visibility: parsed.data.visibility ?? Visibility.USER, createdById: request.appUser!.id });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to create template' });
    }
  });
  app.patch('/api/coach/nutrition-templates/:id', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateUpdateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid template' });
    try {
      return await updateTemplate((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update template' });
    }
  });
  app.delete('/api/coach/nutrition-templates/:id', { preHandler: coachOnly }, async (request, reply) => {
    try {
      await deleteTemplate((request.params as { id: string }).id, request.appUser!);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to delete template' });
    }
  });
  app.post('/api/coach/nutrition-templates/:id/clone', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateCloneBody.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid clone request' });
    try {
      return await cloneTemplate((request.params as { id: string }).id, {
        name: parsed.data.name,
        createdById: request.appUser!.id
      });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to clone template' });
    }
  });
  app.post('/api/coach/nutrition-templates/:id/meals', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateMealCreateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid meal' });
    try {
      return await createTemplateMeal((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to add meal' });
    }
  });
  app.patch('/api/coach/nutrition-template-meals/:id', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateMealUpdateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid meal' });
    try {
      return await updateTemplateMeal((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update meal' });
    }
  });
  app.delete('/api/coach/nutrition-template-meals/:id', { preHandler: coachOnly }, async (request, reply) => {
    try {
      return await deleteTemplateMeal((request.params as { id: string }).id, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to delete meal' });
    }
  });
  app.post('/api/coach/nutrition-template-meals/:id/items', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateMealItemBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid item' });
    try {
      return await addTemplateMealItem((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to add item' });
    }
  });
  app.patch('/api/coach/nutrition-template-meal-items/:id', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateMealItemUpdateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid item' });
    try {
      return await updateTemplateMealItem((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update item' });
    }
  });
  app.delete('/api/coach/nutrition-template-meal-items/:id', { preHandler: coachOnly }, async (request, reply) => {
    try {
      return await deleteTemplateMealItem((request.params as { id: string }).id, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to delete item' });
    }
  });

  app.get('/api/coach/exercise-templates', { preHandler: coachOnly }, async (request) =>
    listExerciseTemplatesForActor(request.appUser!)
  );
  app.get('/api/coach/exercise-templates/:id', { preHandler: coachOnly }, async (request, reply) => {
    try {
      return await getExerciseTemplateForActor((request.params as { id: string }).id, request.appUser!);
    } catch {
      return reply.code(404).send({ error: 'Template not found' });
    }
  });
  app.post('/api/coach/exercise-templates', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = exerciseTemplateCreateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid template' });
    try {
      return await createExerciseTemplate({ ...parsed.data, visibility: parsed.data.visibility ?? Visibility.USER, createdById: request.appUser!.id });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to create template' });
    }
  });
  app.patch('/api/coach/exercise-templates/:id', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = exerciseTemplateUpdateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid template' });
    try {
      return await updateExerciseTemplate((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update template' });
    }
  });
  app.delete('/api/coach/exercise-templates/:id', { preHandler: coachOnly }, async (request, reply) => {
    try {
      await deleteExerciseTemplate((request.params as { id: string }).id, request.appUser!);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to delete template' });
    }
  });
  app.post('/api/coach/exercise-templates/:id/clone', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateCloneBody.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid clone request' });
    try {
      return await cloneExerciseTemplate((request.params as { id: string }).id, {
        name: parsed.data.name,
        createdById: request.appUser!.id
      });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to clone template' });
    }
  });
  app.post('/api/coach/exercise-templates/:id/items', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateExerciseItemBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid exercise' });
    try {
      return await addTemplateItem((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to add exercise' });
    }
  });
  app.patch('/api/coach/exercise-template-items/:id', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = templateExerciseItemUpdateBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid exercise' });
    try {
      return await updateTemplateItem((request.params as { id: string }).id, parsed.data, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update exercise' });
    }
  });
  app.delete('/api/coach/exercise-template-items/:id', { preHandler: coachOnly }, async (request, reply) => {
    try {
      return await deleteTemplateItem((request.params as { id: string }).id, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to delete exercise' });
    }
  });
  app.post('/api/coach/exercise-templates/:id/reorder', { preHandler: coachOnly }, async (request, reply) => {
    const parsed = exerciseTemplateReorderBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid reorder' });
    try {
      return await reorderTemplateItems((request.params as { id: string }).id, parsed.data.orderedIds, request.appUser!);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to reorder exercises' });
    }
  });

  app.get('/api/coach/foods', { preHandler: coachOnly }, async () =>
    prisma.food.findMany({
      where: { OR: [{ visibility: Visibility.GLOBAL }, { verified: true }, { source: FoodSource.VERIFIED }] },
      orderBy: { name: 'asc' }
    })
  );
}
