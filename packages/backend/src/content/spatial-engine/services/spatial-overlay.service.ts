import { Injectable } from '@nestjs/common';
import { FrameSubject, FrameObject, SpatialFrame } from './spatial-translator.service';

/** SVG render dimensions — matches camera viewfinder aspect ratio (16:9-ish). */
const W = 896;
const H = 576;

/** Rule-of-thirds divisions. */
const THIRD_X = [W / 3, (2 * W) / 3];
const THIRD_Y = [H / 3, (2 * H) / 3];

/** Three-tone subject palette. */
const COLOR_COUPLE        = '#f472b6'; // rose  — bride & groom
const COLOR_WEDDING_PARTY = '#a78bfa'; // purple — family, officiant, party, etc.
const COLOR_GUESTS        = '#94a3b8'; // slate  — generic guests / crowd

type RoleBucket = 'couple' | 'party' | 'guests';

/** Classify a subject name into a role bucket. */
function subjectRole(name: string): RoleBucket {
  const n = name.toLowerCase().trim();
  if (n === 'bride' || n === 'groom') return 'couple';
  if (/guest|crowd|congregation|audience/.test(n)) return 'guests';
  return 'party';
}

function subjectColor(name: string): string {
  const role = subjectRole(name);
  if (role === 'couple') return COLOR_COUPLE;
  if (role === 'guests') return COLOR_GUESTS;
  return COLOR_WEDDING_PARTY;
}

/**
 * Outline style per role bucket — subtle differentiator so the role
 * reads at a glance without labels.
 *   couple  → thicker solid
 *   party   → standard solid
 *   guests  → thin dashed
 */
function roleOutline(role: RoleBucket): { width: number; dashArray: string } {
  if (role === 'couple') return { width: 2.2, dashArray: '' };
  if (role === 'guests') return { width: 1.0, dashArray: '3,2' };
  return { width: 1.5, dashArray: '' };
}

// ── Perspective constants ────────────────────────────────────────────
const HORIZON_Y = 0.50;
const GROUND_Y  = 0.95;
const VP_X = W / 2;
const VP_Y = HORIZON_Y * H;
const FLOOR_BOTTOM = GROUND_Y * H;

// ── Figure sizing ────────────────────────────────────────────────────
// Subjects now shrink with distance so depth reads at a glance. The MIN
// floor is low enough that far-background figures become small markers;
// opacity (see depthOpacity) still reinforces the cue for readability.
const MAX_FIGURE_H = H * 0.46;
const MIN_FIGURE_H = H * 0.06;
const SHOULDER_RATIO = 0.15; // used only for ground-shadow sizing

/** Opacity encodes depth for non-targeted subjects. Targeted always 1.0. */
function depthOpacity(d: FrameSubject['depth']): number {
  if (d === 'extreme-foreground' || d === 'foreground') return 1.0;
  if (d === 'mid-ground') return 0.85;
  if (d === 'background') return 0.6;
  return 0.45; // far-background
}

// ── Furniture style per object type ──────────────────────────────────
const OBJ_STYLE: Record<string, { fill: string; stroke: string; icon?: string }> = {
  CHAIR_ROW:   { fill: 'rgba(148,163,184,0.22)', stroke: 'rgba(148,163,184,0.55)', icon: '▮▮▮' },
  TABLE_ROUND: { fill: 'rgba(168,162,158,0.18)', stroke: 'rgba(168,162,158,0.45)' },
  TABLE_RECT:  { fill: 'rgba(168,162,158,0.18)', stroke: 'rgba(168,162,158,0.45)' },
  TABLE_HEAD:  { fill: 'rgba(168,162,158,0.18)', stroke: 'rgba(168,162,158,0.45)' },
  ARCH:        { fill: 'rgba(217,180,130,0.22)', stroke: 'rgba(217,180,130,0.55)' },
  ALTAR:       { fill: 'rgba(217,180,130,0.22)', stroke: 'rgba(217,180,130,0.55)' },
  STAGE:       { fill: 'rgba(167,139,250,0.14)', stroke: 'rgba(167,139,250,0.40)' },
  AISLE:       { fill: 'rgba(255,255,255,0.09)', stroke: 'rgba(255,255,255,0.28)' },
  DANCE_FLOOR: { fill: 'rgba(251,191,36,0.06)', stroke: 'rgba(251,191,36,0.20)' },
  WALL:        { fill: 'rgba(100,116,139,0.15)', stroke: 'rgba(100,116,139,0.40)' },
  DOOR:        { fill: 'rgba(100,116,139,0.05)', stroke: 'rgba(100,116,139,0.20)' },
  DEFAULT:     { fill: 'rgba(148,163,184,0.08)', stroke: 'rgba(148,163,184,0.25)' },
};

