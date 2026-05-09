import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ShotType } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { FloorCamera, FloorSubject, FloorObject } from './spatial-translator.service';
import { GenerateShotPreviewDto } from '../../scene-preparation/dto/generate-shot-preview.dto';

@Injectable()
export class FloorplanDataService {
  private readonly logger = new Logger(FloorplanDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clamp a FOV angle to a physically plausible range.
   * Typical cinema lenses cover roughly 10° (long telephoto) to 120°
   * (ultra-wide). Anything outside is almost certainly bad data and
   * would produce nonsensical frame geometry downstream.
   */
  private clampFov(raw: number | null | undefined, source: string): number {
    const MIN = 10;
    const MAX = 120;
    const value = Number.isFinite(raw as number) ? Number(raw) : 60;
    if (value < MIN || value > MAX) {
      this.logger.warn(
        `FOV out of range (${value}\u00b0) for ${source} \u2014 clamping to [${MIN}, ${MAX}]\u00b0.`,
      );
    }
    return Math.min(MAX, Math.max(MIN, value));
  }

  /**
   * Load assignment context and subjects with action descriptions.
   * Shared by renderFrame() and previewPrompt().
   */
  async buildPromptContext(dto: GenerateShotPreviewDto) {
    const sourceType = dto.source_type || 'package';

    const ctx = await this.loadAssignmentContext(dto.camera_assignment_id, sourceType);
    const subjects = await this.loadSubjects(ctx.subjectIds, dto.film_id, sourceType);
    const subjectsWithActions = subjects.map((s) => ({
      name: s.name,
      roleName: s.roleName,
      isGroup: s.isGroup,
      actionDescription: ctx.subjectActions.get(s.name) || undefined,
    }));

    return { subjectsWithActions, subjects, ctx, sourceType };
  }

  /**
   * Load raw floorplan positions for camera + subjects so the
   * SpatialTranslator can project them into frame coordinates.
   *
   * Lookup priority (C: stable FK):
   *   1. If sceneCameraPositionId is provided, load directly via FK → SceneCameraPosition
   *   2. Fallback: legacy name-matching against SpaceSlotCameraPosition
   */
  async loadFloorplanData(
    activityId: number | undefined,
    trackName: string | undefined,
    subjectIds: number[],
    filmId: number,
    sceneCameraPositionId?: number | null,
    momentName?: string,
    sceneMomentId?: number,
  ): Promise<{ camera: FloorCamera; subjects: FloorSubject[]; objects: FloorObject[] } | null> {

    // ── Path 1: Direct FK via SceneCameraPosition (C: stable link) ──
    if (sceneCameraPositionId) {
      return this.loadFloorplanDataViaScenePosition(sceneCameraPositionId, sceneMomentId);
    }

    // ── Path 2: Legacy name-matching via SpaceSlotCameraPosition ──
    if (!activityId || !trackName) return null;

    const spaceAssignment = await this.prisma.spaceActivityAssignment.findFirst({
      where: { package_activity_id: activityId },
      include: {
        package_space_slot: {
          include: {
            camera_positions: { orderBy: { order_index: 'asc' } },
            objects: true,
          },
        },
      },
    });
    const spaceSlot = spaceAssignment?.package_space_slot;
    if (!spaceSlot?.camera_positions?.length) return null;

    // Match camera position by label → track name
    const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normTrack = normalise(trackName);
    let camPos = spaceSlot.camera_positions.find(
      (cp) => normalise(cp.label || `camera${cp.order_index + 1}`) === normTrack,
    );
    if (!camPos) {
      const trackNumber = trackName.match(/(\d+)/)?.[1];
      if (trackNumber) {
        const targetNumber = parseInt(trackNumber, 10);
        camPos = spaceSlot.camera_positions.find((cp) => {
          const labelNumber = (cp.label || `camera${cp.order_index + 1}`).match(/(\d+)/)?.[1];
          return labelNumber != null && parseInt(labelNumber, 10) === targetNumber;
        });
        if (!camPos) {
          camPos = spaceSlot.camera_positions[targetNumber - 1];
        }
      }
    }
    if (!camPos) {
      this.logger.warn(`loadFloorplanData: no camera position matched for track "${trackName}" (${spaceSlot.camera_positions.length} positions available: [${spaceSlot.camera_positions.map((cp) => cp.label || `idx${cp.order_index}`).join(', ')}])`);
      return null;
    }

    // Resolve the PackageActivityMoment ID for correct moment-specific overrides
    let pkgMomentId: number | null = null;
    if (momentName && activityId) {
      const pkgMoment = await this.prisma.packageActivityMoment.findFirst({
        where: { package_activity_id: activityId, name: momentName },
        select: { id: true },
      });
      pkgMomentId = pkgMoment?.id ?? null;
    }

    // Get the camera's moment-specific position (if overridden)
    const momentCamera = pkgMomentId
      ? await this.prisma.spaceSlotMomentCamera.findFirst({
          where: { camera_position_id: camPos.id, moment_id: pkgMomentId },
        })
      : null;
    const camX = momentCamera?.x ?? camPos.x;
    const camY = momentCamera?.y ?? camPos.y;
    const rotation = momentCamera?.rotation ?? camPos.rotation ?? 0;
    // Use actual FOV angle from spatial data instead of hardcoded 60
    const fovDegrees = this.clampFov(momentCamera?.fov_angle ?? camPos.fov_angle ?? 60, `camPos ${camPos.id}`);

    const camera: FloorCamera = { x: camX, y: camY, rotation, fovDegrees };

    // Load subject positions from the same space slot
    const subjectPositions = await this.prisma.spaceSlotSubjectPosition.findMany({
      where: { package_space_slot_id: spaceSlot.id },
      include: {
        day_subject: { select: { id: true, name: true, count: true } },
        moment_overrides: pkgMomentId
          ? { where: { moment_id: pkgMomentId }, take: 1 }
          : { take: 0 },
      },
    });

    // Deduplicate by subject name (keep first occurrence — handles duplicate
    // positions for the same role, e.g. two Officiant placements on the plan)
    const seen = new Set<string>();
    const floorSubjects: FloorSubject[] = subjectPositions
      .filter((sp) => sp.day_subject)
      // Filter out subjects explicitly marked not-present in this moment
      .filter((sp) => {
        const override = sp.moment_overrides?.[0];
        if (override && override.present === false) return false;
        return true;
      })
      .filter((sp) => {
        const name = sp.day_subject!.name;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((sp) => {
        const override = sp.moment_overrides?.[0];
        return {
          name: sp.day_subject!.name,
          x: override?.x ?? sp.x,
          y: override?.y ?? sp.y,
          rotation: override?.rotation ?? sp.rotation ?? 0,
          isGroup: (sp.day_subject!.count ?? 1) > 1,
          count: sp.day_subject!.count ?? 1,
          daySubjectId: sp.day_subject!.id,
          seated: override?.seated ?? sp.seated ?? undefined,
        };
      });

    const floorObjects: FloorObject[] = (spaceSlot.objects ?? []).map((o) => ({
      type: o.object_type,
      label: o.label ?? undefined,
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
      rotation: o.rotation,
      metadata: (o.metadata as Record<string, unknown> | null) ?? null,
    }));

    const expandedSubjects = this.expandSeatedGroupsIntoChairRows(floorSubjects, floorObjects);
    return { camera, subjects: expandedSubjects, objects: floorObjects };
  }

  /**
   * Load floor plan data via the stable SceneCameraPosition FK (C).
   * Uses the Scene/Moment position system (D: unified spatial source of truth at runtime).
   */
  async loadFloorplanDataViaScenePosition(
    sceneCameraPositionId: number,
    sceneMomentId?: number,
  ): Promise<{ camera: FloorCamera; subjects: FloorSubject[]; objects: FloorObject[] } | null> {
    // Resolve the PackageActivityMoment ID for the scene moment — package-mode
    // overrides (SpaceSlotMomentCamera/Subject) are FK'd to PackageActivityMoment,
    // not SceneMoment. Phase A: SceneMoment.package_activity_moment_id.
    let pkgMomentId: number | null = null;
    if (sceneMomentId) {
      const sceneMoment = await this.prisma.sceneMoment.findUnique({
        where: { id: sceneMomentId },
        select: { package_activity_moment_id: true },
      });
      pkgMomentId = sceneMoment?.package_activity_moment_id ?? null;
    }

    const scenePos = await this.prisma.sceneCameraPosition.findUnique({
      where: { id: sceneCameraPositionId },
      include: {
        moment_overrides: sceneMomentId
          ? { where: { moment_id: sceneMomentId }, take: 1 }
          : { take: 0 },
        source: {
          include: {
            space_slot: { include: { objects: true } },
            moment_overrides: pkgMomentId
              ? { where: { moment_id: pkgMomentId }, take: 1 }
              : { take: 0 },
          },
        },
      },
    });
    if (!scenePos) return null;

    // ── Camera position: prefer live SpaceSlotCameraPosition source + its
    // moment override over the stale SceneCameraPosition cache. The floor-plan
    // overlay writes to SpaceSlot*; the SceneCameraPosition copy is not
    // synced on drag, so reading from it would show stale positions. ──
    const spaceSlot = scenePos.source?.space_slot;
    const slotCam = scenePos.source;
    const slotMomentCam = slotCam?.moment_overrides?.[0];
    const sceneMomentCam = scenePos.moment_overrides?.[0];

    const camera: FloorCamera = slotCam
      ? {
          x: slotMomentCam?.x ?? slotCam.x,
          y: slotMomentCam?.y ?? slotCam.y,
          rotation: slotMomentCam?.rotation ?? slotCam.rotation ?? 0,
          fovDegrees: this.clampFov(
            slotMomentCam?.fov_angle ?? slotCam.fov_angle ?? scenePos.fov_angle ?? 60,
            `slotCam ${slotCam.id}`,
          ),
        }
      : {
          x: sceneMomentCam?.x ?? scenePos.x,
          y: sceneMomentCam?.y ?? scenePos.y,
          rotation: sceneMomentCam?.rotation ?? scenePos.rotation,
          fovDegrees: this.clampFov(scenePos.fov_angle ?? 60, `scenePos ${scenePos.id}`),
        };

    // ── Subjects: prefer live SpaceSlotSubjectPosition + SpaceSlotMomentSubject
    // overrides when a source space slot is known. Fall back to
    // SceneSubjectPosition only when no slot source exists (e.g. pure
    // location-mode scenes without a package slot template). ──
    let floorSubjects: FloorSubject[];
    if (spaceSlot) {
      const subjectPositions = await this.prisma.spaceSlotSubjectPosition.findMany({
        where: { package_space_slot_id: spaceSlot.id },
        include: {
          day_subject: { select: { id: true, name: true, count: true } },
          moment_overrides: pkgMomentId
            ? { where: { moment_id: pkgMomentId }, take: 1 }
            : { take: 0 },
        },
      });
      const seen = new Set<string>();
      floorSubjects = subjectPositions
        .filter((sp) => sp.day_subject)
        .filter((sp) => {
          const override = sp.moment_overrides?.[0];
          if (override && override.present === false) return false;
          return true;
        })
        .filter((sp) => {
          const name = sp.day_subject!.name;
          if (seen.has(name)) return false;
          seen.add(name);
          return true;
        })
        .map((sp) => {
          const override = sp.moment_overrides?.[0];
          return {
            name: sp.day_subject!.name,
            x: override?.x ?? sp.x,
            y: override?.y ?? sp.y,
            rotation: override?.rotation ?? sp.rotation ?? 0,
            isGroup: (sp.day_subject!.count ?? 1) > 1,
            count: sp.day_subject!.count ?? 1,
            daySubjectId: sp.day_subject!.id,
            seated: override?.seated ?? sp.seated ?? undefined,
          };
        });
    } else {
      const subjectPositions = await this.prisma.sceneSubjectPosition.findMany({
        where: {
          scene_id: scenePos.scene_id,
          space_id: scenePos.space_id,
        },
        include: {
          subject: { select: { id: true, name: true, role_template: { select: { role_name: true, is_group: true } } } },
          moment_overrides: sceneMomentId
            ? { where: { moment_id: sceneMomentId }, take: 1 }
            : { take: 0 },
        },
      });
      const seen = new Set<string>();
      floorSubjects = subjectPositions
        .filter((sp) => sp.subject)
        .filter((sp) => {
          const name = sp.subject.name;
          if (seen.has(name)) return false;
          seen.add(name);
          return true;
        })
        .map((sp) => {
          const override = sp.moment_overrides?.[0];
          return {
            name: sp.subject.name,
            x: override?.x ?? sp.x,
            y: override?.y ?? sp.y,
            isGroup: sp.subject.role_template?.is_group ?? false,
            daySubjectId: sp.subject.id,
          };
        });
    }

    const spaceSlotObjs = spaceSlot?.objects ?? [];
    const floorObjects: FloorObject[] = spaceSlotObjs.map((o) => ({
      type: o.object_type,
      label: o.label ?? undefined,
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
      rotation: o.rotation,
      metadata: (o.metadata as Record<string, unknown> | null) ?? null,
    }));

    const expandedSubjects = this.expandSeatedGroupsIntoChairRows(floorSubjects, floorObjects);
    return { camera, subjects: expandedSubjects, objects: floorObjects };
  }

  /**
   * Expand a seated group subject (e.g. "Guests" with count=100) into
   * per-chair-row proxy subjects so the frame projection / overlay can
   * render them distributed across the ceremony seating, correctly
   * occlude/partially-occlude rows behind each other, and scale seated
   * figures individually per row.
   *
   * The original group subject is kept for AI blocking intent; the
   * proxies are what the spatial translator sees. Proxies share the
   * group's daySubjectId so downstream targeting still resolves to the
   * same PackageDaySubject.
   *
   * No-op when there are no CHAIR_ROW objects, the subject isn't flagged
   * seated, the group count is <= 1, or it's not a group.
   */
  private expandSeatedGroupsIntoChairRows(
    subjects: FloorSubject[],
    objects: FloorObject[],
  ): FloorSubject[] {
    const chairRows = objects.filter((o) => o.type === 'CHAIR_ROW');
    if (chairRows.length === 0) return subjects;

    const result: FloorSubject[] = [];
    for (const s of subjects) {
      // A group is seated if its DB field is true, OR if its name matches the
      // well-known "guests / crowd / congregation / audience" pattern. The
      // heuristic mirrors inferSeated() in spatial-translator.service.ts and
      // covers rows that were seeded before the explicit seated flag was added.
      const inferredSeated =
        s.seated !== true &&
        s.isGroup &&
        /^(guests?|crowd|congregation|audience)$/i.test(s.name.toLowerCase().trim());
      const seated = s.seated === true || inferredSeated;
      const count = s.count ?? 1;
      if (!s.isGroup || !seated || count <= 1) {
        result.push(s);
        continue;
      }

      // Rank rows front-to-back (lower y = front in ceremony layouts).
      const sortedRows = [...chairRows].sort((a, b) => a.y - b.y);
      const totalCapacity = sortedRows.reduce((sum, r) => {
        const meta = (r.metadata as Record<string, unknown> | null) ?? {};
        const cap = Number(meta.capacity ?? meta.seat_cols ?? 0);
        return sum + (Number.isFinite(cap) && cap > 0 ? cap : 10);
      }, 0);

      if (totalCapacity <= 0) {
        result.push(s);
        continue;
      }

      // Fill rows front-first up to the group count. Each filled row is
      // further expanded into individual seat-column proxies so the overlay
      // renders one person icon per chair, not a blended group blob.
      // The seated flag is inherited from the source subject so a
      // SpaceSlotMomentSubject override with seated=false (e.g. "All Rise")
      // causes each proxy to render standing in their seat position.
      let remaining = count;
      for (const row of sortedRows) {
        if (remaining <= 0) break;
        const meta = (row.metadata as Record<string, unknown> | null) ?? {};
        const rowCap = Number(meta.capacity ?? meta.seat_cols ?? 0);
        const cols = Number.isFinite(rowCap) && rowCap > 0 ? rowCap : 10;
        const take = Math.min(cols, remaining);
        remaining -= take;

        const cy = row.y + row.height / 2;
        const side = typeof meta.side === 'string' ? ` ${meta.side}` : '';
        const idx = meta.row_index != null ? ` ${meta.row_index}` : '';
        const rowLabel = row.label ?? `Row${idx}${side}`.trim();

        // Space each filled seat evenly across the row width.
        const colStep = cols > 1 ? row.width / cols : row.width;
        for (let col = 0; col < take; col++) {
          // Centre the icon in the column cell.
          const seatX = row.x + (col + 0.5) * colStep;
          result.push({
            name: `${s.name} (${rowLabel} S${col + 1})`,
            x: seatX,
            y: cy,
            isGroup: false,   // single icon per seat
            count: 1,
            rotation: s.rotation,
            daySubjectId: s.daySubjectId,
            // Inherit seated from source so moment overrides propagate:
            // seated=false → standing figure in the chair position.
            seated: s.seated !== false,
          });
        }
      }
      // Any overflow beyond total capacity is dropped with a warning so
      // the user knows the ceremony layout can't hold the group.
      if (remaining > 0) {
        this.logger.warn(
          `expandSeatedGroupsIntoChairRows: "${s.name}" has ${count} people ` +
            `but ceremony seating only has ${totalCapacity} seats — ${remaining} person(s) dropped from frame projection.`,
        );
      }
    }
    return result;
  }

  /**
   * Find the PackageSpaceSlot linked to a given activity.
   */
  async loadSpaceForActivity(activityId: number) {
    const assignment = await this.prisma.spaceActivityAssignment.findFirst({
      where: { package_activity_id: activityId },
      include: { package_space_slot: true },
    });
    return assignment?.package_space_slot ?? null;
  }

  async loadAssignmentContext(
    assignmentId: number,
    sourceType: string,
  ): Promise<{
    subjectIds: number[];
    shotType: ShotType | null;
    sceneName: string;
    momentName: string;
    activityName?: string;
    activityId?: number;
    /** subject name → action_description from the moment-subject junction */
    subjectActions: Map<string, string>;
    /** Gemma-generated SD prompt (if available) */
    aiPrompt?: string;
    /** Track name (e.g. "Camera 1") for spatial position lookup */
    trackName?: string;
    /** Stable FK to SceneCameraPosition (C: replaces name-matching) */
    sceneCameraPositionId?: number;
    /** SceneMoment ID for correct moment-specific position overrides */
    sceneMomentId?: number;
    /** Whether the camera track is unmanned — occlusion warnings are suppressed for unmanned cameras */
    isUnmanned?: boolean;
  }> {
    if (sourceType === 'project') {
      const assignment = await this.prisma.projectCameraSubjectAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          track: { select: { name: true, is_unmanned: true } },
          recording_setup: {
            include: {
              project_moment: {
                include: {
                  project_scene: true,
                  source_moment: true,
                  subjects: { include: { project_subject: true } },
                },
              },
            },
          },
        },
      });
      if (!assignment) {
        throw new NotFoundException(`Project camera assignment ${assignmentId} not found`);
      }
      const projectMoment = assignment.recording_setup?.project_moment;

      // Resolve activity via source_moment → SceneMoment.source_activity_id
      let activityName: string | undefined;
      const sourceActivityId = projectMoment?.source_moment?.source_activity_id;
      if (sourceActivityId) {
        const activity = await this.prisma.packageActivity.findUnique({
          where: { id: sourceActivityId },
          select: { name: true },
        });
        activityName = activity?.name || undefined;
      }

      // Build subject action map from project moment subjects (keyed by name)
      const subjectActions = new Map<string, string>();
      for (const ms of projectMoment?.subjects ?? []) {
        if (ms.action_description && ms.project_subject?.name) {
          subjectActions.set(ms.project_subject.name, ms.action_description);
        }
      }

      return {
        subjectIds: assignment.subject_ids,
        shotType: assignment.shot_type,
        sceneName: projectMoment?.project_scene?.name || '',
        momentName: projectMoment?.name || '',
        activityName,
        activityId: sourceActivityId || undefined,
        subjectActions,
        aiPrompt: (assignment as any).ai_prompt || undefined,
        trackName: assignment.track?.name || undefined,
        sceneMomentId: projectMoment?.source_moment?.id,
        isUnmanned: assignment.track?.is_unmanned ?? false,
      };
    }

    // Package-level (default)
    const assignment = await this.prisma.cameraSubjectAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        track: { select: { name: true, is_unmanned: true } },
        recording_setup: {
          include: {
            moment: {
              include: {
                film_scene: true,
                subjects: { include: { subject: true } },
              },
            },
          },
        },
      },
    });
    if (!assignment) {
      throw new NotFoundException(`Camera assignment ${assignmentId} not found`);
    }
    const moment = assignment.recording_setup?.moment;

    // SceneMoment has source_activity_id but no Prisma relation — query separately
    let activityName: string | undefined;
    if (moment?.source_activity_id) {
      const activity = await this.prisma.packageActivity.findUnique({
        where: { id: moment.source_activity_id },
        select: { name: true },
      });
      activityName = activity?.name || undefined;
    }

    // Build subject action map from moment subjects (keyed by name)
    const subjectActions = new Map<string, string>();
    for (const ms of moment?.subjects ?? []) {
      if (ms.action_description && ms.subject?.name) {
        subjectActions.set(ms.subject.name, ms.action_description);
      }
    }

    return {
      subjectIds: assignment.subject_ids,
      shotType: assignment.shot_type,
      sceneName: moment?.film_scene?.name || '',
      momentName: moment?.name || '',
      activityName,
      activityId: moment?.source_activity_id || undefined,
      subjectActions,
      aiPrompt: assignment.ai_prompt || undefined,
      trackName: assignment.track?.name || undefined,
      sceneCameraPositionId: assignment.scene_camera_position_id || undefined,
      sceneMomentId: moment?.id,
      isUnmanned: assignment.track?.is_unmanned ?? false,
    };
  }

  async loadSubjects(
    subjectIds: number[],
    filmId: number,
    sourceType: string,
  ): Promise<Array<{ id: number; name: string; roleName: string | null; isGroup: boolean }>> {
    if (subjectIds.length === 0) return [];

    if (sourceType === 'project') {
      const subjects = await this.prisma.projectFilmSubject.findMany({
        where: { id: { in: subjectIds } },
        include: { role_template: true },
      });

      // Cloned assignments may still reference PackageDaySubject IDs — fall back
      if (subjects.length === 0) {
        const pkgSubjects = await this.prisma.packageDaySubject.findMany({
          where: { id: { in: subjectIds } },
          include: { role_template: true },
        });
        return pkgSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          roleName: s.role_template?.role_name || null,
          isGroup: (s.count ?? 1) > 1,
        }));
      }

      return subjects.map((s) => ({
        id: s.id,
        name: s.name,
        roleName: s.role_template?.role_name || null,
        isGroup: s.role_template?.is_group || false,
      }));
    }

    // Package-level: subject_ids are PackageDaySubject IDs
    const subjects = await this.prisma.packageDaySubject.findMany({
      where: { id: { in: subjectIds } },
      include: { role_template: true },
    });
    return subjects.map((s) => ({
      id: s.id,
      name: s.name,
      roleName: s.role_template?.role_name || null,
      isGroup: (s.count ?? 1) > 1,
    }));
  }

  /**
   * Load sibling camera assignments (same moment, different camera) for
   * cross-camera parity analysis. Returns their subject_ids and shot_type.
   */
  async loadSiblingAssignments(
    assignmentId: number,
    sourceType: string,
  ): Promise<Array<{ subjectIds: number[]; shotType: string | null }>> {
    if (sourceType === 'project') {
      const assignment = await this.prisma.projectCameraSubjectAssignment.findUnique({
        where: { id: assignmentId },
        select: {
          recording_setup_id: true,
          recording_setup: {
            select: {
              camera_assignments: {
                where: { id: { not: assignmentId } },
                select: { subject_ids: true, shot_type: true },
              },
            },
          },
        },
      });
      return (assignment?.recording_setup?.camera_assignments ?? []).map((a) => ({
        subjectIds: a.subject_ids,
        shotType: a.shot_type,
      }));
    }

    const assignment = await this.prisma.cameraSubjectAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        recording_setup_id: true,
        recording_setup: {
          select: {
            camera_assignments: {
              where: { id: { not: assignmentId }, enabled: true },
              select: { subject_ids: true, shot_type: true },
            },
          },
        },
      },
    });
    return (assignment?.recording_setup?.camera_assignments ?? []).map((a) => ({
      subjectIds: a.subject_ids,
      shotType: a.shot_type,
    }));
  }

  /**
   * Compute a deterministic hash of spatial inputs (camera + subject positions).
   * Used to detect staleness when floorplan changes after prep.
   */
  computeSpatialHash(
    camera: { x: number; y: number; rotation: number },
    subjects: Array<{ name: string; x: number; y: number }>,
  ): string {
    const payload = JSON.stringify({
      cam: { x: Math.round(camera.x), y: Math.round(camera.y), r: Math.round(camera.rotation) },
      subs: subjects
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ n: s.name, x: Math.round(s.x), y: Math.round(s.y) })),
    });
    return createHash('sha256').update(payload).digest('hex').slice(0, 16);
  }
}
