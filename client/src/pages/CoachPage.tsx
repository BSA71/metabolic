import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, todayKey } from '../services/api';
import type { CoachClient, Dashboard, ExercisePlanTemplateSummary, NutritionPlanTemplateSummary } from '../types';
import type { GamificationDashboard } from '../types/gamification';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type CoachSettings = {
  coachCode: string | null;
  defaultNutritionTemplateId: string | null;
  defaultExerciseTemplateId: string | null;
};

function clientName(client: CoachClient) {
  return `${client.firstName} ${client.lastName}`;
}

function completion(completed?: number, planned?: number) {
  if (!planned) return 'No plan yet';
  return `${completed ?? 0}/${planned}`;
}

function latestWeight(client: CoachClient) {
  return client.activeProgram?.currentWeight ?? client.latestProgressSnapshot?.weight ?? null;
}

export function CoachPage() {
  const [clients, setClients] = useState<CoachClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [engagement, setEngagement] = useState<GamificationDashboard | null>(null);
  const [nutritionTemplates, setNutritionTemplates] = useState<NutritionPlanTemplateSummary[]>([]);
  const [exerciseTemplates, setExerciseTemplates] = useState<ExercisePlanTemplateSummary[]>([]);
  const [nutritionTemplateId, setNutritionTemplateId] = useState('');
  const [exerciseTemplateId, setExerciseTemplateId] = useState('');
  const [coachCodeDraft, setCoachCodeDraft] = useState('');
  const [defaultNutritionTemplateId, setDefaultNutritionTemplateId] = useState('');
  const [defaultExerciseTemplateId, setDefaultExerciseTemplateId] = useState('');
  const [applyDate, setApplyDate] = useState(() => todayKey());
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [clientRows, nutritionRows, exerciseRows] = await Promise.all([
        api<CoachClient[]>('/api/coach/users'),
        api<NutritionPlanTemplateSummary[]>('/api/coach/nutrition-templates'),
        api<ExercisePlanTemplateSummary[]>('/api/coach/exercise-templates')
      ]);
      const coachSettings = await api<CoachSettings>('/api/coach/settings');
      setClients(clientRows);
      setNutritionTemplates(nutritionRows);
      setExerciseTemplates(exerciseRows);
      setCoachCodeDraft(coachSettings.coachCode ?? '');
      setDefaultNutritionTemplateId(coachSettings.defaultNutritionTemplateId ?? '');
      setDefaultExerciseTemplateId(coachSettings.defaultExerciseTemplateId ?? '');
      setSelectedClientId((current) => current || clientRows[0]?.id || '');
      setNutritionTemplateId((current) => current || nutritionRows[0]?.id || '');
      setExerciseTemplateId((current) => current || exerciseRows[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load coach workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async (clientId: string) => {
    if (!clientId) {
      setDashboard(null);
      setEngagement(null);
      return;
    }
    try {
      const [dashboardData, engagementData] = await Promise.all([
        api<Dashboard>(`/api/coach/users/${clientId}/dashboard`),
        api<GamificationDashboard>(`/api/coach/users/${clientId}/engagement`)
      ]);
      setDashboard(dashboardData);
      setEngagement(engagementData);
    } catch {
      setDashboard(null);
      setEngagement(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadDashboard(selectedClient?.id ?? '');
  }, [loadDashboard, selectedClient?.id]);

  async function applyTemplate(kind: 'nutrition' | 'exercise') {
    if (!selectedClient) return;
    const templateId = kind === 'nutrition' ? nutritionTemplateId : exerciseTemplateId;
    if (!templateId) {
      setError(`Choose a ${kind} template first.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const path =
        kind === 'nutrition'
          ? `/api/coach/users/${selectedClient.id}/daily-logs/${applyDate}/apply-template`
          : `/api/coach/users/${selectedClient.id}/daily-logs/${applyDate}/apply-exercise-template`;
      await api(path, {
        method: 'POST',
        body: JSON.stringify({ templateId, setAsDefault })
      });
      await Promise.all([load(), loadDashboard(selectedClient.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to apply ${kind} template`);
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError('');
    try {
      const updated = await api<CoachSettings>('/api/coach/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          coachCode: coachCodeDraft.trim() || null,
          defaultNutritionTemplateId: defaultNutritionTemplateId || null,
          defaultExerciseTemplateId: defaultExerciseTemplateId || null
        })
      });
      setCoachCodeDraft(updated.coachCode ?? '');
      setDefaultNutritionTemplateId(updated.defaultNutritionTemplateId ?? '');
      setDefaultExerciseTemplateId(updated.defaultExerciseTemplateId ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save coach settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-app-text-muted">Loading coach workspace...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coach Workspace</h1>
        <p className="text-app-text-muted">Manage assigned users, review progress, and apply plans.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{error}</p>
        </div>
      )}

      {clients.length === 0 ? (
        <>
          <CoachSettingsCard
            coachCodeDraft={coachCodeDraft}
            defaultNutritionTemplateId={defaultNutritionTemplateId}
            defaultExerciseTemplateId={defaultExerciseTemplateId}
            nutritionTemplates={nutritionTemplates}
            exerciseTemplates={exerciseTemplates}
            saving={saving}
            onCoachCodeChange={setCoachCodeDraft}
            onDefaultNutritionTemplateChange={setDefaultNutritionTemplateId}
            onDefaultExerciseTemplateChange={setDefaultExerciseTemplateId}
            onSave={() => void saveSettings()}
          />
          <Card>
            <h2 className="text-lg font-bold">No assigned users yet</h2>
            <p className="mt-2 text-sm text-app-text-muted">Share your coach code or wait for a super admin to assign users.</p>
          </Card>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="space-y-4">
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Assigned users</h2>
                  <p className="text-sm text-app-text-muted">{clients.length} active assignment{clients.length === 1 ? '' : 's'}</p>
                </div>
                <select
                  className="rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm"
                  value={selectedClient?.id ?? ''}
                  onChange={(event) => setSelectedClientId(event.target.value)}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {clientName(client)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-app-border text-app-text-muted">
                      <th className="py-3 pr-4 font-medium">Name</th>
                      <th className="py-3 pr-4 font-medium">Program</th>
                      <th className="py-3 pr-4 font-medium">Meals</th>
                      <th className="py-3 pr-4 font-medium">Exercise</th>
                      <th className="py-3 font-medium">Latest weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr
                        key={client.id}
                        className={`cursor-pointer border-b border-app-border/60 last:border-0 ${
                          selectedClient?.id === client.id ? 'bg-app-muted' : 'hover:bg-app-muted/60'
                        }`}
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        <td className="py-3 pr-4 font-semibold">{clientName(client)}</td>
                        <td className="py-3 pr-4 text-app-text-muted">{client.activeProgram?.name ?? 'No active program'}</td>
                        <td className="py-3 pr-4 text-app-text-muted">
                          {completion(client.latestDailyLog?.mealsCompleted, client.latestDailyLog?.mealsPlanned)}
                        </td>
                        <td className="py-3 pr-4 text-app-text-muted">
                          {completion(client.latestDailyLog?.exercisesCompleted, client.latestDailyLog?.exercisesPlanned)}
                        </td>
                        <td className="py-3 text-app-text-muted">
                          {latestWeight(client) != null ? `${latestWeight(client)} lbs` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {selectedClient && (
              <Card>
                <h2 className="text-lg font-bold">{clientName(selectedClient)} progress</h2>
                {dashboard?.summary ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-app-muted p-3">
                        <p className="text-xs uppercase text-app-text-muted">Current weight</p>
                        <p className="mt-1 text-xl font-bold">{Math.round(dashboard.summary.currentWeight)} lbs</p>
                      </div>
                      <div className="rounded-xl bg-app-muted p-3">
                        <p className="text-xs uppercase text-app-text-muted">Goal progress</p>
                        <p className="mt-1 text-xl font-bold">{Math.round(dashboard.summary.goalProgress)}%</p>
                      </div>
                      <div className="rounded-xl bg-app-muted p-3">
                        <p className="text-xs uppercase text-app-text-muted">Calories left</p>
                        <p className="mt-1 text-xl font-bold">{Math.round(dashboard.summary.caloriesRemaining)}</p>
                      </div>
                      <div className="rounded-xl bg-app-muted p-3">
                        <p className="text-xs uppercase text-app-text-muted">Exercises left</p>
                        <p className="mt-1 text-xl font-bold">{dashboard.summary.exercisesLeft}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                      <div className="rounded-xl bg-app-muted p-4">
                        <p className="text-xs uppercase text-app-text-muted">Current level</p>
                        {engagement?.currentLevel ? (
                          <>
                            <p className="mt-1 text-lg font-bold">
                              Level {engagement.currentLevel.number}: {engagement.currentLevel.name}
                            </p>
                            <p className="mt-1 text-sm text-app-text-muted">{engagement.currentLevel.progressPercent}% complete</p>
                            <p className="mt-2 text-sm">Next: {engagement.currentLevel.nextAction}</p>
                          </>
                        ) : (
                          <p className="mt-1 text-sm text-app-text-muted">No level activity yet.</p>
                        )}
                      </div>

                      <div className="rounded-xl bg-app-muted p-4">
                        <p className="text-xs uppercase text-app-text-muted">Streaks</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-app-text-muted">Food</p>
                            <p className="text-lg font-bold">{engagement?.momentum.foodLoggingStreak ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-app-text-muted">Best</p>
                            <p className="text-lg font-bold">{engagement?.momentum.foodLoggingBest ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-app-text-muted">Snapshots</p>
                            <p className="text-lg font-bold">{engagement?.momentum.snapshotStreak ?? 0}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-app-text-muted">
                          {engagement?.momentum.dailyWinsThisWeek ?? 0} daily wins this week
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-app-muted p-4">
                      <p className="text-xs uppercase text-app-text-muted">Recent badges</p>
                      {engagement?.recentBadges.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {engagement.recentBadges.map((badge) => (
                            <span key={badge.id} className="rounded-full bg-app-surface px-3 py-1 text-sm font-semibold">
                              {badge.icon} {badge.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-app-text-muted">No badges earned yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-app-text-muted">No dashboard data available for this user yet.</p>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <CoachSettingsCard
              coachCodeDraft={coachCodeDraft}
              defaultNutritionTemplateId={defaultNutritionTemplateId}
              defaultExerciseTemplateId={defaultExerciseTemplateId}
              nutritionTemplates={nutritionTemplates}
              exerciseTemplates={exerciseTemplates}
              saving={saving}
              onCoachCodeChange={setCoachCodeDraft}
              onDefaultNutritionTemplateChange={setDefaultNutritionTemplateId}
              onDefaultExerciseTemplateChange={setDefaultExerciseTemplateId}
              onSave={() => void saveSettings()}
            />

            <Card>
              <h2 className="text-lg font-bold">Apply plans</h2>
              <p className="mt-1 text-sm text-app-text-muted">Apply templates to the selected user's day and optionally make them defaults.</p>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium">Plan date</span>
              <input
                type="date"
                className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
                value={applyDate}
                onChange={(event) => setApplyDate(event.target.value)}
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={setAsDefault} onChange={(event) => setSetAsDefault(event.target.checked)} />
              Set as the user&apos;s default going forward
            </label>

            <div className="mt-5 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Nutrition template</span>
                <select
                  className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
                  value={nutritionTemplateId}
                  onChange={(event) => setNutritionTemplateId(event.target.value)}
                >
                  {nutritionTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" className="w-full" disabled={saving || !nutritionTemplates.length} onClick={() => void applyTemplate('nutrition')}>
                Apply nutrition template
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Exercise template</span>
                <select
                  className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
                  value={exerciseTemplateId}
                  onChange={(event) => setExerciseTemplateId(event.target.value)}
                >
                  {exerciseTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" className="w-full" disabled={saving || !exerciseTemplates.length} onClick={() => void applyTemplate('exercise')}>
                Apply exercise template
              </Button>
            </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function CoachSettingsCard({
  coachCodeDraft,
  defaultNutritionTemplateId,
  defaultExerciseTemplateId,
  nutritionTemplates,
  exerciseTemplates,
  saving,
  onCoachCodeChange,
  onDefaultNutritionTemplateChange,
  onDefaultExerciseTemplateChange,
  onSave
}: {
  coachCodeDraft: string;
  defaultNutritionTemplateId: string;
  defaultExerciseTemplateId: string;
  nutritionTemplates: NutritionPlanTemplateSummary[];
  exerciseTemplates: ExercisePlanTemplateSummary[];
  saving: boolean;
  onCoachCodeChange: (value: string) => void;
  onDefaultNutritionTemplateChange: (value: string) => void;
  onDefaultExerciseTemplateChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <Card>
      <h2 className="text-lg font-bold">New user defaults</h2>
      <p className="mt-1 text-sm text-app-text-muted">Users can enter your code during setup to get assigned and start on these plans.</p>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium">Coach code</span>
        <input
          className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 uppercase"
          value={coachCodeDraft}
          onChange={(event) => onCoachCodeChange(event.target.value.toUpperCase())}
          placeholder="DF"
          maxLength={20}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium">Default nutrition plan</span>
        <select
          className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
          value={defaultNutritionTemplateId}
          onChange={(event) => onDefaultNutritionTemplateChange(event.target.value)}
        >
          <option value="">Use global starter plan</option>
          {nutritionTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium">Default exercise plan</span>
        <select
          className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2"
          value={defaultExerciseTemplateId}
          onChange={(event) => onDefaultExerciseTemplateChange(event.target.value)}
        >
          <option value="">Use global starter plan</option>
          {exerciseTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>

      <Button type="button" className="mt-4 w-full" disabled={saving} onClick={onSave}>
        {saving ? 'Saving...' : 'Save defaults'}
      </Button>
    </Card>
  );
}
