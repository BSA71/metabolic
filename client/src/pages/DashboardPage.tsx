import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { api } from '../services/api';
import type { Dashboard } from '../types';
import { MetricTile } from '../components/dashboard/MetricTile';
import { TodayNutrition } from '../components/dashboard/TodayNutrition';
import { TodayExercise } from '../components/dashboard/TodayExercise';
import { MacroProgress } from '../components/dashboard/MacroProgress';
import { WeightTrendChart } from '../components/dashboard/WeightTrendChart';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<Dashboard>('/api/dashboard/today').then(setData).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard')); }, []);
  if (error) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900"><h1 className="text-xl font-bold">Dashboard could not load</h1><p className="mt-2 text-sm">{error}</p><p className="mt-4 text-sm text-red-700">Check that the backend is running and that Firebase Admin credentials are configured in <code>server/.env</code>.</p></div>;
  if (data && !data.summary) return <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900"><h1 className="text-xl font-bold">No active program yet</h1><p className="mt-2 text-sm">Your account exists, but there is no active program or daily log attached to it yet. Seeded demo data belongs to <code>user@metabolic.local</code>.</p></div>;
  if (!data?.summary) return <p>Loading dashboard...</p>;
  const s = data.summary;
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Today Dashboard</h1><p className="text-slate-500">Planned vs actual, centered around what to do next.</p></div><Button className="flex items-center gap-2"><Bot size={18} />Ask Metabolic</Button></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><MetricTile label="Current Weight" value={`${s.currentWeight} lbs`} /><MetricTile label="Calories Remaining" value={`${s.caloriesRemaining}`} /><MetricTile label="Protein Remaining" value={`${s.proteinRemaining}g`} /><MetricTile label="Next Meal" value={s.nextMeal} /><MetricTile label="Exercises Left" value={`${s.exercisesLeft}`} /><MetricTile label="Goal Progress" value={`${s.goalProgress}%`} /></section><section className="grid gap-6 lg:grid-cols-2"><TodayNutrition meals={data.meals} /><TodayExercise exercises={data.exercises} /><MacroProgress dashboard={data} /><WeightTrendChart data={data.weightTrend} /></section><section className="rounded-3xl border border-dashed border-slate-300 bg-white p-5"><h2 className="text-lg font-bold">Quick Log</h2><p className="mt-2 text-sm text-slate-500">Use Nutrition to log meals or the AI drawer to estimate foods. SMS commands are also supported by the backend webhook.</p></section></div>;
}
