import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/requireAuth.js';
import { requireRole } from '../auth/requireRole.js';
import { prisma } from '../db/prisma.js';

const adminOnly = [requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN'])];

export async function adminRoutes(app: FastifyInstance) {
  app.get('/api/admin/users', { preHandler: adminOnly }, async () => prisma.user.findMany({ orderBy: { createdAt: 'desc' } }));
  app.post('/api/admin/users', { preHandler: adminOnly }, async (request) => prisma.user.create({ data: request.body as any }));
  app.patch('/api/admin/users/:id', { preHandler: adminOnly }, async (request) => prisma.user.update({ where: { id: (request.params as { id: string }).id }, data: request.body as object }));
  app.get('/api/admin/food-review', { preHandler: adminOnly }, async () => prisma.food.findMany({ where: { aiGenerated: true, verified: false } }));
  app.get('/api/admin/programs', { preHandler: adminOnly }, async () => prisma.program.findMany({ include: { user: true, metrics: true } }));
  app.get('/api/admin/reports/overview', { preHandler: adminOnly }, async () => ({ users: await prisma.user.count(), activePrograms: await prisma.program.count({ where: { status: 'ACTIVE' } }), foodsPendingReview: await prisma.food.count({ where: { aiGenerated: true, verified: false } }) }));
}
