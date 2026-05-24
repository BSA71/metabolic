import { ExerciseStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { parseDateParam } from '../utils/dates.js';

export async function getExercises() {
  return prisma.exercise.findMany({ orderBy: { name: 'asc' } });
}

export async function getScheduledExercises(userId: string, date: string) {
  return prisma.scheduledExercise.findMany({ where: { userId, scheduledDate: parseDateParam(date) }, include: { exercise: true, log: true } });
}

export async function markScheduledExercise(userId: string, id: string, status: ExerciseStatus) {
  return prisma.scheduledExercise.update({ where: { id, userId }, data: { status } });
}

export async function markDone(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const scheduled = await tx.scheduledExercise.update({ where: { id, userId }, data: { status: ExerciseStatus.DONE } });
    await tx.exerciseLog.upsert({
      where: { scheduledExerciseId: id },
      update: { completed: true, completedAt: new Date() },
      create: { scheduledExerciseId: id, userId, completed: true, completedAt: new Date() }
    });
    return scheduled;
  });
}
