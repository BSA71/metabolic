import type { ProgramMetric } from '@prisma/client';
import { fatMassLbs, leanTissueMassLbs } from './bodyComposition.js';

type MetricSeedInput = {
  weight: number;
  goalWeight: number;
  bodyFat?: number;
  goalBodyFat?: number;
  calorieTarget?: number;
  proteinTarget?: number;
};

export function buildProgramMetrics(
  programId: string,
  input: MetricSeedInput,
  calories: number,
  protein: number
) {
  const bodyFat = input.bodyFat ?? 30;
  const goalBodyFat = input.goalBodyFat ?? 18;
  const calorieGoal = Math.max(Math.round(calories - 150), 1200);
  const proteinGoal = protein + 15;

  return [
    {
      programId,
      metricType: 'WEIGHT' as const,
      startValue: input.weight,
      currentValue: input.weight,
      goalValue: input.goalWeight,
      unit: 'lbs'
    },
    {
      programId,
      metricType: 'BODY_FAT' as const,
      startValue: bodyFat,
      currentValue: bodyFat,
      goalValue: goalBodyFat,
      unit: '%'
    },
    {
      programId,
      metricType: 'LEAN_TISSUE_MASS' as const,
      startValue: leanTissueMassLbs(input.weight, bodyFat),
      currentValue: leanTissueMassLbs(input.weight, bodyFat),
      goalValue: leanTissueMassLbs(input.goalWeight, goalBodyFat),
      unit: 'lbs'
    },
    {
      programId,
      metricType: 'FAT_MASS' as const,
      startValue: fatMassLbs(input.weight, bodyFat),
      currentValue: fatMassLbs(input.weight, bodyFat),
      goalValue: fatMassLbs(input.goalWeight, goalBodyFat),
      unit: 'lbs'
    },
    {
      programId,
      metricType: 'CALORIES' as const,
      startValue: calories,
      currentValue: calories,
      goalValue: calorieGoal,
      unit: 'kcal'
    },
    {
      programId,
      metricType: 'PROTEIN' as const,
      startValue: protein,
      currentValue: protein,
      goalValue: proteinGoal,
      unit: 'g'
    }
  ];
}

export function missingProgramMetrics(
  programId: string,
  metrics: ProgramMetric[],
  defaults: MetricSeedInput,
  calories: number,
  protein: number
) {
  const existing = new Set(metrics.map((metric) => metric.metricType));
  return buildProgramMetrics(programId, defaults, calories, protein).filter(
    (metric) => !existing.has(metric.metricType)
  );
}

export function metricUpdatesForLegacyGoals(metrics: ProgramMetric[]) {
  const updates: Array<{ id: string; goalValue: number }> = [];

  const calories = metrics.find((metric) => metric.metricType === 'CALORIES');
  if (calories && Number(calories.goalValue) === Number(calories.startValue)) {
    updates.push({
      id: calories.id,
      goalValue: Math.max(Math.round(Number(calories.startValue) - 150), 1200)
    });
  }

  const protein = metrics.find((metric) => metric.metricType === 'PROTEIN');
  if (protein && Number(protein.goalValue) === Number(protein.startValue)) {
    updates.push({
      id: protein.id,
      goalValue: Number(protein.startValue) + 15
    });
  }

  return updates;
}
