import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Program, ProgramMetric } from '../types';
import { ProgramDonutSummary } from '../components/program/ProgramDonutSummary';
import { ProgramMetricTable, type MetricEditTarget, type MetricField } from '../components/program/ProgramMetricTable';
import { Button } from '../components/ui/Button';

function normalizeMetric(metric: ProgramMetric): ProgramMetric {
  return {
    ...metric,
    startValue: Number(metric.startValue),
    currentValue: Number(metric.currentValue),
    goalValue: Number(metric.goalValue)
  };
}

function metricsEqual(a: ProgramMetric[], b: ProgramMetric[]) {
  return a.every((metric) => {
    const other = b.find((row) => row.id === metric.id);
    if (!other) return false;
    return (
      Number(metric.startValue) === Number(other.startValue) &&
      Number(metric.currentValue) === Number(other.currentValue) &&
      Number(metric.goalValue) === Number(other.goalValue)
    );
  });
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; program: Program | null };

export function ProgramPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [draftMetrics, setDraftMetrics] = useState<ProgramMetric[]>([]);
  const [editing, setEditing] = useState<MetricEditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProgram = useCallback(() => {
    api<Program | null>('/api/programs/active')
      .then((active) => {
        setLoadState({ status: 'loaded', program: active });
        setDraftMetrics((active?.metrics ?? []).map(normalizeMetric));
        setEditing(null);
      })
      .catch(() => setLoadState({ status: 'error' }));
  }, []);

  useEffect(() => { loadProgram(); }, [loadProgram]);

  const program = loadState.status === 'loaded' ? loadState.program : null;

  const dirty = useMemo(() => {
    if (!program) return false;
    return !metricsEqual(program.metrics.map(normalizeMetric), draftMetrics);
  }, [program, draftMetrics]);

  function updateMetric(id: string, field: MetricField, value: number) {
    setDraftMetrics((current) =>
      current.map((metric) => (metric.id === id ? { ...metric, [field]: value } : metric))
    );
  }

  async function saveMetrics() {
    if (!program || !dirty) return;
    setSaving(true);
    setError('');
    try {
      const payload = draftMetrics.map((metric) => ({
        id: metric.id,
        startValue: Number(metric.startValue),
        currentValue: Number(metric.currentValue),
        goalValue: Number(metric.goalValue)
      }));
      if (payload.some((metric) => [metric.startValue, metric.currentValue, metric.goalValue].some((value) => !Number.isFinite(value)))) {
        throw new Error('Please enter valid numbers before saving.');
      }
      await api(`/api/programs/${program.id}/metrics`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      await loadProgram();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save metrics');
    } finally {
      setSaving(false);
    }
  }

  if (loadState.status === 'loading') return <p>Loading program...</p>;
  if (loadState.status === 'error') return <p className="text-red-600">Failed to load program. Please try again.</p>;
  if (!program) return <p>No active program found. Create or activate a program to get started.</p>;

  return (
    <>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold">{program.name}</h1>
          <p className="text-slate-500">Start, current, and goal metrics in one compact view.</p>
        </div>
        <ProgramDonutSummary metrics={draftMetrics} />
        <ProgramMetricTable
          metrics={draftMetrics}
          editing={editing}
          onStartEdit={setEditing}
          onChange={updateMetric}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {dirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button className="shadow-lg" disabled={saving} onClick={saveMetrics}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      )}
    </>
  );
}
