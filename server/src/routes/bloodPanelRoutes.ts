import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/requireAuth.js';
import {
  createBloodPanel,
  getBloodPanel,
  getBloodPanelReferenceRanges,
  getLatestBloodPanel,
  listBloodPanels,
  updateBloodPanel
} from '../services/bloodPanelService.js';

const optionalMetric = z.number().finite().nullable().optional();

const panelBody = z.object({
  labDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  labProvider: z.string().max(200).nullable().optional(),
  glucose: optionalMetric,
  totalCholesterol: optionalMetric,
  hdl: optionalMetric,
  ldl: optionalMetric,
  triglycerides: optionalMetric,
  hemoglobinA1c: optionalMetric,
  insulin: optionalMetric,
  testosterone: optionalMetric,
  notes: z.string().max(2000).nullable().optional()
});

export async function bloodPanelRoutes(app: FastifyInstance) {
  app.get('/api/blood-panels/reference-ranges', { preHandler: requireAuth }, async (request) => {
    const query = request.query as { gender?: string; age?: string };
    const age = query.age ? Number(query.age) : null;
    return getBloodPanelReferenceRanges(query.gender, Number.isFinite(age) ? age : null);
  });

  app.get('/api/blood-panels/:userId', { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      return await listBloodPanels(request.appUser!, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to list blood panels';
      return reply.code(message === 'Forbidden' ? 403 : 400).send({ error: message });
    }
  });

  app.get('/api/blood-panels/:userId/latest', { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const panel = await getLatestBloodPanel(request.appUser!, userId);
      return panel ?? reply.code(404).send({ error: 'No blood panels found' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load latest blood panel';
      return reply.code(message === 'Forbidden' ? 403 : 400).send({ error: message });
    }
  });

  app.get('/api/blood-panels/:userId/:panelId', { preHandler: requireAuth }, async (request, reply) => {
    const { userId, panelId } = request.params as { userId: string; panelId: string };
    try {
      return await getBloodPanel(request.appUser!, userId, panelId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load blood panel';
      const status = message === 'Forbidden' ? 403 : message === 'Blood panel not found' ? 404 : 400;
      return reply.code(status).send({ error: message });
    }
  });

  app.post('/api/blood-panels/:userId', { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const parsed = panelBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid blood panel payload.' });
    }
    try {
      return await createBloodPanel(request.appUser!, userId, parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create blood panel';
      return reply.code(message === 'Forbidden' ? 403 : 400).send({ error: message });
    }
  });

  app.put('/api/blood-panels/:userId/:panelId', { preHandler: requireAuth }, async (request, reply) => {
    const { userId, panelId } = request.params as { userId: string; panelId: string };
    const parsed = panelBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid blood panel payload.' });
    }
    try {
      return await updateBloodPanel(request.appUser!, userId, panelId, parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update blood panel';
      const status = message === 'Forbidden' ? 403 : message === 'Blood panel not found' ? 404 : 400;
      return reply.code(status).send({ error: message });
    }
  });
}
