import type { BloodPanelMetricValue, BloodPanelStatus } from '../../types';

export const BLOOD_PANEL_STATUS_STYLES: Record<BloodPanelStatus, string> = {
  low: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100',
  normal: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100',
  high: 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100',
  unknown: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-app-border dark:bg-app-muted dark:text-app-text'
};

export function bloodPanelStatusLabel(status: BloodPanelStatus | null) {
  if (!status) return null;
  if (status === 'normal') return 'Normal';
  if (status === 'low') return 'Low';
  if (status === 'high') return 'High';
  return 'Unknown';
}

export function bloodPanelTrendLabel(trend: BloodPanelMetricValue['trend']) {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  if (trend === 'same') return '→';
  return null;
}

export function BloodPanelMetricCard({ metric, compact = false }: { metric: BloodPanelMetricValue; compact?: boolean }) {
  if (metric.value == null) return null;
  const status = metric.status ?? 'unknown';

  return (
    <div className={`rounded-xl border ${BLOOD_PANEL_STATUS_STYLES[status]} ${compact ? 'p-2.5' : 'p-3'}`}>
      <p className={`font-bold uppercase tracking-wide opacity-80 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        {metric.label}
      </p>
      <p className={`font-bold ${compact ? 'mt-0.5 text-base' : 'mt-1 text-lg'}`}>
        {metric.value} {metric.unit}
        {bloodPanelTrendLabel(metric.trend) ? (
          <span className={`ml-1 ${compact ? 'text-xs' : 'text-sm'}`}>{bloodPanelTrendLabel(metric.trend)}</span>
        ) : null}
      </p>
      {bloodPanelStatusLabel(metric.status) ? (
        <p className={`font-semibold ${compact ? 'mt-0.5 text-[10px]' : 'mt-1 text-xs'}`}>
          {bloodPanelStatusLabel(metric.status)}
        </p>
      ) : null}
      {metric.referenceRange && !compact ? (
        <p className="mt-1 text-[11px] opacity-80">Normal: {metric.referenceRange.normal}</p>
      ) : null}
    </div>
  );
}
