export const BLOOD_PANEL_FORM_FIELDS = [
  { key: 'glucose', apiKey: 'glucose', label: 'Glucose', unit: 'mg/dL', placeholder: '70–99' },
  { key: 'total_cholesterol', apiKey: 'totalCholesterol', label: 'Total Cholesterol', unit: 'mg/dL', placeholder: '125–199' },
  { key: 'hdl', apiKey: 'hdl', label: 'HDL', unit: 'mg/dL', placeholder: '40+' },
  { key: 'ldl', apiKey: 'ldl', label: 'LDL', unit: 'mg/dL', placeholder: '50–129' },
  { key: 'triglycerides', apiKey: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', placeholder: '40–149' },
  { key: 'hemoglobin_a1c', apiKey: 'hemoglobinA1c', label: 'Hemoglobin A1C', unit: '%', placeholder: '4.0–5.6' },
  { key: 'insulin', apiKey: 'insulin', label: 'Insulin', unit: 'μIU/mL', placeholder: '2.6–24.9' },
  { key: 'testosterone', apiKey: 'testosterone', label: 'Testosterone', unit: 'ng/dL', placeholder: 'Varies by age/gender' }
] as const;

export type BloodPanelFormValues = {
  labDate: string;
  labProvider: string;
  notes: string;
  metrics: Record<(typeof BLOOD_PANEL_FORM_FIELDS)[number]['apiKey'], string>;
};

export function emptyBloodPanelFormValues(labDate: string): BloodPanelFormValues {
  return {
    labDate,
    labProvider: '',
    notes: '',
    metrics: Object.fromEntries(BLOOD_PANEL_FORM_FIELDS.map((field) => [field.apiKey, ''])) as BloodPanelFormValues['metrics']
  };
}

export function bloodPanelToFormValues(panel: {
  labDate: string;
  labProvider: string | null;
  notes: string | null;
  metrics: Array<{ key: string; value: number | null }>;
}): BloodPanelFormValues {
  const byKey = Object.fromEntries(panel.metrics.map((metric) => [metric.key, metric.value]));
  return {
    labDate: panel.labDate,
    labProvider: panel.labProvider ?? '',
    notes: panel.notes ?? '',
    metrics: Object.fromEntries(
      BLOOD_PANEL_FORM_FIELDS.map((field) => [
        field.apiKey,
        byKey[field.key] != null ? String(byKey[field.key]) : ''
      ])
    ) as BloodPanelFormValues['metrics']
  };
}

export function formValuesToPayload(values: BloodPanelFormValues) {
  const payload: Record<string, string | number | null> = {
    labDate: values.labDate,
    labProvider: values.labProvider.trim() || null,
    notes: values.notes.trim() || null
  };

  let filledCount = 0;
  for (const field of BLOOD_PANEL_FORM_FIELDS) {
    const raw = values.metrics[field.apiKey].trim();
    if (!raw) {
      payload[field.apiKey] = null;
      continue;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Enter a valid number for ${field.label}.`);
    }
    payload[field.apiKey] = parsed;
    filledCount += 1;
  }

  if (filledCount === 0) {
    throw new Error('Enter at least one blood panel metric.');
  }

  return payload;
}
