import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ShotType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ShotPromptBuilder } from './shot-prompt-builder';
import { SpatialTranslatorService, SpatialFrame, FrameSubject } from '../../spatial-engine/services/spatial-translator.service';
import { DynamicControlnetService, CompositionGuide } from '../../spatial-engine/services/dynamic-controlnet.service';
import { ShotDirectorService } from './shot-director.service';
import { SpatialOverlayService } from '../../spatial-engine/services/spatial-overlay.service';
import { ActivityCastingStep, FocalPriority } from '../../activity-planning/steps/activity-casting.step';
import { ActivityActionsStep } from '../../activity-planning/steps/activity-actions.step';
import { CameraCoverageStep, CameraCoverageInput, MomentCoveragePlan, CameraMomentPlan } from '../../activity-planning/steps/camera-coverage.step';
import { ActivityDirectorStep, ActivityDirectorResult } from '../../activity-planning/steps/activity-director.step';
import { FloorplanDataService } from '../../spatial-engine/services/floorplan-data.service';
import { GenerateShotPreviewDto } from '../dto/generate-shot-preview.dto';
import { PipelineLogger } from '../../../ai/orchestration/pipeline-logger';
import { MomentKnowledgeService } from '../../schedule/services/moment-knowledge.service';
import { MissingPlanningDataError } from '../../schedule/errors/missing-planning-data.error';
import { FilmPrepEventsService } from './film-prep-events.service';
import { ShotDecisionService } from './shot-decision.service';

const VALID_ASSIGNMENT_SHOT_TYPES = new Set<ShotType>(Object.values(ShotType));

@Injectable()
export class ScenePreparationService {
  private readonly logger = new Logger(ScenePreparationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly floorplanData: FloorplanDataService,
    private readonly promptBuilder: ShotPromptBuilder,
    private readonly spatialTranslator: SpatialTranslatorService,
    private readonly dynamicControlnet: DynamicControlnetService,
    private readonly shotDirector: ShotDirectorService,
    private readonly shotDecision: ShotDecisionService,
    private readonly spatialOverlay: SpatialOverlayService,
    private readonly activityCasting: ActivityCastingStep,
    private readonly activityActions: ActivityActionsStep,
    private readonly activityDirector: ActivityDirectorStep,
    private readonly momentKnowledge: MomentKnowledgeService,
    private readonly cameraCoverage: CameraCoverageStep,
    private readonly prepEvents: FilmPrepEventsService,
  ) {}

  /**
   * Compute and return the dynamic ControlNet composition guide SVG
   * for a given camera assignment. Lightweight — no Gemma/ComfyUI involved.
   */
  async getCompositionGuide(assignmentId: number, filmId: number, sourceType: 'package' | 'project' = 'package') {
    const ctx = await this.floorplanData.loadAssignmentContext(assignmentId, sourceType);
    const subjects = await this.floorplanData.loadSubjects(ctx.subjectIds, filmId, sourceType);

    const floorData = await this.floorplanData.loadFloorplanData(
      ctx.activityId,
      ctx.trackName,
      ctx.subjectIds,
      filmId,
      ctx.sceneCameraPositionId,
      ctx.momentName,
      ctx.sceneMomentId,
    );

    if (!floorData) {
      return { available: false as const, svg: null, reason: 'No floorplan data' };
    }

    const spatialFrame = this.spatialTranslator.translate(floorData.camera, floorData.subjects, ctx.subjectIds, { isUnmanned: ctx.isUnmanned });
    if (spatialFrame.visibleSubjects.length === 0) {
      return { available: false as const, svg: null, reason: 'No subjects in camera FOV' };
    }

    const guide = this.dynamicControlnet.generate(spatialFrame.visibleSubjects, assignmentId);
    const shotDecision = this.shotDecision.resolve({
      assignmentShotType: ctx.shotType,
      spatialShotType: spatialFrame.inferredShotType,
      fallbackShotType: 'MEDIUM_SHOT',
    });

    return {
      available: true as const,
      svg: guide.svg,
      strength: guide.strength,
      subjects: spatialFrame.visibleSubjects.map((s) => ({
        name: s.name,
        frameX: +s.frameX.toFixed(2),
        scale: +s.scale.toFixed(2),
        depth: s.depth,
        side: s.side,
      })),
      inferredShotType: spatialFrame.inferredShotType,
      resolvedShotType: shotDecision.resolvedShotType,
      rawSpatialShotType: shotDecision.rawSpatialShotType,
      shotDecisionSource: shotDecision.source,
    };
  }

  /**
   * Return a human-readable visual overlay SVG showing subject positions,
   * depth cues, and composition grid for a camera assignment.
   * Lightweight — no AI or ComfyUI involved.
   */
  async getSpatialOverlay(assignmentId: number, filmId: number, sourceType: 'package' | 'project' = 'package') {
    const ctx = await this.floorplanData.loadAssignmentContext(assignmentId, sourceType);

    const floorData = await this.floorplanData.loadFloorplanData(
      ctx.activityId,
      ctx.trackName,
      ctx.subjectIds,
      filmId,
      ctx.sceneCameraPositionId,
      ctx.momentName,
      ctx.sceneMomentId,
    );

    if (!floorData) {
      return { available: false as const, svg: null, reason: 'No floorplan data' };
    }

    const spatialFrame = this.spatialTranslator.translate(floorData.camera, floorData.subjects, ctx.subjectIds, { isUnmanned: ctx.isUnmanned });
    // Project physical objects (furniture, architecture) through the camera
    spatialFrame.visibleObjects = this.spatialTranslator.translateObjects(
      floorData.camera,
      floorData.objects,
    );
    if (spatialFrame.visibleSubjects.length === 0 && spatialFrame.visibleObjects.length === 0) {
      return { available: false as const, svg: null, reason: 'No subjects or objects in camera FOV' };
    }

    const overlay = this.spatialOverlay.generate(spatialFrame);
    const shotDecision = this.shotDecision.resolve({
      assignmentShotType: ctx.shotType,
      spatialShotType: spatialFrame.inferredShotType,
      fallbackShotType: 'MEDIUM_SHOT',
    });

    return {
      available: true as const,
      ...overlay,
      resolvedShotType: shotDecision.resolvedShotType,
      rawSpatialShotType: shotDecision.rawSpatialShotType,
      shotDecisionSource: shotDecision.source,
    };
  }

