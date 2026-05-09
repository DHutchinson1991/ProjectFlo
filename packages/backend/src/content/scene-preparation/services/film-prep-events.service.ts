import { Injectable } from '@nestjs/common';
import { Subject, Observable, filter, merge, from } from 'rxjs';

// ─── Event payload ───────────────────────────────────────────────────

export interface FilmPrepEvent {
  filmId: number;
  /** Stable step identifier, e.g. 'casting', 'actions', 'coverage', 'spatial', 'director', 'done' */
  step: string;
  /** Friendly label for the UI */
  label: string;
  status: 'started' | 'completed' | 'failed';
  /** When the backend emitted the event */
  timestamp: string;
  /** Scene name for context */
  sceneName?: string;
  /** Completed scenes so far */
  completedScenes: number;
  /** Total scenes expected */
  totalScenes: number;
  /** Optional per-stage duration for completed/failed events */
  durationMs?: number;
  /** Optional error */
  error?: string;
}

const HISTORY_TTL = 60_000;

// ─── Service ─────────────────────────────────────────────────────────

/**
 * Streams AI scene-preparation progress events keyed by filmId.
 * Emitted by ScenePreparationService as each stage of the Gemma pipeline runs.
 * Consumed by the frontend via SSE to show live progress in the Content tab.
 */
@Injectable()
export class FilmPrepEventsService {
  private readonly stream$ = new Subject<FilmPrepEvent>();
  private readonly history = new Map<number, FilmPrepEvent[]>();

  emit(event: FilmPrepEvent): void {
    this.bufferEvent(event);
    this.stream$.next(event);
  }

  subscribe(filmId: number): Observable<FilmPrepEvent> {
    const past = this.history.get(filmId) ?? [];
    const replay$ = from(past);
    const live$ = this.stream$.asObservable().pipe(filter((e) => e.filmId === filmId));
    return merge(replay$, live$);
  }

  private bufferEvent(event: FilmPrepEvent): void {
    if (!this.history.has(event.filmId)) this.history.set(event.filmId, []);
    this.history.get(event.filmId)!.push(event);
    if (event.step === 'done' || event.step === 'error') {
      setTimeout(() => this.history.delete(event.filmId), HISTORY_TTL);
    }
  }
}
