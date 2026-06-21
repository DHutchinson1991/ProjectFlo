/**
 * Single source of truth for distance → shot-type inference on the
 * normalized 0–1000 floor-plan canvas. Used by the AI blocking guardrails
 * (generation time) and the spatial translator / conflict detection
 * (read time) so the two systems agree by construction.
 */

/** Enter/exit distance bands (FOV-scaled canvas units) — exit is looser to prevent flicker. */
export const SHOT_TYPE_HYSTERESIS_BANDS = [
  { type: 'EXTREME_CLOSE_UP' as const, enterMax: 80, exitMax: 92 },
  { type: 'CLOSE_UP' as const, enterMax: 130, exitMax: 148 },
  { type: 'MEDIUM_SHOT' as const, enterMax: 200, exitMax: 225 },
  { type: 'WIDE_SHOT' as const, enterMax: 300, exitMax: 335 },
] as const;

export const SHOT_TYPE_DISTANCE_THRESHOLDS = SHOT_TYPE_HYSTERESIS_BANDS.map((band) => ({
  max: band.enterMax,
  type: band.type,
}));

export type InferredShotType =
  | (typeof SHOT_TYPE_DISTANCE_THRESHOLDS)[number]['type']
  | 'ESTABLISHING_SHOT';

/** Maximum subjects a camera can meaningfully frame per inferred shot type. */
export const SHOT_TYPE_SUBJECT_CAPS: Record<InferredShotType, number> = {
  EXTREME_CLOSE_UP: 1,
  CLOSE_UP: 2,
  MEDIUM_SHOT: 4,
  WIDE_SHOT: Number.POSITIVE_INFINITY,
  ESTABLISHING_SHOT: Number.POSITIVE_INFINITY,
};

export const DEFAULT_CAMERA_FOV_DEGREES = 60;

/**
 * Scale a physical floor distance by the lens FOV: a narrower lens frames
 * subjects tighter at the same physical distance, so its effective
 * (framing) distance is shorter.
 */
export function effectiveFramingDistance(distance: number, fovDegrees?: number | null): number {
  const fov = Math.min(120, Math.max(10, fovDegrees ?? DEFAULT_CAMERA_FOV_DEGREES));
  return distance * (fov / DEFAULT_CAMERA_FOV_DEGREES);
}

/**
 * Infer the shot type from FOV-scaled subject distances. Uses the median
 * distance so a single outlier subject doesn't flip the classification.
 * Returns ESTABLISHING_SHOT when no subjects are provided.
 */
function classifyEnterDistance(scaledDistance: number): InferredShotType {
  for (const band of SHOT_TYPE_HYSTERESIS_BANDS) {
    if (scaledDistance <= band.enterMax) return band.type;
  }
  return 'ESTABLISHING_SHOT';
}

function medianScaledDistance(distances: number[], fovDegrees?: number | null): number | null {
  if (distances.length === 0) return null;
  const scaled = distances
    .map((d) => effectiveFramingDistance(d, fovDegrees))
    .sort((a, b) => a - b);
  return scaled[Math.floor(scaled.length / 2)];
}

export function inferShotTypeFromDistances(
  distances: number[],
  fovDegrees?: number | null,
): InferredShotType {
  const median = medianScaledDistance(distances, fovDegrees);
  if (median == null) return 'ESTABLISHING_SHOT';
  return classifyEnterDistance(median);
}

/**
 * Distance → shot with hysteresis when a geometric shot is already set.
 * Going wider requires passing the current band's exit threshold.
 */
export function inferShotTypeWithHysteresis(
  distances: number[],
  fovDegrees?: number | null,
  currentShotType?: string | null,
): InferredShotType {
  const median = medianScaledDistance(distances, fovDegrees);
  if (median == null) return 'ESTABLISHING_SHOT';
  if (!currentShotType || !isGeometricEditorialShot(currentShotType)) {
    return classifyEnterDistance(median);
  }

  const currentBandIdx = SHOT_TYPE_HYSTERESIS_BANDS.findIndex((band) => band.type === currentShotType);
  if (currentBandIdx < 0) return classifyEnterDistance(median);

  const naive = classifyEnterDistance(median);
  if (naive === currentShotType) return currentShotType as InferredShotType;

  const naiveIdx = SHOT_TYPE_HYSTERESIS_BANDS.findIndex((band) => band.type === naive);
  if (naiveIdx < 0) return naive;

  if (naiveIdx > currentBandIdx) {
    if (median > SHOT_TYPE_HYSTERESIS_BANDS[currentBandIdx].exitMax) return naive;
    return currentShotType as InferredShotType;
  }

  return naive;
}

