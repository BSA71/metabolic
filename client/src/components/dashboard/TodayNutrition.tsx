import type { Meal } from '../../types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export function TodayNutrition({ meals }: { meals: Meal[] }) {
  return <Card><h2 className="mb-4 text-lg font-bold">Today's Nutrition</h2><div className="space-y-3">{meals.map((meal) => <div key={meal.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><p className="font-semibold">{meal.mealNumber}. {meal.name}</p><p className="text-sm text-slate-500">{Math.round(Number(meal.actualCalories))} / {Math.round(Number(meal.plannedCalories))} kcal</p></div><Badge tone={meal.status.includes('EATEN') ? 'green' : 'slate'}>{meal.status.replaceAll('_', ' ')}</Badge></div>)}</div></Card>;
}
