import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SpaceType } from '@prisma/client';
import {
  CreatePackageDaySubjectDto,
  UpdatePackageDaySubjectDto,
  CreatePackageEventDayLocationDto,
  UpdatePackageEventDayLocationDto,
  CreatePackageLocationSlotDto,
  UpdatePackageLocationSlotDto,
} from '../dto';
import { CreatePackageSpaceSlotDto, UpdatePackageSpaceSlotDto } from '../dto/package-space-slot.dto';

@Injectable()
export class SchedulePackageResourceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Package Event Day Subjects ──────────────────────────────────────

  async getPackageEventDaySubjects(packageId: number, eventDayId?: number) {
    return this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createPackageEventDaySubject(packageId: number, dto: CreatePackageDaySubjectDto) {
    const existing = await this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const subject = await this.prisma.packageDaySubject.create({
      data: {
        package_id: packageId, event_day_template_id: dto.event_day_template_id,
        role_template_id: dto.role_template_id, name: dto.name, count: dto.count,
        notes: dto.notes, order_index: dto.order_index ?? nextOrder,
      },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });

    // Keep universal activities in sync for newly-added people even before the AI planner reruns.
    await this._autoAssignSubjectToActivities(packageId, dto.event_day_template_id, subject.id);

    return this.prisma.packageDaySubject.findUnique({
      where: { id: subject.id },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  private async _autoAssignSubjectToActivities(packageId: number, eventDayTemplateId: number, subjectId: number) {
    const ped = await this.prisma.packageEventDay.findUnique({
      where: { package_id_event_day_template_id: { package_id: packageId, event_day_template_id: eventDayTemplateId } },
      select: { id: true },
    });
    if (!ped) return;
    // Only auto-assign to ceremony/reception activities
    const activities = await this.prisma.packageActivity.findMany({
      where: {
        package_id: packageId,
        package_event_day_id: ped.id,
        OR: [{ name: { contains: 'ceremony', mode: 'insensitive' } }, { name: { contains: 'reception', mode: 'insensitive' } }],
      },
      select: { id: true },
    });
    if (activities.length === 0) return;
    await this.prisma.packageDaySubjectActivity.createMany({
      data: activities.map((a) => ({ package_day_subject_id: subjectId, package_activity_id: a.id })),
      skipDuplicates: true,
    });
  }

  async updatePackageEventDaySubject(subjectId: number, dto: UpdatePackageDaySubjectDto) {
    const record = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Package event day subject not found');
    return this.prisma.packageDaySubject.update({
      where: { id: subjectId }, data: dto,
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  async deletePackageEventDaySubject(subjectId: number) {
    const record = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Package event day subject not found');
    return this.prisma.packageDaySubject.delete({ where: { id: subjectId } });
  }

  // ─── Subject Activity Assignments ────────────────────────────────────

  async assignSubjectToActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Package event day subject not found');

    try {
      await this.prisma.packageDaySubjectActivity.create({
        data: { package_day_subject_id: subjectId, package_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }

    return this.prisma.packageDaySubject.findUnique({
      where: { id: subjectId },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  async unassignSubjectFromActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Package event day subject not found');

    await this.prisma.packageDaySubjectActivity.deleteMany({
      where: { package_day_subject_id: subjectId, package_activity_id: activityId },
    });
    return this.prisma.packageDaySubject.findUnique({
      where: { id: subjectId },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  // ─── Package Event Day Locations ─────────────────────────────────────

  async getPackageEventDayLocations(packageId: number, eventDayId?: number) {
    return this.prisma.packageEventDayLocation.findMany({
      where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
      include: { location: true, package_activity: true, event_day: true },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createPackageEventDayLocation(packageId: number, dto: CreatePackageEventDayLocationDto) {
    const existing = await this.prisma.packageEventDayLocation.findMany({
      where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.packageEventDayLocation.create({
      data: {
        package_id: packageId, event_day_template_id: dto.event_day_template_id,
        package_activity_id: dto.package_activity_id, location_id: dto.location_id,
        notes: dto.notes, order_index: dto.order_index ?? nextOrder,
      },
      include: { location: true, package_activity: true, event_day: true },
    });
  }

  async updatePackageEventDayLocation(locationId: number, dto: UpdatePackageEventDayLocationDto) {
    const record = await this.prisma.packageEventDayLocation.findUnique({ where: { id: locationId } });
    if (!record) throw new NotFoundException('Package event day location not found');
    return this.prisma.packageEventDayLocation.update({
      where: { id: locationId }, data: dto,
      include: { location: true, package_activity: true, event_day: true },
    });
  }

  async deletePackageEventDayLocation(locationId: number) {
    const record = await this.prisma.packageEventDayLocation.findUnique({ where: { id: locationId } });
    if (!record) throw new NotFoundException('Package event day location not found');
    return this.prisma.packageEventDayLocation.delete({ where: { id: locationId } });
  }

  // ─── Package Location Slots ──────────────────────────────────────────

  private readonly locationSlotInclude = {
    event_day: true,
    activity_assignments: { include: { package_activity: { select: { id: true, name: true, location_label: true } } } },
    space_slots: {
      include: {
        activity_assignments: { include: { package_activity: true } },
        type_tags: true,
        preset: { select: { id: true, name: true, description: true, space_type: true, guest_capacity: true } },
        objects: { orderBy: { order_index: 'asc' as const }, select: { id: true, object_type: true, label: true, x: true, y: true, width: true, height: true, rotation: true, order_index: true } },
      },
      orderBy: { label: 'asc' as const },
    },
  };

  async getPackageLocationSlots(packageId: number, eventDayId?: number) {
    const slots = await this.prisma.packageLocationSlot.findMany({
      where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
      include: this.locationSlotInclude,
      orderBy: { location_number: 'asc' },
    });

    // Self-heal: re-link orphaned space slots (location_slot_id = null) back to a location slot
    let healed = false;
    const orphanedSpaces = await this.prisma.packageSpaceSlot.findMany({
      where: { package_id: packageId, location_slot_id: null, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
    });
    if (orphanedSpaces.length > 0 && slots.length > 0) {
      for (const orphan of orphanedSpaces) {
        // Find a location slot on the same event day
        const targetSlot = slots.find((s) => s.event_day_template_id === orphan.event_day_template_id);
        if (targetSlot) {
          await this.prisma.packageSpaceSlot.update({
            where: { id: orphan.id },
            data: { location_slot_id: targetSlot.id },
          });
          healed = true;
        }
      }
    }

    // Self-heal: ensure every assigned activity has at least one sandbox space
    for (const slot of slots) {
      const assignments: Array<{ package_activity: { id: number; name: string; location_label?: string | null } }> = slot.activity_assignments as any;
      const spaces: Array<{ activity_assignments: Array<{ package_activity_id: number }> }> = slot.space_slots as any;
      for (const assign of assignments) {
        const hasSpace = spaces.some((sp) =>
          sp.activity_assignments.some((sa) => sa.package_activity_id === assign.package_activity.id),
        );
        if (!hasSpace) {
          await this._ensureSandboxSpace(packageId, slot.event_day_template_id, slot.id, assign.package_activity);
          healed = true;
        }
      }
    }

    // Re-fetch if we created any spaces
    if (healed) {
      return this.prisma.packageLocationSlot.findMany({
        where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
        include: this.locationSlotInclude,
        orderBy: { location_number: 'asc' },
      });
    }
    return slots;
  }

  async createPackageLocationSlot(packageId: number, dto: CreatePackageLocationSlotDto) {
    let locationNumber = dto.location_number;

    if (!locationNumber) {
      const existing = await this.prisma.packageLocationSlot.findMany({
        where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
        select: { location_number: true },
        orderBy: { location_number: 'asc' },
      });
      const usedNumbers = new Set(existing.map((s) => s.location_number));
      for (let i = 1; i <= 5; i++) {
        if (!usedNumbers.has(i)) { locationNumber = i; break; }
      }
      if (!locationNumber) throw new BadRequestException('Maximum of 5 location slots per event day');
    }

    if (locationNumber < 1 || locationNumber > 5) {
      throw new BadRequestException('Location number must be between 1 and 5');
    }

    try {
      const slot = await this.prisma.packageLocationSlot.create({
        data: { package_id: packageId, event_day_template_id: dto.event_day_template_id, location_number: locationNumber },
      });
      await this._autoAssignActivitiesToLocationSlot(packageId, dto.event_day_template_id, slot.id);
      return this.prisma.packageLocationSlot.findUnique({ where: { id: slot.id }, include: this.locationSlotInclude });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new BadRequestException(`Location ${locationNumber} already exists for this event day`);
      }
      throw err;
    }
  }

  private async _autoAssignActivitiesToLocationSlot(packageId: number, eventDayTemplateId: number, slotId: number) {
    // Only auto-assign when this is the only slot on the day — multi-venue
    // setups must wire activities manually.
    const totalSlots = await this.prisma.packageLocationSlot.count({
      where: { package_id: packageId, event_day_template_id: eventDayTemplateId },
    });
    if (totalSlots !== 1) return;
    const ped = await this.prisma.packageEventDay.findUnique({
      where: { package_id_event_day_template_id: { package_id: packageId, event_day_template_id: eventDayTemplateId } },
      select: { id: true },
    });
    if (!ped) return;
    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day_id: ped.id },
      select: { id: true, name: true, location_label: true },
    });
    if (activities.length === 0) return;
    await this.prisma.locationActivityAssignment.createMany({
      data: activities.map((a) => ({ package_location_slot_id: slotId, package_activity_id: a.id })),
      skipDuplicates: true,
    });
    // Auto-create sandbox space per activity
    for (const act of activities) {
      await this._ensureSandboxSpace(packageId, eventDayTemplateId, slotId, act);
    }
  }

  /**
   * Ensure an activity has a sandbox space inside a location slot.
   * Creates the space + SpaceActivityAssignment if missing. Silently
   * skips if a label collision occurs (P2002).
   */
  // ── Label → SpaceType mapping for auto-preset in sandbox mode ──
  private static readonly LABEL_SPACE_TYPE_MAP: Record<string, SpaceType> = {
    'ceremony': SpaceType.CEREMONY_AREA,
    'ceremony space': SpaceType.CEREMONY_AREA,
    'reception': SpaceType.RECEPTION_HALL,
    'ballroom': SpaceType.RECEPTION_HALL,
    'bridal suite': SpaceType.BRIDAL_SUITE,
    'bridal prep': SpaceType.BRIDAL_SUITE,
    "groom's room": SpaceType.GROOM_SUITE,
    'groom suite': SpaceType.GROOM_SUITE,
    'groom prep': SpaceType.GROOM_SUITE,
    'cocktail': SpaceType.COCKTAIL_AREA,
    'terrace': SpaceType.COCKTAIL_AREA,
    'garden': SpaceType.GARDEN,
    'grounds': SpaceType.GARDEN,
    'dance floor': SpaceType.DANCE_FLOOR,
    'first dance': SpaceType.DANCE_FLOOR,
    'chapel': SpaceType.CHAPEL,
  };

  private _resolveSpaceType(label: string, activityName: string): SpaceType | null {
    const norm = label.toLowerCase().trim();
    // Exact match first
    if (SchedulePackageResourceService.LABEL_SPACE_TYPE_MAP[norm]) {
      return SchedulePackageResourceService.LABEL_SPACE_TYPE_MAP[norm];
    }
    // Partial match on label
    for (const [key, type] of Object.entries(SchedulePackageResourceService.LABEL_SPACE_TYPE_MAP)) {
      if (norm.includes(key) || key.includes(norm)) return type;
    }
    // Fall back to activity name
    const actNorm = activityName.toLowerCase().trim();
    for (const [key, type] of Object.entries(SchedulePackageResourceService.LABEL_SPACE_TYPE_MAP)) {
      if (actNorm.includes(key) || key.includes(actNorm)) return type;
    }
    return null;
  }

  /** Clone preset objects onto a space slot (inline to avoid cross-module dep). */
  private async _applyMatchingPreset(spaceSlotId: number, label: string, activityName: string): Promise<void> {
    const spaceType = this._resolveSpaceType(label, activityName);
    if (!spaceType) return;

    const preset = await this.prisma.floorPlanPreset.findFirst({
      where: { space_type: spaceType },
      include: { objects: { orderBy: { order_index: 'asc' } } },
    });
    if (!preset) return;

    await this.prisma.packageSpaceSlot.update({
      where: { id: spaceSlotId },
      data: { preset_id: preset.id },
    });
    if (preset.space_type) {
      await this.prisma.packageSpaceSlotTypeTag.create({
        data: { package_space_slot_id: spaceSlotId, space_type: preset.space_type },
      }).catch(() => {/* skip duplicate tag */});
    }
    for (const obj of preset.objects) {
      await this.prisma.spaceSlotObject.create({
        data: {
          package_space_slot_id: spaceSlotId,
          object_type: obj.object_type,
          label: obj.label,
          x: obj.x, y: obj.y,
          width: obj.width, height: obj.height,
          rotation: obj.rotation,
          order_index: obj.order_index,
        },
      });
    }
  }

  private async _ensureSandboxSpace(
    packageId: number,
    eventDayTemplateId: number,
    locationSlotId: number,
    activity: { id: number; name: string; location_label?: string | null },
  ): Promise<void> {
    // Check if this activity already has a space in this location
    const existing = await this.prisma.spaceActivityAssignment.findFirst({
      where: {
        package_activity_id: activity.id,
        package_space_slot: { location_slot_id: locationSlotId },
      },
    });
    if (existing) return;

    const label = activity.location_label || `${activity.name} Space`;
    try {
      const space = await this.prisma.packageSpaceSlot.create({
        data: {
          package_id: packageId,
          event_day_template_id: eventDayTemplateId,
          label,
          location_slot_id: locationSlotId,
        },
      });
      await this.prisma.spaceActivityAssignment.create({
        data: { package_space_slot_id: space.id, package_activity_id: activity.id },
      });
      // Auto-apply matching floor plan preset
      await this._applyMatchingPreset(space.id, label, activity.name);
    } catch (err) {
      // P2002 = label already exists for this day — find existing space, re-link, and assign
      if ((err as { code?: string }).code === 'P2002') {
        const existingSpace = await this.prisma.packageSpaceSlot.findFirst({
          where: { package_id: packageId, event_day_template_id: eventDayTemplateId, label },
        });
        if (existingSpace) {
          // Re-link orphaned space to this location if unlinked
          if (!existingSpace.location_slot_id) {
            await this.prisma.packageSpaceSlot.update({
              where: { id: existingSpace.id },
              data: { location_slot_id: locationSlotId },
            });
          }
          try {
            await this.prisma.spaceActivityAssignment.create({
              data: { package_space_slot_id: existingSpace.id, package_activity_id: activity.id },
            });
          } catch { /* already assigned */ }
          // Auto-apply preset if re-linked space has no objects yet
          await this._applyMatchingPreset(existingSpace.id, label, activity.name);
        }
      } else {
        throw err;
      }
    }
  }

  async deletePackageLocationSlot(slotId: number) {
    const record = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Package location slot not found');
    // Delete associated space slots to avoid orphans (schema uses onDelete: SetNull)
    await this.prisma.packageSpaceSlot.deleteMany({ where: { location_slot_id: slotId } });
    return this.prisma.packageLocationSlot.delete({ where: { id: slotId } });
  }

  async updatePackageLocationSlot(slotId: number, dto: UpdatePackageLocationSlotDto) {
    const record = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Package location slot not found');
    await this.prisma.packageLocationSlot.update({
      where: { id: slotId },
      data: { ...(dto.location_number !== undefined ? { location_number: dto.location_number } : {}) },
    });
    return this.prisma.packageLocationSlot.findUnique({ where: { id: slotId }, include: this.locationSlotInclude });
  }

  async assignLocationSlotToActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package location slot not found');

    try {
      await this.prisma.locationActivityAssignment.create({
        data: { package_location_slot_id: slotId, package_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }

    // Auto-create sandbox space for this activity if it doesn't have one
    const activity = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
      select: { id: true, name: true, location_label: true },
    });
    if (activity) {
      await this._ensureSandboxSpace(
        existing.package_id,
        existing.event_day_template_id,
        slotId,
        activity,
      );
    }

    return this.prisma.packageLocationSlot.findUnique({ where: { id: slotId }, include: this.locationSlotInclude });
  }

  async unassignLocationSlotFromActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package location slot not found');

    await this.prisma.locationActivityAssignment.deleteMany({
      where: { package_location_slot_id: slotId, package_activity_id: activityId },
    });
    return this.prisma.packageLocationSlot.findUnique({ where: { id: slotId }, include: this.locationSlotInclude });
  }

  // ─── Package Space Slots ─────────────────────────────────────────────

  private readonly spaceSlotInclude = {
    event_day: true,
    location_slot: true,
    location_space: true,
    activity_assignments: { include: { package_activity: true } },
    type_tags: true,
    preset: { select: { id: true, name: true, description: true, space_type: true, guest_capacity: true } },
    objects: { orderBy: { order_index: 'asc' as const }, select: { id: true, object_type: true, label: true, x: true, y: true, width: true, height: true, rotation: true, order_index: true } },
  };

  async getPackageSpaceSlots(packageId: number, eventDayId?: number) {
    return this.prisma.packageSpaceSlot.findMany({
      where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
      include: this.spaceSlotInclude,
      orderBy: { label: 'asc' },
    });
  }

  async createPackageSpaceSlot(packageId: number, dto: CreatePackageSpaceSlotDto) {
    try {
      const slot = await this.prisma.packageSpaceSlot.create({
        data: {
          package_id: packageId,
          event_day_template_id: dto.event_day_template_id,
          label: dto.label,
          location_slot_id: dto.location_slot_id ?? null,
          location_space_id: dto.location_space_id ?? null,
          preset_id: dto.preset_id ?? null,
          ...(dto.space_type_tags?.length ? {
            type_tags: { create: dto.space_type_tags.map((t) => ({ space_type: t })) },
          } : {}),
        },
      });

      // Auto-apply preset objects if a preset was specified
      if (dto.preset_id) {
        await this.applyPresetObjects(slot.id, dto.preset_id);
      }

      return this.prisma.packageSpaceSlot.findUnique({ where: { id: slot.id }, include: this.spaceSlotInclude });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new BadRequestException(`Space "${dto.label}" already exists for this event day`);
      }
      throw err;
    }
  }

  /** Clone FloorPlanPresetObject records → SpaceSlotObject for a space slot. */
  private async applyPresetObjects(spaceSlotId: number, presetId: number): Promise<void> {
    const preset = await this.prisma.floorPlanPreset.findUnique({
      where: { id: presetId },
      include: { objects: { orderBy: { order_index: 'asc' } } },
    });
    if (!preset) return;

    for (const obj of preset.objects) {
      await this.prisma.spaceSlotObject.create({
        data: {
          package_space_slot_id: spaceSlotId,
          object_type: obj.object_type,
          label: obj.label,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          rotation: obj.rotation,
          order_index: obj.order_index,
        },
      });
    }
  }

  async updatePackageSpaceSlot(slotId: number, dto: UpdatePackageSpaceSlotDto) {
    const record = await this.prisma.packageSpaceSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Package space slot not found');
    const data: Record<string, unknown> = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.location_slot_id !== undefined) data.location_slot_id = dto.location_slot_id;
    if (dto.location_space_id !== undefined) data.location_space_id = dto.location_space_id;

    if (dto.space_type_tags !== undefined) {
      // Replace all tags: delete existing, create new
      await this.prisma.$transaction([
        this.prisma.packageSpaceSlotTypeTag.deleteMany({ where: { package_space_slot_id: slotId } }),
        this.prisma.packageSpaceSlot.update({ where: { id: slotId }, data }),
        ...dto.space_type_tags.map((t) =>
          this.prisma.packageSpaceSlotTypeTag.create({
            data: { package_space_slot_id: slotId, space_type: t },
          }),
        ),
      ]);
    } else {
      await this.prisma.packageSpaceSlot.update({ where: { id: slotId }, data });
    }
    return this.prisma.packageSpaceSlot.findUnique({ where: { id: slotId }, include: this.spaceSlotInclude });
  }

  async deletePackageSpaceSlot(slotId: number) {
    const record = await this.prisma.packageSpaceSlot.findUnique({
      where: { id: slotId },
      include: { activity_assignments: true },
    });
    if (!record) throw new NotFoundException('Package space slot not found');

    // Guard: check if any assigned activity would become spaceless
    if (record.location_slot_id && record.activity_assignments.length > 0) {
      for (const assign of record.activity_assignments) {
        const otherSpaces = await this.prisma.spaceActivityAssignment.count({
          where: {
            package_activity_id: assign.package_activity_id,
            package_space_slot: { location_slot_id: record.location_slot_id },
            package_space_slot_id: { not: slotId },
          },
        });
        if (otherSpaces === 0) {
          const activity = await this.prisma.packageActivity.findUnique({
            where: { id: assign.package_activity_id },
            select: { name: true },
          });
          throw new BadRequestException(
            `Cannot delete: "${activity?.name ?? 'Activity'}" would have no planning space. Reassign the activity first or create another space.`,
          );
        }
      }
    }

    return this.prisma.packageSpaceSlot.delete({ where: { id: slotId } });
  }

  async assignSpaceSlotToActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageSpaceSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package space slot not found');
    try {
      await this.prisma.spaceActivityAssignment.create({
        data: { package_space_slot_id: slotId, package_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }
    return this.prisma.packageSpaceSlot.findUnique({ where: { id: slotId }, include: this.spaceSlotInclude });
  }

  async unassignSpaceSlotFromActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageSpaceSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package space slot not found');
    await this.prisma.spaceActivityAssignment.deleteMany({
      where: { package_space_slot_id: slotId, package_activity_id: activityId },
    });
    return this.prisma.packageSpaceSlot.findUnique({ where: { id: slotId }, include: this.spaceSlotInclude });
  }

  /**
   * Import spaces from a venue's LocationSpace records into PackageSpaceSlots.
   * Handles merge: matches existing slots by space_type tags, creates new ones
   * for unmatched venue spaces, and links via location_space_id.
   */
  async importSpacesFromVenue(
    packageId: number,
    locationSlotId: number,
    locationId: number,
  ) {
    // 1. Fetch the location slot to get the event day
    const locationSlot = await this.prisma.packageLocationSlot.findUnique({
      where: { id: locationSlotId },
    });
    if (!locationSlot) throw new NotFoundException('Package location slot not found');
    if (locationSlot.package_id !== packageId) throw new BadRequestException('Location slot does not belong to this package');

    // 2. Fetch venue spaces with their type tags
    const venueSpaces = await this.prisma.locationSpace.findMany({
      where: { location_id: locationId, is_active: true },
      include: { type_tags: true },
      orderBy: { name: 'asc' },
    });

    // 3. Fetch existing space slots for this location slot
    const existingSlots = await this.prisma.packageSpaceSlot.findMany({
      where: { package_id: packageId, location_slot_id: locationSlotId },
      include: { type_tags: true },
    });

    // 4. Build a map of existing slot type_tags for matching
    const existingSlotsWithTypes = existingSlots.map((s) => ({
      ...s,
      typeSet: new Set(s.type_tags.map((t) => t.space_type)),
    }));

    const results = { created: 0, merged: 0, skipped: 0 };
    const usedExistingSlotIds = new Set<number>();

    for (const venueSpace of venueSpaces) {
      const venueTypeTags = venueSpace.type_tags.map((t) => t.space_type);
      const venueTypeSet = new Set(venueTypeTags);

      // 5a. Check if already linked by location_space_id
      const alreadyLinked = existingSlots.find((s) => s.location_space_id === venueSpace.id);
      if (alreadyLinked) {
        results.skipped++;
        usedExistingSlotIds.add(alreadyLinked.id);
        continue;
      }

      // 5b. Try to match by overlapping type tags
      let matched = false;
      if (venueTypeSet.size > 0) {
        for (const existing of existingSlotsWithTypes) {
          if (usedExistingSlotIds.has(existing.id)) continue;
          // Check for any overlap in type tags
          const overlap = [...venueTypeSet].some((t) => existing.typeSet.has(t));
          if (overlap) {
            // Merge: update label + link location_space_id
            await this.prisma.packageSpaceSlot.update({
              where: { id: existing.id },
              data: {
                label: venueSpace.name,
                location_space_id: venueSpace.id,
              },
            });
            // Sync type tags from the venue space
            await this.prisma.$transaction([
              this.prisma.packageSpaceSlotTypeTag.deleteMany({ where: { package_space_slot_id: existing.id } }),
              ...venueTypeTags.map((t) =>
                this.prisma.packageSpaceSlotTypeTag.create({
                  data: { package_space_slot_id: existing.id, space_type: t },
                }),
              ),
            ]);
            usedExistingSlotIds.add(existing.id);
            results.merged++;
            matched = true;
            break;
          }
        }
      }

      // 5c. No match — create new space slot
      if (!matched) {
        try {
          const newSlot = await this.prisma.packageSpaceSlot.create({
            data: {
              package_id: packageId,
              event_day_template_id: locationSlot.event_day_template_id,
              label: venueSpace.name,
              location_slot_id: locationSlotId,
              location_space_id: venueSpace.id,
              ...(venueTypeTags.length ? {
                type_tags: { create: venueTypeTags.map((t) => ({ space_type: t })) },
              } : {}),
            },
          });
          usedExistingSlotIds.add(newSlot.id);
          results.created++;
        } catch (err) {
          // P2002 = unique constraint violation (label already exists for this day)
          if ((err as { code?: string }).code === 'P2002') {
            results.skipped++;
          } else {
            throw err;
          }
        }
      }
    }

    // 6. Return all space slots for this location slot, refreshed
    const allSlots = await this.prisma.packageSpaceSlot.findMany({
      where: { package_id: packageId, location_slot_id: locationSlotId },
      include: this.spaceSlotInclude,
      orderBy: { label: 'asc' },
    });

    return { slots: allSlots, results };
  }
}
