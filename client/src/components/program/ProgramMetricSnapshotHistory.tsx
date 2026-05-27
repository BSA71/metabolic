import type { ProgramMetricSnapshot } from '../../types';
import { isToday, parseDateKey } from '../../services/api';
import { Card } from '../ui/Card';

type Props = {
  snapshots: ProgramMetricSnapshot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

function formatSnapshotDate(date: string) {
  const label = parseDateKey(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
  return isToday(date) ? `${label} (today)` : label;
}

function snapshotValue(snapshot: ProgramMetricSnapshot, metricType: string) {
  const value = snapshot.values.find((row) => row.metricType === metricType);
  return value ? `${Number(value.currentValue).toFixed(1)} ${value.unit}` : '—';
}

export function ProgramMetricSnapshotHistory({ snapshots, selectedId, onSelect }: Props) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <h2 className="mb-1 text-lg font-bold">Saved Snapshots</h2>
        <p className="text-sm text-slate-500">Save today&apos;s current values to start tracking changes over time.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Saved Snapshots</h2>
      <p className="mb-4 text-sm text-slate-500">Select a date to preview its current metrics in the chart above.</p>
      <div className="space-y-2">
        {snapshots.map((snapshot) => {
          const selected = selectedId === snapshot.id;
          return (
            <button
              key={snapshot.id}
              type="button"
              onClick={() => onSelect(selected ? null : snapshot.id)}
              className={`grid w-full grid-cols-[minmax(0,12rem)_1fr_1fr] gap-x-4 rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="font-semibold">{formatSnapshotDate(snapshot.date)}</span>
              <span className="text-slate-600">
                <span className="text-slate-400">Weight </span>
                {snapshotValue(snapshot, 'WEIGHT')}
              </span>
              <span className="text-slate-600">
                <span className="text-slate-400">Body fat </span>
                {snapshotValue(snapshot, 'BODY_FAT')}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