  /**
   * Phase D: compute conflicts between editorial intent (shot_type +
   * subject_ids on each camera assignment) and current geometry (camera
   * and subject positions on the floor plan) for a scene moment.
   *
   * Computed on-read from live floorplan data so that moving a camera
   * and invalidating this query immediately reflects new conflicts —
   * no need to re-run scene prep. Persisted `pipeline_data.conflicts`
   * is ignored here.
   *
   * Returns `{ sceneMomentId, conflicts: [...] }`. Each conflict carries
   * `assignmentId`, `trackName`, and a `kind` discriminator.
   */
  async listMomentConflicts(sceneMomentId: number, sourceType: 'package' | 'project' = 'package') {
    // Resolve filmId + activityId from the scene moment itself
    const sceneMoment = await this.prisma.sceneMoment.findUnique({
      where: { id: sceneMomentId },
      select: {
        film_scene: { select: { film_id: true, source_activity_id: true } },
        source_moment: { select: { package_activity_id: true } },
      },
    });
    if (!sceneMoment) return { sceneMomentId, conflicts: [] };
    const filmId = sceneMoment.film_scene.film_id;
    const activityId =
      sceneMoment.source_moment?.package_activity_id ??
      sceneMoment.film_scene.source_activity_id ??
      undefined;

    type ConflictRow = { id: number; trackName: string | null };
    let rows: ConflictRow[];
    if (sourceType === 'project') {
      const projectRows = await this.prisma.projectCameraSubjectAssignment.findMany({
        where: { recording_setup: { project_moment_id: sceneMomentId } },
        include: { track: { select: { name: true } } },
      });
      rows = projectRows.map((r) => ({ id: r.id, trackName: r.track?.name ?? null }));
    } else {
      const sceneRows = await this.prisma.cameraSubjectAssignment.findMany({
        where: { recording_setup: { moment_id: sceneMomentId } },
        include: { track: { select: { name: true } } },
      });
      rows = sceneRows.map((r) => ({ id: r.id, trackName: r.track?.name ?? null }));
    }

    const conflicts: Array<Record<string, unknown>> = [];

    for (const row of rows) {
      let ctx: Awaited<ReturnType<FloorplanDataService['loadAssignmentContext']>>;
      try {
        ctx = await this.floorplanData.loadAssignmentContext(row.id, sourceType);
      } catch {
        continue;
      }

      const floorData = await this.floorplanData.loadFloorplanData(
        ctx.activityId ?? activityId,
        ctx.trackName,
        ctx.subjectIds,
        filmId,
        ctx.sceneCameraPositionId,
        ctx.momentName,
        ctx.sceneMomentId,
      );
      if (!floorData) continue;

      const spatialFrame = this.spatialTranslator.translate(
        floorData.camera,
        floorData.subjects,
        ctx.subjectIds,
        { isUnmanned: ctx.isUnmanned },
      );
      const shotDecision = this.shotDecision.resolve({
        assignmentShotType: ctx.shotType,
        spatialShotType: spatialFrame.inferredShotType,
        fallbackShotType: 'MEDIUM_SHOT',
      });

      // SHOT_TYPE_MISMATCH: editorial vs geometry
      if (
        shotDecision.rawSpatialShotType &&
        shotDecision.resolvedShotType !== shotDecision.rawSpatialShotType
      ) {
        conflicts.push({
          kind: 'SHOT_TYPE_MISMATCH',
          assignmentId: row.id,
          trackName: row.trackName,
          editorial: shotDecision.resolvedShotType,
          geometric: shotDecision.rawSpatialShotType,
          reason: shotDecision.reason,
        });
      }

      // TARGET_NOT_VISIBLE: editorial subject_ids not in camera FOV
      const visibleIdSet = new Set(
        spatialFrame.visibleSubjects
          .map((s) => s.daySubjectId)
          .filter((id): id is number => id != null),
      );
      const targetsNotVisible = ctx.subjectIds.filter((id) => !visibleIdSet.has(id));
      if (ctx.subjectIds.length > 0 && targetsNotVisible.length > 0) {
        conflicts.push({
          kind: 'TARGET_NOT_VISIBLE',
          assignmentId: row.id,
          trackName: row.trackName,
          targetSubjectIds: targetsNotVisible,
          visibleSubjectIds: Array.from(visibleIdSet),
        });
      }
    }

    return { sceneMomentId, conflicts };
  }

