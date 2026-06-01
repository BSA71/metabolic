import { ProgramStatus, Role } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { parseDateParam } from '../utils/dates.js';
import { metricUpdatesForLegacyGoals, missingProgramMetrics } from '../utils/programMetrics.js';

const REQUIRED_METRICS = ['WEIGHT', 'BODY_FAT', 'LEAN_TISSUE_MASS', 'FAT_MASS', 'CALORIES', 'PROTEIN'] as const;

function hasCompleteMetrics(metrics: Array<{ metricType: string }>) {
  const types = new Set(metrics.map((metric) => metric.metricType));
  return REQUIRED_METRICS.every((metricType) => types.has(metricType));
}

async function ensureCompleteProgramMetrics(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { metrics: true }
  });
  if (!program) return null;

  const weight = program.metrics.find((metric) => metric.metricType === 'WEIGHT');
  if (!weight) return program;

  const caloriesMetric = program.metrics.find((metric) => metric.metricType === 'CALORIES');
  const proteinMetric = program.metrics.find((metric) => metric.metricType === 'PROTEIN');
  const calories = Number(caloriesMetric?.startValue ?? 2200);
  const protein = Number(proteinMetric?.startValue ?? 190);

  const toCreate = missingProgramMetrics(
    programId,
    program.metrics,
    {
      weight: Number(weight.startValue),
      goalWeight: Number(weight.goalValue),
      bodyFat: 30,
      goalBodyFat: 18
    },
    calories,
    protein
  );

  const goalUpdates = metricUpdatesForLegacyGoals(program.metrics);

  if (!toCreate.length && !goalUpdates.length) return program;

  await prisma.$transaction(async (tx) => {
    if (toCreate.length) {
      await tx.programMetric.createMany({ data: toCreate });
    }
    for (const update of goalUpdates) {
      await tx.programMetric.update({
        where: { id: update.id },
        data: { goalValue: update.goalValue }
      });
    }
  });

  return prisma.program.findUniqueOrThrow({
    where: { id: programId },
    include: { metrics: true, user: true }
  });
}

export async function listPrograms(user: { id: string; role: Role }) {
  const where = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? {} : { userId: user.id };
  const programs = await prisma.program.findMany({ where, include: { metrics: true, user: true }, orderBy: { createdAt: 'desc' } });

  return Promise.all(
    programs.map(async (program) => {
      if (hasCompleteMetrics(program.metrics)) {
        const goalUpdates = metricUpdatesForLegacyGoals(program.metrics);
        if (!goalUpdates.length) return program;
        await prisma.$transaction(async (tx) => {
          for (const update of goalUpdates) {
            await tx.programMetric.update({
              where: { id: update.id },
              data: { goalValue: update.goalValue }
            });
          }
        });
        return prisma.program.findUniqueOrThrow({
          where: { id: program.id },
          include: { metrics: true, user: true }
        });
      }
      return ensureCompleteProgramMetrics(program.id);
    })
  );
}

export async function getProgram(user: { id: string; role: Role }, id: string) {
  const program = await prisma.program.findUnique({ where: { id }, include: { metrics: true, user: true } });
  if (!program) return null;
  if (!(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || program.userId === user.id)) return null;
  if (hasCompleteMetrics(program.metrics)) {
    const goalUpdates = metricUpdatesForLegacyGoals(program.metrics);
    if (!goalUpdates.length) return program;
    await prisma.$transaction(async (tx) => {
      for (const update of goalUpdates) {
        await tx.programMetric.update({
          where: { id: update.id },
          data: { goalValue: update.goalValue }
        });
      }
    });
    return prisma.program.findUniqueOrThrow({
      where: { id: program.id },
      include: { metrics: true, user: true }
    });
  }
  return ensureCompleteProgramMetrics(program.id);
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

export async function updateProgramMetricSnapshot(
  user: { id: string; role: Role },
  programId: string,
  snapshotId: string,
  values: SnapshotValueInput[]
) {
  const program = await getProgram(user, programId);
  if (!program) throw new Error('Program not found');

  const snapshot = await prisma.programMetricSnapshot.findFirst({
    where: { id: snapshotId, programId }
  });
  if (!snapshot) throw new Error('Snapshot not found');

  return prisma.$transaction(async (tx) => {
    await tx.programMetricSnapshotValue.deleteMany({ where: { snapshotId } });
    await tx.programMetricSnapshotValue.createMany({
      data: values.map((value) => ({
        snapshotId,
        metricType: value.metricType as never,
        currentValue: value.currentValue,
        unit: value.unit
      }))
    });

    return tx.programMetricSnapshot.update({
      where: { id: snapshotId },
      data: { updatedAt: new Date() },
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

export async function upsertSnapshotMeasurement(
  user: { id: string; role: Role },
  programId: string,
  input: { date: string; metricType: string; currentValue: number; unit: string }
) {
  const program = await getProgram(user, programId);
  if (!program) throw new Error('Program not found');

  const day = parseDateParam(input.date);

  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.programMetricSnapshot.upsert({
      where: { programId_date: { programId, date: day } },
      create: { programId, date: day },
      update: { updatedAt: new Date() }
    });

    await tx.programMetricSnapshotValue.upsert({
      where: {
        snapshotId_metricType: {
          snapshotId: snapshot.id,
          metricType: input.metricType as never
        }
      },
      create: {
        snapshotId: snapshot.id,
        metricType: input.metricType as never,
        currentValue: input.currentValue,
        unit: input.unit
      },
      update: {
        currentValue: input.currentValue,
        unit: input.unit
      }
    });

    return tx.programMetricSnapshot.findUniqueOrThrow({
      where: { id: snapshot.id },
      include: { values: true }
    });
  });
}

function serializeProgressPhotoSet(photoSet: {
  id: string;
  date: Date;
  frontUrl: string | null;
  sideUrl: string | null;
  backUrl: string | null;
}) {
  return {
    id: photoSet.id,
    date: photoSet.date.toISOString().slice(0, 10),
    frontUrl: photoSet.frontUrl,
    sideUrl: photoSet.sideUrl,
    backUrl: photoSet.backUrl
  };
}

export async function listProgressPhotoSets(user: { id: string; role: Role }, programId: string) {
  const program = await getProgram(user, programId);
  if (!program) throw new Error('Program not found');

  const rows = await prisma.programProgressPhotoSet.findMany({
    where: { programId },
    orderBy: { date: 'desc' }
  });
  return rows.map(serializeProgressPhotoSet);
}

export async function upsertProgressPhotoSet(
  user: { id: string; role: Role },
  programId: string,
  input: { date: string; frontUrl?: string | null; sideUrl?: string | null; backUrl?: string | null; id?: string }
) {
  const program = await getProgram(user, programId);
  if (!program) throw new Error('Program not found');

  const day = parseDateParam(input.date);
  const data = {
    frontUrl: input.frontUrl?.trim() || null,
    sideUrl: input.sideUrl?.trim() || null,
    backUrl: input.backUrl?.trim() || null
  };

  if (input.id) {
    const updated = await prisma.programProgressPhotoSet.update({
      where: { id: input.id },
      data
    });
    return serializeProgressPhotoSet(updated);
  }

  const created = await prisma.programProgressPhotoSet.upsert({
    where: { programId_date: { programId, date: day } },
    create: { programId, date: day, ...data },
    update: { ...data, updatedAt: new Date() }
  });
  return serializeProgressPhotoSet(created);
}
