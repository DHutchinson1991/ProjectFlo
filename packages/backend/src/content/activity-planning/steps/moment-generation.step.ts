import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface MomentGenerationInput {
  activityName: string;
  activityDescription?: string;
  durationMinutes: number;
  subjects: Array<{ name: string; role: string | null; isGroup: boolean }>;
}

export interface GeneratedMoment {
  name: string;
  description: string;
  durationSeconds: number;
  isRequired: boolean;
}

export interface MomentGenerationResult {
  moments: GeneratedMoment[];
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class MomentGenerationStep implements PipelineStep<MomentGenerationInput, MomentGenerationResult> {
  readonly name = 'MomentGeneration';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(MomentGenerationStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('planning/moment-generation.md');
    this.logger.log(`Loaded skill: planning/moment-generation.md (${this.skillPrompt.length} chars)`);
  }

  async execute(input: MomentGenerationInput, stepHandle?: StepLogger): Promise<MomentGenerationResult> {
    const userMessage = JSON.stringify(input, null, 2);
    const userContent = `Generate moments for this activity. Return ONLY valid JSON.\n\n${userMessage}`;
    const maxTokens = Math.min(6096, 512 + input.durationMinutes * 60);

    this.logger.log(
      `MomentGeneration: "${input.activityName}" — ${input.durationMinutes}min, ${input.subjects.length} subjects, maxTokens=${maxTokens}`,
    );
    stepHandle?.input({ activityName: input.activityName, durationMinutes: input.durationMinutes, maxTokens });

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
      skill: 'moment-generation',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, input);
    stepHandle?.output({
      momentCount: result.moments.length,
      moments: result.moments,
    });
    stepHandle?.complete(`${result.moments.length} moments generated`);

    return result;
  }

  private parseResponse(reply: string, input: MomentGenerationInput): MomentGenerationResult {
    const parsed = JSON.parse(reply);
    if (!Array.isArray(parsed.moments) || parsed.moments.length === 0) {
      return { moments: this.fallbackMoments(input) };
    }

    const targetSeconds = input.durationMinutes * 60;
    const moments: GeneratedMoment[] = parsed.moments
      .filter((m: any) => typeof m.name === 'string' && m.name.trim())
      .slice(0, 20) // cap at 20 moments
      .map((m: any) => ({
        name: m.name.trim().slice(0, 100),
        description: typeof m.description === 'string' ? m.description.trim().slice(0, 300) : '',
        durationSeconds: Math.max(10, Math.min(600, Math.round(Number(m.durationSeconds) || 60))),
        isRequired: Boolean(m.isRequired),
      }));

    // Rescale durations to match target
    const totalGenerated = moments.reduce((s, m) => s + m.durationSeconds, 0);
    if (totalGenerated > 0 && Math.abs(totalGenerated - targetSeconds) > targetSeconds * 0.15) {
      const ratio = targetSeconds / totalGenerated;
      for (const m of moments) {
        m.durationSeconds = Math.max(10, Math.round(m.durationSeconds * ratio));
      }
    }

    return { moments };
  }

  private fallbackMoments(input: MomentGenerationInput): GeneratedMoment[] {
    const total = input.durationMinutes * 60;
    return [
      { name: 'Setup', description: `${input.activityName} begins.`, durationSeconds: Math.round(total * 0.15), isRequired: true },
      { name: 'Main Moment', description: `The key moment of ${input.activityName}.`, durationSeconds: Math.round(total * 0.5), isRequired: true },
      { name: 'Reactions', description: 'Capturing emotional reactions from those present.', durationSeconds: Math.round(total * 0.2), isRequired: true },
      { name: 'Wrap Up', description: `${input.activityName} concludes.`, durationSeconds: Math.round(total * 0.15), isRequired: false },
    ];
  }
}
