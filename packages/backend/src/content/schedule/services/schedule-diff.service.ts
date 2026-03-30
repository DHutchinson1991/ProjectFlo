import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InstanceOwner } from '../dto';

/* ── Lightweight shapes matching Prisma includes used in getScheduleDiff ── */

interface DiffEventDay {
  event_day_template_id: number | null;
  order_index: number;
  name?: string | null;
  event_day_template?: { name: string } | null;
  event_day?: { name: string } | null;
}

interface DiffActivity {
  id: number;
  package_activity_id?: number | null;
  name: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  package_event_day?: { event_day?: { name: string } | null } | null;
  project_event_day?: { name: string } | null;
}

interface DiffSubject {
  id: number;
  source_package_subject_id?: number | null;
  name: string | null;
  role_template?: { role_name: string } | null;
}

interface DiffCrewSlot {
  id: number;
  source_slot_id?: number | null;
  label?: string | null;
  job_role_id: number | null;
  job_role?: { name: string; display_name: string | null } | null;
}

interface DiffLocationSlot {
  id: number;
  source_package_location_slot_id?: number | null;
  name?: string | null;
  location_number: number;
}

@Injectable()
export class ScheduleDiffService {
  constructor(private readonly prisma: PrismaService) {}

  async getScheduleDiff(owner: InstanceOwner) {
    const isProject = 'project_id' in owner && owner.project_id != null;
    const ownerId = isProject ? owner.project_id : owner.inquiry_id;

    const sourcePackageId = await this.getSourcePackageId(isProject, ownerId);

    if (!sourcePackageId) {
      return this.buildEmptyDiff();
    }

    const [instance, pkg] = await Promise.all([
      this.fetchInstanceData(owner),
      this.fetchPackageData(sourcePackageId),
    ]);

    const diffs = {
      event_days: this.buildEventDayDiffs(instance.days, pkg.days),
      activities: this.buildActivityDiffs(instance.activities, pkg.activities),
      subjects: this.buildSubjectDiffs(instance.subjects, pkg.subjects),
      crew_slots: this.buildCrewSlotDiffs(instance.crewSlots, pkg.crewSlots),
      location_slots: this.buildLocationDiffs(instance.slots, pkg.slots),
    };

    const allDiffs = Object.values(diffs).flat();
    const added = allDiffs.filter((d) => d.change === 'added').length;
    const removed = allDiffs.filter((d) => d.change === 'removed').length;
    const modified = allDiffs.filter((d) => d.change === 'modified').length;

    return {
      has_source_package: true,
      source_package_id: sourcePackageId,
      counts: {
        package: {
          event_days: pkg.days.length,
          activities: pkg.activities.length,
          subjects: pkg.subjects.length,
          crew_slots: pkg.crewSlots.length,
          location_slots: pkg.slots.length,
        },
        instance: {
          event_days: instance.days.length,
          activities: instance.activities.length,
          subjects: instance.subjects.length,
          crew_slots: instance.crewSlots.length,
          location_slots: instance.slots.length,
        },
      },
      diffs,
      summary: { total_changes: added + removed + modified, added, removed, modified },
    };
  }

