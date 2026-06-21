import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { DayBlueprintSnapshotService } from '../../../../content/day-blueprints/services';
import { PackageTemplatesService } from '../../templates/package-templates.service';
import { CrewBuilder } from '../builders/crew.builder';
import { DayContentBuilder } from '../builders/day-content.builder';
import { CreatePackageFromEventTypeDto } from '../dto/create-package-from-event-type.dto';
import { PackageCreationPipelineService } from '../package-creation-pipeline.service';
import { PackageCreationRunLogger } from '../run/package-creation-run-logger';
import { validateBlueprintDayMappings } from '../shared/normalize-blueprint-create-request';
import { BrandCurrencyResolver } from '../shared/brand-currency.resolver';

/**
 * Catalog-level package creation: admin builds a reusable service package
 * from a PackageTemplate via the catalog/services page. Owns the
 * deterministic package build only; post-create layout/planning runs
 * through `PackageCreationPipelineService`. Called by
 * `PackageCreationService`; not exposed directly to controllers.
 */
@Injectable()
export class CatalogPackageCreator {
  private readonly logger = new Logger(CatalogPackageCreator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly packageTemplatesService: PackageTemplatesService,
    private readonly crewBuilder: CrewBuilder,
    private readonly dayContentBuilder: DayContentBuilder,
    private readonly packageCreationPipeline: PackageCreationPipelineService,
    private readonly brandCurrency: BrandCurrencyResolver,
    private readonly dayBlueprintSnapshot: DayBlueprintSnapshotService,
  ) {}

