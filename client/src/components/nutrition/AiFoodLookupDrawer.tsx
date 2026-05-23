import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

export function AiFoodLookupDrawer({ open, mealId, onClose, onSaved }: { open: boolean; mealId?: string; onClose: () => void; onSaved: () => void }) {
  const [input, setInput] = useState('6 oz grilled chicken breast');
  const [result, setResult] = useState<any>(null);
  useEffect(() => { setResult(null); setInput('6 oz grilled chicken breast'); }, [open, mealId]);
  async function lookup() { setResult(await api('/api/ai/food-lookup', { method: 'POST', body: JSON.stringify({ inputText: input }) })); }
  async function accept() { if (!result?.lookup?.id) return; await api(`/api/ai/food-lookup/${result.lookup.id}/accept`, { method: 'POST', body: JSON.stringify({ mealId }) }); onSaved(); onClose(); }
  return <Drawer open={open} title="AI Food Lookup" onClose={onClose}><div className="space-y-4"><textarea className="h-28 w-full rounded-2xl border border-slate-200 p-3" value={input} onChange={(event) => setInput(event.target.value)} /><Button onClick={lookup}>Estimate nutrition</Button>{result?.estimate && <div className="rounded-2xl bg-slate-50 p-4"><p className="font-bold">{result.estimate.normalizedFoodName}</p><p>{result.estimate.calories} kcal, {result.estimate.protein}g protein, {result.estimate.carbs}g carbs, {result.estimate.fat}g fat</p><Button className="mt-3" onClick={accept}>Accept and save</Button></div>}{result?.food && <p className="rounded-2xl bg-emerald-50 p-4">Found existing food: {result.food.name}</p>}</div></Drawer>;
}
