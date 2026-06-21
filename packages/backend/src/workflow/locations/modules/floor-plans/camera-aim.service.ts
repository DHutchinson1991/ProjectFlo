import { Injectable, Logger } from '@nestjs/common';
import {
  angleToPointDeg,
  resolveFocalSubjectIds,
  rotationTowardPointsDeg,
  type FramingSubject,
} from '@projectflo/shared';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CameraFramingService } from './camera-framing.service';

const MAX_FOV_DEG = 120;
const FOV_EDGE_MARGIN_DEG = 2;

export interface AimCamerasOptions {
  onlyCameraPositionIds?: number[];
  onlyDaySubjectIds?: number[];
}

export interface AimCamerasResult {
  updatedCameraPositionIds: number[];
}

@Injectable()
export class CameraAimService {
  private readonly logger = new Logger(CameraAimService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cameraFraming: CameraFramingService,
  ) {}

  /**
   * Rotate manned cameras toward the centroid of their editorial targets.
   * Position (x/y) is unchanged; FOV may widen so all targets fit the cone.
   */
  async aimCamerasForSceneMoment(
    sceneMomentId: number,
    opts?: AimCamerasOptions,
  ): Promise<AimCamerasResult> {
    const sceneMoment = await this.prisma.sceneMoment.findUnique({
      where: { id: sceneMomentId },
      select: {
        id: true,
        package_activity_moment_id: true,
        recording_setup: {
          include: {
            camera_assignments: {
              include: { track: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    if (!sceneMoment?.recording_setup) {
      return { updatedCameraPositionIds: [] };
    }

    const pkgMomentId = sceneMoment.package_activity_moment_id;
    const assignments = sceneMoment.recording_setup.camera_assignments;

    const spaceSlotIds = await this.resolveSpaceSlotIds(sceneMomentId, pkgMomentId);
    if (spaceSlotIds.length === 0) {
      return { updatedCameraPositionIds: [] };
    }

    const cameraRows = await this.prisma.spaceSlotCameraPosition.findMany({
      where: {
        package_space_slot_id: { in: spaceSlotIds },
        ...(opts?.onlyCameraPositionIds?.length
          ? { id: { in: opts.onlyCameraPositionIds } }
          : {}),
      },
      select: {
        id: true,
        order_index: true,
        x: true,
        y: true,
        rotation: true,
        fov_angle: true,
        is_unmanned: true,
        package_space_slot_id: true,
        moment_overrides: pkgMomentId
          ? { where: { moment_id: pkgMomentId }, take: 1 }
          : { take: 0 },
      },
    });

    if (cameraRows.length === 0) {
      return { updatedCameraPositionIds: [] };
    }

    const updatedIds: number[] = [];

    for (const cam of cameraRows) {
      if (opts?.onlyCameraPositionIds?.length && !opts.onlyCameraPositionIds.includes(cam.id)) {
        continue;
      }
      if (cam.is_unmanned) continue;

      const trackName = `Camera ${cam.order_index + 1}`;
      const assignment = assignments.find(
        (row) => (row.track?.name ?? '').toLowerCase() === trackName.toLowerCase(),
      );
      if (!assignment) continue;

      let subjectIds = assignment.subject_ids ?? [];
      if (subjectIds.length === 0) continue;

      if (opts?.onlyDaySubjectIds?.length) {
        const tracksMovedSubject = subjectIds.some((id) => opts.onlyDaySubjectIds!.includes(id));
        if (!tracksMovedSubject) continue;
      }

      const subjects = await this.cameraFraming.loadFramingSubjects(
        cam.package_space_slot_id,
        pkgMomentId,
      );
      if (subjects.length === 0) continue;

      const subjectsById = new Map(subjects.map((s) => [s.id, s]));
      const focalIds = resolveFocalSubjectIds(subjectIds, subjectsById);
      const aimIds = focalIds.length > 0 ? focalIds : subjectIds;
      const aimPoints = aimIds
        .map((id) => subjectsById.get(id))
        .filter((s): s is FramingSubject => s != null)
        .map((s) => ({ x: s.x, y: s.y }));

      if (aimPoints.length === 0) continue;

      const override = cam.moment_overrides?.[0];
      const camX = override?.x ?? cam.x;
      const camY = override?.y ?? cam.y;
      const baseFov = this.clampFov(override?.fov_angle ?? cam.fov_angle);

      const rotation = rotationTowardPointsDeg(camX, camY, aimPoints);
      if (rotation == null) continue;

      const widenedFov = this.widenFovToFitSubjects(camX, camY, rotation, baseFov, aimPoints);

      if (pkgMomentId != null) {
        await this.prisma.spaceSlotMomentCamera.upsert({
          where: {
            camera_position_id_moment_id: {
              camera_position_id: cam.id,
              moment_id: pkgMomentId,
            },
          },
          create: {
            camera_position_id: cam.id,
            moment_id: pkgMomentId,
            x: camX,
            y: camY,
            rotation,
            fov_angle: widenedFov,
          },
          update: {
            rotation,
            ...(widenedFov !== baseFov ? { fov_angle: widenedFov } : {}),
          },
        });
      } else {
        await this.prisma.spaceSlotCameraPosition.update({
          where: { id: cam.id },
          data: {
            rotation,
            ...(widenedFov !== baseFov ? { fov_angle: widenedFov } : {}),
          },
        });
      }

      updatedIds.push(cam.id);
      this.logger.debug(
        `Aimed camera ${cam.id} (${trackName}) to rotation ${rotation}° for scene moment ${sceneMomentId}`,
      );
    }

    return { updatedCameraPositionIds: updatedIds };
  }

  /**
   * Repair pass for a package moment: aim all manned cameras with assignments.
   */
  async aimCamerasForPackageMoment(
    spaceSlotId: number,
    packageMomentId: number,
    sceneMomentId: number,
  ): Promise<AimCamerasResult> {
    const slot = await this.prisma.packageSpaceSlot.findUnique({
      where: { id: spaceSlotId },
      select: { id: true },
    });
    if (!slot) return { updatedCameraPositionIds: [] };

    return this.aimCamerasForSceneMoment(sceneMomentId);
  }

  private async resolveSpaceSlotIds(
    sceneMomentId: number,
    packageMomentId: number | null,
  ): Promise<number[]> {
    if (packageMomentId != null) {
      const pkgMoment = await this.prisma.packageActivityMoment.findUnique({
        where: { id: packageMomentId },
        select: { package_activity_id: true },
      });
      if (pkgMoment) {
        const assignments = await this.prisma.spaceActivityAssignment.findMany({
          where: { package_activity_id: pkgMoment.package_activity_id },
          select: { package_space_slot_id: true },
        });
        if (assignments.length > 0) {
          return assignments.map((row) => row.package_space_slot_id);
        }
      }
    }

    const sceneMoment = await this.prisma.sceneMoment.findUnique({
      where: { id: sceneMomentId },
      select: {
        film_scene: {
          select: {
            source_activity_id: true,
          },
        },
      },
    });
    const activityId = sceneMoment?.film_scene?.source_activity_id;
    if (activityId) {
      const assignments = await this.prisma.spaceActivityAssignment.findMany({
        where: { package_activity_id: activityId },
        select: { package_space_slot_id: true },
      });
      return assignments.map((row) => row.package_space_slot_id);
    }

    return [];
  }

  private widenFovToFitSubjects(
    camX: number,
    camY: number,
    rotation: number,
    baseFov: number,
    points: Array<{ x: number; y: number }>,
  ): number {
    let maxDev = 0;
    for (const point of points) {
      const angle = angleToPointDeg(camX, camY, point.x, point.y);
      const dev = Math.abs(((angle - rotation + 540) % 360) - 180);
      maxDev = Math.max(maxDev, dev);
    }
    const requiredFov = 2 * maxDev + 2 * FOV_EDGE_MARGIN_DEG;
    if (requiredFov <= baseFov) return baseFov;
    return Math.min(MAX_FOV_DEG, Math.ceil(requiredFov));
  }

  private clampFov(raw: number | null | undefined): number {
    const value = Number.isFinite(raw as number) ? Number(raw) : 60;
    return Math.min(MAX_FOV_DEG, Math.max(10, value));
  }
}
