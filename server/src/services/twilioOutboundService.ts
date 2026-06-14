import { env } from '../config/env.js';
import { normalizePhone, phoneDigits } from '../utils/phone.js';

export function isTwilioConfigured() {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}

export function usesWhatsAppChannel() {
  const from = env.TWILIO_PHONE_NUMBER.trim().toLowerCase();
  if (from.startsWith('sms:')) return false;
  return true;
}

export function twilioSenderPhone() {
  return normalizePhone(env.TWILIO_PHONE_NUMBER);
}

export function isTwilioSenderPhone(phone: string) {
  return phoneDigits(phone) === phoneDigits(env.TWILIO_PHONE_NUMBER);
}

function twilioFromAddress() {
  const from = env.TWILIO_PHONE_NUMBER.trim();
  const lower = from.toLowerCase();
  if (lower.startsWith('whatsapp:') || lower.startsWith('sms:')) return from;
  return `whatsapp:${normalizePhone(from)}`;
}

function twilioToAddress(phone: string) {
  const normalized = normalizePhone(phone);
  if (usesWhatsAppChannel()) return `whatsapp:${normalized}`;
  return normalized;
}

export function validateOutboundRecipient(phone: string) {
  if (isTwilioSenderPhone(phone)) {
    throw new Error(
      `The recipient number cannot be the same as your Twilio sender (${twilioSenderPhone()}). Use the client's personal mobile number.`
    );
  }
}

function formatTwilioSendError(detail: string) {
  try {
    const parsed = JSON.parse(detail) as { code?: number; message?: string };
    if (parsed.code === 63031) {
      return `The recipient number cannot be the same as your Twilio sender (${twilioSenderPhone()}). Use the client's personal mobile number.`;
    }
    if (parsed.message) return `Could not send text message: ${parsed.message}`;
  } catch {
    // fall through
  }
  return `Could not send text message: ${detail.slice(0, 300)}`;
}

export async function sendOutboundMessage(phone: string, message: string) {
  if (!isTwilioConfigured()) {
    throw new Error('Twilio outbound messaging is not configured.');
  }

  validateOutboundRecipient(phone);

  const params = new URLSearchParams({
    From: twilioFromAddress(),
    To: twilioToAddress(phone),
    Body: message
  });
  const token = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(formatTwilioSendError(detail));
  }
}