/** Canvas radii (unscaled) for focal-subject distance rings at each enter threshold. */
export function focalDistanceRingRadii(fovDegrees?: number | null): number[] {
  const fov = Math.min(120, Math.max(10, fovDegrees ?? DEFAULT_CAMERA_FOV_DEGREES));
  return SHOT_TYPE_HYSTERESIS_BANDS.map((band) => band.enterMax * (DEFAULT_CAMERA_FOV_DEGREES / fov));
}

/** Maximum subject count for the shot type inferred from these distances. */
export function subjectCapForDistances(
  distances: number[],
  fovDegrees?: number | null,
): { shotType: InferredShotType; cap: number } {
  const shotType = inferShotTypeFromDistances(distances, fovDegrees);
  return { shotType, cap: SHOT_TYPE_SUBJECT_CAPS[shotType] };
}

/** Prisma-aligned editorial shot types (assignment intent, not geometry). */
export type EditorialShotType =
  | 'ESTABLISHING_SHOT'
  | 'WIDE_SHOT'
  | 'MEDIUM_SHOT'
  | 'TWO_SHOT'
  | 'CLOSE_UP'
  | 'EXTREME_CLOSE_UP'
  | 'DETAIL_SHOT'
  | 'REACTION_SHOT'
  | 'OVER_SHOULDER'
  | 'CUTAWAY'
  | 'INSERT_SHOT'
  | 'MASTER_SHOT';

const UNLIMITED_SUBJECT_CAP = Number.POSITIVE_INFINITY;

/** High cap for wide/establishing shots — still bounded for UI sanity. */
export const WIDE_SHOT_EDITORIAL_SUBJECT_CAP = 8;

/**
 * Maximum subjects per editorial shot type (user/assignment intent).
 * Distinct from distance-inferred caps used for geometry classification.
 */
export const EDITORIAL_SHOT_TYPE_SUBJECT_CAPS: Record<EditorialShotType, number> = {
  EXTREME_CLOSE_UP: 1,
  CLOSE_UP: 1,
  DETAIL_SHOT: 1,
  INSERT_SHOT: 1,
  TWO_SHOT: 2,
  OVER_SHOULDER: 2,
  REACTION_SHOT: 2,
  MEDIUM_SHOT: 3,
  WIDE_SHOT: WIDE_SHOT_EDITORIAL_SUBJECT_CAP,
  MASTER_SHOT: WIDE_SHOT_EDITORIAL_SUBJECT_CAP,
  ESTABLISHING_SHOT: WIDE_SHOT_EDITORIAL_SUBJECT_CAP,
  CUTAWAY: WIDE_SHOT_EDITORIAL_SUBJECT_CAP,
};

/** Default cap when shot type is unset — conservative medium framing. */
export const DEFAULT_EDITORIAL_SUBJECT_CAP = EDITORIAL_SHOT_TYPE_SUBJECT_CAPS.MEDIUM_SHOT;

export function isEditorialShotType(value: string | null | undefined): value is EditorialShotType {
  if (!value) return false;
  return value in EDITORIAL_SHOT_TYPE_SUBJECT_CAPS;
}

/** Maximum subject count for an editorial (assignment) shot type. */
export function subjectCapForEditorialShotType(
  shotType: string | null | undefined,
): number {
  if (shotType && isEditorialShotType(shotType)) {
    return EDITORIAL_SHOT_TYPE_SUBJECT_CAPS[shotType];
  }
  return DEFAULT_EDITORIAL_SUBJECT_CAP;
}

export interface CapSubjectIdsOptions {
  /** IDs listed first are kept when trimming (e.g. focal subjects). */
  priorityIds?: number[];
}

/**
 * Trim a subject-id list to the editorial cap for the given shot type.
 * Preserves order: priority IDs first, then remaining IDs in input order.
 */
export function capSubjectIds(
  ids: number[],
  shotType: string | null | undefined,
  options?: CapSubjectIdsOptions,
): number[] {
  const cap = subjectCapForEditorialShotType(shotType);
  if (!Number.isFinite(cap) || ids.length <= cap) return ids;

  const seen = new Set<number>();
  const ordered: number[] = [];

  const push = (id: number) => {
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };

  for (const id of options?.priorityIds ?? []) {
    if (ids.includes(id)) push(id);
  }
  for (const id of ids) {
    push(id);
  }

  return ordered.slice(0, cap);
}

