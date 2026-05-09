import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject, Observable, filter, merge, from } from 'rxjs';

// ─── Event payloads ──────────────────────────────────────────────────

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
  /** Activity name when step is per-activity */
  activityName?: string;
  /** Active moment when the planner is working within a single activity step. */
  momentId?: number;
  momentName?: string;
  /** Active subjects currently being considered for the step. */
  subjectIds?: number[];
  subjectNames?: string[];
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total expected steps */
  totalSteps: number;
  /** Optional error message on failure */
  error?: string;
  /** Optional structured payload for richer live planning UX. */
  data?: PlanningEventData;
}

export const PLANNING_EVENT = 'planning.step';

/** How long to keep replay history after the last event (ms). */
const HISTORY_TTL = 60_000;

/** Max buffered events per package — prevents unbounded memory growth. */
const HISTORY_MAX_EVENTS = 500;

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class PlanningEventsService {
  private readonly stream$ = new Subject<PlanningStepEvent>();

  /** Per-package event history for late-connecting SSE clients. */
  private readonly history = new Map<number, PlanningStepEvent[]>();

  /** Per-package TTL timers — reset on each event. */
  private readonly historyTimers = new Map<number, NodeJS.Timeout>();

  constructor(private readonly emitter: EventEmitter2) {
    this.emitter.on(PLANNING_EVENT, (event: PlanningStepEvent) => {
      this.bufferEvent(event);
      this.stream$.next(event);
    });
  }

  /** Emit a planning step event (called by ActivityPlannerService). */
  emit(event: Omit<PlanningStepEvent, 'emittedAt'> & Partial<Pick<PlanningStepEvent, 'emittedAt'>>): void {
    this.emitter.emit(PLANNING_EVENT, {
      ...event,
      emittedAt: event.emittedAt ?? new Date().toISOString(),
    } satisfies PlanningStepEvent);
  }

  /**
   * Subscribe to events for a specific package.
   * Replays any buffered history first, then streams live events.
   */
  subscribe(packageId: number): Observable<PlanningStepEvent> {
    const past = this.history.get(packageId) ?? [];
    const replay$ = from(past);
    const live$ = this.stream$.asObservable().pipe(
      filter((e) => e.packageId === packageId),
    );
    return merge(replay$, live$);
  }

  // ─── Internal ────────────────────────────────────────────────────

  private bufferEvent(event: PlanningStepEvent): void {
    let buffer = this.history.get(event.packageId);
    if (!buffer) {
      buffer = [];
      this.history.set(event.packageId, buffer);
    }
    buffer.push(event);

    // Cap per-package buffer to prevent unbounded memory growth
    // on runaway or very long planning sessions.
    if (buffer.length > HISTORY_MAX_EVENTS) {
      buffer.splice(0, buffer.length - HISTORY_MAX_EVENTS);
    }

    // Reset TTL on every event so abandoned / orphaned buffers still
    // get GC'd even if a terminal event never arrives.
    const existingTimer = this.historyTimers.get(event.packageId);
    if (existingTimer) clearTimeout(existingTimer);

    const ttl =
      event.step === 'done' || event.step === 'error'
        ? HISTORY_TTL
        : HISTORY_TTL * 10; // idle buffer expires after ~10 min without events
    const timer = setTimeout(() => {
      this.history.delete(event.packageId);
      this.historyTimers.delete(event.packageId);
    }, ttl);
    // Allow process exit if this is the only thing keeping the event loop alive.
    timer.unref?.();
    this.historyTimers.set(event.packageId, timer);
  }
}
