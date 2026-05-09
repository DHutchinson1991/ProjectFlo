import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShotType } from '@prisma/client';

interface SubjectInfo {
  name: string;
  roleName: string | null;
  isGroup: boolean;
  actionDescription?: string;
}

/** Spatial frame data for a subject projected into the camera's view (from SpatialTranslator). */
interface SpatialSubjectInfo {
  name: string;
  /** 0 = left edge, 0.5 = center, 1 = right edge */
  frameX: number;
  /** Scale factor: 1.0 = fills frame, smaller = further away */
  scale: number;
  depth: 'extreme-foreground' | 'foreground' | 'mid-ground' | 'background' | 'far-background';
  side: 'far-left' | 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'far-right';
  distance: number;
  /** Whether this subject is an editorial target of the camera. */
  isTargeted?: boolean;
}

interface ShotContext {
  subjects: SubjectInfo[];
  shotType: ShotType | null;
  sceneName: string;
  momentName?: string;
  activityName?: string;
  locationHint?: string;
  /** Spatial frame data from SpatialTranslator (A: wired spatial data) */
  spatialSubjects?: SpatialSubjectInfo[];
}

interface BuiltPrompt {
  prompt: string;
  negativePrompt: string;
}

interface DetailedPrompt extends BuiltPrompt {
  /** Auto-applied LoRA / style tokens */
  stylePrefix: string;
  /** Camera framing tag (e.g. "close-up, head and shoulders portrait") */
  framing: string | null;
  /** Core scene description built from subjects + moment + location */
  sceneSentence: string;
  /** Quality tail tokens */
  qualityTail: string;
}

@Injectable()
export class ShotPromptBuilder {
  private readonly stylePrefix: string;

  constructor(private readonly configService: ConfigService) {
    const loraName = this.configService.get<string>('COMFYUI_LORA_NAME', '');
    // When a LoRA is active, use its trigger words; otherwise fall back to manual style tokens
    // Drawing/sketch style LoRA (Pony/illustriousXL) — romantic wedding illustration style
    this.stylePrefix = loraName
      ? 'DRAWING_STYLE, DRAWING, SKETCH, MONOCHROME, soft linework, delicate shading, romantic illustration, elegant wedding art'
      : '(sketch illustration:1.2), (storyboard frame:1.15), monochrome, soft linework, delicate shading, romantic illustration, elegant wedding art';
  }

  /** Expose the style prefix so FrameRenderService can prepend it to AI-generated prompts. */
  getStylePrefix(): string {
    return this.stylePrefix;
  }

  /** Build the negative prompt for a given shot type (used when AI provides the positive prompt). */
  getBaseNegativePrompt(shotType: ShotType | null): string {
    const isTight = this.isTightFraming(shotType);
    const negatives: string[] = [
      '(worst quality:1.4)', '(low quality:1.4)', '(normal quality:1.2)',
      '(photorealistic:1.3)', '(photo:1.2)', '(realistic:1.15)', '(3d render:1.2)',
      '(skin texture:1.1)', '(pores:1.1)',
      'color', 'colored', 'painting',
      'dslr', 'film grain', 'bokeh', 'depth of field', 'lens flare',
      'ugly', 'deformed', 'bad anatomy', 'extra fingers',
      'blurry', 'text', 'watermark', 'logo',
      '(dark:1.2)', '(gloomy:1.2)', 'heavy shadows',
      '(harsh:1.2)', '(gritty:1.2)', '(rough lines:1.15)', '(bold strokes:1.1)',
      'nsfw', 'nude',
    ];
    if (isTight) {
      negatives.push(
        '(wide shot:1.2)', '(establishing shot:1.2)', '(full body:1.15)',
        '(crowd:1.15)', '(rows of people:1.15)', '(pews:1.1)', '(building interior:1.1)',
      );
    }
    return negatives.join(', ');
  }

  /**
   * Translate structured shot data into a Stable Diffusion prompt.
   * Subject-action-first: each subject's action_description is the primary
   * visual instruction. Moment name becomes a "during X" modifier.
   * Activity name provides ambient ceremony context.
   */
  build(context: ShotContext): BuiltPrompt {
    const detailed = this.buildDetailed(context);
    return { prompt: detailed.prompt, negativePrompt: detailed.negativePrompt };
  }

