import { ProgramStatus, type BloodPanel, type BloodPanelReferenceRange, type Role, type User } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { canAccessProgramClient, canAccessUser } from '../auth/requireRole.js';
import { parseDateParam } from '../utils/dates.js';
import {
  BLOOD_PANEL_METRICS,
  calculateAge,
  calculateBloodPanelStatus,
  calculateTrend,
  findReferenceRange,
  formatReferenceRangeLabels,
  hasAnyBloodPanelMetric,
  normalizeGender,
  type BloodPanelMetricValue,
  type BloodPanelReferenceRangeRow
} from './bloodPanelMetrics.js';

type Actor = { id: string; role: Role };

type PanelInput = {
  labDate: string;
  labProvider?: string | null;
  glucose?: number | null;
  totalCholesterol?: number | null;
  hdl?: number | null;
  ldl?: number | null;
  triglycerides?: number | null;
  hemoglobinA1c?: number | null;
  insulin?: number | null;
  testosterone?: number | null;
  notes?: string | null;
};

function toNumber(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeReferenceRange(range: BloodPanelReferenceRange): BloodPanelReferenceRangeRow {
  return {
    metricKey: range.metricKey,
    gender: range.gender,
    ageMin: range.ageMin,
    ageMax: range.ageMax,
    lowMax: toNumber(range.lowMax),
    normalMin: Number(range.normalMin),
    normalMax: Number(range.normalMax),
    highMin: toNumber(range.highMin),
    unit: range.unit,
    description: range.description
  };
}

async function loadReferenceRanges() {
  const rows = await prisma.bloodPanelReferenceRange.findMany();
  return rows.map(serializeReferenceRange);
}

function getDemographics(user: Pick<User, 'gender' | 'birthDate'>, onDate: Date) {
  return {
    gender: normalizeGender(user.gender),
    age: calculateAge(user.birthDate, onDate)
  };
}

function enrichPanelMetrics(
  panel: BloodPanel,
  previousPanel: BloodPanel | null,
  ranges: BloodPanelReferenceRangeRow[],
  demographics: ReturnType<typeof getDemographics>
): BloodPanelMetricValue[] {
  return BLOOD_PANEL_METRICS.map((metric) => {
    const value = toNumber(panel[metric.field as keyof BloodPanel]);
    const previousValue = previousPanel ? toNumber(previousPanel[metric.field as keyof BloodPanel]) : null;
    if (value == null) {
      return {
        key: metric.key,
        label: metric.label,
        value: null,
        unit: metric.unit,
        status: null,
        previousValue,
        trend: null,
        referenceRange: null,
        description: null
      };
    }

    const range = findReferenceRange(ranges, metric.key, demographics.gender, demographics.age);
    const status = range ? calculateBloodPanelStatus(value, range) : 'unknown';
    return {
      key: metric.key,
      label: metric.label,
      value,
      unit: metric.unit,
      status,
      previousValue,
      trend: calculateTrend(value, previousValue),
      referenceRange: range ? formatReferenceRangeLabels(range) : null,
      description: range?.description ?? null
    };
  });
}

function serializePanel(
  panel: BloodPanel & { enteredBy?: Pick<User, 'id' | 'firstName' | 'lastName'> | null },
  previousPanel: BloodPanel | null,
  ranges: BloodPanelReferenceRangeRow[],
  user: Pick<User, 'gender' | 'birthDate'>
) {
  return {
    id: panel.id,
    labDate: panel.labDate.toISOString().slice(0, 10),
    labProvider: panel.labProvider,
    notes: panel.notes,
    enteredBy: panel.enteredBy
      ? { id: panel.enteredBy.id, name: `${panel.enteredBy.firstName} ${panel.enteredBy.lastName}`.trim() }
      : null,
    metrics: enrichPanelMetrics(panel, previousPanel, ranges, getDemographics(user, panel.labDate))
  };
}

async function assertBloodPanelAccess(actor: Actor, userId: string) {
  if (await canAccessUser(actor, userId)) return;

  const program = await prisma.program.findFirst({
    where: { userId, status: ProgramStatus.ACTIVE },
    select: { coachId: true }
  });
  if (program && (await canAccessProgramClient(actor, userId, program.coachId))) return;

  throw new Error('Forbidden');
}

async function getSubjectUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, gender: true, birthDate: true, firstName: true, lastName: true }
  });
  if (!user) throw new Error('User not found');
  return user;
}