  private async getSourcePackageId(isProject: boolean, ownerId: number | undefined): Promise<number | null> {
    if (isProject) {
      const project = await this.prisma.projects.findUnique({
        where: { id: ownerId! },
        select: { source_package_id: true },
      });
      if (!project) throw new NotFoundException(`Project ${ownerId} not found`);
      return project.source_package_id;
    }

    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: ownerId! },
      select: { source_package_id: true },
    });
    if (!inquiry) throw new NotFoundException(`Inquiry ${ownerId} not found`);
    return inquiry.source_package_id;
  }

  private buildEmptyDiff() {
    return {
      has_source_package: false,
      source_package_id: null,
      diffs: { event_days: [], activities: [], subjects: [], crew_slots: [], location_slots: [] },
      summary: { total_changes: 0, added: 0, removed: 0, modified: 0 },
    };
  }

  private async fetchInstanceData(owner: InstanceOwner) {
    const [days, activities, subjects, crewSlots, slots] = await Promise.all([
      this.prisma.projectEventDay.findMany({
        where: owner,
        include: { event_day_template: { select: { id: true, name: true } } },
        orderBy: { order_index: 'asc' },
      }),
      this.prisma.projectActivity.findMany({
        where: owner,
        include: { project_event_day: { select: { id: true, name: true, event_day_template_id: true } } },
        orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
      }),
      this.prisma.projectDaySubject.findMany({
        where: owner,
        include: { role_template: { select: { id: true, role_name: true } } },
        orderBy: { order_index: 'asc' },
      }),
      this.prisma.projectCrewSlot.findMany({
        where: owner,
        include: { job_role: { select: { id: true, name: true, display_name: true } } },
        orderBy: { order_index: 'asc' },
      }),
      this.prisma.projectLocationSlot.findMany({ where: owner, orderBy: { order_index: 'asc' } }),
    ]);
    return { days, activities, subjects, crewSlots, slots };
  }

  private async fetchPackageData(packageId: number) {
    const [days, activities, subjects, crewSlots, slots] = await Promise.all([
      this.prisma.packageEventDay.findMany({
        where: { package_id: packageId },
        include: { event_day: { select: { id: true, name: true } } },
        orderBy: { order_index: 'asc' },
      }),
      this.prisma.packageActivity.findMany({
        where: { package_id: packageId },
        include: {
          package_event_day: {
            select: { id: true, event_day_template_id: true, event_day: { select: { name: true } } },
          },
        },
        orderBy: [{ package_event_day_id: 'asc' }, { order_index: 'asc' }],
      }),
      this.prisma.packageDaySubject.findMany({
        where: { package_id: packageId },
        include: { role_template: { select: { id: true, role_name: true } } },
        orderBy: { order_index: 'asc' },
      }),
      this.prisma.packageCrewSlot.findMany({
        where: { package_id: packageId },
        include: { job_role: { select: { id: true, name: true, display_name: true } } },
        orderBy: { order_index: 'asc' },
      }),
      this.prisma.packageLocationSlot.findMany({
        where: { package_id: packageId },
        orderBy: { location_number: 'asc' },
      }),
    ]);
    return { days, activities, subjects, crewSlots, slots };
  }

  private buildEventDayDiffs(instanceDays: DiffEventDay[], pkgDays: DiffEventDay[]) {
    const pkgTemplateIds = new Set(pkgDays.map((d) => d.event_day_template_id));
    const instTemplateIds = new Set(instanceDays.map((d) => d.event_day_template_id));
    return [
      ...pkgDays.filter((d) => !instTemplateIds.has(d.event_day_template_id)).map((d) => ({
        change: 'removed' as const, name: d.event_day?.name ?? `Day ${d.order_index + 1}`, template_id: d.event_day_template_id,
      })),
      ...instanceDays.filter((d) => d.event_day_template_id != null && !pkgTemplateIds.has(d.event_day_template_id!)).map((d) => ({
        change: 'added' as const, name: d.event_day_template?.name ?? d.name ?? `Day ${d.order_index + 1}`, template_id: d.event_day_template_id,
      })),
      ...instanceDays.filter((d) => d.event_day_template_id == null).map((d) => ({
        change: 'added' as const, name: d.name ?? `Day ${d.order_index + 1}`, template_id: null,
      })),
    ];
  }

  private buildActivityDiffs(instanceActivities: DiffActivity[], pkgActivities: DiffActivity[]) {
    const instSourceMap = new Map(instanceActivities.filter((a) => a.package_activity_id != null).map((a) => [a.package_activity_id!, a]));
    const diffs: Array<{ change: string; name: string; detail?: string }> = [];
    for (const pa of pkgActivities) {
      const inst = instSourceMap.get(pa.id);
      if (!inst) { diffs.push({ change: 'removed', name: pa.name, detail: `Was in ${pa.package_event_day?.event_day?.name ?? 'Unknown Day'}` }); continue; }
      const changes: string[] = [];
      if (inst.name !== pa.name) changes.push(`name: "${pa.name}" → "${inst.name}"`);
      if (inst.start_time !== pa.start_time) changes.push('start time changed');
      if (inst.end_time !== pa.end_time) changes.push('end time changed');
      if (inst.duration_minutes !== pa.duration_minutes) changes.push('duration changed');
      if (changes.length > 0) diffs.push({ change: 'modified', name: inst.name, detail: changes.join(', ') });
    }
    for (const ia of instanceActivities) { if (!ia.package_activity_id) diffs.push({ change: 'added', name: ia.name }); }
    return diffs;
  }

  private buildSubjectDiffs(instanceSubjects: DiffSubject[], pkgSubjects: DiffSubject[]) {
    const instMap = new Map(instanceSubjects.filter((s) => s.source_package_subject_id != null).map((s) => [s.source_package_subject_id!, s]));
    const diffs: Array<{ change: string; name: string; detail?: string }> = [];
    for (const ps of pkgSubjects) {
      const inst = instMap.get(ps.id);
      if (!inst) { diffs.push({ change: 'removed', name: ps.name ?? ps.role_template?.role_name ?? 'Unknown' }); continue; }
      const changes: string[] = [];
      const pkgName = ps.name ?? ps.role_template?.role_name ?? '';
      const instName = inst.name ?? inst.role_template?.role_name ?? '';
      if (instName !== pkgName) changes.push(`name: "${pkgName}" → "${instName}"`);
      if (changes.length > 0) diffs.push({ change: 'modified', name: instName || pkgName, detail: changes.join(', ') });
    }
    for (const is_ of instanceSubjects) { if (!is_.source_package_subject_id) diffs.push({ change: 'added', name: is_.name ?? is_.role_template?.role_name ?? 'Unknown' }); }
    return diffs;
  }

  private buildCrewSlotDiffs(instanceCrewSlots: DiffCrewSlot[], pkgCrewSlots: DiffCrewSlot[]) {
    const instMap = new Map(instanceCrewSlots.filter((o) => o.source_slot_id != null).map((o) => [o.source_slot_id!, o]));
    const diffs: Array<{ change: string; name: string; detail?: string }> = [];
    for (const po of pkgCrewSlots) {
      const inst = instMap.get(po.id);
      const pkgName = po.label ?? po.job_role?.display_name ?? po.job_role?.name ?? 'Unknown';
      if (!inst) { diffs.push({ change: 'removed', name: pkgName }); continue; }
      const changes: string[] = [];
      const instName = inst.label ?? inst.job_role?.display_name ?? inst.job_role?.name ?? '';
      if (instName !== pkgName) changes.push(`position: "${pkgName}" → "${instName}"`);
      if (inst.job_role_id !== po.job_role_id) changes.push('role changed');
      if (changes.length > 0) diffs.push({ change: 'modified', name: instName || pkgName, detail: changes.join(', ') });
    }
    for (const io of instanceCrewSlots) {
      if (!io.source_slot_id) diffs.push({ change: 'added', name: io.label ?? io.job_role?.display_name ?? io.job_role?.name ?? 'Unknown' });
    }
    return diffs;
  }

  private buildLocationDiffs(instanceSlots: DiffLocationSlot[], pkgSlots: DiffLocationSlot[]) {
    const instSourceIds = new Set(instanceSlots.filter((l) => l.source_package_location_slot_id != null).map((l) => l.source_package_location_slot_id));
    const diffs: Array<{ change: string; name: string }> = [];
    for (const pl of pkgSlots) { if (!instSourceIds.has(pl.id)) diffs.push({ change: 'removed', name: `Location ${pl.location_number}` }); }
    for (const il of instanceSlots) { if (!il.source_package_location_slot_id) diffs.push({ change: 'added', name: il.name ?? `Location ${il.location_number}` }); }
    return diffs;
  }
}
