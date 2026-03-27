import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';

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
        package_crew_slots: {
          select: {
            crew_member_id: true,
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
    const baseMapped = packages.map(({ package_crew_slots, package_category, ...pkg }) => {
      const uniqueOperators = new Set<number>();
      let cameraCount = 0;
      let audioCount = 0;
      for (const op of package_crew_slots) {
        if (op.crew_member_id) uniqueOperators.add(op.crew_member_id);
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

    return this.prisma.service_packages.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
