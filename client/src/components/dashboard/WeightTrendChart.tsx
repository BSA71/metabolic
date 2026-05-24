import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/Card';

export function WeightTrendChart({ data }: { data: { date: string; weight: number }[] }) {
  return <Card><h2 className="mb-4 text-lg font-bold">Weight Trend</h2><div className="h-64"><ResponsiveContainer><LineChart data={data}><XAxis dataKey="date" hide /><YAxis domain={['dataMin - 5', 'dataMax + 5']} /><Tooltip /><Line type="monotone" dataKey="weight" stroke="#0f172a" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></Card>;
}
