import { Link } from 'react-router-dom';
import { LegalPageLayout } from '../components/layout/LegalPageLayout';

const SUPPORT_EMAIL = 'support@master-metabolic.com';

export function SmsOptInPage() {
  return (
    <LegalPageLayout title="Master Metabolic SMS Opt-In" lastUpdated="June 10, 2026">
      <section>
        <h2 className="text-lg font-semibold">How to opt in</h2>
        <p className="mt-2 text-app-text-muted">
          Existing Metabolic users can opt in to the Master Metabolic SMS program by texting{' '}
          <strong>START</strong> to the Master Metabolic SMS number provided in their Metabolic account or by
          an authorized Master Metabolic coach or administrator.
        </p>
        <p className="mt-2 rounded-2xl border border-app-border bg-app-surface p-4 text-app-text-muted">
          By texting <strong>START</strong>, you agree to receive conversational SMS replies from Master
          Metabolic about your Metabolic account, including meals, workouts, program status, progress, and
          support. Message frequency varies based on your messages. Message and data rates may apply. Reply{' '}
          <strong>HELP</strong> for help or <strong>STOP</strong> to opt out.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Consent</h2>
        <p className="mt-2 text-app-text-muted">
          SMS consent is optional and is not required to purchase goods or services. The SMS feature is available
          only to users who have a Metabolic account and choose to start an SMS conversation with Master
          Metabolic.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Message types and frequency</h2>
        <p className="mt-2 text-app-text-muted">
          Master Metabolic sends conversational coaching and support replies related to your account, meals,
          workouts, program status, and progress. We do not send marketing messages, promotional blasts, or
          unsolicited reminders under this SMS program. Message frequency varies based on how often you text us.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Help and opt-out</h2>
        <p className="mt-2 text-app-text-muted">
          Reply <strong>HELP</strong> for assistance. Reply <strong>STOP</strong> to opt out at any time. You
          can also contact{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-app-text underline-offset-2 hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Policy links</h2>
        <p className="mt-2 text-app-text-muted">
          Review the{' '}
          <Link to="/campaign-policy" className="font-medium text-app-text underline-offset-2 hover:underline">
            SMS Campaign Privacy Policy
          </Link>{' '}
          and{' '}
          <Link to="/campaign-terms" className="font-medium text-app-text underline-offset-2 hover:underline">
            SMS Campaign Terms and Conditions
          </Link>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
