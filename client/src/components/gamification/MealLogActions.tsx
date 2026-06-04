import { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { GamificationCelebration } from '../../types/gamification';

const CATEGORIES = [
  { value: 'DIFFERENT_HEALTHY_OPTION', label: 'Different healthy option' },
  { value: 'RESTAURANT_MEAL', label: 'Restaurant meal' },
  { value: 'LARGER_PORTION', label: 'Larger portion' },
  { value: 'SWEET_TREAT', label: 'Sweet treat' },
  { value: 'SNACK', label: 'Snack' },
  { value: 'ALCOHOL', label: 'Alcohol' },
  { value: 'OTHER', label: 'Other' }
] as const;

export function MealLogActions({
  mealId,
  disabled,
  onLogged
}: {
  mealId: string;
  disabled?: boolean;
  onLogged?: (celebrations: GamificationCelebration[]) => void;
}) {
  const [differentOpen, setDifferentOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('OTHER');
  const [loading, setLoading] = useState(false);

  async function logStatus(status: 'ATE_AS_PLANNED' | 'ATE_SOMETHING_DIFFERENT' | 'SKIPPED_MEAL') {
    setLoading(true);
    try {
      const res = await api<{ celebrations: GamificationCelebration[] }>(
        `/api/gamification/meals/${mealId}/log`,
        {
          method: 'POST',
          body: JSON.stringify(
            status === 'ATE_SOMETHING_DIFFERENT'
              ? { status, actualFoodDescription: description, category }
              : { status }
          )
        }
      );
      setDifferentOpen(false);
      setDescription('');
      onLogged?.(res.celebrations ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-app-border pt-4">
      <p className="text-xs text-app-text-muted">
        Plans change. Log what actually happened so your progress reflects real life.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={disabled || loading}
          onClick={() => void logStatus('ATE_AS_PLANNED')}
          className="text-xs"
        >
          Ate as planned
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || loading}
          onClick={() => setDifferentOpen(true)}
          className="text-xs"
        >
          Ate something different
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || loading}
          onClick={() => void logStatus('SKIPPED_MEAL')}
          className="text-xs"
        >
          Skipped meal
        </Button>
      </div>

      <Modal open={differentOpen} title="What did you have instead?" onClose={() => setDifferentOpen(false)}>
        <div className="space-y-4">
          <textarea
            className="w-full rounded-xl border border-app-border bg-app-bg p-3 text-sm"
            rows={3}
            placeholder="Describe what you ate"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <p className="text-xs font-medium text-app-text-muted mb-2">Quick category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    category === c.value
                      ? 'bg-brand-green text-brand-navy'
                      : 'bg-app-muted text-app-text-muted hover:text-app-text'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            disabled={!description.trim() || loading}
            onClick={() => void logStatus('ATE_SOMETHING_DIFFERENT')}
            className="w-full"
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
