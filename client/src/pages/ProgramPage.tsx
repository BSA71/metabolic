import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Program, ProgramMetric } from '../types';
import { ProgramDonutSummary } from '../components/program/ProgramDonutSummary';
import { ProgramMetricTable, type MetricEditTarget, type MetricField } from '../components/program/ProgramMetricTable';
import { ProgramMetricSnapshotHistory } from '../components/program/ProgramMetricSnapshotHistory';
import { Button } from '../components/ui/Button';
import { todayKey } from '../services/api';
import type { ProgramMetricSnapshot } from '../types';

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

function metricsWithSnapshotCurrent(metrics: ProgramMetric[], snapshot: ProgramMetricSnapshot | null) {
  if (!snapshot) return metrics;
  return metrics.map((metric) => {
    const saved = snapshot.values.find((value) => value.metricType === metric.metricType);
    if (!saved) return metric;
    return { ...metric, currentValue: Number(saved.currentValue) };
  });
}

function formatSnapshotLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return `Current (${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })})`;
}

export function ProgramPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [draftMetrics, setDraftMetrics] = useState<ProgramMetric[]>([]);
  const [snapshots, setSnapshots] = useState<ProgramMetricSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MetricEditTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [error, setError] = useState('');
  const [snapshotError, setSnapshotError] = useState('');

  const loadSnapshots = useCallback(async (programId: string) => {
    try {
      const rows = await api<ProgramMetricSnapshot[]>(`/api/programs/${programId}/metric-snapshots`);
      setSnapshots(rows);
      setSelectedSnapshotId((current) => (current && rows.some((row) => row.id === current) ? current : null));
      setSnapshotError('');
    } catch (err) {
      setSnapshots([]);
      setSelectedSnapshotId(null);
      setSnapshotError(err instanceof Error ? err.message : 'Unable to load saved snapshots');
    }
  }, []);

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await api<Program[]>('/api/programs');
      const active = rows[0] ?? null;
      setProgram(active);
      setDraftMetrics((active?.metrics ?? []).map(normalizeMetric));
      setEditing(null);
      if (active) {
        await loadSnapshots(active.id);
      } else {
        setSnapshots([]);
        setSelectedSnapshotId(null);
      }
    } catch (err) {
      setProgram(null);
      setError(err instanceof Error ? err.message : 'Unable to load program');
    } finally {
      setLoading(false);
    }
  }, [loadSnapshots]);

  useEffect(() => {
    void loadProgram();
  }, [loadProgram]);

  const dirty = useMemo(() => {
    if (!program) return false;
    return !metricsEqual(program.metrics.map(normalizeMetric), draftMetrics);
  }, [program, draftMetrics]);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [snapshots, selectedSnapshotId]
  );

  const chartMetrics = useMemo(
    () => metricsWithSnapshotCurrent(draftMetrics, selectedSnapshot),
    [draftMetrics, selectedSnapshot]
  );

  const currentChartLabel = selectedSnapshot ? formatSnapshotLabel(selectedSnapshot.date) : 'Current';
  const todaySnapshot = snapshots.find((snapshot) => snapshot.date === todayKey());

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

  async function saveSnapshot() {
    if (!program) return;
    setSavingSnapshot(true);
    setSnapshotError('');
    try {
      const payload = draftMetrics.map((metric) => ({
        metricType: metric.metricType,
        currentValue: Number(metric.currentValue),
        unit: metric.unit
      }));
      if (payload.some((metric) => !Number.isFinite(metric.currentValue))) {
        throw new Error('Please enter valid current values before saving a snapshot.');
      }
      const snapshot = await api<ProgramMetricSnapshot>(`/api/programs/${program.id}/metric-snapshots`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await loadSnapshots(program.id);
      setSelectedSnapshotId(snapshot.id);
    } catch (err) {
      setSnapshotError(err instanceof Error ? err.message : 'Unable to save snapshot');
    } finally {
      setSavingSnapshot(false);
    }
  }

  if (loading) return <p>Loading program...</p>;
  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-xl font-bold">Program could not load</h1>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }
  if (!program) {
    return (
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900">
        <h1 className="text-xl font-bold">No program yet</h1>
        <p className="mt-2 text-sm">Your account does not have a program attached yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold">{program.name}</h1>
          <p className="text-slate-500">Start, current, and goal metrics in one compact view.</p>
        </div>
        <ProgramDonutSummary metrics={chartMetrics} currentLabel={currentChartLabel} />
        <ProgramMetricTable
          metrics={draftMetrics}
          editing={editing}
          onStartEdit={setEditing}
          onChange={updateMetric}
          onSaveSnapshot={saveSnapshot}
          savingSnapshot={savingSnapshot}
          todaySnapshotSaved={Boolean(todaySnapshot)}
        />
        <ProgramMetricSnapshotHistory
          snapshots={snapshots}
          selectedId={selectedSnapshotId}
          onSelect={setSelectedSnapshotId}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {snapshotError && <p className="text-sm text-red-600">{snapshotError}</p>}
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
