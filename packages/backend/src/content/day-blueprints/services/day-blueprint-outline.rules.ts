import { BadRequestException } from '@nestjs/common';
import { DEFAULT_DENSITY_LIBRARY, type DensityLibrary } from './day-designer-density.types';
import { type OutlineActivity, type OutlinePlan, type SkeletonActivityInput, type SkeletonSlot } from './day-blueprint-ai.types';
import { normalizeRoleName } from './day-blueprint-ai.utils';

/** Allowed bounds for any single moment's duration_seconds (matches persistence clamp). */
export const MIN_MOMENT_SECONDS = 30;
export const MAX_MOMENT_SECONDS = 1200;

/** Tolerance window around the activity duration target for the Phase 1 sum check. */
const OUTLINE_SUM_LOWER = 0.9;
const OUTLINE_SUM_UPPER = 1.1;

/** Phrases that must not appear in moment titles for ritual-only Ceremony (no activity description). */
const RITUAL_ONLY_CEREMONY_FORBIDDEN_SUBSTRINGS = [
  'cocktail',
  'group photo',
  'family group',
  'photo session',
  'guests depart',
  'depart ceremony',
  'transition to',
  'farewell glance',
  'final farewell',
  'quiet reflection',
  'follows out',
  'portrait session',
] as const;

/** Neutral wording swaps applied before validation so LLM drift still passes checks. */
const RITUAL_ONLY_FORBIDDEN_REPLACEMENTS = {
  cocktail: 'social mingle',
  'group photo': 'formal grouping',
  'family group': 'witnesses nearby',
  'photo session': 'still imagery',
  'guests depart': 'guests rise',
  'depart ceremony': 'exit chapel',
  'transition to': 'flow toward',
  'farewell glance': 'parting look',
  'final farewell': 'closing acknowledgment',
  'quiet reflection': 'brief pause',
  'follows out': 'exits together',
  'portrait session': 'likeness capture',
} satisfies Record<(typeof RITUAL_ONLY_CEREMONY_FORBIDDEN_SUBSTRINGS)[number], string>;

