import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CreatePackageFromEventTypeDto } from '../dto/create-package-from-event-type.dto';

interface ActivityPreset {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  default_start_time: string | null;
  default_duration_minutes: number | null;
  moments?: Array<{
    id: number;
    name: string;
    is_key_moment: boolean;
    duration_seconds: number | null;
  }>;
}

export interface BuilderLookups {
  selectedDayIdSet: Set<number>;
  selectedMomentIdSet: Set<number>;
  selectedRoleIdSet: Set<number>;
  momentKeyOverrideMap: Map<number, boolean>;
  activityOverrideMap: Map<number, { startTime?: string; durationMinutes?: number }>;
}

@Injectable()
export class DayContentBuilder {
  private readonly logger = new Logger(DayContentBuilder.name);

  constructor(private readonly prisma: PrismaService) {}

  buildLookups(dto: CreatePackageFromEventTypeDto): BuilderLookups {
    const selectedDayIdSet = new Set(dto.selectedDayIds);
    const selectedMomentIdSet = new Set(dto.selectedMomentIds);
    const selectedRoleIdSet = new Set(dto.selectedRoleIds);
    const momentKeyOverrideMap = new Map<number, boolean>();
    for (const override of dto.momentKeyOverrides) {
      momentKeyOverrideMap.set(override.momentId, override.isKey);
    }
    const activityOverrideMap = new Map<number, { startTime?: string; durationMinutes?: number }>();
    for (const sa of dto.selectedActivities) {
      activityOverrideMap.set(sa.presetId, { startTime: sa.startTime, durationMinutes: sa.durationMinutes });
    }
    return { selectedDayIdSet, selectedMomentIdSet, selectedRoleIdSet, momentKeyOverrideMap, activityOverrideMap };
  }

  async createActivities(
    packageId: number,
    packageEventDayId: number,
    dayLink: { event_day_template: { id: number; activity_presets: ActivityPreset[] } },
    dto: CreatePackageFromEventTypeDto,
    lookups: BuilderLookups,
  ): Promise<Array<{ id: number; name: string }>> {
    const createdActivities: Array<{ id: number; name: string }> = [];
    let activityOrderIdx = 0;
    for (const preset of dayLink.event_day_template.activity_presets) {
      const override = lookups.activityOverrideMap.get(preset.id);
      if (!override) continue;

      const packageActivity = await this.prisma.packageActivity.create({
        data: {
          package_id: packageId,
          package_event_day_id: packageEventDayId,
          name: preset.name, color: preset.color, icon: preset.icon,
          start_time: override.startTime || preset.default_start_time || null,
          duration_minutes: override.durationMinutes || preset.default_duration_minutes || 60,
          order_index: activityOrderIdx++,
        },
      });
      createdActivities.push({ id: packageActivity.id, name: preset.name });

      // Legacy preset moments are no longer copied into packages here.
      // The AI planner creates activity moments later from the knowledge base.
    }

    const templateId = dayLink.event_day_template.id;
    const customForDay = dto.customActivities.filter(ca => ca.dayTemplateId === templateId);
    for (const ca of customForDay) {
      const packageActivity = await this.prisma.packageActivity.create({
        data: {
          package_id: packageId, package_event_day_id: packageEventDayId,
          name: ca.name, start_time: ca.startTime || null,
          duration_minutes: ca.durationMinutes || 60,
          order_index: activityOrderIdx++,
        },
      });
      createdActivities.push({ id: packageActivity.id, name: ca.name });
    }

    return createdActivities;
  }

  async createSubjects(
    packageId: number,
    eventDayTemplateId: number,
    subjectRoles: Array<{ subject_role: { id: number; role_name: string; is_group: boolean } }>,
    selectedRoleIdSet: Set<number>,
    standardGuestCount?: number,
  ) {
    const candidateIds = subjectRoles.map((l) => l.subject_role.id);
    const selectedIds = candidateIds.filter((id) => selectedRoleIdSet.has(id));
    this.logger.log(
      `[createSubjects] package=${packageId} day=${eventDayTemplateId} ` +
        `eventType roles=${candidateIds.length} selected=${selectedIds.length} guestCount=${standardGuestCount ?? 'default'}`,
    );
    if (candidateIds.length === 0) {
      this.logger.warn(
        `[createSubjects] package=${packageId} event type has NO subject_roles configured — no subjects will be created.`,
      );
      return;
    }
    if (selectedIds.length === 0) {
      this.logger.warn(
        `[createSubjects] package=${packageId} wizard selected 0 of ${candidateIds.length} available subject roles — package will have no subjects. ` +
          `Available role ids=[${candidateIds.join(',')}]`,
      );
      return;
    }
    let subjectIdx = 0;
    const createdNames: string[] = [];
    const skippedNames: string[] = [];
    for (const stLink of subjectRoles) {
      const role = stLink.subject_role;
      if (!selectedRoleIdSet.has(role.id)) {
        skippedNames.push(role.role_name);
        continue;
      }
      const isGuestsRole = role.role_name.trim().toLowerCase() === 'guests';
      const count = role.is_group ? (isGuestsRole ? standardGuestCount ?? 100 : 4) : undefined;
      await this.prisma.packageDaySubject.create({
        data: {
          package_id: packageId, event_day_template_id: eventDayTemplateId,
          role_template_id: role.id, name: role.role_name,
          order_index: subjectIdx++,
          count,
        },
      });
      createdNames.push(`${role.role_name}${count !== undefined ? `x${count}` : ''}`);
    }
    this.logger.log(
      `[createSubjects] package=${packageId} created=${createdNames.length} [${createdNames.join(', ')}] ` +
        `skipped=${skippedNames.length}`,
    );
  }

  async createLocationSlots(packageId: number, eventDayTemplateId: number, locationCount: number) {
    for (let i = 0; i < locationCount && i < 5; i++) {
      await this.prisma.packageLocationSlot.create({
        data: { package_id: packageId, event_day_template_id: eventDayTemplateId, location_number: i + 1 },
      });
    }
  }

  async loadEquipmentLookup(equipmentSlots: Array<{ equipmentId: number }>) {
    const equipmentIds = [...new Set(equipmentSlots.map(slot => slot.equipmentId))];
    const lookup = new Map<number, { id: number; item_name: string; model: string | null }>();
    if (equipmentIds.length > 0) {
      const records = await this.prisma.equipment.findMany({
        where: { id: { in: equipmentIds } },
        select: { id: true, item_name: true, model: true },
      });
      for (const r of records) lookup.set(r.id, r);
    }
    return lookup;
  }
}
