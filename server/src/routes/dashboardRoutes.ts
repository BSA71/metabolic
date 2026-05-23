import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/requireAuth.js';
import { getTodayDashboard } from '../services/dashboardService.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/api/dashboard/today', { preHandler: requireAuth }, async (request) => getTodayDashboard(request.appUser!.id));
}
