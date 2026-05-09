import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FrameSubject } from './spatial-translator.service';

/**
 * Generate a dynamic ControlNet conditioning image from spatial frame data.
 *
 * Renders a simple SVG composition guide: circles for heads, simple body
 * rectangles, scaled and positioned according to the camera projection.
 * Generates per-shot ControlNet conditioning from spatial data.
 *
 * Output is a white-on-black ControlNet-friendly PNG (rendered via ComfyUI
 * SVG/image pipeline or converted locally if sharp is available).
 */

export interface CompositionGuide {
  /** SVG string of the composition image. */
  svg: string;
  /** Local path where the PNG was saved (if rendered). */
  pngPath?: string;
  /** Recommended ControlNet strength for this composition. */
  strength: number;
}

/** Render configuration. */
const WIDTH = 896;
const HEIGHT = 576;
/** Vertical center offset — subjects anchor at ~60% height (natural eye level). */
const EYE_LINE_Y = 0.55;
/** Base human body height at scale=1.0 (fills most of the frame). */
const BASE_BODY_H = HEIGHT * 0.85;
/** Head radius at scale=1.0. */
const BASE_HEAD_R = 35;
/** Body width at scale=1.0. */
const BASE_BODY_W = 80;

@Injectable()
export class DynamicControlnetService {
  private readonly logger = new Logger(DynamicControlnetService.name);
  private readonly outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'uploads', 'controlnet-guides');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a composition guide SVG from projected frame subjects.
   *
   * The image is a simple storyboard-style layout:
   * - White silhouettes (head circle + body rectangle) on black background
   * - Positioned and scaled according to spatial frame data
   * - Groups are rendered as 3 smaller overlapping figures
   */
  generate(frameSubjects: FrameSubject[], assignmentId: number): CompositionGuide {
    const figures = this.buildFigures(frameSubjects);
    const svg = this.renderSvg(figures);

    // Write SVG to disk — ComfyUI can load it or we convert later
    const filename = `comp_${assignmentId}_${Date.now()}.svg`;
    const svgPath = path.join(this.outputDir, filename);
    fs.writeFileSync(svgPath, svg);

    // Determine ControlNet strength based on subject count + spread
    const strength = this.computeStrength(frameSubjects);

    this.logger.log(
      `Composition guide: ${frameSubjects.length} subjects, ` +
      `${figures.length} figures, strength=${strength} → ${filename}`,
    );

    return { svg, pngPath: svgPath, strength };
  }

  /**
   * Render the composition as a PNG buffer using basic SVG-to-bitmap.
   * Falls back to raw SVG file if no image library is available.
   */
  async renderPng(guide: CompositionGuide, assignmentId: number): Promise<string> {
    const pngFilename = `comp_${assignmentId}_${Date.now()}.png`;
    const pngPath = path.join(this.outputDir, pngFilename);

    try {
      // Try sharp if available (optional dependency)
      const sharp = await import('sharp').catch(() => null);
      if (sharp) {
        const svgBuffer = Buffer.from(guide.svg);
        await sharp.default(svgBuffer)
          .resize(WIDTH, HEIGHT)
          .png()
          .toFile(pngPath);
        this.logger.log(`Composition PNG rendered via sharp: ${pngFilename}`);
        return pngPath;
      }
    } catch {
      // sharp not available — fall through
    }

    // Fallback: write SVG directly. ComfyUI LoadImage can handle SVG
    // or we use the SVG path as-is for upload.
    const svgPath = guide.pngPath || path.join(this.outputDir, `comp_${assignmentId}.svg`);
    if (!fs.existsSync(svgPath)) {
      fs.writeFileSync(svgPath, guide.svg);
    }
    this.logger.warn(`sharp not available — using SVG file directly: ${svgPath}`);
    return svgPath;
  }

  // ── Internal rendering ─────────────────────────────────────────────

  private buildFigures(
    subjects: FrameSubject[],
  ): Array<{ cx: number; cy: number; headR: number; bodyW: number; bodyH: number; opacity: number }> {
    const figures: Array<{ cx: number; cy: number; headR: number; bodyW: number; bodyH: number; opacity: number }> = [];

    for (const s of subjects) {
      const scale = Math.max(0.08, s.scale);
      const cx = s.frameX * WIDTH;

      // Vertical position: further subjects sit higher (perspective).
      // Scale also determines how far "up" the figure sits.
      const footY = HEIGHT * (EYE_LINE_Y + (1 - scale) * 0.25);
      const bodyH = BASE_BODY_H * scale;
      const headR = BASE_HEAD_R * scale;
      const bodyW = BASE_BODY_W * scale;
      const cy = footY - bodyH / 2;

      // Opacity: closer = more opaque, further = more transparent.
      const opacity = Math.max(0.3, Math.min(1.0, scale * 1.5));

      if (s.isGroup) {
        // Render 3 overlapping figures for groups
        const spread = bodyW * 0.6;
        for (let i = -1; i <= 1; i++) {
          figures.push({
            cx: cx + i * spread,
            cy: cy + Math.abs(i) * headR * 0.3,
            headR: headR * 0.8,
            bodyW: bodyW * 0.7,
            bodyH: bodyH * 0.85,
            opacity: opacity * 0.8,
          });
        }
      } else {
        figures.push({ cx, cy, headR, bodyW, bodyH, opacity });
      }
    }

    return figures;
  }

  private renderSvg(
    figures: Array<{ cx: number; cy: number; headR: number; bodyW: number; bodyH: number; opacity: number }>,
  ): string {
    const elements: string[] = [];

    // Background: solid black
    elements.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="black" />`);

    // Ground line hint at ~75% height
    elements.push(
      `<line x1="0" y1="${HEIGHT * 0.78}" x2="${WIDTH}" y2="${HEIGHT * 0.78}" ` +
      `stroke="#222" stroke-width="1" />`,
    );

    // Draw each figure: body rectangle + head circle, white on black
    for (const f of figures) {
      const bodyTop = f.cy;
      const bodyLeft = f.cx - f.bodyW / 2;

      // Body — rounded rectangle
      elements.push(
        `<rect x="${r(bodyLeft)}" y="${r(bodyTop)}" ` +
        `width="${r(f.bodyW)}" height="${r(f.bodyH)}" ` +
        `rx="${r(f.bodyW * 0.15)}" ` +
        `fill="white" opacity="${r(f.opacity)}" />`,
      );

      // Head — circle on top of body
      const headCy = bodyTop - f.headR * 0.3;
      elements.push(
        `<circle cx="${r(f.cx)}" cy="${r(headCy)}" r="${r(f.headR)}" ` +
        `fill="white" opacity="${r(f.opacity)}" />`,
      );
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
      ...elements,
      `</svg>`,
    ].join('\n');
  }

  /**
   * Compute recommended ControlNet strength.
   * - Fewer subjects at close range → stronger (0.5-0.6)
   * - Many subjects spread out → lighter (0.3-0.4)
   */
  private computeStrength(subjects: FrameSubject[]): number {
    if (subjects.length === 0) return 0.2;
    const avgScale = subjects.reduce((sum, s) => sum + s.scale, 0) / subjects.length;
    // High scale (close subjects) + few subjects → strong guidance
    // Low scale (far subjects) + many subjects → light guidance
    const base = 0.25 + avgScale * 0.35;
    const countPenalty = Math.min(subjects.length - 1, 4) * 0.03;
    return Math.round(Math.max(0.2, Math.min(0.6, base - countPenalty)) * 100) / 100;
  }
}

/** Round to 1 decimal for SVG cleanliness. */
function r(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
