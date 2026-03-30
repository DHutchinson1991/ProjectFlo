import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  CreatePackageActivityDto,
  UpdatePackageActivityDto,
  CreatePackageActivityMomentDto,
  UpdatePackageActivityMomentDto,
  BulkCreatePackageActivityMomentsDto,
} from '../dto';
import { getDefaultMomentsForActivity } from '../constants/default-moments';

@Injectable()
export class SchedulePackageActivityService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Package Activities ──────────────────────────────────────────────

  async getPackageActivities(packageId: number) {
    return this.prisma.packageActivity.findMany({
      where: { package_id: packageId },
      include: {
        package_event_day: { include: { event_day: true } },
        scene_schedules: { include: { scene: true, package_film: { include: { film: true } } } },
        crew_slot_assignments: { include: { package_crew_slot: { include: { crew: { include: { contact: true } }, job_role: true, equipment: { include: { equipment: true } } } } } },
        moments: { orderBy: { order_index: 'asc' } },
      },
      orderBy: [{ package_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async getPackageActivitiesByDay(packageId: number, packageEventDayId: number) {
    return this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day_id: packageEventDayId },
      include: {
        scene_schedules: { include: { scene: true, package_film: { include: { film: true } } } },
        crew_slot_assignments: { include: { package_crew_slot: { include: { crew: { include: { contact: true } }, job_role: true, equipment: { include: { equipment: true } } } } } },
        moments: { orderBy: { order_index: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createPackageActivity(packageId: number, dto: CreatePackageActivityDto) {
    const ped = await this.prisma.packageEventDay.findFirst({
      where: { id: dto.package_event_day_id, package_id: packageId },
      include: { event_day: true },
    });
    if (!ped) throw new NotFoundException('Package event day not found');

    const existing = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day_id: dto.package_event_day_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const activity = await this.prisma.packageActivity.create({
      data: {
        package_id: packageId, package_event_day_id: dto.package_event_day_id,
        name: dto.name, description: dto.description, color: dto.color, icon: dto.icon,
        start_time: dto.start_time, end_time: dto.end_time,
        duration_minutes: dto.duration_minutes, order_index: dto.order_index ?? nextOrder,
      },
      include: { package_event_day: { include: { event_day: true } }, moments: { orderBy: { order_index: 'asc' } } },
    });

    const isWeddingDay = ped.event_day?.name?.toLowerCase().includes('wedding');
    if (isWeddingDay) {
      const defaultMoments = getDefaultMomentsForActivity(dto.name);
      if (defaultMoments.length > 0) {
        await this.prisma.packageActivityMoment.createMany({
          data: defaultMoments.map((m) => ({ package_activity_id: activity.id, ...m })),
        });
      }
    }

    await this._autoAssignOnSiteSlots(packageId, dto.package_event_day_id, activity.id);
    if (this._isAllSubjectsActivity(dto.name)) {
      await this._autoAssignSubjectsToActivity(packageId, ped.event_day_template_id, activity.id);
    }
    await this._autoAssignLocationSlotsToActivity(packageId, ped.event_day_template_id, activity.id);

    return this.prisma.packageActivity.findUnique({
      where: { id: activity.id },
      include: {
        package_event_day: { include: { event_day: true } },
        moments: { orderBy: { order_index: 'asc' } },
        crew_slot_assignments: { include: { package_crew_slot: { include: { crew: { include: { contact: true } }, job_role: true } } } },
        subject_assignments: { include: { package_day_subject: { include: { role_template: true } } } },
        location_assignments: { include: { package_location_slot: true } },
      },
    });
  }

  private async _autoAssignOnSiteSlots(packageId: number, packageEventDayId: number, activityId: number) {
    const onSiteSlots = await this.prisma.packageCrewSlot.findMany({
      where: { package_id: packageId, package_event_day_id: packageEventDayId },
      select: { id: true },
    });
    if (onSiteSlots.length === 0) return;
    await this.prisma.packageCrewSlotActivity.createMany({
      data: onSiteSlots.map((slot) => ({ package_crew_slot_id: slot.id, package_activity_id: activityId })),
      skipDuplicates: true,
    });
  }

  private _isAllSubjectsActivity(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('ceremony') || n.includes('reception');
  }

  private async _autoAssignSubjectsToActivity(packageId: number, eventDayTemplateId: number, activityId: number) {
    const subjects = await this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId, event_day_template_id: eventDayTemplateId },
      select: { id: true },
    });
    if (subjects.length === 0) return;
    await this.prisma.packageDaySubjectActivity.createMany({
      data: subjects.map((s) => ({ package_day_subject_id: s.id, package_activity_id: activityId })),
      skipDuplicates: true,
    });
  }

  private async _autoAssignLocationSlotsToActivity(packageId: number, eventDayTemplateId: number, activityId: number) {
    const slots = await this.prisma.packageLocationSlot.findMany({
      where: { package_id: packageId, event_day_template_id: eventDayTemplateId },
      select: { id: true },
    });
    // Only auto-assign when there is exactly one slot — multiple slots means the
    // package builder has intentionally split venues and must wire them manually.
    if (slots.length !== 1) return;
    await this.prisma.locationActivityAssignment.createMany({
      data: slots.map((s) => ({ package_location_slot_id: s.id, package_activity_id: activityId })),
      skipDuplicates: true,
    });
  }

  async updatePackageActivity(activityId: number, dto: UpdatePackageActivityDto) {
    const existing = await this.prisma.packageActivity.findUnique({ where: { id: activityId } });
    if (!existing) throw new NotFoundException('Package activity not found');

    return this.prisma.packageActivity.update({
      where: { id: activityId },
      data: dto,
      include: {
        package_event_day: { include: { event_day: true } },
        scene_schedules: { include: { scene: true, package_film: { include: { film: true } } } },
        crew_slot_assignments: { include: { package_crew_slot: { include: { crew: { include: { contact: true } }, job_role: true } } } },
      },
    });
  }

  async deletePackageActivity(activityId: number) {
    const existing = await this.prisma.packageActivity.findUnique({ where: { id: activityId } });
    if (!existing) throw new NotFoundException('Package activity not found');
    return this.prisma.packageActivity.delete({ where: { id: activityId } });
  }

  async reorderPackageActivities(packageId: number, packageEventDayId: number, activityIds: number[]) {
    const updates = activityIds.map((id, idx) =>
      this.prisma.packageActivity.updateMany({
        where: { id, package_id: packageId, package_event_day_id: packageEventDayId },
        data: { order_index: idx },
      }),
    );
    await Promise.all(updates);
    return this.getPackageActivitiesByDay(packageId, packageEventDayId);
  }

  // ─── Package Activity Moments ────────────────────────────────────────

  async getActivityMoments(activityId: number) {
    const activity = await this.prisma.packageActivity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Package activity not found');
    return this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
  }

  async createActivityMoment(activityId: number, dto: CreatePackageActivityMomentDto) {
    const activity = await this.prisma.packageActivity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Package activity not found');

    const existing = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.packageActivityMoment.create({
      data: {
        package_activity_id: activityId, name: dto.name,
        order_index: dto.order_index ?? nextOrder, duration_seconds: dto.duration_seconds ?? 60,
        is_required: dto.is_required ?? true, notes: dto.notes,
      },
    });
  }

  async bulkCreateActivityMoments(activityId: number, dto: BulkCreatePackageActivityMomentsDto) {
    const activity = await this.prisma.packageActivity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Package activity not found');

    const existing = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const startOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const data = dto.moments.map((m, idx) => ({
      package_activity_id: activityId, name: m.name,
      order_index: m.order_index ?? startOrder + idx, duration_seconds: m.duration_seconds ?? 60,
      is_required: m.is_required ?? true, notes: m.notes,
    }));
    await this.prisma.packageActivityMoment.createMany({ data });

    return this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
  }

  async updateActivityMoment(momentId: number, dto: UpdatePackageActivityMomentDto) {
    const existing = await this.prisma.packageActivityMoment.findUnique({ where: { id: momentId } });
    if (!existing) throw new NotFoundException('Activity moment not found');
    return this.prisma.packageActivityMoment.update({ where: { id: momentId }, data: dto });
  }

  async deleteActivityMoment(momentId: number) {
    const existing = await this.prisma.packageActivityMoment.findUnique({ where: { id: momentId } });
    if (!existing) throw new NotFoundException('Activity moment not found');
    return this.prisma.packageActivityMoment.delete({ where: { id: momentId } });
  }

  async reorderActivityMoments(activityId: number, momentIds: number[]) {
    const updates = momentIds.map((id, idx) =>
      this.prisma.packageActivityMoment.updateMany({
        where: { id, package_activity_id: activityId },
        data: { order_index: idx },
      }),
    );
    await Promise.all(updates);
    return this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
  }
}
