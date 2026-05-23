import { useEffect, useState } from 'react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import type { Dashboard } from '../types';
import { Card } from '../components/ui/Card';

export function ProgressPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  useEffect(() => { api<Dashboard>('/api/dashboard/today').then(setData); }, []);
  const macroData = data?.dailyLog ? [{ name: 'Calories', planned: Number(data.dailyLog.calorieTarget), actual: Number(data.dailyLog.caloriesActual) }, { name: 'Protein', planned: Number(data.dailyLog.proteinTarget), actual: Number(data.dailyLog.proteinActual) }] : [];
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Progress</h1><div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 font-bold">Weight over time</h2><div className="h-64"><ResponsiveContainer><LineChart data={data?.weightTrend ?? []}><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="weight" stroke="#0f172a" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Card><Card><h2 className="mb-4 font-bold">Planned vs actual</h2><div className="h-64"><ResponsiveContainer><BarChart data={macroData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="planned" fill="#cbd5e1" /><Bar dataKey="actual" fill="#3b82f6" /></BarChart></ResponsiveContainer></div></Card><Card><h2 className="font-bold">Exercise completion</h2><p className="mt-4 text-4xl font-bold">{data?.dailyLog ? Math.round((Number(data.dailyLog.exercisesCompleted) / Math.max(Number(data.dailyLog.exercisesPlanned), 1)) * 100) : 0}%</p></Card><Card><h2 className="font-bold">Start vs Current vs Goal</h2><p className="mt-4 text-slate-500">See the Program page for compact rings and metric table.</p></Card></div></div>;
}
