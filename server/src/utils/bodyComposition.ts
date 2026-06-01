export function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

export function fatMassLbs(weightLbs: number, bodyFatPercent: number) {
  return roundMetric(weightLbs * (bodyFatPercent / 100));
}

export function leanTissueMassLbs(weightLbs: number, bodyFatPercent: number) {
  return roundMetric(weightLbs * (1 - bodyFatPercent / 100));
}
