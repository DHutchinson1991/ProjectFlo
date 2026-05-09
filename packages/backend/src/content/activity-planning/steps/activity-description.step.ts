import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface ActivityDescriptionInput {
  eventType: string;
  activities: Array<{
    id: number;
    name: string;
    description?: string;
    subjectNames: string[];
  }>;
}

export interface ActivityDescriptionResult {
  activities: Array<{ activityId: number; description: string }>;
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class ActivityDescriptionStep implements PipelineStep<ActivityDescriptionInput, ActivityDescriptionResult> {
  readonly name = 'ActivityDescription';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(ActivityDescriptionStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('planning/activity-description.md');
    this.logger.log(`Loaded skill: planning/activity-description.md (${this.skillPrompt.length} chars)`);
  }

  async execute(input: ActivityDescriptionInput, stepHandle?: StepLogger): Promise<ActivityDescriptionResult> {
    const needsDescription = input.activities.filter((a) => !a.description?.trim());
    if (needsDescription.length === 0) {
      stepHandle?.input({ count: 0, maxTokens: 0, reason: 'All activities already have descriptions' });
      stepHandle?.output({ activityCount: 0, activities: [] });
      stepHandle?.complete('No descriptions needed');
      return { activities: [] };
    }

    const userMessage = JSON.stringify({ ...input, activities: needsDescription }, null, 2);
    const userContent = `Enrich these activities with descriptions. Return ONLY valid JSON.\n\n${userMessage}`;
    const maxTokens = Math.min(2048, 256 + needsDescription.length * 80);

    this.logger.log(`ActivityDescription: enriching ${needsDescription.length} activities, maxTokens=${maxTokens}`);
    stepHandle?.input({ count: needsDescription.length, maxTokens });

    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      maxTokens,
      temperature: 0.4,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'activity-description',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, needsDescription);
    stepHandle?.output({
      activityCount: result.activities.length,
      activities: result.activities,
    });
    stepHandle?.complete(`${result.activities.length} activities enriched`);

    return result;
  }

  private parseResponse(reply: string, input: ActivityDescriptionInput['activities']): ActivityDescriptionResult {
    const parsed = JSON.parse(reply);
    const validIds = new Set(input.map((a) => a.id));
    const activities: ActivityDescriptionResult['activities'] = [];

    for (const item of parsed.activities ?? []) {
      if (validIds.has(item.activityId) && typeof item.description === 'string' && item.description.trim()) {
        activities.push({ activityId: item.activityId, description: item.description.trim() });
      }
    }

    return { activities };
  }
}
