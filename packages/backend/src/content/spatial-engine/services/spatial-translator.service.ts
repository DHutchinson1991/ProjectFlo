import { Injectable, Logger } from '@nestjs/common';

// ─── Public types ────────────────────────────────────────────────────

/** A subject's position on the 0-1000 floorplan canvas. */
export interface FloorSubject {
  name: string;
  x: number;
  y: number;
  isGroup: boolean;
  /** Group headcount (e.g. 100 guests). Used to spread group subjects across chair rows. */
  count?: number;
  /** Facing direction in degrees (0 = north/up). Optional — not all sources track it. */
  rotation?: number;
  /** PackageDaySubject.id — used to write subject_ids back to camera assignments. */
  daySubjectId?: number;
  /**
   * Whether the subject is currently seated. Seated subjects render shorter
   * in the camera preview so cameras read over them rather than being
   * occluded, and they do not count as view blockers for subjects behind.
   * When omitted, the translator infers a sensible default (e.g. group
   * "Guests" subject in a *_seating zone).
   */
  seated?: boolean;
}

/** A physical object on the 0-1000 floorplan canvas. */
export interface FloorObject {
  type: string; // FloorPlanObjectType enum value
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees, 0=north
  /** Optional structured metadata (e.g. CHAIR_ROW: { seat_cols, side, row_index, capacity }). */
  metadata?: Record<string, unknown> | null;
}

/** Camera position + orientation on the floorplan. */
export interface FloorCamera {
  x: number;
  y: number;
  /** Rotation in degrees. 0 = north, 90 = east, 180 = south, 270 = west. */
  rotation: number;
  /** Horizontal field-of-view angle in degrees. Default 60. */
  fovDegrees?: number;
}

/** A subject projected into the camera's frame (normalised 0-1). */
export interface FrameSubject {
  name: string;
  isGroup: boolean;
  /** PackageDaySubject.id — passed through from FloorSubject. */
  daySubjectId?: number;
  /** Whether this subject is an editorial target of the camera (in subject_ids). */
  isTargeted: boolean;
  /** Whether the subject is seated (renders shorter, doesn't block cameras). */
  seated: boolean;
  /**
   * Effective render height as a fraction of full standing height at this
   * distance. 1.0 = full height, 0.48 = seated. Used by the overlay and by
   * occlusion checks so a seated subject does not block taller subjects
   * behind them.
   */
  effectiveHeight: number;
  /**
   * Name of the closer subject blocking this one from the camera, or null
   * when this subject has a clear line of sight. A seated subject is never
   * considered a blocker (cameras read over it).
   */
  occludedBy: string | null;
  /** Horizontal position in frame. 0 = left edge, 0.5 = center, 1 = right edge. */
  frameX: number;
  /** Scale factor: 1.0 = fills the frame height, 0.1 = tiny in background. */
  scale: number;
  /** Euclidean distance on the floorplan from camera to subject. */
  distance: number;
  /** Human-readable depth bucket. */
  depth: 'extreme-foreground' | 'foreground' | 'mid-ground' | 'background' | 'far-background';
  /** Human-readable horizontal position. */
  side: 'far-left' | 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'far-right';
  /**
   * Facing direction relative to the camera's look vector, in degrees, -180…180.
   *   0   → subject faces the same direction as the camera (i.e. faces AWAY from viewer)
   *  180  → subject faces the camera head-on
   *  +90  → subject faces the camera's right side of frame
   *  -90  → subject faces the camera's left side of frame
   * `null` when the source row has no rotation.
   */
  facingRelative: number | null;
}

/** Full spatial translation result for one camera view. */
export interface SpatialFrame {
  /** Subjects within the camera's FOV, projected to frame coordinates. */
  visibleSubjects: FrameSubject[];
  /** Physical objects within/near the camera's FOV, projected to frame quadrilaterals. */
  visibleObjects: FrameObject[];
  /** Inferred shot type from median subject distance. */
  inferredShotType: string;
  /** Camera-to-subject summary for logging. */
  summary: string;
}

/** A physical object projected into the camera's frame as a perspective quadrilateral. */
export interface FrameObject {
  type: string;
  label?: string;
  /** 4 projected corners in normalized frame coords (frameX 0-1, scale 0-1). */
  corners: { frameX: number; scale: number }[];
  /** Center distance from camera. */
  distance: number;
  /** Height as a ratio of person height (0 = flat, 0.5 = half-person, 1.5 = tall arch). */
  height: number;
}

