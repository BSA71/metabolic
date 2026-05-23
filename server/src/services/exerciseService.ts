import { ExerciseStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { parseDateParam } from '../utils/dates.js';
import { recalculateDailyLogTotals } from './totalsService.js';

export async function getExercises() {
  return prisma.exercise.findMany({ orderBy: { name: 'asc' } });
}

export async function getScheduledExercises(userId: string, date: string) {
  return prisma.scheduledExercise.findMany({ where: { userId, scheduledDate: parseDateParam(date) }, include: { exercise: true, log: true } });
}

export async function markScheduledExercise(userId: string, id: string, status: ExerciseStatus) {
  return prisma.$transaction(async (tx) => {
    const scheduled = await tx.scheduledExercise.update({ where: { id, userId }, data: { status } });
    const dailyLog = await tx.dailyLog.findFirst({ where: { programId: scheduled.programId, userId, date: scheduled.scheduledDate } });
    if (dailyLog) await recalculateDailyLogTotals(dailyLog.id, tx);
    return scheduled;
  });
}

export async function markDone(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const scheduled = await tx.scheduledExercise.update({ where: { id, userId }, data: { status: ExerciseStatus.DONE } });
    await tx.exerciseLog.upsert({
      where: { scheduledExerciseId: id },
      update: { completed: true, completedAt: new Date() },
      create: { scheduledExerciseId: id, userId, completed: true, completedAt: new Date() }
    });
    const dailyLog = await tx.dailyLog.findFirst({ where: { programId: scheduled.programId, userId, date: scheduled.scheduledDate } });
    if (dailyLog) await recalculateDailyLogTotals(dailyLog.id, tx);
    return scheduled;
  });
}
