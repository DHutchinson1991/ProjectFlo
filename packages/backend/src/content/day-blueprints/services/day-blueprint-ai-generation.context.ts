import { BadRequestException, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '../../../platform/prisma/prisma.service';
import { type DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { type DayBlueprintAiRunLogger, type DayBlueprintAiRunLoggerFactory } from './day-blueprint-ai-run-logger';
import { type DayBlueprintVersionsService } from './day-blueprint-versions.service';
import { type DayDesignerDensityService } from './day-designer-density.service';
import { type DensityLibrary } from './day-designer-density.types';
import { buildSkeleton } from './day-blueprint-outline.rules';
import { type SkeletonSlot } from './day-blueprint-ai.types';

interface GenerateDayOptions {
  prompt?: string;
  activityId?: number;
  mode?: 'NORMAL' | 'AI';
}

interface DayForGeneration {
  id: number;
  name: string;
  description: string | null;
  day_blueprint_version_id: number;
  version: {
    day_blueprint: {
      id: number;
      brand_id: number;
      event_category: string;
      display_name: string;
    };
    subject_roles: Array<{
      subject_role: {
        role_name: string;
      };
    }>;
  };
  activities: Array<{
    id: number;
    name: string;
    description: string | null;
    order_index: number;
    default_duration_minutes: number | null;
    target_moment_count?: number | null;
  }>;
}

export interface PreparedDayGenerationContext {
  day: DayForGeneration;
  promptSummary: string;
  availableRoles: string[];
  densityLibrary: DensityLibrary;
  skeleton: SkeletonSlot[];
  runId: number;
  runLogger: DayBlueprintAiRunLogger;
  cancelController: AbortController;
  checkCancelled: () => void;
}

export async function prepareDayGenerationContext(args: {
  prisma: PrismaService;
  versions: DayBlueprintVersionsService;
  aiEvents: DayBlueprintAiEventsService;
  density: DayDesignerDensityService;
  runLoggerFactory: DayBlueprintAiRunLoggerFactory;
  versionId: number;
  dayId: number;
  options: GenerateDayOptions;
}): Promise<PreparedDayGenerationContext> {
  const { prisma, versions, aiEvents, density, runLoggerFactory, versionId, dayId, options } = args;
  await versions.assertDraft(versionId);

  const day = await prisma.dayBlueprintDay.findUnique({
    where: { id: dayId },
    include: {
      version: {
        include: {
          day_blueprint: true,
          subject_roles: {
            include: { subject_role: true },
            orderBy: { order_index: 'asc' },
          },
        },
      },
      activities: {
        select: {
          id: true,
          name: true,
          description: true,
          order_index: true,
          default_duration_minutes: true,
          target_moment_count: true,
        },
        orderBy: { order_index: 'asc' },
      },
    },
  }) as DayForGeneration | null;
  if (!day) throw new NotFoundException('Day not found');
  if (day.day_blueprint_version_id !== versionId) {
    throw new BadRequestException('Day does not belong to this version');
  }
  if (options.activityId && !day.activities.some((activity) => activity.id === options.activityId)) {
    throw new BadRequestException('Selected activity does not belong to this day');
  }
  if (day.activities.length === 0) {
    throw new BadRequestException(
      'Add at least one activity before running AI — the AI fills moments for existing activities only.',
    );
  }

  const blueprint = day.version.day_blueprint;
  const promptSummary = (options.prompt ?? '').slice(0, 2000) || `Generate ${day.name}`;
  const runLogger = runLoggerFactory.create({
    brandId: blueprint.brand_id,
    blueprintId: blueprint.id,
    blueprintName: blueprint.display_name,
    versionId,
    dayId,
    dayName: day.name,
    route: `/api/day-blueprints/versions/${versionId}/days/${dayId}/ai-generate`,
  });

  const run = await prisma.dayBlueprintAiRun.create({
    data: {
      day_blueprint_version_id: versionId,
      run_kind: 'GENERATE',
      status: 'RUNNING',
      run_key: runLogger.getRunId(),
      prompt_summary: options.mode === 'AI'
        ? `${promptSummary} · AI generation: outline + per-activity expansion`
        : `${promptSummary} · NORMAL generation: deterministic knowledge templates`,
      started_at: new Date(),
    },
  });
  runLogger.attachDatabaseRun(run.id);

  const cancelController = aiEvents.registerRun(run.id);
  const checkCancelled = () => {
    if (cancelController.signal.aborted) {
      const err = new Error('CANCELLED_BY_USER');
      (err as Error & { isCancellation?: boolean }).isCancellation = true;
      throw err;
    }
  };

  const availableRoles = day.version.subject_roles.map((link) => link.subject_role.role_name);
  const densityLibrary = await density.getDensity(blueprint.brand_id);
  const skeleton = buildSkeleton(
    day.activities,
    options.activityId ?? null,
    densityLibrary,
    (durSec, name, override) => density.estimateMomentCount(densityLibrary, durSec, name, override),
  );
  if (skeleton.length === 0) {
    throw new BadRequestException('No activities to generate for — add at least one activity first.');
  }

  return {
    day,
    promptSummary,
    availableRoles,
    densityLibrary,
    skeleton,
    runId: run.id,
    runLogger,
    cancelController,
    checkCancelled,
  };
}
