import { Injectable, Logger } from '@nestjs/common';
import { ShotType } from '@prisma/client';
import {
  computeFraming,
  type ComputeFramingResult,
  type FramingSubject,
} from '@projectflo/shared';
import { PrismaService } from '../../../../platform/prisma/prisma.service';

export interface SyncFramingParams {
  sceneMomentId: number;
  cameraPositionId: number;
  x: number;
  y: number;
  rotation: number;
}

@Injectable()
export class CameraFramingService {
  private readonly logger = new Logger(CameraFramingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * After a manual camera move, recompute geometric framing from focal-subject
   * distance and persist shot_type when the assignment is in linked mode.
   */
  async syncFramingAfterCameraMove(
    params: SyncFramingParams,
  ): Promise<ComputeFramingResult | null> {
    const sceneMoment = await this.prisma.sceneMoment.findUnique({
      where: { id: params.sceneMomentId },
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
    if (!sceneMoment?.recording_setup) return null;

    const camPos = await this.prisma.spaceSlotCameraPosition.findUnique({
      where: { id: params.cameraPositionId },
      select: {
        id: true,
        order_index: true,
        fov_angle: true,
        package_space_slot_id: true,
      },
    });
    if (!camPos) return null;

    const trackName = `Camera ${camPos.order_index + 1}`;
    const assignment = sceneMoment.recording_setup.camera_assignments.find(
      (row) => (row.track?.name ?? '').toLowerCase() === trackName.toLowerCase(),
    );
    if (!assignment) {
      this.logger.debug(
        `No camera assignment for track "${trackName}" on scene moment ${params.sceneMomentId}`,
      );
      return null;
    }

    const pkgMomentId = sceneMoment.package_activity_moment_id;
    const subjects = await this.loadFramingSubjects(
      camPos.package_space_slot_id,
      pkgMomentId,
    );
    if (subjects.length === 0) return null;

    const fovDegrees = this.clampFov(camPos.fov_angle);
    const framing = computeFraming({
      camera: {
        x: params.x,
        y: params.y,
        rotation: params.rotation,
        fovDegrees,
      },
      subjects,
      subjectIds: assignment.subject_ids ?? [],
      currentShotType: assignment.shot_type,
      shotCoupling: assignment.shot_coupling ?? undefined,
    });

    const updateData: {
      shot_type?: ShotType;
      visible_subject_ids: number[];
      subject_ids?: number[];
    } = {
      visible_subject_ids: framing.visibleSubjectIds,
    };

    if (framing.shouldPersistShot) {
      updateData.shot_type = framing.resolvedShot as ShotType;
    }

    const trimmedChanged =
      framing.trimmedSubjectIds.length !== (assignment.subject_ids?.length ?? 0) ||
      framing.trimmedSubjectIds.some((id, i) => assignment.subject_ids?.[i] !== id);
    if (trimmedChanged && framing.shouldPersistShot) {
      updateData.subject_ids = framing.trimmedSubjectIds;
    }

    await this.prisma.cameraSubjectAssignment.update({
      where: { id: assignment.id },
      data: updateData,
    });

    return framing;
  }

  async loadFramingSubjects(
    spaceSlotId: number,
    packageMomentId: number | null,
  ): Promise<FramingSubject[]> {
    const rows = await this.prisma.spaceSlotSubjectPosition.findMany({
      where: { package_space_slot_id: spaceSlotId },
      include: {
        day_subject: { select: { id: true, name: true, count: true } },
        moment_overrides: packageMomentId
          ? { where: { moment_id: packageMomentId }, take: 1 }
          : { take: 0 },
      },
    });

    const seen = new Set<number>();
    const subjects: FramingSubject[] = [];

    for (const row of rows) {
      const daySubjectId = row.day_subject?.id;
      if (!daySubjectId || seen.has(daySubjectId)) continue;

      const override = row.moment_overrides?.[0];
      if (packageMomentId && !override) continue;
      if (override?.present === false) continue;

      seen.add(daySubjectId);
      const name = row.day_subject?.name ?? row.label ?? '';
      subjects.push({
        id: daySubjectId,
        x: override?.x ?? row.x,
        y: override?.y ?? row.y,
        name,
        isGuestLike: (row.day_subject?.count ?? 1) > 10 || /guest|crowd|congregation|audience/i.test(name),
      });
    }

    return subjects;
  }

  private clampFov(raw: number | null | undefined): number {
    const value = Number.isFinite(raw as number) ? Number(raw) : 60;
    return Math.min(120, Math.max(10, value));
  }
}
