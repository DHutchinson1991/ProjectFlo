import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { geocodeAddress } from '../common/geocoding.util';
import { ProjectFilmCloneService } from './project-film-clone.service';

/**
 * Owner target for cloning — exactly one of projectId or inquiryId must be set.
 */
export interface CloneTarget {
  projectId?: number;
  inquiryId?: number;
  packageId: number;
}

/** Options that influence how subjects are cloned. */
export interface CloneOptions {
  /** Override guest count for group subjects with role_name "Guests". */
  guestCount?: number;
}

/**
 * Parse a guest-count range string (e.g. "50 – 150") into its midpoint.
 * Returns null if the string is empty / unparseable.
 */
export function parseGuestCountMidpoint(range: string | null | undefined): number | null {
  if (!range) return null;
  const trimmed = range.trim();

  // "Under 50" → 50
  const underMatch = trimmed.match(/^under\s+(\d+)/i);
  if (underMatch) return parseInt(underMatch[1], 10);

  // "300+" → 300
  const plusMatch = trimmed.match(/^(\d+)\+$/i);
  if (plusMatch) return parseInt(plusMatch[1], 10);

  // "50 – 150" or "50-150" or "50 - 150" → midpoint
  const rangeMatch = trimmed.match(/(\d+)\s*[–\-]\s*(\d+)/);
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1], 10);
    const hi = parseInt(rangeMatch[2], 10);
    return Math.round((lo + hi) / 2);
  }

  // Plain number
  const plainNum = parseInt(trimmed, 10);
  return isNaN(plainNum) ? null : plainNum;
}

/**
 * ProjectPackageCloneService
 *
 * Clones an entire service_packages record (and all its sub-entities) into
 * independent snapshot tables owned by either a project or an inquiry.
 * After cloning, the data is fully decoupled from the package — edits
 * to either side never propagate.
 *
 * Dual-owner support: each row gets either project_id OR inquiry_id set (never both).
 *
 * Entity copy order (respecting FK dependencies):
 *   1. PackageEventDay            → ProjectEventDay
 *   2. PackageActivity            → ProjectActivity
 *   3. PackageActivityMoment      → ProjectActivityMoment
 *   4. PackageEventDaySubject     → ProjectEventDaySubject
 *   5. PackageLocationSlot        → ProjectLocationSlot
 *   6. PackageDayOperator         → ProjectDayOperator
 *   7. PackageDayOperatorEquipment → ProjectDayOperatorEquipment
 *   8. PackageFilm                → ProjectFilm
 *   9. PackageFilmSceneSchedule   → ProjectFilmSceneSchedule
 *  10. OperatorActivityAssignment  → ProjectOperatorActivityAssignment
 *  11. SubjectActivityAssignment   → ProjectSubjectActivityAssignment
 *  12. LocationActivityAssignment  → ProjectLocationActivityAssignment
 */
@Injectable()
export class ProjectPackageCloneService {
  private readonly logger = new Logger(ProjectPackageCloneService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filmCloneService: ProjectFilmCloneService,
  ) {}

  /**
   * Clone all package entities into snapshot tables owned by a project.
   * Backward-compatible convenience wrapper.
   */
  async clonePackageToProject(
    projectId: number,
    packageId: number,
    tx?: Prisma.TransactionClient,
  ) {
    return this.clonePackageToOwner({ projectId, packageId }, tx);
  }

  /**
   * Clone all package entities into snapshot tables owned by an inquiry.
   */
  async clonePackageToInquiry(
    inquiryId: number,
    packageId: number,
    tx?: Prisma.TransactionClient,
    options?: CloneOptions,
  ) {
    return this.clonePackageToOwner({ inquiryId, packageId }, tx, options);
  }

  /**
   * Generic clone: accepts a CloneTarget specifying either projectId or inquiryId.
   * Safe to call within an existing transaction (pass `tx`) or standalone.
   */
  async clonePackageToOwner(
    target: CloneTarget,
    tx?: Prisma.TransactionClient,
    options?: CloneOptions,
  ) {
    if (!target.projectId && !target.inquiryId) {
      throw new Error('CloneTarget must specify either projectId or inquiryId');
    }
    if (target.projectId && target.inquiryId) {
      throw new Error('CloneTarget cannot specify both projectId and inquiryId');
    }
    const prisma = tx ?? this.prisma;
    return this._clone(prisma, target, options);
  }

  // ──────────────────────────────────────────────────────────────────

