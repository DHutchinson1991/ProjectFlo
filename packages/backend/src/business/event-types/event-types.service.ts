import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEventTypeDto,
  UpdateEventTypeDto,
  LinkEventDayDto,
  LinkSubjectRoleDto,
} from './dto/event-type.dto';
import { CreatePackageFromEventTypeDto } from './dto/create-package-from-event-type.dto';

@Injectable()
export class EventTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deep include object reused across queries.
   * Loads event days (with activity presets + moments) and subject types (with roles).
   */
  private readonly deepInclude = {
    event_days: {
      orderBy: { order_index: 'asc' as const },
      include: {
        event_day_template: {
          include: {
            activity_presets: {
              orderBy: { order_index: 'asc' as const },
              include: {
                moments: {
                  orderBy: { order_index: 'asc' as const },
                },
              },
            },
          },
        },
      },
    },
    subject_roles: {
      orderBy: { order_index: 'asc' as const },
      include: {
        subject_role: true,
      },
    },
  };

  // ────────────────────────── CRUD ──────────────────────────

  async findAll(brandId: number) {
    return this.prisma.eventType.findMany({
      where: {
        brand_id: brandId,
        is_active: true,
      },
      include: this.deepInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  async findOne(id: number, brandId: number) {
    const eventType = await this.prisma.eventType.findFirst({
      where: { id, brand_id: brandId },
      include: this.deepInclude,
    });
    if (!eventType) {
      throw new NotFoundException(`Event type #${id} not found`);
    }
    return eventType;
  }

  async create(brandId: number, dto: CreateEventTypeDto) {
    // Determine next order_index
    const maxOrder = await this.prisma.eventType.aggregate({
      where: { brand_id: brandId },
      _max: { order_index: true },
    });
    const nextOrder = (maxOrder._max.order_index ?? -1) + 1;

    const eventType = await this.prisma.eventType.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        default_duration_hours: dto.default_duration_hours,
        default_start_time: dto.default_start_time,
        typical_guest_count: dto.typical_guest_count,
        order_index: dto.order_index ?? nextOrder,
      },
      include: this.deepInclude,
    });

    // Auto-create (or link) a matching service_package_category so the NA wizard
    // immediately shows packages for this event type without manual setup.
    await this.syncPackageCategory(brandId, eventType.id, dto.name);

    return eventType;
  }

  async update(id: number, brandId: number, dto: UpdateEventTypeDto) {
    // Ensure it exists for this brand
    const existing = await this.findOne(id, brandId);

    const updated = await this.prisma.eventType.update({
      where: { id },
      data: dto,
      include: this.deepInclude,
    });

    // If the name changed, keep the linked category name in sync
    if (dto.name && dto.name !== existing.name) {
      await this.syncPackageCategory(brandId, id, dto.name, existing.name);
    }

    return updated;
  }

  /**
   * Ensures a `service_package_categories` record exists for this event type.
   * - If a category with the same name already exists, links it via event_type_id.
   * - Otherwise creates a new category and links it.
   * - Safe to call multiple times (upsert pattern).
   */
  private async syncPackageCategory(
    brandId: number,
    eventTypeId: number,
    name: string,
    oldName?: string,
  ) {
    // If the event type was renamed, try to update the previously linked category name too
    if (oldName) {
      await this.prisma.service_package_categories.updateMany({
        where: { brand_id: brandId, event_type_id: eventTypeId },
        data: { name },
      }).catch(() => { /* ignore if unique constraint blocks — category may exist */ });
    }

    await this.prisma.service_package_categories.upsert({
      where: { brand_id_name: { brand_id: brandId, name } },
      create: { brand_id: brandId, name, event_type_id: eventTypeId },
      update: { event_type_id: eventTypeId },
    });
  }

  async remove(id: number, brandId: number) {
    await this.findOne(id, brandId);
    return this.prisma.eventType.delete({ where: { id } });
  }

  // ────────────────────── LINK / UNLINK EVENT DAYS ──────────────────────

  async linkEventDay(eventTypeId: number, brandId: number, dto: LinkEventDayDto) {
    await this.findOne(eventTypeId, brandId);

    // Auto-increment order_index when not provided
    let orderIndex = dto.order_index;
    if (orderIndex === undefined) {
      const maxOrder = await this.prisma.eventTypeDay.aggregate({
        where: { event_type_id: eventTypeId },
        _max: { order_index: true },
      });
      orderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    try {
      return await this.prisma.eventTypeDay.create({
        data: {
          event_type_id: eventTypeId,
          event_day_template_id: dto.event_day_template_id,
          order_index: orderIndex,
          is_default: dto.is_default ?? true,
        },
        include: {
          event_day_template: {
            include: {
              activity_presets: {
                orderBy: { order_index: 'asc' },
                include: { moments: { orderBy: { order_index: 'asc' } } },
              },
            },
          },
        },
      });
    } catch (error: unknown) {
      if ((error as any)?.code === 'P2002') {
        throw new ConflictException(
          'This event day template is already linked to this event type',
        );
      }
      throw error;
    }
  }

  async unlinkEventDay(
    eventTypeId: number,
    eventDayId: number,
    brandId: number,
  ) {
    await this.findOne(eventTypeId, brandId);

    const junction = await this.prisma.eventTypeDay.findFirst({
      where: {
        event_type_id: eventTypeId,
        event_day_template_id: eventDayId,
      },
    });
    if (!junction) {
      throw new NotFoundException('Link not found');
    }
    return this.prisma.eventTypeDay.delete({
      where: { id: junction.id },
    });
  }

  // ────────────────────── LINK / UNLINK SUBJECT ROLES ──────────────────────

  async linkSubjectRole(
    eventTypeId: number,
    brandId: number,
    dto: LinkSubjectRoleDto,
  ) {
    await this.findOne(eventTypeId, brandId);

    let orderIndex = dto.order_index;
    if (orderIndex === undefined) {
      const maxOrder = await this.prisma.eventTypeSubject.aggregate({
        where: { event_type_id: eventTypeId },
        _max: { order_index: true },
      });
      orderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    try {
      return await this.prisma.eventTypeSubject.create({
        data: {
          event_type_id: eventTypeId,
          subject_role_id: dto.subject_role_id,
          order_index: orderIndex,
          is_default: dto.is_default ?? true,
        },
        include: {
          subject_role: true,
        },
      });
    } catch (error: unknown) {
      if ((error as any)?.code === 'P2002') {
        throw new ConflictException(
          'This subject role is already linked to this event type',
        );
      }
      throw error;
    }
  }

  async unlinkSubjectRole(
    eventTypeId: number,
    subjectRoleId: number,
    brandId: number,
  ) {
    await this.findOne(eventTypeId, brandId);

    const junction = await this.prisma.eventTypeSubject.findFirst({
      where: {
        event_type_id: eventTypeId,
        subject_role_id: subjectRoleId,
      },
    });
    if (!junction) {
      throw new NotFoundException('Link not found');
    }
    return this.prisma.eventTypeSubject.delete({
      where: { id: junction.id },
    });
  }

  // ──────────────────── PACKAGE CREATION ──────────────────────

  /**
   * Create a service_package from an EventType template using wizard selections.
   * Creates event days, activities, moments, subjects, locations, crew, and equipment.
   */
  async createPackageFromEventType(
    brandId: number,
    eventTypeId: number,
    dto: CreatePackageFromEventTypeDto,
  ) {
    // 1. Validate the event type exists
    const eventType = await this.findOne(eventTypeId, brandId);

    // 1b. Fetch brand currency
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true },
    });

    // 2. Create the service_packages record
    const servicePackage = await this.prisma.service_packages.create({
      data: {
        brand_id: brandId,
        name: dto.packageName,
        description: dto.packageDescription || eventType.description,
        category: eventType.name,
        currency: brand?.currency || 'USD',
        is_active: true,
      },
    });

    // 3. Build quick-lookup sets/maps from the DTO
    const selectedDayIdSet = new Set(dto.selectedDayIds);
    const selectedMomentIdSet = new Set(dto.selectedMomentIds);
    const selectedRoleIdSet = new Set(dto.selectedRoleIds);
    const momentKeyOverrideMap = new Map<number, boolean>();
    for (const override of dto.momentKeyOverrides) {
      momentKeyOverrideMap.set(override.momentId, override.isKey);
    }
    const activityOverrideMap = new Map<
      number,
      { startTime?: string; durationMinutes?: number }
    >();
    for (const sa of dto.selectedActivities) {
      activityOverrideMap.set(sa.presetId, {
        startTime: sa.startTime,
        durationMinutes: sa.durationMinutes,
      });
    }
    const equipmentIds = [
      ...new Set((dto.equipmentSlots || []).map((slot) => slot.equipmentId)),
    ];
    const equipmentLookup = new Map<
      number,
      { id: number; item_name: string; model: string | null }
    >();
    if (equipmentIds.length > 0) {
      const equipmentRecords = await this.prisma.equipment.findMany({
        where: { id: { in: equipmentIds } },
        select: { id: true, item_name: true, model: true },
      });
      for (const equipment of equipmentRecords) {
        equipmentLookup.set(equipment.id, equipment);
      }
    }
    const dayEquipmentContents: Record<string, Prisma.InputJsonArray> = {};

    // 4. Create PackageEventDay + PackageActivity + PackageActivityMoment
    //    for each selected day
    for (const dayLink of eventType.event_days) {
      if (!selectedDayIdSet.has(dayLink.id)) continue;

      const templateId = dayLink.event_day_template.id;

      const packageEventDay = await this.prisma.packageEventDay.create({
        data: {
          package_id: servicePackage.id,
          event_day_template_id: templateId,
          order_index: dayLink.order_index,
        },
      });
      if (dto.equipmentSlots && dto.equipmentSlots.length > 0) {
        dayEquipmentContents[String(packageEventDay.id)] = dto.equipmentSlots.map(
          (slot, index) => {
            const equipment = equipmentLookup.get(slot.equipmentId);
            const parsedTrack = Number.parseInt(
              slot.slotLabel.match(/\d+/)?.[0] || '',
              10,
            );

            return {
              equipment_id: slot.equipmentId,
              slot_type: slot.slotType,
              track_number: Number.isNaN(parsedTrack) ? index + 1 : parsedTrack,
              equipment: equipment
                ? {
                    id: equipment.id,
                    item_name: equipment.item_name,
                    model: equipment.model,
                  }
                : null,
            } as Prisma.InputJsonObject;
          },
        ) as Prisma.InputJsonArray;
      }

      // 4a. Template activities
      let activityOrderIdx = 0;
      for (const preset of dayLink.event_day_template.activity_presets) {
        const override = activityOverrideMap.get(preset.id);
        if (!override) continue; // not selected

        const packageActivity = await this.prisma.packageActivity.create({
          data: {
            package_id: servicePackage.id,
            package_event_day_id: packageEventDay.id,
            name: preset.name,
            color: preset.color,
            icon: preset.icon,
            start_time: override.startTime || preset.default_start_time || null,
            duration_minutes:
              override.durationMinutes ||
              preset.default_duration_minutes ||
              60,
            order_index: activityOrderIdx++,
          },
        });

        // Moments for this activity
        let momentIdx = 0;
        for (const moment of preset.moments) {
          if (!selectedMomentIdSet.has(moment.id)) continue;

          const isKey = momentKeyOverrideMap.has(moment.id)
            ? momentKeyOverrideMap.get(moment.id)!
            : moment.is_key_moment;

          await this.prisma.packageActivityMoment.create({
            data: {
              package_activity_id: packageActivity.id,
              name: moment.name,
              order_index: momentIdx++,
              duration_seconds: moment.duration_seconds || 60,
              is_required: isKey,
            },
          });
        }
      }

      // 4b. Custom activities for this day template
      const customForDay = dto.customActivities.filter(
        (ca) => ca.dayTemplateId === templateId,
      );
      for (const ca of customForDay) {
        const packageActivity = await this.prisma.packageActivity.create({
          data: {
            package_id: servicePackage.id,
            package_event_day_id: packageEventDay.id,
            name: ca.name,
            start_time: ca.startTime || null,
            duration_minutes: ca.durationMinutes || 60,
            order_index: activityOrderIdx++,
          },
        });

        let momentIdx = 0;
        for (const cm of ca.moments) {
          await this.prisma.packageActivityMoment.create({
            data: {
              package_activity_id: packageActivity.id,
              name: cm.name,
              order_index: momentIdx++,
              duration_seconds: 60,
              is_required: cm.isKeyMoment,
            },
          });
        }
      }

      // 5. Subjects for this day (flat list from selected role IDs)
      let subjectIdx = 0;
      for (const stLink of eventType.subject_roles) {
        const role = stLink.subject_role;
        if (!selectedRoleIdSet.has(role.id)) continue;
        // Use a unique name per-day to avoid unique constraint conflicts
        await this.prisma.packageDaySubject.create({
          data: {
            package_id: servicePackage.id,
            event_day_template_id: templateId,
            role_template_id: role.id,
            name: role.role_name,
            category: 'PEOPLE',
            order_index: subjectIdx++,
            count: role.is_group ? 4 : undefined,
          },
        });
      }

      // 6. Location slots
      for (let i = 0; i < dto.locationCount && i < 5; i++) {
        await this.prisma.packageLocationSlot.create({
          data: {
            package_id: servicePackage.id,
            event_day_template_id: templateId,
            location_number: i + 1,
          },
        });
      }

      // 7. Crew assignments
      let crewIdx = 0;
      const createdCrewOperatorMap = new Map<string, number>();
      for (const crew of dto.crewAssignments) {
        try {
          const operator = await this.prisma.packageDayOperator.create({
            data: {
              package_id: servicePackage.id,
              event_day_template_id: templateId,
              contributor_id: crew.contributorId,
              job_role_id: crew.jobRoleId,
              position_name: crew.positionName,
              position_color: crew.positionColor || null,
              hours: 8,
              order_index: crewIdx++,
            },
          });
          createdCrewOperatorMap.set(
            `${crew.contributorId}:${crew.jobRoleId}`,
            operator.id,
          );
        } catch {
          // unique constraint violation – skip duplicate
        }
      }

      // 8. Equipment — attach to an explicitly selected crew-role slot when provided
      if (dto.equipmentSlots && dto.equipmentSlots.length > 0) {
        for (const slot of dto.equipmentSlots) {
          if (!slot.contributorId || !slot.jobRoleId) continue;

          const operatorId = createdCrewOperatorMap.get(
            `${slot.contributorId}:${slot.jobRoleId}`,
          );
          if (!operatorId) continue;

          try {
            await this.prisma.packageDayOperatorEquipment.create({
              data: {
                package_day_operator_id: operatorId,
                equipment_id: slot.equipmentId,
                is_primary: slot.slotLabel.includes('1'),
              },
            });
          } catch (err) {
            console.warn(`Failed to attach equipment slot "${slot.slotLabel}" to crew operator:`, err);
          }
        }
      }
    }

    if (Object.keys(dayEquipmentContents).length > 0) {
      await this.prisma.service_packages.update({
        where: { id: servicePackage.id },
        data: {
          contents: {
            day_equipment: dayEquipmentContents,
          } as Prisma.InputJsonObject,
        },
      });
    }

    // 9. Safety cleanup — delete any orphan "equipment-as-operator" placeholder
    //    records that have no real contributor and no job role. Equipment belongs
    //    in the Equipment card (via contents JSON + PackageDayOperatorEquipment),
    //    not as fake crew entries.
    await this.prisma.packageDayOperator.deleteMany({
      where: {
        package_id: servicePackage.id,
        contributor_id: null,
        job_role_id: null,
      },
    });

    // 10. Return the fully populated package
    return this.prisma.service_packages.findUniqueOrThrow({
      where: { id: servicePackage.id },
      include: {
        package_event_days: {
          orderBy: { order_index: 'asc' },
          include: {
            event_day: true,
            activities: {
              orderBy: { order_index: 'asc' },
              include: {
                moments: { orderBy: { order_index: 'asc' } },
              },
            },
          },
        },
        package_day_subjects: {
          orderBy: { order_index: 'asc' },
          include: { role_template: true },
        },
        package_location_slots: {
          orderBy: { location_number: 'asc' },
        },
        package_day_operators: {
          orderBy: { order_index: 'asc' },
          include: {
            contributor: {
              include: { contact: true },
            },
            job_role: true,
            equipment: {
              include: { equipment: true },
            },
          },
        },
      },
    });
  }
}
