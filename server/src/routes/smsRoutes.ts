import type { FastifyInstance } from 'fastify';
import { handleSms } from '../services/smsIntentService.js';

function normalizePhone(from: string) {
  let phone = from.replace(/^whatsapp:/i, '').trim();
  if (phone && !phone.startsWith('+')) {
    phone = `+${phone}`;
  }
  return phone;
}

export async function smsRoutes(app: FastifyInstance) {
  app.post('/api/sms/webhook', async (request, reply) => {
    const body = request.body as { From?: string; Body?: string; from?: string; body?: string };
    const phone = normalizePhone(body.From ?? body.from ?? '');
    const message = body.Body ?? body.body ?? '';
    const { response } = await handleSms(phone, message);
    reply.header('content-type', 'text/xml');
    return `<Response><Message>${response.replace(/[<>&]/g, '')}</Message></Response>`;
  });
}
