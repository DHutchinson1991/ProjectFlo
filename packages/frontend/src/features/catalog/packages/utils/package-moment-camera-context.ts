import type { PackageSpaceSlot, SpaceSlotCameraPosition } from '@/features/workflow/locations/types/floor-plan.types';
import {
  buildFramingSubjectsFromSlot,
  computeCameraShotBadge,
} from '@/features/workflow/locations/utils/camera-framing';

export type MomentCameraContextCard = {
  key: string;
  label: string;
  targets: string;
  shotLabel?: string;
  editorialNotes?: string;
  source: 'blocking' | 'editorial' | 'both';
};

export type EditorialCameraAssignment = {
  track_id: number;
  track_name?: string | null;
  track_type?: string | null;
  subject_ids?: number[];
  shot_type?: string | null;
  shot_type_locked?: boolean;
  enabled?: boolean;
  director_notes?: { emotionalTone?: string; compositionNotes?: string } | null;
};

export type SubjectNameLookup = { id: number; name: string };

function formatShotLabel(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function cameraNumberFromLabel(label: string): number | null {
  const match = label.match(/camera\s*(\d+)/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function defaultCameraLabel(cameraNumber: number): string {
  return `Camera ${cameraNumber}`;
}

function formatCameraDisplayLabel(label: string, cameraNumber: number): string {
  const base = (label.trim() || defaultCameraLabel(cameraNumber)).replace(/Camera/i, 'Cam');
  return base;
}

function subjectNamesFromIds(ids: number[] | undefined, subjects: SubjectNameLookup[]): string[] {
  if (!ids?.length) return [];
  const nameById = new Map(subjects.map((subject) => [subject.id, subject.name]));
  return ids
    .map((id) => nameById.get(id))
    .filter((name): name is string => Boolean(name?.trim()));
}

function subjectIdsFromNames(names: string[], subjects: SubjectNameLookup[]): number[] {
  const idByName = new Map(subjects.map((subject) => [subject.name.trim().toLowerCase(), subject.id]));
  return names
    .map((name) => idByName.get(name.trim().toLowerCase()))
    .filter((id): id is number => id != null);
}

function resolveCameraPose(
  camera: SpaceSlotCameraPosition,
  packageMomentId: number | null,
): { x: number; y: number; rotation: number; fov_angle: number | null } {
  let { x, y, rotation, fov_angle: fovAngle } = camera;
  if (packageMomentId != null) {
    const override = camera.moment_overrides?.find((row) => row.moment_id === packageMomentId);
    if (override) {
      x = override.x;
      y = override.y;
      rotation = override.rotation;
      if (override.fov_angle != null) fovAngle = override.fov_angle;
    }
  }
  return { x, y, rotation, fov_angle: fovAngle };
}

type CameraAccumulator = {
  cameraNumber: number;
  label: string;
  targetNames: string[];
  spatialCamera?: SpaceSlotCameraPosition;
  editorial?: EditorialCameraAssignment;
  hasBlocking: boolean;
  hasEditorial: boolean;
};

function upsertCamera(
  map: Map<number, CameraAccumulator>,
  cameraNumber: number,
  patch: Partial<CameraAccumulator> & { label?: string },
): CameraAccumulator {
  const existing = map.get(cameraNumber) ?? {
    cameraNumber,
    label: defaultCameraLabel(cameraNumber),
    targetNames: [],
    hasBlocking: false,
    hasEditorial: false,
  };

  const merged: CameraAccumulator = {
    ...existing,
    ...patch,
    label: patch.label?.trim() ? patch.label : existing.label,
    targetNames: patch.targetNames ?? existing.targetNames,
    hasBlocking: existing.hasBlocking || patch.hasBlocking === true,
    hasEditorial: existing.hasEditorial || patch.hasEditorial === true,
    spatialCamera: patch.spatialCamera ?? existing.spatialCamera,
    editorial: patch.editorial ?? existing.editorial,
  };

  map.set(cameraNumber, merged);
  return merged;
}

export function buildPackageMomentCameraCards(params: {
  packageMomentId: number | null;
  cameraSubjectPlan?: Record<string, string[]> | null;
  spaceSlot?: PackageSpaceSlot | null;
  packageSubjects?: SubjectNameLookup[];
  editorialAssignments?: EditorialCameraAssignment[];
}): MomentCameraContextCard[] {
  const {
    packageMomentId,
    cameraSubjectPlan,
    spaceSlot,
    packageSubjects = [],
    editorialAssignments = [],
  } = params;

  const byNumber = new Map<number, CameraAccumulator>();

  for (const camera of spaceSlot?.camera_positions ?? []) {
    if (camera.is_unmanned) continue;
    const cameraNumber = camera.order_index + 1;
    upsertCamera(byNumber, cameraNumber, {
      label: camera.label?.trim() || defaultCameraLabel(cameraNumber),
      spatialCamera: camera,
      hasBlocking: true,
    });
  }

  if (cameraSubjectPlan && typeof cameraSubjectPlan === 'object') {
    for (const [cameraLabel, subjectNames] of Object.entries(cameraSubjectPlan)) {
      if (!Array.isArray(subjectNames) || subjectNames.length === 0) continue;
      const cameraNumber = cameraNumberFromLabel(cameraLabel) ?? byNumber.size + 1;
      upsertCamera(byNumber, cameraNumber, {
        label: cameraLabel,
        targetNames: subjectNames,
        hasBlocking: true,
      });
    }
  }

  for (const assignment of editorialAssignments) {
    if (assignment.enabled === false) continue;
    const trackType = assignment.track_type?.toLowerCase();
    if (trackType && trackType !== 'video') continue;

    const cameraNumber =
      cameraNumberFromLabel(assignment.track_name ?? '') ??
      cameraNumberFromLabel(defaultCameraLabel(assignment.track_id)) ??
      assignment.track_id;

    const editorialTargets = subjectNamesFromIds(assignment.subject_ids, packageSubjects);
    upsertCamera(byNumber, cameraNumber, {
      label: assignment.track_name?.trim() || defaultCameraLabel(cameraNumber),
      targetNames: editorialTargets.length > 0 ? editorialTargets : undefined,
      editorial: assignment,
      hasEditorial: true,
    });
  }

  const framingSubjects =
    spaceSlot && packageMomentId != null
      ? buildFramingSubjectsFromSlot(spaceSlot, packageMomentId)
      : [];

  return Array.from(byNumber.values())
    .sort((left, right) => left.cameraNumber - right.cameraNumber)
    .map((row) => {
      const uniqueTargets = Array.from(new Set(row.targetNames.filter(Boolean)));
      const editorialTargets = row.editorial
        ? subjectNamesFromIds(row.editorial.subject_ids, packageSubjects)
        : [];
      const targets = uniqueTargets.length > 0
        ? uniqueTargets
        : editorialTargets;

      let shotLabel = row.editorial?.shot_type
        ? formatShotLabel(row.editorial.shot_type)
        : undefined;

      if (!shotLabel && row.spatialCamera && packageMomentId != null && targets.length > 0) {
        const pose = resolveCameraPose(row.spatialCamera, packageMomentId);
        const subjectIds = subjectIdsFromNames(targets, packageSubjects);
        if (subjectIds.length > 0) {
          shotLabel = computeCameraShotBadge({
            camera: pose,
            subjects: framingSubjects,
            subjectIds,
            currentShotType: row.editorial?.shot_type ?? null,
            shotCoupling: null,
          });
        }
      }

      const editorialNotes = row.editorial?.director_notes?.compositionNotes?.trim()
        || row.editorial?.director_notes?.emotionalTone?.trim()
        || undefined;

      const source: MomentCameraContextCard['source'] =
        row.hasBlocking && row.hasEditorial
          ? 'both'
          : row.hasEditorial
            ? 'editorial'
            : 'blocking';

      return {
        key: String(row.cameraNumber),
        label: formatCameraDisplayLabel(row.label, row.cameraNumber),
        targets: targets.join(', '),
        shotLabel: shotLabel || undefined,
        editorialNotes,
        source,
      };
    });
}

export function findLinkedSceneMoment<T extends { id: number; name: string; order_index: number; package_activity_moment_id?: number | null }>(
  sceneMoments: T[] | undefined,
  packageMomentId: number,
  packageMomentName: string,
  packageMomentOrderIndex: number,
): T | null {
  if (!sceneMoments?.length) return null;

  const byForeignKey = sceneMoments.find(
    (moment) => moment.package_activity_moment_id === packageMomentId,
  );
  if (byForeignKey) return byForeignKey;

  return sceneMoments.find(
    (moment) => moment.name === packageMomentName && moment.order_index === packageMomentOrderIndex,
  ) ?? null;
}
