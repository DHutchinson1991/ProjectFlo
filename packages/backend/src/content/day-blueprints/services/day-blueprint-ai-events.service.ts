import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter, from, merge } from 'rxjs';

export type DayBlueprintAiEventStatus = 'started' | 'completed' | 'failed';

export interface DayBlueprintAiEventData {
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
  /**
   * Reserved for future generation-attempt sequencing. The two-phase
   * generator never retries, so this value is always `0`. Kept on the
   * SSE contract so the frontend dedupe in `day-blueprint-pending-moments`
   * keeps working without churn.
   */
  generationAttempt?: number;
  activitiesCreated?: number;
  momentsCreated?: number;
  actionsCreated?: number;
  placementsCreated?: number;
  momentsWithCoverage?: number;
  totalMoments?: number;
  totalSubjects?: number;
  subjectsCompleted?: number;
}

export interface DayBlueprintAiEvent {
  versionId: number;
  runId: number;
  step: string;
  label: string;
  status: DayBlueprintAiEventStatus;
  emittedAt: string;
  stepIndex: number;
  totalSteps: number;
  error?: string;
  data?: DayBlueprintAiEventData;
}

const HISTORY_TTL = 60_000;
const HISTORY_MAX_EVENTS = 200;

@Injectable()
export class DayBlueprintAiEventsService {
  private readonly stream$ = new Subject<DayBlueprintAiEvent>();
  private readonly history = new Map<number, DayBlueprintAiEvent[]>();
  private readonly historyTimers = new Map<number, NodeJS.Timeout>();
  /**
   * In-memory registry of active runs keyed by AI run id. The generator
   * registers a controller at run start and clears it on completion;
   * the controller is signalled when the user clicks Cancel so the
   * generator loop can abort between LLM calls / per-moment persists.
   */
  private readonly activeRunControllers = new Map<number, AbortController>();

  emit(event: Omit<DayBlueprintAiEvent, 'emittedAt'> & Partial<Pick<DayBlueprintAiEvent, 'emittedAt'>>): void {
    const payload: DayBlueprintAiEvent = {
      ...event,
      emittedAt: event.emittedAt ?? new Date().toISOString(),
    };
    this.bufferEvent(payload);
    this.stream$.next(payload);
  }

  registerRun(runId: number): AbortController {
    const controller = new AbortController();
    this.activeRunControllers.set(runId, controller);
    return controller;
  }

  releaseRun(runId: number): void {
    this.activeRunControllers.delete(runId);
  }

  /**
   * Signal cancellation for an active run. Returns true if a controller
   * was registered (run is in-flight), false otherwise.
   */
  signalCancel(runId: number): boolean {
    const controller = this.activeRunControllers.get(runId);
    if (!controller) return false;
    controller.abort();
    return true;
  }

  subscribe(versionId: number): Observable<DayBlueprintAiEvent> {
    const replay$ = from(this.history.get(versionId) ?? []);
    const live$ = this.stream$.asObservable().pipe(filter((event) => event.versionId === versionId));
    return merge(replay$, live$);
  }

  private bufferEvent(event: DayBlueprintAiEvent): void {
    let buffer = this.history.get(event.versionId);
    if (!buffer) {
      buffer = [];
      this.history.set(event.versionId, buffer);
    }
    buffer.push(event);
    if (buffer.length > HISTORY_MAX_EVENTS) {
      buffer.splice(0, buffer.length - HISTORY_MAX_EVENTS);
    }

    const existingTimer = this.historyTimers.get(event.versionId);
    if (existingTimer) clearTimeout(existingTimer);

    const ttl = event.step === 'done' || event.step === 'error' ? HISTORY_TTL : HISTORY_TTL * 10;
    const timer = setTimeout(() => {
      this.history.delete(event.versionId);
      this.historyTimers.delete(event.versionId);
    }, ttl);
    timer.unref?.();
    this.historyTimers.set(event.versionId, timer);
  }
}