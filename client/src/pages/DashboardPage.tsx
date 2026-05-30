import { useCallback, useEffect, useState } from 'react';
import { Target, Apple, Dumbbell, LineChart, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { getIdToken } from '../services/auth';
import { DashboardWelcome } from '../components/dashboard/DashboardWelcome';
import type { AppUser, Dashboard } from '../types';
import { MetricTile } from '../components/dashboard/MetricTile';
import { TodayNutrition } from '../components/dashboard/TodayNutrition';
import { TodayExercise } from '../components/dashboard/TodayExercise';
import { MacroProgress } from '../components/dashboard/MacroProgress';
import { WeightTrendChart } from '../components/dashboard/WeightTrendChart';

function DateTimeDisplay() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-left sm:text-right">
      <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white">
        {now.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-app-text-muted">
        {now.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        })}
      </p>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof Target; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-app-surface border border-app-border p-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-brand-green/50 text-app-text"
    >
      <Icon size={28} className="text-brand-green dark:text-brand-green-light mb-1" />
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}

export function DashboardPage({ user }: { user?: AppUser | null }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError('');
    }

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Not signed in yet. Please refresh or sign in again.');
      }

      const dashboard = await api<Dashboard>('/api/dashboard/today');
      if (dashboard.program && !dashboard.summary) {
        throw new Error('Dashboard data is incomplete. Restart the backend server and try again.');
      }

      setData(dashboard);
    } catch (err) {
      if (!options?.silent) {
        setData(null);
        setError(err instanceof Error ? err.message : 'Unable to load dashboard');
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return <p className="text-app-text-muted">Loading dashboard...</p>;
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-6 text-red-900 dark:text-red-200">
        <h1 className="text-xl font-bold">Dashboard could not load</h1>
        <p className="mt-2 text-sm">{error}</p>
        <p className="mt-4 text-sm text-red-700 dark:text-red-300">
          Check that the backend is running and that Firebase Admin credentials are configured in{' '}
          <code>server/.env</code>.
        </p>
      </div>
    );
  }
  if (!data?.program) {
    return (
      <div className="rounded-2xl border border-brand-green/30 bg-brand-green/10 p-6 text-brand-navy dark:text-brand-off-white">
        <h1 className="text-xl font-bold">No active program yet</h1>
        <p className="mt-2 text-sm text-app-text-muted">
          Your account exists, but there is no active program attached to it yet. Sign in as{' '}
          <code>user@metabolic.local</code> to use the seeded demo data, or create a program for this account.
        </p>
      </div>
    );
  }

  const s = data.summary!;
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardWelcome firstName={user?.firstName} />
        <DateTimeDisplay />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-app-text-muted mb-3">Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <QuickLink to="/program" icon={Target} label="Program" />
          <QuickLink to="/nutrition" icon={Apple} label="Nutrition" />
          <QuickLink to="/exercise" icon={Dumbbell} label="Exercise" />
          <QuickLink to="/progress" icon={LineChart} label="Progress" />
          <QuickLink to="/admin" icon={Settings} label="Admin" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-app-text-muted mb-3">Today&apos;s Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <MetricTile label="Current Weight" value={`${s.currentWeight} lbs`} />
          <MetricTile label="Calories Left" value={`${s.caloriesRemaining}`} />
          <MetricTile label="Protein Left" value={`${s.proteinRemaining}g`} />
          <MetricTile label="Next Meal" value={s.nextMeal} />
          <MetricTile label="Exercises Left" value={`${s.exercisesLeft}`} />
          <MetricTile label="Goal Progress" value={`${s.goalProgress}%`} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TodayNutrition meals={data.meals} onChange={() => loadDashboard({ silent: true })} />
        <TodayExercise exercises={data.exercises} onChange={() => loadDashboard({ silent: true })} />
        <MacroProgress dashboard={data} />
        <WeightTrendChart data={data.weightTrend} />
      </section>

      <section className="rounded-2xl border border-dashed border-app-border bg-app-surface/70 p-6 text-center">
        <h2 className="text-lg font-semibold text-brand-navy dark:text-brand-off-white">Quick Log via SMS</h2>
        <p className="mt-2 text-sm text-app-text-muted max-w-xl mx-auto">
          You can quickly log meals by texting our AI assistant. SMS commands are supported directly through the backend webhook.
        </p>
      </section>
    </div>
  );
}
