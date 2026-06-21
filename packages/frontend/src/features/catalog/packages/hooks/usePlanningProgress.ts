'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl, buildAuthHeaders } from '@/shared/api/client';

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_RETRY_DELAY_MS = 10_000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Types ───────────────────────────────────────────────────────────

export type BlockingPlanningSubstep =
  | 'pre-seed'
  | 'llm-request-started'
  | 'llm-response-received'
  | 'parse-complete'
  | 'guardrails-applied'
  | 'persisted'
  | 'summary';

export interface PlanningEventData {
  [key: string]: unknown;
  substep?: BlockingPlanningSubstep;
  spaceName?: string;
  completedMoments?: number;
  totalMoments?: number;
  llmDurationMs?: number;
  queueWaitMs?: number;
  cappedCameraCount?: number;
  warningCount?: number;
  notices?: string[];
  failedMoments?: number;
  averageAiTimeMs?: number;
  correctedCameraAssignments?: number;
  traceLogPath?: string;
}

export interface PlanningStepEvent {
  packageId: number;
  step: string;
  label: string;
  status: 'started' | 'completed' | 'failed';
  emittedAt: string;
  activityName?: string;
  momentId?: number;
  momentName?: string;
  subjectIds?: number[];
  subjectNames?: string[];
  stepIndex: number;
  totalSteps: number;
  error?: string;
  data?: PlanningEventData;
}

export interface PlanningEventRecord extends PlanningStepEvent {
  receivedAtMs: number;
}

export interface PlanningStep {
  step: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  emittedAt: string;
  activityName?: string;
  momentId?: number;
  momentName?: string;
  subjectIds?: number[];
  subjectNames?: string[];
  error?: string;
  data?: PlanningEventData;
}

export interface UsePlanningProgressReturn {
  /** Ordered list of all steps seen so far. */
  steps: PlanningStep[];
  /** Overall status. */
  status: 'idle' | 'connecting' | 'planning' | 'complete' | 'failed';
  /** 0–1 progress fraction. */
  progress: number;
  /** Current step label for display. */
  currentLabel: string;
  /** Active step, when the planner is currently working. */
  activeStep: PlanningStep | null;
  /** Raw event history for richer live views like blocking timelines. */
  eventHistory: PlanningEventRecord[];
  /** Total expected steps (from first event). */
  totalSteps: number;
  /** Number of completed steps. */
  completedSteps: number;
  /** Any error message from a failure. */
  error: string | null;
}

// ─── SSE line parser ─────────────────────────────────────────────────

function parseSSEChunk(chunk: string): PlanningStepEvent[] {
  const events: PlanningStepEvent[] = [];
  // SSE format: "data: {...}\n\n"
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data:')) {
      try {
        const json = line.slice(5).trim();
        if (json) events.push(JSON.parse(json));
      } catch { /* ignore malformed */ }
    }
  }
  return events;
}

// ─── Hook ────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time SSE planning events for a package.
 * Uses fetch (not EventSource) so we can send JWT + brand headers.
 * Only connects while the backend reports an active planning run.
 *
 * When `livePlanningDismissNonce` increments (after user cancel), we stop reconnecting to SSE
 * while `planning_status` may still be PLANNING until the server settles — parent should reset
 * nonce when a fresh PLANNING session starts (see PackageDetailScreen).
 */
