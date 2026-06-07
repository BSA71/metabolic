import { ProgramStatus, Role, Visibility } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { startOfUtcDay } from '../utils/dates.js';
import { buildProgramMetrics } from '../utils/programMetrics.js';
import { ensureTodayDailyLog } from './dailyLogService.js';
import { applyTemplateMealsToLog } from './nutritionTemplateApply.js';
import { applyTemplateExercisesToDate } from './exerciseTemplateApply.js';

const DEFAULT_EXERCISES = [
  { name: 'Morning walk', category: 'Cardio', defaultDurationMinutes: 30 },
  { name: 'Goblet squat', category: 'Strength', bodyPart: 'Legs', defaultSets: 3, defaultReps: 10 },
  { name: 'Push-up', category: 'Strength', bodyPart: 'Chest', defaultSets: 3, defaultReps: 8 },
  { name: 'Mobility flow', category: 'Recovery', defaultDurationMinutes: 15 }
] as const;

export async function userNeedsSetup(userId: string) {
  const activeProgram = await prisma.program.findFirst({
    where: { userId, status: ProgramStatus.ACTIVE }
  });
  return !activeProgram;
}

async function findOrCreateExercise(
  definition: (typeof DEFAULT_EXERCISES)[number]
) {
  const existing = await prisma.exercise.findFirst({ where: { name: definition.name } });
  if (existing) return existing;

  return prisma.exercise.create({
    data: {
      name: definition.name,
      category: definition.category,
      bodyPart: 'bodyPart' in definition ? definition.bodyPart : undefined,
      defaultSets: 'defaultSets' in definition ? definition.defaultSets : undefined,
      defaultReps: 'defaultReps' in definition ? definition.defaultReps : undefined,
      defaultDurationMinutes:
        'defaultDurationMinutes' in definition ? definition.defaultDurationMinutes : undefined
    }
  });
}

async function seedDefaultExercises(userId: string, programId: string, date: Date) {
  const existing = await prisma.scheduledExercise.count({
    where: { userId, programId, scheduledDate: date }
  });
  if (existing) return;

  for (const [index, definition] of DEFAULT_EXERCISES.entries()) {
    const exercise = await findOrCreateExercise(definition);
    await prisma.scheduledExercise.create({
      data: {
        programId,
        userId,
        exerciseId: exercise.id,
        scheduledDate: date,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        durationMinutes: exercise.defaultDurationMinutes,
        status: 'PLANNED',
        sortOrder: index
      }
    });
  }
}

type SetupInput = {
  programName?: string;
  weight: number;
  goalWeight: number;
  bodyFat?: number;
  goalBodyFat?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  coachCode?: string;
  wantsCoach?: boolean;
};

function normalizeCoachCode(value?: string) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return normalized || null;
}

async function findCoachByCode(code: string | null) {
  if (!code) return null;
  return prisma.user.findFirst({
    where: { role: Role.COACH, coachCode: { equals: code, mode: 'insensitive' } },
    select: { id: true, defaultNutritionTemplateId: true, defaultExerciseTemplateId: true }
  });
}

async function findGlobalNutritionTemplate() {
  return prisma.nutritionPlanTemplate.findFirst({
    where: { visibility: Visibility.GLOBAL },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, calorieTarget: true, proteinTarget: true }
  });
}

async function findGlobalExerciseTemplate() {
  return prisma.exerciseTemplate.findFirst({
    where: { visibility: Visibility.GLOBAL },
    orderBy: { updatedAt: 'desc' },
    select: { id: true }
  });
}

export async function setupFirstProgram(userId: string, input: SetupInput) {
  const needsSetup = await userNeedsSetup(userId);
  if (!needsSetup) {
    throw new Error('You already have an active program.');
  }

  const [template, coach, globalNutritionTemplate, globalExerciseTemplate] = await Promise.all([
    prisma.programTemplate.findFirst({ orderBy: { createdAt: 'asc' } }),
    findCoachByCode(normalizeCoachCode(input.coachCode)),
    findGlobalNutritionTemplate(),
    findGlobalExerciseTemplate()
  ]);
  const defaultNutritionTemplateId = coach?.defaultNutritionTemplateId ?? globalNutritionTemplate?.id ?? null;
  const defaultExerciseTemplateId = coach?.defaultExerciseTemplateId ?? globalExerciseTemplate?.id ?? null;
  const calories = input.calorieTarget ?? Number(globalNutritionTemplate?.calorieTarget ?? template?.defaultCalories ?? 2200);
  const protein = input.proteinTarget ?? Number(globalNutritionTemplate?.proteinTarget ?? template?.defaultProtein ?? 190);
  const programName = input.programName?.trim() || template?.name || 'My Metabolic Program';
  const today = startOfUtcDay();
  const targetEndDate = new Date(today.getTime() + 16 * 7 * 86400000);

  const program = await prisma.$transaction(async (tx) => {
    if (coach) {
      await tx.coachAssignment.deleteMany({ where: { userId } });
      await tx.coachAssignment.create({ data: { coachId: coach.id, userId } });
    }

    if (input.wantsCoach || input.coachCode?.trim()) {
      await tx.user.update({
        where: { id: userId },
        data: { coachRequestedAt: coach ? null : new Date() }
      });
    }

    const created = await tx.program.create({
      data: {
        userId,
        coachId: coach?.id ?? null,
        name: programName,
        status: ProgramStatus.ACTIVE,
        startDate: today,
        targetEndDate,
        defaultNutritionTemplateId,
        defaultExerciseTemplateId
      }
    });

    await tx.programMetric.createMany({
      data: buildProgramMetrics(created.id, input, calories, protein)
    });

    return created;
  });

  const programWithMetrics = await prisma.program.findUniqueOrThrow({
    where: { id: program.id },
    include: { metrics: true }
  });

  const dailyLog = await ensureTodayDailyLog(userId, programWithMetrics);
  if (dailyLog && defaultNutritionTemplateId) {
    await prisma.$transaction(async (tx) => {
      await applyTemplateMealsToLog(tx, defaultNutritionTemplateId, dailyLog.id, userId);
    });
  }
  if (defaultExerciseTemplateId) {
    await prisma.$transaction(async (tx) => {
      await applyTemplateExercisesToDate(tx, defaultExerciseTemplateId, program.id, userId, today.toISOString().slice(0, 10));
    });
  } else {
    await seedDefaultExercises(userId, program.id, today);
  }

  return programWithMetrics;
}
