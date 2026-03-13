import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ProjectFilmCloneService } from './project-film-clone.service';

/**
 * Owner target for cloning — exactly one of projectId or inquiryId must be set.
 */
export interface CloneTarget {
  projectId?: number;
  inquiryId?: number;
  packageId: number;
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
  ) {
    return this.clonePackageToOwner({ inquiryId, packageId }, tx);
  }

  /**
   * Generic clone: accepts a CloneTarget specifying either projectId or inquiryId.
   * Safe to call within an existing transaction (pass `tx`) or standalone.
   */
  async clonePackageToOwner(
    target: CloneTarget,
    tx?: Prisma.TransactionClient,
  ) {
    if (!target.projectId && !target.inquiryId) {
      throw new Error('CloneTarget must specify either projectId or inquiryId');
    }
    if (target.projectId && target.inquiryId) {
      throw new Error('CloneTarget cannot specify both projectId and inquiryId');
    }
    const prisma = tx ?? this.prisma;
    return this._clone(prisma, target);
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
      select: { id: true, contents: true },
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
    // Also: EventDayTemplate.id → ProjectEventDay.id (for operators/subjects that reference template IDs)
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
    const packageSubjects = await prisma.packageEventDaySubject.findMany({
      where: { package_id: packageId },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });

    // Map: PackageEventDaySubject.id → ProjectEventDaySubject.id
    const subjectMap = new Map<number, number>();

    for (const ps of packageSubjects) {
      const projDayId = templateToProjectDayMap.get(ps.event_day_template_id);
      if (!projDayId) continue;

      const projActivityId = ps.package_activity_id
        ? activityMap.get(ps.package_activity_id) ?? null
        : null;

      const projectSubject = await prisma.projectEventDaySubject.create({
        data: {
          ...ownerFields,
          project_event_day_id: projDayId,
          project_activity_id: projActivityId,
          source_package_subject_id: ps.id,
          role_template_id: ps.role_template_id,
          name: ps.name,
          real_name: null, // User fills this in later
          count: ps.count ?? null, // Preserve group headcount (e.g. Bridesmaids: 4)
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
          project_activity_id: null, // Set via assignments below
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
            const eventDayTemplateId = source.event_day_template_id;
            const projectEventDayId = eventDayTemplateId
              ? templateToProjectDayMap.get(eventDayTemplateId) ?? null
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
    const subAssignments = await prisma.subjectActivityAssignment.findMany({
      where: {
        package_event_day_subject: { package_id: packageId },
      },
    });

    let subAssignmentsCopied = 0;
    for (const sa of subAssignments) {
      const projSubjectId = subjectMap.get(sa.package_event_day_subject_id);
      const projActivityId = activityMap.get(sa.package_activity_id);
      if (!projSubjectId || !projActivityId) continue;

      await prisma.projectSubjectActivityAssignment.create({
        data: {
          project_event_day_subject_id: projSubjectId,
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
      return this._clone(tx, { projectId, packageId: project.source_package_id! });
    });
  }

  /**
   * Delete all instance schedule data for an inquiry, then re-clone from
   * its source_package_id.
   */
  async syncInquiryScheduleFromPackage(inquiryId: number) {
    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: inquiryId },
      select: { id: true, source_package_id: true },
    });
    if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);
    if (!inquiry.source_package_id) {
      throw new NotFoundException(`Inquiry ${inquiryId} has no source package`);
    }

    return this.prisma.$transaction(async (tx) => {
      await this._deleteInstanceData(tx, { inquiry_id: inquiryId });
      return this._clone(tx, { inquiryId, packageId: inquiry.source_package_id! });
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
    await tx.projectSubjectActivityAssignment.deleteMany({
      where: { project_event_day_subject: where },
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
    await tx.projectEventDaySubject.deleteMany({ where });
    await tx.projectLocationSlot.deleteMany({ where });
    await tx.projectDayOperator.deleteMany({ where });
    await tx.projectFilm.deleteMany({ where });
    await tx.projectActivity.deleteMany({ where });
    await tx.projectEventDay.deleteMany({ where });

    this.logger.debug(`Deleted all instance data for ${JSON.stringify(owner)}`);
  }
}