  /**
   * Same as build() but returns structured parts so the frontend can
   * show what each section of the prompt does.
   */
  buildDetailed(context: ShotContext): DetailedPrompt {
    const subjectCount = context.subjects.length;
    // A shot is only "tight" if the framing type is inherently close AND there's 1 subject.
    // Multi-subject close-ups (e.g. reaction shot of Bride + Groom) need wider framing.
    const isTightShot = this.isTightFraming(context.shotType) && subjectCount <= 1;
    const framingTag = this.shotTypeToFraming(context.shotType, subjectCount);

    // Build the core scene sentence from subject actions
    const sceneSentence = this.buildSceneSentence({
      subjects: context.subjects,
      momentName: context.momentName ? this.cleanLabel(context.momentName) : undefined,
      activityName: context.activityName ? this.cleanLabel(context.activityName) : undefined,
      location: context.locationHint ? this.cleanLabel(context.locationHint) : undefined,
      sceneName: context.sceneName ? this.cleanLabel(context.sceneName) : undefined,
      isTightShot,
      spatialSubjects: context.spatialSubjects,
    });

    // Assemble: style prefix, framing, scene sentence, quality suffix
    const parts: string[] = [];

    // 1. Style — front-loaded, LoRA trigger words or manual tokens
    parts.push(this.stylePrefix);

    // 2. Framing — weighted so it actually controls the composition
    if (framingTag) {
      // SDXL is more responsive to weights — use lighter values than SD 1.5
      const weightedFraming = isTightShot ? `(${framingTag}:1.2)` : `(${framingTag}:1.1)`;
      parts.push(weightedFraming);
    }

    // 3. Scene sentence — THE core of the prompt
    parts.push(sceneSentence);

    // 4. Wedding/ceremony context — always include so SD knows the setting
    const ceremonyContext = this.buildCeremonyContext(context, isTightShot);
    if (ceremonyContext) parts.push(ceremonyContext);

    // 5. Quality tail — soft romantic illustration
    const qualityTail = 'high detail, soft lighting, warm tones, gentle atmosphere, beautiful composition, masterpiece illustration';
    parts.push(qualityTail);

    const prompt = parts.join(', ');

    // Build negative prompt — suppress photo-realism but allow detailed illustration
    // SDXL-specific quality tags at the front for maximum effect
    const negatives: string[] = [
      '(worst quality:1.4)', '(low quality:1.4)', '(normal quality:1.2)',
      '(photorealistic:1.3)', '(photo:1.2)', '(realistic:1.15)', '(3d render:1.2)',
      '(skin texture:1.1)', '(pores:1.1)',
      'color', 'colored', 'painting',
      'dslr', 'film grain', 'bokeh', 'depth of field', 'lens flare',
      'ugly', 'deformed', 'bad anatomy', 'extra fingers',
      'blurry', 'text', 'watermark', 'logo',
      '(dark:1.2)', '(gloomy:1.2)', 'heavy shadows',
      '(harsh:1.2)', '(gritty:1.2)', '(rough lines:1.15)', '(bold strokes:1.1)',
      'nsfw', 'nude',
    ];

    // For tight shots, actively suppress wide/environment tokens so SD focuses on the subject
    if (isTightShot) {
      negatives.push(
        '(wide shot:1.2)', '(establishing shot:1.2)', '(full body:1.15)',
        '(crowd:1.15)', '(rows of people:1.15)', '(pews:1.1)', '(building interior:1.1)',
      );
    }

    const negativePrompt = negatives.join(', ');

    return {
      prompt,
      negativePrompt,
      stylePrefix: this.stylePrefix,
      framing: framingTag,
      sceneSentence,
      qualityTail,
    };
  }