// ─── Constants ───────────────────────────────────────────────────────

/** Object height as a ratio of person height (~170 cm). */
const OBJECT_HEIGHT_RATIO: Record<string, number> = {
  CHAIR_ROW: 0.30,     // ~52 cm — reads as a low bench line, not a wall
  TABLE_ROUND: 0.44,   // ~75 cm table
  TABLE_RECT: 0.44,
  TABLE_HEAD: 0.44,
  ARCH: 1.47,          // ~250 cm wedding arch
  ALTAR: 0.65,         // ~110 cm altar / podium
  STAGE: 0.24,         // ~40 cm raised platform
  AISLE: 0,
  DANCE_FLOOR: 0,
  WALL: 1.65,          // ~280 cm
  DOOR: 1.24,          // ~210 cm
  WINDOW: 0.88,        // ~150 cm sill-to-top
  BAR: 0.65,           // ~110 cm counter
  DJ_BOOTH: 0.71,      // ~120 cm
  FURNITURE: 0.53,
  DECORATIVE: 0.59,    // ~100 cm
  LABEL: 0,
};

/** Distance thresholds on the 0-1000 canvas → depth bucket. */
const DEPTH_THRESHOLDS = [
  { max: 80, depth: 'extreme-foreground' as const },
  { max: 150, depth: 'foreground' as const },
  { max: 300, depth: 'mid-ground' as const },
  { max: 500, depth: 'background' as const },
] as const;

/** Distance → inferred shot type. */
const SHOT_TYPE_THRESHOLDS = [
  { max: 80, type: 'EXTREME_CLOSE_UP' },
  { max: 130, type: 'CLOSE_UP' },
  { max: 200, type: 'MEDIUM_SHOT' },
  { max: 300, type: 'WIDE_SHOT' },
] as const;

/**
 * Default "seated" inference when the source data doesn't carry an explicit
 * flag. Keeps the common sandbox case correct (Guests / Congregation are
 * seated during the ceremony) without needing a DB migration.
 */
