import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  InstanceOwner,
  CreateProjectEventDayDto,
  CreateProjectActivityDto,
  UpdateProjectActivityDto,
  CreateInstanceActivityMomentDto,
  UpdateInstanceActivityMomentDto,
  UpdateProjectEventDayDto,
} from '../dto';

@Injectable()
export class ScheduleInstanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Instance Event Days ─────────────────────────────────────────────

  async getInstanceEventDays(owner: InstanceOwner) {
    return this.prisma.projectEventDay.findMany({
      where: { ...owner },
      include: {
        event_day_template: true,
        activities: { orderBy: { order_index: 'asc' } },
        day_crew_slots: { orderBy: { order_index: 'asc' } },
        subjects: { orderBy: { order_index: 'asc' } },
        location_slots: { orderBy: { location_number: 'asc' } },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createInstanceEventDay(owner: InstanceOwner, dto: CreateProjectEventDayDto) {
    return this.prisma.projectEventDay.create({
      data: {
        ...owner, event_day_template_id: dto.event_day_template_id,
        name: dto.name, date: new Date(dto.date), start_time: dto.start_time,
        end_time: dto.end_time, order_index: dto.order_index ?? 0, notes: dto.notes,
      },
      include: { event_day_template: true },
    });
  }

  async updateProjectEventDay(eventDayId: number, dto: UpdateProjectEventDayDto) {
    return this.prisma.projectEventDay.update({
      where: { id: eventDayId },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      include: { event_day_template: true },
    });
  }

  async deleteProjectEventDay(eventDayId: number) {
    return this.prisma.projectEventDay.delete({ where: { id: eventDayId } });
  }

  // ─── Instance Activities ─────────────────────────────────────────────

  private readonly instanceActivityInclude = {
    package_activity: true,
    moments: { orderBy: { order_index: 'asc' as const } },
    crew_slot_assignments: true,
    subject_assignments: true,
    location_assignments: true,
    scene_schedules: true,
  };

  async getInstanceActivities(owner: InstanceOwner, projectEventDayId: number) {
    return this.prisma.projectActivity.findMany({
      where: { ...owner, project_event_day_id: projectEventDayId },
      include: this.instanceActivityInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  async getInstanceAllActivities(owner: InstanceOwner) {
    return this.prisma.projectActivity.findMany({
      where: { ...owner },
      include: this.instanceActivityInclude,
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createInstanceActivity(owner: InstanceOwner, dto: CreateProjectActivityDto) {
    return this.prisma.projectActivity.create({
      data: {
        ...owner, project_event_day_id: dto.project_event_day_id,
        package_activity_id: dto.package_activity_id, name: dto.name,
        description: dto.description, color: dto.color, icon: dto.icon,
        start_time: dto.start_time, end_time: dto.end_time,
        duration_minutes: dto.duration_minutes, order_index: dto.order_index ?? 0, notes: dto.notes,
      },
      include: this.instanceActivityInclude,
    });
  }

  async updateProjectActivity(activityId: number, dto: UpdateProjectActivityDto) {
    const existing = await this.prisma.projectActivity.findUnique({ where: { id: activityId } });
    if (!existing) throw new NotFoundException('Project activity not found');
    return this.prisma.projectActivity.update({
      where: { id: activityId }, data: dto, include: { package_activity: true },
    });
  }

  async deleteProjectActivity(activityId: number) {
    const existing = await this.prisma.projectActivity.findUnique({ where: { id: activityId } });
    if (!existing) throw new NotFoundException('Project activity not found');
    return this.prisma.projectActivity.delete({ where: { id: activityId } });
  }

  // ─── Instance Activity Moments ───────────────────────────────────────

  private readonly instanceMomentInclude = { project_activity: true };

  async getInstanceActivityMoments(activityId: number) {
    return this.prisma.projectActivityMoment.findMany({
      where: { project_activity_id: activityId },
      include: this.instanceMomentInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  async createInstanceActivityMoment(owner: InstanceOwner, dto: CreateInstanceActivityMomentDto) {
    const existing = await this.prisma.projectActivityMoment.findMany({
      where: { project_activity_id: dto.project_activity_id },
      orderBy: { order_index: 'desc' }, take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.projectActivityMoment.create({
      data: {
        ...owner, project_activity_id: dto.project_activity_id, name: dto.name,
        order_index: dto.order_index ?? nextOrder, duration_seconds: dto.duration_seconds ?? 60,
        is_required: dto.is_required ?? true, notes: dto.notes,
      },
      include: this.instanceMomentInclude,
    });
  }

  async updateInstanceActivityMoment(momentId: number, dto: UpdateInstanceActivityMomentDto) {
    const record = await this.prisma.projectActivityMoment.findUnique({ where: { id: momentId } });
    if (!record) throw new NotFoundException('Activity moment not found');
    return this.prisma.projectActivityMoment.update({
      where: { id: momentId }, data: dto, include: this.instanceMomentInclude,
    });
  }

  async deleteInstanceActivityMoment(momentId: number) {
    const record = await this.prisma.projectActivityMoment.findUnique({ where: { id: momentId } });
    if (!record) throw new NotFoundException('Activity moment not found');
    return this.prisma.projectActivityMoment.delete({ where: { id: momentId } });
  }

  async reorderInstanceActivityMoments(activityId: number, momentIds: number[]) {
    const updates = momentIds.map((id, index) =>
      this.prisma.projectActivityMoment.update({ where: { id }, data: { order_index: index } }),
    );
    await this.prisma.$transaction(updates);
    return this.getInstanceActivityMoments(activityId);
  }

}
