import { useCallback, useEffect, useState } from 'react';
import { Bot, Target, Apple, Dumbbell, LineChart, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { getIdToken } from '../services/auth';
import type { Dashboard } from '../types';
import { MetricTile } from '../components/dashboard/MetricTile';
import { TodayNutrition } from '../components/dashboard/TodayNutrition';
import { TodayExercise } from '../components/dashboard/TodayExercise';
import { MacroProgress } from '../components/dashboard/MacroProgress';
import { WeightTrendChart } from '../components/dashboard/WeightTrendChart';
import { Button } from '../components/ui/Button';

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link 
      to={to} 
      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white dark:bg-[#22262b] border border-slate-200 dark:border-slate-800 p-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-brand-yellow dark:hover:border-brand-yellow text-slate-700 dark:text-slate-300"
    >
      <Icon size={28} className="text-brand-dark dark:text-brand-yellow mb-1" />
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}

export function DashboardPage() {
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

  if (loading) return <p className="dark:text-slate-400">Loading dashboard...</p>;
  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-6 text-red-900 dark:text-red-200">
        <h1 className="text-xl font-bold">Dashboard could not load</h1>
        <p className="mt-2 text-sm">{error}</p>
        <p className="mt-4 text-sm text-red-700 dark:text-red-300">
          Check that the backend is running and that Firebase Admin credentials are configured in <code>server/.env</code>.
        </p>
      </div>
    );
  }
  if (!data?.program) {
    return (
      <div className="rounded-3xl border border-brand-yellow/30 bg-yellow-50 dark:bg-brand-yellow/10 p-6 text-yellow-900 dark:text-yellow-200">
        <h1 className="text-xl font-bold">No active program yet</h1>
        <p className="mt-2 text-sm">
          Your account exists, but there is no active program attached to it yet. Sign in as <code>user@metabolic.local</code> to use the seeded demo data, or create a program for this account.
        </p>
      </div>
    );
  }

  const s = data.summary!;
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your daily metabolic overview and quick actions.</p>
        </div>
        <Link to="/assistant">
          <Button className="flex items-center justify-center gap-2 w-full sm:w-auto bg-brand-dark dark:bg-brand-yellow text-white dark:text-brand-dark hover:opacity-90 transition-opacity">
            <Bot size={18} />
            Ask AI Assistant
          </Button>
        </Link>
      </div>

      {/* Navigation App-like Grid */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <QuickLink to="/program" icon={Target} label="Program" />
          <QuickLink to="/nutrition" icon={Apple} label="Nutrition" />
          <QuickLink to="/exercise" icon={Dumbbell} label="Exercise" />
          <QuickLink to="/progress" icon={LineChart} label="Progress" />
          <QuickLink to="/admin" icon={Settings} label="Admin" />
        </div>
      </section>

      {/* Metrics */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Today's Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <MetricTile label="Current Weight" value={`${s.currentWeight} lbs`} />
          <MetricTile label="Calories Left" value={`${s.caloriesRemaining}`} />
          <MetricTile label="Protein Left" value={`${s.proteinRemaining}g`} />
          <MetricTile label="Next Meal" value={s.nextMeal} />
          <MetricTile label="Exercises Left" value={`${s.exercisesLeft}`} />
          <MetricTile label="Goal Progress" value={`${s.goalProgress}%`} />
        </div>
      </section>

      {/* Main Content Areas */}
      <section className="grid gap-6 lg:grid-cols-2">
        <TodayNutrition meals={data.meals} onChange={() => loadDashboard({ silent: true })} />
        <TodayExercise exercises={data.exercises} onChange={() => loadDashboard({ silent: true })} />
        <MacroProgress dashboard={data} />
        <WeightTrendChart data={data.weightTrend} />
      </section>

      <section className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-[#22262b]/50 p-6 text-center">
        <h2 className="text-lg font-bold dark:text-white">Quick Log via SMS</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          You can quickly log meals by texting our AI assistant. SMS commands are supported directly through the backend webhook.
        </p>
      </section>
    </div>
  );
}