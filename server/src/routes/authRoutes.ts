import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { getUserDemographics, updateUserDemographics } from '../services/userProfileService.js';

const demographicsBody = z.object({
  gender: z.enum(['m', 'f', 'male', 'female']).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
});

export async function authRoutes(app: FastifyInstance) {
  app.get('/api/me', { preHandler: requireAuth }, async (request) => ({ user: request.appUser }));

  app.get('/api/users/:userId/demographics', { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      return await getUserDemographics(request.appUser!, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load profile';
      return reply.code(message === 'Forbidden' ? 403 : 400).send({ error: message });
    }
  });

  app.patch('/api/users/:userId/demographics', { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const parsed = demographicsBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Enter a valid gender and birth date.' });
    }
    try {
      return await updateUserDemographics(request.appUser!, userId, parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update profile';
      return reply.code(message === 'Forbidden' ? 403 : 400).send({ error: message });
    }
  });
}