/** Human-readable hint for UI when a shot type limits subject count. */
export function editorialSubjectCapLabel(shotType: string | null | undefined): string | null {
  const cap = subjectCapForEditorialShotType(shotType);
  if (!Number.isFinite(cap)) return null;
  const label = shotType?.replace(/_/g, ' ').toLowerCase() ?? 'this shot type';
  return `${label} supports up to ${cap} subject${cap === 1 ? '' : 's'}.`;
}

// ─── Framing contract (focal-subject distance + shot coupling) ─────────

/** Shot types that map 1:1 to floor-plan geometry; unset also follows geometry. */
export const GEOMETRIC_EDITORIAL_SHOT_TYPES = new Set<string>([
  'ESTABLISHING_SHOT',
  'WIDE_SHOT',
  'MEDIUM_SHOT',
  'CLOSE_UP',
  'EXTREME_CLOSE_UP',
]);

export type ShotCoupling = 'linked' | 'pinned';

export function isGeometricEditorialShot(shotType: string | null | undefined): boolean {
  if (!shotType) return true;
  return GEOMETRIC_EDITORIAL_SHOT_TYPES.has(shotType);
}

export function normalizeShotCoupling(
  value: string | null | undefined,
): ShotCoupling | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === 'linked') return 'linked';
  if (lower === 'pinned') return 'pinned';
  return null;
}

export function resolveShotCoupling(
  currentShotType: string | null | undefined,
  explicitCoupling?: string | null,
): ShotCoupling {
  if (!isGeometricEditorialShot(currentShotType)) return 'pinned';
  const normalized = normalizeShotCoupling(explicitCoupling);
  if (normalized) return normalized;
  return 'linked';
}

export interface FramingSubject {
  id: number;
  x: number;
  y: number;
  name?: string;
  /** Crowd / guest groups are background context, not focal framing drivers. */
  isGuestLike?: boolean;
}

export interface FramingCamera {
  x: number;
  y: number;
  rotation: number;
  fovDegrees?: number | null;
}

const GUEST_LIKE_NAME = /guest|crowd|congregation|audience/i;

export function isGuestLikeSubjectName(name: string | null | undefined): boolean {
  return GUEST_LIKE_NAME.test((name ?? '').trim());
}

export function canvasDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * Bearing from (cx, cy) toward (sx, sy) in floor-plan degrees.
 * 0° = north/up, 90° = east/right (Y-down canvas, clockwise).
 */
export function angleToPointDeg(cx: number, cy: number, sx: number, sy: number): number {
  const dx = sx - cx;
  const dy = sy - cy;
  return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
}

/** Aim rotation toward the centroid of one or more points. */
export function rotationTowardPointsDeg(
  cx: number,
  cy: number,
  points: Array<{ x: number; y: number }>,
): number | null {
  if (points.length === 0) return null;
  const centroidX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centroidY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return Math.round(angleToPointDeg(cx, cy, centroidX, centroidY));
}

/** True when every subject point lies within the camera half-FOV cone. */
export function subjectsFitInFov(
  camera: FramingCamera,
  subjectPoints: Array<{ x: number; y: number }>,
): boolean {
  if (subjectPoints.length === 0) return true;
  const fov = Math.min(120, Math.max(10, camera.fovDegrees ?? DEFAULT_CAMERA_FOV_DEGREES));
  const halfFov = fov / 2;
  return subjectPoints.every((s) => {
    const angle = angleToPointDeg(camera.x, camera.y, s.x, s.y);
    const dev = Math.abs(((angle - camera.rotation + 540) % 360) - 180);
    return dev <= halfFov;
  });
}

/**
 * Focal subjects drive shot-size classification. Prefer the first 1–2
 * editorial targets that are not guest-like crowds.
 */
export function resolveFocalSubjectIds(
  subjectIds: number[],
  subjectsById: Map<number, FramingSubject>,
  maxFocal = 2,
): number[] {
  const focal: number[] = [];
  for (const id of subjectIds) {
    if (focal.length >= maxFocal) break;
    const subj = subjectsById.get(id);
    if (!subj) continue;
    if (subj.isGuestLike ?? isGuestLikeSubjectName(subj.name)) continue;
    focal.push(id);
  }
  if (focal.length === 0 && subjectIds.length > 0) {
    return subjectIds.slice(0, maxFocal);
  }
  return focal;
}

