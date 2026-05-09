import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';
import { DayBlueprintDefaultsService } from './day-blueprint-defaults.service';
import {
  CreateDayBlueprintDayDto,
  UpdateDayBlueprintDayDto,
  CreateDayBlueprintActivityDto,
  UpdateDayBlueprintActivityDto,
  CreateDayBlueprintMomentDto,
  UpdateDayBlueprintMomentDto,
  CreateDayBlueprintSubjectRoleDto,
  UpdateDayBlueprintSubjectRoleDto,
  CreateDayBlueprintSpaceSlotDto,
  UpdateDayBlueprintSpaceSlotDto,
  CreateDayBlueprintMomentActionDto,
  UpdateDayBlueprintMomentActionDto,
  CreateDayBlueprintMomentPlacementDto,
  UpdateDayBlueprintMomentPlacementDto,
  CreateDayBlueprintLockRuleDto,
  UpdateDayBlueprintLockRuleDto,
  LinkActivityLocationDto,
} from '../dto';

/**
 * Authoring CRUD for everything inside a DayBlueprint version:
 * days, activities, moments, subject roles, space slots, moment
 * actions, moment placements, lock rules, and activity→location-role
 * links. All mutations are guarded by `versions.assertDraft(...)` so
 * published versions remain immutable.
 */
