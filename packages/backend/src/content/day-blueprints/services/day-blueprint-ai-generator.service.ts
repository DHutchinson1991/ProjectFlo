import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  DayBlueprintGenerationMode,
  DayBlueprintPlacementFacing,
  DayBlueprintPlacementPosition,
} from '@prisma/client';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { DayBlueprintAiRunLoggerFactory, type DayBlueprintAiKnowledgeReport } from './day-blueprint-ai-run-logger';
import { type DensityLibrary } from './day-designer-density.types';
import { DayDesignerDensityService } from './day-designer-density.service';
import { DayBlueprintSpatialGeneratorService } from './day-blueprint-spatial-generator.service';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';
import { prepareDayGenerationContext } from './day-blueprint-ai-generation.context';
import { runDayGenerationPipeline } from './day-blueprint-ai-generation.pipeline';
import { runDayNormalGenerationPipeline } from './day-blueprint-normal-generation.pipeline';
import { handleGenerationError } from './day-blueprint-ai-generation.failure';

@Injectable()
export class DayBlueprintAiGeneratorService {
  private readonly logger = new Logger(DayBlueprintAiGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: DayBlueprintVersionsService,
    private readonly gemma: GemmaService,
    private readonly aiEvents: DayBlueprintAiEventsService,
    private readonly spatialGenerator: DayBlueprintSpatialGeneratorService,
    private readonly skills: SkillLoaderService,
    private readonly density: DayDesignerDensityService,
    private readonly runLoggerFactory: DayBlueprintAiRunLoggerFactory = new DayBlueprintAiRunLoggerFactory(),
  ) {}

  async generateDay(
    versionId: number,
    dayId: number,
    options: { prompt?: string; activityId?: number; mode?: DayBlueprintGenerationMode },
  ): Promise<{
    runId: number;
    momentsCreated: number;
    actionsCreated: number;
    placementsCreated: number;
    momentsWithCoverage: number;
  }> {
    const mode = await this.resolveGenerationMode(versionId, options.mode);
    const resolvedOptions = {
      ...options,
      mode,
    };
    const ctx = await prepareDayGenerationContext({
      prisma: this.prisma,
      versions: this.versions,
      aiEvents: this.aiEvents,
      density: this.density,
      runLoggerFactory: this.runLoggerFactory,
      versionId,
      dayId,
      options: resolvedOptions,
    });

    try {
      if (mode === 'AI') {
        return await runDayGenerationPipeline({
          prisma: this.prisma,
          gemma: this.gemma,
          skills: this.skills,
          aiEvents: this.aiEvents,
          spatialGenerator: this.spatialGenerator,
          logger: this.logger,
          versionId,
          dayId,
          options: resolvedOptions,
          ctx,
        });
      }
      return await runDayNormalGenerationPipeline({
        prisma: this.prisma,
        aiEvents: this.aiEvents,
        logger: this.logger,
        versionId,
        dayId,
        options: resolvedOptions,
        ctx,
      });
    } catch (err) {
      const handled = await handleGenerationError({
        prisma: this.prisma,
        aiEvents: this.aiEvents,
        logger: this.logger,
        versionId,
        dayId,
        activityId: resolvedOptions.activityId,
        promptSummary: ctx.promptSummary,
        runId: ctx.runId,
        runLogger: ctx.runLogger,
        dayName: ctx.day.name,
        blueprint: ctx.day.version.day_blueprint,
        err,
      });
      if (handled.cancelled && handled.result) {
        return handled.result;
      }
      throw err;
    } finally {
      this.aiEvents.releaseRun(ctx.runId);
    }
  }

  async cancelRun(runId: number): Promise<{ runId: number; status: 'CANCEL_REQUESTED' | 'NOT_RUNNING' }> {
    const run = await this.prisma.dayBlueprintAiRun.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('AI run not found');
    if (run.status !== 'RUNNING') {
      return { runId, status: 'NOT_RUNNING' };
    }

    const now = new Date();
    const signalled = this.aiEvents.signalCancel(runId);
    this.logger.log(`cancelRun runId=${runId} signalled=${signalled}`);

    if (signalled) {
      await this.prisma.dayBlueprintAiRun.update({
        where: { id: runId },
        data: { cancel_requested_at: now },
      });
    } else {
      await this.prisma.dayBlueprintAiRun.update({
        where: { id: runId },
        data: {
          status: 'CANCELLED',
          cancel_requested_at: now,
          finished_at: now,
          error: 'Cancelled by user (run was not resumable)',
        },
      });
      this.logger.warn(`cancelRun runId=${runId} force-cancelled (no active controller)`);
    }

    return { runId, status: 'CANCEL_REQUESTED' };
  }

  private async resolveGenerationMode(
    versionId: number,
    requestedMode?: DayBlueprintGenerationMode,
  ): Promise<DayBlueprintGenerationMode> {
    const version = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: versionId },
      select: { id: true, generation_mode: true },
    });
    if (!version) throw new NotFoundException('Day blueprint version not found');

    const effectiveMode = requestedMode ?? version.generation_mode ?? 'NORMAL';
    if (requestedMode && requestedMode !== version.generation_mode) {
      await this.prisma.dayBlueprintVersion.update({
        where: { id: versionId },
        data: { generation_mode: requestedMode },
      });
    }
    return effectiveMode;
  }
}

export { DayBlueprintPlacementPosition, DayBlueprintPlacementFacing };
export type { DayBlueprintAiKnowledgeReport, DensityLibrary };