export function inferShotTypeFromFocalSubjects(
  camera: Pick<FramingCamera, 'x' | 'y' | 'fovDegrees'>,
  focalSubjects: FramingSubject[],
  currentShotType?: string | null,
): InferredShotType {
  if (focalSubjects.length === 0) return 'ESTABLISHING_SHOT';
  const distances = focalSubjects.map((s) => canvasDistance(camera.x, camera.y, s.x, s.y));
  if (currentShotType && isGeometricEditorialShot(currentShotType)) {
    return inferShotTypeWithHysteresis(distances, camera.fovDegrees, currentShotType);
  }
  return inferShotTypeFromDistances(distances, camera.fovDegrees);
}

export function subjectsInCameraFov(
  camera: FramingCamera,
  subjects: FramingSubject[],
): FramingSubject[] {
  const fov = Math.min(120, Math.max(10, camera.fovDegrees ?? DEFAULT_CAMERA_FOV_DEGREES));
  const halfFov = fov / 2;
  return subjects.filter((s) => {
    const angle = angleToPointDeg(camera.x, camera.y, s.x, s.y);
    const dev = Math.abs(((angle - camera.rotation + 540) % 360) - 180);
    return dev <= halfFov;
  });
}

export interface ComputeFramingInput {
  camera: FramingCamera;
  subjects: FramingSubject[];
  subjectIds: number[];
  currentShotType?: string | null;
  /** Explicit persisted coupling; when unset, derived from shot type. */
  shotCoupling?: string | null;
}

export interface ComputeFramingResult {
  geometricShot: InferredShotType;
  resolvedShot: string;
  shotCoupling: ShotCoupling;
  shouldPersistShot: boolean;
  focalSubjectIds: number[];
  trimmedSubjectIds: number[];
  visibleSubjectIds: number[];
  focalDistance: number | null;
}

export function computeFraming(input: ComputeFramingInput): ComputeFramingResult {
  const subjectsById = new Map(input.subjects.map((s) => [s.id, s]));
  const focalSubjectIds = resolveFocalSubjectIds(input.subjectIds, subjectsById);
  const focalSubjects = focalSubjectIds
    .map((id) => subjectsById.get(id))
    .filter((s): s is FramingSubject => s != null);

  const shotCoupling = resolveShotCoupling(input.currentShotType, input.shotCoupling);
  const geometricShot = inferShotTypeFromFocalSubjects(
    input.camera,
    focalSubjects,
    shotCoupling === 'linked' ? input.currentShotType : undefined,
  );
  const resolvedShot =
    shotCoupling === 'linked'
      ? geometricShot
      : (input.currentShotType ?? geometricShot);

  const visibleSubjectIds = subjectsInCameraFov(input.camera, input.subjects).map((s) => s.id);
  const trimmedSubjectIds = capSubjectIds(input.subjectIds, resolvedShot, {
    priorityIds: focalSubjectIds,
  });

  const focalDistance =
    focalSubjects.length > 0
      ? Math.min(...focalSubjects.map((s) => canvasDistance(input.camera.x, input.camera.y, s.x, s.y)))
      : null;

  return {
    geometricShot,
    resolvedShot,
    shotCoupling,
    shouldPersistShot: shotCoupling === 'linked',
    focalSubjectIds,
    trimmedSubjectIds,
    visibleSubjectIds,
    focalDistance,
  };
}

/** Compact badge label for floor-plan camera markers. */
export function shotTypeAbbrev(shotType: string | null | undefined): string {
  if (!shotType) return '—';
  const map: Record<string, string> = {
    ESTABLISHING_SHOT: 'ES',
    WIDE_SHOT: 'WS',
    MEDIUM_SHOT: 'MS',
    CLOSE_UP: 'CU',
    EXTREME_CLOSE_UP: 'ECU',
    TWO_SHOT: '2S',
    REACTION_SHOT: 'RX',
    OVER_SHOULDER: 'O/S',
    DETAIL_SHOT: 'DT',
    INSERT_SHOT: 'INS',
    MASTER_SHOT: 'MST',
    CUTAWAY: 'CUT',
  };
  return map[shotType] ?? shotType.slice(0, 3).toUpperCase();
}
