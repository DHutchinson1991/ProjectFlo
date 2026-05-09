import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GenerationStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { ComfyUIClientService, GenerationResult } from '../../../ai/comfyui/comfyui-client.service';
import { ShotPromptBuilder } from '../../scene-preparation/services/shot-prompt-builder';
import { SpatialTranslatorService, SpatialFrame } from '../../spatial-engine/services/spatial-translator.service';
import { DynamicControlnetService } from '../../spatial-engine/services/dynamic-controlnet.service';
import { FrameCompositorService } from './frame-compositor.service';
import { PromptStylistService } from './prompt-stylist.service';
import { FloorplanDataService } from '../../spatial-engine/services/floorplan-data.service';
import { ScenePreparationService } from '../../scene-preparation/services/scene-preparation.service';
import { GenerateShotPreviewDto } from '../../scene-preparation/dto/generate-shot-preview.dto';
import { PipelineLogger } from '../../../ai/orchestration/pipeline-logger';

@Injectable()
export class FrameRenderService {
  private readonly logger = new Logger(FrameRenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly floorplanData: FloorplanDataService,
    private readonly scenePrep: ScenePreparationService,
    private readonly gemma: GemmaService,
    private readonly comfyuiClient: ComfyUIClientService,
    private readonly promptBuilder: ShotPromptBuilder,
    private readonly spatialTranslator: SpatialTranslatorService,
    private readonly dynamicControlnet: DynamicControlnetService,
    private readonly frameCompositor: FrameCompositorService,
    private readonly promptStylist: PromptStylistService,
  ) {}

