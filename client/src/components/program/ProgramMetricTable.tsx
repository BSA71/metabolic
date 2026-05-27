import type { ProgramMetric } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type Props = {
  metrics: ProgramMetric[];
  onEdit: () => void;
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

export function ProgramMetricTable({ metrics, onEdit, onSaveSnapshot, savingSnapshot, todaySnapshotSaved }: Props) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-bold">Metric Comparison</h2>
          <p className="text-sm text-slate-500">Use edit to update start, current, and goal values.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onEdit}>
            Edit metrics
          </Button>
          <Button variant="secondary" disabled={savingSnapshot} onClick={onSaveSnapshot}>
            {savingSnapshot ? 'Saving snapshot...' : todaySnapshotSaved ? "Update today's snapshot" : "Save today's snapshot"}
          </Button>
        </div>
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
            <div className="whitespace-nowrap py-3 font-semibold">{metric.metricType.replaceAll('_', ' ')}</div>
            <div className="py-3">
              {formatValue(Number(metric.startValue))} {metric.unit}
            </div>
            <div className={`py-3 ${currentColumnClass}`}>
              {formatValue(Number(metric.currentValue))} {metric.unit}
            </div>
            <div className={`py-3 ${goalColumnClass}`}>
              {formatValue(Number(metric.goalValue))} {metric.unit}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
