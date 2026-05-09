import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { StepHandle } from '../../../ai/orchestration/pipeline-logger';
import { PipelineStep } from '../../../ai/orchestration/pipeline.interfaces';

// ─── Public types ────────────────────────────────────────────────────

export interface ActivityDirectorCameraSubject {
  name: string;
  frameX: number;
  scale: number;
  depth: string;
  side: string;
  distance: number;
  isTargeted: boolean;
  currentAction: string | null;
}

export interface ActivityDirectorCameraInput {
  assignmentId: number;
  trackLabel: string;
  shotType: string;
  visibleSubjects: ActivityDirectorCameraSubject[];
}

export interface ActivityDirectorMomentInput {
  index: number;
  name: string;
  description: string;
  durationSeconds: number;
  cameras: ActivityDirectorCameraInput[];
}

export interface ActivityDirectorInput {
  activityName: string;
  activityDescription?: string;
  durationMinutes?: number;
  moments: ActivityDirectorMomentInput[];
}

// ─── Output types ────────────────────────────────────────────────────

export interface ActivityDirectorCameraOutput {
  assignmentId: number;
  compositionNotes: string;
  subjects: Array<{
    name: string;
    directedAction: string;
    gazeTarget: string;
    emphasis: 'PRIMARY' | 'SECONDARY' | 'BACKGROUND';
  }>;
}

export interface ActivityDirectorMomentOutput {
  momentIndex: number;
  momentName: string;
  emotionalTone: string;
  cameras: ActivityDirectorCameraOutput[];
}

export interface ActivityDirectorResult {
  overallArc: string;
  moments: ActivityDirectorMomentOutput[];
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class ActivityDirectorStep implements PipelineStep<ActivityDirectorInput, ActivityDirectorResult> {
  readonly name = 'ActivityDirector';
  readonly type = 'llm' as const;
  private readonly logger = new Logger(ActivityDirectorStep.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('direction/activity-director.md');
    this.logger.log(`Loaded skill: direction/activity-director.md (${this.skillPrompt.length} chars)`);
  }

  /**
   * Direct all camera assignments across all moments for an activity.
   * Returns emotional arc, tones, composition notes and per-subject direction.
   */
  async execute(input: ActivityDirectorInput, stepHandle?: StepHandle): Promise<ActivityDirectorResult> {
    const totalCameras = input.moments.reduce((s, m) => s + m.cameras.length, 0);
    const userMessage = JSON.stringify(input, null, 2);
    const userContent = `Direct all moments and cameras for this activity. Return ONLY valid JSON matching the output schema.\n\n${userMessage}`;

    // Token budget: ~100 per moment + ~60 per camera assignment (subjects, gaze, emphasis)
    const maxTokens = Math.min(8192, 512 + input.moments.length * 100 + totalCameras * 60);

    this.logger.log(
      `ActivityDirector: "${input.activityName}" — ${input.moments.length} moments, ${totalCameras} cameras, maxTokens=${maxTokens}`,
    );

    stepHandle?.input({
      activityName: input.activityName,
      momentCount: input.moments.length,
      cameraCount: totalCameras,
      maxTokens,
    });

    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      requestLabel: `activity-director:${input.activityName}`,
      maxTokens,
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'activity-director',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const result = this.parseResponse(reply, input);

    this.logger.log(
      `ActivityDirector (${model}): arc="${result.overallArc.slice(0, 60)}..." — ${result.moments.length} moments directed`,
    );

    stepHandle?.output({
      overallArc: result.overallArc,
      momentCount: result.moments.length,
    });
    stepHandle?.complete(`${result.moments.length} moments directed`);

    return result;
  }

  /**
   * Build a lookup map: assignmentId → director output for that camera
   */
  toAssignmentMap(result: ActivityDirectorResult): Map<number, ActivityDirectorCameraOutput & { emotionalTone: string }> {
    const out = new Map<number, ActivityDirectorCameraOutput & { emotionalTone: string }>();
    for (const m of result.moments) {
      for (const cam of m.cameras) {
        out.set(cam.assignmentId, {
          ...cam,
          emotionalTone: m.emotionalTone,
        });
      }
    }
    return out;
  }

  private parseResponse(raw: string, input: ActivityDirectorInput): ActivityDirectorResult {
    try {
      const clean = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonStart = clean.indexOf('{');
      const jsonEnd = clean.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON object found');
      const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));

      if (!Array.isArray(parsed.moments)) throw new Error('Missing moments array');

      const moments: ActivityDirectorMomentOutput[] = parsed.moments.map((m: any, i: number) => ({
        momentIndex: m.momentIndex ?? i,
        momentName: m.momentName ?? input.moments[m.momentIndex ?? i]?.name ?? `Moment ${i}`,
        emotionalTone: m.emotionalTone ?? 'candid',
        cameras: Array.isArray(m.cameras)
          ? m.cameras.map((c: any) => ({
              assignmentId: c.assignmentId,
              compositionNotes: c.compositionNotes ?? '',
              subjects: Array.isArray(c.subjects)
                ? c.subjects.map((s: any) => ({
                    name: s.name ?? '',
                    directedAction: s.directedAction ?? '',
                    gazeTarget: s.gazeTarget ?? 'forward',
                    emphasis: (['PRIMARY', 'SECONDARY', 'BACKGROUND'] as const).includes(s.emphasis)
                      ? s.emphasis
                      : 'SECONDARY',
                  }))
                : [],
            }))
          : [],
      }));

      // Fill missing moments with minimal fallback
      const covered = new Set(moments.map((m) => m.momentIndex));
      for (const m of input.moments) {
        if (!covered.has(m.index)) {
          moments.push({
            momentIndex: m.index,
            momentName: m.name,
            emotionalTone: 'candid',
            cameras: m.cameras.map((c) => ({
              assignmentId: c.assignmentId,
              compositionNotes: '',
              subjects: c.visibleSubjects.map((s) => ({
                name: s.name,
                directedAction: s.currentAction ?? '',
                gazeTarget: 'forward',
                emphasis: s.isTargeted ? 'PRIMARY' : 'SECONDARY' as any,
              })),
            })),
          });
        }
      }

      moments.sort((a, b) => a.momentIndex - b.momentIndex);

      return {
        overallArc: parsed.overallArc ?? '',
        moments,
      };
    } catch (err) {
      this.logger.warn(`ActivityDirector: parse error — ${(err as Error).message}. Returning fallback.`);
      return {
        overallArc: '',
        moments: input.moments.map((m) => ({
          momentIndex: m.index,
          momentName: m.name,
          emotionalTone: 'candid',
          cameras: m.cameras.map((c) => ({
            assignmentId: c.assignmentId,
            compositionNotes: '',
            subjects: c.visibleSubjects.map((s) => ({
              name: s.name,
              directedAction: s.currentAction ?? '',
              gazeTarget: 'forward',
              emphasis: s.isTargeted ? 'PRIMARY' : 'SECONDARY' as any,
            })),
          })),
        })),
      };
    }
  }
}
