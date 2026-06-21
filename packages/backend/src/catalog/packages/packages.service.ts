import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async create(brandId: number, createDto: CreatePackageDto) {
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
      where: { brand_id: brandId },
      include: {
        package_template: true,
        workflow_template: { select: { id: true, name: true, is_default: true } },
        package_films: {
          select: {
            id: true,
            order_index: true,
            film: {
              select: {
                id: true,
                name: true,
                film_type: true,
                target_duration_min: true,
                target_duration_max: true,
                scenes: {
                  select: { duration_seconds: true },
                },
                _count: { select: { scenes: true } },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
        _count: {
          select: {
            package_event_days: true,
            package_location_slots: true,
          },
        },
        package_crew_slots: {
          select: {
            crew_id: true,
            equipment: {
              select: { equipment: { select: { category: true } } },
            },
          },
        },
        source_day_blueprint: {
          select: {
            id: true,
            key: true,
            display_name: true,
            event_category: true,
            latest_published_version_id: true,
          },
        },
        source_day_blueprint_version: {
          select: { id: true, version_number: true, status: true, published_at: true },
        },
      },
    });

    // Fetch package guest count from the dedicated Guests subject rows.
    // Use the max headcount across days so multi-day packages do not double count.
    const packageIds = packages.map(p => p.id);
    const guestSubjects = packageIds.length
      ? await this.prisma.packageDaySubject.findMany({
          where: {
            package_id: { in: packageIds },
            OR: [
              { name: { equals: 'Guests', mode: 'insensitive' } },
              { role_template: { is: { role_name: { equals: 'Guests', mode: 'insensitive' } } } },
            ],
          },
          select: { package_id: true, count: true },
        })
      : [];

    const guestCountMap = new Map<number, number>();
    for (const s of guestSubjects) {
      const existing = guestCountMap.get(s.package_id) ?? 0;
      guestCountMap.set(s.package_id, Math.max(existing, s.count ?? 0));
    }

    // Compute counts from the lightweight crew slot data, then fetch pricing via PricingService
    const baseMapped = packages.map(({ package_crew_slots, ...pkg }) => {
      const uniqueCrew = new Set<number>();
      let cameraCount = 0;
      let audioCount = 0;
      for (const op of package_crew_slots) {
        if (op.crew_id) uniqueCrew.add(op.crew_id);
        for (const eq of op.equipment) {
          if (eq.equipment.category === 'CAMERA') cameraCount++;
          else if (eq.equipment.category === 'AUDIO') audioCount++;
        }
      }
      const blueprint_update_available =
        pkg.source_day_blueprint_id !== null &&
        pkg.source_day_blueprint_version_id !== null &&
        pkg.source_day_blueprint !== null &&
        pkg.source_day_blueprint.latest_published_version_id !== null &&
        pkg.source_day_blueprint.latest_published_version_id !== pkg.source_day_blueprint_version_id;
      return {
        ...pkg,
        category: pkg.event_category ?? null,
        _equipmentCounts: { cameras: cameraCount, audio: audioCount },
        _crewCount: uniqueCrew.size,
        typical_guest_count: guestCountMap.get(pkg.id) ?? null,
        blueprint_update_available,
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
            _crewHours: p.crew.totalHours,
            _taskHours: p.tasks.totalHours,
            _taskCount: p.tasks.totalTasks,
          };
        }
        // Pricing failed for this package — return 0 costs
        return { ...pkg, _totalCrewCost: 0, _totalEquipmentCost: 0, _totalCost: 0, _tax: null, _crewHours: 0, _taskHours: 0, _taskCount: 0 };
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
        package_template: true,
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
        source_day_blueprint: {
          select: {
            id: true,
            key: true,
            display_name: true,
            event_category: true,
            latest_published_version_id: true,
          },
        },
        source_day_blueprint_version: {
          select: { id: true, version_number: true, status: true, published_at: true },
        },
        day_blueprint_usages: {
          where: { is_current: false },
          select: { id: true, is_current: true },
          take: 1,
        },
      },
    });
    if (!pkg) throw new NotFoundException('Service Package not found');

    // Derive a convenience flag: blueprint_update_available = package was created from a
    // blueprint, the latest published version differs from what was snapshotted, and the
    // usage row was already flipped to is_current=false by the publish hook.
    const blueprint_update_available =
      pkg.source_day_blueprint_id !== null &&
      pkg.source_day_blueprint_version_id !== null &&
      pkg.source_day_blueprint !== null &&
      pkg.source_day_blueprint.latest_published_version_id !== null &&
      pkg.source_day_blueprint.latest_published_version_id !== pkg.source_day_blueprint_version_id;

    return { ...pkg, blueprint_update_available };
  }

  /**
   * Inquiries / projects / template / blueprint lineage for the package-links popover.
   */
  async findTraceability(id: number, brandId: number) {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id, brand_id: brandId },
      select: {
        id: true,
        package_template: { select: { id: true, name: true } },
        source_day_blueprint_id: true,
        source_day_blueprint_version_id: true,
        source_day_blueprint: { select: { id: true, display_name: true } },
        source_day_blueprint_version: {
          select: { id: true, version_number: true },
        },
      },
    });
    if (!pkg) throw new NotFoundException('Service Package not found');

    const inquiriesRaw = await this.prisma.inquiries.findMany({
      where: {
        archived_at: null,
        contact: { brand_id: brandId },
        OR: [{ selected_package_id: id }, { source_package_id: id }],
      },
      select: {
        id: true,
        selected_package_id: true,
        source_package_id: true,
        contact: { select: { first_name: true, last_name: true } },
      },
      orderBy: { id: 'asc' },
    });

    const inquiries = inquiriesRaw.map((row) => {
      const roles: ('selected_package' | 'source_package')[] = [];
      if (row.selected_package_id === id) roles.push('selected_package');
      if (row.source_package_id === id) roles.push('source_package');
      const label =
        [row.contact.first_name, row.contact.last_name].filter(Boolean).join(' ').trim() ||
        `Inquiry #${row.id}`;
      return { id: row.id, label, roles };
    });

    const projectsRaw = await this.prisma.projects.findMany({
      where: {
        brand_id: brandId,
        archived_at: null,
        source_package_id: id,
      },
      select: {
        id: true,
        project_name: true,
        wedding_date: true,
      },
      orderBy: { id: 'asc' },
    });

    const projects = projectsRaw.map((p) => ({
      id: p.id,
      name: p.project_name,
      wedding_date: p.wedding_date.toISOString().slice(0, 10),
    }));

    const bp = pkg.source_day_blueprint;
    const bv = pkg.source_day_blueprint_version;
    const versionId = pkg.source_day_blueprint_version_id;
    const source_blueprint =
      bp && versionId != null
        ? {
            blueprint_id: bp.id,
            display_name: bp.display_name,
            version_id: versionId,
            version_number:
              bv && bv.id === versionId ? bv.version_number : null,
          }
        : null;

    return {
      package_template: pkg.package_template,
      source_blueprint,
      inquiries,
      projects,
    };
  }

  async update(id: number, brandId: number, updateDto: UpdatePackageDto) {
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

    return this.prisma.service_packages.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
