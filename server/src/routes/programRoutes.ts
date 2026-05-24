import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import { activateProgram, getProgram, listPrograms, updateProgramMetrics } from '../services/programService.js';
import { prisma } from '../db/prisma.js';

const programBody = z.object({ name: z.string().min(1), startDate: z.string(), targetEndDate: z.string().optional().nullable() });
const metricUpdateBody = z.array(
  z.object({
    id: z.string(),
    startValue: z.number().finite(),
    currentValue: z.number().finite(),
    goalValue: z.number().finite()
  })
);

export async function programRoutes(app: FastifyInstance) {
  app.get('/api/programs', { preHandler: requireAuth }, async (request) => listPrograms(request.appUser!));

  app.patch('/api/programs/:id/metrics', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = metricUpdateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid metric values. Use valid numbers for start, current, and goal.' });
    }
    try {
      return await updateProgramMetrics(request.appUser!, id, parsed.data);
    } catch (error) {
      request.log.error({ err: error }, 'Failed to update program metrics');
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Unable to update metrics' });
    }
  });

  app.get('/api/programs/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const program = await getProgram(request.appUser!, id);
    return program ?? reply.code(404).send({ error: 'Program not found' });
  });

  app.post('/api/programs', { preHandler: requireAuth }, async (request) => {
    const body = programBody.parse(request.body);
    return prisma.program.create({ data: { ...body, startDate: new Date(body.startDate), targetEndDate: body.targetEndDate ? new Date(body.targetEndDate) : null, userId: request.appUser!.id } });
  });

  app.patch('/api/programs/:id', { preHandler: requireAuth }, async (request) => {
    const { id } = request.params as { id: string };
    const body = programBody.partial().parse(request.body);
    return prisma.program.update({ where: { id }, data: { ...body, startDate: body.startDate ? new Date(body.startDate) : undefined, targetEndDate: body.targetEndDate ? new Date(body.targetEndDate) : undefined } });
  });

  app.post('/api/programs/:id/activate', { preHandler: requireAuth }, async (request) => {
    const { id } = request.params as { id: string };
    return activateProgram(request.appUser!.id, id);
  });
}
