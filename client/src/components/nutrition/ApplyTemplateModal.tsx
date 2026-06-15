import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Meal, NutritionPlanTemplateSummary } from '../../types';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

function formatMacros(template: NutritionPlanTemplateSummary) {
  return `${Math.round(template.calorieTarget)} kcal · ${Math.round(template.proteinTarget)}g protein · ${Math.round(template.carbTarget)}g carbs · ${Math.round(template.fatTarget)}g fat`;
}

export function ApplyTemplateModal({
  open,
  selectedDate,
  meals,
  onClose,
  onApplied
}: {
  open: boolean;
  selectedDate: string;
  meals: Meal[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [templates, setTemplates] = useState<NutritionPlanTemplateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [applying, setApplying] = useState(false);

  const hasActuals = meals.some((meal) => meal.items.some((item) => item.type === 'ACTUAL'));

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    api<NutritionPlanTemplateSummary[]>('/api/nutrition-templates')
      .then((rows) => {
        setTemplates(rows);
        setSelectedId(rows[0]?.id ?? null);
      })
      .catch((err) => {
        setTemplates([]);
        setError(err instanceof Error ? err.message : 'Unable to load templates');
      })
      .finally(() => setLoading(false));
  }, [open]);

  async function apply() {
    if (!selectedId) return;
    setApplying(true);
    setError('');
    try {
      await api(`/api/daily-logs/${selectedDate}/apply-template`, {
        method: 'POST',
        body: JSON.stringify({ templateId: selectedId, setAsDefault })
      });
      onApplied();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply template');
    } finally {
      setApplying(false);
    }
  }

  return (
    <Drawer open={open} title="Use nutrition template" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Apply a template to <strong>{selectedDate}</strong>. This replaces planned meals and macro targets for that day.
        </p>

        {hasActuals && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This day has logged meals. Applying a template will remove existing planned and logged items for this day.
          </div>
        )}

        {loading && <p className="text-sm text-slate-500">Loading templates…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && templates.length === 0 && !error && (
          <p className="text-sm text-slate-500">No templates available. Ask an admin to create one.</p>
        )}

        {!loading && templates.length > 0 && (
          <ul className="space-y-2">
            {templates.map((template) => {
              const selected = selectedId === template.id;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedId(template.id)}
                  >
                    <p className="font-semibold">{template.name}</p>
                    {template.description && <p className="mt-1 text-sm text-slate-500">{template.description}</p>}
                    <p className="mt-2 text-xs text-slate-500">{formatMacros(template)}</p>
                    <p className="text-xs text-slate-400">
                      {template.mealCount} meals · {template.itemCount} food items
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={setAsDefault}
            onChange={(event) => setSetAsDefault(event.target.checked)}
          />
          <span>Use as my default plan for future days</span>
        </label>

        <Button type="button" className="w-full" disabled={!selectedId || applying} onClick={() => void apply()}>
          {applying ? 'Applying…' : 'Apply template'}
        </Button>
      </div>
    </Drawer>
  );
}
