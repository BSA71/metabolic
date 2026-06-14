import { useState } from 'react';
import type { BloodPanelSummary } from '../../types';
import { api, parseDateKey, todayKey } from '../../services/api';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import {
  BLOOD_PANEL_FORM_FIELDS,
  bloodPanelToFormValues,
  emptyBloodPanelFormValues,
  formValuesToPayload,
  type BloodPanelFormValues
} from './bloodPanelForm';

function labelClassName() {
  return 'mb-1 block text-sm font-medium text-slate-600 dark:text-app-text-muted';
}

function inputClassName() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:border-app-border dark:bg-app-surface dark:text-app-text';
}

function formatLabDate(date: string) {
  return parseDateKey(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export function EditBloodPanelDrawer({
  open,
  userId,
  panel,
  onClose,
  onSaved
}: {
  open: boolean;
  userId: string;
  panel?: BloodPanelSummary;
  onClose: () => void;
  onSaved: (panel: BloodPanelSummary) => void;
}) {
  return (
    <Drawer open={open} title={panel ? 'Edit blood panel' : 'Add blood panel'} onClose={onClose}>
      {open && (
        <EditBloodPanelDrawerContent
          key={panel?.id ?? 'new'}
          userId={userId}
          panel={panel}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Drawer>
  );
}

function EditBloodPanelDrawerContent({
  userId,
  panel,
  onClose,
  onSaved
}: {
  userId: string;
  panel?: BloodPanelSummary;
  onClose: () => void;
  onSaved: (panel: BloodPanelSummary) => void;
}) {
  const [values, setValues] = useState<BloodPanelFormValues>(() =>
    panel ? bloodPanelToFormValues(panel) : emptyBloodPanelFormValues(todayKey())
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateMetric(apiKey: keyof BloodPanelFormValues['metrics'], next: string) {
    setValues((current) => ({
      ...current,
      metrics: { ...current.metrics, [apiKey]: next }
    }));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = formValuesToPayload(values);
      const saved = panel
        ? await api<BloodPanelSummary>(`/api/blood-panels/${userId}/${panel.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await api<BloodPanelSummary>(`/api/blood-panels/${userId}`, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save blood panel');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-app-text-muted">
        {panel
          ? `Editing panel from ${formatLabDate(panel.labDate)}. Enter the values tested on this lab date.`
          : 'Log lab results from your blood draw. At least one metric is required.'}
      </p>

      <label className="block">
        <span className={labelClassName()}>Lab date</span>
        <input
          className={inputClassName()}
          type="date"
          value={values.labDate}
          onChange={(event) => setValues((current) => ({ ...current, labDate: event.target.value }))}
        />
      </label>

      <label className="block">
        <span className={labelClassName()}>Lab provider</span>
        <input
          className={inputClassName()}
          type="text"
          placeholder="Quest Diagnostics, LabCorp, etc."
          value={values.labProvider}
          onChange={(event) => setValues((current) => ({ ...current, labProvider: event.target.value }))}
        />
      </label>

      <div>
        <p className={labelClassName()}>Lab results</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {BLOOD_PANEL_FORM_FIELDS.map((field) => (
            <label key={field.apiKey} className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-app-text-muted">
                {field.label} ({field.unit})
              </span>
              <input
                className={inputClassName()}
                type="number"
                step="0.01"
                placeholder={field.placeholder}
                value={values.metrics[field.apiKey]}
                onChange={(event) => updateMetric(field.apiKey, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className={labelClassName()}>Notes</span>
        <textarea
          className={`${inputClassName()} min-h-[5rem] resize-y`}
          placeholder="Fasting, post-meal, etc."
          value={values.notes}
          onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button disabled={saving} onClick={save}>
          {saving ? 'Saving…' : panel ? 'Save changes' : 'Save blood panel'}
        </Button>
        <Button variant="secondary" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
