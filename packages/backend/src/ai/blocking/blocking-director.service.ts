import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  buildCeremonyMotionTextForRole,
  ceremonyMotionExemptFromMomentText,
  deriveSandboxAnchors,
  distanceToPolygonBBox,
  inferShotTypeFromDistances,
  inferShotTypeWithHysteresis,
  nearestPointInPolygon,
  pointInPolygon,
  polygonCentroid,
  resolveSpatialCollisions,
  subjectCapForDistances,
  subjectCapForEditorialShotType,
  angleToPointDeg,
  rotationTowardPointsDeg,
  type SandboxRoomAnchorSpec,
} from '@projectflo/shared';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { SpaceSlotBlockingEnvironmentService } from '../../workflow/locations/modules/floor-plans/space-slot-blocking-environment.service';
import { GemmaService } from '../gemma/gemma.service';
import { SkillLoaderService } from '../gemma/skill-loader.service';
import { AiDirectorLogger } from './ai-director-logger';

// ─── Input types ─────────────────────────────────────────────────────

interface FloorplanObject {
  type: string;
  label: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  metadata?: Record<string, unknown> | null;
}

interface SubjectInput {
  name: string;
  role: string | null;
  isGroup: boolean;
  count: number;
  /** Large crowd-style groups stay fixed and are expanded at render time. */
  isFixedContextGroup: boolean;
  daySubjectId: number;
  positionId: number;
  prevX: number;
  prevY: number;
  prevRotation: number;
  /** Whether the subject was seated in the previous (or overridden) state. */
  prevSeated: boolean;
  boundTo?: string | null; // label of the object this subject is bound to
}

interface CameraInput {
  label: string;
  cameraPositionId: number;
  prevX: number;
  prevY: number;
  prevRotation: number;
  fovAngle?: number | null;
  /** Unmanned (locked-off) cameras must not move or rotate across moments. */
  isUnmanned: boolean;
  /** The base (track-level) position — unmanned cameras are pinned to this. */
  baseX: number;
  baseY: number;
  baseRotation: number;
  /** Editorial shot type for subject-cap guardrails (assignment intent). */
  shotType?: string | null;
  /** When true, AI blocking must not overwrite shot_type. */
  shotTypeLocked?: boolean;
}

interface ZoneInput {
  name: string;
  label: string | null;
  description: string | null;
  polygon: { x: number; y: number }[];
}

type CameraAssignmentShotLock = {
  shot_type?: string | null;
  shot_type_locked?: boolean;
};

// ─── AI output types ─────────────────────────────────────────────────

interface AiSubjectResult {
  name: string;
  x: number;
  y: number;
  rotation: number;
  actionDescription: string;
  /** Whether the subject is seated for this moment (optional; null = inherit base). */
  seated?: boolean | null;
}

interface AiCameraResult {
  label: string;
  x: number;
  y: number;
  rotation: number;
  subjectNames: string[];
}

interface AiMisplacedCameraResult {
  name?: string;
  label?: string;
  x: number;
  y: number;
  rotation: number;
  subjectNames: string[];
}

interface AiResponse {
  momentDescription: string;
  durationSeconds: number;
  subjects: AiSubjectResult[];
  cameras: AiCameraResult[];
}

// ─── Public result types ─────────────────────────────────────────────

interface SubjectBlockingResult extends AiSubjectResult {
  positionId: number;
  daySubjectId: number;
}
interface CameraBlockingResult extends AiCameraResult {
  cameraPositionId: number;
  /** FOV widened deterministically when needed to keep assigned subjects in frame. */
  fovAngle?: number | null;
  /** Geometric shot type inferred after guardrails (persisted when unlocked). */
  inferredShotType?: string | null;
}

interface BlockingGuardrailTelemetry {
  cappedCameraCount: number;
  notices: string[];
}

export interface BlockingProgressUpdate {
  substep:
    | 'llm-request-started'
    | 'llm-response-received'
    | 'parse-complete'
    | 'guardrails-applied';
  llmDurationMs?: number;
  queueWaitMs?: number;
  cappedCameraCount?: number;
  warningCount?: number;
  notices?: string[];
}

export interface BlockingPlanningTelemetry {
  llmDurationMs: number;
  queueWaitMs: number;
  cappedCameraCount: number;
  warningCount: number;
  correctedCameraAssignments: number;
  notices: string[];
}

export interface GenerateBlockingResult {
  momentDescription: string;
  durationSeconds: number;
  subjects: SubjectBlockingResult[];
  cameras: CameraBlockingResult[];
  model: string;
  provider: string;
}

export interface PackageGenerateBlockingResult extends GenerateBlockingResult {
  logFilePath: string;
  logContent: string;
  telemetry: BlockingPlanningTelemetry;
}

interface GeneratePackageBlockingOptions {
  onProgress?: (update: BlockingProgressUpdate) => void;
}