function inferSeated(s: FloorSubject): boolean {
  const n = s.name.toLowerCase().trim();
  if (/^(guests?|crowd|congregation|audience)$/.test(n)) return true;
  return false;
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class SpatialTranslatorService {
  private readonly logger = new Logger(SpatialTranslatorService.name);

  /**
   * Project floorplan subjects through a camera's field of view into
   * normalised frame coordinates (0-1 horizontal, distance-based scale).
   *
   * Only subjects within the camera's FOV cone are included.
   *
   * @param isUnmanned - When true, the camera is unmanned/static. Occlusion
   *   warnings are suppressed because repositioning is not possible at shoot
   *   time and the operator cannot react to blocking in the moment.
   */
  translate(
    camera: FloorCamera,
    subjects: FloorSubject[],
    targetedSubjectIds?: number[],
    options?: { isUnmanned?: boolean },
  ): SpatialFrame {
    const targetedSet = new Set(targetedSubjectIds ?? []);
    const isUnmanned = options?.isUnmanned ?? false;
    const fov = camera.fovDegrees ?? 60;
    const halfFov = fov / 2;

    // Camera facing direction in radians (floorplan: 0° = north/up = -Y).
    // Convert to math angle where 0 = right (+X).
    const facingRad = ((90 - camera.rotation) * Math.PI) / 180;

    const projected: FrameSubject[] = [];

    for (const s of subjects) {
      const dx = s.x - camera.x;
      // Floorplan Y is inverted (0 = top), so dy points "downward" on screen.
      // For angle calculation we flip so +Y = upward (math convention).
      const dy = -(s.y - camera.y);
      const distance = Math.hypot(dx, dy);
      if (distance < 1) continue; // on top of camera — skip

      // Angle from camera to subject (math convention: 0 = right, CCW positive).
      const angleToSubject = Math.atan2(dy, dx);

      // Signed angular offset from camera facing direction.
      let offset = angleToSubject - facingRad;
      // Normalise to [-PI, PI].
      offset = Math.atan2(Math.sin(offset), Math.cos(offset));
      const offsetDeg = (offset * 180) / Math.PI;

      // Skip subjects outside the FOV cone.
      if (Math.abs(offsetDeg) > halfFov) continue;

      // Frame X: -halfFov → 0.0, 0 → 0.5, +halfFov → 1.0
      const frameX = Math.max(0, Math.min(1, 0.5 - offsetDeg / fov));

      // Scale: inverse proportional to distance; clamped.
      // At distance 50 → scale ~1.0 (fills frame); at 600 → scale ~0.08.
      const scale = Math.max(0.05, Math.min(1.0, 50 / distance));

      const depth = this.distanceToDepth(distance);
      const side = this.frameXToSide(frameX);

      // Subject facing relative to camera: delta between subject world rotation
      // and camera world rotation, normalised to [-180, 180].
      let facingRelative: number | null = null;
      if (s.rotation != null) {
        let rel = s.rotation - camera.rotation;
        rel = ((rel + 180) % 360 + 360) % 360 - 180;
        facingRelative = Math.round(rel);
      }

      projected.push({
        name: s.name,
        isGroup: s.isGroup,
        daySubjectId: s.daySubjectId,
        isTargeted: s.daySubjectId != null && targetedSet.has(s.daySubjectId),
        seated: s.seated ?? inferSeated(s),
        effectiveHeight: 1.0,   // filled in after projection pass
        occludedBy: null,       // filled in after projection pass
        frameX: Math.round(frameX * 100) / 100,
        scale: Math.round(scale * 100) / 100,
        distance: Math.round(distance),
        depth,
        side,
        facingRelative,
      });
    }

    // Sort by distance (closest first) for natural prompt ordering.
    projected.sort((a, b) => a.distance - b.distance);

    // ── Occlusion pass ────────────────────────────────────────────────
    // A subject is occluded when a closer, taller subject stands between
    // it and the camera in a narrow horizontal band. Seated subjects are
    // short enough that cameras read OVER them, so they never count as
    // blockers. Standing subjects block standing or seated subjects
    // directly behind them.
    const OCCLUSION_FRAME_TOL = 0.05; // ~5% of frame width
    for (const s of projected) {
      s.effectiveHeight = s.seated ? 0.48 : 1.0;
    }
    for (let i = 0; i < projected.length; i++) {
      const s = projected[i];
      for (let j = 0; j < i; j++) {
        const closer = projected[j];
        if (closer.seated) continue;              // seated never blocks
        if (closer.distance >= s.distance) continue;
        if (Math.abs(closer.frameX - s.frameX) > OCCLUSION_FRAME_TOL) continue;
        // Closer standing subject roughly aligned horizontally → blocks this one.
        s.occludedBy = closer.name;
        break;
      }
    }

    // Classify occlusion severity:
    //  - "minor": the blocker is ALSO a targeted subject → intentional artistic overlap
    //    (e.g. Bride in front of Groom at the altar). These are composition choices, not errors.
    //  - "major": the blocker is a non-targeted (background) subject blocking a key target.
    //    This is a genuine coverage problem worth flagging.
    const targetedNames = new Set(projected.filter((s) => s.isTargeted).map((s) => s.name));
    const occludedTargets = projected.filter((s) => s.isTargeted && s.occludedBy);
    const majorOcclusions = occludedTargets.filter((s) => !targetedNames.has(s.occludedBy!));

    if (majorOcclusions.length > 0) {
      if (isUnmanned) {
        this.logger.debug(
          `Unmanned camera: ${majorOcclusions.length} targeted subject(s) blocked by non-targeted subjects (no operator to reframe): ${majorOcclusions.map((s) => `${s.name} blocked by ${s.occludedBy}`).join('; ')}.`,
        );
      } else {
        this.logger.warn(
          `Targeted subject(s) blocked by non-targeted subjects: ${majorOcclusions
            .map((s) => `${s.name} blocked by ${s.occludedBy}`)
            .join('; ')} — camera may miss these subjects.`,
        );
      }
    }

    // For unmanned cameras (static/locked-off), no operator is present to
    // reframe or react to blocking. Clear occludedBy so downstream consumers
    // (ShotDirectorService) don't generate actionable occlusion notes.
    if (isUnmanned) {
      for (const s of projected) {
        s.occludedBy = null;
      }
    }

    const inferredShotType = this.inferShotType(projected, camera);
    const summary = this.buildSummary(projected, inferredShotType);

    return { visibleSubjects: projected, visibleObjects: [], inferredShotType, summary };
  }

  /**
   * Project floorplan objects (furniture, architecture) through the camera FOV.
   * Each object is a rotated rectangle; we project its 4 corners to get a
   * perspective quadrilateral in frame space.
   */
  translateObjects(camera: FloorCamera, objects: FloorObject[]): FrameObject[] {
    const fov = camera.fovDegrees ?? 60;
    const halfFov = fov / 2;
    const facingRad = ((90 - camera.rotation) * Math.PI) / 180;
    const result: FrameObject[] = [];

    for (const obj of objects) {
      // Object x/y is top-left corner (Fabric.js convention) → compute center
      const cx = obj.x + obj.width / 2;
      const cy = obj.y + obj.height / 2;

      // Compute 4 corners of the rotated rectangle on the floorplan
      const rad = (obj.rotation * Math.PI) / 180;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      const hw = obj.width / 2;
      const hh = obj.height / 2;

      const cornerOffsets: [number, number][] = [
        [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
      ];
      const projectedCorners: { frameX: number; scale: number }[] = [];
      let anyVisible = false;

      for (const [lx, ly] of cornerOffsets) {
        const worldX = cx + lx * cosR - ly * sinR;
        const worldY = cy + lx * sinR + ly * cosR;
        const p = this.projectPoint(worldX, worldY, camera, facingRad, fov, halfFov);
        if (p) {
          projectedCorners.push(p);
          if (p.frameX >= 0 && p.frameX <= 1) anyVisible = true;
        }
      }

      // Need at least 3 projected corners and at least 1 in frame
      if (projectedCorners.length < 3 || !anyVisible) continue;

      const centerDist = Math.hypot(cx - camera.x, cy - camera.y);

      result.push({
        type: obj.type,
        label: obj.label,
        corners: projectedCorners,
        distance: Math.round(centerDist),
        height: OBJECT_HEIGHT_RATIO[obj.type] ?? 0,
      });
    }

    return result.sort((a, b) => b.distance - a.distance);
  }

  /**
   * Project a single floorplan point through the camera FOV.
   * Returns { frameX, scale } or null if behind camera.
   */
  private projectPoint(
    px: number, py: number,
    camera: FloorCamera,
    facingRad: number, fov: number, halfFov: number,
  ): { frameX: number; scale: number } | null {
    const dx = px - camera.x;
    const dy = -(py - camera.y);
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return null;

    const angle = Math.atan2(dy, dx);
    let offset = angle - facingRad;
    offset = Math.atan2(Math.sin(offset), Math.cos(offset));
    const offsetDeg = (offset * 180) / Math.PI;

    // Allow slightly outside FOV for partial objects (clamp rather than skip)
    if (Math.abs(offsetDeg) > halfFov * 1.5) return null;

    const frameX = 0.5 - offsetDeg / fov;
    const scale = Math.max(0.02, Math.min(1.0, 50 / distance));

    return {
      frameX: Math.round(frameX * 1000) / 1000,
      scale: Math.round(scale * 1000) / 1000,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private distanceToDepth(distance: number): FrameSubject['depth'] {
    for (const t of DEPTH_THRESHOLDS) {
      if (distance <= t.max) return t.depth;
    }
    return 'far-background';
  }

  private frameXToSide(frameX: number): FrameSubject['side'] {
    if (frameX < 0.1) return 'far-left';
    if (frameX < 0.25) return 'left';
    if (frameX < 0.4) return 'center-left';
    if (frameX < 0.6) return 'center';
    if (frameX < 0.75) return 'center-right';
    if (frameX < 0.9) return 'right';
    return 'far-right';
  }

  private inferShotType(subjects: FrameSubject[], camera: FloorCamera): string {
    if (subjects.length === 0) return 'ESTABLISHING_SHOT';
    const framingScale = (camera.fovDegrees ?? 60) / 60;
    const distances = subjects.map((s) => s.distance * framingScale);
    const median = distances.sort((a, b) => a - b)[Math.floor(distances.length / 2)];
    for (const t of SHOT_TYPE_THRESHOLDS) {
      if (median <= t.max) return t.type;
    }
    return 'ESTABLISHING_SHOT';
  }

  private buildSummary(subjects: FrameSubject[], shotType: string): string {
    if (subjects.length === 0) return `${shotType}: no subjects in FOV`;
    const parts = subjects.map(
      (s) => `${s.name}(${s.side}, ${s.depth}, d=${s.distance})`,
    );
    return `${shotType}: ${parts.join(', ')}`;
  }
}
