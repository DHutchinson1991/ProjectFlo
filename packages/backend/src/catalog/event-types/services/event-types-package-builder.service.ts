import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { EventTypesService } from '../event-types.service';
import { EventTypesCrewBuilderService } from './event-types-crew-builder.service';
import { EventTypesDayContentBuilderService } from './event-types-day-content-builder.service';
import { CreatePackageFromEventTypeDto } from '../dto/create-package-from-event-type.dto';

@Injectable()
export class EventTypesPackageBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventTypesService: EventTypesService,
    private readonly crewBuilder: EventTypesCrewBuilderService,
    private readonly dayContentBuilder: EventTypesDayContentBuilderService,
  ) {}

  async createPackageFromEventType(
    brandId: number,
    eventTypeId: number,
    dto: CreatePackageFromEventTypeDto,
  ) {
    const eventType = await this.eventTypesService.findOne(eventTypeId, brandId);
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true },
    });

    const servicePackage = await this.prisma.service_packages.create({
      data: {
        brand_id: brandId,
        name: dto.packageName,
        description: dto.packageDescription || eventType.description,
        category: eventType.name,
        currency: brand?.currency || DEFAULT_CURRENCY,
        is_active: true,
      },
    });

    const lookups = this.dayContentBuilder.buildLookups(dto);
    const dayEquipmentContents = await this.createDayContent(
      eventType, servicePackage.id, dto, lookups,
    );

    if (Object.keys(dayEquipmentContents).length > 0) {
      await this.prisma.service_packages.update({
        where: { id: servicePackage.id },
        data: { contents: { day_equipment: dayEquipmentContents } as Prisma.InputJsonObject },
      });
    }

    await this.crewBuilder.cleanupOrphans(servicePackage.id);

    return this.fetchFullPackage(servicePackage.id);
  }

  private async createDayContent(
    eventType: Awaited<ReturnType<EventTypesService['findOne']>>,
    packageId: number,
    dto: CreatePackageFromEventTypeDto,
    lookups: ReturnType<EventTypesDayContentBuilderService['buildLookups']>,
  ): Promise<Record<string, Prisma.InputJsonArray>> {
    const equipmentLookup = await this.dayContentBuilder.loadEquipmentLookup(dto.equipmentSlots || []);
    const dayEquipmentContents: Record<string, Prisma.InputJsonArray> = {};

    for (const dayLink of eventType.event_days) {
      if (!lookups.selectedDayIdSet.has(dayLink.id)) continue;
      const templateId = dayLink.event_day_template.id;

      const packageEventDay = await this.prisma.packageEventDay.create({
        data: { package_id: packageId, event_day_template_id: templateId, order_index: dayLink.order_index },
      });

      if (dto.equipmentSlots && dto.equipmentSlots.length > 0) {
        dayEquipmentContents[String(packageEventDay.id)] = dto.equipmentSlots.map((slot, index) => {
          const equipment = equipmentLookup.get(slot.equipmentId);
          const parsedTrack = Number.parseInt(slot.slotLabel.match(/\d+/)?.[0] || '', 10);
          return {
            equipment_id: slot.equipmentId,
            slot_type: slot.slotType,
            track_number: Number.isNaN(parsedTrack) ? index + 1 : parsedTrack,
            equipment: equipment ? { id: equipment.id, item_name: equipment.item_name, model: equipment.model } : null,
          } as Prisma.InputJsonObject;
        }) as Prisma.InputJsonArray;
      }

      await this.dayContentBuilder.createActivities(packageId, packageEventDay.id, dayLink, dto, lookups);
      await this.dayContentBuilder.createSubjects(packageId, templateId, eventType.subject_roles, lookups.selectedRoleIdSet);
      await this.dayContentBuilder.createLocationSlots(packageId, templateId, dto.locationCount);

      // Auto-assign subjects to ceremony/reception activities
      await this.autoAssignSubjectsToActivities(packageId, templateId);
      // Auto-assign single location slot to all activities
      await this.autoAssignLocationSlot(packageId, templateId);

      const crewMap = await this.crewBuilder.createCrewAssignments(
        dto.crewAssignments, packageId, templateId,
      );
      if (dto.equipmentSlots && dto.equipmentSlots.length > 0) {
        await this.crewBuilder.attachEquipment(dto.equipmentSlots, crewMap);
      }
    }

    return dayEquipmentContents;
  }

  /**
   * Auto-assign all subjects to ceremony/reception activities.
   * Only runs at creation time — matches activity names containing "ceremony" or "reception".
   */
  private async autoAssignSubjectsToActivities(packageId: number, eventDayTemplateId: number) {
    const subjects = await this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId, event_day_template_id: eventDayTemplateId },
      select: { id: true },
    });
    if (subjects.length === 0) return;

    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day: { event_day_template_id: eventDayTemplateId } },
      select: { id: true, name: true },
    });

    const subjectIds = subjects.map(s => s.id);
    for (const act of activities) {
      const n = act.name.toLowerCase();
      if (n.includes('ceremony') || n.includes('reception')) {
        await this.prisma.packageDaySubjectActivity.createMany({
          data: subjectIds.map(sid => ({
            package_day_subject_id: sid,
            package_activity_id: act.id,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  /**
   * If exactly one location slot exists for this day, auto-assign it to all activities.
   * Only runs at creation time.
   */
  private async autoAssignLocationSlot(packageId: number, eventDayTemplateId: number) {
    const slots = await this.prisma.packageLocationSlot.findMany({
      where: { package_id: packageId, event_day_template_id: eventDayTemplateId },
      select: { id: true },
    });
    if (slots.length !== 1) return;

    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day: { event_day_template_id: eventDayTemplateId } },
      select: { id: true },
    });

    await this.prisma.locationActivityAssignment.createMany({
      data: activities.map(act => ({
        package_location_slot_id: slots[0].id,
        package_activity_id: act.id,
      })),
      skipDuplicates: true,
    });
  }

  private fetchFullPackage(packageId: number) {
    return this.prisma.service_packages.findUniqueOrThrow({
      where: { id: packageId },
      include: {
        package_event_days: {
          orderBy: { order_index: 'asc' },
          include: {
            event_day: true,
            activities: {
              orderBy: { order_index: 'asc' },
              include: { moments: { orderBy: { order_index: 'asc' } } },
            },
          },
        },
        package_day_subjects: {
          orderBy: { order_index: 'asc' },
          include: { role_template: true },
        },
        package_location_slots: { orderBy: { location_number: 'asc' } },
        package_crew_slots: {
          orderBy: { order_index: 'asc' },
          include: {
            crew: { include: { contact: true } },
            job_role: true,
            equipment: { include: { equipment: true } },
          },
        },
      },
    });
  }
}
