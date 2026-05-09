import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface ActivityTimingInput {
  eventType: string;
  dayStartTime?: string;
  locationContext?: string;
  activities: Array<{
    id: number;
    name: string;
    description?: string;
    currentDurationMinutes?: number;
    subjectCount: number;
    subjectNames: string[];
  }>;
}

export interface ActivityTimingEstimate {
  activityId: number;
  activityName: string;
  suggestedDurationMinutes: number;
  suggestedStartTime: string;
  reasoning: string;
}

export interface ActivityTimingResult {
  activities: ActivityTimingEstimate[];
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class ActivityTimingStep implements PipelineStep<ActivityTimingInput, ActivityTimingResult> {
  readonly name = 'ActivityTiming';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(ActivityTimingStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('planning/activity-timing.md');
    this.logger.log(`Loaded skill: planning/activity-timing.md (${this.skillPrompt.length} chars)`);
  }

  /**
   * Estimate realistic durations and start times for activities
   * based on subject count, activity type, and context.
   */
  async execute(input: ActivityTimingInput, stepHandle?: StepLogger): Promise<ActivityTimingResult> {
    const userMessage = JSON.stringify(input, null, 2);
    const userContent = `Estimate durations and timing for these activities. Return ONLY valid JSON matching the output schema.\n\n${userMessage}`;

    // Token budget: ~60 tokens per activity (duration + time + reasoning)
    const maxTokens = Math.min(2048, 256 + input.activities.length * 60);

    this.logger.log(
      `ActivityTiming: ${input.activities.length} activities, maxTokens=${maxTokens}`,
    );

    stepHandle?.input({
      activityCount: input.activities.length,
      maxTokens,
    });

    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      maxTokens,
      temperature: 0.3,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'activity-timing',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, input);

    this.logger.log(
      `ActivityTiming (${model}): estimated timing for ${result.activities.length}/${input.activities.length} activities`,
    );

    stepHandle?.output({
      activityCount: result.activities.length,
      activities: result.activities,
    });
    stepHandle?.complete(`${result.activities.length} activities timed`);

    return result;
  }

  private parseResponse(reply: string, input: ActivityTimingInput): ActivityTimingResult {
    const parsed = JSON.parse(reply);
    const activities: ActivityTimingEstimate[] = [];

    for (const inputAct of input.activities) {
      const matched = parsed.activities?.find(
        (a: any) => a.activityId === inputAct.id || a.activityName === inputAct.name,
      );

      const suggested = matched?.suggestedDurationMinutes;
      const duration = typeof suggested === 'number' && suggested > 0
        ? Math.round(suggested)
        : inputAct.currentDurationMinutes ?? 30;

      activities.push({
        activityId: inputAct.id,
        activityName: inputAct.name,
        suggestedDurationMinutes: duration,
        suggestedStartTime: matched?.suggestedStartTime ?? '12:00',
        reasoning: matched?.reasoning ?? 'Fallback — using provided or default duration',
      });
    }

    return { activities };
  }
}
