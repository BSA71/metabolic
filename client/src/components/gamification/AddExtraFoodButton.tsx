import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function AddExtraFoodButton({
  date,
  onAdded
}: {
  date: string;
  onAdded: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api('/api/gamification/food/extra', {
        method: 'POST',
        body: JSON.stringify({ date, nameSnapshot: name.trim() })
      });
      setName('');
      setOpen(false);
      await onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus size={18} /> Add something else I ate
      </Button>
      <Modal open={open} title="Add food outside your plan" onClose={() => setOpen(false)}>
        <p className="text-sm text-app-text-muted mb-3">
          Plans change. Log what actually happened so your progress reflects real life.
        </p>
        <input
          className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm"
          placeholder="What did you eat?"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button className="mt-4 w-full" disabled={loading || !name.trim()} onClick={() => void submit()}>
          Log food
        </Button>
      </Modal>
    </>
  );
}
