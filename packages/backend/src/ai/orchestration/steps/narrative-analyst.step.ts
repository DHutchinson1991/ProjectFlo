import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { NarrativeContext, PipelineStep } from '../pipeline.interfaces';
import { StepHandle } from '../pipeline-logger';

export interface NarrativeAnalystInput {
  sceneMomentId: number;
}

/**
 * Step 0: Narrative Analyst (deterministic — no LLM call)
 *
 * Gathers timeline position, music cues, and narrative arc context
 * from the database. Provides structured context for downstream LLM steps.
 */
@Injectable()
export class NarrativeAnalystStep implements PipelineStep<NarrativeAnalystInput, NarrativeContext> {
  readonly name = 'NarrativeAnalyst';
  readonly type = 'deterministic' as const;

  constructor(private readonly prisma: PrismaService) {}

  async execute(input: NarrativeAnalystInput, step: StepHandle): Promise<NarrativeContext> {
    step.input({ sceneMomentId: input.sceneMomentId });

    // Load the moment with its scene timeline
    const moment = await this.prisma.sceneMoment.findUniqueOrThrow({
      where: { id: input.sceneMomentId },
      include: {
        film_scene: {
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
              select: { id: true, name: true, order_index: true, description: true },
            },
            scene_music: true,
          },
        },
        moment_music: true,
      },
    });

    // Build timeline
    const allMoments = moment.film_scene.moments;
    const currentIdx = allMoments.findIndex((m: { id: number }) => m.id === input.sceneMomentId);
    const total = allMoments.length;

    // Determine narrative position
    let position: NarrativeContext['position'];
    if (currentIdx === 0) position = 'opening';
    else if (currentIdx === total - 1) position = 'closing';
    else if (currentIdx < total * 0.3) position = 'early';
    else if (currentIdx > total * 0.7) position = 'late';
    else position = 'middle';

    const prev = currentIdx > 0 ? allMoments[currentIdx - 1] : null;
    const next = currentIdx < total - 1 ? allMoments[currentIdx + 1] : null;

    // Music cue — prefer moment-level override, fall back to scene-level
    const momentMusic = moment.moment_music;
    const sceneMusic = moment.film_scene.scene_music;
    const musicSource = momentMusic ?? sceneMusic;
    const musicCue = musicSource
      ? {
          trackName: musicSource.music_name,
          genre: undefined as string | undefined,
          tempo: undefined as string | undefined,
        }
      : null;

    // Resolve activity name
    let activityName: string | null = null;
    if (moment.source_activity_id) {
      const activity = await this.prisma.packageActivity.findUnique({
        where: { id: moment.source_activity_id },
        select: { name: true },
      });
      activityName = activity?.name ?? null;
    }

    const result: NarrativeContext = {
      momentName: moment.name,
      momentIndex: currentIdx,
      totalMoments: total,
      position,
      activityName,
      previousMoment: prev ? { name: prev.name, description: prev.description ?? undefined } : null,
      nextMoment: next ? { name: next.name } : null,
      musicCue,
      sceneTimeline: allMoments.map((m: { name: string; id: number }, i: number) => ({
        name: m.name,
        order: i,
        isCurrent: m.id === input.sceneMomentId,
      })),
    };

    step.output(result);
    step.complete(`position=${position}, ${total} moments, ${musicCue ? 'with music' : 'no music'}`);

    return result;
  }
}