function scrubForbiddenCeremonyMomentTitles(name: string): string {
  let out = name;
  let lower = out.toLowerCase();
  for (const frag of RITUAL_ONLY_CEREMONY_FORBIDDEN_SUBSTRINGS) {
    if (!lower.includes(frag)) continue;
    const replacement = RITUAL_ONLY_FORBIDDEN_REPLACEMENTS[frag];
    const re = new RegExp(frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, replacement);
    lower = out.toLowerCase();
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

/** Strip the word "recessional" from non-final titles (LLMs often place it early). */
function stripRecessionalFromNonFinalTitle(name: string): string {
  if (!/\brecessional\b/i.test(name)) return name;
  return (
    name
      .replace(/\brecessional\b/gi, 'exit aisle')
      .replace(/\s{2,}/g, ' ')
      .trim() || 'Ceremony beat'
  );
}

/**
 * Ensure the closing beat is explicitly a recessional (vs "processional exit" confusion).
 */
function ensureFinalMomentHasRecessionalTitle(name: string): string {
  let out = name.trim();
  if (/\brecessional\b/i.test(out)) return out;
  out = out.replace(/\bprocessional\b/gi, 'Recessional');
  if (/\brecessional\b/i.test(out)) return out.replace(/\s{2,}/g, ' ').trim();
  if (!out) return 'Recessional';
  return `${out} — Recessional`;
}

/**
 * Deterministic fixes for ritual-only **Ceremony** outlines after Phase 1 parse.
 * Models often mis-place "Recessional", confuse processional/recessional on the last beat,
 * or slip forbidden tail phrases — this runs before validation so generation can succeed.
 */
export function sanitizeRitualOnlyCeremonyOutline(outline: OutlinePlan, skeleton: SkeletonSlot[]): void {
  for (let i = 0; i < skeleton.length; i++) {
    const slot = skeleton[i];
    const activity = outline.activities[i];
    if (!activity || !isRitualOnlyCeremonySlot(slot)) continue;

    const { moments } = activity;
    if (moments.length === 0) continue;

    for (let j = 0; j < moments.length; j++) {
      const raw = moments[j]?.name ?? '';
      let name = scrubForbiddenCeremonyMomentTitles(raw);
      if (j < moments.length - 1) {
        name = stripRecessionalFromNonFinalTitle(name);
      }
      moments[j].name = name;
    }

    const last = moments[moments.length - 1];
    last.name = ensureFinalMomentHasRecessionalTitle(last.name ?? '');
  }
}

export function buildSkeleton(
  activities: Array<SkeletonActivityInput>,
  scopedActivityId: number | null,
  library: DensityLibrary = DEFAULT_DENSITY_LIBRARY,
  estimator: (durationSeconds: number, activityName: string, override?: number | null) => number = (
    durationSeconds,
    activityName,
    override,
  ) => defaultEstimateMomentCount(library, durationSeconds, activityName, override),
): SkeletonSlot[] {
  return activities
    .filter((activity) => scopedActivityId == null || activity.id === scopedActivityId)
    .map((activity) => {
      const targetDurationSeconds = Math.max(0, (activity.default_duration_minutes ?? 0) * 60);
      const trimmedDescription = activity.description?.trim() ?? '';
      return {
        activityId: activity.id,
        name: activity.name,
        normalizedName: normalizeRoleName(activity.name),
        targetDurationSeconds,
        momentCount: estimator(targetDurationSeconds, activity.name, activity.target_moment_count ?? null),
        ...(trimmedDescription.length > 0 ? { description: trimmedDescription } : {}),
      };
    });
}

function defaultEstimateMomentCount(
  library: DensityLibrary,
  durationSeconds: number,
  activityName: string,
  override?: number | null,
): number {
  if (override != null && override > 0) {
    return Math.max(1, Math.min(24, Math.floor(override)));
  }
  const needle = activityName.trim().toLowerCase();
  const rule = library.rules.find((r) => needle.includes(r.pattern.trim().toLowerCase())) ?? library.default;
  if (durationSeconds <= 0) {
    return Math.max(rule.minMoments, 3);
  }
  return Math.max(rule.minMoments, Math.min(rule.maxMoments, Math.ceil(durationSeconds / rule.secondsPerMoment)));
}

export function normalizeOutlineDurations(outline: OutlinePlan, skeleton: SkeletonSlot[]): OutlinePlan {
  for (let i = 0; i < skeleton.length && i < outline.activities.length; i++) {
    const slot = skeleton[i];
    const activity = outline.activities[i];
    const target = slot.targetDurationSeconds;
    if (target <= 0 || !activity || activity.moments.length === 0) continue;

    const positives = activity.moments.map((m) =>
      typeof m.duration_seconds === 'number' && m.duration_seconds > 0 ? m.duration_seconds : 0,
    );
    let totalRaw = positives.reduce((acc, v) => acc + v, 0);

    if (totalRaw <= 0) {
      const even = Math.max(MIN_MOMENT_SECONDS, Math.floor(target / activity.moments.length));
      for (const moment of activity.moments) moment.duration_seconds = even;
      totalRaw = even * activity.moments.length;
      positives.fill(even);
    }

    const scale = target / totalRaw;
    let runningSum = 0;
    for (let j = 0; j < activity.moments.length; j++) {
      const scaled = Math.round((positives[j] || 1) * scale);
      const clamped = Math.max(MIN_MOMENT_SECONDS, Math.min(MAX_MOMENT_SECONDS, scaled));
      activity.moments[j].duration_seconds = clamped;
      runningSum += clamped;
    }

    let drift = target - runningSum;
    if (drift !== 0) {
      const order = activity.moments
        .map((m, idx) => ({ idx, sec: m.duration_seconds ?? 0 }))
        .sort((a, b) => b.sec - a.sec);
      for (const entry of order) {
        if (drift === 0) break;
        const current = activity.moments[entry.idx].duration_seconds ?? 0;
        const next = Math.max(MIN_MOMENT_SECONDS, Math.min(MAX_MOMENT_SECONDS, current + drift));
        const applied = next - current;
        if (applied === 0) continue;
        activity.moments[entry.idx].duration_seconds = next;
        drift -= applied;
      }
    }
  }
  return outline;
}

function isRitualOnlyCeremonySlot(slot: SkeletonSlot): boolean {
  if (slot.description && slot.description.trim().length > 0) return false;
  return /\bceremony\b/i.test(slot.name);
}

function validateRitualOnlyCeremonyOutline(slot: SkeletonSlot, activity: OutlineActivity, failures: string[]): void {
  if (!isRitualOnlyCeremonySlot(slot)) return;

  const moments = activity.moments;
  const lastName = moments[moments.length - 1]?.name ?? '';
  if (!/\brecessional\b/i.test(lastName)) {
    failures.push(
      `${slot.name}: ritual-only Ceremony requires the **last** moment title to include the word "Recessional" (concluding exit). Got last="${lastName.slice(0, 80)}"`,
    );
  }

  let lastRecessionalIndex = -1;
  for (let j = 0; j < moments.length; j++) {
    if (/\brecessional\b/i.test(moments[j]?.name ?? '')) lastRecessionalIndex = j;
  }
  if (lastRecessionalIndex >= 0 && lastRecessionalIndex !== moments.length - 1) {
    failures.push(
      `${slot.name}: "Recessional" must be only in the final moment — found at index ${lastRecessionalIndex + 1} of ${moments.length}`,
    );
  }

  for (let j = 0; j < moments.length; j++) {
    const lower = (moments[j]?.name ?? '').toLowerCase();
    for (const frag of RITUAL_ONLY_CEREMONY_FORBIDDEN_SUBSTRINGS) {
      if (lower.includes(frag)) {
        failures.push(`${slot.name}: moment ${j + 1} "${moments[j]?.name}" contains disallowed phrase "${frag}" for ritual-only Ceremony`);
        break;
      }
    }
  }
}

export function collectOutlineValidationFailures(outline: OutlinePlan, skeleton: SkeletonSlot[]): string[] {
  const failures: string[] = [];
  if (outline.activities.length !== skeleton.length) {
    failures.push(
      `expected ${skeleton.length} activit${skeleton.length === 1 ? 'y' : 'ies'} but received ${outline.activities.length}`,
    );
  }

  for (let i = 0; i < skeleton.length; i++) {
    const slot = skeleton[i];
    const activity = outline.activities[i];
    if (!activity) {
      failures.push(`${slot.name}: missing from outline`);
      continue;
    }
    if (normalizeRoleName(activity.name) !== slot.normalizedName) {
      failures.push(`${slot.name}: outline returned a different name "${activity.name}"`);
      continue;
    }
    if (activity.moments.length !== slot.momentCount) {
      failures.push(
        `${slot.name}: expected exactly ${slot.momentCount} moments, got ${activity.moments.length}`,
      );
      continue;
    }
    validateRitualOnlyCeremonyOutline(slot, activity, failures);
    if (slot.targetDurationSeconds > 0) {
      const sum = activity.moments.reduce((total, moment) => total + (moment.duration_seconds ?? 0), 0);
      const lower = Math.round(slot.targetDurationSeconds * OUTLINE_SUM_LOWER);
      const upper = Math.round(slot.targetDurationSeconds * OUTLINE_SUM_UPPER);
      if (sum < lower || sum > upper) {
        failures.push(
          `${slot.name}: durations sum to ${sum}s, target ${slot.targetDurationSeconds}s (allowed ${lower}–${upper}s)`,
        );
      }
    }
  }

  return failures;
}

export function validateOutline(outline: OutlinePlan, skeleton: SkeletonSlot[]): void {
  const failures = collectOutlineValidationFailures(outline, skeleton);
  if (failures.length > 0) {
    throw new BadRequestException(`Outline validation failed: ${failures.join('; ')}`);
  }
}
