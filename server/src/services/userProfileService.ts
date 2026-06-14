import type { Role } from '@prisma/client';
import { ProgramStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { canAccessProgramClient, canAccessUser } from '../auth/requireRole.js';
import { normalizeGender } from './bloodPanelMetrics.js';
import { parseDateParam } from '../utils/dates.js';

type Actor = { id: string; role: Role };

function serializeDemographics(user: { gender: string | null; birthDate: Date | null }) {
  return {
    gender: user.gender,
    birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null
  };
}

async function assertDemographicsAccess(actor: Actor, userId: string) {
  if (await canAccessUser(actor, userId)) return;

  const program = await prisma.program.findFirst({
    where: { userId, status: ProgramStatus.ACTIVE },
    select: { coachId: true }
  });
  if (program && (await canAccessProgramClient(actor, userId, program.coachId))) return;

  throw new Error('Forbidden');
}

export async function getUserDemographics(actor: Actor, userId: string) {
  await assertDemographicsAccess(actor, userId);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { gender: true, birthDate: true }
  });
  return serializeDemographics(user);
}

export async function updateUserDemographics(
  actor: Actor,
  userId: string,
  input: { gender?: string | null; birthDate?: string | null }
) {
  await assertDemographicsAccess(actor, userId);

  const data: { gender?: string | null; birthDate?: Date | null } = {};
  if (input.gender !== undefined) {
    data.gender = input.gender ? normalizeGender(input.gender) : null;
    if (input.gender && !data.gender) {
      throw new Error('Gender must be male or female.');
    }
  }
  if (input.birthDate !== undefined) {
    data.birthDate = input.birthDate ? parseDateParam(input.birthDate) : null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { gender: true, birthDate: true }
  });
  return serializeDemographics(user);
}
