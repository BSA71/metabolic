import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/Card';

export function WeightTrendChart({ data }: { data: { date: string; weight: number }[] }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-brand-navy dark:text-brand-off-white">Weight Trend</h2>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              stroke="var(--app-text-muted)"
              tick={{ fill: 'var(--app-text-muted)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                borderRadius: '12px',
                color: 'var(--app-text)'
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--app-chart-line)"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