  /**
   * Build the prompt for a camera assignment without generating an image.
   * Used by the frontend for live prompt preview tooltips.
   */
  async previewPrompt(dto: GenerateShotPreviewDto) {
    const { subjectsWithActions, ctx } = await this.floorplanData.buildPromptContext(dto);

    // Load spatial data for richer prompt previews
    const floorData = await this.floorplanData.loadFloorplanData(
      ctx.activityId,
      ctx.trackName,
      ctx.subjectIds,
      dto.film_id,
      ctx.sceneCameraPositionId,
      ctx.momentName,
      ctx.sceneMomentId,
    );
    type SpatialDepth = 'extreme-foreground' | 'foreground' | 'mid-ground' | 'background' | 'far-background';
    type SpatialSide = 'far-left' | 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'far-right';
    let spatialSubjects: { name: string; frameX: number; scale: number; depth: SpatialDepth; side: SpatialSide; distance: number }[] | undefined;
    const spatialFrame = floorData
      ? this.spatialTranslator.translate(floorData.camera, floorData.subjects, ctx.subjectIds, { isUnmanned: ctx.isUnmanned })
      : null;

    if (spatialFrame) {
      spatialSubjects = spatialFrame.visibleSubjects.map((s) => ({
        name: s.name,
        frameX: s.frameX,
        scale: s.scale,
        depth: s.depth as SpatialDepth,
        side: s.side as SpatialSide,
        distance: s.distance,
        isTargeted: s.isTargeted,
      }));
    }

    const shotDecision = this.shotDecision.resolve({
      assignmentShotType: ctx.shotType,
      spatialShotType: spatialFrame?.inferredShotType,
      fallbackShotType: 'MEDIUM_SHOT',
    });

    const detailed = this.promptBuilder.buildDetailed({
      subjects: subjectsWithActions,
      shotType: shotDecision.resolvedShotType,
      sceneName: ctx.sceneName,
      momentName: ctx.momentName,
      activityName: ctx.activityName,
      locationHint: dto.location_hint,
      spatialSubjects,
    });

    return {
      prompt: detailed.prompt,
      negativePrompt: detailed.negativePrompt,
      shotType: shotDecision.resolvedShotType,
      resolvedShotType: shotDecision.resolvedShotType,
      rawSpatialShotType: shotDecision.rawSpatialShotType,
      shotDecisionSource: shotDecision.source,
      momentName: ctx.momentName,
      parts: {
        style: detailed.stylePrefix,
        framing: detailed.framing,
        scene: detailed.sceneSentence,
        quality: detailed.qualityTail,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PREP PIPELINE — context → spatial → director → ControlNet SVG
  // Called by the AI button at the moment level.
  // Saves director output + spatial frame to the assignment record.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Prepare a single camera assignment: run context → spatial → director → ControlNet SVG.
   * Persists pipeline_data + spatial_hash on the CameraSubjectAssignment.
   * Returns the prep result for immediate UI display (director notes, composition guide).
   *
   * @param presenceMap Optional map of subject name (lowercase) → present boolean.
   *   When provided, subjects marked not-present are filtered out of spatial translation.
   */
  async prepare(dto: GenerateShotPreviewDto, presenceMap?: Map<string, boolean>, pipelineLog?: PipelineLogger) {
    const { subjectsWithActions, subjects, ctx, sourceType } = await this.floorplanData.buildPromptContext(dto);

    // ── Spatial Translation ──
    const floorData = await this.floorplanData.loadFloorplanData(
      ctx.activityId,
      ctx.trackName,
      ctx.subjectIds,
      dto.film_id,
      ctx.sceneCameraPositionId,
      ctx.momentName,
      ctx.sceneMomentId,
    );

    // Filter out subjects not present in this moment (from casting step)
    if (floorData && presenceMap && presenceMap.size > 0) {
      const before = floorData.subjects.length;
      floorData.subjects = floorData.subjects.filter(
        (s) => presenceMap.get(s.name.toLowerCase()) !== false,
      );
      if (floorData.subjects.length < before) {
        this.logger.log(
          `Prep ${dto.camera_assignment_id}: presence filter ${before} → ${floorData.subjects.length} subjects`,
        );
      }
    }

    let spatialFrame: SpatialFrame | null = null;
    if (floorData) {
      spatialFrame = this.spatialTranslator.translate(floorData.camera, floorData.subjects, ctx.subjectIds, { isUnmanned: ctx.isUnmanned });
      this.logger.log(
        `Prep ${dto.camera_assignment_id}: spatial → ${spatialFrame.visibleSubjects.length}/${floorData.subjects.length} visible`,
      );
      // Phase D: geometry no longer overwrites editorial targets. The editorial
      // subject_ids flow through unchanged; conflicts (target not visible) are
      // reported below for the conflict list panel.
    }

    // Phase D: compute conflicts between editorial intent and geometry.
    // These are reported, not applied.
    const visibleIdSet = new Set(
      (spatialFrame?.visibleSubjects ?? [])
        .map((s) => s.daySubjectId)
        .filter((id): id is number => id != null),
    );
    const targetsNotVisible = ctx.subjectIds.filter((id) => !visibleIdSet.has(id));

    const shotDecision = this.shotDecision.resolve({
      assignmentShotType: ctx.shotType,
      spatialShotType: spatialFrame?.inferredShotType,
      fallbackShotType: 'MEDIUM_SHOT',
    });

    // ── Visual appearance lookups ──
    const subjectsWithVisuals = subjectsWithActions.map((s) => ({
      ...s,
      visualAppearance: this.promptBuilder.roleToVisualDescPublic(s.roleName || s.name),
    }));

    // ── Director (one Gemma call — creative intent) ──
    const directorStep = pipelineLog?.startStep(`Director [cam ${dto.camera_assignment_id}]`);
    const directorInput = this.shotDirector.buildInput(
      spatialFrame?.visibleSubjects ?? [],
      subjectsWithActions,
      shotDecision.resolvedShotType,
      ctx.sceneName,
      ctx.momentName,
      ctx.activityName,
    );
    const directorOutput = await this.shotDirector.direct(directorInput, directorStep);
    this.logger.log(
      `Prep ${dto.camera_assignment_id}: director → "${directorOutput.emotionalTone}"`,
    );

    // ── ControlNet composition guide (deterministic — no Gemma) ──
    let compositionGuide: CompositionGuide | null = null;
    if (spatialFrame && spatialFrame.visibleSubjects.length > 0) {
      compositionGuide = this.dynamicControlnet.generate(
        spatialFrame.visibleSubjects,
        dto.camera_assignment_id,
      );
    }

    // ── Compute spatial hash for staleness detection ──
    const spatialHash = floorData
      ? this.floorplanData.computeSpatialHash(floorData.camera, floorData.subjects)
      : null;

    // ── Persist to assignment record ──
    const pipelineData = {
      preparedAt: new Date().toISOString(),
      director: {
        emotionalTone: directorOutput.emotionalTone,
        compositionNotes: directorOutput.compositionNotes,
        subjects: directorOutput.subjects,
        source: 'shot-director',
      },
      spatialFrame: spatialFrame
        ? {
            inferredShotType: spatialFrame.inferredShotType,
            visibleCount: spatialFrame.visibleSubjects.length,
            subjects: spatialFrame.visibleSubjects.map((s) => ({
              name: s.name,
              frameX: +s.frameX.toFixed(3),
              scale: +s.scale.toFixed(3),
              depth: s.depth,
              side: s.side,
              distance: Math.round(s.distance),
            })),
          }
        : null,
      shotDecision: {
        resolvedShotType: shotDecision.resolvedShotType,
        rawSpatialShotType: shotDecision.rawSpatialShotType,
        source: shotDecision.source,
        reason: shotDecision.reason,
      },
      context: {
        shotType: shotDecision.resolvedShotType,
        sceneName: ctx.sceneName,
        momentName: ctx.momentName,
        activityName: ctx.activityName || null,
        locationHint: dto.location_hint || null,
      },
      subjectsWithVisuals: subjectsWithVisuals.map((s) => ({
        name: s.name,
        roleName: s.roleName,
        isGroup: s.isGroup,
        actionDescription: s.actionDescription || null,
        visualAppearance: s.visualAppearance,
      })),
      // Phase D: conflicts between editorial intent and geometry. The
      // conflict list panel below the floor plan renders these. Geometry is
      // reported, never force-applied.
      conflicts: [
        ...(spatialFrame &&
          shotDecision.rawSpatialShotType &&
          shotDecision.resolvedShotType !== shotDecision.rawSpatialShotType
          ? [
              {
                kind: 'SHOT_TYPE_MISMATCH' as const,
                assignmentId: dto.camera_assignment_id,
                editorial: shotDecision.resolvedShotType,
                geometric: shotDecision.rawSpatialShotType,
                reason: shotDecision.reason,
              },
            ]
          : []),
        ...(targetsNotVisible.length > 0
          ? [
              {
                kind: 'TARGET_NOT_VISIBLE' as const,
                assignmentId: dto.camera_assignment_id,
                targetSubjectIds: targetsNotVisible,
                visibleSubjectIds: Array.from(visibleIdSet),
              },
            ]
          : []),
      ],
    };

    // Phase D: persist only geometry-derived fields and pipeline metadata.
    // Editorial shot_type and subject_ids are owned by the shot director /
    // coverage plan; scene preparation reports conflicts but does not
    // overwrite them.
    const visibleSubjectIds = Array.from(visibleIdSet);

    if (sourceType === 'project') {
      await this.prisma.projectCameraSubjectAssignment.update({
        where: { id: dto.camera_assignment_id },
        data: {
          pipeline_data: pipelineData as any,
          spatial_hash: spatialHash,
        },
      });
    } else {
      await this.prisma.cameraSubjectAssignment.update({
        where: { id: dto.camera_assignment_id },
        data: {
          pipeline_data: pipelineData as any,
          spatial_hash: spatialHash,
          ...(visibleSubjectIds.length > 0 ? { visible_subject_ids: visibleSubjectIds } : {}),
        },
      });
    }

    this.logger.log(
      `Prep ${dto.camera_assignment_id}: saved pipeline_data (hash: ${spatialHash?.slice(0, 8) ?? 'none'})`,
    );

    // ── Per-skill logs ──
    const logMeta = { assignmentId: dto.camera_assignment_id, trackName: ctx.trackName, sceneName: ctx.sceneName, momentName: ctx.momentName };

    if (spatialFrame) {
      this.writeSkillLog('spatial-translator', logMeta, {
        'Input': {
          camera: floorData!.camera,
          subjectCount: floorData!.subjects.length,
        },
        'Output': {
          inferredShotType: spatialFrame.inferredShotType,
          visible: spatialFrame.visibleSubjects.length,
          total: floorData!.subjects.length,
          spatialHash,
        },
        'Visible Subjects': spatialFrame.visibleSubjects.map((s) =>
          `${s.name}: x=${s.frameX.toFixed(3)} scale=${s.scale.toFixed(3)} depth=${s.depth} side=${s.side} dist=${Math.round(s.distance)}`
        ),
      });
    }

    this.writeSkillLog('shot-director', logMeta, {
      'Input': directorInput,
      'Output': {
        emotionalTone: directorOutput.emotionalTone,
        compositionNotes: directorOutput.compositionNotes,
        subjectCount: directorOutput.subjects.length,
      },
      'Directed Subjects': directorOutput.subjects.map((s: any) =>
        `${s.emphasis} | ${s.name} → ${s.directedAction || 'n/a'} (gaze: ${s.gazeTarget || '?'})`
      ),
    });

    if (compositionGuide) {
      this.writeSkillLog('controlnet-composer', logMeta, {
        'Input': { visibleSubjects: spatialFrame!.visibleSubjects.length },
        'Output': {
          strength: compositionGuide.strength,
          svgLength: compositionGuide.svg.length,
        },
      });
    }

    return {
      assignmentId: dto.camera_assignment_id,
      prepared: true,
      director: {
        emotionalTone: directorOutput.emotionalTone,
        compositionNotes: directorOutput.compositionNotes,
        subjects: directorOutput.subjects,
        source: 'shot-director',
      },
      compositionGuide: compositionGuide
        ? {
            available: true as const,
            svg: compositionGuide.svg,
            strength: compositionGuide.strength,
          }
        : { available: false as const, svg: null },
      spatialFrame: spatialFrame
        ? {
            inferredShotType: spatialFrame.inferredShotType,
            visibleCount: spatialFrame.visibleSubjects.length,
            visibleSubjectIds: visibleSubjectIds,
          }
        : null,
      spatialHash,
      resolvedShotType: shotDecision.resolvedShotType,
      rawSpatialShotType: shotDecision.rawSpatialShotType,
      shotDecisionSource: shotDecision.source,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ACTIVITY PREP PIPELINE — plan ALL moments + cameras in one shot
  // 3 LLM calls total: Activity Casting → Activity Actions → Activity Director
  // Then deterministic spatial + ControlNet per camera, no per-moment LLM.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Prepare all moments in a film scene using the activity-level planning pipeline.
   *   1. Activity Casting  (1 LLM call) — presence matrix for all moments
   *   2. Activity Actions  (1 LLM call) — narrative-continuous actions for all subjects
   *   3. Persist actions to FilmSceneMomentSubject for all moments
   *   4. Spatial translation per camera (deterministic)
   *   5. Activity Director (1 LLM call) — emotional arc + direction for all cameras
   *   6. ControlNet SVG per camera (deterministic)
   *   7. Persist pipeline_data per camera
   */
  async prepareScene(
    filmSceneId: number,
    filmId: number,
    sourceType: 'package' | 'project' = 'package',
    pipelineLog?: PipelineLogger,
  ) {
    // ── Emit SSE progress events (keyed by filmId) ──
    const totalScenes = await this.prisma.filmScene.count({ where: { film_id: filmId } });
    const completedScenes = await this.prisma.filmScene.count({
      where: {
        film_id: filmId,
        moments: {
          some: {
            recording_setup: {
              camera_assignments: { some: { pipeline_data: { not: Prisma.JsonNull } } },
            },
          },
        },
      },
    });
    const sceneName = (await this.prisma.filmScene.findUnique({
      where: { id: filmSceneId },
      select: { name: true },
    }))?.name ?? undefined;
    const stageStartedAt = new Map<string, number>();
    const emit = (step: string, label: string, status: 'started' | 'completed' | 'failed', error?: string) => {
      const nowMs = Date.now();
      if (status === 'started') {
        stageStartedAt.set(step, nowMs);
      }

      const startedAtMs = stageStartedAt.get(step);
      const durationMs =
        status === 'started' || startedAtMs == null
          ? undefined
          : Math.max(0, nowMs - startedAtMs);

      if (status !== 'started' && startedAtMs != null) {
        stageStartedAt.delete(step);
      }

      try {
        this.prepEvents.emit({
          filmId, step, label, status,
          sceneName, completedScenes, totalScenes, error,
          timestamp: new Date(nowMs).toISOString(),
          durationMs,
        });
      } catch { /* don't let event errors crash the pipeline */ }
    };
    emit('scene-prep', `Preparing "${sceneName ?? 'scene'}"...`, 'started');

    // ── Load scene with all moments and their camera assignments ──
    const filmScene = await this.prisma.filmScene.findUnique({
      where: { id: filmSceneId },
      include: {
        moments: {
          orderBy: { order_index: 'asc' },
          include: {
            recording_setup: {
              include: {
                camera_assignments: {
                  where: { enabled: true },
                  include: { track: { select: { name: true, type: true, is_unmanned: true } } },
                },
              },
            },
            subjects: {
              include: { subject: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!filmScene) {
      throw new NotFoundException(`FilmScene ${filmSceneId} not found`);
    }

    // ── Resolve the PackageActivity ──
    // Use source_activity_id on the scene if present, else fall back to the first moment
    const activityId =
      filmScene.source_activity_id ??
      filmScene.moments.find((m) => m.source_activity_id)?.source_activity_id ??
      null;

    if (filmScene.moments.length === 0) {
      // Fail fast: scene preparation is a film-side consumer. It must not
      // create or backfill SceneMoments. The schedule (upstream) mirrors
      // package planner output into SceneMoments; if that hasn't run, surface
      // the gap rather than silently regenerating planning data.
      throw new MissingPlanningDataError('SceneMoment', {
        filmSceneId,
        activityId,
        expected: 'SceneMoments mirrored from package planning (run schedule upsert first)',
      });
    }

    if (!filmScene || filmScene.moments.length === 0) {
      return { filmSceneId, moments: [] };
    }

    const moments = filmScene.moments;

    // ── Dedup check: skip if all camera assignments already have pipeline_data ──
    const allAssignments = moments.flatMap(
      (m) => m.recording_setup?.camera_assignments?.filter((a) => a.track.type === 'VIDEO') ?? [],
    );
    if (allAssignments.length > 0 && allAssignments.every((a) => (a as any).pipeline_data != null)) {
      this.logger.log(`prepareScene(${filmSceneId}): all ${allAssignments.length} assignments already prepped — skipping`);
      return { filmSceneId, moments: moments.map((m) => ({ momentId: m.id, skipped: true })) };
    }

    let activityName = filmScene.name; // fallback to scene name
    let activityDescription: string | undefined;
    let durationMinutes: number | undefined;
    let packageId: number | undefined;
    let eventDayId: number | undefined;

    if (activityId) {
      const activity = await this.prisma.packageActivity.findUnique({
        where: { id: activityId },
        select: {
          name: true,
          description: true,
          duration_minutes: true,
          package_id: true,
          package_event_day_id: true,
        },
      });
      if (activity) {
        activityName = activity.name;
        activityDescription = activity.description ?? undefined;
        durationMinutes = activity.duration_minutes ?? undefined;
        packageId = activity.package_id;
        eventDayId = activity.package_event_day_id;
      }
    }

    // ── Load subjects ──
    let subjects: Array<{ id: number; name: string; role: string | null; isGroup: boolean }> = [];
    if (packageId && eventDayId) {
      const daySubjects = await this.prisma.packageDaySubject.findMany({
        where: { package_id: packageId, event_day_template_id: eventDayId },
        include: { role_template: { select: { role_name: true, is_group: true } } },
      });
      subjects = daySubjects.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role_template?.role_name ?? null,
        isGroup: s.role_template?.is_group ?? (s.count ?? 1) > 1,
      }));
    }

    // Fallback: if event-day-specific query returned 0 subjects, load all package subjects
    if (subjects.length === 0 && packageId) {
      const allDaySubjects = await this.prisma.packageDaySubject.findMany({
        where: { package_id: packageId },
        include: { role_template: { select: { role_name: true, is_group: true } } },
      });
      subjects = allDaySubjects.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role_template?.role_name ?? null,
        isGroup: s.role_template?.is_group ?? (s.count ?? 1) > 1,
      }));
    }

    // Fallback: load from film's package if we still have 0 subjects
    if (subjects.length === 0 && activityId) {
      const pf = await this.prisma.packageFilm.findFirst({
        where: { film_id: filmId },
        select: { package_id: true },
      });
      if (pf) {
        const daySubjects = await this.prisma.packageDaySubject.findMany({
          where: { package_id: pf.package_id },
          include: { role_template: { select: { role_name: true, is_group: true } } },
        });
        subjects = daySubjects.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role_template?.role_name ?? null,
          isGroup: s.role_template?.is_group ?? (s.count ?? 1) > 1,
        }));
      }
    }

    // ── Load presence + actions from existing data (Phase 1 already computed these) ──
    let presenceMaps = new Map<number, Map<string, boolean>>();
    let actionMaps = new Map<number, Map<string, string | null>>();
    let focalMaps = new Map<number, Map<string, FocalPriority>>();

    // Check if moments already have subject records with action descriptions (from Phase 1)
    let hasExistingActions = moments.some(
      (m) => m.subjects?.some((s) => s.action_description),
    );

    // If no actions on scene moments, check if PackageActivityMoment got them after scene was created (race condition)
    if (!hasExistingActions && activityId) {
      const activityMoments = await this.prisma.packageActivityMoment.findMany({
        where: { package_activity_id: activityId },
        include: {
          actions: {
            include: { subject_role: { select: { role_name: true } } },
            orderBy: { order_index: 'asc' },
          },
        },
      });
      const withActions = activityMoments.filter(
        (am) => am.actions.length > 0,
      );
      if (withActions.length > 0) {
        // Backfill: copy actions from PackageActivityMoment → FilmSceneMomentSubject
        for (const moment of moments) {
          const am = withActions.find((a) => a.name === moment.name) ?? withActions.find((a) => a.order_index === moment.order_index);
          if (!am) continue;
          const normalizedActions = new Map(
            am.actions
              .filter((action) => Boolean(action.subject_role?.role_name))
              .map((action) => [action.subject_role.role_name.toLowerCase(), action.action_text]),
          );
          for (const ms of moment.subjects ?? []) {
            const subjectName = ms.subject?.name;
            if (!subjectName || ms.action_description) continue;
            const action = normalizedActions.get(subjectName.toLowerCase()) ?? null;
            if (action) {
              await this.prisma.filmSceneMomentSubject.update({
                where: { id: ms.id },
                data: { action_description: action },
              });
              ms.action_description = action; // update in-memory too
            }
          }
        }
        hasExistingActions = moments.some((m) => m.subjects?.some((s) => s.action_description));
        if (hasExistingActions) {
          this.logger.log(`prepareScene: backfilled actions from PackageActivityMoment for ${withActions.length} moments`);
        }
      }
    }

    if (hasExistingActions) {
      // Build presence + action maps from existing FilmSceneMomentSubject records
      for (const moment of moments) {
        const presenceMap = new Map<string, boolean>();
        const actionMap = new Map<string, string | null>();
        for (const ms of moment.subjects ?? []) {
          const name = ms.subject?.name?.toLowerCase();
          if (!name) continue;
          // If action_description is null, the subject was marked absent in Phase 1
          presenceMap.set(name, ms.action_description != null);
          actionMap.set(name, ms.action_description ?? null);
        }
        presenceMaps.set(moment.order_index, presenceMap);
        actionMaps.set(moment.order_index, actionMap);

        // Build focal map from existing FilmSceneMomentSubject.priority
        const focalMap = new Map<string, FocalPriority>();
        for (const ms of moment.subjects ?? []) {
          const fname = ms.subject?.name?.toLowerCase();
          if (!fname) continue;
          focalMap.set(fname, (ms.priority ?? 'BACKGROUND') as FocalPriority);
        }
        focalMaps.set(moment.order_index, focalMap);
      }
      this.logger.log(
        `prepareScene: reusing Phase 1 casting + actions for ${moments.length} moments (skipping LLM)`,
      );
    } else {
      // Fallback: run LLM casting + actions (no existing data)
      this.logger.log(`prepareScene: no existing actions found — running LLM casting + actions`);

      // ── Stage 1: Activity Casting ──────────────────────────────────
      const castingStep = pipelineLog?.startStep('Activity Casting');
      emit('casting', `Casting ${subjects.length} subjects across ${moments.length} moments in "${sceneName ?? 'scene'}"...`, 'started');
      const castingInput = {
        activityName,
        activityDescription,
        durationMinutes,
        moments: moments.map((m) => ({
          index: m.order_index,
          name: m.name,
          description: m.description ?? '',
          durationSeconds: m.duration ?? 60,
        })),
        subjects: subjects.map((s) => ({ name: s.name, role: s.role, isGroup: s.isGroup })),
      };

      try {
        const castingResult = await this.activityCasting.execute(castingInput, castingStep);
        presenceMaps = this.activityCasting.toPresenceMaps(castingResult);
        focalMaps = this.activityCasting.toFocalMaps(castingResult);
        this.logger.log(`prepareScene: casting complete — ${castingResult.moments.length} moments`);
        emit('casting', `Casting complete for "${sceneName ?? 'scene'}" (${castingResult.moments.length} moments)`, 'completed');
      } catch (err) {
        this.logger.warn(`prepareScene: casting failed — ${(err as Error).message}. All subjects marked present.`);
        emit('casting', `Casting failed for "${sceneName ?? 'scene'}"`, 'failed', (err as Error).message);
      }

      // ── Stage 2: Activity Actions ──────────────────────────────────
      const actionsStep = pipelineLog?.startStep('Activity Actions');
      emit('actions', `Writing subject actions for ${subjects.length} subjects across ${moments.length} moments in "${sceneName ?? 'scene'}"...`, 'started');
      const actionsInput = {
        activityName,
        activityDescription,
        durationMinutes,
        moments: moments.map((m) => {
          const presenceMap = presenceMaps.get(m.order_index);
          return {
            index: m.order_index,
            name: m.name,
            description: m.description ?? '',
            durationSeconds: m.duration ?? 60,
            subjects: subjects.map((s) => ({
              name: s.name,
              present: presenceMap ? presenceMap.get(s.name.toLowerCase()) !== false : true,
              role: s.role,
              isGroup: s.isGroup,
            })),
          };
        }),
      };

      try {
        const actionsResult = await this.activityActions.execute(actionsInput, actionsStep);
        actionMaps = this.activityActions.toActionMap(actionsResult);
        this.logger.log(`prepareScene: actions complete`);
        emit('actions', `Subject actions recovered for "${sceneName ?? 'scene'}" (${actionsResult.moments.length} moments)`, 'completed');
        emit('activity-plan', `Activity plan recovered for "${sceneName ?? 'scene'}"`, 'completed');
      } catch (err) {
        this.logger.warn(`prepareScene: actions failed — ${(err as Error).message}`);
        emit('actions', `Action recovery failed for "${sceneName ?? 'scene'}"`, 'failed', (err as Error).message);
        emit('activity-plan', `Activity plan recovery failed for "${sceneName ?? 'scene'}"`, 'failed', (err as Error).message);
      }

      // ── Stage 3: Persist actions to FilmSceneMomentSubject records ──
      for (const moment of moments) {
        const actionMap = actionMaps.get(moment.order_index);
        if (!actionMap) continue;

        const stringActionMap = new Map<string, string>();
        for (const [name, action] of actionMap) {
          if (action) stringActionMap.set(name, action);
        }

        if (stringActionMap.size > 0) {
          try {
            await this.writeActionDescriptions(moment.id, filmId, subjects, stringActionMap);
          } catch (err) {
            this.logger.warn(`prepareScene: failed writing actions for moment ${moment.id} — ${(err as Error).message}`);
          }
        }
      }
    }

    // ── Stage 3.5: Camera Coverage Plan ───────────────────────────────
    const uniqueCameras = new Map<string, { trackLabel: string; isUnmanned: boolean }>();
    for (const m of moments) {
      for (const a of m.recording_setup?.camera_assignments ?? []) {
        if (a.track.type === 'VIDEO' && !uniqueCameras.has(a.track.name)) {
          uniqueCameras.set(a.track.name, {
            trackLabel: a.track.name,
            isUnmanned: a.track.is_unmanned ?? false,
          });
        }
      }
    }

    let coverageMap = new Map<number, Map<string, CameraMomentPlan>>();

    if (uniqueCameras.size > 0 && moments.length > 0) {
      const coverageStep = pipelineLog?.startStep('Camera Coverage Plan');
      emit('coverage', `Planning camera coverage for "${sceneName ?? 'scene'}" (${moments.length} moments, ${uniqueCameras.size} cameras)...`, 'started');
      const coverageInput: CameraCoverageInput = {
        activityName,
        cameras: [...uniqueCameras.values()],
        moments: moments.map((m) => {
          const momentFocal = focalMaps.get(m.order_index);
          const presMap = presenceMaps.get(m.order_index);
          return {
            momentIndex: m.order_index,
            momentName: m.name,
            description: m.description ?? '',
            subjects: subjects
              .filter((s) => !presMap || presMap.get(s.name.toLowerCase()) !== false)
              .map((s) => ({
                name: s.name,
                focal: (momentFocal?.get(s.name.toLowerCase()) ?? 'BACKGROUND') as 'PRIMARY' | 'SECONDARY' | 'BACKGROUND',
                isGroup: s.isGroup,
              })),
          };
        }),
      };

      try {
        const coverageResult = await this.cameraCoverage.execute(coverageInput, coverageStep);
        coverageMap = this.buildCoverageMap(coverageResult.moments);
        this.logger.log(`prepareScene: coverage plan complete — ${coverageResult.moments.length} moments`);
        emit('coverage', `Coverage plan complete for "${sceneName ?? 'scene'}" (${coverageResult.moments.length} moments)`, 'completed');
      } catch (err) {
        this.logger.warn(`prepareScene: coverage plan failed — ${(err as Error).message}`);
        emit('coverage', `Coverage plan failed for "${sceneName ?? 'scene'}"`, 'failed', (err as Error).message);
      }
    }

    // ── Stage 4: Spatial translation per camera (deterministic) ────
    const cameraPrep = pipelineLog?.startStep('Camera Prep (spatial)');
    emit('spatial', `Positioning camera assignments on floorplan for "${sceneName ?? 'scene'}"...`, 'started');
    type SpatialResult = {
      momentId: number;
      momentOrderIndex: number;
      assignmentId: number;
      trackLabel: string;
      shotType: string;
      rawSpatialShotType: string | null;
      shotDecisionSource: string;
      shouldPersistShotType: boolean;
      floorData: Awaited<ReturnType<FloorplanDataService['loadFloorplanData']>>;
      spatialFrame: SpatialFrame | null;
      subjectIds: number[];
      coverage: CameraMomentPlan | null;
    };

    const spatialResults: SpatialResult[] = [];

    for (const moment of moments) {
      const presenceMap = presenceMaps.get(moment.order_index);
      const assignments = (moment.recording_setup?.camera_assignments ?? []).filter(
        (a) => a.track.type === 'VIDEO',
      );

      for (const assignment of assignments) {
        const coverage = coverageMap.get(moment.order_index)?.get(assignment.track.name) ?? null;
        const ctx = await this.floorplanData.loadAssignmentContext(assignment.id, sourceType);

        const floorData = await this.floorplanData.loadFloorplanData(
          ctx.activityId ?? activityId ?? undefined,
          ctx.trackName,
          ctx.subjectIds,
          filmId,
          ctx.sceneCameraPositionId,
          ctx.momentName,
          ctx.sceneMomentId,
        );

        // Apply presence filter
        if (floorData && presenceMap) {
          floorData.subjects = floorData.subjects.filter(
            (s) => presenceMap.get(s.name.toLowerCase()) !== false,
          );
        }

        let spatialFrame: SpatialFrame | null = null;
        if (floorData) {
          spatialFrame = this.spatialTranslator.translate(
            floorData.camera,
            floorData.subjects,
            ctx.subjectIds,
          );
        }

        const shotDecision = this.shotDecision.resolve({
          assignmentShotType: ctx.shotType,
          coverageShotType: coverage?.shotType ?? null,
          spatialShotType: spatialFrame?.inferredShotType ?? null,
          fallbackShotType: 'MEDIUM_SHOT',
        });

        spatialResults.push({
          momentId: moment.id,
          momentOrderIndex: moment.order_index,
          assignmentId: assignment.id,
          trackLabel: ctx.trackName ?? assignment.track.name ?? `Camera`,
          shotType: shotDecision.resolvedShotType,
          rawSpatialShotType: shotDecision.rawSpatialShotType,
          shotDecisionSource: shotDecision.source,
          shouldPersistShotType: shotDecision.shouldPersistShotType,
          floorData,
          spatialFrame,
          subjectIds: ctx.subjectIds,
          coverage,
        });
      }
    }

    cameraPrep?.complete(`${spatialResults.length} cameras translated`);
    emit('spatial', `Cameras positioned for "${sceneName ?? 'scene'}"`, 'completed');

    // Skip director + persist stages when no camera assignments exist yet
    if (spatialResults.length === 0) {
      this.logger.log(`prepareScene: no camera assignments found for scene ${filmSceneId} — skipping director/persist stages`);
      emit('director', `No cameras to direct for "${sceneName ?? 'scene'}"`, 'completed');
      emit('persist', `Nothing to persist for "${sceneName ?? 'scene'}"`, 'completed');
      return { filmSceneId, moments: moments.map((m) => ({ momentId: m.id, assignments: [] })) };
    }

    // ── Stage 5: Activity Director ─────────────────────────────────
    const directorStep = pipelineLog?.startStep('Activity Director');
    emit('director', `Directing ${spatialResults.length} camera assignments for "${sceneName ?? 'scene'}"...`, 'started');

    // Group spatial results by moment for the director input
    const momentDirectorMap = new Map<number, SpatialResult[]>();
    for (const r of spatialResults) {
      const list = momentDirectorMap.get(r.momentOrderIndex) ?? [];
      list.push(r);
      momentDirectorMap.set(r.momentOrderIndex, list);
    }

    const directorInput = {
      activityName,
      activityDescription,
      durationMinutes,
      moments: moments
        .filter((m) => momentDirectorMap.has(m.order_index))
        .map((m) => {
          const actionMap = actionMaps.get(m.order_index);
          return {
            index: m.order_index,
            name: m.name,
            description: m.description ?? '',
            durationSeconds: m.duration ?? 60,
            cameras: (momentDirectorMap.get(m.order_index) ?? []).map((r) => ({
              assignmentId: r.assignmentId,
              trackLabel: r.trackLabel,
              shotType: r.shotType,
              visibleSubjects: (r.spatialFrame?.visibleSubjects ?? []).map((s) => ({
                name: s.name,
                frameX: +s.frameX.toFixed(3),
                scale: +s.scale.toFixed(3),
                depth: s.depth,
                side: s.side,
                distance: Math.round(s.distance),
                isTargeted: s.isTargeted,
                currentAction: actionMap?.get(s.name.toLowerCase()) ?? null,
              })),
            })),
          };
        }),
    };

    let directorResult: ActivityDirectorResult | null = null;
    try {
      directorResult = await this.activityDirector.execute(directorInput, directorStep);
      this.logger.log(`prepareScene: director complete — arc="${directorResult.overallArc.slice(0, 60)}..."`);
      emit('director', `Camera direction complete for "${sceneName ?? 'scene'}"`, 'completed');
    } catch (err) {
      this.logger.warn(`prepareScene: director failed — ${(err as Error).message}`);
      emit('director', `Camera direction failed for "${sceneName ?? 'scene'}"`, 'failed', (err as Error).message);
    }

    const directorMap = directorResult
      ? this.activityDirector.toAssignmentMap(directorResult)
      : new Map<number, any>();

    // ── Stage 6+7: ControlNet SVG + persist per camera ────────────
    const persistStep = pipelineLog?.startStep('Persist pipeline data');
    emit('persist', `Saving filming plan for "${sceneName ?? 'scene'}" (${spatialResults.length} camera assignments)...`, 'started');
    const assignmentResults: Array<{
      momentId: number;
      assignmentId: number;
      prepared: boolean;
      error?: string;
    }> = [];

    for (const r of spatialResults) {
      try {
        // ControlNet guide
        let compositionGuide: CompositionGuide | null = null;
        if (r.spatialFrame && r.spatialFrame.visibleSubjects.length > 0) {
          compositionGuide = this.dynamicControlnet.generate(r.spatialFrame.visibleSubjects, r.assignmentId);
        }

        const spatialHash = r.floorData
          ? this.floorplanData.computeSpatialHash(r.floorData.camera, r.floorData.subjects)
          : null;

        const directedCam = directorMap.get(r.assignmentId);
        const momentDirectorOutput = directorResult?.moments.find(
          (m) => m.momentIndex === r.momentOrderIndex,
        );

        // Build pipeline_data
        const pipelineData = {
          preparedAt: new Date().toISOString(),
          preparedBy: 'activity-planner',
          activityArc: directorResult?.overallArc ?? null,
          director: {
            emotionalTone: directedCam?.emotionalTone ?? momentDirectorOutput?.emotionalTone ?? 'candid',
            compositionNotes: directedCam?.compositionNotes ?? '',
            subjects: directedCam?.subjects ?? [],
            source: 'activity-director',
          },
          spatialFrame: r.spatialFrame
            ? {
                inferredShotType: r.spatialFrame.inferredShotType,
                visibleCount: r.spatialFrame.visibleSubjects.length,
                subjects: r.spatialFrame.visibleSubjects.map((s) => ({
                  name: s.name,
                  frameX: +s.frameX.toFixed(3),
                  scale: +s.scale.toFixed(3),
                  depth: s.depth,
                  side: s.side,
                  distance: Math.round(s.distance),
                })),
              }
            : null,
          shotDecision: {
            resolvedShotType: r.shotType,
            rawSpatialShotType: r.rawSpatialShotType,
            source: r.shotDecisionSource,
          },
          context: {
            shotType: r.shotType,
            sceneName: filmScene.name,
            momentName: moments.find((m) => m.id === r.momentId)?.name ?? '',
            activityName,
          },
          coveragePlan: r.coverage
            ? {
                active: r.coverage.active,
                shotType: r.coverage.shotType,
                coverageNotes: r.coverage.coverageNotes,
                targetSubjects: r.coverage.targetSubjects,
              }
            : null,
          // Phase D: geometry vs. editorial conflicts (reported, not applied).
          conflicts: [
            ...(r.spatialFrame &&
              r.rawSpatialShotType &&
              r.shotType !== r.rawSpatialShotType
              ? [
                  {
                    kind: 'SHOT_TYPE_MISMATCH' as const,
                    assignmentId: r.assignmentId,
                    editorial: r.shotType,
                    geometric: r.rawSpatialShotType,
                  },
                ]
              : []),
          ],
        };

        const visibleSubjectIds = (r.spatialFrame?.visibleSubjects ?? [])
          .map((s) => s.daySubjectId)
          .filter((id): id is number => id != null);

        // Phase D: compute target-not-visible conflict against the
        // blocking-owned editorial targets (assignment.subject_ids). We
        // resolve coverage target names only for reporting — the
        // assignment's subject_ids is already authoritative.
        let targetedSubjectIds: number[];
        if (r.coverage?.active && r.coverage.targetSubjects.length > 0) {
          targetedSubjectIds = r.coverage.targetSubjects
            .map((name) => subjects.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id)
            .filter((id): id is number => id != null);
          if (targetedSubjectIds.length === 0) targetedSubjectIds = r.subjectIds.length > 0 ? r.subjectIds : visibleSubjectIds;
        } else {
          targetedSubjectIds = r.subjectIds.length > 0 ? r.subjectIds : visibleSubjectIds;
        }

        const visibleSet = new Set(visibleSubjectIds);
        const targetsNotVisible = targetedSubjectIds.filter((id) => !visibleSet.has(id));
        if (targetsNotVisible.length > 0) {
          (pipelineData.conflicts as Array<Record<string, unknown>>).push({
            kind: 'TARGET_NOT_VISIBLE',
            assignmentId: r.assignmentId,
            targetSubjectIds: targetsNotVisible,
            visibleSubjectIds,
          });
        }

        await this.prisma.cameraSubjectAssignment.update({
          where: { id: r.assignmentId },
          data: {
            pipeline_data: pipelineData as any,
            spatial_hash: spatialHash,
            ...(this.toAssignmentShotType(r.coverage?.shotType ?? null)
              ? { shot_type: this.toAssignmentShotType(r.coverage?.shotType ?? null) }
              : {}),
            // Phase D/F: scene-prep no longer writes editorial shot_type
            // subject_ids. Editorial target subjects remain owned by
            // blocking; scene-prep only persists enum-safe shot_type
            // guidance from the coverage plan plus geometry-derived
            // visible_subject_ids and conflict records.
            ...(visibleSubjectIds.length > 0 ? { visible_subject_ids: visibleSubjectIds } : {}),
          },
        });

        assignmentResults.push({ momentId: r.momentId, assignmentId: r.assignmentId, prepared: true });
      } catch (err) {
        this.logger.error(`prepareScene: failed for assignment ${r.assignmentId} — ${(err as Error).message}`);
        assignmentResults.push({
          momentId: r.momentId,
          assignmentId: r.assignmentId,
          prepared: false,
          error: (err as Error).message,
        });
      }
    }

    persistStep?.complete(`${assignmentResults.filter((r) => r.prepared).length}/${assignmentResults.length} saved`);
    emit('persist', `Filming plan saved for "${sceneName ?? 'scene'}"`, 'completed');

    emit('scene-prep', `Finished "${sceneName ?? 'scene'}"`, 'completed');
    const newCompleted = Math.min(completedScenes + 1, totalScenes);
    if (newCompleted >= totalScenes) {
      this.prepEvents.emit({
        filmId,
        step: 'done',
        label: 'AI preparation complete',
        status: 'completed',
        timestamp: new Date().toISOString(),
        sceneName,
        completedScenes: totalScenes,
        totalScenes,
      });
    }

    return {
      filmSceneId,
      activityName,
      overallArc: directorResult?.overallArc ?? null,
      moments: moments.map((m) => ({
        momentId: m.id,
        momentName: m.name,
        assignments: assignmentResults.filter((r) => r.momentId === m.id),
      })),
    };
  }

  private toAssignmentShotType(shotType: string | null): ShotType | null {
    if (!shotType || !VALID_ASSIGNMENT_SHOT_TYPES.has(shotType as ShotType)) {
      return null;
    }

    return shotType as ShotType;
  }

  private buildCoverageMap(plans: MomentCoveragePlan[]): Map<number, Map<string, CameraMomentPlan>> {
    const map = new Map<number, Map<string, CameraMomentPlan>>();
    for (const p of plans) {
      const inner = new Map<string, CameraMomentPlan>();
      for (const cam of p.cameras) {
        inner.set(cam.trackLabel, cam);
      }
      map.set(p.momentIndex, inner);
    }
    return map;
  }

  /**
   * Write AI-generated action descriptions to FilmSceneMomentSubject records.
   * Creates the junction record if it doesn't exist (upsert).
   * Junction tables now reference PackageDaySubject.id directly — no bridge needed.
   */
  private async writeActionDescriptions(
    sceneMomentId: number,
    filmId: number,
    subjects: Array<{ id: number; name: string }>,
    actionMap: Map<string, string>,
  ): Promise<void> {
    let written = 0;
    for (const s of subjects) {
      const action = actionMap.get(s.name);
      if (!action) {
        this.logger.warn(`writeActionDescriptions: no action in map for "${s.name}"`);
        continue;
      }

      await this.prisma.filmSceneMomentSubject.upsert({
        where: {
          moment_id_subject_id: {
            moment_id: sceneMomentId,
            subject_id: s.id, // PackageDaySubject.id directly
          },
        },
        update: { action_description: action },
        create: {
          moment_id: sceneMomentId,
          subject_id: s.id,
          action_description: action,
        },
      });
      written++;
    }
    this.logger.log(
      `writeActionDescriptions: wrote ${written}/${actionMap.size} actions for moment ${sceneMomentId}`,
    );
  }

  // ─── Targeting refinement (REMOVED in Phase D) ───────────────────────
  // Editorial subject_ids are owned by the shot director / coverage plan.
  // Scene preparation only reports conflicts (target not visible, shot-type
  // mismatch) via pipelineData.conflicts. See prepare() for the conflict
  // emitter.

  // ─── Debug Logging ─────────────────────────────────────────────────

  private writeSkillLog(
    skill: string,
    meta: { assignmentId: number; trackName?: string; sceneName?: string; momentName?: string },
    sections: Record<string, unknown>,
  ) {
    try {
      const dir = path.join(process.cwd(), 'prompt-logs', skill);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const now = new Date();
      const time = now.toISOString().slice(11, 19).replace(/:/g, '-');
      const date = now.toISOString().slice(0, 10);

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
          lines.push(JSON.stringify(value, null, 2));
        }
      }

      fs.writeFileSync(path.join(dir, filename), lines.join('\n'), 'utf-8');
    } catch (err) {
      this.logger.warn(`Failed to write skill log (${skill}): ${err}`);
    }
  }
}
