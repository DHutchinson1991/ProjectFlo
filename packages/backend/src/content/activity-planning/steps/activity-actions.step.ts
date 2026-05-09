import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface ActivityActionsInputMoment {
  index: number;
  name: string;
  description: string;
  durationSeconds: number;
  subjects: Array<{
    name: string;
    present: boolean;
    role: string | null;
    isGroup: boolean;
  }>;
}

export interface ActivityActionsInput {
  activityName: string;
  activityDescription?: string;
  durationMinutes?: number;
  moments: ActivityActionsInputMoment[];
}

export interface ActivityMomentActions {
  momentIndex: number;
  momentName: string;
  actions: Array<{
    name: string;
    action: string | null;
  }>;
}

export interface ActivityActionsResult {
  moments: ActivityMomentActions[];
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class ActivityActionsStep implements PipelineStep<ActivityActionsInput, ActivityActionsResult> {
  readonly name = 'ActivityActions';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(ActivityActionsStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('planning/activity-actions.md');
    this.logger.log(`Loaded skill: planning/activity-actions.md (${this.skillPrompt.length} chars)`);
  }

  /**
   * Generate narratively continuous action descriptions for all subjects across all moments.
   * Actions are specific to what the camera would capture — physical, visible, present tense.
   */
  async execute(input: ActivityActionsInput, stepHandle?: StepLogger): Promise<ActivityActionsResult> {
    const userMessage = JSON.stringify(input, null, 2);
    const userContent = `Generate action descriptions for every subject in every moment of this activity. Return ONLY valid JSON matching the output schema.\n\n${userMessage}`;

    // Token budget: ~50 tokens per moment×subject (name + action sentence + JSON syntax)
    const uniqueSubjects = new Set(input.moments.flatMap((m) => m.subjects.map((s) => s.name)));
    const maxTokens = Math.min(16384, 512 + input.moments.length * uniqueSubjects.size * 50);

    this.logger.log(
      `ActivityActions: "${input.activityName}" — ${input.moments.length} moments, ${uniqueSubjects.size} subjects, maxTokens=${maxTokens}`,
    );

    stepHandle?.input({
      activityName: input.activityName,
      momentCount: input.moments.length,
      subjectCount: uniqueSubjects.size,
      maxTokens,
    });

    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      requestLabel: `activity-actions:${input.activityName}`,
      maxTokens,
      temperature: 0.4,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'activity-actions',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, input);

    this.logger.log(
      `ActivityActions (${model}): generated actions for ${result.moments.length} moments`,
    );

    stepHandle?.output({
      momentCount: result.moments.length,
    });
    stepHandle?.complete(`${result.moments.length} moments actioned`);

    return result;
  }

  /**
   * Build a lookup map: momentIndex → subject name (lowercase) → action string
   */
  toActionMap(result: ActivityActionsResult): Map<number, Map<string, string | null>> {
    const out = new Map<number, Map<string, string | null>>();
    for (const m of result.moments) {
      out.set(m.momentIndex, new Map(m.actions.map((a) => [a.name.toLowerCase(), a.action])));
    }
    return out;
  }

  private parseResponse(raw: string, input: ActivityActionsInput): ActivityActionsResult {
    try {
      const clean = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonStart = clean.indexOf('{');
      const jsonEnd = clean.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON object found');
      const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));

      if (!Array.isArray(parsed.moments)) throw new Error('Missing moments array');

      const moments: ActivityMomentActions[] = parsed.moments.map((m: any, i: number) => ({
        momentIndex: m.momentIndex ?? i,
        momentName: m.momentName ?? input.moments[m.momentIndex ?? i]?.name ?? `Moment ${i}`,
        actions: Array.isArray(m.actions)
          ? m.actions.map((a: any) => ({
              name: a.name ?? '',
              action: a.action ?? null,
            }))
          : [],
      }));

      // Fill missing moments with empty actions
      const covered = new Set(moments.map((m) => m.momentIndex));
      for (const m of input.moments) {
        if (!covered.has(m.index)) {
          moments.push({
            momentIndex: m.index,
            momentName: m.name,
            actions: m.subjects
              .filter((s) => s.present)
              .map((s) => ({ name: s.name, action: null })),
          });
        }
      }

      moments.sort((a, b) => a.momentIndex - b.momentIndex);
      return { moments };
    } catch (err) {
      this.logger.warn(`ActivityActions: parse error — ${(err as Error).message}. Returning empty actions.`);
      return {
        moments: input.moments.map((m) => ({
          momentIndex: m.index,
          momentName: m.name,
          actions: m.subjects.filter((s) => s.present).map((s) => ({ name: s.name, action: null })),
        })),
      };
    }
  }
}