export function usePlanningProgress(
  packageId: number | null,
  planningStatus: string | undefined,
  livePlanningDismissNonce = 0,
): UsePlanningProgressReturn {
  const [steps, setSteps] = useState<PlanningStep[]>([]);
  const [eventHistory, setEventHistory] = useState<PlanningEventRecord[]>([]);
  const [status, setStatus] = useState<UsePlanningProgressReturn['status']>('idle');
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seenEventsRef = useRef<Set<string>>(new Set());

  const shouldConnect =
    packageId != null && planningStatus === 'PLANNING' && livePlanningDismissNonce === 0;

  useEffect(() => {
    abortRef.current?.abort();

    if (!shouldConnect || !packageId) {
      if (planningStatus === 'READY') {
        setStatus('complete');
        setError(null);
      } else if (planningStatus === 'FAILED') {
        setStatus('failed');
        setError(null);
      } else if (livePlanningDismissNonce > 0 && planningStatus === 'PLANNING') {
        setStatus('failed');
        setError('Cancellation requested — planner will stop after the current server step.');
      } else {
        setStatus('idle');
        setError(null);
      }
      return;
    }

    // Abort any previous connection
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('connecting');
    setSteps([]);
    setEventHistory([]);
    setError(null);
    seenEventsRef.current.clear();

    const baseUrl = getApiBaseUrl();
    const headers = buildAuthHeaders(false); // no Content-Type for SSE
    headers.set('Accept', 'text/event-stream');

    let settled = false;
    let attempt = 0;

    (async () => {
      while (!controller.signal.aborted && !settled) {
        try {
          const response = await fetch(
            `${baseUrl}/api/packages/${packageId}/planning-events`,
            { headers, signal: controller.signal },
          );

          if (!response.ok || !response.body) {
            if (response.status === 401 || response.status === 403) {
              setStatus('failed');
              setError(`Connection failed (${response.status})`);
              return;
            }

            if (!RETRYABLE_HTTP_STATUSES.has(response.status)) {
              setStatus('failed');
              setError(`Connection failed (${response.status})`);
              return;
            }

            attempt += 1;
            setStatus('connecting');
            setError(`Reconnecting to planner… (${response.status})`);
            await wait(Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS));
            continue;
          }

          attempt = 0;
          setStatus('planning');
          setError(null);
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE events are separated by double newlines
            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? ''; // keep incomplete last part

            for (const part of parts) {
              const events = parseSSEChunk(part);
              for (const data of events) {
                // Server-sent heartbeat frames keep the stream alive during
                // long LLM phases; they carry no step progress.
                if (data.step === 'heartbeat') continue;

                setTotalSteps(data.totalSteps);

                if (data.step === 'done') {
                  settled = true;
                  setStatus('complete');
                  setError(null);
                  return;
                }

                if (data.step === 'error') {
                  settled = true;
                  setStatus('failed');
                  setError(data.error ?? 'Planning failed');
                  return;
                }

                const eventKey = [
                  data.emittedAt,
                  data.step,
                  data.status,
                  data.label,
                  data.activityName ?? '',
                  data.momentId ?? '',
                  data.data?.substep ?? '',
                  data.error ?? '',
                ].join('|');

                if (!seenEventsRef.current.has(eventKey)) {
                  seenEventsRef.current.add(eventKey);
                  setEventHistory((prev) => [...prev, { ...data, receivedAtMs: Date.now() }]);
                }

                setSteps((prev) => {
                  const key = data.activityName ? `${data.step}:${data.activityName}` : data.step;
                  const idx = prev.findIndex(
                    (s) => (s.activityName ? `${s.step}:${s.activityName}` : s.step) === key,
                  );
                  const newStep: PlanningStep = {
                    step: data.step,
                    label: data.label,
                    status: data.status === 'started' ? 'active' : data.status,
                    emittedAt: data.emittedAt,
                    activityName: data.activityName,
                    momentId: data.momentId,
                    momentName: data.momentName,
                    subjectIds: data.subjectIds,
                    subjectNames: data.subjectNames,
                    error: data.error,
                    data: data.data,
                  };
                  if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = newStep;
                    return updated;
                  }
                  return [...prev, newStep];
                });
              }
            }
          }

          if (!settled && !controller.signal.aborted) {
            attempt += 1;
            setStatus('connecting');
            setError('Reconnecting to planner…');
            await wait(Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS));
          }
        } catch (err: unknown) {
          if (controller.signal.aborted) return; // intentional cleanup
          attempt += 1;
          setStatus('connecting');
          setError(err instanceof Error ? `Reconnecting to planner… ${err.message}` : 'Reconnecting to planner…');
          await wait(Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS));
        }
      }
    })();

    return () => controller.abort();
  }, [shouldConnect, packageId, planningStatus, livePlanningDismissNonce]);

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;
  const activeStep = [...steps].reverse().find((s) => s.status === 'active') ?? null;
  const currentLabel = activeStep?.label ?? steps[steps.length - 1]?.label ?? (status === 'complete' ? 'Planning complete' : '');

  return { steps, status, progress, currentLabel, activeStep, eventHistory, totalSteps, completedSteps, error };
}
