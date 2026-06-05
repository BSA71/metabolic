import { useState, type ReactNode } from 'react';
import { CheckCircle2, ClipboardPlus, Copy, Pencil } from 'lucide-react';
import type { Meal, MealItem } from '../../types';
import { api, isFuture } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { MealLogActions } from '../gamification/MealLogActions';

function MealActionButton({
  label,
  onClick,
  children,
  variant = 'default'
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  variant?: 'default' | 'primary' | 'accent';
}) {
  const styles = {
    default: 'text-app-text-muted hover:bg-app-muted hover:text-app-text',
    primary: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    accent: 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-xl transition ${styles[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function formatPlannedTime(plannedTime?: string | null) {
  if (!plannedTime) return null;
  const match = plannedTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return plannedTime;

  const [, hour, minute] = match;
  return new Date(2000, 0, 1, Number(hour), Number(minute))
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    .replace(' AM', 'am')
    .replace(' PM', 'pm');
}

export function MealCard({
  meal,
  selectedDate,
  onChange,
  onEditPlan,
  onLogActual
}: {
  meal: Meal;
  selectedDate: string;
  onChange: () => void | Promise<void>;
  onEditPlan: (mealId: string) => void;
  onLogActual: (mealId: string) => void;
}) {
  const future = isFuture(selectedDate);
  const plannedItems = (meal.items ?? []).filter((item) => item.type === 'PLANNED');
  const actualItems = (meal.items ?? []).filter((item) => item.type === 'ACTUAL');
  const [pendingLogged, setPendingLogged] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const plannedTime = formatPlannedTime(meal.plannedTime);

  function isPlannedItemLogged(plannedItem: MealItem) {
    return actualItems.some(
      (item) =>
        item.linkedPlannedItemId === plannedItem.id ||
        (!item.linkedPlannedItemId &&
          item.nameSnapshot === plannedItem.nameSnapshot &&
          Number(item.quantity) === Number(plannedItem.quantity) &&
          (item.foodId ?? null) === (plannedItem.foodId ?? null))
    );
  }

  function isItemLogged(plannedItem: MealItem) {
    if (plannedItem.id in pendingLogged) return pendingLogged[plannedItem.id];
    return isPlannedItemLogged(plannedItem);
  }

  function formatItemLine(item: MealItem) {
    const qty = Number(item.quantity);
    const qtyLabel = qty === 1 ? '' : `${qty} ${item.unit} `;
    return `${qtyLabel}${item.nameSnapshot}`.trim();
  }

  function formatMacros(item: Pick<MealItem, 'calories' | 'protein' | 'carbs' | 'fat'>) {
    return `${Math.round(Number(item.calories))} kcal · ${Math.round(Number(item.protein))}g P · ${Math.round(Number(item.carbs))}g C · ${Math.round(Number(item.fat))}g F`;
  }

  function formatMealTotals(calories: number, protein: number, carbs: number, fat: number) {
    return `${Math.round(calories)} kcal · ${Math.round(protein)}g protein · ${Math.round(carbs)}g carbs · ${Math.round(fat)}g fat`;
  }

  async function togglePlannedItem(plannedItemId: string, logged: boolean) {
    setToggleError(null);
    setTogglingId(plannedItemId);
    setPendingLogged((prev) => ({ ...prev, [plannedItemId]: logged }));
    try {
      await api(`/api/meal-items/${plannedItemId}/set-logged`, {
        method: 'POST',
        body: JSON.stringify({ logged })
      });
      setPendingLogged((prev) => {
        const next = { ...prev };
        delete next[plannedItemId];
        return next;
      });
      await onChange();
    } catch (error) {
      setPendingLogged((prev) => {
        const next = { ...prev };
        delete next[plannedItemId];
        return next;
      });
      setToggleError(error instanceof Error ? error.message : 'Could not update this item.');
    } finally {
      setTogglingId(null);
    }
  }

  async function markPlannedAsEaten() {
    setToggleError(null);
    setPendingLogged(Object.fromEntries(plannedItems.map((item) => [item.id, true])));
    try {
      await api(`/api/meals/${meal.id}/mark-eaten-as-planned`, { method: 'POST' });
      setPendingLogged({});
      await onChange();
    } catch (error) {
      setPendingLogged({});
      setToggleError(error instanceof Error ? error.message : 'Could not mark planned as eaten.');
    }
  }

  async function copyFromYesterday() {
    await api(`/api/meals/${meal.id}/copy-from-previous-day`, { method: 'POST' });
    await onChange();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-app-text-muted">Meal {meal.mealNumber}</p>
          <h3 className="text-lg font-bold">{plannedTime ? `${meal.name} - ${plannedTime}` : meal.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <MealActionButton label="Edit plan" onClick={() => onEditPlan(meal.id)}>
            <Pencil size={18} />
          </MealActionButton>
          {!future && (
            <>
              <MealActionButton label="Log actual" variant="primary" onClick={() => onLogActual(meal.id)}>
                <ClipboardPlus size={18} />
              </MealActionButton>
              <MealActionButton label="Mark planned as eaten" variant="accent" onClick={() => void markPlannedAsEaten()}>
                <CheckCircle2 size={18} />
              </MealActionButton>
            </>
          )}
          <MealActionButton label="Copy from yesterday" onClick={() => void copyFromYesterday()}>
            <Copy size={18} />
          </MealActionButton>
          <Badge tone={meal.status.includes('EATEN') || meal.status === 'MODIFIED' ? 'green' : 'slate'}>
            {meal.status.replaceAll('_', ' ')}
          </Badge>
        </div>
      </div>

      {toggleError && <p className="mt-2 text-sm text-red-600">{toggleError}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-yellow-50 p-3">
          <p className="font-semibold">Planned</p>
          {plannedItems.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {plannedItems.map((item) => {
                const logged = isItemLogged(item);
                return (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                    {!future && (
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300"
                        checked={logged}
                        disabled={togglingId === item.id}
                        onChange={(event) => void togglePlannedItem(item.id, event.target.checked)}
                        aria-label={`Log ${item.nameSnapshot} as eaten`}
                      />
                    )}
                    <div className={`flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 ${logged ? 'text-slate-500 line-through' : ''}`}>
                      <span className="min-w-0">{formatItemLine(item)}</span>
                      <span className="shrink-0 text-slate-500">{formatMacros(item)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No foods planned</p>
          )}
          <p className="mt-2 border-t border-yellow-100 pt-2 text-sm font-medium">
            {formatMealTotals(meal.plannedCalories, meal.plannedProtein, meal.plannedCarbs, meal.plannedFat)}
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <p className="font-semibold">Actual</p>
          {actualItems.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {actualItems.map((item) => (
                <li key={item.id} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm text-slate-700">
                  <span className="min-w-0">{formatItemLine(item)}</span>
                  <span className="shrink-0 text-slate-500">{formatMacros(item)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Nothing logged yet</p>
          )}
          <p className="mt-2 border-t border-blue-100 pt-2 text-sm font-medium">
            {formatMealTotals(meal.actualCalories, meal.actualProtein, meal.actualCarbs, meal.actualFat)}
          </p>
        </div>
      </div>

      {!future && plannedItems.length > 0 && (
        <MealLogActions mealId={meal.id} disabled={future} onLogged={() => void onChange()} />
      )}
    </Card>
  );
}
