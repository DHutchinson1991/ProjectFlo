import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../../workflow/tasks/inquiry/services/inquiry-tasks.service';
import {
  InstanceOwner,
  CreateInstanceDayOperatorDto,
  UpdateInstanceDayOperatorDto,
} from '../dto';

@Injectable()
export class ScheduleInstanceCrewSlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inquiryTasksService: InquiryTasksService,
  ) {}

  private readonly instanceOperatorInclude = {
    crew_member: {
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
    project_activity: true,
    activity_assignments: { include: { project_activity: true } },
  };

  async getInstanceDayOperators(owner: InstanceOwner, eventDayId?: number) {
    return this.prisma.projectCrewSlot.findMany({
      where: { ...owner, ...(eventDayId ? { project_event_day_id: eventDayId } : {}) },
      include: this.instanceOperatorInclude,
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createInstanceDayOperator(owner: InstanceOwner, dto: CreateInstanceDayOperatorDto) {
    if (dto.crew_member_id) {
      const contributor = await this.prisma.crewMember.findUnique({ where: { id: dto.crew_member_id } });
      if (!contributor) throw new NotFoundException('Crew member not found');
    }

    const maxOrder = await this.prisma.projectCrewSlot.aggregate({
      where: { ...owner, project_event_day_id: dto.project_event_day_id },
      _max: { order_index: true },
    });

    return this.prisma.projectCrewSlot.create({
      data: {
        ...owner, project_event_day_id: dto.project_event_day_id,
        crew_member_id: dto.crew_member_id ?? null, job_role_id: dto.job_role_id,
        hours: dto.hours ?? 8, label: dto.label ?? null,
        order_index: (maxOrder._max.order_index ?? -1) + 1,
        project_activity_id: dto.project_activity_id ?? null,
      },
      include: this.instanceOperatorInclude,
    }).then(async (created) => {
      if (owner.inquiry_id && dto.job_role_id && dto.crew_member_id) {
        await this.inquiryTasksService.autoAssignByRole(owner.inquiry_id, dto.job_role_id, dto.crew_member_id);
      }
      return created;
    });
  }

  async updateInstanceDayOperator(operatorId: number, dto: UpdateInstanceDayOperatorDto) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.projectCrewSlot.update({
      where: { id: operatorId },
      data: {
        crew_member_id: dto.crew_member_id !== undefined ? dto.crew_member_id : undefined,
        job_role_id: dto.job_role_id ?? undefined,
        hours: dto.hours ?? undefined,
        label: dto.label !== undefined ? dto.label : undefined,
        order_index: dto.order_index ?? undefined,
        project_activity_id: dto.project_activity_id !== undefined ? dto.project_activity_id : undefined,
      },
    });

    if (existing.inquiry_id && dto.crew_member_id) {
      const jobRoleId = dto.job_role_id !== undefined ? dto.job_role_id : existing.job_role_id;
      if (jobRoleId) {
        await this.inquiryTasksService.autoAssignByRole(existing.inquiry_id, jobRoleId, dto.crew_member_id);
      }
    }

    return this.prisma.projectCrewSlot.findUnique({
      where: { id: operatorId }, include: this.instanceOperatorInclude,
    });
  }

  async assignInstanceCrewToSlot(operatorId: number, contributorId: number | null) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    if (contributorId) {
      const contributor = await this.prisma.crewMember.findUnique({ where: { id: contributorId } });
      if (!contributor) throw new NotFoundException('Crew member not found');
    }

    await this.prisma.projectCrewSlot.update({
      where: { id: operatorId }, data: { crew_member_id: contributorId },
    });

    if (existing.inquiry_id) {
      await this.inquiryTasksService.setAutoSubtaskStatus(existing.inquiry_id, 'review_estimate', false);
    }

    if (existing.inquiry_id && existing.job_role_id && contributorId) {
      await this.inquiryTasksService.autoAssignByRole(existing.inquiry_id, existing.job_role_id, contributorId);
    }

    return this.prisma.projectCrewSlot.findUnique({
      where: { id: operatorId }, include: this.instanceOperatorInclude,
    });
  }

  async removeInstanceDayOperator(operatorId: number) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');
    return this.prisma.projectCrewSlot.delete({ where: { id: operatorId } });
  }

  async setInstanceOperatorEquipment(
    operatorId: number,
    equipmentIds: { equipment_id: number; is_primary: boolean }[],
  ) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.projectCrewSlotEquipment.deleteMany({
      where: { project_crew_slot_id: operatorId },
    });

    if (equipmentIds.length > 0) {
      await this.prisma.projectCrewSlotEquipment.createMany({
        data: equipmentIds.map((eq) => ({
          project_crew_slot_id: operatorId,
          equipment_id: eq.equipment_id,
          is_primary: eq.is_primary,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.projectCrewSlot.findUnique({
      where: { id: operatorId }, include: this.instanceOperatorInclude,
    });
  }

  async assignInstanceOperatorToActivity(operatorId: number, activityId: number) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');
    try {
      await this.prisma.projectCrewSlotActivity.create({
        data: { project_crew_slot_id: operatorId, project_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }
    return this.prisma.projectCrewSlot.findUnique({
      where: { id: operatorId }, include: this.instanceOperatorInclude,
    });
  }

  async unassignInstanceOperatorFromActivity(operatorId: number, activityId: number) {
    const existing = await this.prisma.projectCrewSlot.findUnique({ where: { id: operatorId } });
    if (!existing) throw new NotFoundException('Crew slot not found');
    await this.prisma.projectCrewSlotActivity.deleteMany({
      where: { project_crew_slot_id: operatorId, project_activity_id: activityId },
    });
    return this.prisma.projectCrewSlot.findUnique({
      where: { id: operatorId }, include: this.instanceOperatorInclude,
    });
  }
}
