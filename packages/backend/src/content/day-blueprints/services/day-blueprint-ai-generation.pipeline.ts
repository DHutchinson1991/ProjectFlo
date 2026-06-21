import { Logger } from '@nestjs/common';
import { type GemmaService } from '../../../ai/gemma/gemma.service';
import { type SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { type PrismaService } from '../../../platform/prisma/prisma.service';
import { type DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { type DayBlueprintSpatialGeneratorService } from './day-blueprint-spatial-generator.service';
import {
  validateExpansion,
} from './day-blueprint-expansion.rules';
import { parseExpansion, parseOutline } from './day-blueprint-ai-parser';
import { markKeyMomentByLongest, stitchActivity } from './day-blueprint-plan.mapper';
import { buildKnowledgeReport, toPersistedReport } from './day-blueprint-ai-report.builder';
import { persistGeneratedPlan } from './day-blueprint-ai-plan-writer';
import { buildOutlineRequest, buildExpansionRequest } from './day-blueprint-ai-generation.requests';
import { callGemmaStreaming } from './day-blueprint-ai-generation.streaming';
import {
  collectOutlineValidationFailures,
  normalizeOutlineDurations,
  sanitizeRitualOnlyCeremonyOutline,
  validateOutline,
} from './day-blueprint-outline.rules';
import { type PhaseTimings } from './day-blueprint-ai.types';
import { type PreparedDayGenerationContext } from './day-blueprint-ai-generation.context';
import { updateRunProgress } from './day-blueprint-ai-progress';
export async function runDayGenerationPipeline(args: {
  prisma: PrismaService;
  gemma: GemmaService;
  skills: SkillLoaderService;
  aiEvents: DayBlueprintAiEventsService;
  spatialGenerator: DayBlueprintSpatialGeneratorService;
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
  const { prisma, gemma, skills, aiEvents, spatialGenerator, logger, versionId, dayId, options, ctx } = args;
  const { day, runId, runLogger, availableRoles, skeleton, promptSummary, checkCancelled, cancelController } = ctx;
  const blueprint = day.version.day_blueprint;
  const phaseTimings: PhaseTimings = { outlineMs: 0, expansionMs: 0, expansionParallelism: skeleton.length };
  await updateRunProgress(prisma, aiEvents, versionId, runId, {
    step: 'outline-streaming',
    label: `Outlining ${skeleton.length} activit${skeleton.length === 1 ? 'y' : 'ies'} (Phase 1)`,
    status: 'started',
    stepIndex: 0,
    totalSteps: 4,
  });

  const outlineRequest = buildOutlineRequest({
    skills,
    eventCategory: blueprint.event_category,
    blueprintName: blueprint.display_name,
    dayName: day.name,
    dayDescription: day.description,
    userPrompt: options.prompt,
    skeleton,
  });
  runLogger.writeRequest({
    context: { phase: 'outline', skeleton, availableRoles },
    request: outlineRequest.chat,
    userMessageChars: outlineRequest.userMessage.length,
  });

  const outlineStarted = Date.now();
  let outlineCall = await callGemmaStreaming({
    gemma,
    aiEvents,
    request: outlineRequest,
    runLogger,
    versionId,
    runId,
    dayId,
    signal: cancelController.signal,
    onParserError: (message) => logger.warn(`Stream parser error: ${message}`),
  });

  let outline = parseOutline(outlineCall.reply);
  checkCancelled();
  normalizeOutlineDurations(outline, skeleton);
  sanitizeRitualOnlyCeremonyOutline(outline, skeleton);
  let outlineFailures = collectOutlineValidationFailures(outline, skeleton);

  if (outlineFailures.length > 0) {
    const hint = outlineFailures.join('; ');
    logger.warn(
      `Phase 1 outline validation failed (attempt 1), retrying once with repair hint for version=${versionId} day=${dayId}: ${hint.slice(0, 500)}`,
    );

    const retryRequest = buildOutlineRequest({
      skills,
      eventCategory: blueprint.event_category,
      blueprintName: blueprint.display_name,
      dayName: day.name,
      dayDescription: day.description,
      userPrompt: options.prompt,
      skeleton,
      outlineRepairHint: hint,
      requestLabelSuffix: '-repair',
    });
    runLogger.writeRequest({
      context: { phase: 'outline-repair', skeleton, availableRoles, outlineFailures },
      request: retryRequest.chat,
      userMessageChars: retryRequest.userMessage.length,
    });

    outlineCall = await callGemmaStreaming({
      gemma,
      aiEvents,
      request: retryRequest,
      runLogger,
      versionId,
      runId,
      dayId,
      signal: cancelController.signal,
      onParserError: (message) => logger.warn(`Stream parser error: ${message}`),
    });
    outline = parseOutline(outlineCall.reply);
    checkCancelled();
    normalizeOutlineDurations(outline, skeleton);
    sanitizeRitualOnlyCeremonyOutline(outline, skeleton);
    outlineFailures = collectOutlineValidationFailures(outline, skeleton);
  }

  phaseTimings.outlineMs = Date.now() - outlineStarted;
  validateOutline(outline, skeleton);

  await updateRunProgress(prisma, aiEvents, versionId, runId, {
    step: 'expansion-streaming',
    label: `Expanding subject actions for ${skeleton.length} activit${skeleton.length === 1 ? 'y' : 'ies'} (Phase 2)`,
    status: 'started',
    stepIndex: 1,
    totalSteps: 4,
  });

  const expansionStarted = Date.now();
  const expansionResults = await Promise.all(
    outline.activities.map(async (activity, activityIndex) => {
      checkCancelled();
      const slot = skeleton[activityIndex];
      aiEvents.emit({
        versionId,
        runId,
        step: 'expansion-streaming',
        label: `Expanding ${activity.name}`,
        status: 'started',
        stepIndex: 1,
        totalSteps: 4,
        data: {
          eventKind: 'activity-streaming',
          dayId,
          activityName: activity.name,
          generationAttempt: 0,
        },
      });

      const expansionRequest = buildExpansionRequest({
        skills,
        activityName: activity.name,
        durationMinutes: slot.targetDurationSeconds > 0 ? Math.round(slot.targetDurationSeconds / 60) : null,
        availableRoles,
        moments: activity.moments,
      });
      runLogger.writeRequest({
        context: { phase: 'expansion', activityName: activity.name, momentCount: activity.moments.length },
        request: expansionRequest.chat,
        userMessageChars: expansionRequest.userMessage.length,
      });

      const expansionResponse = await gemma.chat(expansionRequest.chat);
      runLogger.writeLlmResponse(expansionResponse);
      const expanded = parseExpansion(expansionResponse.reply, activity);
      validateExpansion(activity.name, expanded, availableRoles);
      return { outline: activity, expansion: expanded };
    }),
  );
  phaseTimings.expansionMs = Date.now() - expansionStarted;

  const planActivities = expansionResults.map(({ outline: outlineActivity, expansion }) =>
    markKeyMomentByLongest(stitchActivity(outlineActivity, expansion)),
  );

  const plannedReport = buildKnowledgeReport({
    runLogger,
    dbRunId: runId,
    status: 'running',
    brandId: blueprint.brand_id,
    blueprintId: blueprint.id,
    blueprintName: blueprint.display_name,
    versionId,
    dayId,
    dayName: day.name,
    promptSummary,
    promptChars: outlineRequest.userMessage.length,
    outlineResponse: outlineCall.response,
    activities: planActivities,
    phases: phaseTimings,
  });
  runLogger.writeReport(plannedReport);

  await updateRunProgress(prisma, aiEvents, versionId, runId, {
    step: 'normalize',
    label: 'Writing moments and subject actions',
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

  if (result.momentsCreated > 0) {
    try {
      checkCancelled();
      await spatialGenerator.generateForDay(versionId, dayId, {
        activityId: options.activityId,
        runId,
      });
    } catch (spatialErr) {
      if ((spatialErr as Error & { isCancellation?: boolean })?.isCancellation) {
        throw spatialErr;
      }
      logger.warn(
        `Spatial post-pass failed for version=${versionId} day=${dayId} run=${runId}: ${
          spatialErr instanceof Error ? spatialErr.message : String(spatialErr)
        }`,
      );
    }
  }

  await prisma.dayBlueprintAiRun.update({
    where: { id: runId },
    data: {
      status: 'SUCCESS',
      finished_at: new Date(),
      prompt_summary: `${promptSummary} → ${result.momentsCreated} moments, ${result.actionsCreated} actions, ${result.placementsCreated} placements predicted, ${result.momentsWithCoverage}/${result.momentsCreated} moments covered`,
    },
  });
  aiEvents.emit({
    versionId,
    runId,
    step: 'done',
    label: `Generated ${result.momentsCreated} moments, ${result.actionsCreated} actions in ${(phaseTimings.outlineMs + phaseTimings.expansionMs) / 1000}s`,
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
  runLogger.writeReport({
    ...plannedReport,
    status: 'completed',
    persisted: toPersistedReport(result),
    phases: phaseTimings,
  });
  runLogger.complete({
    ...result,
    outlineMs: phaseTimings.outlineMs,
    expansionMs: phaseTimings.expansionMs,
    expansionParallelism: phaseTimings.expansionParallelism,
  });

  return { runId, ...result };
}
