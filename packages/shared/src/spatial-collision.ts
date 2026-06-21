/**
 * Deterministic spatial collision resolution shared by the blueprint
 * placement seed (backend), the AI blocking guardrails (backend), and the
 * Day Designer floor-plan preview (frontend). Operates on the normalized
 * 0–1000 canvas.
 */

export interface CollisionSubjectPoint {
  x: number;
  y: number;
  /** Seated subjects are treated as immovable for the separation pass (they occupy assigned seats). */
  seated?: boolean | null;
  /** Explicitly immovable (e.g. fixed context crowd groups). */
  fixed?: boolean;
}

export interface CollisionObjectRect {
  object_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResolveSpatialCollisionsOptions {
  /** Minimum centroid distance between any two subjects. Default 40. */
  minSeparation?: number;
  /** Margin kept between a subject and solid furniture edges. Default 14. */
  furnitureMargin?: number;
  /** Canvas bounds the subjects are clamped into. Default 72..928. */
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  /** Max iterative passes. Default 10. */
  maxPasses?: number;
}

export interface ResolveSpatialCollisionsResult {
  /** Number of subjects whose position changed. */
  movedCount: number;
}

export const SUBJECT_MIN_SEPARATION = 40;

/**
 * Object types a standing subject cannot occupy. Walkable surfaces
 * (AISLE, STAGE, DANCE_FLOOR, CHAIR_ROW, DOOR, WINDOW, LABEL, DECORATIVE)
 * are intentionally excluded.
 */
export const SOLID_OBJECT_TYPES: ReadonlySet<string> = new Set([
  'WALL',
  'ALTAR',
  'TABLE_HEAD',
  'TABLE_ROUND',
  'TABLE_RECT',
  'BAR',
  'DJ_BOOTH',
  'FURNITURE',
]);

const DEFAULT_BOUNDS = { minX: 72, minY: 72, maxX: 928, maxY: 928 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Push a point out of an axis-aligned rectangle (expanded by `margin`)
 * through the nearest face. Returns null when the point is not inside.
 */
function pushOutOfRect(
  x: number,
  y: number,
  rect: CollisionObjectRect,
  margin: number,
): { x: number; y: number } | null {
  const minX = rect.x - margin;
  const minY = rect.y - margin;
  const maxX = rect.x + rect.width + margin;
  const maxY = rect.y + rect.height + margin;
  if (x <= minX || x >= maxX || y <= minY || y >= maxY) return null;

  const dLeft = x - minX;
  const dRight = maxX - x;
  const dTop = y - minY;
  const dBottom = maxY - y;
  const min = Math.min(dLeft, dRight, dTop, dBottom);
  if (min === dLeft) return { x: minX, y };
  if (min === dRight) return { x: maxX, y };
  if (min === dTop) return { x, y: minY };
  return { x, y: maxY };
}

/**
 * Resolve furniture overlaps and subject–subject separation in place.
 *
 * - Subjects inside solid furniture are pushed out through the nearest face.
 * - Any pair closer than `minSeparation` is pushed apart; `fixed` and
 *   `seated` subjects act as immovable obstacles (the movable subject takes
 *   the full displacement).
 * - All movable subjects are clamped into `bounds`.
 */
export function resolveSpatialCollisions<T extends CollisionSubjectPoint>(
  subjects: T[],
  objects: CollisionObjectRect[],
  options: ResolveSpatialCollisionsOptions = {},
): ResolveSpatialCollisionsResult {
  const minSep = options.minSeparation ?? SUBJECT_MIN_SEPARATION;
  const margin = options.furnitureMargin ?? 14;
  const bounds = options.bounds ?? DEFAULT_BOUNDS;
  const maxPasses = options.maxPasses ?? 10;

  const solidRects = objects.filter((o) => SOLID_OBJECT_TYPES.has(o.object_type));
  const isMovable = (s: CollisionSubjectPoint) => !s.fixed && !s.seated;
  const original = subjects.map((s) => ({ x: s.x, y: s.y }));

  for (let pass = 0; pass < maxPasses; pass++) {
    let moved = false;

    // 1. Push movable subjects out of solid furniture.
    for (const subject of subjects) {
      if (!isMovable(subject)) continue;
      for (const rect of solidRects) {
        const pushed = pushOutOfRect(subject.x, subject.y, rect, margin);
        if (pushed) {
          subject.x = clamp(pushed.x, bounds.minX, bounds.maxX);
          subject.y = clamp(pushed.y, bounds.minY, bounds.maxY);
          moved = true;
        }
      }
    }

    // 2. Pairwise separation.
    for (let i = 0; i < subjects.length; i++) {
      for (let j = i + 1; j < subjects.length; j++) {
        const a = subjects[i];
        const b = subjects[j];
        const aMovable = isMovable(a);
        const bMovable = isMovable(b);
        if (!aMovable && !bMovable) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= minSep) continue;

        if (dist === 0) {
          const target = bMovable ? b : a;
          target.x = clamp(target.x + minSep * 0.707, bounds.minX, bounds.maxX);
          target.y = clamp(target.y + minSep * 0.707, bounds.minY, bounds.maxY);
          moved = true;
          continue;
        }

        const overlap = minSep - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        if (aMovable && bMovable) {
          a.x = clamp(a.x - nx * (overlap / 2), bounds.minX, bounds.maxX);
          a.y = clamp(a.y - ny * (overlap / 2), bounds.minY, bounds.maxY);
          b.x = clamp(b.x + nx * (overlap / 2), bounds.minX, bounds.maxX);
          b.y = clamp(b.y + ny * (overlap / 2), bounds.minY, bounds.maxY);
        } else if (aMovable) {
          a.x = clamp(a.x - nx * overlap, bounds.minX, bounds.maxX);
          a.y = clamp(a.y - ny * overlap, bounds.minY, bounds.maxY);
        } else {
          b.x = clamp(b.x + nx * overlap, bounds.minX, bounds.maxX);
          b.y = clamp(b.y + ny * overlap, bounds.minY, bounds.maxY);
        }
        moved = true;
      }
    }

    if (!moved) break;
  }

  // 3. Final bounds clamp + rounding for movable subjects.
  let movedCount = 0;
  subjects.forEach((subject, index) => {
    if (isMovable(subject)) {
      subject.x = clamp(Math.round(subject.x), bounds.minX, bounds.maxX);
      subject.y = clamp(Math.round(subject.y), bounds.minY, bounds.maxY);
    }
    if (subject.x !== original[index].x || subject.y !== original[index].y) {
      movedCount += 1;
    }
  });

  return { movedCount };
}

// ─── Polygon helpers (zone containment) ─────────────────────────────

export interface PolygonPoint {
  x: number;
  y: number;
}

/** Ray-casting point-in-polygon test. */
export function pointInPolygon(x: number, y: number, polygon: PolygonPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function nearestPointOnSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): PolygonPoint {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return { x: ax, y: ay };
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1);
  return { x: ax + t * abx, y: ay + t * aby };
}

