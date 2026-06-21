import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildAuthHeaders, getApiBaseUrl } from '@/shared/api/client';
import { dayBlueprintsAiApi } from '../api';
import type { DayBlueprintGenerationMode } from '../types';
import type {
  ApplyDayBlueprintAiProposalInput,
  CreateDayBlueprintAiProposalInput,
  DayBlueprintAiRunStatus,
  DayBlueprintDiff,
  StartDayBlueprintAiRunInput,
} from '../types';
import { dayBlueprintKeys } from './index';

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_RETRY_DELAY_MS = 10_000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PollOptions {
  enabled?: boolean;
  live?: boolean;
  pollMs?: number;
}

/** List AI runs for a version. Polls while `live` is true. */
export function useDayBlueprintAiRuns(versionId: number | null, options?: PollOptions) {
  return useQuery({
    queryKey: versionId ? dayBlueprintKeys.aiRuns(versionId) : ['day-blueprint-ai-runs', 'none'],
    queryFn: () => dayBlueprintsAiApi.runs.list(versionId as number),
    enabled: Boolean(versionId) && (options?.enabled ?? true),
    staleTime: 5_000,
    refetchInterval: options?.live ? (options.pollMs ?? 3_000) : false,
  });
}

export function useDayBlueprintAiRun(runId: number | null, options?: PollOptions) {
  return useQuery({
    queryKey: runId ? dayBlueprintKeys.aiRun(runId) : ['day-blueprint-ai-run', 'none'],
    queryFn: () => dayBlueprintsAiApi.runs.getById(runId as number),
    enabled: Boolean(runId) && (options?.enabled ?? true),
    staleTime: 5_000,
    refetchInterval: options?.live ? (options.pollMs ?? 3_000) : false,
  });
}

export function useDayBlueprintAiProposals(
  versionId: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: versionId
      ? dayBlueprintKeys.aiProposals(versionId)
      : ['day-blueprint-ai-proposals', 'none'],
    queryFn: () => dayBlueprintsAiApi.proposals.listForVersion(versionId as number),
    enabled: Boolean(versionId) && (options?.enabled ?? true),
    staleTime: 5_000,
  });
}

export function useStartDayBlueprintAiRun(versionId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StartDayBlueprintAiRunInput) =>
      dayBlueprintsAiApi.runs.start(versionId as number, data),
    onSuccess: () => {
      if (versionId) qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
    },
  });
}

export function useFinishDayBlueprintAiRun(versionId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, error }: { runId: number; error?: string }) =>
      dayBlueprintsAiApi.runs.finish(runId, { error }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRun(vars.runId) });
      if (versionId) qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
    },
  });
}

/**
 * Request cancellation of a running Day Designer AI run. The backend
 * signals the run's AbortController so the per-moment loop throws
 * inside the open transaction, rolling back the destructive delete
 * and any partial writes.
 */
export function useCancelDayBlueprintAiRun(versionId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: number) => dayBlueprintsAiApi.runs.cancel(runId),
    onSuccess: (_data, runId) => {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRun(runId) });
      if (versionId) qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
    },
  });
}

export function useCreateDayBlueprintAiProposal(versionId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDayBlueprintAiProposalInput) =>
      dayBlueprintsAiApi.proposals.create(data),
    onSuccess: () => {
      if (versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiProposals(versionId) });
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
      }
    },
  });
}

export function usePreviewDayBlueprintAiProposal(versionId: number | null) {
  return useMutation({
    mutationFn: (diff: DayBlueprintDiff) =>
      dayBlueprintsAiApi.proposals.preview(versionId as number, diff),
  });
}

export function useApplyDayBlueprintAiProposal(
  blueprintId: number | null,
  versionId: number | null,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      data,
    }: {
      proposalId: number;
      data: ApplyDayBlueprintAiProposalInput;
    }) => dayBlueprintsAiApi.proposals.apply(proposalId, data),
    onSuccess: () => {
      if (versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiProposals(versionId) });
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
      }
      if (blueprintId && versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.version(blueprintId, versionId) });
      }
    },
  });
}

export function useRejectDayBlueprintAiProposal(versionId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: number) => dayBlueprintsAiApi.proposals.reject(proposalId),
    onSuccess: () => {
      if (versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiProposals(versionId) });
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
      }
    },
  });
}

export function isActiveRunStatus(status: DayBlueprintAiRunStatus): boolean {
  return status === 'RUNNING';
}

export interface DayBlueprintAiProgressData {
  [key: string]: unknown;
  eventKind?:
    | 'moment-preview'
    | 'moment-persisted'
    | 'moment-streaming'
    | 'moment-streaming-duration'
    | 'activity-streaming'
    | 'summary'
    | 'subject-spatial-start'
    | 'subject-spatial-result'
    | 'cancelled'
    | 'guardrail-warning';
  dayId?: number;
  activityId?: number;
  activityName?: string;
  momentName?: string;
  momentOrderIndex?: number;
  momentId?: number;
  subjectRoleId?: number;
  subjectRoleLabel?: string;
  spaceSlotId?: number;
  positionHint?: string;
  facingHint?: string;
  warning?: string;
  previewDurationSeconds?: number;
  previewActionCount?: number;
  previewPlacementCount?: number;
  previewKey?: string;
  /** Zero-based attempt index of the LLM call that produced this event. */
  generationAttempt?: number;
  activitiesCreated?: number;
  momentsCreated?: number;
  actionsCreated?: number;
  placementsCreated?: number;
  momentsWithCoverage?: number;
  totalMoments?: number;
}

