import { useEffect, useState } from 'react';
import { api, todayKey } from '../services/api';
import type { Meal } from '../types';
import { MealPlanner } from '../components/nutrition/MealPlanner';
import { AiFoodLookupDrawer } from '../components/nutrition/AiFoodLookupDrawer';

export function NutritionPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealId, setMealId] = useState<string>();
  const load = () => api<Meal[]>(`/api/daily-logs/${todayKey()}/meals`).then(setMeals);
  useEffect(() => { load(); }, []);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Nutrition</h1><p className="text-slate-500">Five meals with planned vs actual macros and fast actions.</p></div><MealPlanner meals={meals} onChange={load} onAskAi={setMealId} /><AiFoodLookupDrawer open={Boolean(mealId)} mealId={mealId} onClose={() => setMealId(undefined)} onSaved={load} /></div>;
}