/**
 * Nearest point strictly inside a polygon. If `(x, y)` is already inside,
 * it is returned unchanged; otherwise the nearest point on the polygon
 * boundary is found and inset toward the centroid by `inset` units.
 */
export function nearestPointInPolygon(
  x: number,
  y: number,
  polygon: PolygonPoint[],
  inset = 12,
): PolygonPoint {
  if (polygon.length < 3 || pointInPolygon(x, y, polygon)) {
    return { x: Math.round(x), y: Math.round(y) };
  }

  let best: PolygonPoint = { x: polygon[0].x, y: polygon[0].y };
  let bestDist = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const candidate = nearestPointOnSegment(x, y, polygon[j].x, polygon[j].y, polygon[i].x, polygon[i].y);
    const dist = Math.hypot(candidate.x - x, candidate.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  const centroid = polygonCentroid(polygon);
  const toCx = centroid.x - best.x;
  const toCy = centroid.y - best.y;
  const len = Math.hypot(toCx, toCy);
  if (len > 0 && inset > 0) {
    const step = Math.min(inset, len);
    best = { x: best.x + (toCx / len) * step, y: best.y + (toCy / len) * step };
  }
  return { x: Math.round(best.x), y: Math.round(best.y) };
}

/** Arithmetic centroid of a polygon's vertices. */
export function polygonCentroid(polygon: PolygonPoint[]): PolygonPoint {
  const n = Math.max(polygon.length, 1);
  return {
    x: Math.round(polygon.reduce((s, p) => s + p.x, 0) / n),
    y: Math.round(polygon.reduce((s, p) => s + p.y, 0) / n),
  };
}

/** Distance from a point to a polygon's axis-aligned bounding box (0 when inside the bbox). */
export function distanceToPolygonBBox(x: number, y: number, polygon: PolygonPoint[]): number {
  const minX = Math.min(...polygon.map((p) => p.x));
  const maxX = Math.max(...polygon.map((p) => p.x));
  const minY = Math.min(...polygon.map((p) => p.y));
  const maxY = Math.max(...polygon.map((p) => p.y));
  const dx = Math.max(minX - x, 0, x - maxX);
  const dy = Math.max(minY - y, 0, y - maxY);
  return Math.hypot(dx, dy);
}
