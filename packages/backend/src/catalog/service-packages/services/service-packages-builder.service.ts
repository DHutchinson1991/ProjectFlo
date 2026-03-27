import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreatePackageFromBuilderDto } from '../dto/create-package-from-builder.dto';

@Injectable()
export class ServicePackagesBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a service package from the Needs Assessment builder wizard.
   * Handles event day creation, activity/moment population, crew slots,
   * and auto-assignment of equipment from the brand's library.
   */
  async createFromBuilder(brandId: number, dto: CreatePackageFromBuilderDto) {
    // 1. Fetch brand currency
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true },
    });

    // 2. Fetch event type with deep includes to get activity presets
    const eventType = await this.prisma.eventType.findUnique({
      where: { id: dto.eventTypeId },
      include: {
        event_days: {
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
    if (!eventType) throw new NotFoundException('Event type not found');

    // 3. Find the main event day template
    const sortedDays = eventType.event_days;
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
          : best
      , sortedDays[0]);
    if (!mainDayLink) throw new NotFoundException('Event type has no event days');
    const mainTemplate = mainDayLink.event_day_template;

    // 4. Build set of selected preset IDs
    const selectedIds = new Set(dto.selectedActivityPresetIds);

    // 5. Look up videographer job role
    const videographerRole = await this.prisma.job_roles.findFirst({
      where: { name: { equals: 'videographer', mode: 'insensitive' } },
    });

    // 6. Calculate total coverage hours
    const totalMinutes = mainTemplate.activity_presets
      .filter(p => selectedIds.has(p.id))
      .reduce((sum, p) => sum + (p.default_duration_minutes || 60), 0);
    const coverageHours = Math.round((totalMinutes / 60) * 2) / 2;

    // 7. Create the package name
    const pkgName = dto.clientName
      ? `Custom Package \u2014 ${dto.clientName}`
      : 'Custom Package';

    // 8. Create everything in a transaction
    return this.prisma.$transaction(async (tx) => {
      const servicePackage = await tx.service_packages.create({
        data: {
          brand_id: brandId,
          name: pkgName,
          description: null,
          base_price: 0,
          currency: brand?.currency || DEFAULT_CURRENCY,
          is_active: false,
          category: eventType.name,
          contents: { items: [], film_preferences: dto.filmPreferences || [] } as unknown as Prisma.InputJsonValue,
        },
      });

      const packageEventDay = await tx.packageEventDay.create({
        data: {
          package_id: servicePackage.id,
          event_day_template_id: mainTemplate.id,
          order_index: 0,
        },
      });

      // Create PackageActivity + PackageActivityMoment for selected presets
      let activityIdx = 0;
      for (const preset of mainTemplate.activity_presets) {
        if (!selectedIds.has(preset.id)) continue;

        const activity = await tx.packageActivity.create({
          data: {
            package_id: servicePackage.id,
            package_event_day_id: packageEventDay.id,
            name: preset.name,
            color: preset.color,
            icon: preset.icon,
            description: preset.description,
            start_time: preset.default_start_time || null,
            duration_minutes: preset.default_duration_minutes || 60,
            order_index: activityIdx++,
          },
        });

        let momentIdx = 0;
        for (const moment of preset.moments) {
          await tx.packageActivityMoment.create({
            data: {
              package_activity_id: activity.id,
              name: moment.name,
              order_index: momentIdx++,
              duration_seconds: moment.duration_seconds || 60,
              is_required: moment.is_key_moment,
            },
          });
        }
      }

      // Create PackageCrewSlot slots
      const opCount = Math.max(1, Math.min(dto.operatorCount, 10));
      const createdOperators: Array<{ id: number }> = [];
      for (let i = 0; i < opCount; i++) {
        const op = await tx.packageCrewSlot.create({
          data: {
            package_id: servicePackage.id,
            event_day_template_id: mainTemplate.id,
            crew_member_id: null,
            job_role_id: videographerRole?.id || null,
            label: opCount > 1 ? `Videographer ${i + 1}` : null,
            hours: coverageHours || 8,
            order_index: i,
          },
        });
        createdOperators.push(op);
      }

      // Auto-assign equipment from brand's library
      const totalCameras = Math.max(opCount, Math.min(dto.cameraCount ?? opCount, opCount * 10));
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
            const operatorIndex = c % opCount;
            const operator = createdOperators[operatorIndex];

            await tx.packageCrewSlotEquipment.create({
              data: {
                package_crew_slot_id: operator.id,
                equipment_id: camera.id,
                is_primary: c < opCount,
              },
            });
            cameraIdx++;
          }
        }
      }

      return servicePackage;
    });
  }
}
