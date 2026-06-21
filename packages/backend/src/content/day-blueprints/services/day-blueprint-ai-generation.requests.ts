import { type SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { type DayBlueprintGemmaRequest, type OutlineMoment, type SkeletonSlot } from './day-blueprint-ai.types';

type GemmaChatRequest = DayBlueprintGemmaRequest['chat'];

export function buildOutlineRequest(ctx: {
  skills: SkillLoaderService;
  eventCategory: string;
  blueprintName: string;
  dayName: string;
  dayDescription: string | null;
  userPrompt?: string;
  skeleton: SkeletonSlot[];
  outlineRepairHint?: string;
  requestLabelSuffix?: string;
}): DayBlueprintGemmaRequest {
  const userPayload = {
    eventCategory: ctx.eventCategory,
    blueprint: ctx.blueprintName,
    day: ctx.dayName,
    dayDescription: ctx.dayDescription ?? undefined,
    directorBrief: ctx.userPrompt || undefined,
    activities: ctx.skeleton.map((slot) => ({
      name: slot.name,
      durationSeconds: slot.targetDurationSeconds || undefined,
      momentCount: slot.momentCount,
      ...(slot.description ? { description: slot.description } : {}),
    })),
  };
  const repair =
    ctx.outlineRepairHint && ctx.outlineRepairHint.trim().length > 0
      ? `\n\nIMPORTANT — your previous outline failed validation. Fix ONLY what is listed; keep the same activity names and exact momentCount per activity. Return ONLY valid JSON again.\n\nValidation errors:\n${ctx.outlineRepairHint.trim()}`
      : '';
  const userMessage = `Outline the day below. Return ONLY valid JSON.\n\n${JSON.stringify(userPayload, null, 2)}${repair}`;

  const chat: GemmaChatRequest = {
    requestLabel: `day-outline${ctx.requestLabelSuffix ?? ''}`,
    messages: [
      { role: 'system', content: ctx.skills.load('planning/day-outline.md') },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
    maxTokens: 4000,
    responseFormat: {
      type: 'json_schema',
      json_schema: {
        name: 'day_outline',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['activities'],
          properties: {
            activities: {
              type: 'array',
              minItems: ctx.skeleton.length,
              maxItems: ctx.skeleton.length,
              prefixItems: ctx.skeleton.map((slot) => ({
                type: 'object',
                additionalProperties: false,
                required: ['name', 'moments'],
                properties: {
                  name: { type: 'string', enum: [slot.name] },
                  moments: {
                    type: 'array',
                    minItems: slot.momentCount,
                    maxItems: slot.momentCount,
                    prefixItems: Array.from({ length: slot.momentCount }, () => ({
                      type: 'object',
                      additionalProperties: false,
                      required: ['name', 'duration_seconds'],
                      properties: {
                        name: { type: 'string' },
                        duration_seconds: {
                          type: 'number',
                          minimum: 30,
                          maximum: 1200,
                        },
                      },
                    })),
                  },
                },
              })),
            },
          },
        },
      },
    },
  };

  return { chat, userMessage };
}

export function buildExpansionRequest(ctx: {
  skills: SkillLoaderService;
  activityName: string;
  durationMinutes: number | null;
  availableRoles: string[];
  moments: OutlineMoment[];
}): DayBlueprintGemmaRequest {
  const userPayload = {
    activityName: ctx.activityName,
    durationMinutes: ctx.durationMinutes ?? undefined,
    subjects: ctx.availableRoles,
    moments: ctx.moments.map((moment, index) => ({
      index,
      name: moment.name,
      durationSeconds: moment.duration_seconds,
    })),
  };
  const userMessage = `Expand this activity's moments. Return ONLY valid JSON.\n\n${JSON.stringify(userPayload, null, 2)}`;

  const subjectRoleSchema = ctx.availableRoles.length > 0
    ? { type: 'string', enum: ctx.availableRoles }
    : { type: 'string' };

  const chat: GemmaChatRequest = {
    requestLabel: `activity-expansion:${ctx.activityName}`,
    messages: [
      { role: 'system', content: ctx.skills.load('planning/moment-expansion.md') },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
    maxTokens: 6000,
    responseFormat: {
      type: 'json_schema',
      json_schema: {
        name: 'activity_expansion',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['moments'],
          properties: {
            moments: {
              type: 'array',
              minItems: ctx.moments.length,
              maxItems: ctx.moments.length,
              prefixItems: ctx.moments.map(() => ({
                type: 'object',
                additionalProperties: false,
                required: ['subject_actions'],
                properties: {
                  description: { type: 'string' },
                  subject_actions: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['subject_role', 'action_text'],
                      properties: {
                        subject_role: subjectRoleSchema,
                        action_text: { type: 'string' },
                        emphasis: { type: 'string', enum: ['PRIMARY', 'SECONDARY', 'OPTIONAL'] },
                        notes: { type: 'string' },
                      },
                    },
                  },
                },
              })),
            },
          },
        },
      },
    },
  };

  return { chat, userMessage };
}