@Injectable()
export class BlockingDirectorService implements OnModuleInit {
  private readonly logger = new Logger(BlockingDirectorService.name);
  private systemPrompt = '';
  private static readonly COMPACT_SYSTEM_PROMPT = [
    'You are a wedding cinematography blocking director.',
    'Return only valid JSON.',
    'Preserve each input subject and camera label exactly.',
    'Output schema:',
    '{',
    '  "momentDescription": string,',
    '  "durationSeconds": number,',
    '  "subjects": [{ "name": string, "x": number, "y": number, "rotation": number, "seated": boolean|null, "actionDescription": string }],',
    '  "cameras": [{ "label": string, "x": number, "y": number, "rotation": number, "subjectNames": string[] }]',
    '}',
    'Rules:',
    '- Keep coordinates inside 0..1000.',
    '- Keep large crowd groups in their existing area.',
    '- Keep camera labels unchanged and reference existing subjects only.',
    '- Keep blocking realistic for the described timeline moment.',
  ].join('\n');

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemma: GemmaService,
    private readonly blockingEnvironment: SpaceSlotBlockingEnvironmentService,
    private readonly skills: SkillLoaderService,
  ) {}

  onModuleInit() {
    this.systemPrompt = this.skills.load('blocking/cinematography-director.md');
    this.logger.log(`Loaded AI Director skill (${this.systemPrompt.length} chars)`);
  }

  async generateBlocking(
    sceneMomentId: number,
    spaceSlotId: number,
    activityId?: number,
  ): Promise<GenerateBlockingResult> {
    // 0. Load the SceneMoment together with its owning PackageActivityMoment.
    // The FK is the single source of truth — the old name-match fallback
    // (resolvePackageMoment) has been removed.
    const sceneMoment = await this.prisma.sceneMoment.findUniqueOrThrow({
      where: { id: sceneMomentId },
      select: {
        id: true,
        name: true,
        source_activity_id: true,
        package_activity_moment_id: true,
        order_index: true,
        film_scene_id: true,
        source_moment: {
          select: { id: true, order_index: true, package_activity_id: true, duration_seconds: true, description: true, notes: true },
        },
      },
    });

    const runLog = new AiDirectorLogger(sceneMomentId, sceneMoment.name);
    runLog.log('LOAD', `SceneMoment loaded: id=${sceneMomentId}, name="${sceneMoment.name}", orderIndex=${sceneMoment.order_index}, filmSceneId=${sceneMoment.film_scene_id}`);

    // Load all moments in this scene for narrative context
    const allSceneMoments = await this.prisma.sceneMoment.findMany({
      where: { film_scene_id: sceneMoment.film_scene_id },
      select: { id: true, name: true, description: true, duration: true, order_index: true },
      orderBy: { order_index: 'asc' },
    });
    runLog.log('LOAD', `Scene timeline: ${allSceneMoments.length} moments in scene`);
    runLog.table('Timeline', allSceneMoments.map(m => ({ idx: m.order_index, name: m.name, dur: m.duration ?? '?', desc: (m.description || '').slice(0, 60) })));

    const pkgMoment = sceneMoment.source_moment;
    const packageMomentId = pkgMoment?.id ?? null;
    runLog.log('RESOLVE', `PackageActivityMoment: ${packageMomentId ? `id=${packageMomentId} (via FK)` : 'NOT FOUND (SceneMoment.package_activity_moment_id is null)'}`);
    if (pkgMoment) {
      runLog.data('Package moment', { id: pkgMoment.id, orderIndex: pkgMoment.order_index, durationSeconds: pkgMoment.duration_seconds, description: pkgMoment.description });
    }

    const core = await this.planBlockingCore({
      packageMomentId,
      spaceSlotId,
      activityId,
      momentName: sceneMoment.name,
      runLog,
      sceneMoments: allSceneMoments,
      currentMomentIndex: sceneMoment.order_index,
      sceneMomentId,
    });

    if (!core) {
      return { momentDescription: '', durationSeconds: 60, subjects: [], cameras: [], model: '', provider: '' };
    }

    // 6. Write all results to DB (film-level: SceneMoment + Space overrides + FilmSceneMomentSubject + CameraSubjectAssignment)
    runLog.section('DB WRITES');
    runLog.log('WRITE', `Writing results to DB: sceneMomentId=${sceneMomentId}, packageMomentId=${packageMomentId}`);
    await this.writeResults(sceneMomentId, packageMomentId, core.parsed, core.cameras, runLog);

    runLog.section('RESULT SUMMARY');
    runLog.log('DONE', `Model: ${core.gemma.model}, Provider: ${core.gemma.provider}`);
    runLog.log('DONE', `Duration estimate: ${core.parsed.durationSeconds}s`);
    runLog.log('DONE', `Subjects blocked: ${core.parsed.subjects.length}, Cameras blocked: ${core.parsed.cameras.length}`);
    for (const cam of core.parsed.cameras) {
      runLog.log('DONE', `  ${cam.label}: [${cam.subjectNames.join(', ')}]`);
    }

    const logPath = runLog.flush();
    this.logger.log(`AI Director log written to ${logPath}`);

    return {
      ...core.parsed,
      model: core.gemma.model,
      provider: core.gemma.provider,
    };
  }

  /**
   * Package-level blocking entrypoint. Runs during package creation (no
   * film, no SceneMoment yet) to populate:
   *   - `SpaceSlotMomentCamera` (per-moment camera position overrides)
   *   - `PackageActivityMoment.camera_subject_plan` ({ cameraLabel: [subjectName, ...] })
   *
   * Films created from this package inherit these via `packageFilmLinker`
   * which maps `camera_subject_plan` to film `CameraSubjectAssignment.subject_ids`.
   */
  async generateBlockingForPackageMoment(
    packageMomentId: number,
    spaceSlotId: number,
    activityId?: number,
    options: GeneratePackageBlockingOptions = {},
  ): Promise<PackageGenerateBlockingResult> {
    const pkgMoment = await this.prisma.packageActivityMoment.findUniqueOrThrow({
      where: { id: packageMomentId },
      select: { id: true, name: true, order_index: true, package_activity_id: true, description: true, duration_seconds: true, notes: true },
    });

    // AiDirectorLogger filename is keyed by id; use a negative id so the
    // file name clearly identifies a package-moment run vs a scene-moment run.
    const runLog = new AiDirectorLogger(-packageMomentId, `[pkg] ${pkgMoment.name}`);
    runLog.log('LOAD', `PackageActivityMoment loaded: id=${packageMomentId}, name="${pkgMoment.name}", orderIndex=${pkgMoment.order_index}`);

    const core = await this.planBlockingCore({
      packageMomentId,
      spaceSlotId,
      activityId,
      momentName: pkgMoment.name,
      runLog,
      onProgress: options.onProgress,
    });

    if (!core) {
      runLog.section('RESULT SUMMARY');
      runLog.warn('DONE', 'No blocking result produced; returning empty package-level blocking payload');
      const artifact = runLog.flush();
      this.logger.log(`AI Director (package) log written to ${artifact.filePath}`);
      return {
        momentDescription: '',
        durationSeconds: 60,
        subjects: [],
        cameras: [],
        model: '',
        provider: '',
        logFilePath: artifact.filePath,
        logContent: artifact.content,
        telemetry: {
          llmDurationMs: 0,
          queueWaitMs: 0,
          cappedCameraCount: 0,
          warningCount: 0,
          correctedCameraAssignments: 0,
          notices: [],
        },
      };
    }

    // Package-level writes only — no SceneMoment, no FilmSceneMomentSubject, no CameraSubjectAssignment.
    runLog.section('DB WRITES (package-level)');
    runLog.log('WRITE', `Writing package-scoped results: packageMomentId=${packageMomentId}, spaceSlotId=${spaceSlotId}`);
    const packageActivity = await this.prisma.packageActivity.findUnique({
      where: { id: pkgMoment.package_activity_id },
      select: { package_id: true },
    });
    const servicePackage = packageActivity
      ? await this.prisma.service_packages.findUnique({
        where: { id: packageActivity.package_id },
        select: { source_day_blueprint_version_id: true },
      })
      : null;
    const isBlueprintMode = Boolean(servicePackage?.source_day_blueprint_version_id);
    await this.writePackageMomentResults(
      packageMomentId,
      spaceSlotId,
      pkgMoment.name,
      core.parsed,
      core.cameras,
      runLog,
      { isBlueprintMode },
    );

    runLog.section('RESULT SUMMARY');
    runLog.log('DONE', `Model: ${core.gemma.model}, Provider: ${core.gemma.provider}`);
    runLog.log('DONE', `Duration estimate: ${core.parsed.durationSeconds}s`);
    runLog.log('DONE', `Subjects blocked: ${core.parsed.subjects.length}, Cameras blocked: ${core.parsed.cameras.length}`);
    for (const cam of core.parsed.cameras) {
      runLog.log('DONE', `  ${cam.label}: [${cam.subjectNames.join(', ')}]`);
    }

    const artifact = runLog.flush();
    this.logger.log(`AI Director (package) log written to ${artifact.filePath}`);

    return {
      ...core.parsed,
      model: core.gemma.model,
      provider: core.gemma.provider,
      logFilePath: artifact.filePath,
      logContent: artifact.content,
      telemetry: core.telemetry,
    };
  }

  /**
   * Shared AI planning core: loads the space slot, builds the prompt, calls
   * Gemma, parses the response, and enforces zone containment. Returns
   * `null` if the slot has no subjects (caller returns an empty result).
   *
   * Used by both `generateBlocking` (film-level) and
   * `generateBlockingForPackageMoment` (package-level); the caller owns the
   * write phase.
   */
  private async planBlockingCore(params: {
    packageMomentId: number | null;
    spaceSlotId: number;
    activityId: number | undefined;
    momentName: string;
    runLog: AiDirectorLogger;
    sceneMoments?: { id: number; name: string; description: string | null; duration: number | null; order_index: number }[];
    currentMomentIndex?: number;
    sceneMomentId?: number;
    onProgress?: (update: BlockingProgressUpdate) => void;
  }): Promise<{
    parsed: Omit<GenerateBlockingResult, 'model' | 'provider'>;
    cameras: CameraInput[];
    gemma: { model: string; provider: string };
    telemetry: BlockingPlanningTelemetry;
    isBlueprintMode: boolean;
  } | null> {
    const { packageMomentId, spaceSlotId, activityId, momentName, runLog, sceneMoments, currentMomentIndex, sceneMomentId, onProgress } = params;

    let isBlueprintMode = false;
    if (packageMomentId != null) {
      const pkgMomentRow = await this.prisma.packageActivityMoment.findUnique({
        where: { id: packageMomentId },
        select: { package_activity: { select: { package_id: true } } },
      });
      const packageId = pkgMomentRow?.package_activity?.package_id;
      if (packageId) {
        const servicePackage = await this.prisma.service_packages.findUnique({
          where: { id: packageId },
          select: { source_day_blueprint_version_id: true },
        });
        isBlueprintMode = Boolean(servicePackage?.source_day_blueprint_version_id);
      }
    }
    if (isBlueprintMode) {
      runLog.log('MODE', 'Blueprint package — subject floor positions are fixed; plan cameras only');
    }

    // 1. Load space slot with objects, subjects, and cameras
    runLog.section('SPACE SLOT DATA');
    const spaceSlot = await this.prisma.packageSpaceSlot.findUniqueOrThrow({
      where: { id: spaceSlotId },
      include: {
        objects: { orderBy: { order_index: 'asc' } },
        subject_positions: {
          include: {
            day_subject: { include: { role_template: true } },
            bound_object: { select: { label: true } },
            moment_overrides: packageMomentId
              ? { where: { moment_id: packageMomentId } }
              : { take: 0 },
          },
        },
        camera_positions: {
          include: {
            moment_overrides: packageMomentId
              ? { where: { moment_id: packageMomentId } }
              : { take: 0 },
            // Follow crew slot → equipment chain so we can derive the
            // locked-off flag from the package EquipmentCard toggle
            // (Equipment.is_unmanned is the user-facing source of truth).
            crew_slot: {
              include: {
                equipment: { include: { equipment: { select: { id: true, is_unmanned: true, category: true } } } },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });
    runLog.log('LOAD', `SpaceSlot ${spaceSlotId}: ${spaceSlot.objects.length} objects, ${spaceSlot.subject_positions.length} subject positions, ${spaceSlot.camera_positions.length} camera positions`);

    const floorplanObjects: FloorplanObject[] = spaceSlot.objects.map((o) => ({
      type: o.object_type, label: o.label,
      x: o.x, y: o.y, width: o.width, height: o.height, rotation: o.rotation,
      metadata: (o.metadata as Record<string, unknown> | null) ?? null,
    }));
    runLog.table('Floorplan objects', floorplanObjects.map(o => ({ type: o.type, label: o.label ?? '', x: Math.round(o.x), y: Math.round(o.y) })));

    // 2. Build subject + camera lists with previous positions
    runLog.section('SUBJECT & CAMERA RESOLUTION');
    const prevSubjectPos = packageMomentId
      ? await this.loadLastKnownSubjectPositions(packageMomentId, spaceSlotId, activityId)
      : new Map<number, { x: number; y: number; rotation: number }>();
    const prevCameraPos = packageMomentId
      ? await this.loadLastKnownCameraPositions(packageMomentId, spaceSlotId, activityId)
      : new Map<number, { x: number; y: number; rotation: number }>();
    runLog.log('LOAD', `Previous positions: ${prevSubjectPos.size} subjects, ${prevCameraPos.size} cameras from prior moments`);

    // Build subject list, deduplicating by name (keep highest positionId — newest preset batch)
    const subjectsByName = new Map<string, SubjectInput>();
    let deduplicatedByNameCount = 0;
    for (const sp of spaceSlot.subject_positions) {
      if (!sp.day_subject) continue;
      const override = sp.moment_overrides[0];
      const prev = prevSubjectPos.get(sp.id);
      const nameKey = sp.day_subject.name.toLowerCase();
      const existing = subjectsByName.get(nameKey);
      if (existing) deduplicatedByNameCount += 1;
      // If duplicate name, keep the one with the higher positionId (newer preset)
      if (existing && existing.positionId > sp.id) continue;
      const count = sp.day_subject.count ?? 1;
      const isGroup = sp.day_subject.role_template?.is_group ?? count > 1;
      subjectsByName.set(nameKey, {
        name: sp.day_subject.name,
        role: sp.day_subject.role_template?.role_name ?? null,
        isGroup,
        count,
        isFixedContextGroup: isGroup && count > 10,
        daySubjectId: sp.day_subject.id,
        positionId: sp.id,
        prevX: prev?.x ?? override?.x ?? sp.x,
        prevY: prev?.y ?? override?.y ?? sp.y,
        prevRotation: prev?.rotation ?? override?.rotation ?? sp.rotation,
        prevSeated: override?.seated ?? sp.seated ?? false,
        boundTo: (sp as any).bound_object?.label ?? null,
      });
    }
    let subjects: SubjectInput[] = [...subjectsByName.values()];
    if (deduplicatedByNameCount > 0) {
      runLog.warn('DEDUP', `Collapsed ${deduplicatedByNameCount} duplicate subject position row(s) by name`);
    }
    const fixedContextGroups = subjects.filter((s) => s.isFixedContextGroup);
    if (fixedContextGroups.length > 0) {
      runLog.log(
        'SUBJECT',
        `Keeping ${fixedContextGroups.length} large group subject(s) as fixed context: ${fixedContextGroups
          .map((s) => `${s.name} (count=${s.count})`)
          .join(', ')}`,
      );
    }
    runLog.table('Subjects', subjects.map(s => ({
      name: s.name,
      role: s.role ?? 'none',
      isGroup: s.isGroup,
      fixedContext: s.isFixedContextGroup,
      daySubjectId: s.daySubjectId,
      pos: `(${Math.round(s.prevX)},${Math.round(s.prevY)})@${Math.round(s.prevRotation)}°`,
      boundTo: s.boundTo ?? '',
    })));

    const cameras: CameraInput[] = [];
    for (const cp of spaceSlot.camera_positions) {
      const override = cp.moment_overrides[0];
      const prev = prevCameraPos.get(cp.id);
      // A camera is unmanned if EITHER the space-slot position is
      // explicitly flagged (manual override) OR any linked equipment on
      // its crew slot is itself unmanned (tripod / gimbal set in the
      // package EquipmentCard). We trust either signal.
      const linkedEquipUnmanned = (cp.crew_slot?.equipment ?? []).some((e: any) =>
        e?.equipment?.is_unmanned === true && (e?.equipment?.category || '').toUpperCase() === 'CAMERA',
      );
      const isUnmanned = cp.is_unmanned === true || linkedEquipUnmanned;
      cameras.push({
        label: cp.label || `Camera ${cp.order_index + 1}`,
        cameraPositionId: cp.id,
        prevX: prev?.x ?? override?.x ?? cp.x,
        prevY: prev?.y ?? override?.y ?? cp.y,
        prevRotation: prev?.rotation ?? override?.rotation ?? cp.rotation,
        fovAngle: (override as any)?.fov_angle ?? cp.fov_angle ?? null,
        isUnmanned,
        baseX: cp.x,
        baseY: cp.y,
        baseRotation: cp.rotation,
        shotType: this.defaultEditorialShotTypeForCamera(cp.order_index, isUnmanned),
      });
    }

    if (sceneMomentId) {
      const recordingSetup = await this.prisma.momentRecordingSetup.findUnique({
        where: { moment_id: sceneMomentId },
        include: {
          camera_assignments: {
            include: { track: { select: { name: true } } },
          },
        },
      });
      if (recordingSetup) {
        const trackNameToAssignment = new Map(
          recordingSetup.camera_assignments
            .filter((a) => a.track?.name && !a.track.name.toLowerCase().includes('audio'))
            .map((a) => [a.track!.name.toLowerCase(), a]),
        );
        for (const cam of cameras) {
          const assignment = trackNameToAssignment.get(cam.label.toLowerCase());
          if (assignment) {
            if (assignment.shot_type) {
              cam.shotType = assignment.shot_type;
            }
            cam.shotTypeLocked = (assignment as CameraAssignmentShotLock).shot_type_locked;
          }
        }
        runLog.log(
          'LOAD',
          `Merged ${trackNameToAssignment.size} moment assignment(s) into camera inputs (shot type + lock)`,
        );
      }
    }

    runLog.table('Cameras', cameras.map(c => ({
      label: c.label, positionId: c.cameraPositionId,
      pos: `(${Math.round(c.prevX)},${Math.round(c.prevY)})@${Math.round(c.prevRotation)}°`,
      fov: c.fovAngle ?? 'default',
      unmanned: c.isUnmanned ? 'LOCKED' : 'operated',
    })));

    if (subjects.length === 0) {
      runLog.warn('ABORT', 'No subjects found — returning empty result');
      runLog.flush();
      return null;
    }

    // 3. Load activity context
    const pkgMoment = packageMomentId
      ? await this.prisma.packageActivityMoment.findUnique({
          where: { id: packageMomentId },
          select: { description: true, notes: true, duration_seconds: true, package_activity_id: true },
        })
      : null;

    const blueprintMomentActions = isBlueprintMode && packageMomentId
      ? (
          await this.prisma.packageActivityMomentAction.findMany({
            where: { package_activity_moment_id: packageMomentId },
            include: { subject_role: { select: { role_name: true } } },
            orderBy: { order_index: 'asc' },
          })
        ).map((row) => ({
          roleName: row.subject_role.role_name,
          actionText: row.action_text,
        }))
      : [];
    if (blueprintMomentActions.length > 0) {
      runLog.log('LOAD', `Blueprint moment actions: ${blueprintMomentActions.length} role narrative(s)`);
      if (isBlueprintMode) {
        const before = subjects.length;
        subjects = this.filterSubjectsToBlueprintCast(subjects, blueprintMomentActions);
        if (subjects.length !== before) {
          runLog.log(
            'LOAD',
            `Blueprint cast filter: ${subjects.length}/${before} subject(s) in this moment's authored roster`,
          );
        }
      }
    }
    const activity = pkgMoment
      ? await this.prisma.packageActivity.findUnique({
          where: { id: pkgMoment.package_activity_id },
          select: { name: true, description: true },
        })
      : null;
    runLog.log('LOAD', `Activity: ${activity ? `"${activity.name}"` : 'none'}`);

    // 3b. Load spatial context (zones) for richer AI reasoning
    runLog.section('SPATIAL CONTEXT');
    const spatialCtx = await this.blockingEnvironment.buildContext(
      spaceSlotId,
      packageMomentId ?? undefined,
    );

    const zones: ZoneInput[] = spatialCtx.zones.map((z) => ({
      name: z.name,
      label: z.label,
      description: z.description ?? null,
      polygon: z.polygon as unknown as { x: number; y: number }[],
    }));
    runLog.log('LOAD', `Zones: ${zones.length}`);

    // 3c. Auto-generate zones if none exist but objects are present (skip for blueprint packages with snapshot zones)
    if (!isBlueprintMode && zones.length === 0 && floorplanObjects.length > 0) {
      runLog.log('ZONE_GEN', 'No zones found — generating from objects via Gemma');
      const generatedZones = await this.generateZonesFromObjects(spaceSlotId);
      zones.push(...generatedZones);
      runLog.log('ZONE_GEN', `Generated ${generatedZones.length} zones`);
    }

    if (zones.length > 0) {
      runLog.table('Zones', zones.map(z => ({ name: z.name, label: z.label, points: z.polygon.length })));
    }

    // 3d. Derive named anchors from the slot geometry (shared landmark
    // vocabulary with the placement seed and the Day Designer preview).
    const anchors = deriveSandboxAnchors(
      floorplanObjects.map((o) => ({
        object_type: o.type,
        label: o.label,
        x: o.x,
        y: o.y,
        width: o.width,
        height: o.height,
        metadata: o.metadata ?? null,
      })),
    );
    if (anchors.length > 0) {
      runLog.table('Anchors', anchors.map(a => ({ name: a.name, pos: `(${a.x},${a.y})@${a.rotation}°` })));
    }

    // 4. Build prompt + call Gemma
    runLog.section('SKILL FILES & PROMPT');
    runLog.log('SKILL', `System prompt source: skill files (${this.systemPrompt.length} chars)`);

    const userMessage = this.buildUserMessage({
      momentName,
      activityName: activity?.name ?? 'Unknown',
      activityDescription: activity?.description ?? undefined,
      momentDescription: pkgMoment?.description ?? undefined,
      momentNotes: pkgMoment?.notes ?? undefined,
      currentDurationSeconds: pkgMoment?.duration_seconds ?? undefined,
      floorplanObjects, subjects, cameras,
      zones,
      anchors,
      sceneMoments,
      currentMomentIndex,
      isBlueprintMode,
      blueprintMomentActions,
    });
    runLog.log('PROMPT', `User message built: ${userMessage.length} chars, ${userMessage.split('\n').length} lines`);
    runLog.data('User message (full)', userMessage);

    runLog.section('GEMMA AI CALL');
    const systemPromptForCall = this.selectSystemPrompt(userMessage.length);
    runLog.log('AI_CALL', `Sending to Gemma: system=${systemPromptForCall.length} chars, user=${userMessage.length} chars, maxTokens=3000, temp=0.4`);
    onProgress?.({ substep: 'llm-request-started' });

    const result = await this.gemma.chat({
      messages: [
        { role: 'system', content: systemPromptForCall },
        { role: 'user', content: userMessage },
      ],
      maxTokens: 3000,
      temperature: 0.4,
      responseFormat: { type: 'json_object' },
    });

    runLog.log('AI_RESP', `Response received in ${result.requestDurationMs}ms from model="${result.model}" provider="${result.provider}" (queue ${result.queueWaitMs}ms)`);
    runLog.log('AI_RESP', `Reply length: ${result.reply.length} chars`);
    runLog.data('Raw AI response', result.reply);
    onProgress?.({
      substep: 'llm-response-received',
      llmDurationMs: result.requestDurationMs,
      queueWaitMs: result.queueWaitMs,
    });

    // 5. Parse + validate
    runLog.section('PARSE & VALIDATE');
    const parsed = this.parseResponse(result.reply, subjects, cameras);
    if (isBlueprintMode) {
      const subjectByName = new Map(subjects.map((s) => [s.name.toLowerCase(), s]));
      for (const row of parsed.subjects) {
        const input = subjectByName.get(row.name.toLowerCase());
        if (input) {
          row.x = input.prevX;
          row.y = input.prevY;
          row.rotation = input.prevRotation;
          row.seated = input.prevSeated;
        }
      }
      runLog.log('PARSE', 'Blueprint mode: clamped parsed subject positions to seeded blueprint layout');
    }
    runLog.log('PARSE', `Parsed: momentDescription="${parsed.momentDescription.slice(0, 80)}...", duration=${parsed.durationSeconds}s`);
    runLog.log('PARSE', `Subjects: ${parsed.subjects.length} parsed from ${subjects.length} input`);
    runLog.table('Parsed subjects', parsed.subjects.map(s => ({
      name: s.name, pos: `(${s.x},${s.y})@${s.rotation}°`, action: s.actionDescription.slice(0, 60),
      daySubjectId: s.daySubjectId,
    })));
    runLog.log('PARSE', `Cameras: ${parsed.cameras.length} parsed from ${cameras.length} input`);
    runLog.table('Parsed cameras', parsed.cameras.map(c => ({
      label: c.label, pos: `(${c.x},${c.y})@${c.rotation}°`,
      subjects: c.subjectNames.join(', '),
    })));
    onProgress?.({ substep: 'parse-complete' });

    const guardrailTelemetry = this.applyBlockingGuardrails(
      parsed,
      subjects,
      cameras,
      zones,
      floorplanObjects,
      { isBlueprintMode },
    );
    this.refineMomentAwareTargeting(
      parsed,
      momentName,
      blueprintMomentActions,
      subjects,
      cameras,
      guardrailTelemetry,
    );
    onProgress?.({
      substep: 'guardrails-applied',
      cappedCameraCount: guardrailTelemetry.cappedCameraCount,
      warningCount: guardrailTelemetry.notices.length,
      notices: [...guardrailTelemetry.notices],
    });

    return {
      parsed,
      cameras,
      gemma: { model: result.model, provider: result.provider },
      telemetry: {
        llmDurationMs: result.requestDurationMs,
        queueWaitMs: result.queueWaitMs,
        cappedCameraCount: guardrailTelemetry.cappedCameraCount,
        warningCount: guardrailTelemetry.notices.length,
        correctedCameraAssignments: guardrailTelemetry.cappedCameraCount,
        notices: [...guardrailTelemetry.notices],
      },
      isBlueprintMode,
    };
  }

  /**
   * Moment name patterns that require seated guests to stand.
   * Guests (and other group subjects) get a `seated=false` override
   * for these moments so the spatial engine renders them standing in
   * their chair positions.
   */
  private static readonly STANDING_MOMENT_PATTERNS = [
    /\ball\s*rise\b/i,
    /processional/i,
    /recessional/i,
    /\bstand/i,
    /guests?\s*(stand|rise)/i,
    /congregation\s*(stand|rise)/i,
  ];

  private static readonly PROCESSIONAL_MOMENT_PATTERNS = [
    /processional/i,
    /walk(?:ing|s)?\s+down\s+the\s+aisle/i,
    /enter(?:s|ing)?\s+the\s+(?:ceremony|space)/i,
  ];

  private static readonly PROCESSIONAL_PARTY_ROLE_RE =
    /\b(bride|groom|bridesmaid|groomsman|flower girl|ring bearer|best man|maid of honor|father of (?:bride|groom))\b/i;

  private static isStandingMoment(momentName: string): boolean {
    return BlockingDirectorService.STANDING_MOMENT_PATTERNS.some((p) => p.test(momentName));
  }

  private static isProcessionalMoment(
    momentName: string,
    actions: Array<{ roleName: string; actionText: string }>,
  ): boolean {
    if (BlockingDirectorService.PROCESSIONAL_MOMENT_PATTERNS.some((p) => p.test(momentName))) {
      return true;
    }
    return actions.some((a) =>
      /walk|processional|aisle|enter(?:s|ing)?/i.test(a.actionText),
    );
  }

  /** Default editorial shot type when no assignment exists yet (package blocking). */
  private defaultEditorialShotTypeForCamera(orderIndex: number, isUnmanned: boolean): string {
    if (isUnmanned) return 'MEDIUM_SHOT';
    if (orderIndex === 0) return 'ESTABLISHING_SHOT';
    if (orderIndex === 1) return 'WIDE_SHOT';
    return 'MEDIUM_SHOT';
  }

  private isMovingCeremonySubject(
    subject: SubjectInput,
    momentName: string,
    actions: Array<{ roleName: string; actionText: string }>,
  ): boolean {
    if (subject.isFixedContextGroup) return false;
    if (subject.prevSeated) return false;

    const roleKey = (subject.role ?? subject.name).toLowerCase();
    const action = actions.find((a) => a.roleName.toLowerCase() === roleKey);
    const motionText = buildCeremonyMotionTextForRole({
      actionText: action?.actionText,
      momentName,
    });
    if (ceremonyMotionExemptFromMomentText(motionText)) return true;

    if (BlockingDirectorService.isProcessionalMoment(momentName, actions)) {
      return (
        BlockingDirectorService.PROCESSIONAL_PARTY_ROLE_RE.test(subject.name) ||
        BlockingDirectorService.PROCESSIONAL_PARTY_ROLE_RE.test(subject.role ?? '')
      );
    }
    return false;
  }

  private subjectNamesInCameraFov(
    cam: CameraBlockingResult,
    subjects: SubjectBlockingResult[],
    fovAngle?: number | null,
  ): string[] {
    const fov = this.clamp(fovAngle ?? cam.fovAngle ?? 60, 10, 120);
    const halfFov = fov / 2;
    const visible: Array<{ name: string; distance: number }> = [];

    for (const subject of subjects) {
      const angle = angleToPointDeg(cam.x, cam.y, subject.x, subject.y);
      const dev = Math.abs(((angle - cam.rotation + 540) % 360) - 180);
      if (dev > halfFov) continue;
      visible.push({
        name: subject.name,
        distance: Math.hypot(subject.x - cam.x, subject.y - cam.y),
      });
    }

    return visible
      .toSorted((a, b) => a.distance - b.distance)
      .map((row) => row.name);
  }

  /**
   * Deterministic fallback: processional moments target moving subjects only;
   * empty or bloated AI rosters are replaced with FOV-visible, capped picks.
   */
  private refineMomentAwareTargeting(
    parsed: Omit<GenerateBlockingResult, 'model' | 'provider'>,
    momentName: string,
    blueprintMomentActions: Array<{ roleName: string; actionText: string }>,
    inputSubjects: SubjectInput[],
    inputCameras: CameraInput[],
    telemetry?: BlockingGuardrailTelemetry,
  ): void {
    const isProcessional = BlockingDirectorService.isProcessionalMoment(
      momentName,
      blueprintMomentActions,
    );
    const movingNames = new Set(
      inputSubjects
        .filter((s) => this.isMovingCeremonySubject(s, momentName, blueprintMomentActions))
        .map((s) => s.name),
    );
    const cameraById = new Map(inputCameras.map((c) => [c.cameraPositionId, c]));

    parsed.cameras = parsed.cameras.map((cam) => {
      const input = cameraById.get(cam.cameraPositionId);
      const editorialCap = subjectCapForEditorialShotType(input?.shotType);
      const visibleInFov = this.subjectNamesInCameraFov(cam, parsed.subjects, input?.fovAngle);

      let names = cam.subjectNames.filter((name) => visibleInFov.includes(name));
      if (isProcessional && movingNames.size > 0) {
        names = names.filter((name) => movingNames.has(name));
      }

      const inputSubjectByName = new Map(inputSubjects.map((s) => [s.name.toLowerCase(), s]));
      const visiblePool = (isProcessional && movingNames.size > 0
        ? visibleInFov.filter((name) => movingNames.has(name))
        : visibleInFov
      ).filter((name) => {
        const subject = inputSubjectByName.get(name.toLowerCase());
        return !subject?.isFixedContextGroup;
      });

      if (names.length === 0) {
        names = visiblePool.slice(0, Number.isFinite(editorialCap) ? editorialCap : visiblePool.length);
        if (names.length > 0) {
          telemetry?.notices.push(
            `Camera "${cam.label}" filled empty targets with visible subjects: ${names.join(', ')}.`,
          );
        }
      }

      const capped = this.capSubjectsByShot(
        names,
        { x: cam.x, y: cam.y, fovAngle: input?.fovAngle },
        inputSubjects,
        input?.shotType,
        telemetry,
      );

      return { ...cam, subjectNames: capped };
    });
  }

  /**
   * Write package-scoped blocking results: position overrides for subjects
   * and cameras on the floor plan, plus AI-authored moment metadata on
   * `PackageActivityMoment` (description, duration, per-subject actions,
   * and the camera→subject targeting plan consumed by `packageFilmLinker`).
   */
  private async writePackageMomentResults(
    packageMomentId: number,
    spaceSlotId: number,
    momentName: string,
    results: Omit<GenerateBlockingResult, 'model' | 'provider'>,
    cameraInputs: CameraInput[],
    runLog: AiDirectorLogger,
    options: { isBlueprintMode: boolean },
  ): Promise<void> {
    const cameraFovMap = new Map(
      cameraInputs.map((c) => [c.label.toLowerCase(), c.fovAngle]),
    );
    const cameraUnmannedMap = new Map(
      cameraInputs.map((c) => [c.label.toLowerCase(), c.isUnmanned]),
    );

    // Camera targeting plan consumed by packageFilmLinker.
    const cameraSubjectPlan: Record<string, string[]> = {};
    for (const c of results.cameras) {
      cameraSubjectPlan[c.label] = c.subjectNames;
    }

    await this.prisma.$transaction(async (tx) => {
      // A. Package metadata ownership:
      // - blueprint mode: preserve Day Designer narrative fields; persist seeded
      //   subject poses and camera targeting.
      // - full mode: keep legacy behavior.
      if (options.isBlueprintMode) {
        await tx.packageActivityMoment.update({
          where: { id: packageMomentId },
          data: {
            camera_subject_plan: cameraSubjectPlan,
          },
        });
        runLog.log(
          'WRITE',
          `A. Blueprint mode: preserved description/duration/actions; updated camera_subject_plan for ${Object.keys(cameraSubjectPlan).length} camera(s)`,
        );

        // B. Subject position overrides — blueprint placements are fixed; persist
        // the seeded layout so the spatial tab renders the full cast per moment.
        for (const r of results.subjects) {
          await tx.spaceSlotMomentSubject.upsert({
            where: {
              subject_position_id_moment_id: {
                subject_position_id: r.positionId,
                moment_id: packageMomentId,
              },
            },
            create: {
              subject_position_id: r.positionId,
              moment_id: packageMomentId,
              x: r.x,
              y: r.y,
              rotation: r.rotation,
              seated: r.seated ?? undefined,
              present: true,
            },
            update: {
              x: r.x,
              y: r.y,
              rotation: r.rotation,
              ...(r.seated !== undefined ? { seated: r.seated } : {}),
              present: true,
            },
          });
          runLog.log('WRITE', `B. Blueprint subject override upserted: "${r.name}" → (${r.x},${r.y})@${r.rotation}°`);
        }
      } else {
        const subjectActions: Record<string, string> = {};
        for (const s of results.subjects) {
          if (s.actionDescription) subjectActions[s.name] = s.actionDescription;
        }
        await tx.packageActivityMoment.update({
          where: { id: packageMomentId },
          data: {
            description: results.momentDescription || undefined,
            duration_seconds: results.durationSeconds,
            subject_actions: subjectActions,
            camera_subject_plan: cameraSubjectPlan,
          },
        });
        runLog.log('WRITE', `A. PackageActivityMoment updated: description="${(results.momentDescription || '').slice(0, 60)}...", duration=${results.durationSeconds}s, cameras=${Object.keys(cameraSubjectPlan).length}, subjects=${Object.keys(subjectActions).length}`);

        // B. Subject position overrides (full mode only)
        for (const r of results.subjects) {
          await tx.spaceSlotMomentSubject.upsert({
            where: {
              subject_position_id_moment_id: {
                subject_position_id: r.positionId,
                moment_id: packageMomentId,
              },
            },
            create: {
              subject_position_id: r.positionId,
              moment_id: packageMomentId,
              x: r.x, y: r.y, rotation: r.rotation,
              seated: r.seated ?? undefined,
            },
            update: {
              x: r.x, y: r.y, rotation: r.rotation,
              ...(r.seated !== undefined ? { seated: r.seated } : {}),
            },
          });
          runLog.log('WRITE', `B. Subject override upserted: "${r.name}" → (${r.x},${r.y})@${r.rotation}°`);
        }
      }

      // C. Camera position overrides (unmanned cameras stay on base pose)
      for (const c of results.cameras) {
        const isUnmanned = cameraUnmannedMap.get(c.label.toLowerCase()) ?? false;
        if (isUnmanned) {
          await tx.spaceSlotMomentCamera.deleteMany({
            where: { camera_position_id: c.cameraPositionId, moment_id: packageMomentId },
          });
          runLog.log('WRITE', `C. Camera LOCKED-OFF: "${c.label}" — using base pose`);
          continue;
        }
        // Prefer the FOV validated by postProcessCameras (it may have been
        // widened so every assigned subject fits in frame).
        const effectiveFov = c.fovAngle ?? cameraFovMap.get(c.label.toLowerCase()) ?? null;
        await tx.spaceSlotMomentCamera.upsert({
          where: {
            camera_position_id_moment_id: {
              camera_position_id: c.cameraPositionId,
              moment_id: packageMomentId,
            },
          },
          create: {
            camera_position_id: c.cameraPositionId,
            moment_id: packageMomentId,
            x: c.x, y: c.y, rotation: c.rotation,
            fov_angle: effectiveFov,
          },
          update: {
            x: c.x, y: c.y, rotation: c.rotation,
            fov_angle: effectiveFov,
          },
        });
        runLog.log('WRITE', `C. Camera override upserted: "${c.label}" → (${c.x},${c.y})@${c.rotation}°`);
      }
      // D. Standing group seated=false override only in full mode.
      if (!options.isBlueprintMode) {
        const isStanding = BlockingDirectorService.isStandingMoment(momentName);
        if (isStanding) {
          const groupPositions = await tx.spaceSlotSubjectPosition.findMany({
            where: {
              package_space_slot_id: spaceSlotId,
              day_subject: { count: { gt: 1 } },
            },
            select: { id: true, label: true, x: true, y: true },
          });
          for (const pos of groupPositions) {
            await tx.spaceSlotMomentSubject.upsert({
              where: {
                subject_position_id_moment_id: {
                  subject_position_id: pos.id,
                  moment_id: packageMomentId,
                },
              },
              create: {
                subject_position_id: pos.id,
                moment_id: packageMomentId,
                x: pos.x,
                y: pos.y,
                rotation: 0,
                seated: false,
              },
              update: { seated: false },
            });
            runLog.log('WRITE', `D. Standing override: "${pos.label ?? pos.id}" seated=false (moment="${momentName}")`);
          }
          if (groupPositions.length > 0) {
            runLog.log('WRITE', `D. Applied seated=false to ${groupPositions.length} group subject position(s) for standing moment "${momentName}"`);
          }
        }
      }
    });
    runLog.log('WRITE', 'Package-level transaction committed');
  }

  // ─── Prompt building ───────────────────────────────────────────────

  private buildUserMessage(ctx: {
    momentName: string;
    activityName: string;
    activityDescription?: string;
    momentDescription?: string;
    momentNotes?: string;
    currentDurationSeconds?: number;
    floorplanObjects: FloorplanObject[];
    subjects: SubjectInput[];
    cameras: CameraInput[];
    zones: ZoneInput[];
    anchors?: SandboxRoomAnchorSpec[];
    sceneMoments?: { id: number; name: string; description: string | null; duration: number | null; order_index: number }[];
    currentMomentIndex?: number;
    isBlueprintMode?: boolean;
    blueprintMomentActions?: Array<{ roleName: string; actionText: string }>;
  }): string {
    const lines: string[] = [];
    const floorplanObjects = ctx.floorplanObjects.slice(0, 18);
    const clippedObjects = ctx.floorplanObjects.length - floorplanObjects.length;
    const subjectsForHints = ctx.subjects.length > 10 ? ctx.subjects.slice(0, 8) : ctx.subjects;
    const clippedSubjectsForHints = ctx.subjects.length - subjectsForHints.length;

    lines.push(`Moment: ${ctx.momentName}`);
    lines.push(`Activity: ${ctx.activityName}`);
    if (ctx.activityDescription) lines.push(`Activity context: ${ctx.activityDescription}`);
    if (ctx.momentDescription) lines.push(`Moment description: ${ctx.momentDescription}`);
    if (ctx.momentNotes) lines.push(`Moment notes: ${ctx.momentNotes}`);
    if (ctx.currentDurationSeconds) {
      lines.push(`Current template duration: ${ctx.currentDurationSeconds}s (override this if your estimate differs based on what happens in this moment)`);
    }

    // Scene timeline — so the AI knows what comes before and after this moment
    if (ctx.sceneMoments && ctx.sceneMoments.length > 1) {
      lines.push('');
      lines.push('SCENE TIMELINE (all moments in order — you are planning the one marked >>>):');
      for (const m of ctx.sceneMoments) {
        const isCurrent = m.order_index === ctx.currentMomentIndex;
        const marker = isCurrent ? '>>> ' : '    ';
        const desc = m.description ? ` — ${m.description}` : '';
        const dur = m.duration ? ` (${m.duration}s)` : '';
        lines.push(`${marker}${m.order_index + 1}. ${m.name}${dur}${desc}`);
      }
      lines.push('Use this timeline to understand WHERE this moment falls in the ceremony narrative.');
      lines.push('Plan blocking that reflects what is ACTUALLY happening at this specific point — not assumptions about the moment name alone.');
    }

    // Zones — semantic areas of the venue
    if (ctx.zones.length > 0) {
      lines.push('');
      lines.push('Named zones (semantic areas — place subjects within the correct zone):');
      for (const z of ctx.zones) {
        const desc = z.description ? ` — ${z.description}` : '';
        const bounds = z.polygon.map((p) => `(${Math.round(p.x)},${Math.round(p.y)})`).join(', ');
        lines.push(`  - "${z.label}" [${z.name}]${desc}  bounds: [${bounds}]`);
      }
    }

    // Anchors — precise landmark coordinates the skill instructs the AI to snap to
    if (ctx.anchors && ctx.anchors.length > 0) {
      lines.push('');
      lines.push('Named anchors (snap subjects to these exact landmark coordinates where appropriate):');
      for (const a of ctx.anchors) {
        lines.push(`  - ${a.name} "${a.label}" at (${a.x}, ${a.y}), suggested facing ${a.rotation}°`);
      }
    }

    lines.push('');
    lines.push('Floorplan objects:');
    if (ctx.floorplanObjects.length === 0) {
      lines.push('  (empty room — use reasonable defaults for a wedding venue)');
    }
    for (const obj of floorplanObjects) {
      const label = obj.label ? ` "${obj.label}"` : '';
      const meta = obj.metadata && typeof obj.metadata === 'object'
        ? Object.entries(obj.metadata)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
            .join(', ')
        : '';
      const metaStr = meta ? ` { ${meta} }` : '';
      lines.push(`  - ${obj.type}${label} at (${Math.round(obj.x)}, ${Math.round(obj.y)}), size ${Math.round(obj.width)}x${Math.round(obj.height)}${metaStr}`);
    }
    if (clippedObjects > 0) {
      lines.push(`  - ... ${clippedObjects} additional objects omitted for prompt budget.`);
    }

    lines.push('');
    lines.push('Subjects (with previous positions):');
    for (const s of ctx.subjects) {
      const role = s.role ? ` (${s.role})` : '';
      const group = s.isGroup ? ` [GROUP, count=${s.count}]` : '';
      const fixed = s.isFixedContextGroup
        ? ' [FIXED CONTEXT GROUP — keep in its current crowd area; use for atmosphere, action text, and camera targeting only]'
        : '';
      const binding = s.boundTo ? `, bound to "${s.boundTo}"` : '';
      const seatedTag = s.prevSeated ? ', previously SEATED' : ', previously STANDING';
      const visual = this.roleToVisual(s.role || s.name, s.isGroup);
      lines.push(`  - "${s.name}"${role}${group}${fixed} — prev: (${Math.round(s.prevX)}, ${Math.round(s.prevY)}), facing ${Math.round(s.prevRotation)}°${seatedTag}${binding}`);
      lines.push(`    visualAppearance: "${visual}"`);
    }

    if (ctx.subjects.some((s) => s.isFixedContextGroup)) {
      lines.push('');
      lines.push('Fixed context group rule: keep large crowd groups in their existing seating/crowd area.');
      lines.push('Do not relocate them into the aisle or altar. You may still mention them in actionDescription and camera subjectNames when editorially useful.');
    }

    if (ctx.isBlueprintMode) {
      lines.push('');
      lines.push('BLUEPRINT PACKAGE MODE: Subject positions were authored in Day Designer and are FIXED.');
      lines.push('Return the exact same x, y, and rotation for every subject as the "prev" values above — do not move subjects.');
      lines.push('Your task is camera placement and camera subjectNames only.');
      if (ctx.blueprintMomentActions && ctx.blueprintMomentActions.length > 0) {
        lines.push('');
        lines.push('Authoritative subject actions (from Day Designer — use for camera framing and subjectNames):');
        for (const action of ctx.blueprintMomentActions) {
          lines.push(`  - ${action.roleName}: ${action.actionText}`);
        }
      }
    }

    lines.push('');
    lines.push('Cameras (with previous positions):');
    if (ctx.cameras.length === 0) {
      lines.push('  (no cameras placed yet — suggest optimal positions)');
    }

    // Compute subject centroid for distance reference
    const subCentroidX = ctx.subjects.length > 0
      ? ctx.subjects.reduce((s, sub) => s + sub.prevX, 0) / ctx.subjects.length : 500;
    const subCentroidY = ctx.subjects.length > 0
      ? ctx.subjects.reduce((s, sub) => s + sub.prevY, 0) / ctx.subjects.length : 500;

    for (const c of ctx.cameras) {
      const fov = c.fovAngle ? `, FOV ${Math.round(c.fovAngle)}°` : '';
      const distToSubjects = Math.round(Math.hypot(c.prevX - subCentroidX, c.prevY - subCentroidY));
      const distHint = distToSubjects < 180 ? 'CLOSE — use CLOSE_UP or MEDIUM_SHOT'
        : distToSubjects < 300 ? 'MODERATE — use MEDIUM_SHOT or REACTION_SHOT'
        : 'FAR — use WIDE_SHOT or ESTABLISHING_SHOT';
      const rig = c.isUnmanned
        ? ' [UNMANNED / LOCKED-OFF — MUST stay at this exact x/y/rotation for every moment]'
        : ' [operated by crew]';
      lines.push(`  - "${c.label}"${rig} — prev: (${Math.round(c.prevX)}, ${Math.round(c.prevY)}), facing ${Math.round(c.prevRotation)}°${fov}`);
      lines.push(`    Distance to subject centroid: ${distToSubjects} units → ${distHint}`);

      // Compute spatial hints: where each subject appears relative to this camera
      const spatialHints = this.computeSpatialHints(c, subjectsForHints);
      if (spatialHints.length > 0) {
        lines.push(`    Spatial hints (subjects relative to this camera's view):`);
        for (const hint of spatialHints) {
          lines.push(`      - ${hint.name}: ${hint.position} (${hint.distance})`);
        }
        if (clippedSubjectsForHints > 0) {
          lines.push(`      - ... ${clippedSubjectsForHints} additional subjects omitted for prompt budget.`);
        }
      }
    }

    lines.push(this.buildSchemaReminder(ctx.cameras));

    return lines.join('\n');
  }

  private selectSystemPrompt(userMessageChars: number): string {
    const estimatedPromptTokens = Math.round((this.systemPrompt.length + userMessageChars) / 4);
    // Keep headroom below 4096 token local context limits.
    if (estimatedPromptTokens > 3400) {
      this.logger.warn(
        `Blocking prompt estimated ${estimatedPromptTokens} tokens; switching to compact system prompt`,
      );
      return BlockingDirectorService.COMPACT_SYSTEM_PROMPT;
    }
    return this.systemPrompt;
  }

  /**
   * Enforce a minimum 40px separation between all subject pairs.
   * Uses an iterative push-apart approach (up to 10 passes) so clusters
   * of 3+ subjects spread out correctly rather than just oscillating.
   */
  private enforceSubjectSeparation(subjects: SubjectBlockingResult[]): void {
    const MIN_SEP = 40;
    const MAX_PASSES = 10;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      let moved = false;
      for (let i = 0; i < subjects.length; i++) {
        for (let j = i + 1; j < subjects.length; j++) {
          const a = subjects[i];
          const b = subjects[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MIN_SEP && dist > 0) {
            const overlap = (MIN_SEP - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x = this.clamp(a.x - nx * overlap, 0, 1000);
            a.y = this.clamp(a.y - ny * overlap, 0, 1000);
            b.x = this.clamp(b.x + nx * overlap, 0, 1000);
            b.y = this.clamp(b.y + ny * overlap, 0, 1000);
            moved = true;
          } else if (dist === 0) {
            // Perfectly coincident — nudge b diagonally
            b.x = this.clamp(b.x + MIN_SEP * 0.707, 0, 1000);
            b.y = this.clamp(b.y + MIN_SEP * 0.707, 0, 1000);
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  }

  /**
   * Enforce maximum subject-count rules based on camera-to-subject distance.
   * When the AI returns more subjects than a shot type allows, keep only the
   * first N (which are typically the most important as the AI lists them in
   * priority order) and log a warning.
   */
  private capSubjectsByShot(
    subjectNames: string[],
    cameraPos: { x: number; y: number; fovAngle?: number | null },
    inputSubjects: SubjectInput[],
    editorialShotType: string | null | undefined,
    telemetry?: BlockingGuardrailTelemetry,
  ): string[] {
    const namedSubjects = inputSubjects.filter((s) => subjectNames.includes(s.name));
    const focalNamed = namedSubjects.filter((s) => !s.isFixedContextGroup);
    const distancePool = focalNamed.length > 0 ? focalNamed : namedSubjects;
    const distances = distancePool.map((s) =>
      Math.hypot(s.prevX - cameraPos.x, s.prevY - cameraPos.y),
    );
    const { shotType: inferredShotType, cap: distanceCap } = subjectCapForDistances(
      distances.length > 0 ? distances : [500],
      cameraPos.fovAngle,
    );
    const editorialCap = subjectCapForEditorialShotType(editorialShotType);
    const cap = Number.isFinite(editorialCap)
      ? Math.min(editorialCap, distanceCap)
      : distanceCap;

    if (subjectNames.length > cap) {
      const editorialLabel = editorialShotType?.replace(/_/g, ' ').toLowerCase() ?? 'editorial';
      const message =
        `Camera framing implies ${inferredShotType.replace(/_/g, ' ').toLowerCase()} and ` +
        `${editorialLabel} allows max ${cap} subject(s), so ` +
        `${subjectNames.length} assigned subjects were trimmed: ${subjectNames.join(', ')}.`;
      this.logger.warn(
        `Camera at (${Math.round(cameraPos.x)},${Math.round(cameraPos.y)}) ` +
          `→ cap ${cap} (${editorialLabel} + ${inferredShotType}) but AI returned ${subjectNames.length} ` +
          `([${subjectNames.join(', ')}]). Capping to first ${cap}.`,
      );
      telemetry?.notices.push(message);
      if (telemetry) {
        telemetry.cappedCameraCount += 1;
      }
      return subjectNames.slice(0, cap);
    }
    return subjectNames;
  }

  /**
   * Build the closing reminder appended to every user message.
   * Placed last so it is closest to the generation start — highest influence.
   */
  private buildSchemaReminder(cameras: CameraInput[]): string {
    const labels = cameras.map((c) => `"${c.label}"`).join(', ');
    return [
      '',
      '---',
      'OUTPUT RULES (read before generating):',
      '1. Return ONLY a single JSON object — no markdown, no prose outside the JSON.',
      '2. The JSON MUST have exactly two arrays: "subjects" and "cameras".',
      `3. Camera entries (${labels}) go ONLY in the "cameras" array — NEVER inside "subjects".`,
      '4. Subject entries go ONLY in the "subjects" array — they have name/x/y/rotation/seated/actionDescription.',
      '5. Camera entries have label/x/y/rotation/subjectNames — subject entries do NOT have a "label" or "subjectNames" field.',
      '6. Subjects marked FIXED CONTEXT GROUP must keep their existing crowd-area position; do not move them into the aisle or altar.',
      '7. Subject caps per shot type: close-up/detail/insert = 1; two-shot/reaction/over-shoulder = 2; medium = 3; wide/establishing/master = up to 8. Never exceed the cap for the intended shot.',
      'Start your response with { and end it with }.',
    ].join('\n');
  }

  /**
   * Map a role name to a visual appearance description for SD prompts.
   */
  private roleToVisual(roleName: string, isGroup: boolean): string {
    const lower = roleName.toLowerCase().trim();
    const map: Record<string, string> = {
      'bride': 'young woman in elegant white wedding dress and veil',
      'groom': 'young man in formal dark suit and tie with boutonniere',
      'officiant': 'older man in dark clerical robes',
      'registrar': 'man in formal dark suit at podium with documents',
      'best man': 'young man in formal suit standing beside groom',
      'maid of honor': 'young woman in elegant bridesmaid dress',
      'father of bride': 'distinguished older man in formal suit',
      'father of groom': 'distinguished older man in formal suit',
      'mother of bride': 'elegant older woman in formal dress',
      'mother of groom': 'elegant older woman in formal dress',
      'flower girl': 'young girl in white dress holding flower basket',
      'ring bearer': 'young boy in small suit carrying ring pillow',
      'bridesmaids': 'group of women in matching elegant dresses',
      'groomsmen': 'group of men in matching formal suits',
      'guests': 'well-dressed wedding guests in formal attire',
    };
    const desc = map[lower];
    if (desc) return desc;
    return isGroup ? `group of ${lower}` : lower;
  }

  /**
   * Compute where each subject appears relative to a camera's viewpoint.
   * Returns spatial hints like "center-left, close" for use in SD prompts.
   */
  private computeSpatialHints(
    camera: CameraInput,
    subjects: SubjectInput[],
  ): Array<{ name: string; position: string; distance: string }> {
    const hints: Array<{ name: string; position: string; distance: string }> = [];
    const rotRad = (camera.prevRotation * Math.PI) / 180;

    // Camera forward = (sin(rot), -cos(rot)), right = (cos(rot), sin(rot))
    const fwdX = Math.sin(rotRad);
    const fwdY = -Math.cos(rotRad);
    const rightX = Math.cos(rotRad);
    const rightY = Math.sin(rotRad);

    for (const s of subjects) {
      const dx = s.prevX - camera.prevX;
      const dy = s.prevY - camera.prevY;

      // Project onto camera axes
      const depth = dx * fwdX + dy * fwdY;
      const lateral = dx * rightX + dy * rightY;

      // Skip subjects behind the camera
      if (depth < 10) continue;

      // Lateral position in frame
      const lateralRatio = lateral / depth;
      let hPos: string;
      if (lateralRatio < -0.5) hPos = 'far left';
      else if (lateralRatio < -0.15) hPos = 'left side';
      else if (lateralRatio <= 0.15) hPos = 'center frame';
      else if (lateralRatio <= 0.5) hPos = 'right side';
      else hPos = 'far right';

      // Distance category
      const dist = Math.hypot(dx, dy);
      let distLabel: string;
      if (dist < 120) distLabel = 'very close / foreground';
      else if (dist < 250) distLabel = 'near / mid-ground';
      else if (dist < 450) distLabel = 'medium distance';
      else distLabel = 'far / background';

      hints.push({ name: s.name, position: hPos, distance: distLabel });
    }

    return hints;
  }

  // ─── Response parsing ──────────────────────────────────────────────

  private parseResponse(
    raw: string,
    inputSubjects: SubjectInput[],
    inputCameras: CameraInput[],
  ): Omit<GenerateBlockingResult, 'model' | 'provider'> {
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    // Strip markdown fences that weren't closed (truncated response)
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '');
    }

    let parsed: AiResponse;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Attempt to repair truncated JSON — close open arrays/objects
      const repaired = this.repairTruncatedJson(jsonStr);
      if (!repaired) {
        this.logger.error(`Failed to parse AI response: ${raw.slice(0, 500)}`);
        throw new Error('AI returned invalid JSON — try again');
      }
      parsed = repaired;
      this.logger.warn('Repaired truncated AI JSON response');
    }

    // Parse subjects
    const subjectMap = new Map(inputSubjects.map((s) => [s.name.toLowerCase(), s]));
    const cameraMap = new Map(inputCameras.map((c) => [c.label.toLowerCase(), c]));
    const rawSubjectRows = Array.isArray(parsed.subjects)
      ? parsed.subjects as Array<AiSubjectResult | AiMisplacedCameraResult>
      : [];
    const recoveredCameraRows: AiCameraResult[] = [];
    const subjectRows: AiSubjectResult[] = [];

    for (const row of rawSubjectRows) {
      const recovered = this.recoverMisplacedCameraRow(row, cameraMap, inputCameras);
      if (recovered) {
        recoveredCameraRows.push(recovered);
        this.logger.warn(
          `Recovered camera "${recovered.label}" from AI subjects array; coercing it into the camera plan.`,
        );
        continue;
      }
      subjectRows.push(row as AiSubjectResult);
    }

    const droppedSubjectNames: string[] = [];
    const subjects: SubjectBlockingResult[] = subjectRows
      .map((r) => {
        const input = subjectMap.get(r.name?.toLowerCase());
        if (!input) {
          if (r?.name) droppedSubjectNames.push(String(r.name));
          return null;
        }
        const keepBasePosition = input.isFixedContextGroup;
        return {
          name: r.name,
          x: keepBasePosition ? input.prevX : this.clamp(r.x, 0, 1000),
          y: keepBasePosition ? input.prevY : this.clamp(r.y, 0, 1000),
          rotation: keepBasePosition ? input.prevRotation : this.clamp(r.rotation, 0, 360) % 360,
          seated: typeof r.seated === 'boolean' ? r.seated : undefined,
          actionDescription: (r.actionDescription || '').slice(0, 500),
          positionId: input.positionId,
          daySubjectId: input.daySubjectId,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (droppedSubjectNames.length > 0) {
      const unexpected = droppedSubjectNames.filter((n) => !subjectMap.has(n.toLowerCase()));
      if (unexpected.length > 0) {
        this.logger.warn(
          `AI blocking dropped ${unexpected.length} unknown subject(s): ${unexpected.join(', ')}. ` +
            `Known: ${inputSubjects.map((s) => s.name).join(', ')}.`,
        );
      }
    }
    // Warn about any input subjects the AI omitted entirely.
    const returnedNames = new Set(subjects.map((s) => s.name.toLowerCase()));
    const missing = inputSubjects.filter((s) => !returnedNames.has(s.name.toLowerCase()));
    const missingFixedContext = missing.filter((s) => s.isFixedContextGroup);
    if (missingFixedContext.length > 0) {
      for (const subject of missingFixedContext) {
        subjects.push({
          name: subject.name,
          x: subject.prevX,
          y: subject.prevY,
          rotation: ((subject.prevRotation % 360) + 360) % 360,
          seated: subject.prevSeated,
          actionDescription: '',
          positionId: subject.positionId,
          daySubjectId: subject.daySubjectId,
        });
      }
      this.logger.debug(
        `AI blocking omitted ${missingFixedContext.length} fixed context group(s): ` +
          `${missingFixedContext.map((s) => s.name).join(', ')}. Reusing base crowd positions.`,
      );
    }
    // Synthesize any movable subject the AI omitted at its previous position
    // so moments never render with absent subjects.
    const missingMovable = missing.filter((s) => !s.isFixedContextGroup);
    if (missingMovable.length > 0) {
      for (const subject of missingMovable) {
        subjects.push({
          name: subject.name,
          x: subject.prevX,
          y: subject.prevY,
          rotation: ((subject.prevRotation % 360) + 360) % 360,
          seated: subject.prevSeated,
          actionDescription: '',
          positionId: subject.positionId,
          daySubjectId: subject.daySubjectId,
        });
      }
      this.logger.warn(
        `AI blocking omitted ${missingMovable.length} input subject(s): ${missingMovable.map((s) => s.name).join(', ')}. ` +
          `Synthesized them at their previous positions.`,
      );
    }

    // Post-process: push apart subjects that are too close together.
    // Minimum distance between any two subject centroids is 40px (enough to be
    // visually distinct on a 1000x1000 canvas without moving them far).
    this.enforceSubjectSeparation(subjects);

    // Parse cameras
    // Labels must match inputs exactly (case-insensitive). No index fallback:
    // cameras are numbered identities, not ordered positions — falling back by index
    // silently reassigns AI output to the wrong physical camera.
    const rawCameraRows = Array.isArray(parsed.cameras) ? parsed.cameras : [];
    const cameraResults: CameraBlockingResult[] = [...rawCameraRows, ...recoveredCameraRows]
      .map((r) => {
        const rawLabel = this.getCameraLabel(r);
        if (!rawLabel) {
          this.logger.error('AI returned a camera row without a label/name. Dropping.');
          return null;
        }

        const match = this.resolveInputCamera(rawLabel, cameraMap, inputCameras);
        const input = match.input;
        if (!input) {
          this.logger.error(
            `Camera label "${rawLabel}" from AI does not match any input camera ` +
              `(${inputCameras.map((c) => c.label).join(', ')}) and no fuzzy match was found. Dropping.`,
          );
          return null;
        }
        if (match.method === 'fuzzy') {
          this.logger.warn(
            `Camera label "${rawLabel}" from AI fuzzy-matched to input "${input.label}".`,
          );
        }
        // Unmanned / locked-off cameras are physically fixed — ignore any
        // position the AI proposed and pin them to the track-level base
        // pose so the shot stays consistent across every moment.
        const locked = input.isUnmanned;
        const rawX = this.clamp(r.x, 0, 1000);
        const rawY = this.clamp(r.y, 0, 1000);
        const rawRot = this.clamp(r.rotation, 0, 360) % 360;
        if (locked) {
          const movedDist = Math.hypot(rawX - input.baseX, rawY - input.baseY);
          const rotDelta = Math.abs(((rawRot - input.baseRotation + 540) % 360) - 180);
          if (movedDist > 20 || rotDelta > 10) {
            this.logger.warn(
              `Unmanned camera "${input.label}" AI proposed (${rawX},${rawY})@${rawRot}° ` +
                `but base is (${input.baseX},${input.baseY})@${input.baseRotation}° ` +
                `(moved ${Math.round(movedDist)} units, rotated ${Math.round(rotDelta)}°). ` +
                `Pinning to base pose.`,
            );
          }
        }
        return {
          label: input.label,  // Always use the INPUT label (matches track names)
          x: locked ? input.baseX : rawX,
          y: locked ? input.baseY : rawY,
          rotation: locked
            ? ((input.baseRotation % 360) + 360) % 360
            : rawRot,
          subjectNames: Array.isArray(r.subjectNames)
            ? r.subjectNames.filter((name): name is string => typeof name === 'string')
            : [],
          cameraPositionId: input.cameraPositionId,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    this.logger.log(
      `parseResponse: ${cameraResults.length} cameras parsed from AI output. ` +
      `AI labels: ${(parsed.cameras || []).map((c: any) => c.label).join(', ')} → ` +
      `Matched labels: ${cameraResults.map(c => c.label).join(', ')}`,
    );

    return {
      momentDescription: (parsed.momentDescription || '').slice(0, 1000),
      durationSeconds: this.clamp(parsed.durationSeconds, 5, 600),
      subjects,
      cameras: cameraResults,
    };
  }

  private applyBlockingGuardrails(
    parsed: Omit<GenerateBlockingResult, 'model' | 'provider'>,
    inputSubjects: SubjectInput[],
    inputCameras: CameraInput[],
    zones: ZoneInput[],
    floorplanObjects: FloorplanObject[] = [],
    options: { isBlueprintMode?: boolean } = {},
  ): BlockingGuardrailTelemetry {
    const telemetry: BlockingGuardrailTelemetry = {
      cappedCameraCount: 0,
      notices: [],
    };
    const cameraById = new Map(inputCameras.map((camera) => [camera.cameraPositionId, camera]));

    parsed.cameras = parsed.cameras.map((camera) => {
      const input = cameraById.get(camera.cameraPositionId);
      if (!input) return camera;

      return {
        ...camera,
        subjectNames: this.capSubjectsByShot(
          camera.subjectNames,
          { x: camera.x, y: camera.y, fovAngle: input.fovAngle },
          inputSubjects,
          input.shotType,
          telemetry,
        ),
      };
    });

    // Blueprint packages: subject positions were authored in Day Designer and
    // already collision-resolved by the placement seed — leave them fixed.
    if (!options.isBlueprintMode) {
      this.enforceZoneContainment(parsed.subjects, zones, telemetry);
      this.enforceFurnitureCollision(parsed.subjects, inputSubjects, floorplanObjects, telemetry);
    }
    // Cameras last so aiming/FOV validation sees final subject positions.
    parsed.cameras = this.postProcessCameras(parsed.cameras, parsed.subjects, inputCameras, telemetry);
    parsed.cameras = this.validateAndTrimCameraVisibility(
      parsed.cameras,
      parsed.subjects,
      inputCameras,
      inputSubjects,
      telemetry,
    );

    return telemetry;
  }

  /**
   * Push subjects out of solid furniture and enforce the minimum subject
   * separation using the shared deterministic resolver (same module the
   * placement seed and the Day Designer preview use).
   */
  private enforceFurnitureCollision(
    subjects: SubjectBlockingResult[],
    inputSubjects: SubjectInput[],
    floorplanObjects: FloorplanObject[],
    telemetry?: BlockingGuardrailTelemetry,
  ): void {
    if (subjects.length === 0) return;
    const inputByName = new Map(inputSubjects.map((s) => [s.name.toLowerCase(), s]));
    const points = subjects.map((s) => ({
      x: s.x,
      y: s.y,
      seated: s.seated ?? false,
      fixed: inputByName.get(s.name.toLowerCase())?.isFixedContextGroup ?? false,
    }));
    const rects = floorplanObjects.map((o) => ({
      object_type: o.type,
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
    }));
    const { movedCount } = resolveSpatialCollisions(points, rects);
    if (movedCount > 0) {
      const movedNames: string[] = [];
      subjects.forEach((s, i) => {
        if (s.x !== points[i].x || s.y !== points[i].y) movedNames.push(s.name);
        s.x = points[i].x;
        s.y = points[i].y;
      });
      const message = `Collision resolver nudged ${movedNames.length} subject(s) off furniture/overlaps: ${movedNames.join(', ')}.`;
      this.logger.warn(message);
      telemetry?.notices.push(message);
    }
  }

  /**
   * Final generation-time validation: assert every camera's assigned
   * subjects sit inside its FOV cone using the same projection math the
   * read-time conflict panel uses. `postProcessCameras` should make this
   * impossible to fail; if it does, log + record the notice so it surfaces
   * in the run telemetry instead of as a later conflict.
   */
  /**
   * Drop subjects outside the camera FOV cone, then re-apply editorial caps.
   * Mutates the returned camera rows so bad targets never reach persistence.
   */
  private validateAndTrimCameraVisibility(
    cameras: CameraBlockingResult[],
    subjects: SubjectBlockingResult[],
    inputCameras: CameraInput[],
    inputSubjects: SubjectInput[],
    telemetry?: BlockingGuardrailTelemetry,
  ): CameraBlockingResult[] {
    const subjectByName = new Map(subjects.map((s) => [s.name.toLowerCase(), s]));
    const cameraByLabel = new Map(inputCameras.map((c) => [c.label.toLowerCase(), c]));

    return cameras.map((cam) => {
      const input = cameraByLabel.get(cam.label.toLowerCase());
      const fov = this.clamp(cam.fovAngle ?? input?.fovAngle ?? 60, 10, 120);
      const halfFov = fov / 2;
      const distances: number[] = [];
      const inFrame: string[] = [];
      const outOfFrame: string[] = [];

      for (const name of cam.subjectNames) {
        const subject = subjectByName.get(name.toLowerCase());
        if (!subject) continue;
        const angle = angleToPointDeg(cam.x, cam.y, subject.x, subject.y);
        const dev = Math.abs(((angle - cam.rotation + 540) % 360) - 180);
        distances.push(Math.hypot(subject.x - cam.x, subject.y - cam.y));
        if (dev > halfFov) {
          outOfFrame.push(name);
        } else {
          inFrame.push(name);
        }
      }

      if (outOfFrame.length > 0) {
        const message =
          `Camera "${cam.label}" dropped ${outOfFrame.join(', ')} — outside ${Math.round(fov)}° FOV after aiming.`;
        this.logger.warn(message);
        telemetry?.notices.push(message);
      }

      const inferredShotType = input?.shotTypeLocked
        ? input?.shotType ?? null
        : inferShotTypeWithHysteresis(distances, fov, input?.shotType);
      const effectiveShotForCaps = input?.shotTypeLocked ? input?.shotType : inferredShotType;

      const capped = this.capSubjectsByShot(
        inFrame,
        { x: cam.x, y: cam.y, fovAngle: fov },
        inputSubjects,
        effectiveShotForCaps,
        telemetry,
      );

      this.logger.debug(
        `Camera "${cam.label}" validated: shot=${inferredShotType}, locked=${input?.shotTypeLocked ?? false}, fov=${Math.round(fov)}°, ` +
          `subjects in frame=${capped.length}/${cam.subjectNames.length}`,
      );

      return { ...cam, subjectNames: capped, inferredShotType };
    });
  }

  private recoverMisplacedCameraRow(
    row: AiSubjectResult | AiMisplacedCameraResult,
    cameraMap: Map<string, CameraInput>,
    inputCameras: CameraInput[],
  ): AiCameraResult | null {
    if (!('subjectNames' in row) || !Array.isArray(row.subjectNames)) {
      return null;
    }

    const rawLabel = this.getCameraLabel(row);
    if (!rawLabel) {
      return null;
    }

    const match = this.resolveInputCamera(rawLabel, cameraMap, inputCameras);
    if (!match.input) {
      return null;
    }

    return {
      label: rawLabel,
      x: this.clamp(row.x, 0, 1000),
      y: this.clamp(row.y, 0, 1000),
      rotation: this.clamp(row.rotation, 0, 360) % 360,
      subjectNames: row.subjectNames.filter((name): name is string => typeof name === 'string'),
    };
  }

  private getCameraLabel(row: Partial<AiCameraResult> & Partial<AiMisplacedCameraResult>): string | null {
    if (typeof row.label === 'string' && row.label.trim().length > 0) {
      return row.label.trim();
    }
    if (typeof row.name === 'string' && row.name.trim().length > 0) {
      return row.name.trim();
    }
    return null;
  }

  private resolveInputCamera(
    rawLabel: string,
    cameraMap: Map<string, CameraInput>,
    inputCameras: CameraInput[],
  ): { input: CameraInput | null; method: 'exact' | 'fuzzy' } {
    const exact = cameraMap.get(rawLabel.toLowerCase());
    if (exact) {
      return { input: exact, method: 'exact' };
    }

    const digits = rawLabel.match(/(\d+)/)?.[1];
    if (digits) {
      const digitMatch = inputCameras.find(
        (camera) => camera.label.match(/(\d+)/)?.[1] === digits,
      );
      if (digitMatch) {
        return { input: digitMatch, method: 'fuzzy' };
      }
    }

    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedMatch = inputCameras.find((camera) => normalize(camera.label) === normalize(rawLabel));
    return { input: normalizedMatch ?? null, method: 'fuzzy' };
  }

  // ─── Camera post-processing ────────────────────────────────────────
  // The local AI model often places cameras poorly. We deterministically
  // fix rotation to point at assigned subjects, then validate the FOV cone
  // actually contains every assigned subject (widening the FOV or pulling
  // the camera back when it does not). This is the same projection math as
  // SpatialTranslatorService, so read-time TARGET_NOT_VISIBLE conflicts
  // cannot occur for freshly generated plans.

  /** Margin (degrees) kept between a subject and the FOV cone edge. */
  private static readonly FOV_EDGE_MARGIN_DEG = 6;
  private static readonly MAX_FOV_DEG = 120;
  private static readonly PULL_BACK_STEP = 60;
  private static readonly MAX_PULL_BACK_STEPS = 6;

  private postProcessCameras(
    cameras: CameraBlockingResult[],
    subjects: SubjectBlockingResult[],
    inputCameras: CameraInput[],
    telemetry?: BlockingGuardrailTelemetry,
  ): CameraBlockingResult[] {
    if (subjects.length === 0) return cameras;

    const subjectByName = new Map(subjects.map((s) => [s.name.toLowerCase(), s]));
    const cameraByLabel = new Map(inputCameras.map((c) => [c.label.toLowerCase(), c]));

    return cameras.map((cam) => {
      // Locked-off / unmanned cameras must not be re-rotated or re-framed per moment.
      const inputCam = cameraByLabel.get(cam.label.toLowerCase());
      if (inputCam?.isUnmanned) return cam;

      // Find centroid of assigned subjects
      const assignedSubjects = cam.subjectNames
        .map((n) => subjectByName.get(n.toLowerCase()))
        .filter((s): s is SubjectBlockingResult => s != null);

      if (assignedSubjects.length === 0) {
        // No assigned subjects — point at midpoint of all subjects
        const rotation = rotationTowardPointsDeg(cam.x, cam.y, subjects);
        return { ...cam, rotation: rotation ?? cam.rotation };
      }

      const baseFov = this.clamp(inputCam?.fovAngle ?? 60, 10, BlockingDirectorService.MAX_FOV_DEG);
      const fitted = this.fitCameraToSubjects(cam.x, cam.y, assignedSubjects, baseFov);

      if (fitted.fovAngle !== baseFov || fitted.x !== cam.x || fitted.y !== cam.y) {
        const message =
          `Camera "${cam.label}" adjusted so all assigned subjects fit its field of view ` +
          `(FOV ${Math.round(baseFov)}°→${Math.round(fitted.fovAngle)}°` +
          `${fitted.x !== cam.x || fitted.y !== cam.y ? `, pulled back to (${fitted.x},${fitted.y})` : ''}).`;
        this.logger.warn(message);
        telemetry?.notices.push(message);
      }

      return {
        ...cam,
        x: fitted.x,
        y: fitted.y,
        rotation: fitted.rotation,
        fovAngle: fitted.fovAngle,
      };
    });
  }

  /**
   * Aim a camera at its subjects and guarantee every subject sits inside the
   * FOV cone (with a safety margin). Deterministic fix order:
   *   1. rotate to the subject centroid;
   *   2. widen the FOV up to MAX_FOV_DEG;
   *   3. pull the camera straight back (away from the centroid) and retry.
   */
  private fitCameraToSubjects(
    x: number,
    y: number,
    subjects: Array<{ x: number; y: number }>,
    baseFov: number,
  ): { x: number; y: number; rotation: number; fovAngle: number } {
    const margin = BlockingDirectorService.FOV_EDGE_MARGIN_DEG;

    let camX = x;
    let camY = y;
    for (let step = 0; step <= BlockingDirectorService.MAX_PULL_BACK_STEPS; step++) {
      const centroidX = subjects.reduce((s, sub) => s + sub.x, 0) / subjects.length;
      const centroidY = subjects.reduce((s, sub) => s + sub.y, 0) / subjects.length;
      const rotation = angleToPointDeg(camX, camY, centroidX, centroidY);

      // Max angular deviation of any subject from the camera facing direction.
      let maxDev = 0;
      for (const sub of subjects) {
        const angle = angleToPointDeg(camX, camY, sub.x, sub.y);
        const dev = Math.abs(((angle - rotation + 540) % 360) - 180);
        maxDev = Math.max(maxDev, dev);
      }

      const requiredFov = 2 * maxDev + 2 * margin;
      if (requiredFov <= baseFov) {
        return { x: Math.round(camX), y: Math.round(camY), rotation: Math.round(rotation) % 360, fovAngle: baseFov };
      }
      if (requiredFov <= BlockingDirectorService.MAX_FOV_DEG) {
        return {
          x: Math.round(camX),
          y: Math.round(camY),
          rotation: Math.round(rotation) % 360,
          fovAngle: Math.ceil(requiredFov),
        };
      }

      // Still too wide — pull the camera straight back from the centroid.
      const dx = camX - centroidX;
      const dy = camY - centroidY;
      const dist = Math.hypot(dx, dy) || 1;
      camX = this.clamp(camX + (dx / dist) * BlockingDirectorService.PULL_BACK_STEP, 20, 980);
      camY = this.clamp(camY + (dy / dist) * BlockingDirectorService.PULL_BACK_STEP, 20, 980);
    }

    // Bounds prevented further pull-back; cap the FOV and accept.
    const rotation = rotationTowardPointsDeg(camX, camY, subjects) ?? 0;
    return { x: Math.round(camX), y: Math.round(camY), rotation: rotation % 360, fovAngle: BlockingDirectorService.MAX_FOV_DEG };
  }

  // ─── DB writes ─────────────────────────────────────────────────────

  private async writeResults(
    sceneMomentId: number,
    packageMomentId: number | null,
    results: Omit<GenerateBlockingResult, 'model' | 'provider'>,
    cameraInputs?: CameraInput[],
    runLog?: AiDirectorLogger,
  ): Promise<void> {
    // Build lookup: camera label → base FOV angle
    const cameraFovMap = new Map(
      (cameraInputs ?? []).map((c) => [c.label.toLowerCase(), c.fovAngle]),
    );
    const cameraUnmannedMap = new Map(
      (cameraInputs ?? []).map((c) => [c.label.toLowerCase(), c.isUnmanned]),
    );

    await this.prisma.$transaction(async (tx) => {
      // A. Write moment description + duration on the SceneMoment
      await tx.sceneMoment.update({
        where: { id: sceneMomentId },
        data: {
          description: results.momentDescription || undefined,
          duration: results.durationSeconds,
        },
      });
      runLog?.log('WRITE', `A. SceneMoment updated: description="${(results.momentDescription || '').slice(0, 60)}...", duration=${results.durationSeconds}s`);

      // B. Subject positions + action descriptions
      for (const r of results.subjects) {
        if (packageMomentId) {
          await tx.spaceSlotMomentSubject.upsert({
            where: {
              subject_position_id_moment_id: {
                subject_position_id: r.positionId,
                moment_id: packageMomentId,
              },
            },
            create: {
              subject_position_id: r.positionId,
              moment_id: packageMomentId,
              x: r.x, y: r.y, rotation: r.rotation,
              seated: r.seated ?? undefined,
            },
            update: {
              x: r.x, y: r.y, rotation: r.rotation,
              ...(r.seated !== undefined ? { seated: r.seated } : {}),
            },
          });
          runLog?.log('WRITE', `B. Subject position upserted: "${r.name}" positionId=${r.positionId} → (${r.x},${r.y})@${r.rotation}°`);
        }

        if (r.daySubjectId) {
          await tx.filmSceneMomentSubject.upsert({
            where: {
              moment_id_subject_id: {
                moment_id: sceneMomentId,
                subject_id: r.daySubjectId,
              },
            },
            create: {
              moment_id: sceneMomentId,
              subject_id: r.daySubjectId,
              action_description: r.actionDescription,
            },
            update: { action_description: r.actionDescription },
          });
          runLog?.log('WRITE', `B. Action description upserted: "${r.name}" daySubjectId=${r.daySubjectId}`);
        }
      }

      // C. Camera positions
      for (const c of results.cameras) {
        // Prefer the FOV validated by postProcessCameras (may be widened so
        // every assigned subject fits in frame).
        const baseFov = c.fovAngle ?? cameraFovMap.get(c.label.toLowerCase()) ?? null;
        const isUnmanned = cameraUnmannedMap.get(c.label.toLowerCase()) ?? false;
        if (isUnmanned) {
          // Locked-off camera: the base SpaceSlotCameraPosition governs.
          // Remove any stale per-moment override so the track-level pose is
          // used consistently for every moment.
          if (packageMomentId) {
            await tx.spaceSlotMomentCamera.deleteMany({
              where: {
                camera_position_id: c.cameraPositionId,
                moment_id: packageMomentId,
              },
            });
            runLog?.log('WRITE', `C. Camera LOCKED-OFF (unmanned): "${c.label}" positionId=${c.cameraPositionId} → using base pose (no moment override)`);
          }
          continue;
        }
        if (packageMomentId) {
          await tx.spaceSlotMomentCamera.upsert({
            where: {
              camera_position_id_moment_id: {
                camera_position_id: c.cameraPositionId,
                moment_id: packageMomentId,
              },
            },
            create: {
              camera_position_id: c.cameraPositionId,
              moment_id: packageMomentId,
              x: c.x, y: c.y, rotation: c.rotation,
              fov_angle: baseFov,
            },
            update: {
              x: c.x, y: c.y, rotation: c.rotation,
              fov_angle: baseFov,
            },
          });
          runLog?.log('WRITE', `C. Camera position upserted: "${c.label}" positionId=${c.cameraPositionId} → (${c.x},${c.y})@${c.rotation}° fov=${baseFov ?? 'default'}`);
        }
      }

      // D. Shot types + subject-camera pairing on MomentRecordingSetup
      const recordingSetup = await tx.momentRecordingSetup.findUnique({
        where: { moment_id: sceneMomentId },
        include: {
          camera_assignments: {
            include: { track: { select: { name: true } } },
          },
        },
      });

      if (!recordingSetup) {
        const msg = `No MomentRecordingSetup found for sceneMomentId=${sceneMomentId} — ai_prompt will NOT be saved.`;
        this.logger.warn(msg);
        runLog?.warn('WRITE', msg);
      }

      if (recordingSetup) {
        runLog?.log('WRITE', `D. RecordingSetup ${recordingSetup.id}: ${recordingSetup.camera_assignments.length} assignments — ${recordingSetup.camera_assignments.map(a => `[${a.id}: "${a.track?.name}"]`).join(', ')}`);

        this.logger.log(
          `Found recording setup ${recordingSetup.id} with ${recordingSetup.camera_assignments.length} camera assignments: ` +
          recordingSetup.camera_assignments.map(a => `[${a.id}: track "${a.track?.name}"]`).join(', '),
        );
        this.logger.log(
          `Gemma returned ${results.cameras.length} cameras: ${results.cameras.map(c => `"${c.label}"`).join(', ')}`,
        );
        // Build lookup: subject name → PackageDaySubject ID (what the frontend expects)
        const subjectNameToDaySubjectId = new Map(
          results.subjects.map((s) => [s.name.toLowerCase(), s.daySubjectId]),
        );
        runLog?.log('WRITE', `Subject name→DaySubjectId map: ${[...subjectNameToDaySubjectId.entries()].map(([n, id]) => `"${n}"→${id}`).join(', ')}`);

        // Filter to camera-type assignments only (exclude audio tracks)
        const cameraAssignments = recordingSetup.camera_assignments
          .filter((a) => a.track?.name && !a.track.name.toLowerCase().includes('audio'))
          .sort((a, b) => (a.track?.name || '').localeCompare(b.track?.name || ''));

        // Build lookup: track name (lowercase) → camera assignment
        const trackNameToAssignment = new Map(
          cameraAssignments.map((a) => [a.track!.name.toLowerCase(), a]),
        );

        for (let camIdx = 0; camIdx < results.cameras.length; camIdx++) {
          const cam = results.cameras[camIdx];

          // Match camera to assignment by label → track name only.
          // No index fallback: cameras are numbered identities, not positions.
          const matchAssignment = trackNameToAssignment.get(cam.label.toLowerCase());
          if (!matchAssignment) {
            this.logger.error(
              `Camera "${cam.label}" has no matching track assignment (tracks: ${[...trackNameToAssignment.keys()].join(', ')}). Skipping subject_ids write.`,
            );
            runLog?.warn('WRITE', `NO MATCH for camera "${cam.label}" — skipping write`);
            continue;
          }
          const matchMethod = 'label';

          {
            runLog?.log('WRITE', `D. Camera "${cam.label}" matched (${matchMethod}) → assignment ${matchAssignment.id} (track "${matchAssignment.track?.name}")`);
            runLog?.log('WRITE', `   subjects: ${cam.subjectNames.join(', ')}`);

            // Phase F: blocking is the authoritative source of editorial
            // subject_ids for each camera assignment. Resolve Gemma subject
            // names to PackageDaySubject IDs and persist.
            const resolvedSubjectIds = cam.subjectNames
              .map((n) => subjectNameToDaySubjectId.get(n.toLowerCase()))
              .filter((id): id is number => id != null);

            const assignmentLock = (matchAssignment as CameraAssignmentShotLock).shot_type_locked === true;

            await tx.cameraSubjectAssignment.update({
              where: { id: matchAssignment.id },
              data: {
                subject_ids: resolvedSubjectIds,
                ...(!assignmentLock && cam.inferredShotType
                  ? { shot_type: cam.inferredShotType as import('@prisma/client').ShotType }
                  : {}),
              },
            });
            runLog?.log(
              'WRITE',
              `   persisted subject_ids=[${resolvedSubjectIds.join(',')}] (${resolvedSubjectIds.length}/${cam.subjectNames.length} resolved)` +
                (assignmentLock
                  ? `; shot_type locked — kept "${matchAssignment.shot_type ?? 'none'}"`
                  : cam.inferredShotType
                    ? `; shot_type="${cam.inferredShotType}"`
                    : ''),
            );

            this.logger.log(
              `Camera "${cam.label}" matched to assignment ${matchAssignment.id} (track "${matchAssignment.track?.name}") → subject_ids=[${resolvedSubjectIds.join(',')}]`,
            );
          }
        }
      }
    });
    runLog?.log('WRITE', 'Transaction committed successfully');
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  // resolvePackageMoment() was removed in Phase A. The canonical link is
  // SceneMoment.package_activity_moment_id, loaded via the `source_moment`
  // relation at the top of generateBlocking().

  /**
   * Walk backwards through all prior moments to find the last known position
   * for each subject. This prevents stale base-position fallback when a subject
   * didn't move in the immediately preceding moment.
   */
  private async loadLastKnownSubjectPositions(
    currentMomentId: number,
    slotId: number,
    activityId?: number,
  ): Promise<Map<number, { x: number; y: number; rotation: number }>> {
    if (!activityId) return new Map();
    const cur = await this.prisma.packageActivityMoment.findUnique({
      where: { id: currentMomentId },
      select: { order_index: true },
    });
    if (!cur) return new Map();

    // Get all prior moment IDs in reverse chronological order
    const priorMoments = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId, order_index: { lt: cur.order_index } },
      orderBy: { order_index: 'desc' },
      select: { id: true },
    });
    if (priorMoments.length === 0) return new Map();

    // Load ALL overrides for prior moments in one query, ordered most-recent first
    const allOverrides = await this.prisma.spaceSlotMomentSubject.findMany({
      where: {
        moment_id: { in: priorMoments.map((m) => m.id) },
        subject_position: { package_space_slot_id: slotId },
      },
      include: { moment: { select: { order_index: true } } },
      orderBy: { moment: { order_index: 'desc' } },
    });

    // For each subject position, keep only the most recent override
    const result = new Map<number, { x: number; y: number; rotation: number }>();
    for (const o of allOverrides) {
      if (!result.has(o.subject_position_id)) {
        result.set(o.subject_position_id, { x: o.x, y: o.y, rotation: o.rotation });
      }
    }
    return result;
  }

  /**
   * Walk backwards through all prior moments to find the last known position
   * for each camera.
   */
  private async loadLastKnownCameraPositions(
    currentMomentId: number,
    slotId: number,
    activityId?: number,
  ): Promise<Map<number, { x: number; y: number; rotation: number }>> {
    if (!activityId) return new Map();
    const cur = await this.prisma.packageActivityMoment.findUnique({
      where: { id: currentMomentId },
      select: { order_index: true },
    });
    if (!cur) return new Map();

    const priorMoments = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId, order_index: { lt: cur.order_index } },
      orderBy: { order_index: 'desc' },
      select: { id: true },
    });
    if (priorMoments.length === 0) return new Map();

    const allOverrides = await this.prisma.spaceSlotMomentCamera.findMany({
      where: {
        moment_id: { in: priorMoments.map((m) => m.id) },
        camera_position: { package_space_slot_id: slotId },
      },
      include: { moment: { select: { order_index: true } } },
      orderBy: { moment: { order_index: 'desc' } },
    });

    const result = new Map<number, { x: number; y: number; rotation: number }>();
    for (const o of allOverrides) {
      if (!result.has(o.camera_position_id)) {
        result.set(o.camera_position_id, { x: o.x, y: o.y, rotation: o.rotation });
      }
    }
    return result;
  }

  private clamp(val: number, min: number, max: number): number {
    if (typeof val !== 'number' || isNaN(val)) return (min + max) / 2;
    return Math.max(min, Math.min(max, val));
  }

  private normalizeRoleKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/honou?r/g, 'honor')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /** Keep only subjects authored in the blueprint moment action roster. */
  private filterSubjectsToBlueprintCast(
    subjects: SubjectInput[],
    blueprintMomentActions: Array<{ roleName: string; actionText: string }>,
  ): SubjectInput[] {
    const castKeys = new Set(
      blueprintMomentActions.map((action) => this.normalizeRoleKey(action.roleName)),
    );
    return subjects.filter((subject) => {
      const key = this.normalizeRoleKey(subject.role ?? subject.name);
      return castKeys.has(key);
    });
  }

  // ─── AI zone inference ─────────────────────────────────────────────

  /**
   * Use Gemma to infer semantic zones from a space slot's objects.
   * Called when a space slot has objects but no zones defined yet.
   * Persists SpaceSlotZone records and returns them as ZoneInput[].
   */
  async generateZonesFromObjects(slotId: number): Promise<ZoneInput[]> {
    const slot = await this.prisma.packageSpaceSlot.findUniqueOrThrow({
      where: { id: slotId },
      include: {
        objects: { orderBy: { order_index: 'asc' } },
        zones: { select: { id: true } },
        type_tags: { select: { space_type: true } },
      },
    });

    if (slot.zones.length > 0) {
      this.logger.log(`Slot ${slotId} already has ${slot.zones.length} zones — skipping`);
      return [];
    }

    if (slot.objects.length === 0) {
      this.logger.warn(`Slot ${slotId} has no objects — cannot infer zones`);
      return [];
    }

    const W = slot.canvas_width || 1000;
    const H = slot.canvas_height || 1000;
    const spaceTypes = slot.type_tags.map(t => t.space_type).join(', ') || 'UNKNOWN';
    const objectList = slot.objects
      .map(o => `- ${o.object_type} "${o.label}" at (${Math.round(o.x)},${Math.round(o.y)}) size ${Math.round(o.width)}x${Math.round(o.height)}`)
      .join('\n');

    const prompt = [
      `You are a wedding venue spatial planner. Given a floor plan's objects, define semantic zones that group them into logical areas.`,
      ``,
      `SPACE TYPE: ${spaceTypes}`,
      `CANVAS: ${W}x${H}`,
      `LABEL: ${slot.label || 'Unnamed space'}`,
      ``,
      `OBJECTS:`,
      objectList,
      ``,
      `Generate 2-6 non-overlapping rectangular zones covering the key areas. Each zone needs:`,
      `- name: snake_case machine name (e.g. altar_area, dance_floor, seating_left)`,
      `- label: human-readable display label`,
      `- description: one sentence useful for AI cinematography planning`,
      `- color: soft pastel hex colour for rendering (e.g. #E3EDE8)`,
      `- polygon: exactly 4 corner points [{x,y},...] defining a rectangle`,
      `- order_index: integer starting at 0`,
      ``,
      `All coordinates must be within 0-${W} (x) and 0-${H} (y).`,
      `Respond with JSON: { "zones": [...] }`,
    ].join('\n');

    const result = await this.gemma.chat({
      messages: [
        { role: 'system', content: 'You are a spatial layout analyst for wedding venues. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      maxTokens: 1500,
      temperature: 0.3,
      responseFormat: { type: 'json_object' },
    });

    let parsed: {
      zones: Array<{
        name: string;
        label: string;
        description: string;
        color: string;
        polygon: Array<{ x: number; y: number }>;
        order_index: number;
      }>;
    };

    try {
      parsed = JSON.parse(result.reply);
    } catch {
      this.logger.error(`Failed to parse zone inference response for slot ${slotId}`);
      return [];
    }

    if (!parsed.zones || !Array.isArray(parsed.zones) || parsed.zones.length === 0) {
      this.logger.warn(`Gemma returned no zones for slot ${slotId}`);
      return [];
    }

    const zoneInputs: ZoneInput[] = [];

    for (const z of parsed.zones) {
      const polygon = (z.polygon || []).map(p => ({
        x: Math.max(0, Math.min(W, Math.round(p.x))),
        y: Math.max(0, Math.min(H, Math.round(p.y))),
      }));
      if (polygon.length < 3) continue;

      await this.prisma.spaceSlotZone.upsert({
        where: {
          package_space_slot_id_name: { package_space_slot_id: slotId, name: z.name },
        },
        update: {
          label: z.label,
          description: z.description,
          color: z.color,
          polygon,
          order_index: z.order_index ?? 0,
        },
        create: {
          package_space_slot_id: slotId,
          name: z.name,
          label: z.label,
          description: z.description,
          color: z.color,
          polygon,
          order_index: z.order_index ?? 0,
        },
      });

      zoneInputs.push({
        name: z.name,
        label: z.label,
        description: z.description,
        polygon,
      });
    }

    this.logger.log(`Generated ${zoneInputs.length} zones from objects for slot ${slotId}`);
    return zoneInputs;
  }

  // ─── Zone containment ──────────────────────────────────────────────

  /** Map of subject roles/names → expected zone(s). Subjects not listed are unconstrained. */
  private static readonly SUBJECT_ZONE_RULES: Record<string, string[]> = {
    // Officiant walks down aisle/entrance after ceremony
    officiant: ['altar_area', 'aisle', 'entrance'],
    bride: ['altar_area', 'aisle', 'entrance'],
    groom: ['altar_area', 'aisle', 'entrance'],
    'best man': ['altar_area', 'aisle', 'right_seating', 'left_seating', 'entrance'],
    'maid of honor': ['altar_area', 'aisle', 'left_seating', 'right_seating', 'entrance'],
    'maid of honour': ['altar_area', 'aisle', 'left_seating', 'right_seating', 'entrance'],
    bridesmaids: ['altar_area', 'aisle', 'left_seating', 'entrance'],
    groomsmen: ['altar_area', 'aisle', 'right_seating', 'entrance'],
    // Flower girl and ring bearer wait in seating during guest seating moment
    'flower girl': ['altar_area', 'aisle', 'left_seating', 'right_seating', 'entrance'],
    'ring bearer': ['altar_area', 'aisle', 'right_seating', 'left_seating', 'entrance'],
    'father of bride': ['altar_area', 'aisle', 'left_seating', 'right_seating', 'entrance'],
    'mother of bride': ['altar_area', 'aisle', 'left_seating', 'right_seating', 'entrance'],
    'father of groom': ['altar_area', 'aisle', 'right_seating', 'left_seating', 'entrance'],
    'mother of groom': ['altar_area', 'aisle', 'right_seating', 'left_seating', 'entrance'],
    guests: ['left_seating', 'right_seating'],
  };

  /**
   * Tolerance in pixels added around each zone's bounding box when testing containment.
   * Prevents spurious nudges for coordinates placed by the AI just outside a zone boundary
   * due to rounding or the small gaps between adjacent zone polygons.
   * 50px covers near-boundary placements (e.g. Best Man standing 36px outside aisle x edge).
   */
  private static readonly ZONE_SNAP_TOLERANCE = 50;

  /**
   * Check that each subject is inside (or within ZONE_SNAP_TOLERANCE px of) at least one
   * of its allowed zones. If not, snap it to the nearest point INSIDE the closest zone
   * polygon (true polygon containment via the shared geometry module).
   */
  private enforceZoneContainment(
    subjects: SubjectBlockingResult[],
    zones: ZoneInput[],
    telemetry?: BlockingGuardrailTelemetry,
  ): void {
    if (zones.length === 0) return;

    const zoneByName = new Map(zones.map((z) => [z.name, z]));

    for (const subj of subjects) {
      const key = subj.name.toLowerCase();
      const allowedZoneNames = BlockingDirectorService.SUBJECT_ZONE_RULES[key];
      if (!allowedZoneNames) continue; // unconstrained

      const allowedZones = allowedZoneNames
        .map((n) => zoneByName.get(n))
        .filter((z): z is ZoneInput => z != null);
      if (allowedZones.length === 0) continue;

      // Consider the subject inside if it is within ZONE_SNAP_TOLERANCE px of any
      // allowed zone (covers inter-zone gaps and near-boundary rounding).
      const isInside = allowedZones.some((z) =>
        pointInPolygon(subj.x, subj.y, z.polygon) ||
        distanceToPolygonBBox(subj.x, subj.y, z.polygon) <= BlockingDirectorService.ZONE_SNAP_TOLERANCE,
      );

      if (!isInside) {
        // Snap to the nearest point inside the closest zone polygon rather than
        // teleporting to the centroid — keeps the subject close to where the AI intended.
        let targetZone = allowedZones[0];
        let minDist = Infinity;
        for (const z of allowedZones) {
          const c = polygonCentroid(z.polygon);
          const d = Math.hypot(subj.x - c.x, subj.y - c.y);
          if (d < minDist) {
            minDist = d;
            targetZone = z;
          }
        }
        const snapped = nearestPointInPolygon(subj.x, subj.y, targetZone.polygon);
        const message =
          `${subj.name} was snapped back into ${targetZone.name} because the AI placed them outside the allowed zone.`;
        this.logger.warn(
          `Zone correction: "${subj.name}" at (${subj.x},${subj.y}) was outside allowed zones [${allowedZoneNames.join(',')}]. Snapped into ${targetZone.name} (${snapped.x},${snapped.y}).`,
        );
        telemetry?.notices.push(message);
        subj.x = snapped.x;
        subj.y = snapped.y;
      }
    }
  }

  /**
   * Attempt to repair a truncated JSON response by closing open brackets/braces.
   * LLMs often get cut off at maxTokens mid-object. This tries to salvage
   * whatever subjects/cameras were fully serialised before the cutoff.
   */
  private repairTruncatedJson(raw: string): AiResponse | null {
    let s = raw.trim();

    // Strip trailing comma (common at truncation point)
    s = s.replace(/,\s*$/, '');

    // Try progressively closing open structures
    const closers = ['}]', '}]}', '}]}}', ']}', ']}}}'];
    for (const closer of closers) {
      try {
        const candidate = s + closer;
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === 'object' && (parsed.subjects || parsed.cameras)) {
          return parsed as AiResponse;
        }
      } catch { /* try next */ }
    }

    // More aggressive: find the last complete array element and close from there
    // Truncate to last "},\n" or "}\n" in a cameras/subjects array
    const lastCloseBrace = s.lastIndexOf('}');
    if (lastCloseBrace > 0) {
      const trimmed = s.slice(0, lastCloseBrace + 1);
      for (const closer of [']}', ']}}', ']}}}']) {
        try {
          const parsed = JSON.parse(trimmed + closer);
          if (parsed && typeof parsed === 'object') return parsed as AiResponse;
        } catch { /* try next */ }
      }
    }

    return null;
  }
}
