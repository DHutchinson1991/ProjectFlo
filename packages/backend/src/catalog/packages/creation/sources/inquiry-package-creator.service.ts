import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { DayBlueprintSnapshotService } from '../../../../content/day-blueprints/services';
import { CreatePackageFromBuilderDto } from '../../dto/create-package-from-builder.dto';
import { PackageCreationPipelineService } from '../package-creation-pipeline.service';
import { PackageCreationRunLogger } from '../run/package-creation-run-logger';
import { BrandCurrencyResolver } from '../shared/brand-currency.resolver';
import { validateBlueprintDayMappings } from '../shared/normalize-blueprint-create-request';

type TransactionClient = Prisma.TransactionClient;

/**
 * Inquiry-level package creation: creates a draft, client-scoped package
 * from the Inquiry Wizard. Resolves preset activities from the
 * brand's main event day, auto-assigns equipment from the brand's
 * library, and returns before the shared post-create pipeline finishes.
 * Output package starts inactive and is named after the client.
 */
@Injectable()
export class InquiryPackageCreator {
  private readonly logger = new Logger(InquiryPackageCreator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly packageCreationPipeline: PackageCreationPipelineService,
    private readonly brandCurrency: BrandCurrencyResolver,
    private readonly dayBlueprintSnapshot: DayBlueprintSnapshotService,
  ) {}

