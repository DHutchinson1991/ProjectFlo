'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl, buildAuthHeaders } from '@/shared/api/client';

// ─── Types ───────────────────────────────────────────────────────────

export interface FilmPrepEvent {
  filmId: number;
  step: string;
  label: string;
  status: 'started' | 'completed' | 'failed';
  timestamp: string;
  sceneName?: string;
  completedScenes: number;
  totalScenes: number;
  durationMs?: number;
  error?: string;
}

export interface FilmPrepStageEntry {
  step: string;
  label: string;
  status: FilmPrepEvent['status'];
  sceneName?: string;
  startedAtMs: number;
  completedAtMs?: number;
  durationMs?: number;
  error?: string;
}

export interface UseFilmPrepProgressReturn {
  /** Whether an AI-prep stream is active for this film. */
  status: 'idle' | 'connecting' | 'preparing' | 'complete' | 'failed';
  /** Current stage label for display. */
  currentLabel: string;
  /** Completed scenes so far. */
  completedScenes: number;
  /** Total scenes in the film. */
  totalScenes: number;
  /** 0–1 progress fraction. */
  progress: number;
  /** Latest error message if any. */
  error: string | null;
  /** Backend event timestamp of the most recent prep update. */
  lastEventAtMs: number | null;
  /** Recent per-stage history for richer UI progress. */
  stageHistory: FilmPrepStageEntry[];
}

// ─── SSE parser ──────────────────────────────────────────────────────

function parseSSEChunk(chunk: string): FilmPrepEvent[] {
  const events: FilmPrepEvent[] = [];
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

function toEventTimeMs(event: FilmPrepEvent): number {
  const parsed = Date.parse(event.timestamp);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function updateStageHistory(
  history: FilmPrepStageEntry[],
  event: FilmPrepEvent,
  eventAtMs: number,
): FilmPrepStageEntry[] {
  if (event.step === 'done') {
    return history;
  }

  const next = [...history];

  if (event.status === 'started') {
    next.push({
      step: event.step,
      label: event.label,
      status: event.status,
      sceneName: event.sceneName,
      startedAtMs: eventAtMs,
    });
    return next.slice(-12);
  }

  let activeIndex = -1;
  for (let index = next.length - 1; index >= 0; index -= 1) {
    const entry = next[index];
    if (entry.step === event.step && entry.completedAtMs == null) {
      activeIndex = index;
      break;
    }
  }

  if (activeIndex >= 0) {
    const activeEntry = next[activeIndex];
    next[activeIndex] = {
      ...activeEntry,
      label: event.label,
      status: event.status,
      completedAtMs: eventAtMs,
      durationMs: event.durationMs ?? Math.max(0, eventAtMs - activeEntry.startedAtMs),
      error: event.error,
    };
    return next.slice(-12);
  }

  next.push({
    step: event.step,
    label: event.label,
    status: event.status,
    sceneName: event.sceneName,
    startedAtMs: eventAtMs,
    completedAtMs: eventAtMs,
    durationMs: event.durationMs,
    error: event.error,
  });
  return next.slice(-12);
}

// ─── Hook ────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time SSE AI-prep events for a film.
 * Emits per-stage progress as the Gemma pipeline runs per scene:
 *   casting → actions → coverage → spatial → director → persist
 *
 * Uses fetch (not EventSource) so we can send JWT + brand headers.
 *
 * Connection lifecycle:
 *   - Opens when `enabled` becomes true.
 *   - Stays open until the stream emits `done`/`failed` OR the component unmounts,
 *     even if `enabled` later goes false. This means the progress bar remains
 *     visible for the full duration of the backend AI pipeline, which can run
 *     long after the initial "building film" window closes.
 */
export function useFilmPrepProgress(
  filmId: number | null,
  enabled: boolean,
): UseFilmPrepProgressReturn {
  const [status, setStatus] = useState<UseFilmPrepProgressReturn['status']>('idle');
  const [currentLabel, setCurrentLabel] = useState('');
  const [completedScenes, setCompletedScenes] = useState(0);
  const [totalScenes, setTotalScenes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastEventAtMs, setLastEventAtMs] = useState<number | null>(null);
  const [stageHistory, setStageHistory] = useState<FilmPrepStageEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const activeFilmIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (filmId == null) {
      abortRef.current?.abort();
      abortRef.current = null;
      activeFilmIdRef.current = null;
      setStatus('idle');
      setCurrentLabel('');
      setCompletedScenes(0);
      setTotalScenes(0);
      setError(null);
      setLastEventAtMs(null);
      setStageHistory([]);
      return;
    }

    if (!enabled) return;
    if (activeFilmIdRef.current === filmId && abortRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    activeFilmIdRef.current = filmId;

    setStatus('connecting');
    setCurrentLabel('');
    setCompletedScenes(0);
    setTotalScenes(0);
    setError(null);
    setLastEventAtMs(null);
    setStageHistory([]);

    const baseUrl = getApiBaseUrl();
    const headers = buildAuthHeaders(false);
    headers.set('Accept', 'text/event-stream');

    let settled = false;

    (async () => {
      try {
        const response = await fetch(
          `${baseUrl}/api/content/shot-previews/prep-events/${filmId}`,
          { headers, signal: controller.signal },
        );

        if (!response.ok || !response.body) {
          setStatus('failed');
          setError(`Connection failed (${response.status})`);
          return;
        }

        setStatus('preparing');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const events = parseSSEChunk(part);
            for (const data of events) {
              const eventAtMs = toEventTimeMs(data);

              setTotalScenes(data.totalScenes);
              setCompletedScenes(data.completedScenes);
              setLastEventAtMs(eventAtMs);
              setStageHistory((prev) => updateStageHistory(prev, data, eventAtMs));

              if (data.step === 'done') {
                settled = true;
                setStatus(data.status === 'failed' ? 'failed' : 'complete');
                setCurrentLabel(data.label);
                setCompletedScenes(data.totalScenes);
                if (data.status === 'failed') {
                  setError(data.error ?? 'AI prep failed');
                } else {
                  setError(null);
                }
                return;
              }

              if (data.status === 'failed') {
                setError(data.error ?? `Stage "${data.step}" failed`);
                setCurrentLabel(data.label);
                continue;
              }

              setError(null);

              if (data.status === 'started' || data.status === 'completed') {
                setCurrentLabel(data.label);
              }
            }
          }
        }

        if (!settled) {
          setStatus('failed');
          setError('Prep event stream ended before the final completion event');
          setCurrentLabel((prev) => prev || 'Prep event stream ended unexpectedly');
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'Connection lost');
      }
    })();

    return () => {
      controller.abort();
      if (abortRef.current === controller) abortRef.current = null;
      if (activeFilmIdRef.current === filmId) activeFilmIdRef.current = null;
    };
  }, [enabled, filmId]);

  const progress = totalScenes > 0 ? completedScenes / totalScenes : 0;

  return {
    status,
    currentLabel,
    completedScenes,
    totalScenes,
    progress,
    error,
    lastEventAtMs,
    stageHistory,
  };
}
