import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { FrameScript } from './frame-compositor.service';
import { validatePrompt, ValidatedPrompt } from './prompt-validator';
import { StepHandle } from '../../../ai/orchestration/pipeline-logger';

// ─── Public types ────────────────────────────────────────────────────

export interface StylistOutput {
  /** Raw prompt from Gemma. */
  rawPrompt: string;
  /** Validated and cleaned prompt. */
  validated: ValidatedPrompt;
  /** Model used for generation. */
  model: string;
  /** Provider (google-ai / lm-studio). */
  provider: string;
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class PromptStylistService {
  private readonly logger = new Logger(PromptStylistService.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('rendering/prompt-stylist.md');
  }

  /**
   * Convert a FrameScript into a CLIP-optimized SD prompt via the
   * Prompt Stylist Gemma skill, then validate/clean it deterministically.
   */
  async stylize(frameScript: FrameScript, assignmentId: number, stepHandle?: StepHandle): Promise<StylistOutput> {
    const userMessage = JSON.stringify(frameScript, null, 2);
    const userContent = `Convert this FrameScript into a CLIP-optimized Stable Diffusion prompt. Return ONLY the prompt text (3 BREAK-separated sections, max 75 words). No JSON, no explanation.\n\n${userMessage}`;

    this.logger.log(
      `Styling prompt: assignment ${assignmentId} — ${frameScript.subjects.length} subjects, ${frameScript.composition.shotType}`,
    );

    stepHandle?.input({
      assignmentId,
      subjectCount: frameScript.subjects.length,
      shotType: frameScript.composition.shotType,
    });

    const { reply, model, provider, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      maxTokens: 256,
      temperature: 0.4,
    });

    stepHandle?.llmCall({
      skill: 'prompt-stylist',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    // Clean Gemma output
    let rawPrompt = reply
      .replace(/^```[\s\S]*?\n/, '')
      .replace(/\n```\s*$/, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    this.logger.log(
      `Stylist (${model}): ${rawPrompt.length} chars raw prompt`,
    );

    // Run through deterministic validator
    const validated = validatePrompt(rawPrompt);
    if (validated.warnings.length > 0) {
      this.logger.warn(
        `Assignment ${assignmentId}: stylist prompt validator warnings: ${validated.warnings.join('; ')}`,
      );
    }

    stepHandle?.output({
      rawPromptLength: rawPrompt.length,
      validatedLength: validated.prompt.length,
      warnings: validated.warnings,
    });
    stepHandle?.complete(`${rawPrompt.length} chars, ${validated.warnings.length} warnings`);

    return { rawPrompt, validated, model, provider };
  }
}
