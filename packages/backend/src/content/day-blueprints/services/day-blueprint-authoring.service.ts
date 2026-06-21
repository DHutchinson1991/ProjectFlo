import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';
import { DayBlueprintDefaultsService } from './day-blueprint-defaults.service';
import { DayBlueprintAuthoringMomentDetailsService } from './day-blueprint-authoring-moment-details.service';
import {
  CreateDayBlueprintActivityDto,
  CreateDayBlueprintDayDto,
  CreateDayBlueprintLockRuleDto,
  CreateDayBlueprintMomentActionDto,
  CreateDayBlueprintMomentDto,
  CreateDayBlueprintMomentPlacementDto,
  CreateDayBlueprintSpaceSlotDto,
  CreateDayBlueprintSubjectRoleDto,
  LinkActivityLocationDto,
  UpdateDayBlueprintActivityDto,
  UpdateDayBlueprintDayDto,
  UpdateDayBlueprintLockRuleDto,
  UpdateDayBlueprintMomentActionDto,
  UpdateDayBlueprintMomentDto,
  UpdateDayBlueprintMomentPlacementDto,
  UpdateDayBlueprintSpaceSlotDto,
  UpdateDayBlueprintSubjectRoleDto,
} from '../dto';

@Injectable()
export class DayBlueprintAuthoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: DayBlueprintVersionsService,
    private readonly defaults: DayBlueprintDefaultsService,
    private readonly momentDetails: DayBlueprintAuthoringMomentDetailsService,
  ) {}

  async createDay(versionId: number, dto: CreateDayBlueprintDayDto) {
    await this.versions.assertDraft(versionId);
    return this.prisma.dayBlueprintDay.create({
      data: {
        day_blueprint_version_id: versionId,
        name: dto.name,
        description: dto.description,
        default_start_time: dto.default_start_time,
        default_duration_hours: dto.default_duration_hours,
        order_index: dto.order_index ?? 0,
        source_event_day_id: dto.source_event_day_id,
      },
    });
  }

  async updateDay(dayId: number, dto: UpdateDayBlueprintDayDto) {
    const day = await this.prisma.dayBlueprintDay.findUnique({ where: { id: dayId } });
    if (!day) throw new NotFoundException('Day not found');
    await this.versions.assertDraft(day.day_blueprint_version_id);
    return this.prisma.dayBlueprintDay.update({ where: { id: dayId }, data: dto });
  }

  async deleteDay(dayId: number) {
    const day = await this.prisma.dayBlueprintDay.findUnique({ where: { id: dayId } });
    if (!day) throw new NotFoundException('Day not found');
    await this.versions.assertDraft(day.day_blueprint_version_id);
    return this.prisma.dayBlueprintDay.delete({ where: { id: dayId } });
  }

  async createActivity(dayId: number, dto: CreateDayBlueprintActivityDto) {
    const day = await this.prisma.dayBlueprintDay.findUnique({
      where: { id: dayId },
      include: {
        version: {
          include: {
            day_blueprint: {
              select: { brand_id: true },
            },
          },
        },
      },
    });
    if (!day) throw new NotFoundException('Day not found');
    await this.versions.assertDraft(day.day_blueprint_version_id);
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.dayBlueprintActivity.create({
        data: {
          day_blueprint_day_id: dayId,
          name: dto.name,
          description: dto.description,
          icon: dto.icon,
          color: dto.color,
          default_start_time: dto.default_start_time,
          default_duration_minutes: dto.default_duration_minutes,
          duration_min_minutes: dto.duration_min_minutes,
          duration_max_minutes: dto.duration_max_minutes,
          target_moment_count: dto.target_moment_count ?? undefined,
          order_index: dto.order_index ?? 0,
          criticality: dto.criticality ?? 'REQUIRED',
          lock_flags: (dto.lock_flags ?? undefined) as Prisma.InputJsonValue | undefined,
          source_event_day_activity_id: dto.source_event_day_activity_id,
        },
      });

      await this.defaults.ensureActivityLocationDefaults(tx, {
        brandId: day.version.day_blueprint.brand_id,
        versionId: day.day_blueprint_version_id,
        activityId: activity.id,
        activityName: activity.name,
        sourceEventDayActivityId: dto.source_event_day_activity_id,
      });

      return activity;
    });
  }

  async updateActivity(activityId: number, dto: UpdateDayBlueprintActivityDto) {
    const activity = await this.prisma.dayBlueprintActivity.findUnique({
      where: { id: activityId },
      include: { day: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.versions.assertDraft(activity.day.day_blueprint_version_id);
    return this.prisma.dayBlueprintActivity.update({
      where: { id: activityId },
      data: {
        ...dto,
        lock_flags: (dto.lock_flags ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteActivity(activityId: number) {
    const activity = await this.prisma.dayBlueprintActivity.findUnique({
      where: { id: activityId },
      include: { day: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.versions.assertDraft(activity.day.day_blueprint_version_id);
    return this.prisma.dayBlueprintActivity.delete({ where: { id: activityId } });
  }

  async createMoment(activityId: number, dto: CreateDayBlueprintMomentDto) {
    return this.momentDetails.createMoment(activityId, dto);
  }

  async updateMoment(momentId: number, dto: UpdateDayBlueprintMomentDto) {
    return this.momentDetails.updateMoment(momentId, dto);
  }

  async deleteMoment(momentId: number) {
    return this.momentDetails.deleteMoment(momentId);
  }

  async addSubjectRole(versionId: number, dto: CreateDayBlueprintSubjectRoleDto) {
    await this.versions.assertDraft(versionId);
    return this.prisma.dayBlueprintSubjectRole.create({
      data: {
        day_blueprint_version_id: versionId,
        subject_role_id: dto.subject_role_id,
        is_primary: dto.is_primary ?? false,
        typical_count: dto.typical_count,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateSubjectRole(rowId: number, dto: UpdateDayBlueprintSubjectRoleDto) {
    const row = await this.prisma.dayBlueprintSubjectRole.findUnique({ where: { id: rowId } });
    if (!row) throw new NotFoundException('Subject role link not found');
    await this.versions.assertDraft(row.day_blueprint_version_id);
    return this.prisma.dayBlueprintSubjectRole.update({ where: { id: rowId }, data: dto });
  }

  async removeSubjectRole(rowId: number) {
    const row = await this.prisma.dayBlueprintSubjectRole.findUnique({ where: { id: rowId } });
    if (!row) throw new NotFoundException('Subject role link not found');
    await this.versions.assertDraft(row.day_blueprint_version_id);
    return this.prisma.dayBlueprintSubjectRole.delete({ where: { id: rowId } });
  }

  async createSpaceSlot(versionId: number, dto: CreateDayBlueprintSpaceSlotDto) {
    await this.versions.assertDraft(versionId);
    return this.prisma.dayBlueprintSpaceSlot.create({
      data: {
        day_blueprint_version_id: versionId,
        day_blueprint_location_role_id: dto.day_blueprint_location_role_id,
        key: dto.key,
        label: dto.label,
        description: dto.description,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateSpaceSlot(slotId: number, dto: UpdateDayBlueprintSpaceSlotDto) {
    const slot = await this.prisma.dayBlueprintSpaceSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Space slot not found');
    await this.versions.assertDraft(slot.day_blueprint_version_id);
    return this.prisma.dayBlueprintSpaceSlot.update({ where: { id: slotId }, data: dto });
  }

  async deleteSpaceSlot(slotId: number) {
    const slot = await this.prisma.dayBlueprintSpaceSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Space slot not found');
    await this.versions.assertDraft(slot.day_blueprint_version_id);
    return this.prisma.dayBlueprintSpaceSlot.delete({ where: { id: slotId } });
  }

  async linkActivityLocation(activityId: number, dto: LinkActivityLocationDto) {
    const activity = await this.prisma.dayBlueprintActivity.findUnique({
      where: { id: activityId },
      include: { day: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.versions.assertDraft(activity.day.day_blueprint_version_id);
    return this.prisma.$transaction(async (tx) => {
      const link = await tx.dayBlueprintActivityLocation.upsert({
        where: {
          day_blueprint_activity_id_day_blueprint_location_role_id: {
            day_blueprint_activity_id: activityId,
            day_blueprint_location_role_id: dto.day_blueprint_location_role_id,
          },
        },
        create: {
          day_blueprint_activity_id: activityId,
          day_blueprint_location_role_id: dto.day_blueprint_location_role_id,
          is_primary: dto.is_primary ?? false,
          notes: dto.notes,
          order_index: dto.order_index ?? 0,
        },
        update: {
          is_primary: dto.is_primary ?? false,
          notes: dto.notes,
          order_index: dto.order_index ?? 0,
        },
      });

      const locationRole = await tx.dayBlueprintLocationRole.findUnique({
        where: { id: dto.day_blueprint_location_role_id },
        select: { display_name: true, description: true },
      });

      if (locationRole) {
        await this.defaults.ensureDefaultSpaceSlotForLocationRole(tx, {
          versionId: activity.day.day_blueprint_version_id,
          locationRoleId: dto.day_blueprint_location_role_id,
          locationRoleLabel: locationRole.display_name,
          locationRoleDescription: locationRole.description,
        });
      }

      return link;
    });
  }

  async unlinkActivityLocation(linkId: number) {
    const link = await this.prisma.dayBlueprintActivityLocation.findUnique({
      where: { id: linkId },
      include: { activity: { include: { day: true } } },
    });
    if (!link) throw new NotFoundException('Activity location link not found');
    await this.versions.assertDraft(link.activity.day.day_blueprint_version_id);
    return this.prisma.dayBlueprintActivityLocation.delete({ where: { id: linkId } });
  }

  async createMomentAction(momentId: number, dto: CreateDayBlueprintMomentActionDto) {
    return this.momentDetails.createMomentAction(momentId, dto);
  }

  async updateMomentAction(actionId: number, dto: UpdateDayBlueprintMomentActionDto) {
    return this.momentDetails.updateMomentAction(actionId, dto);
  }

  async deleteMomentAction(actionId: number) {
    return this.momentDetails.deleteMomentAction(actionId);
  }

  async createMomentPlacement(momentId: number, dto: CreateDayBlueprintMomentPlacementDto) {
    return this.momentDetails.createMomentPlacement(momentId, dto);
  }

  async updateMomentPlacement(placementId: number, dto: UpdateDayBlueprintMomentPlacementDto) {
    return this.momentDetails.updateMomentPlacement(placementId, dto);
  }

  async deleteMomentPlacement(placementId: number) {
    return this.momentDetails.deleteMomentPlacement(placementId);
  }

  async createLockRule(versionId: number, dto: CreateDayBlueprintLockRuleDto) {
    return this.momentDetails.createLockRule(versionId, dto);
  }

  async updateLockRule(ruleId: number, dto: UpdateDayBlueprintLockRuleDto) {
    return this.momentDetails.updateLockRule(ruleId, dto);
  }

  async deleteLockRule(ruleId: number) {
    return this.momentDetails.deleteLockRule(ruleId);
  }
}
