import {
  computeFraming,
  isGuestLikeSubjectName,
  resolveFocalSubjectIds,
  shotTypeAbbrev,
  subjectsFitInFov,
  type FramingSubject,
} from '@projectflo/shared';
import type { PackageSpaceSlot } from '../types/floor-plan.types';

export function buildFramingSubjectsFromSlot(
  spaceSlot: PackageSpaceSlot,
  packageMomentId: number | null | undefined,
): FramingSubject[] {
  const subjects: FramingSubject[] = [];
  const seen = new Set<number>();

  for (const subj of spaceSlot.subject_positions ?? []) {
    const daySubjectId = subj.day_subject_id;
    if (!daySubjectId || seen.has(daySubjectId)) continue;

    let sx = subj.x;
    let sy = subj.y;
    if (packageMomentId) {
      const override = subj.moment_overrides?.find((o) => o.moment_id === packageMomentId);
      if (!override) continue;
      if (override.present === false) continue;
      sx = override.x;
      sy = override.y;
    }

    seen.add(daySubjectId);
    const name = (subj.label?.trim() || subj.day_subject?.name || '').trim();
    subjects.push({
      id: daySubjectId,
      x: sx,
      y: sy,
      name,
      isGuestLike: isGuestLikeSubjectName(name) || (subj.day_subject?.count ?? 1) > 10,
    });
  }

  return subjects;
}

export function computeCameraShotBadge(params: {
  camera: { x: number; y: number; rotation: number; fov_angle?: number | null };
  subjects: FramingSubject[];
  subjectIds: number[];
  currentShotType?: string | null;
  shotCoupling?: string | null;
}): string {
  const framing = computeFraming({
    camera: {
      x: params.camera.x,
      y: params.camera.y,
      rotation: params.camera.rotation,
      fovDegrees: params.camera.fov_angle ?? 60,
    },
    subjects: params.subjects,
    subjectIds: params.subjectIds,
    currentShotType: params.currentShotType,
    shotCoupling: params.shotCoupling,
  });
  return shotTypeAbbrev(
    framing.shotCoupling === 'pinned' ? framing.geometricShot : framing.resolvedShot,
  );
}

/** True when any manned camera with targets is not aimed at its focal subjects. */
export function slotHasMisalignedCameraAiming(params: {
  spaceSlot: PackageSpaceSlot;
  packageMomentId: number | null | undefined;
  cameraSubjectIdsByCamNum: Record<number, number[]>;
}): boolean {
  const subjects = buildFramingSubjectsFromSlot(params.spaceSlot, params.packageMomentId);
  if (subjects.length === 0) return false;

  const subjectsById = new Map(subjects.map((s) => [s.id, s]));

  for (const cam of params.spaceSlot.camera_positions ?? []) {
    if (cam.is_unmanned) continue;

    const cameraNumber = cam.order_index + 1;
    const subjectIds = params.cameraSubjectIdsByCamNum[cameraNumber] ?? [];
    if (subjectIds.length === 0) continue;

    const override = params.packageMomentId
      ? cam.moment_overrides?.find((o) => o.moment_id === params.packageMomentId)
      : undefined;

    const cx = override?.x ?? cam.x;
    const cy = override?.y ?? cam.y;
    const rotation = override?.rotation ?? cam.rotation;
    const fovDegrees = override?.fov_angle ?? cam.fov_angle ?? 60;

    const focalIds = resolveFocalSubjectIds(subjectIds, subjectsById);
    const aimIds = focalIds.length > 0 ? focalIds : subjectIds;
    const aimPoints = aimIds
      .map((id) => subjectsById.get(id))
      .filter((s): s is FramingSubject => s != null)
      .map((s) => ({ x: s.x, y: s.y }));

    if (aimPoints.length === 0) continue;
    if (!subjectsFitInFov({ x: cx, y: cy, rotation, fovDegrees }, aimPoints)) {
      return true;
    }
  }

  return false;
}
