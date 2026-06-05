import { ProgramStatus, Visibility, type Role } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { canAccessUser } from '../auth/requireRole.js';
import { getTodayDashboard } from './dashboardService.js';
import { getGamificationDashboard } from './gamificationService.js';
import { applyTemplateToDailyLog } from './nutritionTemplateService.js';
import { applyTemplateToDate } from './exerciseTemplateService.js';

export async function requireCoachClient(actor: { id: string; role: Role }, userId: string) {
  if (!(await canAccessUser(actor, userId))) {
    throw new Error('User is not assigned to this coach');
  }
}

export async function listCoachClients(coachId: string) {
  const assignments = await prisma.coachAssignment.findMany({
    where: { coachId },
    include: {
      user: {
        include: {
          programs: {
            where: { status: ProgramStatus.ACTIVE },
            include: { metrics: true },
            take: 1
          },
          dailyLogs: {
            orderBy: { date: 'desc' },
            take: 1
          },
          progressSnapshots: {
            orderBy: { snapshotDate: 'desc' },
            take: 1
          }
        }
      }
    },
    orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }]
  });

  return assignments.map((assignment) => {
    const user = assignment.user;
    const program = user.programs[0] ?? null;
    const weightMetric = program?.metrics.find((metric) => metric.metricType === 'WEIGHT') ?? null;
    const latestDailyLog = user.dailyLogs[0] ?? null;
    const latestProgressSnapshot = user.progressSnapshots[0] ?? null;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      assignedAt: assignment.createdAt.toISOString(),
      activeProgram: program
        ? {
            id: program.id,
            name: program.name,
            startDate: program.startDate.toISOString(),
            currentWeight: weightMetric == null ? null : Number(weightMetric.currentValue),
            metricCount: program.metrics.length
          }
        : null,
      latestDailyLog: latestDailyLog
        ? {
            date: latestDailyLog.date.toISOString().slice(0, 10),
            mealsCompleted: latestDailyLog.mealsCompleted,
            mealsPlanned: latestDailyLog.mealsPlanned,
            exercisesCompleted: latestDailyLog.exercisesCompleted,
            exercisesPlanned: latestDailyLog.exercisesPlanned
          }
        : null,
      latestProgressSnapshot: latestProgressSnapshot
        ? {
            snapshotDate: latestProgressSnapshot.snapshotDate.toISOString().slice(0, 10),
            weight: latestProgressSnapshot.weight == null ? null : Number(latestProgressSnapshot.weight),
            completionStatus: latestProgressSnapshot.completionStatus
          }
        : null
    };
  });
}

function normalizeCoachCode(value?: string | null) {
  const code = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return code || null;
}

export async function getCoachSettings(coachId: string) {
  const coach = await prisma.user.findUniqueOrThrow({
    where: { id: coachId },
    select: {
      coachCode: true,
      defaultNutritionTemplateId: true,
      defaultExerciseTemplateId: true
    }
  });
  return coach;
}

export async function updateCoachSettings(
  coachId: string,
  data: {
    coachCode?: string | null;
    defaultNutritionTemplateId?: string | null;
    defaultExerciseTemplateId?: string | null;
  }
) {
  if (data.defaultNutritionTemplateId) {
    await ensureTemplateAvailableToCoach('nutrition', coachId, data.defaultNutritionTemplateId);
  }
  if (data.defaultExerciseTemplateId) {
    await ensureTemplateAvailableToCoach('exercise', coachId, data.defaultExerciseTemplateId);
  }
  const updated = await prisma.user.update({
    where: { id: coachId },
    data: {
      coachCode: data.coachCode === undefined ? undefined : normalizeCoachCode(data.coachCode),
      defaultNutritionTemplateId: data.defaultNutritionTemplateId,
      defaultExerciseTemplateId: data.defaultExerciseTemplateId
    },
    select: {
      coachCode: true,
      defaultNutritionTemplateId: true,
      defaultExerciseTemplateId: true
    }
  });
  return updated;
}

export async function getCoachClientDashboard(actor: { id: string; role: Role }, userId: string) {
  await requireCoachClient(actor, userId);
  return getTodayDashboard(userId);
}

export async function getCoachClientEngagement(actor: { id: string; role: Role }, userId: string) {
  await requireCoachClient(actor, userId);
  return getGamificationDashboard(userId);
}

export async function listCoachNutritionTemplates(coachId: string) {
  const { listTemplatesForActor } = await import('./nutritionTemplateService.js');
  return listTemplatesForActor({ id: coachId, role: 'COACH' });
}

export async function listCoachExerciseTemplates(coachId: string) {
  const { listTemplatesForActor } = await import('./exerciseTemplateService.js');
  return listTemplatesForActor({ id: coachId, role: 'COACH' });
}

export async function applyCoachNutritionTemplate(
  actor: { id: string; role: Role },
  userId: string,
  date: string,
  templateId: string,
  options?: { setAsDefault?: boolean }
) {
  await requireCoachClient(actor, userId);
  await ensureTemplateAvailableToCoach('nutrition', actor.id, templateId);
  return applyTemplateToDailyLog(userId, date, templateId, { ...options, actorId: actor.id });
}

export async function applyCoachExerciseTemplate(
  actor: { id: string; role: Role },
  userId: string,
  date: string,
  templateId: string,
  options?: { setAsDefault?: boolean }
) {
  await requireCoachClient(actor, userId);
  await ensureTemplateAvailableToCoach('exercise', actor.id, templateId);
  return applyTemplateToDate(userId, date, templateId, { ...options, actorId: actor.id });
}

async function ensureTemplateAvailableToCoach(kind: 'nutrition' | 'exercise', coachId: string, templateId: string) {
  const template =
    kind === 'nutrition'
      ? await prisma.nutritionPlanTemplate.findUnique({ where: { id: templateId } })
      : await prisma.exerciseTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error('Template not found');
  if (template.visibility === Visibility.GLOBAL || template.createdById === coachId) return;
  throw new Error('Template not available');
}
