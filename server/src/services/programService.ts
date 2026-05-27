import { ProgramStatus, Role } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export async function listPrograms(user: { id: string; role: Role }) {
  const where = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? {} : { userId: user.id };
  return prisma.program.findMany({ where, include: { metrics: true, user: true }, orderBy: { createdAt: 'desc' } });
}

export async function getProgram(user: { id: string; role: Role }, id: string) {
  const program = await prisma.program.findUnique({ where: { id }, include: { metrics: true, user: true } });
  if (!program) return null;
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || program.userId === user.id) return program;
  return null;
}

export async function activateProgram(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const program = await tx.program.findUniqueOrThrow({ where: { id } });
    await tx.program.updateMany({ where: { userId: program.userId, status: ProgramStatus.ACTIVE }, data: { status: ProgramStatus.PAUSED } });
    return tx.program.update({ where: { id }, data: { status: ProgramStatus.ACTIVE } });
  });
}

type MetricUpdate = { id: string; startValue?: number; currentValue?: number; goalValue?: number };

type SnapshotValueInput = { metricType: string; currentValue: number; unit: string };

export async function listProgramMetricSnapshots(
  user: { id: string; role: Role },
  programId: string
) {
  const program = await getProgram(user, programId);
  if (!program) throw new Error('Program not found');

  return prisma.programMetricSnapshot.findMany({
    where: { programId },
    include: { values: true },
    orderBy: { date: 'desc' }
  });
}

export async function saveProgramMetricSnapshot(
  user: { id: string; role: Role },
  programId: string,
  values: SnapshotValueInput[]
) {
  const program = await getProgram(user, programId);
  if (!program) throw new Error('Program not found');

  const date = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.programMetricSnapshot.upsert({
      where: { programId_date: { programId, date } },
      create: { programId, date },
      update: { updatedAt: new Date() }
    });

    await tx.programMetricSnapshotValue.deleteMany({ where: { snapshotId: snapshot.id } });
    await tx.programMetricSnapshotValue.createMany({
      data: values.map((value) => ({
        snapshotId: snapshot.id,
        metricType: value.metricType as never,
        currentValue: value.currentValue,
        unit: value.unit
      }))
    });

    return tx.programMetricSnapshot.findUniqueOrThrow({
      where: { id: snapshot.id },
      include: { values: true }
    });
  });
}

export async function updateProgramMetrics(
  user: { id: string; role: Role },
  programId: string,
  updates: MetricUpdate[]
) {
  const program = await getProgram(user, programId);
  if (!program) throw new Error('Program not found');

  const metricIds = new Set(program.metrics.map((metric) => metric.id));
  for (const update of updates) {
    if (!metricIds.has(update.id)) throw new Error('Metric not found');
  }

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const update of updates) {
      results.push(
        await tx.programMetric.update({
          where: { id: update.id },
          data: {
            startValue: update.startValue,
            currentValue: update.currentValue,
            goalValue: update.goalValue
          }
        })
      );
    }
    return results;
  });
}
