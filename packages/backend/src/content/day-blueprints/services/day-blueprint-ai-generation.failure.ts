import { BadRequestException, Logger } from '@nestjs/common';
import { type PrismaService } from '../../../platform/prisma/prisma.service';
import { type DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { buildKnowledgeReport } from './day-blueprint-ai-report.builder';
import { type PreparedDayGenerationContext } from './day-blueprint-ai-generation.context';

export async function handleGenerationError(args: {
  prisma: PrismaService;
  aiEvents: DayBlueprintAiEventsService;
  logger: Logger;
  versionId: number;
  dayId: number;
  activityId?: number;
  promptSummary: string;
  runId: number;
  runLogger: PreparedDayGenerationContext['runLogger'];
  dayName: string;
  blueprint: { brand_id: number; id: number; display_name: string };
  err: unknown;
}): Promise<{
  cancelled: boolean;
  result?: { runId: number; momentsCreated: number; actionsCreated: number; placementsCreated: number; momentsWithCoverage: number };
}> {
  const { prisma, aiEvents, logger, versionId, dayId, activityId, promptSummary, runId, runLogger, dayName, blueprint, err } = args;
  const isCancel = Boolean((err as Error & { isCancellation?: boolean })?.isCancellation);
  const message = err instanceof Error ? err.message : String(err);
  if (isCancel) {
    logger.log(`generateDay cancelled by user for version=${versionId} day=${dayId} run=${runId}`);
    await prisma.dayBlueprintAiRun.update({
      where: { id: runId },
      data: {
        status: 'CANCELLED',
        error: 'Cancelled by user',
        finished_at: new Date(),
      },
    });
    aiEvents.emit({
      versionId,
      runId,
      step: 'cancelled',
      label: 'Cancelled by user — moments restored',
      status: 'failed',
      stepIndex: 3,
      totalSteps: 4,
      data: { eventKind: 'cancelled', dayId, activityId },
    });
    aiEvents.emit({
      versionId,
      runId,
      step: 'done',
      label: 'Run cancelled',
      status: 'failed',
      stepIndex: 3,
      totalSteps: 4,
      data: { eventKind: 'cancelled', dayId },
    });
    runLogger.fail('Cancelled by user', { error: 'CANCELLED_BY_USER' });
    return { cancelled: true, result: { runId, momentsCreated: 0, actionsCreated: 0, placementsCreated: 0, momentsWithCoverage: 0 } };
  }

  logger.warn(`generateDay failed for version=${versionId} day=${dayId}: ${message}`);
  await prisma.dayBlueprintAiRun.update({
    where: { id: runId },
    data: { status: 'FAILED', error: message.slice(0, 2000), finished_at: new Date() },
  });
  aiEvents.emit({
    versionId,
    runId,
    step: 'error',
    label: 'Day Designer AI generation failed',
    status: 'failed',
    stepIndex: 3,
    totalSteps: 4,
    error: message.slice(0, 2000),
    data: {
      eventKind: 'summary',
      dayId,
      activityId,
    },
  });
  runLogger.writeReport(buildKnowledgeReport({
    runLogger,
    dbRunId: runId,
    status: 'failed',
    brandId: blueprint.brand_id,
    blueprintId: blueprint.id,
    blueprintName: blueprint.display_name,
    versionId,
    dayId,
    dayName,
    promptSummary,
    promptChars: promptSummary.length,
    error: message.slice(0, 2000),
  }));
  runLogger.fail('Day Designer AI generation failed', { error: message.slice(0, 2000) });
  throw new BadRequestException(`Day generation failed: ${message}`);
}
