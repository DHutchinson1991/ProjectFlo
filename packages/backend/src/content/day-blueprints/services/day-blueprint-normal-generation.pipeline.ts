import { Logger } from '@nestjs/common';
import { type PrismaService } from '../../../platform/prisma/prisma.service';
import { type DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { type PreparedDayGenerationContext } from './day-blueprint-ai-generation.context';
import { persistGeneratedPlan } from './day-blueprint-ai-plan-writer';
import { updateRunProgress } from './day-blueprint-ai-progress';
import { markKeyMomentByLongest } from './day-blueprint-plan.mapper';
import { type GeneratedActivity, type GeneratedSubjectAction, type SkeletonSlot } from './day-blueprint-ai.types';

export async function runDayNormalGenerationPipeline(args: {
  prisma: PrismaService;
  aiEvents: DayBlueprintAiEventsService;
  logger: Logger;
  versionId: number;
  dayId: number;
  options: { prompt?: string; activityId?: number };
  ctx: PreparedDayGenerationContext;
}): Promise<{
  runId: number;
  momentsCreated: number;
  actionsCreated: number;
  placementsCreated: number;
  momentsWithCoverage: number;
}> {
  const { prisma, aiEvents, logger, versionId, dayId, options, ctx } = args;
  const { day, runId, promptSummary, availableRoles, skeleton, checkCancelled, runLogger } = ctx;
  const blueprint = day.version.day_blueprint;

  await updateRunProgress(prisma, aiEvents, versionId, runId, {
    step: 'outline-streaming',
    label: `Building deterministic moment plan for ${skeleton.length} activit${skeleton.length === 1 ? 'y' : 'ies'}`,
    status: 'started',
    stepIndex: 0,
    totalSteps: 4,
  });

  const planActivities = await Promise.all(
    skeleton.map(async (slot) => {
      checkCancelled();
      return buildDeterministicActivityPlan({
        prisma,
        slot,
        brandId: blueprint.brand_id,
        availableRoles,
      });
    }),
  );

  await updateRunProgress(prisma, aiEvents, versionId, runId, {
    step: 'expansion-streaming',
    label: `Applying deterministic subject actions for ${skeleton.length} activit${skeleton.length === 1 ? 'y' : 'ies'}`,
    status: 'started',
    stepIndex: 1,
    totalSteps: 4,
  });

  runLogger.writeRequest({
    context: {
      phase: 'normal-deterministic',
      activityCount: planActivities.length,
      fallbackActivities: planActivities.filter((row) => row.moments?.some((m) => m.name.startsWith('Moment '))).length,
    },
    request: { mode: 'NORMAL', promptSummary, skeleton },
    userMessageChars: (options.prompt ?? '').length,
  });

  await updateRunProgress(prisma, aiEvents, versionId, runId, {
    step: 'normalize',
    label: 'Writing deterministic moments and subject actions',
    status: 'started',
    stepIndex: 2,
    totalSteps: 4,
  });

  const result = await persistGeneratedPlan({
    prisma,
    aiEvents,
    checkCancelled,
    versionId,
    dayId,
    runId,
    activityId: options.activityId,
    dayActivities: day.activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
    })),
    planActivities,
  });

  await prisma.dayBlueprintAiRun.update({
    where: { id: runId },
    data: {
      status: 'SUCCESS',
      finished_at: new Date(),
      prompt_summary: `${promptSummary} → NORMAL mode wrote ${result.momentsCreated} moments, ${result.actionsCreated} actions`,
    },
  });

  aiEvents.emit({
    versionId,
    runId,
    step: 'done',
    label: `Generated ${result.momentsCreated} moments, ${result.actionsCreated} actions (NORMAL mode)`,
    status: 'completed',
    stepIndex: 3,
    totalSteps: 4,
    data: {
      eventKind: 'summary',
      dayId,
      activityId: options.activityId,
      ...result,
      totalMoments: result.momentsCreated,
    },
  });

  runLogger.complete({
    ...result,
    mode: 'NORMAL',
  });
  logger.log(
    `NORMAL generation completed for version=${versionId} day=${dayId} run=${runId}: ${result.momentsCreated} moments`,
  );

  return { runId, ...result };
}

async function buildDeterministicActivityPlan(input: {
  prisma: PrismaService;
  slot: SkeletonSlot;
  brandId: number;
  availableRoles: string[];
}): Promise<GeneratedActivity> {
  const { prisma, slot, brandId, availableRoles } = input;
  const knowledge = await findBestKnowledgeBase(
    prisma,
    brandId,
    slot.name,
    slot.description,
  );
  const targetSeconds = Math.max(60, slot.targetDurationSeconds || 60);

  const moments = knowledge
    ? scaleKnowledgeEntries(knowledge.entries, targetSeconds).map((entry) => ({
      name: entry.name,
      description: entry.description ?? undefined,
      duration_seconds: entry.duration_seconds,
      subject_actions: toSubjectActions(entry.subject_actions, entry.name, availableRoles),
    }))
    : buildFallbackMoments(slot, availableRoles);

  return markKeyMomentByLongest({
    name: slot.name,
    description: slot.description,
    moments,
  });
}

