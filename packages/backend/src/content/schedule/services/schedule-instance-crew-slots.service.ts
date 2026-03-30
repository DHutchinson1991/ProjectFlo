import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../../workflow/tasks/inquiry/services/inquiry-tasks.service';
import {
  InstanceOwner,
  CreateInstanceCrewSlotDto,
  UpdateInstanceCrewSlotDto,
} from '../dto';

@Injectable()
export class ScheduleInstanceCrewSlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inquiryTasksService: InquiryTasksService,
  ) {}

  private readonly instanceCrewSlotInclude = {
    crew: {
      include: {
        contact: { select: { id: true, first_name: true, last_name: true, email: true } },
        job_role_assignments: {
          include: {
            job_role: { select: { id: true, name: true, display_name: true } },
            payment_bracket: {
              select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, day_rate: true },
            },
          },
        },
      },
    },
    job_role: { select: { id: true, name: true, display_name: true, category: true } },
    equipment: { include: { equipment: true } },
    project_event_day: true,
    activity_assignments: { include: { project_activity: true } },
  };

  private toCompatibleSlot(slot: Record<string, any>) {
    return {
      ...slot,
      event_day_template_id: slot.project_event_day_id,
      project_activity_id: slot.activity_assignments?.[0]?.project_activity_id ?? null,
      package_activity_id: slot.activity_assignments?.[0]?.project_activity_id ?? null,
    };
  }

  async getInstanceDayCrewSlots(owner: InstanceOwner, eventDayId?: number) {
    const rows = await this.prisma.projectCrewSlot.findMany({
      where: { ...owner, ...(eventDayId ? { project_event_day_id: eventDayId } : {}) },
      include: this.instanceCrewSlotInclude,
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
    return rows.map((row) => this.toCompatibleSlot(row));
  }

  async createInstanceCrewSlot(owner: InstanceOwner, dto: CreateInstanceCrewSlotDto) {
    if (dto.crew_id) {
      const crew = await this.prisma.crew.findUnique({ where: { id: dto.crew_id } });
      if (!crew) throw new NotFoundException('Crew not found');
    }

    const maxOrder = await this.prisma.projectCrewSlot.aggregate({
      where: { ...owner, project_event_day_id: dto.project_event_day_id },
      _max: { order_index: true },
    });

    return this.prisma.projectCrewSlot.create({
      data: {
        ...owner, project_event_day_id: dto.project_event_day_id,
        crew_id: dto.crew_id ?? null, job_role_id: dto.job_role_id,
        hours: dto.hours ?? 8, label: dto.label ?? null,
        order_index: (maxOrder._max.order_index ?? -1) + 1,
      },
      include: this.instanceCrewSlotInclude,
    }).then(async (created) => {
      if (owner.inquiry_id && dto.job_role_id && dto.crew_id) {
        await this.inquiryTasksService.autoAssignByRole(owner.inquiry_id, dto.job_role_id, dto.crew_id);
      }
      return this.toCompatibleSlot(created);
    });
  }

  async updateInstanceCrewSlot(crewSlotId: number, dto: UpdateInstanceCrewSlotDto) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: crewSlotId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.projectCrewSlot.update({
      where: { id: crewSlotId },
      data: {
        crew_id: dto.crew_id !== undefined ? dto.crew_id : undefined,
        job_role_id: dto.job_role_id ?? undefined,
        hours: dto.hours ?? undefined,
        label: dto.label !== undefined ? dto.label : undefined,
        order_index: dto.order_index ?? undefined,
      },
    });

    if (existing.inquiry_id && dto.crew_id) {
      const jobRoleId = dto.job_role_id !== undefined ? dto.job_role_id : existing.job_role_id;
      if (jobRoleId) {
        await this.inquiryTasksService.autoAssignByRole(existing.inquiry_id, jobRoleId, dto.crew_id);
      }
    }

    const row = await this.prisma.projectCrewSlot.findUnique({
      where: { id: crewSlotId }, include: this.instanceCrewSlotInclude,
    });
    return row ? this.toCompatibleSlot(row) : row;
  }

  async assignInstanceCrewToSlot(crewSlotId: number, crewId: number | null) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: crewSlotId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    if (crewId) {
      const crew = await this.prisma.crew.findUnique({ where: { id: crewId } });
      if (!crew) throw new NotFoundException('Crew not found');
    }

    await this.prisma.projectCrewSlot.update({
      where: { id: crewSlotId }, data: { crew_id: crewId },
    });

    if (existing.inquiry_id) {
      await this.inquiryTasksService.setAutoSubtaskStatus(existing.inquiry_id, 'review_estimate', false);
    }

    if (existing.inquiry_id && existing.job_role_id && crewId) {
      await this.inquiryTasksService.autoAssignByRole(existing.inquiry_id, existing.job_role_id, crewId);
    }

    const row = await this.prisma.projectCrewSlot.findUnique({
      where: { id: crewSlotId }, include: this.instanceCrewSlotInclude,
    });
    return row ? this.toCompatibleSlot(row) : row;
  }

  async removeInstanceCrewSlot(crewSlotId: number) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: crewSlotId } });
    if (!existing) throw new NotFoundException('Crew slot not found');
    return this.prisma.projectCrewSlot.delete({ where: { id: crewSlotId } });
  }

  async setInstanceCrewSlotEquipment(
    crewSlotId: number,
    equipmentIds: { equipment_id: number; is_primary: boolean }[],
  ) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: crewSlotId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.projectCrewSlotEquipment.deleteMany({
      where: { project_crew_slot_id: crewSlotId },
    });

    if (equipmentIds.length > 0) {
      await this.prisma.projectCrewSlotEquipment.createMany({
        data: equipmentIds.map((eq) => ({
          project_crew_slot_id: crewSlotId,
          equipment_id: eq.equipment_id,
          is_primary: eq.is_primary,
        })),
        skipDuplicates: true,
      });
    }

    const row = await this.prisma.projectCrewSlot.findUnique({
      where: { id: crewSlotId }, include: this.instanceCrewSlotInclude,
    });
    return row ? this.toCompatibleSlot(row) : row;
  }

  async assignInstanceCrewSlotToActivity(crewSlotId: number, activityId: number) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: crewSlotId } });
    if (!existing) throw new NotFoundException('Crew slot not found');
    try {
      await this.prisma.projectCrewSlotActivity.create({
        data: { project_crew_slot_id: crewSlotId, project_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }
    const row = await this.prisma.projectCrewSlot.findUnique({
      where: { id: crewSlotId }, include: this.instanceCrewSlotInclude,
    });
    return row ? this.toCompatibleSlot(row) : row;
  }

  async unassignInstanceCrewSlotFromActivity(crewSlotId: number, activityId: number) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: crewSlotId } });
    if (!existing) throw new NotFoundException('Crew slot not found');
    await this.prisma.projectCrewSlotActivity.deleteMany({
      where: { project_crew_slot_id: crewSlotId, project_activity_id: activityId },
    });
    const row = await this.prisma.projectCrewSlot.findUnique({
      where: { id: crewSlotId }, include: this.instanceCrewSlotInclude,
    });
    return row ? this.toCompatibleSlot(row) : row;
  }
}
