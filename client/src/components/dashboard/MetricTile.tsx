import { Card } from '../ui/Card';

export function MetricTile({ label, value, subtext, onClick }: { label: string; value: string; subtext?: string; onClick?: () => void }) {
  return (
    <Card onClick={onClick} className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-app-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-app-text">{value}</p>
      {subtext && <p className="mt-1 text-xs text-app-text-muted">{subtext}</p>}
    </Card>
  );
}