  async create(
    brandId: number,
    packageTemplateId: number,
    dto: CreatePackageFromEventTypeDto,
    runLogger: PackageCreationRunLogger,
  ) {
    const startedAt = Date.now();

    this.logger.log(
      `[package-template] START brand=${brandId} template=${packageTemplateId} ` +
        `name="${dto.packageName}" roles=${dto.selectedRoleIds?.length ?? 0} ` +
        `days=${dto.selectedDayIds?.length ?? 0} activities=${dto.selectedActivities?.length ?? 0} ` +
        `guestCount=${dto.standardGuestCount ?? 'n/a'}`,
    );
    runLogger.log('BUILDER', 'Received create-package request', {
      packageName: dto.packageName,
      selectedDayCount: dto.selectedDayIds?.length ?? 0,
      selectedActivityCount: dto.selectedActivities?.length ?? 0,
      customActivityCount: dto.customActivities?.length ?? 0,
      selectedRoleCount: dto.selectedRoleIds?.length ?? 0,
      equipmentSlotCount: dto.equipmentSlots?.length ?? 0,
      crewAssignmentCount: dto.crewAssignments?.length ?? 0,
    });

    const template = await this.packageTemplatesService.findOne(packageTemplateId, brandId);
    runLogger.log('BUILDER', 'Resolved package template', {
      packageTemplateId,
      templateName: template.name,
      eventDayCount: template.days.length,
      subjectCount: template.subjects.length,
    });

    const blueprintSeed = await this.resolveBlueprintSeed(
      brandId,
      dto.sourceDayBlueprintVersionId,
    );
    if (dto.blueprintDayMappings?.length) {
      validateBlueprintDayMappings(
        template.days.map((day) => day.id),
        blueprintSeed,
        dto.blueprintDayMappings,
      );
    }

    const normalizedDto = this.normalizeRequestForBlueprintMode(
      template,
      dto,
      blueprintSeed?.dayCount ?? 0,
    );

    const currency = await this.brandCurrency.resolve(brandId);

    const servicePackage = await this.prisma.service_packages.create({
      data: {
        brand_id: brandId,
        name: dto.packageName,
        description: dto.packageDescription || template.description,
        event_category: template.event_category,
        created_from_package_template_id: template.id,
        currency,
        is_active: true,
      },
    });
    runLogger.attachPackage(servicePackage.id, servicePackage.name);
    this.logger.log(`[package-template] package created id=${servicePackage.id}`);
    runLogger.log('BUILDER', 'Created service package record', {
      packageId: servicePackage.id,
      category: template.event_category,
      currency,
    });

    const lookups = this.dayContentBuilder.buildLookups(normalizedDto);
    const dayEquipmentContents = normalizedDto.scaffoldPackageDays?.length
      ? await this.createNamedDayScaffold(
          brandId,
          template,
          servicePackage.id,
          normalizedDto,
          lookups,
          normalizedDto.scaffoldPackageDays,
        )
      : normalizedDto.sourceDayBlueprintVersionId
      ? await this.createBlueprintDayScaffold(
          brandId,
          template,
          servicePackage.id,
          normalizedDto,
          lookups,
          normalizedDto.sourceDayBlueprintVersionId,
        )
      : await this.createDayContent(
          template, servicePackage.id, normalizedDto, lookups,
        );
    runLogger.log('BUILDER', 'Created day content', {
      packageId: servicePackage.id,
      selectedDayIds: normalizedDto.selectedDayIds,
      selectedRoleIds: normalizedDto.selectedRoleIds,
      locationCount: normalizedDto.locationCount,
      dayEquipmentDayIds: Object.keys(dayEquipmentContents),
      blueprintMode: normalizedDto.sourceDayBlueprintVersionId ? true : false,
    });

    if (Object.keys(dayEquipmentContents).length > 0) {
      await this.prisma.service_packages.update({
        where: { id: servicePackage.id },
        data: { contents: { day_equipment: dayEquipmentContents } as Prisma.InputJsonObject },
      });
      runLogger.log('BUILDER', 'Persisted day equipment contents', {
        packageId: servicePackage.id,
        packageEventDayIds: Object.keys(dayEquipmentContents),
      });
    }

    await this.crewBuilder.cleanupOrphans(servicePackage.id);
    runLogger.log('BUILDER', 'Cleaned orphaned crew assignments', {
      packageId: servicePackage.id,
    });

    const [activityCount, subjectCount, spaceSlotCount, crewSlotCount] = await Promise.all([
      this.prisma.packageActivity.count({ where: { package_id: servicePackage.id } }),
      this.prisma.packageDaySubject.count({ where: { package_id: servicePackage.id } }),
      this.prisma.packageSpaceSlot.count({ where: { package_id: servicePackage.id } }),
      this.prisma.packageCrewSlot.count({ where: { package_id: servicePackage.id } }),
    ]);
    this.logger.log(
      `[package-template] sync build done for package=${servicePackage.id} ` +
        `activities=${activityCount} subjects=${subjectCount} spaceSlots=${spaceSlotCount} crewSlots=${crewSlotCount} ` +
        `elapsed=${Date.now() - startedAt}ms`,
    );
    runLogger.writeBuilderSummary({
      brandId,
      eventTypeId: packageTemplateId,
      packageId: servicePackage.id,
      packageName: servicePackage.name,
      request: normalizedDto,
      syncCounts: {
        activities: activityCount,
        subjects: subjectCount,
        spaceSlots: spaceSlotCount,
        crewSlots: crewSlotCount,
      },
      elapsedMs: Date.now() - startedAt,
    });
    if (subjectCount === 0) {
      this.logger.warn(
        `[package-template] package=${servicePackage.id} has NO subjects after creation. ` +
          `selectedRoleIds=[${(normalizedDto.selectedRoleIds ?? []).join(',')}] — check RolesStep selection and template.subjects.`,
      );
      runLogger.warn('BUILDER', 'Package has no subjects after synchronous build', {
        packageId: servicePackage.id,
        selectedRoleIds: normalizedDto.selectedRoleIds ?? [],
      });
    }
    if (spaceSlotCount === 0) {
      this.logger.warn(
        `[package-template] package=${servicePackage.id} has NO space slots after creation. ` +
          `Floor-plan layout application will be a no-op.`,
      );
      runLogger.warn('BUILDER', 'Package has no space slots after synchronous build', {
        packageId: servicePackage.id,
      });
    }

    // Day Blueprint consume-on-create. When the caller selected a
    // published DayBlueprintVersion, materialize its structure
    // (activities, moments, actions, space-slot lineage) on top of
    // the preset-based build. The snapshot stamps source_day_blueprint_*
    // lineage columns so future drift detection and "Designed from"
    // UI can trust the link.
    if (normalizedDto.sourceDayBlueprintVersionId) {
      try {
        const result = await this.dayBlueprintSnapshot.consumeIntoPackage({
          packageId: servicePackage.id,
          blueprintVersionId: normalizedDto.sourceDayBlueprintVersionId,
          selectedActivityIds: normalizedDto.selectedDayBlueprintActivityIds,
          blueprintDayMappings: normalizedDto.blueprintDayMappings,
        });
        this.logger.log(
          `[package-template] consumed DayBlueprintVersion=${normalizedDto.sourceDayBlueprintVersionId} ` +
            `into package=${servicePackage.id} (activities=${result.activitiesCreated}, ` +
            `moments=${result.momentsCreated}, actions=${result.actionsCreated})`,
        );
        runLogger.log('BUILDER', 'Consumed Day Blueprint into package', {
          packageId: servicePackage.id,
          blueprintVersionId: normalizedDto.sourceDayBlueprintVersionId,
          ...result,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[package-template] DayBlueprint consume failed for package=${servicePackage.id}: ${message}`,
        );
        runLogger.warn('BUILDER', 'Day Blueprint consume failed', {
          packageId: servicePackage.id,
          blueprintVersionId: normalizedDto.sourceDayBlueprintVersionId,
          error: message,
        });
        throw new BadRequestException(
          `Selected Day Blueprint version could not be consumed: ${message}`,
        );
      }
    }

    // Kick off the post-create pipeline (layout + AI activity planning) in the
    // background so the HTTP response returns immediately. The wizard navigates
    // to /packages/:id, which streams planning progress via SSE
    // (`usePlanningProgress`) and flips `planning_status` → READY/FAILED when
    // done. Film creation from this package is gated on planning_status.
    await this.packageCreationPipeline.run(servicePackage.id, 'catalog', 'background', runLogger, {
      blueprintModeHint: Boolean(normalizedDto.sourceDayBlueprintVersionId),
    });

    return this.fetchFullPackage(servicePackage.id);
  }

  /**
   * Blueprint-first scaffold: one package event day per blueprint day, using
   * each blueprint day's name as the EventDay template (find-or-create per brand).
   * Skips preset activities — the snapshot consume step materializes structure.
   */
  private async createBlueprintDayScaffold(
    brandId: number,
    template: Awaited<ReturnType<PackageTemplatesService['findOne']>>,
    packageId: number,
    dto: CreatePackageFromEventTypeDto,
    lookups: ReturnType<DayContentBuilder['buildLookups']>,
    blueprintVersionId: number,
  ): Promise<Record<string, Prisma.InputJsonArray>> {
    const version = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: blueprintVersionId },
      select: {
        days: {
          orderBy: { order_index: 'asc' },
          select: { id: true, name: true, description: true, order_index: true },
        },
      },
    });
    if (!version || version.days.length === 0) {
      throw new BadRequestException('Selected blueprint version has no days to scaffold');
    }
    return this.createNamedDayScaffold(
      brandId,
      template,
      packageId,
      dto,
      lookups,
      version.days.map((day) => ({
        name: day.name,
        description: day.description,
        order_index: day.order_index,
      })),
    );
  }

  /**
   * Scaffold empty package event days by name (manual wizard path or blueprint days).
   * Skips preset activities — blueprint consume or the edit page fills structure.
   */
  private async createNamedDayScaffold(
    brandId: number,
    template: Awaited<ReturnType<PackageTemplatesService['findOne']>>,
    packageId: number,
    dto: CreatePackageFromEventTypeDto,
    lookups: ReturnType<DayContentBuilder['buildLookups']>,
    days: Array<{
      name: string;
      description?: string | null;
      order_index: number;
      locationCount?: number;
      activities?: Array<{ name: string; durationMinutes?: number }>;
    }>,
  ): Promise<Record<string, Prisma.InputJsonArray>> {
    if (days.length === 0) {
      throw new BadRequestException('At least one package day is required to scaffold');
    }

    const equipmentLookup = await this.dayContentBuilder.loadEquipmentLookup(dto.equipmentSlots || []);
    const dayEquipmentContents: Record<string, Prisma.InputJsonArray> = {};

    const subjectRoleLinks = template.subjects
      .filter((s) => s.subject_role)
      .map((s) => ({
        subject_role: {
          id: s.subject_role!.id,
          role_name: s.subject_role!.role_name,
          is_group: s.subject_role!.is_group,
        },
      }));

    for (const day of days) {
      const eventDayTemplateId = await this.findOrCreateBrandEventDay(
        brandId,
        day.name,
        day.description,
        day.order_index,
      );

      const packageEventDay = await this.prisma.packageEventDay.create({
        data: {
          package_id: packageId,
          event_day_template_id: eventDayTemplateId,
          order_index: day.order_index,
        },
      });

      if (dto.equipmentSlots && dto.equipmentSlots.length > 0) {
        dayEquipmentContents[String(packageEventDay.id)] = dto.equipmentSlots.map((slot, index) => {
          const equipment = equipmentLookup.get(slot.equipmentId);
          const parsedTrack = Number.parseInt(slot.slotLabel.match(/\d+/)?.[0] || '', 10);
          return {
            equipment_id: slot.equipmentId,
            slot_type: slot.slotType,
            track_number: Number.isNaN(parsedTrack) ? index + 1 : parsedTrack,
            equipment: equipment
              ? { id: equipment.id, item_name: equipment.item_name, model: equipment.model }
              : null,
          } as Prisma.InputJsonObject;
        }) as Prisma.InputJsonArray;
      }

      await this.dayContentBuilder.createSubjects(
        packageId,
        eventDayTemplateId,
        subjectRoleLinks,
        lookups.selectedRoleIdSet,
        dto.standardGuestCount,
      );
      await this.dayContentBuilder.createLocationSlots(
        packageId,
        eventDayTemplateId,
        day.locationCount ?? dto.locationCount,
      );

      if (day.activities && day.activities.length > 0) {
        let activityOrderIdx = 0;
        for (const activity of day.activities) {
          await this.prisma.packageActivity.create({
            data: {
              package_id: packageId,
              package_event_day_id: packageEventDay.id,
              name: activity.name,
              duration_minutes: activity.durationMinutes ?? 60,
              order_index: activityOrderIdx++,
            },
          });
        }
      }

      await this.autoAssignLocationSlot(packageId, eventDayTemplateId);

      const crewMap = await this.crewBuilder.createCrewAssignments(
        dto.crewAssignments, dto.roleSlots || [], packageId, eventDayTemplateId,
      );
      if (dto.equipmentSlots && dto.equipmentSlots.length > 0) {
        await this.crewBuilder.attachEquipment(dto.equipmentSlots, crewMap);
      }
    }

    return dayEquipmentContents;
  }

  /** Find an existing brand EventDay by name or create one for blueprint-driven packages. */
  private async findOrCreateBrandEventDay(
    brandId: number,
    name: string,
    description: string | null | undefined,
    orderIndex: number,
  ): Promise<number> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Blueprint day name is required to scaffold package days');
    }
    const existing = await this.prisma.eventDay.findFirst({
      where: { brand_id: brandId, name: trimmed },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.eventDay.create({
      data: {
        brand_id: brandId,
        name: trimmed,
        description: description?.trim() || undefined,
        order_index: orderIndex,
      },
      select: { id: true },
    });
    return created.id;
  }

  private async createDayContent(
    template: Awaited<ReturnType<PackageTemplatesService['findOne']>>,
    packageId: number,
    dto: CreatePackageFromEventTypeDto,
    lookups: ReturnType<DayContentBuilder['buildLookups']>,
  ): Promise<Record<string, Prisma.InputJsonArray>> {
    const equipmentLookup = await this.dayContentBuilder.loadEquipmentLookup(dto.equipmentSlots || []);
    const dayEquipmentContents: Record<string, Prisma.InputJsonArray> = {};

    // Adapt template.subjects -> legacy { subject_role } shape for DayContentBuilder.
    const subjectRoleLinks = template.subjects
      .filter((s) => s.subject_role)
      .map((s) => ({
        subject_role: {
          id: s.subject_role!.id,
          role_name: s.subject_role!.role_name,
          is_group: s.subject_role!.is_group,
        },
      }));

    for (const dayLink of template.days) {
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
      await this.dayContentBuilder.createSubjects(
        packageId,
        templateId,
        subjectRoleLinks,
        lookups.selectedRoleIdSet,
        dto.standardGuestCount,
      );
      await this.dayContentBuilder.createLocationSlots(packageId, templateId, dto.locationCount);

      await this.autoAssignLocationSlot(packageId, templateId);

      const crewMap = await this.crewBuilder.createCrewAssignments(
        dto.crewAssignments, dto.roleSlots || [], packageId, templateId,
      );
      if (dto.equipmentSlots && dto.equipmentSlots.length > 0) {
        await this.crewBuilder.attachEquipment(dto.equipmentSlots, crewMap);
      }
    }

    return dayEquipmentContents;
  }

  private async autoAssignLocationSlot(packageId: number, eventDayTemplateId: number) {
    const slots = await this.prisma.packageLocationSlot.findMany({
      where: { package_id: packageId, event_day_template_id: eventDayTemplateId },
      select: { id: true },
    });
    if (slots.length !== 1) return;

    const locationSlot = slots[0];

    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId, package_event_day: { event_day_template_id: eventDayTemplateId } },
      select: { id: true, name: true, location_label: true },
    });

    await this.prisma.locationActivityAssignment.createMany({
      data: activities.map((act) => ({
        package_location_slot_id: locationSlot.id,
        package_activity_id: act.id,
      })),
      skipDuplicates: true,
    });

    for (const act of activities) {
      const label = act.location_label || `${act.name} Space`;
      const spaceSlot = await this.prisma.packageSpaceSlot.create({
        data: {
          package_id: packageId,
          event_day_template_id: eventDayTemplateId,
          label,
          location_slot_id: locationSlot.id,
        },
      });
      await this.prisma.spaceActivityAssignment.create({
        data: {
          package_space_slot_id: spaceSlot.id,
          package_activity_id: act.id,
        },
      });
    }
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

  private normalizeRequestForBlueprintMode(
    template: Awaited<ReturnType<PackageTemplatesService['findOne']>>,
    dto: CreatePackageFromEventTypeDto,
    blueprintDayCount: number,
  ): CreatePackageFromEventTypeDto {
    if (!dto.sourceDayBlueprintVersionId) {
      return dto;
    }

    const selectedDayIds =
      dto.blueprintDayMappings && dto.blueprintDayMappings.length > 0
        ? [...new Set(dto.blueprintDayMappings.map((m) => m.eventTypeDayLinkId))]
        : dto.selectedDayIds.length > 0
          ? dto.selectedDayIds
          : this.autoSelectTemplateDays(template.days, blueprintDayCount);

    return {
      ...dto,
      selectedDayIds,
      selectedActivities: [],
      customActivities: [],
      selectedMomentIds: [],
      momentKeyOverrides: [],
    };
  }

  private autoSelectTemplateDays(
    days: Array<{ id: number; order_index: number }>,
    blueprintDayCount: number,
  ): number[] {
    if (days.length === 0) {
      throw new BadRequestException('Selected template has no event days to scaffold package creation');
    }

    const count = Math.max(1, blueprintDayCount);
    const sorted = [...days].sort((a, b) => a.order_index - b.order_index);
    return sorted.slice(0, Math.min(sorted.length, count)).map((day) => day.id);
  }

  private async resolveBlueprintSeed(
    brandId: number,
    sourceDayBlueprintVersionId?: number,
  ): Promise<{ dayCount: number; dayIds: number[] } | null> {
    if (!sourceDayBlueprintVersionId) {
      return null;
    }

    const blueprint = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: sourceDayBlueprintVersionId },
      select: {
        id: true,
        day_blueprint: { select: { brand_id: true } },
        days: { select: { id: true } },
      },
    });

    if (!blueprint) {
      throw new BadRequestException('Selected blueprint version was not found');
    }
    if (blueprint.day_blueprint.brand_id !== brandId) {
      throw new BadRequestException('Selected blueprint version does not belong to this brand');
    }

    return {
      dayCount: blueprint.days.length,
      dayIds: blueprint.days.map((d) => d.id),
    };
  }
}