import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from '../ui/Card';

type Definitions = {
  levels: Array<{ id: string; name: string; order: number }>;
  badges: Array<{ id: string; name: string; category: string }>;
};

export function AdminGamificationPanel() {
  const [defs, setDefs] = useState<Definitions | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Definitions>('/api/gamification/admin/definitions')
      .then(setDefs)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!defs) return <p className="text-app-text-muted text-sm">Loading definitions…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="font-bold">Levels ({defs.levels.length})</h2>
        <p className="mt-1 text-sm text-app-text-muted">
          Levels are defined in code and synced to the database. Future admin editing can extend this panel.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {defs.levels.map((l) => (
            <li key={l.id}>
              {l.order}. {l.name}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-bold">Badges ({defs.badges.length})</h2>
        <p className="mt-1 text-sm text-app-text-muted">
          Badge thresholds and tiers are configurable via definitions. Preview the user journey from the Level Up screen.
        </p>
        <ul className="mt-4 max-h-64 overflow-y-auto space-y-1 text-sm">
          {defs.badges.map((b) => (
            <li key={b.id}>
              {b.name} <span className="text-app-text-muted">({b.category})</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
