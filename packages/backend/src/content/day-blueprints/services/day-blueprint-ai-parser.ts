import { BadRequestException } from '@nestjs/common';
import {
  type ExpandedActivity,
  type ExpandedMoment,
  type GeneratedSubjectAction,
  type OutlineActivity,
  type OutlineMoment,
  type OutlinePlan,
} from './day-blueprint-ai.types';
import { MAX_MOMENT_SECONDS, MIN_MOMENT_SECONDS } from './day-blueprint-outline.rules';
import { clampInt } from './day-blueprint-ai.utils';

export function parseOutline(raw: string): OutlinePlan {
  const trimmed = extractJsonObject(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new BadRequestException(trimmed.includes('{')
      ? 'Outline response was truncated before valid JSON completed'
      : 'Outline response was not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { activities?: unknown }).activities)) {
    throw new BadRequestException('Outline response missing activities array');
  }
  const activities = (parsed as { activities: unknown[] }).activities
    .map((entry) => normalizeOutlineActivity(entry))
    .filter((entry): entry is OutlineActivity => entry !== null);
  if (activities.length === 0) throw new BadRequestException('Outline response contained no usable activities');
  return { activities };
}

export function parseExpansion(raw: string, expectedActivity: OutlineActivity): ExpandedActivity {
  const trimmed = extractJsonObject(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new BadRequestException(`${expectedActivity.name}: expansion response was not valid JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { moments?: unknown }).moments)) {
    throw new BadRequestException(`${expectedActivity.name}: expansion response missing moments array`);
  }
  const moments = (parsed as { moments: unknown[] }).moments.map((entry) => normalizeExpandedMoment(entry));
  if (moments.length !== expectedActivity.moments.length) {
    throw new BadRequestException(
      `${expectedActivity.name}: expansion returned ${moments.length} moments, expected ${expectedActivity.moments.length}`,
    );
  }
  return { moments };
}

function normalizeOutlineActivity(value: unknown): OutlineActivity | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== 'string' || !v.name.trim()) return null;
  const moments = Array.isArray(v.moments)
    ? v.moments
        .map((moment) => normalizeOutlineMoment(moment))
        .filter((moment): moment is OutlineMoment => moment !== null)
    : [];
  return { name: v.name.trim(), moments };
}

function normalizeOutlineMoment(value: unknown): OutlineMoment | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== 'string' || !v.name.trim()) return null;
  const duration = clampInt(typeof v.duration_seconds === 'number' ? v.duration_seconds : undefined, MIN_MOMENT_SECONDS, MAX_MOMENT_SECONDS);
  if (duration == null) return null;
  return { name: v.name.trim(), duration_seconds: duration };
}

function normalizeExpandedMoment(value: unknown): ExpandedMoment {
  if (!value || typeof value !== 'object') return { subject_actions: [] };
  const v = value as Record<string, unknown>;
  return {
    description: typeof v.description === 'string' ? v.description.trim() : undefined,
    subject_actions: Array.isArray(v.subject_actions)
      ? v.subject_actions
          .map((action) => normalizeGeneratedAction(action))
          .filter((action): action is GeneratedSubjectAction => action !== null)
      : [],
  };
}

function extractJsonObject(source: string): string {
  const firstBraceIndex = source.indexOf('{');
  if (firstBraceIndex < 0) return source;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = firstBraceIndex; index < source.length; index += 1) {
    const character = source[index];

    if (escaping) {
      escaping = false;
      continue;
    }
    if (character === '\\') {
      escaping = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
    if (depth === 0) return source.slice(firstBraceIndex, index + 1).trim();
  }

  return source;
}

function normalizeGeneratedAction(value: unknown): GeneratedSubjectAction | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.subject_role !== 'string' || !v.subject_role.trim()) return null;
  if (typeof v.action_text !== 'string' || !v.action_text.trim()) return null;
  return {
    subject_role: v.subject_role.trim(),
    action_text: v.action_text.trim(),
    emphasis: typeof v.emphasis === 'string' ? v.emphasis.trim() : undefined,
    notes: typeof v.notes === 'string' ? v.notes.trim() : undefined,
  };
}
