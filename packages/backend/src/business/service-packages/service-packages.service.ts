import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { CreatePackageFromBuilderDto } from './dto/create-package-from-builder.dto';

@Injectable()
export class ServicePackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async create(brandId: number, createDto: CreateServicePackageDto) {
    return this.prisma.service_packages.create({
      data: {
        ...createDto,
        brand_id: brandId,
        contents: createDto.contents || {},
      },
    });
  }

  async findAll(brandId: number, userId?: number) {
    const packages = await this.prisma.service_packages.findMany({
      where: { brand_id: brandId, is_active: true },
      include: {
        wedding_type: true,
        package_category: { select: { id: true, name: true } },
        workflow_template: { select: { id: true, name: true, is_default: true } },
        _count: {
          select: {
            package_event_days: true,
            package_location_slots: true,
          },
        },
        package_day_operators: {
          select: {
            contributor_id: true,
            equipment: {
              select: { equipment: { select: { category: true } } },
            },
          },
        },
      },
    });

    // Fetch typical guest count for each package (from is_group role subjects)
    const packageIds = packages.map(p => p.id);
    const groupSubjects = packageIds.length
      ? await this.prisma.packageDaySubject.findMany({
          where: {
            package_id: { in: packageIds },
            role_template: { is_group: true },
          },
          select: { package_id: true, count: true },
        })
      : [];
    // Sum group subject counts per package (take max count as typical guest count)
    const guestCountMap = new Map<number, number>();
    for (const s of groupSubjects) {
      const existing = guestCountMap.get(s.package_id) ?? 0;
      guestCountMap.set(s.package_id, existing + (s.count ?? 0));
    }

    // Compute counts from the lightweight operator data, then fetch pricing via PricingService
    const baseMapped = packages.map(({ package_day_operators, package_category, ...pkg }) => {
      const uniqueOperators = new Set<number>();
      let cameraCount = 0;
      let audioCount = 0;
      for (const op of package_day_operators) {
        if (op.contributor_id) uniqueOperators.add(op.contributor_id);
        for (const eq of op.equipment) {
          if (eq.equipment.category === 'CAMERA') cameraCount++;
          else if (eq.equipment.category === 'AUDIO') audioCount++;
        }
      }
      return {
        ...pkg,
        category: package_category?.name ?? pkg.category ?? null,
        _equipmentCounts: { cameras: cameraCount, audio: audioCount },
        _crewCount: uniqueOperators.size,
        typical_guest_count: guestCountMap.get(pkg.id) ?? null,
      };
    });

    // If userId is available, fetch authoritative pricing from PricingService (bracket-aware + task costs)
    if (userId) {
      const pricingResults = await Promise.allSettled(
        baseMapped.map(pkg => this.pricingService.estimatePackagePrice(pkg.id, brandId, userId)),
      );
      return baseMapped.map((pkg, i) => {
        const result = pricingResults[i];
        if (result.status === 'fulfilled') {
          const p = result.value;
          return {
            ...pkg,
            _totalCrewCost: p.summary.crewCost,
            _totalEquipmentCost: p.summary.equipmentCost,
            _totalCost: p.summary.subtotal,
            _tax: p.tax,
          };
        }
        // Pricing failed for this package — return 0 costs
        return { ...pkg, _totalCrewCost: 0, _totalEquipmentCost: 0, _totalCost: 0, _tax: null };
      });
    }

    // No userId — return without pricing (backwards-compatible)
    return baseMapped.map(pkg => ({
      ...pkg,
      _totalCrewCost: 0,
      _totalEquipmentCost: 0,
      _totalCost: 0,
      _tax: null,
    }));
  }

  async findOne(id: number, brandId: number) {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id, brand_id: brandId },
      include: {
        wedding_type: true, // Include wedding type template info
        workflow_template: {
          select: {
            id: true,
            name: true,
            description: true,
            is_default: true,
            is_active: true,
            _count: { select: { workflow_template_tasks: true } },
          },
        },
      },
    });
    if (!pkg) throw new NotFoundException('Service Package not found');
    return pkg;
  }

  async update(id: number, brandId: number, updateDto: UpdateServicePackageDto) {
    // Ensure exists
    await this.findOne(id, brandId);
    
    return this.prisma.service_packages.update({
      where: { id },
      data: {
         ...updateDto,
         contents: updateDto.contents || undefined 
      },
    });
  }

  async remove(id: number, brandId: number) {
     // Ensure exists
    await this.findOne(id, brandId);

    // Soft delete or hard delete? Schema says is_active.
    // Let's toggle is_active to false.
    return this.prisma.service_packages.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ─── Create from Builder (Needs Assessment) ───────────────────────

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

    // 3. Find the main event day template — prefer exact "Wedding Day" name,
    //    then starts-with, then most presets, then first by order.
    const sortedDays = eventType.event_days; // already ordered by order_index asc
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
      // Create service_packages record
      const servicePackage = await tx.service_packages.create({
        data: {
          brand_id: brandId,
          name: pkgName,
          description: null,
          base_price: 0,
          currency: brand?.currency || 'USD',
          is_active: false,
          category: eventType.name,
          contents: { items: [], film_preferences: dto.filmPreferences || [] } as unknown as Prisma.InputJsonValue,
        },
      });

      // Create PackageEventDay
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

        // Create moments from preset
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

      // Create PackageDayOperator slots
      const opCount = Math.max(1, Math.min(dto.operatorCount, 10));
      const createdOperators: Array<{ id: number }> = [];
      for (let i = 0; i < opCount; i++) {
        const op = await tx.packageDayOperator.create({
          data: {
            package_id: servicePackage.id,
            event_day_template_id: mainTemplate.id,
            contributor_id: null,
            job_role_id: videographerRole?.id || null,
            position_name: `Videographer ${i + 1}`,
            hours: coverageHours || 8,
            order_index: i,
          },
        });
        createdOperators.push(op);
      }

      // ── Auto-assign equipment from brand's library ──
      const totalCameras = Math.max(opCount, Math.min(dto.cameraCount ?? opCount, opCount * 10));
      if (totalCameras > 0) {
        // Fetch available cameras from the brand's equipment library
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
            // Cycle through available cameras if we need more than exist
            const camera = availableCameras[cameraIdx % availableCameras.length];
            // Assign to operator (round-robin): first N cameras go 1-per-operator, extras distribute
            const operatorIndex = c % opCount;
            const operator = createdOperators[operatorIndex];

            await tx.packageDayOperatorEquipment.create({
              data: {
                package_day_operator_id: operator.id,
                equipment_id: camera.id,
                is_primary: c < opCount, // First camera per operator is primary
              },
            });
            cameraIdx++;
          }
        }
      }

      return servicePackage;
    });
  }

  // ─── Version History ───────────────────────────────────────────────

  async createVersion(packageId: number, brandId: number, changeSummary?: string) {
    // Ensure package exists
    const pkg = await this.findOne(packageId, brandId);

    // Get the next version number
    const lastVersion = await this.prisma.packageVersion.findFirst({
      where: { package_id: packageId },
      orderBy: { version_number: 'desc' },
    });
    const nextVersion = (lastVersion?.version_number ?? 0) + 1;

    // Create a snapshot of the current package state
    const snapshot = {
      name: pkg.name,
      description: pkg.description,
      category: pkg.category,
      category_id: pkg.category_id,
      base_price: pkg.base_price,
      currency: pkg.currency,
      contents: pkg.contents,
    };

    return this.prisma.packageVersion.create({
      data: {
        package_id: packageId,
        version_number: nextVersion,
        snapshot,
        change_summary: changeSummary || `Version ${nextVersion}`,
      },
    });
  }

  async getVersions(packageId: number, brandId: number) {
    // Ensure package exists & belongs to brand
    await this.findOne(packageId, brandId);

    return this.prisma.packageVersion.findMany({
      where: { package_id: packageId },
      orderBy: { version_number: 'desc' },
    });
  }

  async getVersion(packageId: number, versionId: number, brandId: number) {
    await this.findOne(packageId, brandId);

    const version = await this.prisma.packageVersion.findFirst({
      where: { id: versionId, package_id: packageId },
    });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  async restoreVersion(packageId: number, versionId: number, brandId: number) {
    const version = await this.getVersion(packageId, versionId, brandId);
    const snapshot = version.snapshot as Record<string, any>;

    // Create a new version recording the restore
    await this.createVersion(packageId, brandId, `Restored from version ${version.version_number}`);

    // Apply the snapshot to the current package
    return this.prisma.service_packages.update({
      where: { id: packageId },
      data: {
        name: snapshot.name,
        description: snapshot.description,
        category: snapshot.category,
        category_id: snapshot.category_id,
        base_price: snapshot.base_price,
        currency: snapshot.currency,
        contents: snapshot.contents,
      },
    });
  }
}
