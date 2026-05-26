import { useState } from 'react';
import type { Meal, MealItem } from '../../types';
import { api } from '../../services/api';

function isPlannedItemLogged(plannedItem: MealItem, actualItems: MealItem[]) {
  return actualItems.some(
    (item) =>
      item.linkedPlannedItemId === plannedItem.id ||
      (!item.linkedPlannedItemId &&
        item.nameSnapshot === plannedItem.nameSnapshot &&
        Number(item.quantity) === Number(plannedItem.quantity) &&
        (item.foodId ?? null) === (plannedItem.foodId ?? null))
  );
}

function formatItemLine(item: MealItem) {
  const qty = Number(item.quantity);
  const qtyLabel = qty === 1 ? '' : `${qty} ${item.unit} `;
  return `${qtyLabel}${item.nameSnapshot}`.trim();
}

function formatMacros(item: Pick<MealItem, 'calories' | 'protein' | 'carbs' | 'fat'>) {
  return `${Math.round(Number(item.calories))} kcal · ${Math.round(Number(item.protein))}g P`;
}

export function PlannedItemChecklist({
  meal,
  onChange
}: {
  meal: Meal;
  onChange: () => void | Promise<void>;
}) {
  const plannedItems = (meal.items ?? []).filter((item) => item.type === 'PLANNED');
  const actualItems = (meal.items ?? []).filter((item) => item.type === 'ACTUAL');
  const [pendingLogged, setPendingLogged] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function isItemLogged(plannedItem: MealItem) {
    if (plannedItem.id in pendingLogged) return pendingLogged[plannedItem.id];
    return isPlannedItemLogged(plannedItem, actualItems);
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

  if (!plannedItems.length) {
    return <p className="px-3 pb-3 text-sm text-slate-500">No foods planned for this meal.</p>;
  }

  return (
    <div className="border-t border-slate-100 px-3 pb-3 pt-2">
      {toggleError && <p className="mb-2 text-sm text-red-600">{toggleError}</p>}
      <ul className="space-y-2">
        {plannedItems.map((item) => {
          const logged = isItemLogged(item);
          return (
            <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300"
                checked={logged}
                disabled={togglingId === item.id}
                onChange={(event) => void togglePlannedItem(item.id, event.target.checked)}
                aria-label={`Log ${item.nameSnapshot} as eaten`}
              />
              <div className={`flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 ${logged ? 'text-slate-500 line-through' : ''}`}>
                <span className="min-w-0">{formatItemLine(item)}</span>
                <span className="shrink-0 text-slate-500">{formatMacros(item)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
