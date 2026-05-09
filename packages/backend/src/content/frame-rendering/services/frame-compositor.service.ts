import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { FrameSubject } from '../../spatial-engine/services/spatial-translator.service';
import { DirectedSubject } from '../../scene-preparation/services/shot-director.service';
import { DynamicControlnetService, CompositionGuide } from '../../spatial-engine/services/dynamic-controlnet.service';
import { StepHandle } from '../../../ai/orchestration/pipeline-logger';

// ─── Public types ────────────────────────────────────────────────────

export interface FrameScriptSubject {
  name: string;
  position: string;
  relativeSize: 'large' | 'medium' | 'small' | 'tiny';
  appearance: string;
  action: string;
  weight: number;
  relationship: string;
}

export interface FrameScript {
  composition: {
    shotType: string;
    framingDescription: string;
    depthOfField: string;
    visualFlow: string;
  };
  subjects: FrameScriptSubject[];
  environment: {
    setting: string;
    lighting: string;
    mood: string;
    backgroundElements?: string;
  };
}

export interface FrameCompositorOutput {
  frameScript: FrameScript;
  compositionGuide: CompositionGuide;
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class FrameCompositorService {
  private readonly logger = new Logger(FrameCompositorService.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly dynamicControlnet: DynamicControlnetService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('rendering/frame-compositor.md');
  }

  /**
   * Produce a FrameScript (structured frame description) and a ControlNet
   * composition guide SVG from spatial data + director output.
   *
   * Two outputs from one logical stage:
   * 1. FrameScript JSON — consumed by the Prompt Stylist
   * 2. ControlNet SVG — consumed by ComfyUI for spatial conditioning
   */
  async compose(
    frameSubjects: FrameSubject[],
    directedSubjects: DirectedSubject[],
    subjectsMeta: Array<{ name: string; roleName: string | null; isGroup: boolean; visualAppearance: string }>,
    context: {
      shotType: string;
      sceneName: string;
      momentName?: string;
      activityName?: string;
      locationHint?: string;
      emotionalTone: string;
    },
    assignmentId: number,
    stepHandle?: StepHandle,
  ): Promise<FrameCompositorOutput> {
    // ── Build input for Gemma ──
    const inputSubjects = frameSubjects.map((fs) => {
      const meta = subjectsMeta.find((m) => m.name === fs.name);
      const directed = directedSubjects.find((d) => d.name === fs.name);
      return {
        name: fs.name,
        visualAppearance: meta?.visualAppearance || fs.name,
        isGroup: fs.isGroup,
        frameX: +fs.frameX.toFixed(2),
        scale: +fs.scale.toFixed(2),
        depth: fs.depth,
        side: fs.side,
        distance: Math.round(fs.distance),
        directedAction: directed?.directedAction || '',
        gazeTarget: directed?.gazeTarget || 'forward',
        emphasis: ((directed?.emphasis || 'SECONDARY') as string).toUpperCase(),
      };
    });

    const input = {
      shotType: context.shotType,
      sceneName: context.sceneName,
      momentName: context.momentName || null,
      activityName: context.activityName || null,
      locationHint: context.locationHint || null,
      emotionalTone: context.emotionalTone,
      subjects: inputSubjects,
    };

    this.logger.log(
      `Compositing: ${context.momentName || context.sceneName} — ${inputSubjects.length} subjects`,
    );

    const userContent = `Compose a FrameScript for this camera view. Return ONLY valid JSON matching the output schema.\n\n${JSON.stringify(input, null, 2)}`;

    stepHandle?.input(input);

    // ── Call Gemma with Frame Compositor skill ──
    const { reply, model, usage } = await this.gemma.chat({
      messages: [
        { role: 'system', content: this.skillPrompt },
        { role: 'user', content: userContent },
      ],
      maxTokens: 768,
      temperature: 0.4,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'frame-compositor',
      model,
      promptLength: userContent.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userContent,
      rawResponse: reply,
    });

    const frameScript = this.parseResponse(reply, frameSubjects, context);

    this.logger.log(
      `Frame Compositor (${model}): ${frameScript.subjects.length} subjects, "${frameScript.environment.mood}"`,
    );

    stepHandle?.output({
      subjectCount: frameScript.subjects.length,
      mood: frameScript.environment.mood,
      shotType: frameScript.composition.shotType,
    });
    stepHandle?.complete(`${frameScript.subjects.length} subjects, mood="${frameScript.environment.mood}"`);

    // ── Generate ControlNet SVG from same spatial data ──
    const compositionGuide = this.dynamicControlnet.generate(frameSubjects, assignmentId);

    return { frameScript, compositionGuide };
  }

  private parseResponse(
    raw: string,
    frameSubjects: FrameSubject[],
    context: { shotType: string; sceneName: string; activityName?: string; locationHint?: string },
  ): FrameScript {
    let text = raw.trim();
    text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1).trim();
    }