// ── Depth zone definitions removed ────────────────────────────────────
// Previously rendered colored BG/MID/FG trapezoids as a "distance map".
// Distance is now communicated by subject scaling + opacity + the
// perspective floor grid alone — cleaner frame, less background noise.

export interface SpatialOverlayResult {
  svg: string;
  subjects: Array<{
    name: string;
    frameX: number;
    scale: number;
    depth: string;
    side: string;
    distance: number;
  }>;
  inferredShotType: string;
}

@Injectable()
export class SpatialOverlayService {
  /**
   * Generate an annotated visual overlay SVG from a SpatialFrame.
   * Shows: rule-of-thirds grid, labeled subject markers at projected
   * positions, depth bands, shot type badge.
   */
  generate(frame: SpatialFrame): SpatialOverlayResult {
    const els: string[] = [];

    // SVG style block — hover reveals the connector + bottom-rail pill
    // for each targeted subject. Keeps the frame uncluttered at rest.
    els.push(
      `<defs><style>` +
      `.subj-group .subj-connector,.subj-group .subj-pill{opacity:0;transition:opacity .18s ease;pointer-events:none;}` +
      `.subj-group:hover .subj-connector,.subj-group:hover .subj-pill{opacity:1;}` +
      `.subj-hit{cursor:pointer;}` +
      `</style></defs>`,
    );

    // Transparent background
    els.push(`<rect width="${W}" height="${H}" fill="none" />`);

    // Physical objects (furniture, architecture) — rendered BEHIND subjects
    this.renderObjects(els, frame.visibleObjects);

    // Rule-of-thirds grid (the only background grid). Can be toggled off
    // from the frontend via the `.sp-grid` CSS class hook.
    this.renderThirdsGrid(els);

    // Subject figures with labels
    this.renderSubjects(els, frame.visibleSubjects);

    // Shot type badge (top-left)
    this.renderShotBadge(els, frame.inferredShotType, frame.visibleSubjects.length);

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family: system-ui, -apple-system, sans-serif;">`,
      ...els,
      `</svg>`,
    ].join('\n');

