import type { ProgramMetric } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export type MetricField = 'startValue' | 'currentValue' | 'goalValue';
export type MetricEditTarget = { id: string; field: MetricField };

type Props = {
  metrics: ProgramMetric[];
  editing: MetricEditTarget | null;
  onStartEdit: (target: MetricEditTarget) => void;
  onChange: (id: string, field: MetricField, value: number) => void;
  onSaveSnapshot: () => void;
  savingSnapshot: boolean;
  todaySnapshotSaved: boolean;
};

const rowGridClass = 'grid grid-cols-[minmax(0,11rem)_1fr_1fr_1fr] gap-x-6 sm:gap-x-10';
const currentColumnClass = 'pl-[10%]';
const goalColumnClass = 'pl-[20%]';

function formatValue(value: number) {
  return Number(value).toFixed(2);
}

function MetricCell({ metric, field, unit, editing, onStartEdit, onChange, className }: {
  metric: ProgramMetric;
  field: MetricField;
  unit: string;
  editing: MetricEditTarget | null;
  onStartEdit: (target: MetricEditTarget) => void;
  onChange: (id: string, field: MetricField, value: number) => void;
  className?: string;
}) {
  const isEditing = editing?.id === metric.id && editing.field === field;
  const value = Number(metric[field]);

  if (isEditing) {
    return (
      <div className={`py-2 ${className ?? ''}`}>
        <input
          autoFocus
          type="number"
          step="0.01"
          className="w-28 rounded-lg border border-blue-300 bg-blue-50 px-2 py-1 text-lg outline-none focus:border-blue-500"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(metric.id, field, Number(event.target.value))}
        />
        <span className="ml-1 text-slate-500">{unit}</span>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer rounded-lg py-3 transition hover:bg-slate-50 ${className ?? ''}`}
      onClick={() => onStartEdit({ id: metric.id, field })}
      title="Click to edit"
    >
      {formatValue(value)} {unit}
    </div>
  );
}

export function ProgramMetricTable({
  metrics,
  editing,
  onStartEdit,
  onChange,
  onSaveSnapshot,
  savingSnapshot,
  todaySnapshotSaved
}: Props) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-bold">Metric Comparison</h2>
          <p className="text-sm text-slate-500">Click any number to edit. Save changes from the button at the bottom right.</p>
        </div>
        <Button variant="secondary" disabled={savingSnapshot} onClick={onSaveSnapshot}>
          {savingSnapshot ? 'Saving snapshot...' : todaySnapshotSaved ? "Update today's snapshot" : "Save today's snapshot"}
        </Button>
      </div>
      <div className="w-full text-lg">
        <div className={`${rowGridClass} text-slate-500`}>
          <div className="py-2">Metric</div>
          <div className="py-2">Start</div>
          <div className={`py-2 ${currentColumnClass}`}>Current</div>
          <div className={`py-2 ${goalColumnClass}`}>Goal</div>
        </div>
        {metrics.map((metric) => (
          <div key={metric.id} className={`${rowGridClass} border-t border-slate-100`}>
            <div className="whitespace-nowrap py-3 font-semibold">
              {metric.metricType.replaceAll('_', ' ')}
            </div>
            <MetricCell
              metric={metric}
              field="startValue"
              unit={metric.unit}
              editing={editing}
              onStartEdit={onStartEdit}
              onChange={onChange}
            />
            <MetricCell
              metric={metric}
              field="currentValue"
              unit={metric.unit}
              editing={editing}
              onStartEdit={onStartEdit}
              onChange={onChange}
              className={currentColumnClass}
            />
            <MetricCell
              metric={metric}
              field="goalValue"
              unit={metric.unit}
              editing={editing}
              onStartEdit={onStartEdit}
              onChange={onChange}
              className={goalColumnClass}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