    try {
      const parsed = JSON.parse(text);
      return this.validateFrameScript(parsed, frameSubjects);
    } catch (e) {
      this.logger.warn(`Frame Compositor output was not valid JSON — building fallback. Raw: ${text.slice(0, 200)}`);
      return this.buildFallback(frameSubjects, context);
    }
  }

  /**
   * Validate and normalise a parsed FrameScript — ensure positions match
   * spatial data and weights are in valid range.
   */
  private validateFrameScript(parsed: any, frameSubjects: FrameSubject[]): FrameScript {
    const subjects: FrameScriptSubject[] = (parsed.subjects || []).map((s: any) => {
      // Find matching spatial subject to enforce ground truth
      const spatial = frameSubjects.find((fs) => fs.name === s.name);
      const correctPosition = spatial ? `${spatial.side}, ${spatial.depth}` : s.position || 'center, mid-ground';
      const scale = spatial?.scale || 0.3;

      return {
        name: s.name || 'Unknown',
        position: correctPosition,
        relativeSize: this.scaleToSize(scale),
        appearance: (s.appearance || s.name || '').slice(0, 80),
        action: (s.action || '').slice(0, 100),
        weight: Math.max(0.5, Math.min(1.5, parseFloat(s.weight) || 1.0)),
        relationship: (s.relationship || '').slice(0, 100),
      };
    });

    return {
      composition: {
        shotType: parsed.composition?.shotType || 'MEDIUM_SHOT',
        framingDescription: parsed.composition?.framingDescription || 'medium shot',
        depthOfField: parsed.composition?.depthOfField || 'natural focus',
        visualFlow: parsed.composition?.visualFlow || '',
      },
      subjects,
      environment: {
        setting: parsed.environment?.setting || '',
        lighting: parsed.environment?.lighting || 'soft light',
        mood: parsed.environment?.mood || 'warm',
        backgroundElements: parsed.environment?.backgroundElements || undefined,
      },
    };
  }

  /**
   * Build a deterministic fallback FrameScript when Gemma fails.
   */
  private buildFallback(
    frameSubjects: FrameSubject[],
    context: { shotType: string; sceneName: string; activityName?: string; locationHint?: string },
  ): FrameScript {
    const subjects: FrameScriptSubject[] = frameSubjects.map((fs) => ({
      name: fs.name,
      position: `${fs.side}, ${fs.depth}`,
      relativeSize: this.scaleToSize(fs.scale),
      appearance: fs.name,
      action: '',
      weight: this.scaleToWeight(fs.scale),
      relationship: '',
    }));

    return {
      composition: {
        shotType: context.shotType,
        framingDescription: `${context.shotType.toLowerCase().replace(/_/g, ' ')}`,
        depthOfField: 'natural focus',
        visualFlow: '',
      },
      subjects,
      environment: {
        setting: context.locationHint || context.activityName || context.sceneName || 'venue',
        lighting: 'soft light, warm tones',
        mood: 'warm',
      },
    };
  }

  private scaleToSize(scale: number): 'large' | 'medium' | 'small' | 'tiny' {
    if (scale > 0.5) return 'large';
    if (scale > 0.25) return 'medium';
    if (scale > 0.1) return 'small';
    return 'tiny';
  }

  private scaleToWeight(scale: number): number {
    if (scale > 0.5) return 1.3;
    if (scale > 0.25) return 1.1;
    if (scale > 0.1) return 0.9;
    return 0.8;
  }
}
