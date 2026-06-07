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
    const body = request.body as {
      From?: string;
      Body?: string;
      NumMedia?: string;
      MediaUrl0?: string;
      MediaContentType0?: string;
      from?: string;
      body?: string;
      numMedia?: string;
      mediaUrl0?: string;
      mediaContentType0?: string;
    };
    const phone = normalizePhone(body.From ?? body.from ?? '');
    const message = body.Body ?? body.body ?? '';
    const mediaUrl = body.MediaUrl0 ?? body.mediaUrl0;
    const mediaContentType = body.MediaContentType0 ?? body.mediaContentType0;
    const numMedia = Number(body.NumMedia ?? body.numMedia ?? (mediaUrl ? 1 : 0));
    const media = numMedia > 0 && mediaUrl ? { url: mediaUrl, mimeType: mediaContentType } : undefined;
    const { response } = await handleSms(phone, message, media);
    reply.header('content-type', 'text/xml');
    return `<Response><Message>${response.replace(/[<>&]/g, '')}</Message></Response>`;
  });
}