  /**
   * Build the owner fields object to spread into every create() call.
   */
  private _ownerFields(target: CloneTarget) {
    return target.projectId
      ? { project_id: target.projectId }
      : { inquiry_id: target.inquiryId };
  }

  private async _clone(
    prisma: Prisma.TransactionClient | PrismaService,
    target: CloneTarget,
    options?: CloneOptions,
  ) {
    const ownerLabel = target.projectId
      ? `project ${target.projectId}`
      : `inquiry ${target.inquiryId}`;
    const packageId = target.packageId;
    const ownerFields = this._ownerFields(target);

    this.logger.log(`Cloning package ${packageId} → ${ownerLabel}`);

    // ── 0. Verify package exists ──────────────────────────────────
    const pkg = await prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { id: true, contents: true, brand_id: true },
    });
    if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

    // ── 1. Clone PackageEventDay → ProjectEventDay ────────────────
    const packageEventDays = await prisma.packageEventDay.findMany({
      where: { package_id: packageId },
      orderBy: { order_index: 'asc' },
      include: { event_day: true },
    });

    // Map: PackageEventDay.id → ProjectEventDay.id
    const eventDayMap = new Map<number, number>();
    // Also: EventDay.id → ProjectEventDay.id (for operators/subjects that reference template IDs)
    const templateToProjectDayMap = new Map<number, number>();

    for (const ped of packageEventDays) {
      const projectEventDay = await prisma.projectEventDay.create({
        data: {
          ...ownerFields,
          event_day_template_id: ped.event_day_template_id,
          name: ped.event_day?.name ?? `Day ${ped.order_index + 1}`,
          date: new Date(), // Placeholder — user sets real date later
          order_index: ped.order_index,
        },
      });
      eventDayMap.set(ped.id, projectEventDay.id);
      templateToProjectDayMap.set(ped.event_day_template_id, projectEventDay.id);
    }

    this.logger.debug(`  Event days cloned: ${eventDayMap.size}`);

    // ── 2. Clone PackageActivity → ProjectActivity ────────────────
    const packageActivities = await prisma.packageActivity.findMany({
      where: { package_id: packageId },
      orderBy: [{ package_event_day_id: 'asc' }, { order_index: 'asc' }],
    });

    // Map: PackageActivity.id → ProjectActivity.id
    const activityMap = new Map<number, number>();

    for (const pa of packageActivities) {
      const projDayId = eventDayMap.get(pa.package_event_day_id);
      if (!projDayId) continue; // Orphan — skip

      const projectActivity = await prisma.projectActivity.create({
        data: {
          ...ownerFields,
          project_event_day_id: projDayId,
          package_activity_id: pa.id, // Traceability link
          name: pa.name,
          description: pa.description,
          color: pa.color,
          icon: pa.icon,
          start_time: pa.start_time,
          end_time: pa.end_time,
          duration_minutes: pa.duration_minutes,
          order_index: pa.order_index,
          is_locked: false,
        },
      });
      activityMap.set(pa.id, projectActivity.id);
    }

    this.logger.debug(`  Activities cloned: ${activityMap.size}`);

    // ── 3. Clone PackageActivityMoment → ProjectActivityMoment ────
    const packageMoments = await prisma.packageActivityMoment.findMany({
      where: { package_activity: { package_id: packageId } },
      orderBy: [{ package_activity_id: 'asc' }, { order_index: 'asc' }],
    });

    let momentsCopied = 0;
    for (const pm of packageMoments) {
      const projActivityId = activityMap.get(pm.package_activity_id);
      if (!projActivityId) continue;

      await prisma.projectActivityMoment.create({
        data: {
          ...ownerFields,
          project_activity_id: projActivityId,
          source_package_moment_id: pm.id,
          name: pm.name,
          order_index: pm.order_index,
          duration_seconds: pm.duration_seconds,
          is_required: pm.is_required,
          notes: pm.notes,
        },
      });
      momentsCopied++;
    }

    this.logger.debug(`  Activity moments cloned: ${momentsCopied}`);

    // ── 4. Clone PackageEventDaySubject → ProjectEventDaySubject ──
    const packageSubjects = await prisma.packageDaySubject.findMany({
      where: { package_id: packageId },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
      include: { role_template: { select: { is_group: true, role_name: true } } },
    });

    // Map: PackageEventDaySubject.id → ProjectEventDaySubject.id
    const subjectMap = new Map<number, number>();

    for (const ps of packageSubjects) {
      const projDayId = templateToProjectDayMap.get(ps.event_day_template_id);
      if (!projDayId) continue;

      // Determine count: override Guests with guestCount from inquiry if provided
      let subjectCount = ps.count ?? null;
      const isGuestsRole = ps.role_template?.role_name?.toLowerCase() === 'guests'
        || ps.name.toLowerCase() === 'guests';
      if (isGuestsRole && options?.guestCount) {
        subjectCount = options.guestCount;
      }

      // Initialize member_names for named groups (Bridesmaids, Groomsmen, etc.)
      // Guests are anonymous — no member_names
      const isNamedGroup = ps.role_template?.is_group && !isGuestsRole && subjectCount;
      const memberNames = isNamedGroup
        ? Array<string>(subjectCount as number).fill('')
        : undefined;

      const projectSubject = await prisma.projectDaySubject.create({
        data: {
          ...ownerFields,
          project_event_day_id: projDayId,
          source_package_subject_id: ps.id,
          role_template_id: ps.role_template_id,
          name: ps.name,
          real_name: null, // User fills this in later
          count: subjectCount,
          member_names: memberNames ?? undefined,
          category: ps.category,
          notes: ps.notes,
          order_index: ps.order_index,
        },
      });
      subjectMap.set(ps.id, projectSubject.id);
    }

    this.logger.debug(`  Subjects cloned: ${subjectMap.size}`);

    // ── 5. Clone PackageLocationSlot → ProjectLocationSlot ────────
    const packageLocationSlots = await prisma.packageLocationSlot.findMany({
      where: { package_id: packageId },
      orderBy: [{ event_day_template_id: 'asc' }, { location_number: 'asc' }],
    });

    // Map: PackageLocationSlot.id → ProjectLocationSlot.id
    const locationSlotMap = new Map<number, number>();

    for (const pls of packageLocationSlots) {
      const projDayId = templateToProjectDayMap.get(pls.event_day_template_id);
      if (!projDayId) continue;

      const projectLocationSlot = await prisma.projectLocationSlot.create({
        data: {
          ...ownerFields,
          project_event_day_id: projDayId,
          source_package_location_slot_id: pls.id,
          location_number: pls.location_number,
          name: null, // User fills this in later
          address: null,
          location_id: null, // User binds real venue later
          order_index: pls.location_number, // Use slot number as order
        },
      });
      locationSlotMap.set(pls.id, projectLocationSlot.id);
    }

    this.logger.debug(`  Location slots cloned: ${locationSlotMap.size}`);

    // ── 6. Clone PackageDayOperator → ProjectDayOperator ──────────
    const packageOperators = await prisma.packageDayOperator.findMany({
      where: { package_id: packageId },
      include: {
        equipment: true, // PackageDayOperatorEquipment[]
      },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });

    // Map: PackageDayOperator.id → ProjectDayOperator.id
    const operatorMap = new Map<number, number>();

    for (const po of packageOperators) {
      const projDayId = templateToProjectDayMap.get(po.event_day_template_id);
      if (!projDayId) continue;

      const projActivityId = po.package_activity_id
        ? activityMap.get(po.package_activity_id) ?? null
        : null;

      const projectOperator = await prisma.projectDayOperator.create({
        data: {
          ...ownerFields,
          project_event_day_id: projDayId,
          project_activity_id: projActivityId,
          source_package_operator_id: po.id,
          contributor_id: po.contributor_id, // Carry over crew assignment
          position_name: po.position_name,
          position_color: po.position_color,
          job_role_id: po.job_role_id,
          hours: po.hours,
          notes: po.notes,
          order_index: po.order_index,
        },
      });
      operatorMap.set(po.id, projectOperator.id);

      // ── 7. Clone PackageDayOperatorEquipment → ProjectDayOperatorEquipment
      for (const eq of po.equipment) {
        await prisma.projectDayOperatorEquipment.create({
          data: {
            project_day_operator_id: projectOperator.id,
            equipment_id: eq.equipment_id,
            is_primary: eq.is_primary,
          },
        });
      }
    }

    this.logger.debug(`  Operators cloned: ${operatorMap.size}`);

    // ── 8. Clone PackageFilm → ProjectFilm ────────────────────────
    // Only clone the PackageFilm records that are currently listed in
    // contents.items, so orphaned records (from previously removed films)
    // are not carried over.
    const contentsItems: Array<{ type: string; config?: { package_film_id?: number } }> =
      (pkg.contents as any)?.items ?? [];
    const contentsFilmIds = contentsItems
      .filter(item => item.type === 'film' && item.config?.package_film_id)
      .map(item => item.config!.package_film_id as number);
    const packageFilmWhere = contentsFilmIds.length > 0
      ? { package_id: packageId, id: { in: contentsFilmIds } }
      : { package_id: packageId };

    const packageFilms = await prisma.packageFilm.findMany({
      where: packageFilmWhere,
      include: {
        film: {
          include: {
            scenes: {
              orderBy: { order_index: 'asc' },
              include: {
                schedule: { include: { event_day: true } },
              },
            },
          },
        },
        scene_schedules: {
          include: { event_day: true },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });

    // Map: PackageFilm.id → ProjectFilm.id
    const filmMap = new Map<number, number>();

    for (const pf of packageFilms) {
      const projectFilm = await prisma.projectFilm.create({
        data: {
          ...ownerFields,
          film_id: pf.film_id,
          package_film_id: pf.id, // Traceability link
          order_index: pf.order_index,
        },
      });
      filmMap.set(pf.id, projectFilm.id);

      // ── 9. Clone scene schedules (package override > film default)
      if (pf.film?.scenes) {
        for (const scene of pf.film.scenes) {
          const pkgSchedule = pf.scene_schedules.find(
            (s) => s.scene_id === scene.id,
          );
          const filmSchedule = scene.schedule;
          const source = pkgSchedule || filmSchedule;

          if (source) {
            const eventDayId = source.event_day_template_id;
            const projectEventDayId = eventDayId
              ? templateToProjectDayMap.get(eventDayId) ?? null
              : null;

            // Resolve project activity from the package_activity_id on the schedule
            let projectActivityId: number | null = null;
            if (pkgSchedule?.package_activity_id) {
              projectActivityId =
                activityMap.get(pkgSchedule.package_activity_id) ?? null;
            }

            await prisma.projectFilmSceneSchedule.create({
              data: {
                project_film_id: projectFilm.id,
                scene_id: scene.id,
                project_event_day_id: projectEventDayId,
                project_activity_id: projectActivityId,
                scheduled_start_time: source.scheduled_start_time,
                scheduled_duration_minutes: source.scheduled_duration_minutes,
                moment_schedules:
                  source.moment_schedules ?? Prisma.JsonNull,
                beat_schedules:
                  source.beat_schedules ?? Prisma.JsonNull,
                notes: source.notes,
                order_index: scene.order_index,
                is_locked: false,
              },
            });
          }
        }
      }
    }

    this.logger.debug(`  Films cloned: ${filmMap.size}`);

    // ── 9b. Deep-clone film content (tracks, scenes, moments, beats, etc.) ──
    for (const pf of packageFilms) {
      const projectFilmId = filmMap.get(pf.id);
      if (projectFilmId && pf.film_id) {
        await this.filmCloneService.cloneFilmContent(
          {
            projectId: target.projectId,
            inquiryId: target.inquiryId,
            projectFilmId,
          },
          pf.film_id,
          prisma as Prisma.TransactionClient,
        );
      }
    }

    // ── 10. Clone OperatorActivityAssignment → ProjectOperatorActivityAssignment
    const opAssignments = await prisma.operatorActivityAssignment.findMany({
      where: {
        package_day_operator: { package_id: packageId },
      },
    });

    let opAssignmentsCopied = 0;
    for (const oa of opAssignments) {
      const projOperatorId = operatorMap.get(oa.package_day_operator_id);
      const projActivityId = activityMap.get(oa.package_activity_id);
      if (!projOperatorId || !projActivityId) continue;

      await prisma.projectOperatorActivityAssignment.create({
        data: {
          project_day_operator_id: projOperatorId,
          project_activity_id: projActivityId,
        },
      });
      opAssignmentsCopied++;
    }

    this.logger.debug(`  Operator assignments cloned: ${opAssignmentsCopied}`);

    // ── 11. Clone SubjectActivityAssignment → ProjectSubjectActivityAssignment
    const subAssignments = await prisma.packageDaySubjectActivity.findMany({
      where: {
        package_day_subject: { package_id: packageId },
      },
    });

    let subAssignmentsCopied = 0;
    for (const sa of subAssignments) {
      const projSubjectId = subjectMap.get(sa.package_day_subject_id);
      const projActivityId = activityMap.get(sa.package_activity_id);
      if (!projSubjectId || !projActivityId) continue;

      await prisma.projectDaySubjectActivity.create({
        data: {
          project_day_subject_id: projSubjectId,
          project_activity_id: projActivityId,
        },
      });
      subAssignmentsCopied++;
    }

    this.logger.debug(`  Subject assignments cloned: ${subAssignmentsCopied}`);

    // ── 12. Clone LocationActivityAssignment → ProjectLocationActivityAssignment
    const locAssignments = await prisma.locationActivityAssignment.findMany({
      where: {
        package_location_slot: { package_id: packageId },
      },
    });

    let locAssignmentsCopied = 0;
    for (const la of locAssignments) {
      const projLocationSlotId = locationSlotMap.get(
        la.package_location_slot_id,
      );
      const projActivityId = activityMap.get(la.package_activity_id);
      if (!projLocationSlotId || !projActivityId) continue;

      await prisma.projectLocationActivityAssignment.create({
        data: {
          project_location_slot_id: projLocationSlotId,
          project_activity_id: projActivityId,
        },
      });
      locAssignmentsCopied++;
    }

    this.logger.debug(`  Location assignments cloned: ${locAssignmentsCopied}`);

    // ── Summary ───────────────────────────────────────────────────
    const summary = {
      owner_id: target.projectId ?? target.inquiryId,
      owner_type: target.projectId ? 'project' : 'inquiry',
      source_package_id: packageId,
      event_days_created: eventDayMap.size,
      activities_created: activityMap.size,
      moments_created: momentsCopied,
      subjects_created: subjectMap.size,
      location_slots_created: locationSlotMap.size,
      operators_created: operatorMap.size,
      films_created: filmMap.size,
      operator_assignments_created: opAssignmentsCopied,
      subject_assignments_created: subAssignmentsCopied,
      location_assignments_created: locAssignmentsCopied,
    };

    this.logger.log(
      `Package ${packageId} → ${ownerLabel} clone complete: ` +
        JSON.stringify(summary),
    );

    // ── Post-clone: prefill locations & subjects from NA responses ─
    if (target.inquiryId) {
      try {
        await this._prefillFromNeedsAssessment(prisma, target.inquiryId, pkg.brand_id);
      } catch (err) {
        this.logger.warn(
          `Post-clone NA prefill for inquiry ${target.inquiryId} failed (non-fatal): ${err}`,
        );
      }
    }

    return summary;
  }

  // ──────────────────────────────────────────────────────────────────
  // Sync from Package (delete existing + re-clone)
  // ──────────────────────────────────────────────────────────────────

  /**
   * Delete all instance schedule data for a project, then re-clone from
   * its source_package_id. Runs in a transaction so it's all-or-nothing.
   */
  async syncProjectScheduleFromPackage(projectId: number) {
    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
      select: { id: true, source_package_id: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (!project.source_package_id) {
      throw new NotFoundException(`Project ${projectId} has no source package`);
    }

    return this.prisma.$transaction(async (tx) => {
      await this._deleteInstanceData(tx, { project_id: projectId });
      const result = await this._clone(tx, { projectId, packageId: project.source_package_id! });
      await this._reassignProjectTasksFromCrew(tx, projectId);
      return result;
    });
  }

  /**
   * Delete all instance schedule data for an inquiry, then re-clone from
   * its source_package_id.
   */
  async syncInquiryScheduleFromPackage(inquiryId: number) {
    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: inquiryId },
      select: { id: true, source_package_id: true, selected_package_id: true },
    });
    if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);
    const packageId = inquiry.source_package_id ?? inquiry.selected_package_id;
    if (!packageId) {
      throw new NotFoundException(`Inquiry ${inquiryId} has no source package`);
    }

    if (!inquiry.source_package_id && inquiry.selected_package_id) {
      const pkg = await this.prisma.service_packages.findUnique({
        where: { id: inquiry.selected_package_id },
        select: { id: true, name: true, base_price: true, currency: true, contents: true },
      });

      await this.prisma.inquiries.update({
        where: { id: inquiryId },
        data: {
          source_package_id: inquiry.selected_package_id,
          package_contents_snapshot: pkg
            ? {
                snapshot_taken_at: new Date().toISOString(),
                package_id: pkg.id,
                package_name: pkg.name,
                base_price: pkg.base_price ? Number(pkg.base_price) : 0,
                currency: pkg.currency ?? 'USD',
                contents: pkg.contents,
              }
            : Prisma.JsonNull,
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await this._deleteInstanceData(tx, { inquiry_id: inquiryId });
      const result = await this._clone(tx, { inquiryId, packageId });
      await this._reassignInquiryTasksFromCrew(tx, inquiryId);
      return result;
    });
  }

  /**
   * Delete ALL instance schedule rows owned by a project or inquiry.
   * Must run inside a transaction. Respects FK order (children first).
   */
  private async _deleteInstanceData(
    tx: Prisma.TransactionClient,
    owner: { project_id: number } | { inquiry_id: number },
  ) {
    const where = owner as any;

    // Junction / assignment tables first (they reference the entity tables)
    await tx.projectLocationActivityAssignment.deleteMany({
      where: { project_location_slot: where },
    });
    await tx.projectDaySubjectActivity.deleteMany({
      where: { project_day_subject: where },
    });
    await tx.projectOperatorActivityAssignment.deleteMany({
      where: { project_day_operator: where },
    });

    // Equipment (references operator)
    await tx.projectDayOperatorEquipment.deleteMany({
      where: { project_day_operator: where },
    });

    // Film scene schedules (references film)
    await tx.projectFilmSceneSchedule.deleteMany({
      where: { project_film: where },
    });

    // Entity tables
    await tx.projectActivityMoment.deleteMany({ where });
    await tx.projectDaySubject.deleteMany({ where });
    await tx.projectLocationSlot.deleteMany({ where });
    await tx.projectDayOperator.deleteMany({ where });
    await tx.projectFilm.deleteMany({ where });
    await tx.projectActivity.deleteMany({ where });
    await tx.projectEventDay.deleteMany({ where });

    this.logger.debug(`Deleted all instance data for ${JSON.stringify(owner)}`);
  }

  private async _reassignProjectTasksFromCrew(
    tx: Prisma.TransactionClient,
    projectId: number,
  ) {
    const operators = await tx.projectDayOperator.findMany({
      where: { project_id: projectId, contributor_id: { not: null }, job_role_id: { not: null } },
      select: {
        contributor_id: true,
        job_role_id: true,
      },
    });

    if (operators.length === 0) {
      await tx.project_tasks.updateMany({
        where: { project_id: projectId, is_active: true },
        data: { assigned_to_id: null },
      });
      return;
    }

    const contributorRoleRows = await tx.contributor_job_roles.findMany({
      where: {
        contributor_id: { in: operators.map((operator) => operator.contributor_id!) },
      },
      include: {
        payment_bracket: { select: { level: true } },
      },
    });

    const validAssignments = new Set(
      contributorRoleRows.map((row) => `${row.contributor_id}-${row.job_role_id}`),
    );
    const roleToCrew = new Map<number, Array<{ contributorId: number; bracketLevel: number }>>();

    for (const operator of operators) {
      const contributorId = operator.contributor_id;
      const jobRoleId = operator.job_role_id;
      if (!contributorId || !jobRoleId) continue;
      if (!validAssignments.has(`${contributorId}-${jobRoleId}`)) continue;

      const bracketLevel =
        contributorRoleRows.find(
          (row) => row.contributor_id === contributorId && row.job_role_id === jobRoleId,
        )?.payment_bracket?.level ?? 0;

      if (!roleToCrew.has(jobRoleId)) {
        roleToCrew.set(jobRoleId, []);
      }
      const list = roleToCrew.get(jobRoleId)!;
      if (!list.some((entry) => entry.contributorId === contributorId)) {
        list.push({ contributorId, bracketLevel });
      }
    }

    for (const [, list] of roleToCrew) {
      list.sort((left, right) => left.bracketLevel - right.bracketLevel);
    }

    const pickCrewForBracket = (
      roleId: number,
      taskBracketLevel: number | null,
    ): number | null => {
      const list = roleToCrew.get(roleId);
      if (!list || list.length === 0) return null;
      if (list.length === 1) return list[0].contributorId;
      if (taskBracketLevel === null || taskBracketLevel <= 0) {
        return list[0].contributorId;
      }

      let best = list[0];
      let bestDistance = Math.abs(best.bracketLevel - taskBracketLevel);
      for (const candidate of list) {
        const distance = Math.abs(candidate.bracketLevel - taskBracketLevel);
        if (
          distance < bestDistance ||
          (distance === bestDistance && candidate.bracketLevel < best.bracketLevel)
        ) {
          best = candidate;
          bestDistance = distance;
        }
      }

      return best.contributorId;
    };

    const tasks = await tx.project_tasks.findMany({
      where: { project_id: projectId, is_active: true },
      select: {
        id: true,
        resolved_job_role_id: true,
        task_library: {
          select: {
            default_job_role_id: true,
          },
        },
        resolved_bracket: {
          select: {
            level: true,
          },
        },
      },
    });

    await Promise.all(
      tasks.map((task) => {
        const roleId = task.task_library?.default_job_role_id ?? task.resolved_job_role_id;
        if (!roleId) {
          return Promise.resolve(null);
        }

        const assignedToId = pickCrewForBracket(roleId, task.resolved_bracket?.level ?? null);
        return tx.project_tasks.update({
          where: { id: task.id },
          data: { assigned_to_id: assignedToId },
        });
      }),
    );
  }

  private async _reassignInquiryTasksFromCrew(
    tx: Prisma.TransactionClient,
    inquiryId: number,
  ) {
    const operators = await tx.projectDayOperator.findMany({
      where: { inquiry_id: inquiryId, contributor_id: { not: null }, job_role_id: { not: null } },
      select: {
        contributor_id: true,
        job_role_id: true,
      },
    });

    if (operators.length === 0) {
      await tx.inquiry_tasks.updateMany({
        where: { inquiry_id: inquiryId, is_active: true, is_stage: false },
        data: { assigned_to_id: null },
      });
      return;
    }

    const contributorRoleRows = await tx.contributor_job_roles.findMany({
      where: {
        contributor_id: { in: operators.map((operator) => operator.contributor_id!) },
      },
      include: {
        payment_bracket: { select: { level: true } },
      },
    });

    const validAssignments = new Set(
      contributorRoleRows.map((row) => `${row.contributor_id}-${row.job_role_id}`),
    );
    const roleToCrew = new Map<number, Array<{ contributorId: number; bracketLevel: number }>>();

    for (const operator of operators) {
      const contributorId = operator.contributor_id;
      const jobRoleId = operator.job_role_id;
      if (!contributorId || !jobRoleId) continue;
      if (!validAssignments.has(`${contributorId}-${jobRoleId}`)) continue;

      const bracketLevel =
        contributorRoleRows.find(
          (row) => row.contributor_id === contributorId && row.job_role_id === jobRoleId,
        )?.payment_bracket?.level ?? 0;

      if (!roleToCrew.has(jobRoleId)) {
        roleToCrew.set(jobRoleId, []);
      }
      const list = roleToCrew.get(jobRoleId)!;
      if (!list.some((entry) => entry.contributorId === contributorId)) {
        list.push({ contributorId, bracketLevel });
      }
    }

    for (const [, list] of roleToCrew) {
      list.sort((left, right) => left.bracketLevel - right.bracketLevel);
    }

    const pickCrewForRole = (roleId: number): number | null => {
      const list = roleToCrew.get(roleId);
      if (!list || list.length === 0) return null;
      return list[0].contributorId;
    };

    const tasks = await tx.inquiry_tasks.findMany({
      where: { inquiry_id: inquiryId, is_active: true, is_stage: false },
      select: {
        id: true,
        job_role_id: true,
      },
    });

    await Promise.all(
      tasks.map((task) => {
        const roleId = task.job_role_id;
        if (!roleId) {
          return Promise.resolve(null);
        }

        const assignedToId = pickCrewForRole(roleId);
        return tx.inquiry_tasks.update({
          where: { id: task.id },
          data: { assigned_to_id: assignedToId },
        });
      }),
    );
  }

  /**
   * After cloning, check if the inquiry already has a submitted NA.
   * If so, prefill newly-created location slot names and subject real_names
   * from the NA responses.
   */
  private async _prefillFromNeedsAssessment(
    prisma: Prisma.TransactionClient | PrismaService,
    inquiryId: number,
    brandId: number | null,
  ) {
    const submission = await prisma.needs_assessment_submissions.findFirst({
      where: { inquiry_id: inquiryId, status: 'submitted' },
      select: { responses: true },
      orderBy: { submitted_at: 'desc' },
    });

    const responses = (submission?.responses ?? {}) as Record<string, unknown>;

    const inquiry = await prisma.inquiries.findUnique({
      where: { id: inquiryId },
      select: {
        contact: { select: { first_name: true, last_name: true } },
      },
    });

    // ── Prefill location slots ───────────────────────────────────
    const ACTIVITY_LOCATION_MAP: Record<string, string> = {
      ceremony: 'ceremony_location',
      'bridal prep': 'bridal_prep_location',
      'bride prep': 'bridal_prep_location',
      'groom prep': 'groom_prep_location',
      reception: 'reception_location',
    };

    const emptySlots = await prisma.projectLocationSlot.findMany({
      where: { inquiry_id: inquiryId, name: null },
      include: {
        activity_assignments: {
          include: { project_activity: { select: { name: true } } },
        },
      },
    });

    let locationsFilled = 0;
    for (const slot of emptySlots) {
      const assignedNames = slot.activity_assignments
        .map((a) => a.project_activity?.name?.toLowerCase() ?? '')
        .filter(Boolean);
      let locationName: string | null = null;

      for (const [keyword, responseKey] of Object.entries(ACTIVITY_LOCATION_MAP)) {
        if (assignedNames.some((name) => name.includes(keyword))) {
          const val = responses[responseKey];
          if (val && typeof val === 'string' && val.trim()) {
            locationName = val.trim();
            break;
          }
        }
      }

      // Fallback: use NA venue_details or ceremony_location
      if (!locationName) {
        const fallback =
          responses['ceremony_location'] ??
          responses['venue_details'];
        if (fallback && typeof fallback === 'string' && fallback.trim()) {
          locationName = fallback.trim();
        }
      }

      if (locationName) {
        // Look up an existing LocationsLibrary entry (case-insensitive) or create one
        if (brandId !== null) {
          const existingLib = await prisma.locationsLibrary.findFirst({
            where: {
              name: { equals: locationName, mode: 'insensitive' },
              brand_id: brandId,
              is_active: true,
            },
            select: { id: true },
          });
          let libEntry = existingLib;
          if (!libEntry) {
            // Attempt to geocode before creating so the library entry has coords from day one
            const coords = await geocodeAddress(locationName);
            libEntry = await prisma.locationsLibrary.create({
              data: {
                name: locationName,
                brand_id: brandId,
                ...(coords ? { lat: coords.lat, lng: coords.lng, precision: 'EXACT' } : {}),
              },
              select: { id: true },
            });
          }
          await prisma.projectLocationSlot.update({
            where: { id: slot.id },
            data: { location_id: libEntry.id, name: locationName },
          });
        } else {
          await prisma.projectLocationSlot.update({
            where: { id: slot.id },
            data: { name: locationName },
          });
        }
        locationsFilled++;
      }
    }

    // ── Prefill subject real names ───────────────────────────────
    const contactFirstName =
      ((responses['contact_first_name'] as string | undefined)?.trim()) ||
      inquiry?.contact?.first_name || '';
    const contactLastName =
      ((responses['contact_last_name'] as string | undefined)?.trim()) ||
      inquiry?.contact?.last_name || '';
    const contactFullName = [contactFirstName, contactLastName].filter(Boolean).join(' ');

    const contactRole = ((responses['contact_role'] as string | undefined) ?? '').toLowerCase().trim();
    const partnerName = ((responses['partner_name'] as string | undefined) ?? '').trim();

    const emptySubjects = await prisma.projectDaySubject.findMany({
      where: { inquiry_id: inquiryId, real_name: null },
      orderBy: { order_index: 'asc' },
    });

    let subjectsFilled = 0;
    if (contactRole && contactRole !== 'prefer not to say' && contactFullName) {
      let partnerRole: string | null = null;
      if (contactRole === 'bride') partnerRole = 'groom';
      else if (contactRole === 'groom') partnerRole = 'bride';

      for (const subject of emptySubjects) {
        const subjectLower = subject.name.toLowerCase();
        let realName: string | null = null;

        if (subjectLower.includes(contactRole)) {
          realName = contactFullName;
        } else if (partnerRole && subjectLower.includes(partnerRole) && partnerName) {
          realName = partnerName;
        }

        if (realName) {
          await prisma.projectDaySubject.update({
            where: { id: subject.id },
            data: { real_name: realName },
          });
          subjectsFilled++;
        }
      }
    }

    if (locationsFilled || subjectsFilled) {
      this.logger.log(
        `Post-clone NA prefill for inquiry ${inquiryId}: ` +
          `${locationsFilled} location(s), ${subjectsFilled} subject(s)`,
      );
    }
  }
}
