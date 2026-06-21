import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';
import {
  CreateDayBlueprintLockRuleDto,
  CreateDayBlueprintMomentActionDto,
  CreateDayBlueprintMomentDto,
  CreateDayBlueprintMomentPlacementDto,
  UpdateDayBlueprintLockRuleDto,
  UpdateDayBlueprintMomentActionDto,
  UpdateDayBlueprintMomentDto,
  UpdateDayBlueprintMomentPlacementDto,
} from '../dto';
import {
  mergeDayBlueprintMomentLockFlags,
  sanitizeDayBlueprintMomentLockFlagsJson,
} from './day-blueprint-spatial-heuristics';

@Injectable()
export class DayBlueprintAuthoringMomentDetailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: DayBlueprintVersionsService,
  ) {}

  async createMoment(activityId: number, dto: CreateDayBlueprintMomentDto) {
    const activity = await this.prisma.dayBlueprintActivity.findUnique({
      where: { id: activityId },
      include: {
        day: {
          include: {
            version: {
              include: {
                day_blueprint: { select: { variant_tags: true } },
              },
            },
          },
        },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.versions.assertDraft(activity.day.day_blueprint_version_id);
    const lockFlags = sanitizeDayBlueprintMomentLockFlagsJson(dto.lock_flags);
    const newOrderIndex = dto.order_index ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.dayBlueprintMoment.create({
        data: {
          day_blueprint_activity_id: activityId,
          name: dto.name,
          description: dto.description,
          duration_seconds: dto.duration_seconds ?? 60,
          order_index: newOrderIndex,
          is_key_moment: dto.is_key_moment ?? false,
          criticality: dto.criticality ?? 'KEY',
          ...(lockFlags != null ? { lock_flags: lockFlags as Prisma.InputJsonValue } : {}),
          source_event_day_activity_moment_id: dto.source_event_day_activity_moment_id,
        },
      });

      if (dto.inherit_from_moment_id != null) {
        const tags = activity.day.version.day_blueprint.variant_tags;
        const blankAuthoring =
          tags != null &&
          typeof tags === 'object' &&
          !Array.isArray(tags) &&
          (tags as Record<string, unknown>).blank_authoring === true;
        if (!blankAuthoring) {
          throw new BadRequestException('inherit_from_moment_id is only allowed for blank-authoring blueprints');
        }

        const source = await tx.dayBlueprintMoment.findFirst({
          where: { id: dto.inherit_from_moment_id, day_blueprint_activity_id: activityId },
          include: {
            actions: { orderBy: { order_index: 'asc' } },
            placements: { orderBy: { order_index: 'asc' } },
          },
        });
        if (!source) {
          throw new BadRequestException('inherit_from_moment_id does not belong to this activity');
        }
        if (source.order_index !== newOrderIndex - 1) {
          throw new BadRequestException(
            'inherit_from_moment_id must reference the moment immediately before the new order index',
          );
        }

        for (const row of source.actions) {
          await tx.dayBlueprintMomentAction.create({
            data: {
              day_blueprint_moment_id: created.id,
              subject_role_id: row.subject_role_id,
              action_text: row.action_text,
              emphasis: row.emphasis,
              notes: row.notes,
              order_index: row.order_index,
            },
          });
        }
        for (const row of source.placements) {
          await tx.dayBlueprintMomentPlacement.create({
            data: {
              day_blueprint_moment_id: created.id,
              day_blueprint_space_slot_id: row.day_blueprint_space_slot_id,
              subject_role_id: row.subject_role_id,
              position_hint: row.position_hint,
              facing_hint: row.facing_hint,
              notes: row.notes,
              order_index: row.order_index,
            },
          });
        }
      }

      return created;
    });
  }

  async updateMoment(momentId: number, dto: UpdateDayBlueprintMomentDto) {
    const { moment, versionId } = await this.loadMomentWithVersion(momentId);
    await this.versions.assertDraft(versionId);

    const mergedLockFlags = mergeDayBlueprintMomentLockFlags(moment.lock_flags, dto.lock_flags);
    const sanitizedLockFlags = sanitizeDayBlueprintMomentLockFlagsJson(mergedLockFlags);

    return this.prisma.dayBlueprintMoment.update({
      where: { id: momentId },
      data: {
        ...dto,
        lock_flags: (sanitizedLockFlags ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }

  async deleteMoment(momentId: number) {
    const moment = await this.loadMomentWithVersion(momentId);
    await this.versions.assertDraft(moment.versionId);
    return this.prisma.dayBlueprintMoment.delete({ where: { id: momentId } });
  }

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

  async createMomentPlacement(momentId: number, dto: CreateDayBlueprintMomentPlacementDto) {
    const moment = await this.loadMomentWithVersion(momentId);
    await this.versions.assertDraft(moment.versionId);
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

  private async loadMomentWithVersion(momentId: number) {
    const moment = await this.prisma.dayBlueprintMoment.findUnique({
      where: { id: momentId },
      include: { activity: { include: { day: true } } },
    });
    if (!moment) throw new NotFoundException('Moment not found');
    return { moment, versionId: moment.activity.day.day_blueprint_version_id };
  }
}
