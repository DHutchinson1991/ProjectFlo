import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintAiGeneratorService } from './day-blueprint-ai-generator.service';

export interface RefineDayInput {
  /** Free-form director's brief from the Simulator. */
  prompt?: string;
  /**
   * Pre-collected wizard answers ("assumptions" the user has confirmed).
   * Each entry should be a short sentence; we forward them verbatim to
   * the LLM as additional anchored context.
   */
  assumptions?: string[];
  /**
   * Narrows the LLM's attention. The day is still regenerated, but the
   * focus statement is added to the brief so the model emphasises that
   * area on the next pass.
   */
  focus?: 'moments' | 'actions' | 'placements' | 'timing' | 'people' | 'locations' | 'all';
}

interface RefinerSummary {
  activities: Array<{
    name: string;
    start: string | null;
    durationMin: number | null;
    moments: Array<{ name: string; isKey: boolean; actions: number; placements: number }>;
  }>;
  subjectRoles: string[];
  spaceSlots: Array<{ label: string; locationRole: string }>;
}

/**
 * Simulator's "Refine wedding day" entry point.
 *
 * Reads the current day's structure, summarises it as anchored
 * context, then delegates to {@link DayBlueprintAiGeneratorService}
 * with an enriched prompt. The underlying generator still owns the
 * destructive transaction + run logging + SSE events, so refine
 * shows up in the same AI runs panel as a normal generation.
 */
@Injectable()
export class DayBlueprintAiRefinerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: DayBlueprintAiGeneratorService,
  ) {}

  async refineDay(
    versionId: number,
    dayId: number,
    input: RefineDayInput,
  ): Promise<Awaited<ReturnType<DayBlueprintAiGeneratorService['generateDay']>>> {
    const version = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: versionId },
      select: { generation_mode: true },
    });
    if (!version) throw new NotFoundException('Day blueprint version not found');
    if (version.generation_mode !== 'AI') {
      throw new BadRequestException('Refine is available only in AI mode. Switch generation mode to AI first.');
    }

    const summary = await this.summarize(versionId, dayId);
    const prompt = this.composePrompt(summary, input);
    if (prompt.length > 4000) {
      throw new BadRequestException('Refinement prompt exceeded 4000 characters');
    }
    return this.generator.generateDay(versionId, dayId, { prompt });
  }

  private async summarize(versionId: number, dayId: number): Promise<RefinerSummary> {
    const day = await this.prisma.dayBlueprintDay.findUnique({
      where: { id: dayId },
      include: {
        version: {
          include: {
            subject_roles: { include: { subject_role: true }, orderBy: { order_index: 'asc' } },
            space_slots: { include: { location_role: true }, orderBy: { order_index: 'asc' } },
          },
        },
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
              include: {
                actions: { select: { id: true } },
                placements: { select: { id: true } },
              },
            },
          },
        },
      },
    });
    if (!day) throw new NotFoundException('Day not found');
    if (day.day_blueprint_version_id !== versionId) {
      throw new BadRequestException('Day does not belong to this version');
    }

    return {
      activities: day.activities.map((activity) => ({
        name: activity.name,
        start: activity.default_start_time ?? null,
        durationMin: activity.default_duration_minutes ?? null,
        moments: activity.moments.map((moment) => ({
          name: moment.name,
          isKey: Boolean(moment.is_key_moment),
          actions: moment.actions.length,
          placements: moment.placements.length,
        })),
      })),
      subjectRoles: day.version.subject_roles.map((link) => link.subject_role.role_name),
      spaceSlots: day.version.space_slots.map((slot) => ({
        label: slot.label,
        locationRole: slot.location_role?.display_name ?? '',
      })),
    };
  }

  private composePrompt(summary: RefinerSummary, input: RefineDayInput): string {
    const lines: string[] = [];
    lines.push('Refine an existing wedding day simulation. Preserve narrative continuity from the existing structure unless the brief overrides it.');

    if (input.assumptions && input.assumptions.length > 0) {
      lines.push('');
      lines.push('Confirmed details from the Simulator (treat as ground truth):');
      for (const assumption of input.assumptions.slice(0, 30)) {
        const cleaned = assumption.trim().slice(0, 240);
        if (cleaned) lines.push(`- ${cleaned}`);
      }
    }

    if (summary.activities.length > 0) {
      lines.push('');
      lines.push('Existing activities (in chronological order):');
      for (const activity of summary.activities) {
        const time = activity.start ?? 'unscheduled';
        const dur = activity.durationMin != null ? `${activity.durationMin}m` : '?';
        lines.push(`- ${activity.name} @ ${time} (${dur}) — ${activity.moments.length} moments`);
        for (const moment of activity.moments.slice(0, 6)) {
          const flags = [
            moment.isKey ? 'key' : null,
            moment.actions === 0 ? 'no actions' : `${moment.actions} actions`,
            moment.placements === 0 ? 'no placements' : `${moment.placements} placements`,
          ].filter(Boolean).join(', ');
          lines.push(`  · ${moment.name} [${flags}]`);
        }
      }
    }

    if (summary.subjectRoles.length > 0) {
      lines.push('');
      lines.push(`Known subject roles: ${summary.subjectRoles.join(', ')}`);
    }
    if (summary.spaceSlots.length > 0) {
      const slotSummary = summary.spaceSlots.map((slot) => `${slot.label} (${slot.locationRole || 'unscoped'})`).join(', ');
      lines.push(`Known space slots: ${slotSummary}`);
    }

    if (input.focus && input.focus !== 'all') {
      lines.push('');
      lines.push(`Focus this pass on improving: ${input.focus}.`);
    }

    if (input.prompt && input.prompt.trim()) {
      lines.push('');
      lines.push(`Director's note: ${input.prompt.trim().slice(0, 1500)}`);
    }

    return lines.join('\n');
  }
}
