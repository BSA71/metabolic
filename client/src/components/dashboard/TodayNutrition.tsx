import { useRef, useState } from 'react';
import { Camera, ChevronDown, Plus, X } from 'lucide-react';
import type { Meal, MealItem } from '../../types';
import { api } from '../../services/api';
import { PlannedItemChecklist } from '../nutrition/PlannedItemChecklist';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

type LookupResult = {
  items: Array<{
    source: 'existing' | 'ai';
    food?: {
      id: string;
      name: string;
      servingUnit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    lookup?: { id: string };
    estimate?: Pick<MealItem, 'calories' | 'protein' | 'carbs' | 'fat'> & { normalizedFoodName: string };
  }>;
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] ?? '' : result);
    };
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function mealHintIndex(value: string) {
  if (value === 'first' || value === '1st') return 0;
  if (value === 'second' || value === '2nd') return 1;
  if (value === 'third' || value === '3rd') return 2;
  if (value === 'fourth' || value === '4th') return 3;
  if (value === 'fifth' || value === '5th') return 4;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed - 1 : null;
}

function parseFoodEntry(meals: Meal[], input: string, expandedMealId: string | null) {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? '';
  const lowerFirstLine = firstLine.toLowerCase();
  const numberedMeal = lowerFirstLine.match(/^(\d+)\s*[\).:-]?\s*(.+)$/);
  const ordinalSnack = lowerFirstLine.match(/^(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\s+snack\s*[\).:-]?$/);
  let targetMeal: Meal | undefined;
  let foodLines = lines;

  if (numberedMeal) {
    const mealNumber = Number(numberedMeal[1]);
    const label = numberedMeal[2]?.trim() ?? '';
    const byNumber = meals.find((meal) => meal.mealNumber === mealNumber);
    const labelMatchesMeal = byNumber && byNumber.name.toLowerCase() === label;
    if (labelMatchesMeal || ['breakfast', 'snack', 'lunch', 'dinner'].includes(label)) {
      targetMeal = byNumber;
      foodLines = lines.slice(1);
    }
  } else if (ordinalSnack) {
    const snacks = meals.filter((meal) => meal.name.toLowerCase().includes('snack'));
    const snackIndex = mealHintIndex(ordinalSnack[1]);
    targetMeal = snackIndex == null ? undefined : snacks[snackIndex];
    foodLines = lines.slice(1);
  } else {
    const explicitMeal = meals.find((meal) => meal.name.toLowerCase() === lowerFirstLine);
    if (explicitMeal || ['breakfast', 'snack', 'lunch', 'dinner'].includes(lowerFirstLine)) {
      targetMeal =
        explicitMeal ?? meals.find((meal) => meal.name.toLowerCase().includes(lowerFirstLine));
      foodLines = lines.slice(1);
    }
  }

  const foodText = foodLines.join('\n').trim();
  const expandedMeal = expandedMealId ? meals.find((meal) => meal.id === expandedMealId) : undefined;
  return { targetMeal: targetMeal ?? expandedMeal ?? selectSnackFallback(meals), foodText };
}