async function findBestKnowledgeBase(
  prisma: PrismaService,
  brandId: number,
  activityName: string,
  activityDescription?: string,
): Promise<{
  entries: Array<{
    name: string;
    description: string | null;
    subject_actions: unknown;
    default_duration_seconds: number;
    min_duration_seconds: number | null;
    max_duration_seconds: number | null;
  }>;
} | null> {
  const { category, variant } = resolveCategoryAndVariant(activityName, activityDescription);

  const brandScoped = await prisma.momentKnowledgeBase.findMany({
    where: { brand_id: brandId, category, is_active: true },
    include: { entries: { orderBy: { order_index: 'asc' } } },
  });
  const defaults = await prisma.momentKnowledgeBase.findMany({
    where: { brand_id: null, category, is_active: true },
    include: { entries: { orderBy: { order_index: 'asc' } } },
  });

  const candidates = [...brandScoped, ...defaults];
  if (candidates.length === 0) return null;

  const wantedVariant = variant?.toLowerCase();
  const selected = candidates.find((base) => base.variant?.toLowerCase() === wantedVariant)
    ?? (category === 'Ceremony'
      ? candidates.find((base) => (base.variant ?? '').toLowerCase() === 'traditional')
      : null)
    ?? candidates[0];

  return { entries: selected.entries };
}

function resolveCategoryAndVariant(activityName: string, activityDescription?: string): { category: string; variant: string | null } {
  const text = `${activityName} ${activityDescription ?? ''}`.toLowerCase();

  const category = /mehndi|mehendi/.test(text)
    ? 'Mehndi'
    : /getting ready|bridal prep|groom prep|hair|makeup|prep\b/.test(text)
      ? 'Getting Ready'
      : /confetti|portraits?|group photos?|couple photos?/.test(text)
        ? 'Confetti & Photos'
        : /grand entrance|reception entry|room reveal/.test(text)
          ? 'Reception Entry'
          : /cake|speeches|toasts?/.test(text)
            ? 'Cake Cut & Speeches'
            : /first dance|evening party|open dancing|dance floor/.test(text)
              ? 'First Dance & Evening'
              : /formal dinner|wedding breakfast|dinner service|meal/.test(text)
                ? 'Formal Dinner'
                : /reception/.test(text)
                  ? 'Reception'
                  : /ceremony|vows|altar|aisle|mandap|registry|nikah/.test(text)
                    ? 'Ceremony'
                    : activityName.trim();

  const variant = /civil|registry/.test(text)
    ? 'Civil'
    : /hindu|mandap|baraat/.test(text)
      ? 'Hindu'
      : /pakistani|nikah|walima/.test(text)
        ? 'Pakistani'
        : /intimate|garden/.test(text)
          ? 'Intimate'
          : category === 'Ceremony'
            ? 'Traditional'
            : null;

  return { category, variant };
}

function scaleKnowledgeEntries(
  entries: Array<{
    name: string;
    description: string | null;
    subject_actions: unknown;
    default_duration_seconds: number;
    min_duration_seconds: number | null;
    max_duration_seconds: number | null;
  }>,
  targetSeconds: number,
): Array<{
  name: string;
  description: string | null;
  subject_actions: unknown;
  duration_seconds: number;
  min: number;
  max: number;
}> {
  const defaultTotal = Math.max(1, entries.reduce((sum, entry) => sum + entry.default_duration_seconds, 0));
  const scaled = entries.map((entry) => ({
    name: entry.name,
    description: entry.description,
    subject_actions: entry.subject_actions,
    min: entry.min_duration_seconds ?? 30,
    max: entry.max_duration_seconds ?? Math.max(targetSeconds, entry.default_duration_seconds),
    duration_seconds: clamp(
      Math.round((entry.default_duration_seconds / defaultTotal) * targetSeconds),
      entry.min_duration_seconds ?? 30,
      entry.max_duration_seconds ?? Math.max(targetSeconds, entry.default_duration_seconds),
    ),
  }));

  let diff = targetSeconds - scaled.reduce((sum, entry) => sum + entry.duration_seconds, 0);
  const direction = diff >= 0 ? 1 : -1;

  while (diff !== 0) {
    let adjusted = false;
    for (const entry of scaled) {
      const nextDuration = entry.duration_seconds + direction;
      if (nextDuration < entry.min || nextDuration > entry.max) continue;
      entry.duration_seconds = nextDuration;
      diff -= direction;
      adjusted = true;
      if (diff === 0) break;
    }
    if (!adjusted) break;
  }

  return scaled;
}

function buildFallbackMoments(slot: SkeletonSlot, availableRoles: string[]) {
  const roleActions = createFallbackActions('the moment', availableRoles);
  const count = Math.max(1, Math.min(4, slot.momentCount || 3));
  const targetSeconds = Math.max(60, slot.targetDurationSeconds || 60);
  const perMoment = Math.max(60, Math.round(targetSeconds / count));
  const names = ['Moment 1', 'Moment 2', 'Moment 3', 'Moment 4'];
  return Array.from({ length: count }, (_, index) => ({
    name: names[index] ?? `Moment ${index + 1}`,
    description: `Deterministic fallback for ${slot.name}.`,
    duration_seconds: perMoment,
    subject_actions: roleActions,
  }));
}

function toSubjectActions(
  rawActions: unknown,
  momentName: string,
  availableRoles: string[],
): GeneratedSubjectAction[] {
  if (rawActions && typeof rawActions === 'object' && !Array.isArray(rawActions)) {
    const entries = Object.entries(rawActions as Record<string, unknown>)
      .filter(([role, text]) => role.trim().length > 0 && typeof text === 'string' && text.trim().length > 0)
      .map(([role, text]) => ({ subject_role: role.trim(), action_text: String(text).trim() }));
    if (entries.length > 0) return entries;
  }
  return createFallbackActions(momentName, availableRoles);
}

function createFallbackActions(momentName: string, availableRoles: string[]): GeneratedSubjectAction[] {
  const roles = availableRoles.slice(0, 3);
  if (roles.length === 0) {
    return [{ subject_role: 'Primary Subject', action_text: `Primary subject is present for ${momentName}.` }];
  }
  return roles.map((role) => ({
    subject_role: role,
    action_text: `${role} is present for ${momentName}.`,
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
