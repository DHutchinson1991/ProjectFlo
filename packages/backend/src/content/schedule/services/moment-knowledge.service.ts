import { Inject, Injectable, Logger, Optional, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { MomentGenerationStep } from '../../activity-planning/steps/moment-generation.step';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { MissingPlanningDataError } from '../errors/missing-planning-data.error';

interface EnsureActivityMomentsResult {
  createdActivityMoments: number;
  createdSceneMoments: number;
  templateUsed: string | null;
}

@Injectable()
export class MomentKnowledgeService {
  private readonly logger = new Logger(MomentKnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => MomentGenerationStep))
    private readonly momentGeneration?: MomentGenerationStep,
  ) {}

  /**
   * Ensure an activity has PackageActivityMoment records from the knowledge base.
   * Does NOT require a film scene — works at the activity template level.
   * Returns the created moments and template info.
   */
  async ensureActivityMoments(
    activityId: number,
    stepLogger?: StepLogger,
  ): Promise<{
    createdCount: number;
    templateUsed: string | null;
    source: 'existing' | 'knowledge-base' | 'ai-generated' | 'none';
    moments: Array<{ id: number; name: string; order_index: number; duration_seconds: number }>;
  }> {
    const activity = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        name: true,
        description: true,
        duration_minutes: true,
        package_id: true,
        package: { select: { brand_id: true } },
      },
    });
    if (!activity) {
      stepLogger?.warn(`Activity ${activityId} not found for moment generation`);
      stepLogger?.output({ source: 'none', createdCount: 0, momentCount: 0 });
      stepLogger?.complete('Activity missing');
      return { createdCount: 0, templateUsed: null, source: 'none', moments: [] };
    }

    let existing = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activity.id },
      orderBy: { order_index: 'asc' },
      select: { id: true, name: true, order_index: true, duration_seconds: true },
    });

    if (existing.length > 0) {
      stepLogger?.output({
        source: 'existing',
        createdCount: 0,
        momentCount: existing.length,
        momentNames: existing.map((moment) => moment.name),
      });
      stepLogger?.complete(`Using ${existing.length} existing moments`);
      return { createdCount: 0, templateUsed: null, source: 'existing', moments: existing };
    }

    const base = await this.findBestKnowledgeBase(
      activity.package?.brand_id ?? null,
      activity.name,
      activity.description ?? undefined,
    );

    if (!base) {
      // No knowledge base template — try AI moment generation fallback
      if (this.momentGeneration) {
        return this.generateMomentsWithAI(activity, stepLogger);
      }
      stepLogger?.warn('No knowledge base template or AI fallback available');
      stepLogger?.output({ source: 'none', createdCount: 0, momentCount: 0 });
      stepLogger?.complete('No moments generated');
      return { createdCount: 0, templateUsed: null, source: 'none', moments: [] };
    }

    const assignedSubjects = await this.loadAssignedSubjectsForActivity(activity.id, activity.package_id);
    const relevantEntries = this.filterEntriesForAssignedSubjects(base.entries, assignedSubjects);

    const scaledEntries = this.scaleEntriesToDuration(
      relevantEntries,
      activity.duration_minutes ?? base.reference_duration_minutes,
    );

    await this.prisma.packageActivityMoment.createMany({
      data: scaledEntries.map((entry, index) => ({
        package_activity_id: activity.id,
        name: entry.name,
        description: entry.description ?? null,
        subject_actions: entry.subject_actions ?? undefined,
        order_index: index,
        duration_seconds: entry.duration_seconds,
        is_required: true,
      })),
      skipDuplicates: true,
    });

    const templateUsed = `${base.category}${base.variant ? ` / ${base.variant}` : ''}`;

    existing = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activity.id },
      orderBy: { order_index: 'asc' },
      select: { id: true, name: true, order_index: true, duration_seconds: true },
    });

    this.logger.log(
      `ensureActivityMoments: created ${scaledEntries.length} moments for activity ${activity.id} "${activity.name}" using ${templateUsed}`,
    );

    stepLogger?.output({
      source: 'knowledge-base',
      templateUsed,
      createdCount: scaledEntries.length,
      momentCount: existing.length,
      momentNames: existing.map((moment) => moment.name),
    });
    stepLogger?.complete(`Used knowledge base template ${templateUsed}`);

    return { createdCount: scaledEntries.length, templateUsed, source: 'knowledge-base', moments: existing };
  }

  private async generateMomentsWithAI(
    activity: { id: number; name: string; description: string | null; duration_minutes: number | null; package_id: number },
    stepLogger?: StepLogger,
  ): Promise<{
    createdCount: number;
    templateUsed: string | null;
    source: 'ai-generated' | 'none';
    moments: Array<{ id: number; name: string; order_index: number; duration_seconds: number }>;
  }> {
    const subjects = await this.loadAssignedSubjectsForActivity(activity.id, activity.package_id);

    const result = await this.momentGeneration!.execute({
      activityName: activity.name,
      activityDescription: activity.description ?? undefined,
      durationMinutes: activity.duration_minutes ?? 30,
      subjects: subjects.map((s) => ({
        name: s.name,
        role: s.role_template?.role_name ?? null,
        isGroup: s.role_template?.is_group ?? false,
      })),
    }, stepLogger);

    if (result.moments.length === 0) {
      stepLogger?.warn('AI generated zero moments');
      return { createdCount: 0, templateUsed: null, source: 'none', moments: [] };
    }

    await this.prisma.packageActivityMoment.createMany({
      data: result.moments.map((m, i) => ({
        package_activity_id: activity.id,
        name: m.name,
        description: m.description,
        order_index: i,
        duration_seconds: m.durationSeconds,
        is_required: m.isRequired,
      })),
      skipDuplicates: true,
    });

    const moments = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activity.id },
      orderBy: { order_index: 'asc' },
      select: { id: true, name: true, order_index: true, duration_seconds: true },
    });

    this.logger.log(
      `ensureActivityMoments: AI-generated ${moments.length} moments for activity ${activity.id} "${activity.name}"`,
    );

    stepLogger?.log(`Persisted ${moments.length} AI-generated moments to PackageActivityMoment`);

    return { createdCount: moments.length, templateUsed: 'AI-generated', source: 'ai-generated', moments };
  }

  async ensureSceneMomentsForActivity(
    sceneId: number,
    activityId: number | null,
  ): Promise<EnsureActivityMomentsResult> {
    if (!activityId) {
      return { createdActivityMoments: 0, createdSceneMoments: 0, templateUsed: null };
    }

    const scene = await this.prisma.filmScene.findUnique({
      where: { id: sceneId },
      select: { id: true, mode: true },
    });
    if (!scene || scene.mode === 'MONTAGE') {
      return { createdActivityMoments: 0, createdSceneMoments: 0, templateUsed: null };
    }

    const existingSceneMomentCount = await this.prisma.sceneMoment.count({
      where: { film_scene_id: sceneId },
    });
    if (existingSceneMomentCount > 0) {
      return { createdActivityMoments: 0, createdSceneMoments: 0, templateUsed: null };
    }

    // Fail fast: the package planner owns PackageActivityMoment creation. If
    // none exist, film-side flows (schedule, scene preparation) must not
    // auto-create them. Surface the gap so the planner can be run.
    const activityMomentCount = await this.prisma.packageActivityMoment.count({
      where: { package_activity_id: activityId },
    });
    if (activityMomentCount === 0) {
      throw new MissingPlanningDataError('PackageActivityMoment', {
        activityId,
        sceneId,
        expected: 'at least one PackageActivityMoment for the linked package activity',
      });
    }

    const activity = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
      select: { id: true, package_id: true },
    });
    if (!activity) {
      return { createdActivityMoments: 0, createdSceneMoments: 0, templateUsed: null };
    }

    const activityMoments = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activity.id },
      orderBy: { order_index: 'asc' },
    });

    if (activityMoments.length === 0) {
      // Can only happen in a race with concurrent deletion; preserve fail-fast.
      throw new MissingPlanningDataError('PackageActivityMoment', {
        activityId: activity.id,
        sceneId,
        expected: 'at least one PackageActivityMoment for the linked package activity',
      });
    }

    const packageSubjects = await this.loadAssignedSubjectsForActivity(activity.id, activity.package_id);

    await this.prisma.$transaction(async (tx) => {
      for (const activityMoment of activityMoments) {
        const moment = await tx.sceneMoment.create({
          data: {
            film_scene_id: sceneId,
            name: activityMoment.name,
            description: activityMoment.description,
            order_index: activityMoment.order_index,
            duration: activityMoment.duration_seconds,
            source_activity_id: activity.id,
            // Canonical FK to the owning package planning moment. This is the
            // single source of truth; downstream code must not reconcile by
            // name match.
            package_activity_moment_id: activityMoment.id,
          },
        });

        if (packageSubjects.length === 0) {
          continue;
        }

        const actionsByKey = this.toActionMap(activityMoment.subject_actions);
        const focalByKey = this.toFocalMap(activityMoment.subject_actions);
        await tx.filmSceneMomentSubject.createMany({
          data: packageSubjects.map((subject) => ({
            moment_id: moment.id,
            subject_id: subject.id,
            action_description: this.resolveActionDescription(
              actionsByKey,
              subject.role_template?.role_name ?? null,
              subject.name,
            ),
            priority: this.resolveFocalPriority(
              focalByKey,
              subject.role_template?.role_name ?? null,
              subject.name,
            ),
          })),
          skipDuplicates: true,
        });
      }
    });

    const createdSceneMoments = activityMoments.length;
    this.logger.log(
      `Mirrored ${createdSceneMoments} SceneMoments from package planner for activity ${activity.id}`,
    );

    return { createdActivityMoments: 0, createdSceneMoments, templateUsed: null };
  }

  private async findBestKnowledgeBase(brandId: number | null, activityName: string, activityDescription?: string) {
    const { category, variant } = this.resolveCategoryAndVariant(activityName, activityDescription);

    const brandScoped = brandId
      ? await this.prisma.momentKnowledgeBase.findMany({
          where: { brand_id: brandId, category, is_active: true },
          include: { entries: { orderBy: { order_index: 'asc' } } },
        })
      : [];

    const defaults = await this.prisma.momentKnowledgeBase.findMany({
      where: { brand_id: null, category, is_active: true },
      include: { entries: { orderBy: { order_index: 'asc' } } },
    });

    const candidates = [...brandScoped, ...defaults];
    if (candidates.length === 0) {
      return null;
    }

    const wantedVariant = variant?.toLowerCase();
    return (
      candidates.find((base) => base.variant?.toLowerCase() === wantedVariant) ??
      (category === 'Ceremony'
        ? candidates.find((base) => (base.variant ?? '').toLowerCase() === 'traditional')
        : null) ??
      candidates[0]
    );
  }

  private resolveCategoryAndVariant(activityName: string, activityDescription?: string) {
    const text = `${activityName} ${activityDescription ?? ''}`.toLowerCase();

    const category = /mehndi|mehendi/.test(text)
      ? 'Mehndi'
      : /getting ready|bridal prep|groom prep|hair|makeup|prep\b/.test(text)
        ? 'Getting Ready'
        : /confetti|portraits?|group photos?|couple photos?/.test(text)
          ? 'Confetti & Photos'
          : /grand entrance|reception entry|room reveal/.test(text)
            ? 'Reception Entry'
            : /cake|speeches|toasts?/.test(text)
              ? 'Cake Cut & Speeches'
              : /first dance|evening party|open dancing|dance floor/.test(text)
                ? 'First Dance & Evening'
                : /formal dinner|wedding breakfast|dinner service|meal/.test(text)
                  ? 'Formal Dinner'
                  : /reception/.test(text)
                    ? 'Reception'
                    : /ceremony|vows|altar|aisle|mandap|registry|nikah/.test(text)
                      ? 'Ceremony'
                      : activityName.trim();

    const variant = /civil|registry/.test(text)
      ? 'Civil'
      : /hindu|mandap|baraat/.test(text)
        ? 'Hindu'
        : /pakistani|nikah|walima/.test(text)
          ? 'Pakistani'
          : /intimate|garden/.test(text)
            ? 'Intimate'
            : category === 'Ceremony'
              ? 'Traditional'
              : null;

    return { category, variant };
  }

  private async loadAssignedSubjectsForActivity(activityId: number, packageId: number) {
    const assigned = await this.prisma.packageDaySubjectActivity.findMany({
      where: { package_activity_id: activityId },
      select: {
        package_day_subject: {
          select: {
            id: true,
            name: true,
            role_template: { select: { role_name: true, is_group: true } },
          },
        },
      },
    });

    if (assigned.length > 0) {
      return assigned.map(({ package_day_subject }) => package_day_subject);
    }

    return this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId },
      select: {
        id: true,
        name: true,
        role_template: { select: { role_name: true, is_group: true } },
      },
    });
  }

  private filterEntriesForAssignedSubjects(
    entries: Array<{
      name: string;
      description: string | null;
      subject_actions: unknown;
      default_duration_seconds: number;
      min_duration_seconds: number | null;
      max_duration_seconds: number | null;
    }>,
    subjects: Array<{ name: string; role_template: { role_name: string | null; is_group: boolean } | null }>,
  ) {
    if (subjects.length === 0) {
      return entries;
    }

    const allowedKeys = new Set(
      subjects
        .flatMap((subject) => [subject.name, subject.role_template?.role_name])
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase()),
    );

    const filtered = entries.filter((entry) => {
      if (!entry.subject_actions || typeof entry.subject_actions !== 'object' || Array.isArray(entry.subject_actions)) {
        return true;
      }

      return Object.keys(entry.subject_actions).some((key) => allowedKeys.has(key.toLowerCase()));
    });

    return filtered.length > 0 ? filtered : entries;
  }

  private scaleEntriesToDuration(
    entries: Array<{
      name: string;
      description: string | null;
      subject_actions: unknown;
      default_duration_seconds: number;
      min_duration_seconds: number | null;
      max_duration_seconds: number | null;
    }>,
    targetMinutes: number,
  ) {
    const targetSeconds = Math.max(60, Math.round(targetMinutes * 60));
    const defaultTotal = Math.max(1, entries.reduce((sum, entry) => sum + entry.default_duration_seconds, 0));

    const scaled = entries.map((entry) => ({
      name: entry.name,
      description: entry.description,
      subject_actions: entry.subject_actions,
      min: entry.min_duration_seconds ?? 30,
      max: entry.max_duration_seconds ?? Math.max(targetSeconds, entry.default_duration_seconds),
      duration_seconds: this.clamp(
        Math.round((entry.default_duration_seconds / defaultTotal) * targetSeconds),
        entry.min_duration_seconds ?? 30,
        entry.max_duration_seconds ?? Math.max(targetSeconds, entry.default_duration_seconds),
      ),
    }));

    let diff = targetSeconds - scaled.reduce((sum, entry) => sum + entry.duration_seconds, 0);
    const direction = diff >= 0 ? 1 : -1;

    while (diff !== 0) {
      let adjusted = false;
      for (const entry of scaled) {
        const nextDuration = entry.duration_seconds + direction;
        if (nextDuration < entry.min || nextDuration > entry.max) {
          continue;
        }
        entry.duration_seconds = nextDuration;
        diff -= direction;
        adjusted = true;
        if (diff === 0) {
          break;
        }
      }
      if (!adjusted) {
        break;
      }
    }

    return scaled;
  }

  /**
   * Parse subject_actions JSON into a flat action map.
   * Handles both old format { "Name": "action" } and new format { "Name": { action, focal } }.
   */
  private toActionMap(subjectActions: unknown): Record<string, string> {
    if (!subjectActions || typeof subjectActions !== 'object' || Array.isArray(subjectActions)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(subjectActions)
        .map(([key, value]) => {
          if (typeof value === 'string') return [key, value];
          if (value && typeof value === 'object' && 'action' in value && typeof (value as any).action === 'string') {
            return [key, (value as any).action];
          }
          return null;
        })
        .filter((entry): entry is [string, string] => entry != null),
    ) as Record<string, string>;
  }

  /**
   * Parse subject_actions JSON into a focal priority map.
   * Only works with new format { "Name": { action, focal } }.
   */
  private toFocalMap(subjectActions: unknown): Record<string, string> {
    if (!subjectActions || typeof subjectActions !== 'object' || Array.isArray(subjectActions)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(subjectActions)
        .map(([key, value]) => {
          if (value && typeof value === 'object' && 'focal' in value && typeof (value as any).focal === 'string') {
            return [key, (value as any).focal];
          }
          return null;
        })
        .filter((entry): entry is [string, string] => entry != null),
    ) as Record<string, string>;
  }

  private resolveActionDescription(
    actionsByKey: Record<string, string>,
    roleName?: string | null,
    subjectName?: string | null,
  ) {
    const lookupKeys = [roleName, subjectName]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());

    for (const [key, value] of Object.entries(actionsByKey)) {
      if (lookupKeys.includes(key.toLowerCase())) {
        return value;
      }
    }

    return undefined;
  }

  private resolveFocalPriority(
    focalByKey: Record<string, string>,
    roleName?: string | null,
    subjectName?: string | null,
  ): 'PRIMARY' | 'SECONDARY' | 'BACKGROUND' {
    const lookupKeys = [roleName, subjectName]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());

    for (const [key, value] of Object.entries(focalByKey)) {
      if (lookupKeys.includes(key.toLowerCase())) {
        const upper = value.toUpperCase();
        if (upper === 'PRIMARY') return 'PRIMARY';
        if (upper === 'SECONDARY') return 'SECONDARY';
        return 'BACKGROUND';
      }
    }

    return 'BACKGROUND';
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }
}