  /**
   * Build a natural-language scene sentence from subject actions.
   * Priority: action_description > roleToVisualDesc fallback.
   * Moment name becomes "during X" suffix. Activity provides ambient context.
   */
  private buildSceneSentence(opts: {
    subjects: SubjectInfo[];
    momentName?: string;
    activityName?: string;
    location?: string;
    sceneName?: string;
    isTightShot: boolean;
    spatialSubjects?: SpatialSubjectInfo[];
  }): string {
    const { subjects, momentName, activityName, location, sceneName, isTightShot, spatialSubjects } = opts;

    // Build a lookup for spatial data by subject name (lowercase)
    const spatialByName = new Map<string, SpatialSubjectInfo>();
    for (const ss of spatialSubjects ?? []) {
      spatialByName.set(ss.name.toLowerCase(), ss);
    }

    const place = location || sceneName || '';
    const duringMoment = momentName ? `during ${momentName}` : '';

    // Collect per-subject action fragments, enriched with spatial position data
    const actionFragments: string[] = [];
    for (const s of subjects) {
      // Build a visually descriptive subject label for SD
      const visualLabel = s.isGroup
        ? `group of ${this.roleToVisualDesc(s.roleName || s.name)}`
        : this.roleToVisualDesc(s.roleName || s.name);

      // Spatial positioning hint (e.g. "on the left in the foreground")
      const spatial = spatialByName.get((s.roleName || s.name).toLowerCase());
      const spatialHint = spatial ? this.buildSpatialHint(spatial) : '';

      // SD attention weight: targeted subjects get higher emphasis
      const weight: number = spatial?.isTargeted === true ? 1.3 : spatial?.isTargeted === false ? 0.85 : 1.2;

      if (s.actionDescription) {
        // Combine visual appearance + action + spatial position
        const parts = [`(${visualLabel}:${weight}) ${s.actionDescription}`];
        if (spatialHint) parts.push(spatialHint);
        actionFragments.push(parts.join(', '));
      } else {
        const weighted = weight !== 1.0 ? `(${visualLabel}:${weight})` : visualLabel;
        actionFragments.push(spatialHint ? `${weighted}, ${spatialHint}` : weighted);
      }
    }

    // No subjects — environment shot
    if (actionFragments.length === 0) {
      return activityName
        ? `${activityName} at ${place || 'venue interior'}`
        : place || 'venue interior';
    }

    // Tight shots: portrait of subject, minimal context
    if (isTightShot) {
      const subjectText = actionFragments.length === 1
        ? actionFragments[0]
        : actionFragments.join(' and ');
      const suffix = [duringMoment, place ? `at ${place}` : ''].filter(Boolean).join(' ');
      return suffix ? `portrait of ${subjectText} ${suffix}` : `portrait of ${subjectText}`;
    }

    // Wide/medium: join actions with natural connectors
    const actionText = actionFragments.length === 1
      ? actionFragments[0]
      : actionFragments.length === 2
        ? `${actionFragments[0]} and ${actionFragments[1]}`
        : actionFragments.join(', ');

    const suffixParts = [duringMoment, place ? `at ${place}` : ''].filter(Boolean);
    const suffix = suffixParts.length > 0 ? ` ${suffixParts.join(' ')}` : '';

    return `${actionText}${suffix}`;
  }

  /**
   * Convert spatial position data into a natural-language hint for SD prompts.
   * E.g. "on the left in the foreground" or "center-right in the mid-ground"
   */
  private buildSpatialHint(spatial: SpatialSubjectInfo): string {
    const parts: string[] = [];

    // Side hint — skip for centered subjects (default SD composition)
    if (spatial.side !== 'center') {
      const sideLabels: Record<string, string> = {
        'far-left': 'on the far left',
        'left': 'on the left',
        'center-left': 'slightly left of center',
        'center-right': 'slightly right of center',
        'right': 'on the right',
        'far-right': 'on the far right',
      };
      parts.push(sideLabels[spatial.side] || '');
    }

    // Depth hint — skip for mid-ground (default assumption)
    if (spatial.depth !== 'mid-ground') {
      const depthLabels: Record<string, string> = {
        'extreme-foreground': 'in the extreme foreground',
        'foreground': 'in the foreground',
        'background': 'in the background',
        'far-background': 'in the far background',
      };
      parts.push(depthLabels[spatial.depth] || '');
    }

    return parts.filter(Boolean).join(' ');
  }

  /**
   * Whether the shot type is a tight/close framing where the subject
   * should dominate and environmental context should be minimised.
   */
  private isTightFraming(shotType: ShotType | null): boolean {
    if (!shotType) return false;
    const tightTypes: ShotType[] = [
      ShotType.EXTREME_CLOSE_UP,
      ShotType.CLOSE_UP,
      ShotType.DETAIL_SHOT,
      ShotType.REACTION_SHOT,
      ShotType.INSERT_SHOT,
    ];
    return tightTypes.includes(shotType);
  }