  /**
   * Generate an AI preview image for a camera assignment.
   * Reads saved pipeline_data from the prep stage (director output + spatial frame),
   * then runs: compositor → stylist → ControlNet → ComfyUI.
   * If no prep data exists, runs prepare() inline first.
   * If a background plate exists for the space, uses img2img.
   */
  async renderFrame(dto: GenerateShotPreviewDto, brandId: number, pipelineLog?: PipelineLogger) {
    const generationStartedAt = Date.now();
    const { subjectsWithActions, subjects, ctx, sourceType } = await this.floorplanData.buildPromptContext(dto);
    const contextLoadedAt = Date.now();

    // Try to find a background plate for this space
    const space = ctx.activityId
      ? await this.floorplanData.loadSpaceForActivity(ctx.activityId)
      : null;

    // ── Load saved pipeline_data from prep stage ──
    let pipelineData: Record<string, any> | null = null;
    let savedSpatialHash: string | null = null;
    let isStale = false;

    if (sourceType === 'project') {
      const assignment = await this.prisma.projectCameraSubjectAssignment.findUnique({
        where: { id: dto.camera_assignment_id },
        select: { pipeline_data: true, spatial_hash: true },
      });
      pipelineData = assignment?.pipeline_data as Record<string, any> | null;
      savedSpatialHash = assignment?.spatial_hash ?? null;
    } else {
      const assignment = await this.prisma.cameraSubjectAssignment.findUnique({
        where: { id: dto.camera_assignment_id },
        select: { pipeline_data: true, spatial_hash: true },
      });
      pipelineData = assignment?.pipeline_data as Record<string, any> | null;
      savedSpatialHash = assignment?.spatial_hash ?? null;
    }

    // ── Staleness check ──
    const floorData = await this.floorplanData.loadFloorplanData(
      ctx.activityId,
      ctx.trackName,
      ctx.subjectIds,
      dto.film_id,
      ctx.sceneCameraPositionId,
      ctx.momentName,
      ctx.sceneMomentId,
    );
    if (floorData && savedSpatialHash) {
      const currentHash = this.floorplanData.computeSpatialHash(floorData.camera, floorData.subjects);
      isStale = currentHash !== savedSpatialHash;
      if (isStale) {
        this.logger.warn(
          `Assignment ${dto.camera_assignment_id}: spatial data changed since prep (saved: ${savedSpatialHash.slice(0, 8)}, current: ${currentHash.slice(0, 8)}) — re-prepping`,
        );
      }
    }

    // ── Auto-prep if no saved data or stale ──
    if (!pipelineData || isStale) {
      this.logger.log(
        `Assignment ${dto.camera_assignment_id}: ${!pipelineData ? 'no prep data' : 'stale prep data'} — running inline prep`,
      );
      const prepResult = await this.scenePrep.prepare(dto);
      // Reload pipeline_data after prep
      if (sourceType === 'project') {
        const a = await this.prisma.projectCameraSubjectAssignment.findUnique({
          where: { id: dto.camera_assignment_id },
          select: { pipeline_data: true },
        });
        pipelineData = a?.pipeline_data as Record<string, any> | null;
      } else {
        const a = await this.prisma.cameraSubjectAssignment.findUnique({
          where: { id: dto.camera_assignment_id },
          select: { pipeline_data: true },
        });
        pipelineData = a?.pipeline_data as Record<string, any> | null;
      }
    }

    // ── Reconstruct spatial frame from saved data ──
    let spatialFrame: SpatialFrame | null = null;
    if (floorData) {
      spatialFrame = this.spatialTranslator.translate(floorData.camera, floorData.subjects, ctx.subjectIds);
    }

    // ── Build visual appearance lookups ──
    const subjectsWithVisuals = pipelineData?.subjectsWithVisuals ?? subjectsWithActions.map((s) => ({
      ...s,
      visualAppearance: this.promptBuilder.roleToVisualDescPublic(s.roleName || s.name),
    }));

    // ── Render pipeline: compositor → stylist ──
    const stylePrefix = this.promptBuilder.getStylePrefix();
    const negativePrompt = this.promptBuilder.getBaseNegativePrompt(ctx.shotType);

    const directorData = pipelineData?.director;
    const logMeta = { assignmentId: dto.camera_assignment_id, trackName: ctx.trackName, sceneName: ctx.sceneName, momentName: ctx.momentName };

    if (!spatialFrame || spatialFrame.visibleSubjects.length === 0 || !directorData) {
      throw new BadRequestException(
        `Assignment ${dto.camera_assignment_id}: no pipeline data available. Run AI prep before generating.`,
      );
    }

    // Editorial intent (assignment.shot_type) wins over spatial inference.
    // Spatial is only used as a fallback when no editorial shot was set.
    // Inference overriding AI intent was a long-standing regression.
    const resolvedShotType =
      ctx.shotType || spatialFrame.inferredShotType || 'MEDIUM_SHOT';
    if (
      ctx.shotType &&
      spatialFrame.inferredShotType &&
      ctx.shotType !== spatialFrame.inferredShotType
    ) {
      this.logger.warn(
        `Assignment ${dto.camera_assignment_id}: editorial shot ${ctx.shotType} differs from spatial inference ${spatialFrame.inferredShotType} — honouring editorial.`,
      );
    }

    // ── Compositor (Gemma — FrameScript + ControlNet SVG) ──
    const compositorStep = pipelineLog?.startStep(`Compositor [cam ${dto.camera_assignment_id}]`);
    const compositorOutput = await this.frameCompositor.compose(
      spatialFrame.visibleSubjects,
      directorData.subjects ?? [],
      subjectsWithVisuals,
      {
        shotType: resolvedShotType,
        sceneName: ctx.sceneName,
        momentName: ctx.momentName,
        activityName: ctx.activityName,
        locationHint: dto.location_hint,
        emotionalTone: directorData.emotionalTone ?? '',
      },
      dto.camera_assignment_id,
      compositorStep,
    );
    const compositionGuide = compositorOutput.compositionGuide;
    this.logger.log(
      `Assignment ${dto.camera_assignment_id}: compositor → ${compositorOutput.frameScript.subjects.length} subjects, strength ${compositionGuide.strength.toFixed(2)}`,
    );

    // Log: frame-compositor
    this.writeSkillLog('frame-compositor', logMeta, {
      'Input': {
        spatialSubjects: spatialFrame.visibleSubjects.length,
        directorSubjects: (directorData.subjects ?? []).length,
        shotType: resolvedShotType,
        emotionalTone: directorData.emotionalTone,
      },
      'FrameScript': compositorOutput.frameScript,
      'ControlNet': {
        strength: compositionGuide.strength,
        svgLength: compositionGuide.svg.length,
      },
    });

    // ── Stylist (Gemma — CLIP tokens) ──
    const stylistStep = pipelineLog?.startStep(`Stylist [cam ${dto.camera_assignment_id}]`);
    const stylistOutput = await this.promptStylist.stylize(
      compositorOutput.frameScript,
      dto.camera_assignment_id,
      stylistStep,
    );
    if (stylistOutput.validated.warnings.length > 0) {
      this.logger.warn(
        `Assignment ${dto.camera_assignment_id}: stylist warnings: ${stylistOutput.validated.warnings.join('; ')}`,
      );
    }

    const prompt = `${stylePrefix}, ${stylistOutput.validated.prompt}`;

    // Log: prompt-stylist
    this.writeSkillLog('prompt-stylist', logMeta, {
      'Input (FrameScript summary)': {
        subjectCount: compositorOutput.frameScript.subjects.length,
        shotType: compositorOutput.frameScript.composition.shotType,
        mood: compositorOutput.frameScript.environment.mood,
      },
      'Raw Prompt': stylistOutput.rawPrompt,
      'Validated Prompt': stylistOutput.validated.prompt,
      'Warnings': stylistOutput.validated.warnings.length > 0
        ? stylistOutput.validated.warnings
        : 'none',
      'Model': { model: stylistOutput.model, provider: stylistOutput.provider },
    });

    const promptParts = {
      pipeline: 'prep→compositor→stylist',
      stylePrefix,
      director: directorData,
      frameScript: compositorOutput.frameScript,
      rawStylistPrompt: stylistOutput.rawPrompt,
      validatedPrompt: stylistOutput.validated.prompt,
      validatorWarnings: stylistOutput.validated.warnings,
      stylistModel: stylistOutput.model,
      stylistProvider: stylistOutput.provider,
      preparedAt: pipelineData?.preparedAt,
      wasStale: isStale,
      spatialFrame: {
        inferredShotType: spatialFrame.inferredShotType,
        visibleCount: spatialFrame.visibleSubjects.length,
        subjects: spatialFrame.visibleSubjects.map((s) => ({
          name: s.name,
          frameX: s.frameX.toFixed(2),
          scale: s.scale.toFixed(2),
          depth: s.depth,
          side: s.side,
        })),
      },
    };

    // ── Stage 4: ControlNet — dynamic composition guide ──
    const guidePath = await this.dynamicControlnet.renderPng(compositionGuide, dto.camera_assignment_id);
    const poseFilename = await this.comfyuiClient.uploadImage(guidePath);
    const controlnetStrength = compositionGuide.strength;

    // Create a pending record
    const preview = await this.prisma.shotPreview.create({
      data: {
        camera_assignment_id: dto.camera_assignment_id,
        source_type: sourceType,
        film_id: dto.film_id,
        brand_id: brandId,
        prompt,
        negative_prompt: negativePrompt,
        image_path: '',
        status: GenerationStatus.PENDING,
      },
    });

    // Generate
    try {
      await this.prisma.shotPreview.update({
        where: { id: preview.id },
        data: { status: GenerationStatus.PROCESSING },
      });

      let result: GenerationResult;

      const comfySubmitAt = Date.now();

      result = await this.comfyuiClient.generate({
        prompt,
        negativePrompt,
        poseImageFilename: poseFilename,
        controlnetStrength,
      });

      const comfyDoneAt = Date.now();

      // Log: comfyui-render (success)
      this.writeSkillLog('comfyui-render', logMeta, {
        'Status': 'COMPLETED',
        'Mode': 'txt2img',
        'Prompt': prompt,
        'Negative Prompt': negativePrompt,
        'ControlNet': poseFilename
          ? { filename: poseFilename, strength: controlnetStrength ?? 'default', dynamic: true }
          : 'none',
        'Result': {
          seed: result.seed,
          outputPath: result.filePath,
        },
        'Timing': {
          contextLoadMs: contextLoadedAt - generationStartedAt,
          comfyGenerateMs: comfyDoneAt - comfySubmitAt,
          totalMs: comfyDoneAt - generationStartedAt,
        },
      });

      return this.prisma.shotPreview.update({
        where: { id: preview.id },
        data: {
          image_path: result.filePath,
          seed: result.seed,
          status: GenerationStatus.COMPLETED,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const comfyLogs = (error as any)?.comfyLogs || null;
      this.logger.error(`Generation failed for preview ${preview.id}: ${errorMessage}`);

      // Fetch console logs if not already attached to the error
      let consoleLogs: unknown[] = [];
      if (!comfyLogs) {
        try {
          consoleLogs = await this.comfyuiClient.fetchRecentLogs();
        } catch { /* ignore */ }
      }

      // Log: comfyui-render (failure)
      this.writeSkillLog('comfyui-render', logMeta, {
        'Status': 'FAILED',
        'Error': errorMessage,
        'Stack': errorStack || 'n/a',
        'Prompt': prompt,
        'Negative Prompt': negativePrompt,
        'ComfyUI Logs': comfyLogs || { consoleLogs },
        'Timing': { totalMs: Date.now() - generationStartedAt },
      });

      return this.prisma.shotPreview.update({
        where: { id: preview.id },
        data: {
          status: GenerationStatus.FAILED,
          error_message: errorMessage,
        },
      });
    }
  }



  // ─── CRUD ──────────────────────────────────────────────────────────

  async findByAssignment(cameraAssignmentId: number) {
    return this.prisma.shotPreview.findMany({
      where: {
        camera_assignment_id: cameraAssignmentId,
        status: GenerationStatus.COMPLETED,
      },
      orderBy: { created_at: 'desc' },
      take: 1,
    });
  }

  async findByFilm(filmId: number, brandId: number) {
    return this.prisma.shotPreview.findMany({
      where: {
        film_id: filmId,
        brand_id: brandId,
        status: GenerationStatus.COMPLETED,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const preview = await this.prisma.shotPreview.findUnique({ where: { id } });
    if (!preview) throw new NotFoundException(`Shot preview ${id} not found`);
    return preview;
  }

  async remove(id: number) {
    const preview = await this.prisma.shotPreview.findUnique({ where: { id } });
    if (!preview) throw new NotFoundException(`Shot preview ${id} not found`);
    return this.prisma.shotPreview.delete({ where: { id } });
  }

  async checkHealth() {
    return { comfyui: await this.comfyuiClient.healthCheck() };
  }

  // ─── Debug Logging ─────────────────────────────────────────────────

  /**
   * Write a per-skill log file for debugging.
   *
   * Folder:   prompt-logs/{skill}/
   * Filename: {scene}_{moment}_cam{id}_{HH-MM-SS}.log
   */
  private writeSkillLog(
    skill: 'frame-compositor' | 'prompt-stylist' | 'comfyui-render',
    meta: { assignmentId: number; trackName?: string; sceneName?: string; momentName?: string },
    sections: Record<string, unknown>,
  ) {
    try {
      const dir = path.join(process.cwd(), 'prompt-logs', skill);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const now = new Date();
      const time = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
      const date = now.toISOString().slice(0, 10);                     // YYYY-MM-DD

      const slug = (s: unknown) =>
        String(s || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 25);

      const scene = slug(meta.sceneName);
      const moment = slug(meta.momentName);
      const track = slug(meta.trackName || `id-${meta.assignmentId}`);
      const filename = `${scene}_${moment}_${track}_${time}.log`;

      const lines: string[] = [];
      lines.push(`[${skill}]  ${date} ${time.replace(/-/g, ':')}  ${meta.trackName || `cam#${meta.assignmentId}`}`);
      lines.push(`scene: ${meta.sceneName || '?'}  moment: ${meta.momentName || '?'}`);
      lines.push('─'.repeat(60));

      for (const [heading, value] of Object.entries(sections)) {
        lines.push('');
        lines.push(`── ${heading} ──`);
        if (typeof value === 'string') {
          lines.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            lines.push(typeof item === 'string' ? `  ${item}` : `  ${JSON.stringify(item)}`);
          }
        } else if (value !== null && value !== undefined) {
          const json = JSON.stringify(value, null, 2);
          lines.push(json);
        }
      }

      fs.writeFileSync(path.join(dir, filename), lines.join('\n'), 'utf-8');
      this.logger.log(`📝 ${skill}/${filename}`);
    } catch (err) {
      this.logger.warn(`Failed to write skill log (${skill}): ${err}`);
    }
  }

  // ─── Vision Feedback Loop ──────────────────────────────────────────

  private static readonly CRITIQUE_SYSTEM = `You are an expert Stable Diffusion prompt engineer reviewing a generated wedding illustration.
The target aesthetic is: soft, romantic, delicate, elegant — like a high-end wedding editorial illustration. NOT harsh, gritty, or storyboard-like.
You will receive:
1. The original SD prompt used to generate the image
2. The generated image itself
3. A description of what the shot SHOULD show (moment, subjects, shot type)

Your job: critique the image vs. intent, then write an IMPROVED prompt that fixes the issues.

RULES:
- Your improved prompt MUST be under 75 words total.
- Use the three-section BREAK structure:
  Section 1: [framing + composition] BREAK
  Section 2: [subjects + actions + spatial placement] BREAK
  Section 3: [environment + lighting + mood]
- Use SD attention weights: (important:1.3), (background:0.8)
- Do NOT include style tokens (sketch, monochrome) — those are added separately.
- Emphasise soft lighting, warmth, tenderness, and romantic atmosphere.
- Focus on what went WRONG and write a prompt that fixes those specific issues.
- If the image is good, still refine the prompt for maximum accuracy.

OUTPUT: Respond with ONLY valid JSON:
{
  "critique": "Brief 1-2 sentence analysis of what's wrong or could be better",
  "improvedPrompt": "the full improved SD prompt with BREAK tokens",
  "confidence": 0.8
}`;

  /**
   * Vision feedback loop: send a generated preview image to Gemma for critique,
   * get an improved prompt, and optionally regenerate.
   */
  async critiqueAndRegenerate(previewId: number, brandId: number): Promise<{
    critique: string;
    improvedPrompt: string;
    confidence: number;
    regenerated: boolean;
    newPreviewId?: number;
  }> {
    // 1. Load the existing preview
    const preview = await this.prisma.shotPreview.findUnique({
      where: { id: previewId },
    });
    if (!preview) throw new NotFoundException(`Shot preview ${previewId} not found`);
    if (preview.status !== GenerationStatus.COMPLETED || !preview.image_path) {
      throw new NotFoundException(`Preview ${previewId} has no completed image`);
    }

    // 2. Load the camera assignment manually (no FK relation — polymorphic ID)
    const assignment = await this.prisma.cameraSubjectAssignment.findUnique({
      where: { id: preview.camera_assignment_id },
      include: {
        recording_setup: {
          include: { moment: { include: { film_scene: true } } },
        },
      },
    });

    // 3. Read the image file as base64
    const imagePath = path.join(process.cwd(), 'uploads', preview.image_path);
    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException(`Image file not found: ${preview.image_path}`);
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    // 4. Build context about what the shot should show
    const moment = assignment?.recording_setup?.moment;
    const shotType = assignment?.shot_type || 'WIDE_SHOT';
    const momentName = moment?.name || 'Unknown moment';
    const sceneName = moment?.film_scene?.name || 'Unknown scene';

    const contextText = [
      `Shot type: ${shotType}`,
      `Scene: ${sceneName}`,
      `Moment: ${momentName}`,
      `Original prompt used: ${preview.prompt || 'none'}`,
      `Negative prompt: ${preview.negative_prompt || 'none'}`,
      '',
      'Critique this image and write an improved SD prompt that better captures the intended shot.',
    ].join('\n');

    // 5. Send to Gemma for critique
    this.logger.log(`Sending preview ${previewId} to Gemma for vision critique`);
    let critiqueResult: { critique: string; improvedPrompt: string; confidence: number };
    try {
      const response = await this.gemma.chatWithImage({
        systemPrompt: FrameRenderService.CRITIQUE_SYSTEM,
        userText: contextText,
        imageBase64,
        maxTokens: 800,
        temperature: 0.3,
      });

      // Parse the JSON response
      let jsonStr = response.reply.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      critiqueResult = JSON.parse(jsonStr);
      this.logger.log(`Vision critique: ${critiqueResult.critique}`);
    } catch (err) {
      this.logger.error(`Vision critique failed: ${err}`);
      throw new Error(`Vision feedback failed: ${err instanceof Error ? err.message : err}`);
    }

    // 6. Regenerate with improved prompt if confidence is reasonable
    const shouldRegenerate = critiqueResult.confidence < 0.9;
    let newPreviewId: number | undefined;
    this.logger.log(
      `Vision critique result for preview ${previewId}: confidence=${critiqueResult.confidence}, will regenerate=${shouldRegenerate}`,
    );

    if (shouldRegenerate && assignment) {
      // Save the improved prompt to the camera assignment
      await this.prisma.cameraSubjectAssignment.update({
        where: { id: assignment.id },
        data: { ai_prompt: critiqueResult.improvedPrompt },
      });

      // Trigger regeneration
      try {
        const newPreview = await this.renderFrame(
          {
            camera_assignment_id: assignment.id,
            film_id: preview.film_id,
          },
          brandId,
        );
        newPreviewId = (newPreview as any).id;
        this.logger.log(`Regenerated preview ${newPreviewId} with improved prompt`);
      } catch (err) {
        this.logger.error(`Regeneration after critique failed: ${err}`);
      }
    }

    return {
      critique: critiqueResult.critique,
      improvedPrompt: critiqueResult.improvedPrompt,
      confidence: critiqueResult.confidence,
      regenerated: shouldRegenerate && !!newPreviewId,
      newPreviewId,
    };
  }
}
