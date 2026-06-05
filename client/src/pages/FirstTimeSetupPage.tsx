import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BrandLogo } from '../components/brand/BrandLogo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import type { AppUser } from '../types';

const inputClass =
  'w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3.5 text-app-text placeholder:text-app-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-green/40';

type FirstTimeSetupPageProps = {
  user?: AppUser | null;
  onComplete: () => void;
};

export function FirstTimeSetupPage({ user, onComplete }: FirstTimeSetupPageProps) {
  const navigate = useNavigate();
  const [programName, setProgramName] = useState('My Metabolic Program');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [goalBodyFat, setGoalBodyFat] = useState('');
  const [coachCode, setCoachCode] = useState('');
  const [wantsCoach, setWantsCoach] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const currentWeight = Number(weight);
    const targetWeight = Number(goalWeight);
    const currentBodyFat = bodyFat.trim() ? Number(bodyFat) : undefined;
    const targetBodyFat = goalBodyFat.trim() ? Number(goalBodyFat) : undefined;
    if (!Number.isFinite(currentWeight) || currentWeight <= 0) {
      setError('Enter your current weight.');
      return;
    }
    if (!Number.isFinite(targetWeight) || targetWeight <= 0) {
      setError('Enter your goal weight.');
      return;
    }
    if (currentBodyFat !== undefined && (!Number.isFinite(currentBodyFat) || currentBodyFat <= 0)) {
      setError('Enter a valid current body fat percentage.');
      return;
    }
    if (targetBodyFat !== undefined && (!Number.isFinite(targetBodyFat) || targetBodyFat <= 0)) {
      setError('Enter a valid goal body fat percentage.');
      return;
    }

    setSubmitting(true);
    try {
      await api('/api/onboarding/setup', {
        method: 'POST',
        body: JSON.stringify({
          programName: programName.trim() || undefined,
          weight: currentWeight,
          goalWeight: targetWeight,
          ...(currentBodyFat !== undefined ? { bodyFat: currentBodyFat } : {}),
          ...(targetBodyFat !== undefined ? { goalBodyFat: targetBodyFat } : {}),
          ...(coachCode.trim() ? { coachCode: coachCode.trim() } : {}),
          ...(wantsCoach ? { wantsCoach: true } : {})
        })
      });
      onComplete();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = user?.firstName?.trim() || 'there';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-app-bg px-4 py-12 text-app-text">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-app-border/60 bg-app-surface p-8 shadow-lg sm:p-10">
        <BrandLogo showTagline markSize={44} />

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
            Welcome, {firstName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
            Let&apos;s create your first program so you can explore nutrition, exercise, and progress tracking.
          </p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div>
            <label htmlFor="program-name" className="mb-2 block text-sm font-medium text-app-text">
              Program name
            </label>
            <input
              id="program-name"
              className={inputClass}
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="My Metabolic Program"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="current-weight" className="mb-2 block text-sm font-medium text-app-text">
                Current weight (lbs)
              </label>
              <input
                id="current-weight"
                className={inputClass}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="180"
                inputMode="decimal"
                type="number"
                min="1"
                step="0.1"
                required
              />
            </div>
            <div>
              <label htmlFor="goal-weight" className="mb-2 block text-sm font-medium text-app-text">
                Goal weight (lbs)
              </label>
              <input
                id="goal-weight"
                className={inputClass}
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder="165"
                inputMode="decimal"
                type="number"
                min="1"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="current-body-fat" className="mb-2 block text-sm font-medium text-app-text">
                Current body fat (%)
              </label>
              <input
                id="current-body-fat"
                className={inputClass}
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="35"
                inputMode="decimal"
                type="number"
                min="1"
                max="75"
                step="0.1"
              />
            </div>
            <div>
              <label htmlFor="goal-body-fat" className="mb-2 block text-sm font-medium text-app-text">
                Goal body fat (%)
              </label>
              <input
                id="goal-body-fat"
                className={inputClass}
                value={goalBodyFat}
                onChange={(e) => setGoalBodyFat(e.target.value)}
                placeholder="18"
                inputMode="decimal"
                type="number"
                min="1"
                max="75"
                step="0.1"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-muted/40 p-4">
            <p className="text-sm font-semibold text-app-text">Coach support</p>
            <p className="mt-1 text-sm text-app-text-muted">
              Optional. We&apos;ll start you with a balanced plan either way, and a coach can personalize it later.
            </p>
            <label htmlFor="coach-code" className="mt-3 block text-sm font-medium text-app-text">
              Coach initials or code
            </label>
            <input
              id="coach-code"
              className={`${inputClass} mt-2 uppercase`}
              value={coachCode}
              onChange={(e) => setCoachCode(e.target.value.toUpperCase())}
              placeholder="DF"
              maxLength={20}
            />
            <label className="mt-3 flex items-start gap-3 text-sm text-app-text">
              <input
                className="mt-1"
                type="checkbox"
                checked={wantsCoach}
                onChange={(e) => setWantsCoach(e.target.checked)}
              />
              <span>I&apos;d like to work with a real coach.</span>
            </label>
          </div>

          <p className="text-sm text-app-text-muted">
            We&apos;ll start you with a full metric profile, a starter nutrition plan, and an exercise checklist.
            Leave body fat blank to use sensible defaults, or fine-tune everything later.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-navy px-6 py-3.5 text-sm font-semibold text-brand-off-white shadow-md transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-green dark:text-brand-navy dark:hover:bg-brand-green-light"
          >
            {submitting ? 'Creating your program…' : 'Start my program'}
            {!submitting && <ArrowRight size={16} aria-hidden />}
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>

      <p className="mt-8 max-w-md text-center text-sm text-app-text-muted">
        One quick setup, then you&apos;re ready to use your dashboard.
      </p>
    </main>
  );
}