  private shotTypeToFraming(shotType: ShotType | null, subjectCount = 1): string | null {
    if (!shotType) return 'medium shot';

    const map: Record<ShotType, string> = {
      [ShotType.EXTREME_CLOSE_UP]: 'extreme close-up, macro detail, face filling the frame',
      [ShotType.CLOSE_UP]: subjectCount > 1
        ? 'close two-shot, both faces visible, intimate framing'
        : 'close-up portrait, head and shoulders only, shallow focus on face',
      [ShotType.MEDIUM_SHOT]: 'medium shot, waist up, balanced composition',
      [ShotType.WIDE_SHOT]: 'wide shot, full body and surroundings, environmental storytelling',
      [ShotType.ESTABLISHING_SHOT]: 'wide establishing shot, entire space visible, architectural detail',
      [ShotType.TWO_SHOT]: 'two-shot, two people framed together, intimate composition',
      [ShotType.DETAIL_SHOT]: 'extreme macro close-up of a small object or detail',
      [ShotType.REACTION_SHOT]: subjectCount > 1
        ? 'close two-shot reaction, both people visible, emotional expressions, waist up'
        : 'close-up reaction shot, emotional expression, face filling frame',
      [ShotType.OVER_SHOULDER]: 'over-the-shoulder shot, depth composition, foreground silhouette',
      [ShotType.CUTAWAY]: 'cutaway shot, environmental detail, storytelling insert',
      [ShotType.INSERT_SHOT]: 'insert close-up, important object detail, tight framing',
      [ShotType.MASTER_SHOT]: 'wide master shot, all subjects visible, full scene layout',
    };

    return map[shotType] || 'medium shot';
  }

  /**
   * Map role names to visually descriptive labels so SD renders them
   * correctly (e.g. "officiant" alone may render as a bride).
   */
  private roleToVisualDesc(roleName: string): string {
    return this.roleToVisualDescPublic(roleName);
  }

  /** Public accessor for roleToVisualDesc — used by FrameRenderService to pass to Gemma. */
  roleToVisualDescPublic(roleName: string): string {
    const lower = roleName.toLowerCase().trim();
    const map: Record<string, string> = {
      'bride': 'young woman in elegant white wedding dress, veil, holding bouquet',
      'groom': 'young man in formal dark suit and tie, boutonniere on lapel',
      'officiant': 'older man in dark clerical robes standing at altar',
      'registrar': 'man in formal dark suit with document at podium',
      'best man': 'young man in formal suit standing beside groom',
      'maid of honor': 'young woman in elegant bridesmaid dress',
      'father of bride': 'distinguished older man in formal suit',
      'father of groom': 'distinguished older man in formal suit',
      'mother of bride': 'elegant older woman in formal dress',
      'mother of groom': 'elegant older woman in formal dress',
      'flower girl': 'young girl in white dress holding flower basket',
      'ring bearer': 'young boy in small suit carrying ring pillow',
      'bridesmaids': 'women in matching elegant dresses',
      'groomsmen': 'men in matching formal suits',
      'guests': 'well-dressed wedding guests',
    };
    return map[lower] || lower;
  }

  /**
   * Clean a scene/moment label for use in a prompt.
   * Removes underscores, normalises casing.
   */
  private cleanLabel(label: string): string {
    return label
      .replace(/[_-]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Build ceremony/wedding context tokens based on activity and scene names.
   * Always included (even for tight shots) so SD knows it's a wedding,
   * but with lighter phrasing for close-ups.
   */
  private buildCeremonyContext(context: ShotContext, isTightShot: boolean): string | null {
    const activity = context.activityName?.toLowerCase() || '';
    const scene = context.sceneName?.toLowerCase() || '';

    const isCeremony = activity.includes('ceremon') || scene.includes('ceremon');
    const isReception = activity.includes('recept') || scene.includes('recept');
    const isPrep = activity.includes('prep') || scene.includes('prep') || scene.includes('getting ready');

    if (isCeremony) {
      return isTightShot
        ? 'wedding ceremony venue, church interior'
        : 'wedding ceremony venue, church interior, wooden pews, rows of seated guests';
    }
    if (isReception) {
      return isTightShot
        ? 'wedding reception, decorated venue'
        : 'wedding reception, banquet hall, decorated tables, festive lighting';
    }
    if (isPrep) {
      return isTightShot
        ? 'getting ready for wedding, dressing room'
        : 'bridal preparation room, getting ready for wedding, mirror and dressing table';
    }

    // Generic wedding context for unknown activities
    return isTightShot ? 'wedding event' : 'wedding event, elegant venue';
  }
}
