import { Injectable, Logger } from '@nestjs/common';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { SkillLoaderService } from '../../../ai/gemma/skill-loader.service';
import { FrameSubject } from '../../spatial-engine/services/spatial-translator.service';
import { StepHandle } from '../../../ai/orchestration/pipeline-logger';

// ─── Public types ────────────────────────────────────────────────────

export interface DirectorInput {
  shotType: string;
  sceneName: string;
  momentName?: string;
  activityName?: string;
  visibleSubjects: Array<{
    name: string;
    roleName: string | null;
    isGroup: boolean;
    isTargeted: boolean;
    frameX: number;
    scale: number;
    depth: string;
    side: string;
    distance: number;
    currentAction?: string;
    /** Name of a non-targeted subject blocking this one, or null if unobstructed. */
    occludedBy?: string | null;
  }>;
  sceneTimeline?: string[];
  momentIndex?: number;
}

export interface DirectedSubject {
  name: string;
  directedAction: string;
  gazeTarget: string;
  emphasis: 'PRIMARY' | 'SECONDARY' | 'BACKGROUND';
}

export interface DirectorOutput {
  emotionalTone: string;
  subjects: DirectedSubject[];
  compositionNotes: string;
}

// ─── Service ─────────────────────────────────────────────────────────

@Injectable()
export class ShotDirectorService {
  private readonly logger = new Logger(ShotDirectorService.name);
  private readonly skillPrompt: string;

  constructor(
    private readonly gemma: GemmaService,
    private readonly skills: SkillLoaderService,
  ) {
    this.skillPrompt = skills.load('direction/activity-director.md');
  }

  /**
   * Add creative direction to a camera assignment — emotional beat, gaze
   * targets, and enriched action descriptions.
   */
  async direct(input: DirectorInput, stepHandle?: StepHandle): Promise<DirectorOutput> {
    // ── Deduplicate subjects by name (keep closest) ──
    const deduped = new Map<string, (typeof input.visibleSubjects)[0]>();
    for (const s of input.visibleSubjects) {
      const existing = deduped.get(s.name);
      if (!existing || s.distance < existing.distance) {
        deduped.set(s.name, s);
      }
    }
    let subjects = Array.from(deduped.values());

    // ── Cap at 8 subjects — collapse extras into a note ──
    const MAX_SUBJECTS = 8;
    let overflowNote = '';
    if (subjects.length > MAX_SUBJECTS) {
      // Keep closest subjects; sort by distance ascending
      subjects.sort((a, b) => a.distance - b.distance);
      const overflow = subjects.slice(MAX_SUBJECTS);
      subjects = subjects.slice(0, MAX_SUBJECTS);
      overflowNote = `\n\nNote: ${overflow.length} additional subjects visible in far background (${overflow.map((s) => s.name).join(', ')}). Treat as ambient crowd.`;
    }

    const trimmedInput = { ...input, visibleSubjects: subjects };
    const userMessage = JSON.stringify(trimmedInput, null, 2) + overflowNote;

    // Append an occlusion note when any targeted subject has a non-targeted blocker.
    const occludedTargets = subjects.filter((s) => s.isTargeted && s.occludedBy);
    const occlusionNote =
      occludedTargets.length > 0
        ? `\n\nCAMERA NOTE: The following targeted subjects are partially blocked by a foreground subject — ` +
          `adapt your direction to acknowledge depth layering or suggest a lateral shift in gaze/action to improve visibility: ` +
          occludedTargets.map((s) => `${s.name} (blocked by ${s.occludedBy})`).join(', ') + '.'
        : '';

    // Scale tokens: base 256 + 64 per subject, capped at 1024
    const maxTokens = Math.min(1024, 256 + subjects.length * 64);

    this.logger.log(
      `Directing: ${input.momentName || input.sceneName} — ${subjects.length} subjects (${input.visibleSubjects.length} raw), ${input.shotType}, maxTokens=${maxTokens}`,
    );

    const messages = [
      { role: 'system' as const, content: this.skillPrompt },
      {
        role: 'user' as const,
        content: `Direct this camera assignment. Return ONLY valid JSON matching the output schema.\n\n${userMessage}${occlusionNote}`,
      },
    ];

    stepHandle?.input({
      shotType: input.shotType,
      sceneName: input.sceneName,
      momentName: input.momentName,
      subjectCount: subjects.length,
      maxTokens,
    });

    const { reply, model, usage } = await this.gemma.chat({
      messages,
      maxTokens,
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
    });

    stepHandle?.llmCall({
      skill: 'shot-director',
      model,
      promptLength: userMessage.length,
      responseLength: reply.length,
      usage: usage as any,
      rawPrompt: userMessage,
      rawResponse: reply,
    });

    const parsed = this.parseResponse(reply);

    this.logger.log(
      `Director (${model}): "${parsed.emotionalTone}" — ${parsed.subjects.length} subjects directed`,
    );

    stepHandle?.output({
      emotionalTone: parsed.emotionalTone,
      subjectCount: parsed.subjects.length,
      compositionNotes: parsed.compositionNotes,
    });
    stepHandle?.complete(`"${parsed.emotionalTone}" — ${parsed.subjects.length} subjects directed`);

    return parsed;
  }

