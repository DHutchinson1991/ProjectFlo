import type { DayBlueprintAiProgressEvent } from '../hooks/ai';
import type { DayBlueprintVersionDetail } from '../types';
import { sanitizeStreamingMomentDisplayName } from './day-blueprint-streaming-moment-name';
import type { PendingDayBlueprintMomentPreview } from './DayBlueprintActivitiesRail';

/**
 * Build the pending streaming-moment preview rows the activities rail shows
 * while the Day Designer AI is mid-run.
 *
 * The reducer is intentionally `last-write-wins` per
 * `(activityId, momentOrderIndex)`. Earlier implementations dedupe'd by a
 * `previewKey` that contained the moment name, so a coverage retry that
 * renamed slot 0 from "Guests Arrive & Seating" → "Guests arrive and settle"
 * appeared as two separate rows. Now an attempt-2 event for slot 0
 * overwrites the attempt-1 row in place, name and duration both updating
 * to whatever the latest event carries.
 *
 * Duration arrives in a separate `moment-streaming-duration` event after
 * the moment name, so we keep an explicit `durationSeconds` cell and only
 * fall back to a placeholder when no duration has been observed yet for
 * that slot.
 */
export function buildPendingMomentsByActivity(
  events: ReadonlyArray<DayBlueprintAiProgressEvent>,
  version: DayBlueprintVersionDetail | null | undefined,
  isGenerating: boolean,
): Record<number, PendingDayBlueprintMomentPreview[]> {
  if (!isGenerating) return {};

  const nameToActivityId = new Map<string, number>();
  for (const day of version?.days ?? []) {
    for (const activity of day.activities ?? []) {
      if (activity?.name) nameToActivityId.set(activity.name.toLowerCase(), activity.id);
    }
  }

  // slot key = `${activityId}:${momentOrderIndex}` so retries replace prior rows.
  const slotByKey = new Map<string, PendingDayBlueprintMomentPreview & { _slotKey: string }>();
  // Track the highest generationAttempt observed per slot so older attempts
  // arriving out-of-order can't clobber the latest one.
  const latestAttemptBySlot = new Map<string, number>();

  for (const event of events) {
    if (
      event.step !== 'moment-preview' &&
      event.step !== 'moment-persisted' &&
      event.step !== 'moment-streaming'
    ) {
      continue;
    }
    const data = event.data;
    if (!data) continue;

    let activityId: number | undefined;
    if (typeof data.activityId === 'number') {
      activityId = data.activityId;
    } else if (typeof data.activityName === 'string') {
      activityId = nameToActivityId.get(data.activityName.toLowerCase());
    }
    if (typeof activityId !== 'number') continue;
    if (typeof data.momentOrderIndex !== 'number') continue;

    const slotKey = `${activityId}:${data.momentOrderIndex}`;
    const eventAttempt = typeof data.generationAttempt === 'number' ? data.generationAttempt : 0;
    const latestAttempt = latestAttemptBySlot.get(slotKey) ?? -1;
    if (eventAttempt < latestAttempt) {
      // Out-of-order event from a stale attempt — ignore it.
      continue;
    }
    if (eventAttempt > latestAttempt) {
      latestAttemptBySlot.set(slotKey, eventAttempt);
      // A fresh attempt for this slot — drop any previous row's identity.
      slotByKey.delete(slotKey);
    }

    const existing = slotByKey.get(slotKey);
    const previewKey = typeof data.previewKey === 'string'
      ? data.previewKey
      : `${event.runId}:${activityId}:${data.momentOrderIndex}`;
    const isDurationOnly = data.eventKind === 'moment-streaming-duration';

    const rawName = typeof data.momentName === 'string' && data.momentName.length > 0
      ? data.momentName
      : existing?.name ?? '';

    const next: PendingDayBlueprintMomentPreview & { _slotKey: string } = {
      _slotKey: slotKey,
      key: previewKey,
      activityId,
      // Last non-empty name wins. Duration-only events never carry a name.
      name: sanitizeStreamingMomentDisplayName(rawName),
      durationSeconds: typeof data.previewDurationSeconds === 'number'
        ? data.previewDurationSeconds
        : existing?.durationSeconds ?? 0,
      orderIndex: data.momentOrderIndex,
      actionCount: typeof data.previewActionCount === 'number'
        ? data.previewActionCount
        : existing?.actionCount,
      placementCount: typeof data.previewPlacementCount === 'number'
        ? data.previewPlacementCount
        : existing?.placementCount,
    };

    // Skip rows we have nothing meaningful to show yet (no name, and the
    // event is a bare duration update for a slot we haven't seen).
    if (!next.name && isDurationOnly && !existing) continue;

    slotByKey.set(slotKey, next);
  }

  const byActivity = new Map<number, PendingDayBlueprintMomentPreview[]>();
  slotByKey.forEach((row) => {
    let rows = byActivity.get(row.activityId);
    if (!rows) {
      rows = [];
      byActivity.set(row.activityId, rows);
    }
    rows.push({
      key: row.key,
      activityId: row.activityId,
      name: row.name,
      durationSeconds: row.durationSeconds,
      orderIndex: row.orderIndex,
      actionCount: row.actionCount,
      placementCount: row.placementCount,
    });
  });

  const result: Record<number, PendingDayBlueprintMomentPreview[]> = {};
  byActivity.forEach((rows, activityId) => {
    rows.sort((left, right) => left.orderIndex - right.orderIndex);
    result[activityId] = rows;
  });
  return result;
}
