import { Card } from '../ui/Card';
import type { Dashboard } from '../../types';

export function MacroProgress({ dashboard }: { dashboard: Dashboard }) {
  const log = dashboard.dailyLog;
  const rows = log
    ? [
        ['Calories', log.caloriesActual, log.calorieTarget],
        ['Protein', log.proteinActual, log.proteinTarget],
        ['Carbs', log.carbsActual, log.carbTarget],
        ['Fat', log.fatActual, log.fatTarget]
      ]
    : [];

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">Macro Status</h2>
      <div className="space-y-4">
        {rows.map(([label, actual, target]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{label}</span>
              <span className="text-app-text-muted">
                {Math.round(Number(actual))} / {Math.round(Number(target))}
              </span>
            </div>
            <div className="h-3 rounded-full bg-[var(--app-progress-track)]">
              <div
                className="h-3 rounded-full bg-brand"
                style={{ width: `${Math.min((Number(actual) / Number(target)) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
