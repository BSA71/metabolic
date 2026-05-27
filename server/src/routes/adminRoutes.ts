import type { FastifyInstance } from 'fastify';
import { FoodSource, Role, UserStatus, Visibility } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { requireRole } from '../auth/requireRole.js';
import { prisma } from '../db/prisma.js';
import { listAdminFoods, listAdminFoodReviewQueue, listAdminUsers, serializeAdminFood, serializeReviewFood, approveAdminFood, rejectAdminFood, updateAdminFood, updateAdminUser } from '../services/adminService.js';

const adminOnly = [requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN'])];

const userUpdateBody = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().nullable().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional()
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

const foodUpdateBody = z
  .object({
    name: z.string().trim().min(1).optional(),
    brand: z.string().trim().nullable().optional(),
    servingSize: z.number().finite().positive().optional(),
    servingUnit: z.string().trim().min(1).optional(),
    calories: z.number().finite().min(0).optional(),
    protein: z.number().finite().min(0).optional(),
    carbs: z.number().finite().min(0).optional(),
    fat: z.number().finite().min(0).optional(),
    source: z.nativeEnum(FoodSource).optional(),
    visibility: z.nativeEnum(Visibility).optional(),
    verified: z.boolean().optional()
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

const foodApproveBody = z.object({
  name: z.string().trim().min(1).optional(),
  brand: z.string().trim().nullable().optional(),
  servingSize: z.number().finite().positive().optional(),
  servingUnit: z.string().trim().min(1).optional(),
  calories: z.number().finite().min(0).optional(),
  protein: z.number().finite().min(0).optional(),
  carbs: z.number().finite().min(0).optional(),
  fat: z.number().finite().min(0).optional(),
  visibility: z.nativeEnum(Visibility).optional()
});

export async function adminRoutes(app: FastifyInstance) {
  app.get('/api/admin/users', { preHandler: adminOnly }, async () => listAdminUsers());

  app.post('/api/admin/users', { preHandler: adminOnly }, async (request) => prisma.user.create({ data: request.body as any }));

  app.patch('/api/admin/users/:id', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = userUpdateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid user update' });
    }

    try {
      return await updateAdminUser(id, parsed.data);
    } catch (error) {
      request.log.error({ err: error }, 'Failed to update user');
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update user' });
    }
  });

  app.get('/api/admin/foods', { preHandler: adminOnly }, async () => {
    const foods = await listAdminFoods();
    return foods.map(serializeAdminFood);
  });

  app.patch('/api/admin/foods/:id', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = foodUpdateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid food update' });
    }

    try {
      const food = await updateAdminFood(id, parsed.data);
      return serializeAdminFood(food);
    } catch (error) {
      request.log.error({ err: error }, 'Failed to update food');
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update food' });
    }
  });

  app.get('/api/admin/food-review', { preHandler: adminOnly }, async () => {
    const foods = await listAdminFoodReviewQueue();
    return foods.map(serializeReviewFood);
  });

  app.post('/api/admin/food-review/:id/approve', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = foodApproveBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid food update' });
    }

    try {
      const food = await approveAdminFood(id, parsed.data);
      return serializeAdminFood(food);
    } catch (error) {
      request.log.error({ err: error }, 'Failed to approve food');
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to approve food' });
    }
  });

  app.delete('/api/admin/food-review/:id', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await rejectAdminFood(id);
      return reply.code(204).send();
    } catch (error) {
      request.log.error({ err: error }, 'Failed to reject food');
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to reject food' });
    }
  });

  app.get('/api/admin/programs', { preHandler: adminOnly }, async () => prisma.program.findMany({ include: { user: true, metrics: true } }));
  app.get('/api/admin/reports/overview', { preHandler: adminOnly }, async () => ({
    users: await prisma.user.count(),
    activePrograms: await prisma.program.count({ where: { status: 'ACTIVE' } }),
    foodsPendingReview: await prisma.food.count({ where: { aiGenerated: true, verified: false } })
  }));
}