export async function listBloodPanels(actor: Actor, userId: string, limit = 50) {
  await assertBloodPanelAccess(actor, userId);
  const [user, ranges, panels] = await Promise.all([
    getSubjectUser(userId),
    loadReferenceRanges(),
    prisma.bloodPanel.findMany({
      where: { userId },
      include: { enteredBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ labDate: 'desc' }, { createdAt: 'desc' }],
      take: limit
    })
  ]);

  return panels.map((panel, index) => {
    const previousPanel = panels[index + 1] ?? null;
    return serializePanel(panel, previousPanel, ranges, user);
  });
}

export async function getLatestBloodPanel(actor: Actor, userId: string) {
  const panels = await listBloodPanels(actor, userId, 2);
  return panels[0] ?? null;
}

export async function getBloodPanel(actor: Actor, userId: string, panelId: string) {
  await assertBloodPanelAccess(actor, userId);
  const [user, ranges, panels] = await Promise.all([
    getSubjectUser(userId),
    loadReferenceRanges(),
    prisma.bloodPanel.findMany({
      where: { userId },
      include: { enteredBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ labDate: 'desc' }, { createdAt: 'desc' }]
    })
  ]);

  const index = panels.findIndex((panel) => panel.id === panelId);
  if (index === -1) throw new Error('Blood panel not found');

  return serializePanel(panels[index], panels[index + 1] ?? null, ranges, user);
}

export async function createBloodPanel(actor: Actor, userId: string, input: PanelInput) {
  await assertBloodPanelAccess(actor, userId);
  if (!hasAnyBloodPanelMetric(input)) {
    throw new Error('Enter at least one blood panel metric.');
  }

  const panel = await prisma.bloodPanel.create({
    data: {
      userId,
      labDate: parseDateParam(input.labDate),
      labProvider: input.labProvider?.trim() || null,
      glucose: input.glucose ?? null,
      totalCholesterol: input.totalCholesterol ?? null,
      hdl: input.hdl ?? null,
      ldl: input.ldl ?? null,
      triglycerides: input.triglycerides ?? null,
      hemoglobinA1c: input.hemoglobinA1c ?? null,
      insulin: input.insulin ?? null,
      testosterone: input.testosterone ?? null,
      notes: input.notes?.trim() || null,
      enteredByUserId: actor.id
    },
    include: { enteredBy: { select: { id: true, firstName: true, lastName: true } } }
  });

  return getBloodPanel(actor, userId, panel.id);
}

export async function updateBloodPanel(actor: Actor, userId: string, panelId: string, input: PanelInput) {
  await assertBloodPanelAccess(actor, userId);
  if (!hasAnyBloodPanelMetric(input)) {
    throw new Error('Enter at least one blood panel metric.');
  }

  const existing = await prisma.bloodPanel.findFirst({ where: { id: panelId, userId } });
  if (!existing) throw new Error('Blood panel not found');

  await prisma.bloodPanel.update({
    where: { id: panelId },
    data: {
      labDate: parseDateParam(input.labDate),
      labProvider: input.labProvider?.trim() || null,
      glucose: input.glucose ?? null,
      totalCholesterol: input.totalCholesterol ?? null,
      hdl: input.hdl ?? null,
      ldl: input.ldl ?? null,
      triglycerides: input.triglycerides ?? null,
      hemoglobinA1c: input.hemoglobinA1c ?? null,
      insulin: input.insulin ?? null,
      testosterone: input.testosterone ?? null,
      notes: input.notes?.trim() || null
    }
  });

  return getBloodPanel(actor, userId, panelId);
}

export async function getBloodPanelReferenceRanges(gender?: string | null, age?: number | null) {
  const ranges = await loadReferenceRanges();
  const normalizedGender = normalizeGender(gender);
  if (normalizedGender == null && age == null) return ranges;

  return ranges.filter((range) => {
    const genderMatch = !normalizedGender || range.gender === normalizedGender || range.gender === 'any';
    const ageMatch = age == null || (age >= range.ageMin && age <= range.ageMax);
    return genderMatch && ageMatch;
  });
}

export async function getBloodPanelHistoryForExport(actor: Actor, userId: string, limit = 6) {
  return listBloodPanels(actor, userId, limit);
}
