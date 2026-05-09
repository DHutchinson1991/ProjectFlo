import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepHandle } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface CameraCoverageInput {
  activityName: string;
  cameras: Array<{
    trackLabel: string;
    isUnmanned: boolean;
  }>;
  moments: Array<{
    momentIndex: number;
    momentName: string;
    description: string;
    subjects: Array<{
      name: string;
      focal: 'PRIMARY' | 'SECONDARY' | 'BACKGROUND';
      isGroup: boolean;
    }>;
  }>;
}

export interface CameraMomentPlan {
  trackLabel: string;
  active: boolean;
  shotType: string | null;
  coverageNotes: string | null;
  targetSubjects: string[];
}

export interface MomentCoveragePlan {
  momentIndex: number;
  momentName: string;
  cameras: CameraMomentPlan[];
}

export interface CameraCoverageResult {
  moments: MomentCoveragePlan[];
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class CameraCoverageStep implements PipelineStep<CameraCoverageInput, CameraCoverageResult> {
  readonly name = 'CameraCoverage';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(CameraCoverageStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('planning/camera-coverage.md');
    this.logger.log(`Loaded skill: planning/camera-coverage.md (${this.skillPrompt.length} chars)`);
  }

  /**
   * Generate a per-moment camera coverage plan for an activity.
   * Each camera gets a role (shot type, target subjects, coverage notes) per moment.
   */
  async execute(input: CameraCoverageInput, stepHandle?: StepHandle): Promise<CameraCoverageResult> {
    const userMessage = JSON.stringify(input, null, 2);
    const userContent = `Create a camera coverage plan for this activity. Return ONLY valid JSON matching the output schema.\n\n${userMessage}`;

    // Token budget: ~100 tokens per moment × camera (shot type + notes + targets)
    const maxTokens = Math.min(8192, 512 + input.moments.length * input.cameras.length * 100);

    this.logger.log(
      `CameraCoverage: "${input.activityName}" — ${input.moments.length} moments, ${input.cameras.length} cameras, maxTokens=${maxTokens}`,
    );

    stepHandle?.input({
      activityName: input.activityName,
      momentCount: input.moments.length,
      cameraCount: input.cameras.length,
      maxTokens,
    });

    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      requestLabel: `camera-coverage:${input.activityName}`,
      maxTokens,
      temperature: 0.3,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'camera-coverage',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, input);

    this.logger.log(
      `CameraCoverage (${model}): planned ${result.moments.length}/${input.moments.length} moments`,
    );

    return result;
  }

  private parseResponse(reply: string, input: CameraCoverageInput): CameraCoverageResult {
    const parsed = JSON.parse(reply);
    const moments: MomentCoveragePlan[] = [];

    for (const inputMoment of input.moments) {
      const matched = parsed.moments?.find(
        (m: any) => m.momentIndex === inputMoment.momentIndex || m.momentName === inputMoment.momentName,
      );

      const cameras: CameraMomentPlan[] = input.cameras.map((cam) => {
        const camPlan = matched?.cameras?.find((c: any) => c.trackLabel === cam.trackLabel);
        if (!camPlan || !camPlan.active) {
          return {
            trackLabel: cam.trackLabel,
            active: false,
            shotType: null,
            coverageNotes: null,
            targetSubjects: [],
          };
        }

        const targetSubjects = Array.isArray(camPlan.targetSubjects)
          ? camPlan.targetSubjects.filter((name: any): name is string => typeof name === 'string')
          : [];
        let shotType = camPlan.shotType ?? 'WIDE_SHOT';
        if (cam.isUnmanned) {
          shotType = this.normaliseUnmannedShotType(shotType, targetSubjects, inputMoment);
        }

        return {
          trackLabel: cam.trackLabel,
          active: true,
          shotType,
          coverageNotes: typeof camPlan.coverageNotes === 'string' ? camPlan.coverageNotes : null,
          targetSubjects,
        };
      });

      moments.push({
        momentIndex: inputMoment.momentIndex,
        momentName: inputMoment.momentName,
        cameras,
      });
    }

    return { moments };
  }

  private normaliseUnmannedShotType(
    shotType: string,
    targetSubjects: string[],
    inputMoment: CameraCoverageInput['moments'][number],
  ): string {
    if (shotType !== 'TRACKING') {
      return shotType;
    }

    if (targetSubjects.length === 0) {
      return 'WIDE_SHOT';
    }

    const targetedNames = new Set(targetSubjects.map((name) => name.toLowerCase()));
    const targetedMomentSubjects = inputMoment.subjects.filter((subject) =>
      targetedNames.has(subject.name.toLowerCase()),
    );

    if (targetedMomentSubjects.some((subject) => subject.isGroup) || targetSubjects.length >= 4) {
      return 'WIDE_SHOT';
    }

    if (targetSubjects.length >= 2) {
      return 'MEDIUM_SHOT';
    }

    return 'CLOSE_UP';
  }
}