  async create(
    brandId: number,
    dto: CreatePackageFromBuilderDto,
    runLogger: PackageCreationRunLogger,
  ) {
    runLogger.log('BUILDER', 'Builder wizard source started', {
      brandId,
      packageTemplateId: dto.packageTemplateId,
      crewCount: dto.crewCount,
      cameraCount: dto.cameraCount,
      selectedActivityPresetCount: dto.selectedActivityPresetIds.length,
    });

    const currency = await this.brandCurrency.resolve(brandId);

    const template = await this.prisma.packageTemplate.findUnique({
      where: { id: dto.packageTemplateId },
      include: {
        days: {
          include: {
            event_day_template: {
              include: {
                activity_presets: {
                  include: { moments: { orderBy: { order_index: 'asc' } } },
                  orderBy: { order_index: 'asc' },
                },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });
    if (!template) throw new NotFoundException('Package template not found');

    const blueprintVersion = dto.sourceDayBlueprintVersionId
      ? await this.prisma.dayBlueprintVersion.findUnique({
          where: { id: dto.sourceDayBlueprintVersionId },
          include: {
            days: {
              orderBy: { order_index: 'asc' },
              select: { id: true, name: true, description: true, order_index: true },
            },
          },
        })
      : null;

    if (dto.sourceDayBlueprintVersionId && !blueprintVersion) {
      throw new BadRequestException('sourceDayBlueprintVersionId not found');
    }

    if (dto.blueprintDayMappings?.length && blueprintVersion) {
      validateBlueprintDayMappings(
        template.days.map((day) => day.id),
        { dayCount: blueprintVersion.days.length, dayIds: blueprintVersion.days.map((day) => day.id) },
        dto.blueprintDayMappings,
      );
    }

    const sortedDays = template.days;
    const mainDayLink =
      sortedDays.find((d) =>
        d.event_day_template.name.toLowerCase() === 'wedding day'
      ) ||
      sortedDays.find((d) =>
        d.event_day_template.name.toLowerCase().startsWith('wedding day')
      ) ||
      sortedDays.reduce((best, d) =>
        (d.event_day_template.activity_presets?.length || 0) >
        (best?.event_day_template.activity_presets?.length || 0)
          ? d
          : best,
      sortedDays[0]);
    if (!mainDayLink) throw new NotFoundException('Package template has no event days');
    const mainTemplate = mainDayLink.event_day_template;

    const selectedIds = new Set(dto.selectedActivityPresetIds);
    const useBlueprintMode = Boolean(dto.sourceDayBlueprintVersionId);

    const videographerRole = await this.prisma.job_roles.findFirst({
      where: { name: { equals: 'videographer', mode: 'insensitive' } },
    });

    const totalMinutes = mainTemplate.activity_presets
      .filter((preset) => selectedIds.has(preset.id))
      .reduce((sum, preset) => sum + (preset.default_duration_minutes || 60), 0);
    const coverageHours = useBlueprintMode
      ? 8
      : Math.round((totalMinutes / 60) * 2) / 2;

    const pkgName = dto.clientName
      ? `Custom Package \u2014 ${dto.clientName}`
      : 'Custom Package';

    const result = await this.prisma.$transaction(async (tx) => {
      const servicePackage = await tx.service_packages.create({
        data: {
          brand_id: brandId,
          name: pkgName,
          description: null,
          currency,
          is_active: false,
          event_category: template.event_category,
          created_from_package_template_id: template.id,
          contents: { items: [], film_preferences: dto.filmPreferences || [] } as unknown as Prisma.InputJsonValue,
        },
      });

      const packageEventDays = useBlueprintMode
        ? await this.scaffoldBlueprintPackageDays(
            tx,
            brandId,
            servicePackage.id,
            template,
            blueprintVersion!,
            dto,
          )
        : await this.scaffoldPresetPackageDay(
            tx,
            servicePackage.id,
            mainTemplate,
            selectedIds,
          );

      const primaryPackageEventDay = packageEventDays[0];
      if (!primaryPackageEventDay) {
        throw new BadRequestException('Package must have at least one event day');
      }

      const crewSlotCount = Math.max(1, Math.min(dto.crewCount, 10));
      const createdCrewSlots: Array<{ id: number }> = [];
      for (let i = 0; i < crewSlotCount; i++) {
        const operatorSlot = await tx.packageCrewSlot.create({
          data: {
            package_id: servicePackage.id,
            package_event_day_id: primaryPackageEventDay.id,
            crew_id: null,
            job_role_id: videographerRole!.id,
            label: crewSlotCount > 1 ? `Videographer ${i + 1}` : null,
            hours: coverageHours || 8,
            order_index: i,
          },
        });
        createdCrewSlots.push(operatorSlot);
      }

      const totalCameras = Math.max(crewSlotCount, Math.min(dto.cameraCount ?? crewSlotCount, crewSlotCount * 10));
      const assignedEquipment: Array<{ equipment_id: number; slot_type: 'CAMERA' | 'AUDIO'; track_number: number; equipment: { id: number; item_name: string; model: string | null } }> = [];

      if (totalCameras > 0) {
        const availableCameras = await tx.equipment.findMany({
          where: {
            brand_id: brandId,
            category: 'CAMERA',
            is_active: true,
          },
          orderBy: [{ rental_price_per_day: 'desc' }, { id: 'asc' }],
        });

        if (availableCameras.length > 0) {
          let cameraIdx = 0;
          for (let c = 0; c < totalCameras; c++) {
            const camera = availableCameras[cameraIdx % availableCameras.length];
            const crewSlotIndex = c % crewSlotCount;
            const crewSlot = createdCrewSlots[crewSlotIndex];

            await tx.packageCrewSlotEquipment.create({
              data: {
                package_crew_slot_id: crewSlot.id,
                equipment_id: camera.id,
                is_primary: c < crewSlotCount,
              },
            });
            assignedEquipment.push({
              equipment_id: camera.id,
              slot_type: 'CAMERA',
              track_number: c + 1,
              equipment: { id: camera.id, item_name: camera.item_name, model: camera.model },
            });
            cameraIdx++;
          }
        }
      }

      const availableAudio = await tx.equipment.findMany({
        where: {
          brand_id: brandId,
          category: 'AUDIO',
          is_active: true,
        },
        orderBy: [{ rental_price_per_day: 'desc' }, { id: 'asc' }],
      });

      if (availableAudio.length > 0) {
        for (let a = 0; a < availableAudio.length; a++) {
          const audio = availableAudio[a];
          const crewSlotIndex = a % crewSlotCount;
          const crewSlot = createdCrewSlots[crewSlotIndex];

          await tx.packageCrewSlotEquipment.create({
            data: {
              package_crew_slot_id: crewSlot.id,
              equipment_id: audio.id,
              is_primary: false,
            },
          });
          assignedEquipment.push({
            equipment_id: audio.id,
            slot_type: 'AUDIO',
            track_number: a + 1,
            equipment: { id: audio.id, item_name: audio.item_name, model: audio.model },
          });
        }
      }

      const cameraCount = assignedEquipment.filter((equipment) => equipment.slot_type === 'CAMERA').length;
      const audioCount = assignedEquipment.filter((equipment) => equipment.slot_type === 'AUDIO').length;
      const currentContents = (servicePackage.contents || {}) as Record<string, unknown>;
      await tx.service_packages.update({
        where: { id: servicePackage.id },
        data: {
          contents: {
            ...currentContents,
            ...(assignedEquipment.length > 0 ? {
              day_equipment: {
                [String(primaryPackageEventDay.event_day_template_id)]: assignedEquipment,
              },
            } : {}),
            equipment_counts: { cameras: cameraCount, audio: audioCount },
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return servicePackage;
    });

    if (result) {
      runLogger.attachPackage(result.id, result.name);
      runLogger.writeBuilderSummary({
        brandId,
        packageTemplateId: dto.packageTemplateId,
        packageId: result.id,
        packageName: result.name,
        coverageHours,
        selectedActivityPresetIds: dto.selectedActivityPresetIds,
      });

      // Optional Day Blueprint consume — same semantics as the catalog
      // creator: consume failures fail the request (BadRequestException)
      // rather than silently continuing with a partially-seeded package.
      if (dto.sourceDayBlueprintVersionId) {
        try {
          const snapshot = await this.dayBlueprintSnapshot.consumeIntoPackage({
            packageId: result.id,
            blueprintVersionId: dto.sourceDayBlueprintVersionId,
            selectedActivityIds: dto.selectedDayBlueprintActivityIds,
            blueprintDayMappings: dto.blueprintDayMappings,
          });
          this.logger.log(
            `[builder] consumed DayBlueprintVersion=${dto.sourceDayBlueprintVersionId} ` +
              `into package=${result.id} ` +
              `(activities=${snapshot.activitiesCreated}, moments=${snapshot.momentsCreated}, ` +
              `actions=${snapshot.actionsCreated})`,
          );
          runLogger.log('BUILDER', 'Consumed Day Blueprint into package', {
            packageId: result.id,
            blueprintVersionId: dto.sourceDayBlueprintVersionId,
            ...snapshot,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `[builder] DayBlueprint consume failed for package=${result.id}: ${message}`,
          );
          runLogger.warn('BUILDER', 'Day Blueprint consume failed', {
            packageId: result.id,
            blueprintVersionId: dto.sourceDayBlueprintVersionId,
            error: message,
          });
          await this.prisma.service_packages.delete({ where: { id: result.id } }).catch(() => undefined);
          throw new BadRequestException(
            `Selected Day Blueprint version could not be consumed: ${message}`,
          );
        }
      }

      await this.packageCreationPipeline.run(result.id, 'inquiry', 'background', runLogger, {
        blueprintModeHint: Boolean(dto.sourceDayBlueprintVersionId),
      });
    }

    return result;
  }

  private async scaffoldPresetPackageDay(
    tx: TransactionClient,
    packageId: number,
    mainTemplate: {
      id: number;
      activity_presets: Array<{
        id: number;
        name: string;
        color: string | null;
        icon: string | null;
        description: string | null;
        location_label: string | null;
        default_start_time: string | null;
        default_duration_minutes: number | null;
      }>;
    },
    selectedIds: Set<number>,
  ): Promise<Array<{ id: number; event_day_template_id: number }>> {
    const packageEventDay = await tx.packageEventDay.create({
      data: {
        package_id: packageId,
        event_day_template_id: mainTemplate.id,
        order_index: 0,
      },
    });

    let activityIdx = 0;
    for (const preset of mainTemplate.activity_presets) {
      if (!selectedIds.has(preset.id)) continue;

      await tx.packageActivity.create({
        data: {
          package_id: packageId,
          package_event_day_id: packageEventDay.id,
          name: preset.name,
          color: preset.color,
          icon: preset.icon,
          description: preset.description,
          location_label: preset.location_label || null,
          start_time: preset.default_start_time || null,
          duration_minutes: preset.default_duration_minutes || 60,
          order_index: activityIdx++,
        },
      });
    }

    const createdActivities = await tx.packageActivity.findMany({
      where: { package_id: packageId },
      select: { id: true, name: true, location_label: true },
    });

    const locationSlot = await tx.packageLocationSlot.create({
      data: {
        package_id: packageId,
        event_day_template_id: mainTemplate.id,
        location_number: 1,
        mode: 'SANDBOX',
      },
    });

    await tx.locationActivityAssignment.createMany({
      data: createdActivities.map((activity) => ({
        package_location_slot_id: locationSlot.id,
        package_activity_id: activity.id,
      })),
      skipDuplicates: true,
    });

    for (const activity of createdActivities) {
      const label = activity.location_label || `${activity.name} Space`;
      const spaceSlot = await tx.packageSpaceSlot.create({
        data: {
          package_id: packageId,
          event_day_template_id: mainTemplate.id,
          label,
          location_slot_id: locationSlot.id,
        },
      });
      await tx.spaceActivityAssignment.create({
        data: {
          package_space_slot_id: spaceSlot.id,
          package_activity_id: activity.id,
        },
      });
    }

    return [packageEventDay];
  }

  private async scaffoldBlueprintPackageDays(
    tx: TransactionClient,
    brandId: number,
    packageId: number,
    template: {
      id: number;
      days: Array<{ id: number; order_index: number; event_day_template_id: number }>;
    },
    blueprintVersion: {
      days: Array<{ id: number; name: string; description: string | null; order_index: number }>;
    },
    dto: CreatePackageFromBuilderDto,
  ): Promise<Array<{ id: number; event_day_template_id: number }>> {
    if (blueprintVersion.days.length === 0) {
      throw new BadRequestException('Selected blueprint version has no days to scaffold');
    }

    const packageEventDays: Array<{ id: number; event_day_template_id: number }> = [];

    if (dto.blueprintDayMappings?.length) {
      const linkIds = [...new Set(dto.blueprintDayMappings.map((row) => row.eventTypeDayLinkId))];
      const templateDayLinks = await tx.packageTemplateDay.findMany({
        where: {
          package_template_id: template.id,
          id: { in: linkIds },
        },
        orderBy: { order_index: 'asc' },
      });
      const linkById = new Map(templateDayLinks.map((link) => [link.id, link]));
      for (const linkId of linkIds) {
        const link = linkById.get(linkId);
        if (!link) {
          throw new BadRequestException(
            `Template day link id ${linkId} is invalid for this package template`,
          );
        }
        const packageEventDay = await tx.packageEventDay.create({
          data: {
            package_id: packageId,
            event_day_template_id: link.event_day_template_id,
            order_index: link.order_index,
          },
        });
        packageEventDays.push(packageEventDay);
      }
      return packageEventDays;
    }

    for (const blueprintDay of blueprintVersion.days) {
      const eventDayTemplateId = await this.findOrCreateBrandEventDay(
        tx,
        brandId,
        blueprintDay.name,
        blueprintDay.description,
        blueprintDay.order_index,
      );
      const packageEventDay = await tx.packageEventDay.create({
        data: {
          package_id: packageId,
          event_day_template_id: eventDayTemplateId,
          order_index: blueprintDay.order_index,
        },
      });
      packageEventDays.push(packageEventDay);
    }

    return packageEventDays;
  }

  private async findOrCreateBrandEventDay(
    tx: TransactionClient,
    brandId: number,
    name: string,
    description: string | null | undefined,
    orderIndex: number,
  ): Promise<number> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Blueprint day name is required to scaffold package days');
    }
    const existing = await tx.eventDay.findFirst({
      where: { brand_id: brandId, name: trimmed },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await tx.eventDay.create({
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
}
