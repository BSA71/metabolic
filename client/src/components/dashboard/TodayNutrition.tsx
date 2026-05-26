import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Meal } from '../../types';
import { PlannedItemChecklist } from '../nutrition/PlannedItemChecklist';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export function TodayNutrition({
  meals,
  onChange
}: {
  meals: Meal[];
  onChange: () => void | Promise<void>;
}) {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  function toggleMeal(mealId: string) {
    setExpandedMealId((current) => (current === mealId ? null : mealId));
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">Today's Nutrition</h2>
      <div className="space-y-3">
        {meals.map((meal) => {
          const expanded = expandedMealId === meal.id;
          const plannedCount = (meal.items ?? []).filter((item) => item.type === 'PLANNED').length;

          return (
            <div key={meal.id} className="overflow-hidden rounded-2xl bg-slate-50">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-3 text-left"
                onClick={() => toggleMeal(meal.id)}
                aria-expanded={expanded}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {meal.mealNumber}. {meal.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {Math.round(Number(meal.actualCalories))} / {Math.round(Number(meal.plannedCalories))} kcal
                    {plannedCount > 0 && ` · ${plannedCount} item${plannedCount === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={meal.status.includes('EATEN') ? 'green' : 'slate'}>
                    {meal.status.replaceAll('_', ' ')}
                  </Badge>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              {expanded && <PlannedItemChecklist meal={meal} onChange={onChange} />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
