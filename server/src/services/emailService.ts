import sgMail from '@sendgrid/mail';
import { env } from '../config/env.js';
import type { ResultsReadyLinks } from './resultsReadyNotification.js';

export function isEmailConfigured() {
  return Boolean(env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL);
}

export type { ResultsReadyLinks };

export async function sendResultsReadyEmail(options: {
  to: string;
  clientFirstName: string;
  coachName: string;
  links: ResultsReadyLinks;
}) {
  if (!isEmailConfigured()) {
    throw new Error('Email is not configured.');
  }

  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const subject = 'Your results are ready';
  const greeting = options.clientFirstName.trim() || 'there';
  const coachLabel = options.coachName.trim() || 'Your coach';

  const text = [
    `Hi ${greeting},`,
    '',
    `${coachLabel} let you know your latest program results are ready to review.`,
    '',
    `Progress: ${options.links.progress}`,
    `Nutrition: ${options.links.nutrition}`,
    `Exercise: ${options.links.exercise}`,
    '',
    '— Master Metabolic'
  ].join('\n');

  const html = [
    `<p>Hi ${escapeHtml(greeting)},</p>`,
    `<p>${escapeHtml(coachLabel)} let you know your latest program results are ready to review.</p>`,
    '<ul>',
    `<li><a href="${escapeHtml(options.links.progress)}">View progress</a></li>`,
    `<li><a href="${escapeHtml(options.links.nutrition)}">View nutrition</a></li>`,
    `<li><a href="${escapeHtml(options.links.exercise)}">View exercise</a></li>`,
    '</ul>',
    '<p>— Master Metabolic</p>'
  ].join('');

  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: env.SENDGRID_FROM_EMAIL,
        name: env.SENDGRID_FROM_NAME
      },
      subject,
      text,
      html
    });
  } catch (error) {
    const detail =
      error && typeof error === 'object' && 'response' in error
        ? JSON.stringify((error as { response?: { body?: unknown } }).response?.body ?? error)
        : error instanceof Error
          ? error.message
          : 'Unknown SendGrid error';
    throw new Error(`Could not send email: ${detail.slice(0, 300)}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
