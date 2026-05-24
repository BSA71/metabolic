import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Food, Meal, MealItem } from '../../types';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { FoodSearch } from './FoodSearch';

type MealEditMode = 'PLANNED' | 'ACTUAL';

const MODE_CONFIG = {
  PLANNED: {
    title: 'Edit plan',
    foodsLabel: 'Planned foods',
    emptyLabel: 'No foods planned yet.',
    panelClass: 'bg-yellow-50',
    aiLabel: 'Ask AI to plan',
    manualHint: 'Adding or editing foods recalculates planned totals automatically.',
    totals: (meal: Meal) => ({
      calories: Math.round(Number(meal.plannedCalories)),
      protein: Math.round(Number(meal.plannedProtein)),
      carbs: Math.round(Number(meal.plannedCarbs)),
      fat: Math.round(Number(meal.plannedFat))
    }),
    patchFields: (manual: { calories: number; protein: number; carbs: number; fat: number }) => ({
      plannedCalories: manual.calories,
      plannedProtein: manual.protein,
      plannedCarbs: manual.carbs,
      plannedFat: manual.fat
    })
  },
  ACTUAL: {
    title: 'Log actual',
    foodsLabel: 'Logged foods',
    emptyLabel: 'Nothing logged yet.',
    panelClass: 'bg-blue-50',
    aiLabel: 'Ask AI to log',
    manualHint: 'Adding or editing foods recalculates actual totals automatically.',
    totals: (meal: Meal) => ({
      calories: Math.round(Number(meal.actualCalories)),
      protein: Math.round(Number(meal.actualProtein)),
      carbs: Math.round(Number(meal.actualCarbs)),
      fat: Math.round(Number(meal.actualFat))
    }),
    patchFields: (manual: { calories: number; protein: number; carbs: number; fat: number }) => ({
      actualCalories: manual.calories,
      actualProtein: manual.protein,
      actualCarbs: manual.carbs,
      actualFat: manual.fat
    })
  }
} as const;

function formatMacros(item: Pick<MealItem, 'calories' | 'protein' | 'carbs' | 'fat'>) {
  return `${Math.round(Number(item.calories))} kcal · ${Math.round(Number(item.protein))}g P · ${Math.round(Number(item.carbs))}g C · ${Math.round(Number(item.fat))}g F`;
}

export function EditMealPlanDrawer({
  open,
  meal,
  mode = 'PLANNED',
  onClose,
  onSaved,
  onAskAi
}: {
  open: boolean;
  meal?: Meal;
  mode?: MealEditMode;
  onClose: () => void;
  onSaved: () => void;
  onAskAi: (mealId: string, mode: MealEditMode) => void;
}) {
  const config = MODE_CONFIG[mode];
  const items = meal?.items.filter((item) => item.type === mode) ?? [];
  const hasItems = items.length > 0;
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    if (!meal) return;
    setManual(MODE_CONFIG[mode].totals(meal));
    setManualOpen(false);
  }, [meal, mode]);

  async function addFood(food: Food) {
    if (!meal) return;
    await api(`/api/meals/${meal.id}/items`, {
      method: 'POST',
      body: JSON.stringify({
        type: mode,
        foodId: food.id,
        nameSnapshot: food.name,
        quantity: Number(food.servingSize) || 1,
        unit: food.servingUnit,
        calories: Number(food.calories),
        protein: Number(food.protein),
        carbs: Number(food.carbs),
        fat: Number(food.fat)
      })
    });
    onSaved();
  }

  async function updateQuantity(item: MealItem, quantity: number) {
    const factor = quantity / Number(item.quantity);
    await api(`/api/meal-items/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        quantity,
        calories: Number(item.calories) * factor,
        protein: Number(item.protein) * factor,
        carbs: Number(item.carbs) * factor,
        fat: Number(item.fat) * factor
      })
    });
    onSaved();
  }

  async function removeItem(itemId: string) {
    await api(`/api/meal-items/${itemId}`, { method: 'DELETE' });
    onSaved();
  }

  async function saveManual() {
    if (!meal) return;
    await api(`/api/meals/${meal.id}`, {
      method: 'PATCH',
      body: JSON.stringify(config.patchFields(manual))
    });
    onSaved();
    onClose();
  }

  return (
    <Drawer open={open} title={meal ? `${config.title} — ${meal.name}` : config.title} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">{config.foodsLabel}</p>
          {items.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{config.emptyLabel}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className={`flex items-center justify-between gap-2 rounded-2xl p-3 ${config.panelClass}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.nameSnapshot}</p>
                    <p className="text-xs text-slate-500">{formatMacros(item)}</p>
                  </div>
                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={Number(item.quantity)}
                    onChange={(event) => updateQuantity(item, Number(event.target.value))}
                  />
                  <button type="button" className="text-sm text-slate-500 hover:text-red-600" onClick={() => removeItem(item.id)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FoodSearch onSelect={addFood} />

        <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => meal && onAskAi(meal.id, mode)} disabled={!meal}>
          {config.aiLabel}
        </Button>

        {!hasItems && (
          <div className="border-t border-slate-100 pt-4">
            <button type="button" className="text-sm font-semibold text-slate-700" onClick={() => setManualOpen(!manualOpen)}>
              {manualOpen ? 'Hide manual totals' : 'Set totals manually'}
            </button>
            {manualOpen && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => (
                  <label key={field} className="text-sm">
                    <span className="mb-1 block capitalize text-slate-500">{field === 'calories' ? 'Kcal' : `${field} (g)`}</span>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={manual[field]}
                      onChange={(event) => setManual({ ...manual, [field]: Number(event.target.value) })}
                    />
                  </label>
                ))}
                <div className="col-span-2">
                  <Button type="button" onClick={saveManual}>Save manual totals</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {hasItems && <p className="text-xs text-slate-500">{config.manualHint}</p>}
      </div>
    </Drawer>
  );
}
