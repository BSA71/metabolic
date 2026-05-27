import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/Card';

export function WeightTrendChart({ data }: { data: { date: string; weight: number }[] }) {
  return <Card><h2 className="mb-4 text-lg font-bold dark:text-white">Weight Trend</h2><div className="h-64"><ResponsiveContainer><LineChart data={data}><XAxis dataKey="date" hide /><YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: '#888' }} /><Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} /><Line type="monotone" dataKey="weight" stroke="var(--color-brand-yellow)" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></Card>;
}
