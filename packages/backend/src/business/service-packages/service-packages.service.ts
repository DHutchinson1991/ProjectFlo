import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';

@Injectable()
export class ServicePackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(brandId: number, createDto: CreateServicePackageDto) {
    return this.prisma.service_packages.create({
      data: {
        ...createDto,
        brand_id: brandId,
        contents: createDto.contents || {},
      },
    });
  }

  async findAll(brandId: number) {
    const packages = await this.prisma.service_packages.findMany({
      where: { brand_id: brandId, is_active: true },
      include: {
        wedding_type: true, // Include wedding type info if this was created from template
        package_category: { select: { id: true, name: true } }, // Resolve category name from relation
        workflow_template: { select: { id: true, name: true, is_default: true } },
        _count: {
          select: {
            package_event_days: true,
            package_location_slots: true,
          },
        },
        package_day_operators: {
          include: {
            contributor: {
              select: {
                id: true,
                default_hourly_rate: true,
                contributor_job_roles: {
                  select: {
                    is_primary: true,
                    job_role_id: true,
                    payment_bracket: {
                      select: { hourly_rate: true, day_rate: true },
                    },
                  },
                },
              },
            },
            equipment: {
              include: {
                equipment: { select: { category: true, rental_price_per_day: true } },
              },
            },
          },
        },
      },
    });

    // Compute equipment counts, crew counts, and cost totals per package, then strip bulky relations
    return packages.map(({ package_day_operators, package_category, ...pkg }) => {
      let cameraCount = 0;
      let audioCount = 0;
      const uniqueOperators = new Set<number>();
      let totalCrewCost = 0;
      let totalEquipmentCost = 0;
      const equipmentSeen = new Set<number>();

      for (const op of package_day_operators) {
        if (op.contributor_id) {
          uniqueOperators.add(op.contributor_id);
        }

        // ── Crew cost (mirrors frontend getCrewHourlyRate / isCrewDayRate logic) ──
        if (op.contributor) {
          const roles = op.contributor.contributor_job_roles || [];
          let rate = 0;
          let isDayRate = false;

          // Try matching bracket for the operator's assigned job_role
          if (op.job_role_id) {
            const match = roles.find(r => r.job_role_id === op.job_role_id);
            if (match?.payment_bracket) {
              const hr = Number(match.payment_bracket.hourly_rate || 0);
              const dr = Number(match.payment_bracket.day_rate || 0);
              if (dr > 0 && hr === 0) {
                isDayRate = true;
                rate = dr;
              } else if (hr > 0) {
                rate = hr;
              }
            }
          }
          // Fallback: primary role bracket
          if (rate === 0) {
            const primary = roles.find(r => r.is_primary && r.payment_bracket);
            if (primary?.payment_bracket) {
              const hr = Number(primary.payment_bracket.hourly_rate || 0);
              const dr = Number(primary.payment_bracket.day_rate || 0);
              if (dr > 0 && hr === 0) { isDayRate = true; rate = dr; }
              else if (hr > 0) { rate = hr; }
            }
          }
          // Fallback: any bracket
          if (rate === 0) {
            const any = roles.find(r => r.payment_bracket);
            if (any?.payment_bracket) {
              rate = Number(any.payment_bracket.hourly_rate || 0);
            }
          }
          // Fallback: contributor default rate
          if (rate === 0) {
            rate = Number(op.contributor.default_hourly_rate || 0);
          }

          const hours = Number(op.hours || 0);
          if (isDayRate) {
            totalCrewCost += rate * (hours > 0 ? hours : 1);
          } else {
            totalCrewCost += rate * hours;
          }

        }

        // ── Equipment counts & cost ──
        for (const eq of op.equipment) {
          if (eq.equipment.category === 'CAMERA') cameraCount++;
          else if (eq.equipment.category === 'AUDIO') audioCount++;
          // Deduplicate equipment cost (same piece may appear on multiple operators)
          if (!equipmentSeen.has(eq.equipment_id)) {
            equipmentSeen.add(eq.equipment_id);
            totalEquipmentCost += Number(eq.equipment.rental_price_per_day || 0);
          }
        }
      }

      return {
        ...pkg,
        // Resolve category: prefer the related category name, fall back to the raw string field
        category: package_category?.name ?? pkg.category ?? null,
        _equipmentCounts: { cameras: cameraCount, audio: audioCount },
        _crewCount: uniqueOperators.size,
        _totalCrewCost: totalCrewCost,
        _totalEquipmentCost: totalEquipmentCost,
        _totalCost: totalCrewCost + totalEquipmentCost,
      };
    });
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