function selectSnackFallback(meals: Meal[]) {
  const snacks = meals.filter((meal) => meal.name.toLowerCase().includes('snack'));
  if (snacks.length) return new Date().getHours() < 12 ? snacks[0] : snacks[1] ?? snacks[0];
  return meals[0];
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

export function TodayNutrition({
  meals,
  onChange
}: {
  meals: Meal[];
  onChange: () => void | Promise<void>;
}) {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [entry, setEntry] = useState('');
  const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function toggleMeal(mealId: string) {
    setExpandedMealId((current) => (current === mealId ? null : mealId));
  }

  function clearPhoto() {
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }

  function selectPhoto(file: File) {
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }

  async function addFood() {
    const input = entry.trim();
    if (!input && !photo) return;
    const { targetMeal, foodText } = parseFoodEntry(meals, input, expandedMealId);
    if (!targetMeal) {
      setError('No meal is available for today.');
      return;
    }
    if (!foodText && !photo) {
      setError('Add the food on the line after the meal name.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const lookup = photo
        ? await api<LookupResult>('/api/ai/food-lookup/photo', {
            method: 'POST',
            body: JSON.stringify({
              imageBase64: await fileToBase64(photo.file),
              mimeType: photo.file.type,
              inputText: foodText
            })
          })
        : await api<LookupResult>('/api/ai/food-lookup', {
            method: 'POST',
            body: JSON.stringify({ inputText: foodText })
          });

      const lookupIds = lookup.items
        .filter((item) => item.source === 'ai' && item.lookup?.id && item.estimate)
        .map((item) => item.lookup!.id);
      if (lookupIds.length) {
        await api('/api/ai/food-lookup/accept-batch', {
          method: 'POST',
          body: JSON.stringify({ lookupIds, mealId: targetMeal.id, type: 'ACTUAL' })
        });
      }

      await Promise.all(
        lookup.items
          .filter((item) => item.source === 'existing' && item.food)
          .map((item) =>
            api(`/api/meals/${targetMeal.id}/items`, {
              method: 'POST',
              body: JSON.stringify({
                foodId: item.food!.id,
                type: 'ACTUAL',
                nameSnapshot: item.food!.name,
                quantity: 1,
                unit: item.food!.servingUnit,
                calories: Number(item.food!.calories),
                protein: Number(item.food!.protein),
                carbs: Number(item.food!.carbs),
                fat: Number(item.food!.fat)
              })
            })
          )
      );

      if (!lookup.items.length) throw new Error('Could not estimate nutrition for that food.');
      await api(`/api/gamification/meals/${targetMeal.id}/log`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'ATE_SOMETHING_DIFFERENT',
          actualFoodDescription: foodText || 'Dashboard quick add'
        })
      });
      setEntry('');
      clearPhoto();
      setExpandedMealId(targetMeal.id);
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add food.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-brand-navy dark:text-brand-off-white">Today&apos;s Nutrition</h2>
      <div className="space-y-3">
        {meals.map((meal) => {
          const expanded = expandedMealId === meal.id;
          const plannedCount = (meal.items ?? []).filter((item) => item.type === 'PLANNED').length;
          const plannedTime = formatPlannedTime(meal.plannedTime);

          return (
            <div key={meal.id} className="overflow-hidden rounded-2xl bg-app-muted">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-3 text-left"
                onClick={() => toggleMeal(meal.id)}
                aria-expanded={expanded}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-app-text">
                    {meal.mealNumber}. {plannedTime ? `${meal.name} - ${plannedTime}` : meal.name}
                  </p>
                  <p className="text-sm text-app-text-muted">
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
                    className={`text-app-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              {expanded && <PlannedItemChecklist meal={meal} onChange={onChange} />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 border-t border-app-border pt-4">
        <p className="mb-2 text-sm font-medium text-app-text">Add food directly</p>
        <div className="flex gap-2">
          <textarea
            className="min-h-24 flex-1 rounded-xl border border-app-border bg-app-bg p-3 text-sm"
            placeholder="Type what you ate, or mention a meal like lunch. If no meal is named, snacks are used automatically."
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl border border-app-border bg-app-muted text-app-text-muted transition hover:border-brand-green/40 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Upload food photo"
              title="Upload food photo"
              disabled={saving}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={20} />
            </button>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl bg-brand-navy text-brand-off-white shadow-sm transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-green dark:text-brand-navy dark:hover:bg-brand-green-light"
              aria-label="Add food"
              title="Add food"
              disabled={saving || (!entry.trim() && !photo)}
              onClick={() => void addFood()}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={saving}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectPhoto(file);
            event.target.value = '';
          }}
        />
        {photo && (
          <div className="relative mt-3 overflow-hidden rounded-xl border border-app-border">
            <img src={photo.previewUrl} alt="Food preview" className="h-36 w-full object-cover" />
            <button
              type="button"
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"
              aria-label="Remove food photo"
              disabled={saving}
              onClick={clearPhoto}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {saving && <p className="mt-2 text-sm text-app-text-muted">Adding food…</p>}
      </div>
    </Card>
  );
}
