import type { Meal } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function MealCard({ meal, onChange, onAskAi }: { meal: Meal; onChange: () => void; onAskAi: (mealId: string) => void }) {
  async function mark() { await api(`/api/meals/${meal.id}/mark-eaten-as-planned`, { method: 'POST' }); onChange(); }
  return <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-slate-500">Meal {meal.mealNumber}</p><h3 className="text-lg font-bold">{meal.name}</h3></div><Badge tone={meal.status.includes('EATEN') ? 'green' : 'slate'}>{meal.status.replaceAll('_', ' ')}</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-yellow-50 p-3"><p className="font-semibold">Planned</p><p className="text-sm">{Math.round(Number(meal.plannedCalories))} kcal, {Math.round(Number(meal.plannedProtein))}g protein</p></div><div className="rounded-2xl bg-blue-50 p-3"><p className="font-semibold">Actual</p><p className="text-sm">{Math.round(Number(meal.actualCalories))} kcal, {Math.round(Number(meal.actualProtein))}g protein</p></div></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={mark}>Mark as eaten as planned</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={() => onAskAi(meal.id)}>Ask AI</Button><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Copy from yesterday</button><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Save as template</button></div></Card>;
}
