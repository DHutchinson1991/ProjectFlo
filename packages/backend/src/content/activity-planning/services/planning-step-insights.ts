import type { StepLogger, StepLlmCallDetails } from '../../../ai/orchestration/pipeline-logger';

export interface PlannerStepMetrics {
  durationMs: number;
  llmCallCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptChars: number;
  responseChars: number;
}

export interface PlannerStepValue {
  candidateCount: number;
  changedCount: number;
  changeRate: number;
  valueScore: 'none' | 'low' | 'medium' | 'high';
  costPerChangeTokens?: number;
  costPerChangeMs?: number;
}

export function createMeasuredStepLogger(stepLogger?: StepLogger): {
  stepLogger?: StepLogger;
  getMetrics(): PlannerStepMetrics;
} {
  const startedAt = Date.now();
  let llmCallCount = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let promptChars = 0;
  let responseChars = 0;

  if (!stepLogger) {
    return {
      stepLogger: undefined,
      getMetrics: () => ({
        durationMs: Date.now() - startedAt,
        llmCallCount,
        promptTokens,
        completionTokens,
        totalTokens,
        promptChars,
        responseChars,
      }),
    };
  }

  const measuredLogger: StepLogger = {
    input(data: unknown): void {
      stepLogger.input(data);
    },
    output(data: unknown): void {
      stepLogger.output(data);
    },
    log(message: string): void {
      stepLogger.log(message);
    },
    warn(message: string): void {
      stepLogger.warn(message);
    },
    error(message: string): void {
      stepLogger.error(message);
    },
    llmCall(details: StepLlmCallDetails): void {
      llmCallCount += 1;
      promptTokens += details.usage?.prompt_tokens ?? 0;
      completionTokens += details.usage?.completion_tokens ?? 0;
      totalTokens += details.usage?.total_tokens ?? 0;
      promptChars += details.promptLength ?? 0;
      responseChars += details.responseLength ?? 0;
      stepLogger.llmCall(details);
    },
    timing(label: string, ms: number): void {
      stepLogger.timing(label, ms);
    },
    complete(resultSummary?: string): void {
      stepLogger.complete(resultSummary);
    },
    fail(error: string, fallbackUsed?: string): void {
      stepLogger.fail(error, fallbackUsed);
    },
  };

  return {
    stepLogger: measuredLogger,
    getMetrics: () => ({
      durationMs: Date.now() - startedAt,
      llmCallCount,
      promptTokens,
      completionTokens,
      totalTokens,
      promptChars,
      responseChars,
    }),
  };
}

export function buildPlannerStepValue(
  candidateCount: number,
  changedCount: number,
  metrics: PlannerStepMetrics,
): PlannerStepValue {
  const safeCandidates = Math.max(0, candidateCount);
  const safeChanged = Math.max(0, Math.min(changedCount, safeCandidates));
  const changeRate = safeCandidates > 0 ? Number((safeChanged / safeCandidates).toFixed(3)) : 0;

  let valueScore: PlannerStepValue['valueScore'] = 'none';
  if (safeChanged > 0) {
    if (changeRate >= 0.75) {
      valueScore = 'high';
    } else if (changeRate >= 0.25) {
      valueScore = 'medium';
    } else {
      valueScore = 'low';
    }
  }

  return {
    candidateCount: safeCandidates,
    changedCount: safeChanged,
    changeRate,
    valueScore,
    costPerChangeTokens: safeChanged > 0 ? Number((metrics.totalTokens / safeChanged).toFixed(1)) : undefined,
    costPerChangeMs: safeChanged > 0 ? Number((metrics.durationMs / safeChanged).toFixed(1)) : undefined,
  };
}