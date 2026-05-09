import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface ActivityCastingInput {
  activityName: string;
  activityDescription?: string;
  durationMinutes?: number;
  moments: Array<{
    index: number;
    name: string;
    description: string;
    durationSeconds: number;
  }>;
  subjects: Array<{
    name: string;
    role: string | null;
    isGroup: boolean;
  }>;
}

export type FocalPriority = 'PRIMARY' | 'SECONDARY' | 'BACKGROUND';

export interface ActivityMomentPresence {
  momentIndex: number;
  momentName: string;
  reasoning: string;
  presentSubjects: Array<{
    name: string;
    present: boolean;
    focal: FocalPriority;
    reason: string;
  }>;
}

export interface ActivityCastingResult {
  moments: ActivityMomentPresence[];
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class ActivityCastingStep implements PipelineStep<ActivityCastingInput, ActivityCastingResult> {
  readonly name = 'ActivityCasting';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(ActivityCastingStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('planning/activity-casting.md');
    this.logger.log(`Loaded skill: planning/activity-casting.md (${this.skillPrompt.length} chars)`);
  }

  /**
   * Determine which subjects are present in each moment for an entire activity.
   * Returns a presence matrix: momentIndex → subject name → present boolean.
   */
  async execute(input: ActivityCastingInput, stepHandle?: StepLogger): Promise<ActivityCastingResult> {
    const userMessage = JSON.stringify(input, null, 2);
    const userContent = `Produce the presence matrix for this activity. Return ONLY valid JSON matching the output schema.\n\n${userMessage}`;

    // Token budget: ~60 tokens per moment×subject cell (name + boolean + focal + reason + JSON syntax)
    const maxTokens = Math.min(16384, 512 + input.moments.length * input.subjects.length * 60);

    this.logger.log(
      `ActivityCasting: "${input.activityName}" — ${input.moments.length} moments, ${input.subjects.length} subjects, maxTokens=${maxTokens}`,
    );

    stepHandle?.input({
      activityName: input.activityName,
      momentCount: input.moments.length,
      subjectCount: input.subjects.length,
      maxTokens,
    });

    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      requestLabel: `activity-casting:${input.activityName}`,
      maxTokens,
      temperature: 0.2,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'activity-casting',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, input);

    this.logger.log(
      `ActivityCasting (${model}): produced presence for ${result.moments.length}/${input.moments.length} moments`,
    );

    stepHandle?.output({
      momentCount: result.moments.length,
      summary: result.moments.map((m) => `${m.momentName}: ${m.presentSubjects.filter((s) => s.present).length}/${m.presentSubjects.length} present`),
    });
    stepHandle?.complete(`${result.moments.length} moments cast`);

    return result;
  }

  /**
   * Convert result into a lookup map: momentIndex → presence Map<subjectName, boolean>
   */
  toPresenceMaps(result: ActivityCastingResult): Map<number, Map<string, boolean>> {
    const out = new Map<number, Map<string, boolean>>();
    for (const m of result.moments) {
      out.set(m.momentIndex, new Map(m.presentSubjects.map((s) => [s.name.toLowerCase(), s.present])));
    }
    return out;
  }

  /**
   * Convert result into focal priority lookup: momentIndex → Map<subjectName, FocalPriority>
   */
  toFocalMaps(result: ActivityCastingResult): Map<number, Map<string, FocalPriority>> {
    const out = new Map<number, Map<string, FocalPriority>>();
    for (const m of result.moments) {
      out.set(m.momentIndex, new Map(m.presentSubjects.map((s) => [s.name.toLowerCase(), s.focal])));
    }
    return out;
  }

  private parseResponse(raw: string, input: ActivityCastingInput): ActivityCastingResult {
    try {
      const clean = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonStart = clean.indexOf('{');
      const jsonEnd = clean.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON object found');
      const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));

      if (!Array.isArray(parsed.moments)) throw new Error('Missing moments array');

      const moments: ActivityMomentPresence[] = parsed.moments.map((m: any, i: number) => {
        const expectedMoment = input.moments[m.momentIndex ?? i];
        return {
          momentIndex: m.momentIndex ?? i,
          momentName: m.momentName ?? expectedMoment?.name ?? `Moment ${i}`,
          reasoning: m.reasoning ?? '',
          presentSubjects: Array.isArray(m.presentSubjects)
            ? m.presentSubjects.map((s: any) => ({
                name: s.name ?? '',
                present: Boolean(s.present),
                focal: this.normaliseFocal(s.focal),
                reason: s.reason ?? '',
              }))
            : input.subjects.map((s) => ({ name: s.name, present: true, focal: 'BACKGROUND' as FocalPriority, reason: 'fallback' })),
        };
      });

      // Ensure all moments are represented (fill missing with all-present fallback)
      const covered = new Set(moments.map((m) => m.momentIndex));
      for (const m of input.moments) {
        if (!covered.has(m.index)) {
          moments.push({
            momentIndex: m.index,
            momentName: m.name,
            reasoning: 'fallback — LLM did not include this moment',
            presentSubjects: input.subjects.map((s) => ({ name: s.name, present: true, focal: 'BACKGROUND' as FocalPriority, reason: 'fallback' })),
          });
        }
      }

      moments.sort((a, b) => a.momentIndex - b.momentIndex);
      return { moments };
    } catch (err) {
      this.logger.warn(`ActivityCasting: parse error — ${(err as Error).message}. Falling back to all-present.`);
      return {
        moments: input.moments.map((m) => ({
          momentIndex: m.index,
          momentName: m.name,
          reasoning: 'fallback',
          presentSubjects: input.subjects.map((s) => ({ name: s.name, present: true, focal: 'BACKGROUND' as FocalPriority, reason: 'fallback' })),
        })),
      };
    }
  }

  private normaliseFocal(raw: unknown): FocalPriority {
    if (typeof raw !== 'string') return 'BACKGROUND';
    const upper = raw.toUpperCase();
    if (upper === 'PRIMARY') return 'PRIMARY';
    if (upper === 'SECONDARY') return 'SECONDARY';
    return 'BACKGROUND';
  }
}