  /**
   * Build a DirectorInput from raw pipeline data.
   */
  buildInput(
    frameSubjects: FrameSubject[],
    subjectsWithMeta: Array<{
      name: string;
      roleName: string | null;
      isGroup: boolean;
      actionDescription?: string;
    }>,
    shotType: string,
    sceneName: string,
    momentName?: string,
    activityName?: string,
  ): DirectorInput {
    // Identify which subjects are targeted so we can classify occlusion
    const targetedNames = new Set(frameSubjects.filter((s) => s.isTargeted).map((s) => s.name));

    const visibleSubjects = frameSubjects.map((fs) => {
      const meta = subjectsWithMeta.find((s) => s.name === fs.name);
      // Only surface occlusion when the blocker is NOT a co-targeted subject.
      // Co-targeted overlap (e.g. Bride in front of Groom) is intentional composition.
      const occludedByNonTarget =
        fs.occludedBy && !targetedNames.has(fs.occludedBy) ? fs.occludedBy : null;
      return {
        name: fs.name,
        roleName: meta?.roleName || null,
        isGroup: fs.isGroup,
        isTargeted: fs.isTargeted,
        frameX: +fs.frameX.toFixed(2),
        scale: +fs.scale.toFixed(2),
        depth: fs.depth,
        side: fs.side,
        distance: Math.round(fs.distance),
        currentAction: meta?.actionDescription,
        ...(occludedByNonTarget ? { occludedBy: occludedByNonTarget } : {}),
      };
    });

    return {
      shotType,
      sceneName,
      momentName,
      activityName,
      visibleSubjects,
    };
  }

  private parseResponse(raw: string): DirectorOutput {
    let text = raw.trim();
    // Strip markdown fences
    text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    // Strip wrapping quotes
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1).trim();
    }

    try {
      const parsed = JSON.parse(text);
      return {
        emotionalTone: parsed.emotionalTone || parsed.emotionalBeat || 'unspecified moment',
        subjects: (parsed.subjects || []).map((s: any) => ({
          name: s.name || 'Unknown',
          directedAction: s.directedAction || s.action || '',
          gazeTarget: s.gazeTarget || 'forward',
          emphasis: ['PRIMARY', 'SECONDARY', 'BACKGROUND'].includes(s.emphasis) ? s.emphasis : 'SECONDARY',
        })),
        compositionNotes: parsed.compositionNotes || '',
      };
    } catch (e) {
      this.logger.warn(`Director output was not valid JSON — using fallback. Raw (${text.length} chars): ${text.slice(0, 300)}`);
      this.logger.debug(`Full director raw output:\n${text}`);
      return {
        emotionalTone: '[director parse failed — re-run prep]',
        subjects: [],
        compositionNotes: '',
      };
    }
  }
}
