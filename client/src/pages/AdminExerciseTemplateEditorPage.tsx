import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { ExercisePlanTemplate, ExerciseTemplateItem } from '../types';
import { EditTemplateExerciseDrawer } from '../components/admin/EditTemplateExerciseDrawer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

function formatPlan(item: ExerciseTemplateItem) {
  if (item.sets != null) {
    const weight = item.weight != null ? ` @ ${item.weight} lbs` : '';
    return `${item.sets} sets × ${item.reps ?? '—'} reps${weight}`;
  }
  if (item.durationMinutes != null) return `${item.durationMinutes} min`;
  if (item.weight != null) return `${item.weight} lbs`;
  return 'No prescription set';
}

function reorderIds(ids: string[], fromId: string, toId: string) {
  const fromIndex = ids.indexOf(fromId);
  const toIndex = ids.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return ids;
  const next = [...ids];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, fromId);
  return next;
}

function rowTargetId(clientY: number, orderedIds: string[], rowRefs: Map<string, HTMLDivElement>) {
  for (const id of orderedIds) {
    const el = rowRefs.get(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) return id;
  }
  return orderedIds[orderedIds.length - 1] ?? null;
}

export function AdminExerciseTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<ExercisePlanTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExerciseTemplateItem>();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const orderedIdsRef = useRef<string[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    visibility: 'GLOBAL' as 'GLOBAL' | 'USER'
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api<ExercisePlanTemplate>(`/api/admin/exercise-templates/${id}`);
      setTemplate(data);
      setOrderedIds(data.items.map((item) => item.id));
      orderedIdsRef.current = data.items.map((item) => item.id);
      setDraft({
        name: data.name,
        description: data.description ?? '',
        visibility: data.visibility
      });
    } catch (err) {
      setTemplate(null);
      setError(err instanceof Error ? err.message : 'Unable to load template');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    orderedIdsRef.current = orderedIds;
  }, [orderedIds]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !id) return;

    function handlePointerMove(event: PointerEvent) {
      const draggingId = activeIdRef.current;
      if (!draggingId) return;
      const targetId = rowTargetId(event.clientY, orderedIdsRef.current, rowRefs.current);
      if (!targetId || targetId === draggingId) return;
      setOrderedIds((current) => {
        const next = reorderIds(current, draggingId, targetId);
        orderedIdsRef.current = next;
        return next;
      });
    }

    async function finishDrag() {
      const nextIds = orderedIdsRef.current;
      setActiveId(null);
      activeIdRef.current = null;
      if (!id) return;
      try {
        await api(`/api/admin/exercise-templates/${id}/reorder`, {
          method: 'POST',
          body: JSON.stringify({ orderedIds: nextIds })
        });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to reorder exercises');
        await load();
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [activeId, id, load]);

  async function saveMetadata() {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api<ExercisePlanTemplate>(`/api/admin/exercise-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          visibility: draft.visibility
        })
      });
      setTemplate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save template');
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!window.confirm('Remove this exercise from the template?')) return;
    try {
      await api(`/api/admin/exercise-template-items/${itemId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove exercise');
    }
  }

  const orderedItems = orderedIds
    .map((itemId) => template?.items.find((item) => item.id === itemId))
    .filter((item): item is ExerciseTemplateItem => Boolean(item));

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/exercise-templates" className="text-sm text-slate-500 hover:text-slate-700">
          ← Exercise Templates
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{template?.name ?? 'Template editor'}</h1>
        <p className="text-slate-500">Edit template details and planned exercises.</p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading template…</p>}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{error}</p>
        </div>
      )}

      {template && (
        <>
          <Card>
            <h2 className="text-lg font-bold">Template details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Name</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Description</span>
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  rows={2}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Visibility</span>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={draft.visibility}
                  onChange={(event) => setDraft({ ...draft, visibility: event.target.value as 'GLOBAL' | 'USER' })}
                >
                  <option value="GLOBAL">GLOBAL (users can select)</option>
                  <option value="USER">USER (hidden from users)</option>
                </select>
              </label>
            </div>
            <div className="mt-4">
              <Button type="button" disabled={saving} onClick={() => void saveMetadata()}>
                {saving ? 'Saving…' : 'Save details'}
              </Button>
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Planned exercises</h2>
              <p className="text-sm text-slate-500">{orderedItems.length} exercises in this template</p>
            </div>
            <Button type="button" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1 inline h-4 w-4" />
              Add exercise
            </Button>
          </div>

          {orderedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No exercises yet. Add one to build this template.
            </div>
          ) : (
            <div className="space-y-2">
              {orderedItems.map((item) => (
                <div
                  key={item.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(item.id, node);
                    else rowRefs.current.delete(item.id);
                  }}
                  className={`flex items-stretch gap-1 rounded-2xl border bg-white py-3 pl-1 pr-4 shadow-sm ${
                    activeId === item.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Reorder ${item.exercise.name}`}
                    title="Drag to reorder"
                    className="flex shrink-0 touch-none cursor-grab items-center self-stretch rounded-lg px-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:cursor-grabbing"
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.preventDefault();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setActiveId(item.id);
                      activeIdRef.current = item.id;
                    }}
                  >
                    <GripVertical size={18} />
                  </div>
                  <div className={`min-w-0 flex-1 px-2 ${activeId ? 'pointer-events-none select-none' : ''}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.exercise.name}</p>
                        {item.exercise.bodyPart && (
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.exercise.bodyPart}</p>
                        )}
                        <p className="mt-1 text-sm text-slate-500">{formatPlan(item)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Edit"
                          className="grid h-9 w-9 place-items-center rounded-xl text-blue-600 hover:bg-blue-50"
                          onClick={() => setEditItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Remove"
                          className="grid h-9 w-9 place-items-center rounded-xl text-red-500 hover:bg-red-50"
                          onClick={() => void removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <EditTemplateExerciseDrawer
        open={addOpen}
        templateId={id}
        onClose={() => setAddOpen(false)}
        onSaved={() => void load()}
      />

      <EditTemplateExerciseDrawer
        open={Boolean(editItem)}
        templateId={id}
        item={editItem}
        onClose={() => setEditItem(undefined)}
        onSaved={() => void load()}
      />
    </div>
  );
}
