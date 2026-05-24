import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/requireAuth.js';

export async function authRoutes(app: FastifyInstance) {
  app.get('/api/me', { preHandler: requireAuth }, async (request) => ({ user: request.appUser }));
}
