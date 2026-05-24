import { useEffect, useState } from 'react';
import { api, todayKey } from '../services/api';
import type { Exercise } from '../types';
import { ExerciseChecklist } from '../components/exercise/ExerciseChecklist';

export function ExercisePage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const load = () => api<Exercise[]>(`/api/daily-logs/${todayKey()}/exercises`).then(setExercises);
  useEffect(() => { load(); }, []);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Exercise</h1><p className="text-slate-500">Simple checklist with mark-done and skip actions.</p></div><ExerciseChecklist exercises={exercises} onChange={load} /></div>;
}
