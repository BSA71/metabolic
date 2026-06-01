import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { ExercisePlanTemplateSummary } from '../types';
import { CloneExerciseDayDialog } from '../components/admin/CloneExerciseDayDialog';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function AdminExerciseTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ExercisePlanTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTemplates(await api<ExercisePlanTemplateSummary[]>('/api/admin/exercise-templates'));
    } catch (err) {
      setTemplates([]);
      setError(err instanceof Error ? err.message : 'Unable to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTemplate() {
    const name = window.prompt('Template name');
    if (!name?.trim()) return;
    setCreating(true);
    try {
      const template = await api<{ id: string }>('/api/admin/exercise-templates', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), visibility: 'GLOBAL' })
      });
      navigate(`/admin/exercise-templates/${template.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create template');
    } finally {
      setCreating(false);
    }
  }

  async function cloneTemplate(id: string, currentName: string) {
    const name = window.prompt('Clone name', `${currentName} (Copy)`);
    if (!name?.trim()) return;
    try {
      const template = await api<{ id: string }>(`/api/admin/exercise-templates/${id}/clone`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() })
      });
      await load();
      navigate(`/admin/exercise-templates/${template.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to clone template');
    }
  }

  async function deleteTemplate(id: string, name: string) {
    if (!window.confirm(`Delete template "${name}"?`)) return;
    try {
      await api(`/api/admin/exercise-templates/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete template');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin" className="text-sm text-slate-500 hover:text-slate-700">
            ← Admin
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Exercise Templates</h1>
          <p className="text-slate-500">Create and manage daily exercise plan templates.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setCloneDialogOpen(true)}>
            Clone from user day
          </Button>
          <Button type="button" disabled={creating} onClick={() => void createTemplate()}>
            <Plus className="mr-1 inline h-4 w-4" />
            New template
          </Button>
        </div>
      </div>

      <Card>
        {loading && <p className="text-sm text-slate-500">Loading templates…</p>}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Exercises</th>
                  <th className="py-3 pr-4 font-medium">Visibility</th>
                  <th className="py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{template.name}</p>
                      {template.description && <p className="text-xs text-slate-500">{template.description}</p>}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{template.exerciseCount} exercises</td>
                    <td className="py-3 pr-4 text-slate-600">{template.visibility}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Edit"
                          className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                          onClick={() => navigate(`/admin/exercise-templates/${template.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Clone"
                          className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                          onClick={() => void cloneTemplate(template.id, template.name)}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          className="grid h-9 w-9 place-items-center rounded-xl text-red-500 hover:bg-red-50"
                          onClick={() => void deleteTemplate(template.id, template.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No templates yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CloneExerciseDayDialog
        open={cloneDialogOpen}
        onClose={() => setCloneDialogOpen(false)}
        onCreated={(id) => navigate(`/admin/exercise-templates/${id}`)}
      />
    </div>
  );
}
