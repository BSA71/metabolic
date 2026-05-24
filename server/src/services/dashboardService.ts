import { ProgramStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { ensureTodayDailyLog } from './dailyLogService.js';
import { startOfUtcDay } from '../utils/dates.js';
import { n, round } from '../utils/numbers.js';

export async function getTodayDashboard(userId: string) {
  const today = startOfUtcDay();
  const program = await prisma.program.findFirst({
    where: { userId, status: ProgramStatus.ACTIVE },
    include: { metrics: true }
  });
  if (!program) return { program: null, dailyLog: null, meals: [], exercises: [], summary: null, weightTrend: [] };

  const dailyLog = await ensureTodayDailyLog(userId, program);
  const [meals, exercises, weightTrend] = await Promise.all([
    prisma.meal.findMany({ where: { dailyLogId: dailyLog.id }, include: { items: true }, orderBy: { mealNumber: 'asc' } }),
    prisma.scheduledExercise.findMany({ where: { userId, scheduledDate: today }, include: { exercise: true }, orderBy: { createdAt: 'asc' } }),
    prisma.dailyLog.findMany({ where: { userId, weight: { not: null } }, orderBy: { date: 'asc' }, take: 30 })
  ]);

  const weightMetric = program.metrics.find((metric) => metric.metricType === 'WEIGHT');
  const start = n(weightMetric?.startValue);
  const current = n(weightMetric?.currentValue ?? dailyLog?.weight);
  const goal = n(weightMetric?.goalValue);
  const goalProgress = start !== goal ? round(((start - current) / (start - goal)) * 100, 1) : 0;
  const nextMeal = meals.find((meal) => !['EATEN_AS_PLANNED', 'SKIPPED', 'MISSED'].includes(meal.status));

  return {
    program,
    dailyLog,
    meals,
    exercises,
    summary: {
          currentWeight: current || n(dailyLog.weight),
          caloriesRemaining: round(n(dailyLog.calorieTarget) - n(dailyLog.caloriesActual), 1),
          proteinRemaining: round(n(dailyLog.proteinTarget) - n(dailyLog.proteinActual), 1),
          nextMeal: nextMeal?.name ?? 'All meals complete',
          exercisesLeft: exercises.filter((exercise) => exercise.status === 'PLANNED').length,
          goalProgress
        },
    weightTrend: weightTrend.map((log) => ({ date: log.date.toISOString().slice(0, 10), weight: n(log.weight) }))
  };
}