export interface DayBlueprintAiProgressEvent {
  versionId: number;
  runId: number;
  step: string;
  label: string;
  status: 'started' | 'completed' | 'failed';
  emittedAt: string;
  stepIndex: number;
  totalSteps: number;
  error?: string;
  data?: DayBlueprintAiProgressData;
}

export interface DayBlueprintAiProgressState {
  status: 'idle' | 'connecting' | 'running' | 'complete' | 'failed';
  currentLabel: string;
  progress: number;
  events: DayBlueprintAiProgressEvent[];
  latestEvent: DayBlueprintAiProgressEvent | null;
  error: string | null;
}

function parseSSEChunk(chunk: string): DayBlueprintAiProgressEvent[] {
  const events: DayBlueprintAiProgressEvent[] = [];
  const lines = chunk.split(/\r?\n/);
  for (const line of lines) {
    const normalizedLine = line.trimStart();
    if (!normalizedLine.startsWith('data:')) continue;
    try {
      const json = normalizedLine.slice(5).trim();
      if (json) events.push(JSON.parse(json) as DayBlueprintAiProgressEvent);
    } catch {
      // Ignore malformed/partial frames.
    }
  }
  return events;
}

export function useDayBlueprintAiProgress(
  versionId: number | null,
  activeRunId: number | null,
): DayBlueprintAiProgressState {
  const [status, setStatus] = useState<DayBlueprintAiProgressState['status']>('idle');
  const [events, setEvents] = useState<DayBlueprintAiProgressEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seenEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!versionId || !activeRunId) {
      setStatus('idle');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    seenEventsRef.current.clear();
    setEvents([]);
    setError(null);
    setStatus('connecting');

    const baseUrl = getApiBaseUrl();
    const headers = buildAuthHeaders(false);
    headers.set('Accept', 'text/event-stream');

    let settled = false;
    let attempt = 0;

    (async () => {
      while (!controller.signal.aborted && !settled) {
        try {
          const response = await fetch(`${baseUrl}/api/day-blueprints/versions/${versionId}/ai-events`, {
            headers,
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            if (response.status === 401 || response.status === 403 || !RETRYABLE_HTTP_STATUSES.has(response.status)) {
              setStatus('failed');
              setError(`Connection failed (${response.status})`);
              return;
            }
            attempt += 1;
            setStatus('connecting');
            setError(`Reconnecting to Day Designer AI... (${response.status})`);
            await wait(Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS));
            continue;
          }

          attempt = 0;
          setStatus('running');
          setError(null);
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split(/\r?\n\r?\n/);
            buffer = parts.pop() ?? '';

            for (const part of parts) {
              for (const event of parseSSEChunk(part)) {
                if (event.step === 'heartbeat' || event.runId !== activeRunId) continue;

                if (event.step === 'done') {
                  settled = true;
                  setStatus('complete');
                }
                if (event.step === 'error') {
                  settled = true;
                  setStatus('failed');
                  setError(event.error ?? 'Day Designer AI failed');
                }

                const eventKey = [
                  event.runId,
                  event.emittedAt,
                  event.step,
                  event.status,
                  event.label,
                  event.stepIndex,
                  event.data?.previewKey,
                ].join('|');
                if (!seenEventsRef.current.has(eventKey)) {
                  seenEventsRef.current.add(eventKey);
                  setEvents((prev) => [...prev, event]);
                }
              }
            }
          }

          if (!settled && !controller.signal.aborted) {
            attempt += 1;
            setStatus('connecting');
            setError('Reconnecting to Day Designer AI...');
            await wait(Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS));
          }
        } catch (err) {
          if (controller.signal.aborted) return;
          attempt += 1;
          setStatus('connecting');
          setError(err instanceof Error ? `Reconnecting to Day Designer AI... ${err.message}` : 'Reconnecting to Day Designer AI...');
          await wait(Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS));
        }
      }
    })();

    return () => controller.abort();
  }, [versionId, activeRunId]);

  const latestEvent = events[events.length - 1] ?? null;
  const totalSteps = latestEvent?.totalSteps ?? 0;
  const currentStep = latestEvent ? latestEvent.stepIndex + (latestEvent.status === 'completed' ? 1 : 0) : 0;
  const progress = status === 'complete'
    ? 1
    : totalSteps > 0
      ? Math.max(0.05, Math.min(0.95, currentStep / totalSteps))
      : 0;
  const currentLabel = latestEvent?.label ?? (status === 'connecting' ? 'Connecting to Day Designer AI...' : '');

  return { status, currentLabel, progress, events, latestEvent, error };
}

/**
 * Generate a full Day (activities + moments) with AI in one shot.
 * Server writes rows directly inside a transaction and records a
 * SUCCESS/FAILED `DayBlueprintAiRun` for the runs panel.
 */
export function useGenerateDayBlueprintDay(
  blueprintId: number | null,
  versionId: number | null,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      dayId,
      prompt,
      activityId,
      mode,
    }: {
      dayId: number;
      prompt?: string;
      activityId?: number;
      mode?: DayBlueprintGenerationMode;
    }) =>
      dayBlueprintsAiApi.generator.generateDay(versionId as number, dayId, {
        prompt,
        activity_id: activityId,
        mode,
      }),
    onSuccess: () => {
      if (versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
      }
      if (blueprintId && versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.version(blueprintId, versionId) });
      }
    },
  });
}
