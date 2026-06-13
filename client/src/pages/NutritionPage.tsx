import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutTemplate, ShoppingCart } from 'lucide-react';
import { api, isFuture, isToday, todayKey } from '../services/api';
import { AddExtraFoodButton } from '../components/gamification/AddExtraFoodButton';
import type { Meal, NutritionPlanTemplateSummary } from '../types';
import { MealPlanner } from '../components/nutrition/MealPlanner';
import { WeekDateStrip } from '../components/nutrition/WeekDateStrip';
import { EditMealPlanDrawer } from '../components/nutrition/EditMealPlanDrawer';
import { AiFoodLookupDrawer } from '../components/nutrition/AiFoodLookupDrawer';
import { ApplyTemplateModal } from '../components/nutrition/ApplyTemplateModal';
import { ShoppingListDrawer } from '../components/nutrition/ShoppingListDrawer';
import { Button } from '../components/ui/Button';

function dateFromParams(params: URLSearchParams) {
  const date = params.get('date');
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey();
}

export function NutritionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => dateFromParams(searchParams));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editMealId, setEditMealId] = useState<string>();
  const [editMode, setEditMode] = useState<'PLANNED' | 'ACTUAL'>('PLANNED');
  const [aiState, setAiState] = useState<{ mealId: string; itemType: 'PLANNED' | 'ACTUAL' }>();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState<NutritionPlanTemplateSummary | null>(null);

  const load = useCallback(async (date: string) => {
    try {
      const data = await api<Meal[]>(`/api/daily-logs/${date}/ensure`, { method: 'POST' });
      setMeals(data);
      setLoadError(data.length ? null : 'No meals for this day yet.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load meals.';
      try {
        const data = await api<Meal[]>(`/api/daily-logs/${date}/meals`);
        setMeals(data);
        setLoadError(data.length ? null : message);
      } catch {
        setMeals([]);
        setLoadError(message);
      }
    }
  }, []);

  useEffect(() => {
    const date = dateFromParams(searchParams);
    setSelectedDate(date);
  }, [searchParams]);

  useEffect(() => {
    load(selectedDate);
  }, [selectedDate, load]);

  useEffect(() => {
    api<NutritionPlanTemplateSummary | null>('/api/nutrition-templates/default')
      .then(setDefaultTemplate)
      .catch(() => setDefaultTemplate(null));
  }, [selectedDate, meals]);

  function selectDate(date: string) {
    setSelectedDate(date);
    setSearchParams(date === todayKey() ? {} : { date }, { replace: true });
  }

  function openEditPlan(mealId: string) {
    setEditMode('PLANNED');
    setEditMealId(mealId);
  }

  function openLogActual(mealId: string) {
    setEditMode('ACTUAL');
    setEditMealId(mealId);
  }

  function openAiFromDrawer(mealId: string, mode: 'PLANNED' | 'ACTUAL') {
    setEditMealId(undefined);
    setAiState({ mealId, itemType: mode });
  }

  const editMeal = meals.find((meal) => meal.id === editMealId);
  const dayTotals = meals.reduce(
    (sum, meal) => ({
      plannedCalories: sum.plannedCalories + Number(meal.plannedCalories),
      plannedProtein: sum.plannedProtein + Number(meal.plannedProtein),
      plannedCarbs: sum.plannedCarbs + Number(meal.plannedCarbs),
      plannedFat: sum.plannedFat + Number(meal.plannedFat),
      actualCalories: sum.actualCalories + Number(meal.actualCalories),
      actualProtein: sum.actualProtein + Number(meal.actualProtein),
      actualCarbs: sum.actualCarbs + Number(meal.actualCarbs),
      actualFat: sum.actualFat + Number(meal.actualFat)
    }),
    {
      plannedCalories: 0,
      plannedProtein: 0,
      plannedCarbs: 0,
      plannedFat: 0,
      actualCalories: 0,
      actualProtein: 0,
      actualCarbs: 0,
      actualFat: 0
    }
  );

  function formatDayLine(label: string, calories: number, protein: number, carbs: number, fat: number) {
    return `${label}: ${Math.round(calories)} kcal · ${Math.round(protein)}g protein · ${Math.round(carbs)}g carbs · ${Math.round(fat)}g fat`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nutrition</h1>
        <p className="text-slate-500">Plan meals and track what you actually ate.</p>
      </div>

      <WeekDateStrip
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        endAction={
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShoppingListOpen(true)}>
              <ShoppingCart className="mr-1 inline h-4 w-4" />
              Shopping list
            </Button>
            <Button type="button" variant="secondary" onClick={() => setTemplateModalOpen(true)}>
              <LayoutTemplate className="mr-1 inline h-4 w-4" />
              Use template
            </Button>
          </div>
        }
      />

      {defaultTemplate && (
        <p className="text-sm text-slate-500">
          Default plan: <span className="font-medium text-slate-700">{defaultTemplate.name}</span>
        </p>
      )}

      {loadError && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</div>
      )}

      {!isFuture(selectedDate) && (
        <AddExtraFoodButton date={selectedDate} onAdded={() => load(selectedDate)} />
      )}

      <MealPlanner
        meals={meals}
        selectedDate={selectedDate}
        onChange={() => load(selectedDate)}
        onEditPlan={openEditPlan}
        onLogActual={openLogActual}
      />

      {meals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-900">Day totals</p>
          {!isToday(selectedDate) && <p className="text-sm text-slate-400">{selectedDate}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-yellow-50 p-3 text-sm text-slate-700">
              {formatDayLine('Planned', dayTotals.plannedCalories, dayTotals.plannedProtein, dayTotals.plannedCarbs, dayTotals.plannedFat)}
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-sm text-slate-700">
              {formatDayLine('Actual', dayTotals.actualCalories, dayTotals.actualProtein, dayTotals.actualCarbs, dayTotals.actualFat)}
            </div>
          </div>
        </div>
      )}

      <EditMealPlanDrawer
        open={Boolean(editMealId)}
        meal={editMeal}
        mode={editMode}
        onClose={() => setEditMealId(undefined)}
        onSaved={() => load(selectedDate)}
        onAskAi={openAiFromDrawer}
      />

      <AiFoodLookupDrawer
        open={Boolean(aiState)}
        mealId={aiState?.mealId}
        itemType={aiState?.itemType ?? 'ACTUAL'}
        onClose={() => setAiState(undefined)}
        onSaved={() => load(selectedDate)}
      />

      <ApplyTemplateModal
        open={templateModalOpen}
        selectedDate={selectedDate}
        meals={meals}
        onClose={() => setTemplateModalOpen(false)}
        onApplied={() => load(selectedDate)}
      />

      <ShoppingListDrawer open={shoppingListOpen} anchorDate={selectedDate} onClose={() => setShoppingListOpen(false)} />
    </div>
  );
}