    return {
      svg,
      subjects: frame.visibleSubjects.map((s) => ({
        name: s.name,
        frameX: +s.frameX.toFixed(2),
        scale: +s.scale.toFixed(2),
        depth: s.depth,
        side: s.side,
        distance: s.distance,
      })),
      inferredShotType: frame.inferredShotType,
    };
  }

  // ── Rendering helpers ──────────────────────────────────────────────

  /**
   * Render projected furniture/architecture as 3D boxes.
   * Each object has a ground footprint and a height — the top face is
   * shifted upward by a per-corner pixel height (proper foreshortening).
   */
  private renderObjects(els: string[], objects: FrameObject[]) {
    for (const obj of objects) {
      if (obj.corners.length < 3) continue;
      const style = OBJ_STYLE[obj.type] ?? OBJ_STYLE.DEFAULT;

      // Bottom corners (ground plane)
      const bottom = obj.corners.map((c) => ({
        x: c.frameX * W,
        y: scaleToY(c.scale),
      }));

      // Flat objects (aisle, dance floor, labels) — ground polygon only
      if (obj.height <= 0) {
        const pts = bottom.map((p) => `${r(p.x)},${r(p.y)}`).join(' ');
        els.push(
          `<polygon points="${pts}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="0.75" />`,
        );
        continue;
      }

      // Per-corner height in pixels — near corners appear taller (foreshortening)
      const top = obj.corners.map((c, i) => {
        const s = Math.max(0.02, c.scale);
        const pixelH = MAX_FIGURE_H * Math.sqrt(s) * obj.height;
        return { x: bottom[i].x, y: bottom[i].y - pixelH };
      });

      // Ground footprint (faint dashed)
      const bottomPts = bottom.map((p) => `${r(p.x)},${r(p.y)}`).join(' ');
      els.push(
        `<polygon points="${bottomPts}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="0.5" stroke-dasharray="3,3" />`,
      );

      // Side faces — each quad connects adjacent bottom→top edges
      for (let i = 0; i < bottom.length; i++) {
        const j = (i + 1) % bottom.length;
        const sidePts = [
          `${r(bottom[i].x)},${r(bottom[i].y)}`,
          `${r(bottom[j].x)},${r(bottom[j].y)}`,
          `${r(top[j].x)},${r(top[j].y)}`,
          `${r(top[i].x)},${r(top[i].y)}`,
        ].join(' ');
        els.push(
          `<polygon points="${sidePts}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="0.5" />`,
        );
      }

      // Top face (most visible — slightly brighter)
      const topPts = top.map((p) => `${r(p.x)},${r(p.y)}`).join(' ');
      const topFill = style.fill.replace(/[\d.]+\)$/, (m) => `${Math.min(1, parseFloat(m) * 1.8)})`);
      els.push(
        `<polygon points="${topPts}" fill="${topFill}" stroke="${style.stroke}" stroke-width="0.75" />`,
      );

      // Vertical edges at each corner
      for (let i = 0; i < bottom.length; i++) {
        els.push(
          `<line x1="${r(bottom[i].x)}" y1="${r(bottom[i].y)}" x2="${r(top[i].x)}" y2="${r(top[i].y)}" ` +
          `stroke="${style.stroke}" stroke-width="0.75" />`,
        );
      }

      // Label above the top face for significant objects
      if (obj.label && !obj.type.startsWith('CHAIR')) {
        const cx = top.reduce((s, p) => s + p.x, 0) / top.length;
        const cy = Math.min(...top.map((p) => p.y));
        const fontSize = obj.distance < 200 ? 10 : 8;
        els.push(
          `<text x="${r(cx)}" y="${r(cy - 4)}" text-anchor="middle" ` +
          `fill="${style.stroke.replace(/[\d.]+\)$/, '0.7)')}" font-size="${fontSize}" font-weight="500" ` +
          `style="text-shadow: 0 0 3px rgba(0,0,0,0.8)">${esc(obj.label)}</text>`,
        );
      }
    }
  }

  private renderThirdsGrid(els: string[]) {
    // Rule-of-thirds — the sole background grid. Rendered with enough
    // contrast to actually read against the dark preview, tagged with the
    // `sp-grid` class so the frontend playback toggle can hide it.
    els.push(`<g class="sp-grid">`);
    for (const x of THIRD_X) {
      els.push(
        `<line x1="${r(x)}" y1="0" x2="${r(x)}" y2="${H}" stroke="rgba(255,255,255,0.16)" stroke-width="1" />`,
      );
    }
    for (const y of THIRD_Y) {
      els.push(
        `<line x1="0" y1="${r(y)}" x2="${W}" y2="${r(y)}" stroke="rgba(255,255,255,0.16)" stroke-width="1" />`,
      );
    }
    // Power points — faint dots at intersections, same class so they
    // hide with the rest of the grid.
    for (const x of THIRD_X) {
      for (const y of THIRD_Y) {
        els.push(
          `<circle cx="${r(x)}" cy="${r(y)}" r="2.5" fill="rgba(255,255,255,0.22)" />`,
        );
      }
    }
    els.push(`</g>`);
  }

  private renderSubjects(els: string[], subjects: FrameSubject[]) {
    // Render far→near so nearer silhouettes paint over distant ones.
    const sorted = [...subjects].sort((a, b) => b.distance - a.distance);

    // Collect targeted subjects (left → right) for the bottom label rail.
    const targeted = sorted
      .filter((s) => s.isTargeted)
      .slice()
      .sort((a, b) => a.frameX - b.frameX);
    const slotCount = targeted.length;

    for (const s of sorted) {
      const role = subjectRole(s.name);
      const color = subjectColor(s.name);
      const scale = Math.max(0.05, s.scale);

      const footY = scaleToY(scale);
      const cx = s.frameX * W;
      // Standing height from projected scale. Seated subjects render at
      // ~48% of that so cameras read over them and they don't occlude
      // subjects in the background.
      const standingH = Math.max(MIN_FIGURE_H, MAX_FIGURE_H * Math.sqrt(scale));
      const figH = s.seated ? standingH * 0.48 : standingH;

      // Opacity encodes depth. Targeted subjects are always fully opaque.
      const opacity = s.isTargeted ? 1.0 : depthOpacity(s.depth);

      // ── Every subject gets a hover group so its connector + pill can
      //    reveal on hover. Targeted subjects also reserve a slot in the
      //    bottom label rail and render with gold text. ──
      const slotIdx = targeted.indexOf(s);
      const isTargeted = s.isTargeted && slotIdx >= 0;
      els.push(`<g class="subj-group${isTargeted ? ' subj-targeted' : ''}">`);

      // Ground shadow — thinner and darker when the subject is closer.
      const shadowRx = figH * SHOULDER_RATIO * 1.1;
      const shadowRy = Math.max(2, shadowRx * 0.18);
      els.push(
        `<ellipse cx="${r(cx)}" cy="${r(footY)}" rx="${r(shadowRx)}" ry="${r(shadowRy)}" ` +
        `fill="rgba(0,0,0,${r(0.35 * opacity)})" />`,
      );

      if (s.isGroup) {
        const gH = figH * 0.82;
        const spread = figH * SHOULDER_RATIO * 1.3;
        for (let g = -1; g <= 1; g++) {
          this.renderPerson(els, cx + g * spread, footY + Math.abs(g) * 3, gH, color, opacity, s.facingRelative, role);
        }
      } else {
        this.renderPerson(els, cx, footY, figH, color, opacity, s.facingRelative, role);
      }

      // Invisible hover-hit area — makes far/small figures easy to hit.
      const headCy = footY - figH + figH * 0.13;
      const hitX = cx - figH * 0.25;
      const hitY = headCy - figH * 0.18;
      const hitW = figH * 0.5;
      const hitH = footY - hitY + 4;
      els.push(
        `<rect class="subj-hit" x="${r(hitX)}" y="${r(hitY)}" width="${r(hitW)}" height="${r(hitH)}" fill="transparent" pointer-events="all" />`,
      );

      // Targeted → swept connector to a reserved bottom-rail slot.
      // Non-targeted → short vertical connector to a pill anchored just
      // below the subject's feet (still hidden until hovered).
      const pillCy = isTargeted ? H - 16 : Math.min(H - 10, footY + 20);
      const slotX = isTargeted
        ? (slotCount > 0 ? ((slotIdx + 0.5) / slotCount) * W : cx)
        : cx;

      if (isTargeted) {
        const dropY = footY + (pillCy - footY) * 0.55;
        const connector =
          `M ${r(cx)} ${r(footY)} ` +
          `C ${r(cx)} ${r(dropY)}, ${r(slotX)} ${r(dropY)}, ${r(slotX)} ${r(pillCy - 8)}`;
        els.push(
          `<path class="subj-connector" d="${connector}" fill="none" ` +
          `stroke="rgba(255,255,255,0.32)" stroke-width="1" stroke-dasharray="2,3" stroke-linecap="round" />`,
        );
      } else {
        els.push(
          `<line class="subj-connector" x1="${r(cx)}" y1="${r(footY + 2)}" x2="${r(cx)}" y2="${r(pillCy - 8)}" ` +
          `stroke="rgba(255,255,255,0.22)" stroke-width="0.75" stroke-dasharray="2,3" stroke-linecap="round" />`,
        );
      }

      const truncName = s.name.length > 18 ? s.name.slice(0, 16) + '\u2026' : s.name;
      const fontSize = 11;
      const pillW = truncName.length * fontSize * 0.56 + 18;
      const pillH = fontSize + 8;
      const pillX = Math.max(4, Math.min(W - pillW - 4, slotX - pillW / 2));
      const pillTop = pillCy - pillH / 2;
      const textColor = isTargeted ? '#fbbf24' : 'rgba(255,255,255,0.92)';
      const strokeCol = isTargeted ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.22)';
      els.push(
        `<g class="subj-pill">` +
        `<rect x="${r(pillX)}" y="${r(pillTop)}" width="${r(pillW)}" height="${r(pillH)}" rx="5" ` +
        `fill="rgba(0,0,0,0.82)" stroke="${strokeCol}" stroke-width="0.75" />` +
        `<text x="${r(pillX + pillW / 2)}" y="${r(pillTop + pillH / 2 + 4)}" text-anchor="middle" ` +
        `fill="${textColor}" font-size="${fontSize}" font-weight="${isTargeted ? 700 : 600}">${esc(truncName)}</text>` +
        `</g>`,
      );

      els.push(`</g>`); // close subj-group
    }
  }

  /**
   * Render a single human silhouette as an SVG path.
   *
   * Shape: large head circle + a "dome" body (flat base, straight sides,
   * rounded shoulders meeting under the head). Inspired by the Material
   * "person" glyph — recognisable and uniform at any size, so that depth
   * (opacity) and facing (nose wedge) carry the information instead of the
   * silhouette's outline.
   */
  private renderPerson(
    els: string[],
    cx: number,
    footY: number,
    figH: number,
    color: string,
    opacity: number,
    facingDeg: number | null,
    role: RoleBucket = 'party',
  ) {
    // Proportions: head 26% of figH, gap 4%, body 70%.
    const headR     = figH * 0.13;
    const headD     = headR * 2;
    const gap       = figH * 0.04;
    const bodyTop   = footY - figH + headD + gap;
    const bodyH     = footY - bodyTop;
    const bodyW     = figH * 0.30;
    const halfW     = bodyW / 2;
    const shoulderArc = bodyH * 0.45;
    const headCy    = footY - figH + headR;

    // Role-specific outline — couple thicker solid, party solid, guests
    // thin dashed. Carries role at a glance without any text labels.
    const outline   = roleOutline(role);
    const strokeCol = color;
    const strokeOp  = opacity;
    const strokeW   = outline.width;
    const dashAttr  = outline.dashArray ? ` stroke-dasharray="${outline.dashArray}"` : '';

    // Body — flat base, straight sides, rounded shoulders meeting at the top.
    const bodyPath = [
      `M ${r(cx - halfW)} ${r(footY)}`,
      `L ${r(cx - halfW)} ${r(bodyTop + shoulderArc)}`,
      `Q ${r(cx - halfW)} ${r(bodyTop)} ${r(cx)} ${r(bodyTop)}`,
      `Q ${r(cx + halfW)} ${r(bodyTop)} ${r(cx + halfW)} ${r(bodyTop + shoulderArc)}`,
      `L ${r(cx + halfW)} ${r(footY)}`,
      'Z',
    ].join(' ');
    els.push(
      `<path d="${bodyPath}" fill="${color}" fill-opacity="${r(0.55 * opacity)}" ` +
      `stroke="${strokeCol}" stroke-opacity="${r(strokeOp)}" stroke-width="${strokeW}"${dashAttr} stroke-linejoin="round" />`,
    );

    // Head
    els.push(
      `<circle cx="${r(cx)}" cy="${r(headCy)}" r="${r(headR)}" ` +
      `fill="${color}" fill-opacity="${r(0.55 * opacity)}" ` +
      `stroke="${strokeCol}" stroke-opacity="${r(strokeOp)}" stroke-width="${strokeW}"${dashAttr} />`,
    );

    // Facing wedge — small triangle attached to the head pointing in the
    // direction the subject is looking, relative to the camera.
    //   facingRelative = 180 → bottom  (facing the viewer)
    //   facingRelative =   0 → top     (facing away)
    //   facingRelative =  90 → right   (facing camera-right)
    //   facingRelative = -90 → left    (facing camera-left)
    if (facingDeg != null) {
      const theta = (facingDeg * Math.PI) / 180;
      const dx = Math.sin(theta);
      const dy = -Math.cos(theta);
      const baseDist  = headR * 0.80;
      const tipDist   = headR * 1.55;
      const halfWidth = headR * 0.42;
      const px = -dy;
      const py = dx;
      const bx = cx + dx * baseDist;
      const by = headCy + dy * baseDist;
      const tipX = cx + dx * tipDist;
      const tipY = headCy + dy * tipDist;
      const b1x = bx + px * halfWidth;
      const b1y = by + py * halfWidth;
      const b2x = bx - px * halfWidth;
      const b2y = by - py * halfWidth;
      els.push(
        `<path d="M ${r(tipX)} ${r(tipY)} L ${r(b1x)} ${r(b1y)} L ${r(b2x)} ${r(b2y)} Z" ` +
        `fill="${color}" fill-opacity="${r(opacity)}" />`,
      );
    }
  }

  private renderShotBadge(els: string[], shotType: string, subjectCount: number) {
    const label = shotType.replace(/_/g, ' ');
    const text = `${label} · ${subjectCount} subject${subjectCount !== 1 ? 's' : ''}`;
    const pillW = text.length * 6.5 + 16;

    els.push(
      `<rect x="8" y="8" width="${r(pillW)}" height="22" rx="4" fill="rgba(0,0,0,0.65)" />`,
    );
    els.push(
      `<text x="16" y="23" fill="#a78bfa" font-size="11" font-weight="600">${esc(text)}</text>`,
    );
  }
}

/** Round to 1 decimal for SVG cleanliness. */
function r(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/** Escape text for SVG/XML. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Deterministic hash of a name → stable colour assignment across cameras. */
function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Scale (0–1) → screen Y via perspective projection. */
function scaleToY(s: number): number {
  return (HORIZON_Y + (GROUND_Y - HORIZON_Y) * Math.min(1, Math.max(0, s))) * H;
}

/** Floor half-width at screen Y — perspective convergence toward VP. */
function floorHalfW(y: number): number {
  return (W / 2) * Math.max(0, (y - VP_Y) / (FLOOR_BOTTOM - VP_Y));
}
