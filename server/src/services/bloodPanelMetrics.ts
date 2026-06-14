export const BLOOD_PANEL_METRICS = [
  { key: 'glucose', label: 'Glucose', field: 'glucose', unit: 'mg/dL' },
  { key: 'total_cholesterol', label: 'Total Cholesterol', field: 'totalCholesterol', unit: 'mg/dL' },
  { key: 'hdl', label: 'HDL', field: 'hdl', unit: 'mg/dL' },
  { key: 'ldl', label: 'LDL', field: 'ldl', unit: 'mg/dL' },
  { key: 'triglycerides', label: 'Triglycerides', field: 'triglycerides', unit: 'mg/dL' },
  { key: 'hemoglobin_a1c', label: 'Hemoglobin A1C', field: 'hemoglobinA1c', unit: '%' },
  { key: 'insulin', label: 'Insulin', field: 'insulin', unit: 'μIU/mL' },
  { key: 'testosterone', label: 'Testosterone', field: 'testosterone', unit: 'ng/dL' }
] as const;

export type BloodPanelMetricKey = (typeof BLOOD_PANEL_METRICS)[number]['key'];
export type BloodPanelStatus = 'low' | 'normal' | 'high' | 'unknown';
export type BloodPanelTrend = 'up' | 'down' | 'same';

export type BloodPanelReferenceRangeRow = {
  metricKey: string;
  gender: string;
  ageMin: number;
  ageMax: number;
  lowMax: number | null;
  normalMin: number;
  normalMax: number;
  highMin: number | null;
  unit: string;
  description: string;
};

export type BloodPanelMetricValue = {
  key: BloodPanelMetricKey;
  label: string;
  value: number | null;
  unit: string;
  status: BloodPanelStatus | null;
  previousValue: number | null;
  trend: BloodPanelTrend | null;
  referenceRange: { low: string; normal: string; high: string } | null;
  description: string | null;
};

export function normalizeGender(value: string | null | undefined): 'm' | 'f' | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'm' || normalized === 'male') return 'm';
  if (normalized === 'f' || normalized === 'female') return 'f';
  return null;
}

export function calculateAge(birthDate: Date | null | undefined, onDate = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  let age = onDate.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = onDate.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && onDate.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function findReferenceRange(
  ranges: BloodPanelReferenceRangeRow[],
  metricKey: string,
  gender: 'm' | 'f' | null,
  age: number | null
) {
  if (age == null) return null;

  const gendersToTry = gender ? [gender, 'any'] : ['any'];
  for (const g of gendersToTry) {
    const match = ranges.find(
      (range) =>
        range.metricKey === metricKey &&
        range.gender === g &&
        age >= range.ageMin &&
        age <= range.ageMax
    );
    if (match) return match;
  }
  return null;
}

export function calculateBloodPanelStatus(value: number, range: BloodPanelReferenceRangeRow): BloodPanelStatus {
  if (range.lowMax != null && value <= range.lowMax) return 'low';
  if (value >= range.normalMin && value <= range.normalMax) return 'normal';
  if (range.highMin != null && value >= range.highMin) return 'high';
  return 'unknown';
}

export function formatReferenceRangeLabels(range: BloodPanelReferenceRangeRow) {
  const unitSuffix = range.unit ? ` ${range.unit}` : '';
  return {
    low: range.lowMax != null ? `< ${range.lowMax + 1}${unitSuffix}` : '—',
    normal: `${range.normalMin}–${range.normalMax}${unitSuffix}`,
    high: range.highMin != null ? `> ${range.highMin - 1}${unitSuffix}` : '—'
  };
}

export function calculateTrend(current: number, previous: number | null): BloodPanelTrend | null {
  if (previous == null) return null;
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'same';
}

export function panelMetricValues(panel: Record<string, unknown>) {
  return BLOOD_PANEL_METRICS.map((metric) => {
    const raw = panel[metric.field];
    if (raw == null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }).filter((value): value is number => value != null);
}

export function hasAnyBloodPanelMetric(panel: Record<string, unknown>) {
  return panelMetricValues(panel).length > 0;
}
