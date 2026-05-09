import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { BlockingDirectorService } from '../blocking/blocking-director.service';
import { FrameRenderService } from '../../content/frame-rendering/services/frame-render.service';
import { PipelineLogger } from './pipeline-logger';
import { NarrativeAnalystStep } from './steps/narrative-analyst.step';
import {
  BlockingPipelineResult,
  NarrativeContext,
  RenderPipelineResult,
} from './pipeline.interfaces';

/**
 * SceneOrchestrationService — central orchestrator for the entire AI pipeline.
 *
 * Two entry points matching the two user actions:
 *   1. runBlockingPipeline()  — AI button press (blocking positions)
 *   2. runRenderPipeline()    — Image button press (compositor → stylist → validator → ComfyUI)
 *
 * Each run creates a single PipelineLogger capturing every step.
 */
@Injectable()
export class SceneOrchestrationService {
  private readonly logger = new Logger(SceneOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockingService: BlockingDirectorService,
    private readonly frameRender: FrameRenderService,
    private readonly narrativeAnalyst: NarrativeAnalystStep,
  ) {}

  // ── Blocking Pipeline (Steps 0–1) ──────────────────────────────────

  /**
   * Step 0: Narrative Analyst (deterministic) → Step 1: Blocking Director (LLM)
   * Writes subject/camera positions + actions + duration to DB.
   */
  async runBlockingPipeline(
    sceneMomentId: number,
    spaceSlotId: number,
    activityId?: number,
  ): Promise<BlockingPipelineResult> {
    const momentName = await this.getMomentName(sceneMomentId);
    const log = new PipelineLogger('blocking', sceneMomentId, momentName);

    try {
      // Step 0: Narrative Analyst — gather timeline context
      const narrativeStep = log.startStep('Narrative Analyst');
      const narrativeContext = await this.narrativeAnalyst.execute(
        { sceneMomentId },
        narrativeStep,
      );

      // Step 1: Blocking Director — LLM positions + actions + duration
      const blockingStep = log.startStep('Blocking Director');
      blockingStep.input({
        sceneMomentId,
        spaceSlotId,
        activityId,
        narrativePosition: narrativeContext.position,
        previousMoment: narrativeContext.previousMoment?.name,
        nextMoment: narrativeContext.nextMoment?.name,
      });

      const blockingResult = await this.blockingService.generateBlocking(
        sceneMomentId,
        spaceSlotId,
        activityId,
      );

      blockingStep.output({
        momentDescription: blockingResult.momentDescription,
        durationSeconds: blockingResult.durationSeconds,
        subjectCount: blockingResult.subjects.length,
        cameraCount: blockingResult.cameras.length,
        model: blockingResult.model,
      });
      blockingStep.complete(
        `${blockingResult.subjects.length} subjects, ${blockingResult.cameras.length} cameras, ${blockingResult.durationSeconds}s`,
      );

      log.summary({
        model: blockingResult.model,
        duration: blockingResult.durationSeconds,
        subjects: blockingResult.subjects.map((s) => s.name).join(', '),
        cameras: blockingResult.cameras.map((c) => c.label).join(', '),
      });

      const logPath = log.flush();
      this.logger.log(`Blocking pipeline complete → ${logPath}`);

      return {
        ...blockingResult,
        narrativeContext,
      };
    } catch (error) {
      log.error('PIPELINE', `Fatal error: ${error instanceof Error ? error.message : String(error)}`);
      log.flush();
      throw error;
    }
  }

  // ── Render Pipeline (Steps 4–7) ────────────────────────────────────

  /**
   * Step 4: Compositor (LLM) → Step 5: Stylist (LLM) → Step 6: Validator → Step 7: ComfyUI
   * Generates the actual image for a single camera assignment.
   */
  async runRenderPipeline(
    assignmentId: number,
    filmId: number,
    brandId: number,
    sourceType: 'package' | 'project' = 'package',
    locationHint?: string,
  ): Promise<RenderPipelineResult> {
    const log = new PipelineLogger('render', assignmentId, `assignment-${assignmentId}`);

    try {
      const renderStep = log.startStep('Render (compositor → stylist → validator → ComfyUI)');
      renderStep.input({ assignmentId, filmId, sourceType, brandId, locationHint });

      const result = await this.frameRender.renderFrame(
        {
          camera_assignment_id: assignmentId,
          film_id: filmId,
          source_type: sourceType,
          location_hint: locationHint,
        },
        brandId,
        log,
      );

      renderStep.output({
        imageUrl: result.image_path,
        status: result.status,
      });
      renderStep.complete(result.image_path ? 'image generated' : 'no image (ComfyUI unavailable?)');

      log.summary({ imageUrl: result.image_path });

      const logPath = log.flush();
      this.logger.log(`Render pipeline complete → ${logPath}`);

      return {
        assignmentId,
        prompt: result.prompt ?? '',
        negativePrompt: result.negative_prompt ?? '',
        frameScript: {},
        imageUrl: result.image_path ?? null,
        comfyPromptId: null,
      };
    } catch (error) {
      log.error('PIPELINE', `Fatal error: ${error instanceof Error ? error.message : String(error)}`);
      log.flush();
      throw error;
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private async getMomentName(sceneMomentId: number): Promise<string> {
    const moment = await this.prisma.sceneMoment.findUnique({
      where: { id: sceneMomentId },
      select: { name: true },
    });
    return moment?.name ?? `moment-${sceneMomentId}`;
  }
}