@Injectable()
export class DayBlueprintAuthoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: DayBlueprintVersionsService,
    private readonly defaults: DayBlueprintDefaultsService,
  ) {}

  // ─── Days ──────────────────────────────────────────────────────────

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

  // ─── Activities ────────────────────────────────────────────────────

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

  // ─── Moments ───────────────────────────────────────────────────────

  async createMoment(activityId: number, dto: CreateDayBlueprintMomentDto) {
    const activity = await this.prisma.dayBlueprintActivity.findUnique({
      where: { id: activityId },
      include: { day: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.versions.assertDraft(activity.day.day_blueprint_version_id);
    return this.prisma.dayBlueprintMoment.create({
      data: {
        day_blueprint_activity_id: activityId,
        name: dto.name,
        description: dto.description,
        duration_seconds: dto.duration_seconds ?? 60,
        order_index: dto.order_index ?? 0,
        is_key_moment: dto.is_key_moment ?? false,
        criticality: dto.criticality ?? 'STANDARD',
        lock_flags: (dto.lock_flags ?? undefined) as Prisma.InputJsonValue | undefined,
        source_event_day_activity_moment_id: dto.source_event_day_activity_moment_id,
      },
    });
  }

  async updateMoment(momentId: number, dto: UpdateDayBlueprintMomentDto) {
    const { moment, versionId } = await this.loadMomentWithVersion(momentId);
    await this.versions.assertDraft(versionId);

    const currentNoSpatial = hasNoSpatialLock(moment.lock_flags);
    const lockFlagsInput = dto.lock_flags === undefined
      ? moment.lock_flags
      : (dto.lock_flags ?? undefined);
    const nextNoSpatial = hasNoSpatialLock(lockFlagsInput);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.dayBlueprintMoment.update({
        where: { id: momentId },
        data: {
          ...dto,
          lock_flags: (dto.lock_flags ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });

      if (!currentNoSpatial && nextNoSpatial) {
        await tx.dayBlueprintMomentPlacement.deleteMany({
          where: { day_blueprint_moment_id: momentId },
        });
      }

      return updated;
    });
  }

  async deleteMoment(momentId: number) {
    const moment = await this.loadMomentWithVersion(momentId);
    await this.versions.assertDraft(moment.versionId);
    return this.prisma.dayBlueprintMoment.delete({ where: { id: momentId } });
  }

  // ─── Subject roles ─────────────────────────────────────────────────

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

  // ─── Space slots ───────────────────────────────────────────────────

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

  // ─── Activity → location role links ────────────────────────────────

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

  // ─── Moment actions ────────────────────────────────────────────────

  async createMomentAction(momentId: number, dto: CreateDayBlueprintMomentActionDto) {
    const moment = await this.loadMomentWithVersion(momentId);
    await this.versions.assertDraft(moment.versionId);
    return this.prisma.dayBlueprintMomentAction.create({
      data: {
        day_blueprint_moment_id: momentId,
        subject_role_id: dto.subject_role_id,
        action_text: dto.action_text,
        emphasis: dto.emphasis ?? 'PRIMARY',
        notes: dto.notes,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateMomentAction(actionId: number, dto: UpdateDayBlueprintMomentActionDto) {
    const action = await this.prisma.dayBlueprintMomentAction.findUnique({
      where: { id: actionId },
      include: { moment: { include: { activity: { include: { day: true } } } } },
    });
    if (!action) throw new NotFoundException('Moment action not found');
    await this.versions.assertDraft(action.moment.activity.day.day_blueprint_version_id);
    return this.prisma.dayBlueprintMomentAction.update({ where: { id: actionId }, data: dto });
  }

  async deleteMomentAction(actionId: number) {
    const action = await this.prisma.dayBlueprintMomentAction.findUnique({
      where: { id: actionId },
      include: { moment: { include: { activity: { include: { day: true } } } } },
    });
    if (!action) throw new NotFoundException('Moment action not found');
    await this.versions.assertDraft(action.moment.activity.day.day_blueprint_version_id);
    return this.prisma.dayBlueprintMomentAction.delete({ where: { id: actionId } });
  }

  // ─── Moment placements ─────────────────────────────────────────────

  async createMomentPlacement(momentId: number, dto: CreateDayBlueprintMomentPlacementDto) {
    const moment = await this.loadMomentWithVersion(momentId);
    await this.versions.assertDraft(moment.versionId);
    this.assertMomentAllowsSpatial(moment.moment.lock_flags, momentId);
    return this.prisma.dayBlueprintMomentPlacement.create({
      data: {
        day_blueprint_moment_id: momentId,
        day_blueprint_space_slot_id: dto.day_blueprint_space_slot_id,
        subject_role_id: dto.subject_role_id,
        position_hint: dto.position_hint ?? 'UNSPECIFIED',
        facing_hint: dto.facing_hint ?? 'UNSPECIFIED',
        notes: dto.notes,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateMomentPlacement(placementId: number, dto: UpdateDayBlueprintMomentPlacementDto) {
    const placement = await this.prisma.dayBlueprintMomentPlacement.findUnique({
      where: { id: placementId },
      include: { moment: { include: { activity: { include: { day: true } } } } },
    });
    if (!placement) throw new NotFoundException('Placement not found');
    await this.versions.assertDraft(placement.moment.activity.day.day_blueprint_version_id);
    this.assertMomentAllowsSpatial(placement.moment.lock_flags, placement.moment.id);
    return this.prisma.dayBlueprintMomentPlacement.update({ where: { id: placementId }, data: dto });
  }

  async deleteMomentPlacement(placementId: number) {
    const placement = await this.prisma.dayBlueprintMomentPlacement.findUnique({
      where: { id: placementId },
      include: { moment: { include: { activity: { include: { day: true } } } } },
    });
    if (!placement) throw new NotFoundException('Placement not found');
    await this.versions.assertDraft(placement.moment.activity.day.day_blueprint_version_id);
    return this.prisma.dayBlueprintMomentPlacement.delete({ where: { id: placementId } });
  }

  // ─── Lock rules ────────────────────────────────────────────────────

  async createLockRule(versionId: number, dto: CreateDayBlueprintLockRuleDto) {
    await this.versions.assertDraft(versionId);
    return this.prisma.dayBlueprintLockRule.create({
      data: {
        day_blueprint_version_id: versionId,
        scope: dto.scope,
        target_id: dto.target_id,
        rule_key: dto.rule_key,
        rule_value: (dto.rule_value ?? undefined) as Prisma.InputJsonValue | undefined,
        notes: dto.notes,
      },
    });
  }

  async updateLockRule(ruleId: number, dto: UpdateDayBlueprintLockRuleDto) {
    const rule = await this.prisma.dayBlueprintLockRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Lock rule not found');
    await this.versions.assertDraft(rule.day_blueprint_version_id);
    return this.prisma.dayBlueprintLockRule.update({
      where: { id: ruleId },
      data: {
        ...dto,
        rule_value: (dto.rule_value ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteLockRule(ruleId: number) {
    const rule = await this.prisma.dayBlueprintLockRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Lock rule not found');
    await this.versions.assertDraft(rule.day_blueprint_version_id);
    return this.prisma.dayBlueprintLockRule.delete({ where: { id: ruleId } });
  }

  // ─── helpers ──────────────────────────────────────────────────────

  private async loadMomentWithVersion(momentId: number) {
    const moment = await this.prisma.dayBlueprintMoment.findUnique({
      where: { id: momentId },
      include: { activity: { include: { day: true } } },
    });
    if (!moment) throw new NotFoundException('Moment not found');
    return { moment, versionId: moment.activity.day.day_blueprint_version_id };
  }

  private assertMomentAllowsSpatial(lockFlags: unknown, momentId: number) {
    if (hasNoSpatialLock(lockFlags)) {
      throw new BadRequestException(`Moment #${momentId} is marked no-spatial and cannot store placements`);
    }
  }
}

function hasNoSpatialLock(lockFlags: unknown): boolean {
  if (!lockFlags || typeof lockFlags !== 'object') return false;
  return Boolean((lockFlags as Record<string, unknown>).no_spatial);
}
