import { type GemmaService } from '../../../ai/gemma/gemma.service';
import { type DayBlueprintAiKnowledgeReport, type DayBlueprintAiRunLogger } from './day-blueprint-ai-run-logger';
import { type GeneratedActivity, type GeneratedMoment, type PhaseTimings } from './day-blueprint-ai.types';

interface KnowledgeReportInput {
  runLogger: DayBlueprintAiRunLogger;
  dbRunId: number;
  status: 'running' | 'completed' | 'failed';
  brandId: number;
  blueprintId: number;
  blueprintName: string;
  versionId: number;
  dayId: number;
  dayName: string;
  promptSummary: string;
  promptChars: number;
  outlineResponse?: Awaited<ReturnType<GemmaService['chat']>>;
  activities?: GeneratedActivity[];
  phases?: PhaseTimings;
  error?: string;
}

export function buildKnowledgeReport(input: KnowledgeReportInput): DayBlueprintAiKnowledgeReport {
  return {
    v: 1,
    run: input.runLogger.getRunId(),
    db: input.dbRunId,
    status: input.status,
    ids: {
      brand: input.brandId,
      blueprint: input.blueprintId,
      version: input.versionId,
      day: input.dayId,
    },
    label: { blueprint: input.blueprintName, day: input.dayName },
    prompt: { chars: input.promptChars, brief: input.promptSummary },
    llm: input.outlineResponse
      ? {
        model: input.outlineResponse.model,
        provider: input.outlineResponse.provider,
        pt: input.outlineResponse.usage?.prompt_tokens,
        ct: input.outlineResponse.usage?.completion_tokens,
        tt: input.outlineResponse.usage?.total_tokens,
        qms: input.outlineResponse.queueWaitMs,
        rms: input.outlineResponse.requestDurationMs,
        replyChars: input.outlineResponse.reply.length,
      }
      : undefined,
    plan: input.activities ? summarizePlan(input.activities) : undefined,
    phases: input.phases,
    error: input.error,
  };
}

function summarizePlan(activities: GeneratedActivity[]): DayBlueprintAiKnowledgeReport['plan'] {
  let moments = 0;
  let actions = 0;
  let missingActions = 0;

  const outline = activities.map((activity, activityIndex) => {
    const momentOutline = (activity.moments ?? []).map((moment, momentIndex) => {
      const actionCount = moment.subject_actions?.length ?? 0;
      moments += 1;
      actions += actionCount;
      if (actionCount === 0) missingActions += 1;
      return {
        i: momentIndex,
        n: moment.name,
        sec: moment.duration_seconds,
        key: Boolean(moment.is_key_moment),
        a: actionCount,
        p: 0,
        r: summarizeMomentRoles(moment),
      };
    });

    return {
      i: activityIndex,
      n: activity.name,
      s: activity.default_start_time,
      d: activity.default_duration_minutes,
      m: momentOutline,
    };
  });

  return {
    activities: activities.length,
    moments,
    actions,
    placements: 0,
    missingActions,
    missingPlacements: 0,
    outline,
  };
}

function summarizeMomentRoles(moment: GeneratedMoment): string[] {
  const roles = new Set<string>();
  for (const action of moment.subject_actions ?? []) roles.add(action.subject_role);
  return Array.from(roles).slice(0, 8);
}

export function toPersistedReport(result: {
  momentsCreated: number;
  actionsCreated: number;
  placementsCreated: number;
  momentsWithCoverage: number;
}): DayBlueprintAiKnowledgeReport['persisted'] {
  return {
    activities: 0,
    moments: result.momentsCreated,
    actions: result.actionsCreated,
    placements: result.placementsCreated,
    momentsWithCoverage: result.momentsWithCoverage,
    coveragePct: result.momentsCreated > 0
      ? Math.round((result.momentsWithCoverage / result.momentsCreated) * 100)
      : 0,
  };
}
