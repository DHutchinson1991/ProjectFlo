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
        _count: {
          select: {
            package_event_days: true,
            package_event_day_locations: true,
          },
        },
        package_day_operators: {
          include: {
            equipment: {
              include: {
                equipment: { select: { category: true } },
              },
            },
          },
        },
      },
    });

    // Compute equipment counts and distinct crew per package, strip bulky relations
    return packages.map(({ package_day_operators, ...pkg }) => {
      let cameraCount = 0;
      let audioCount = 0;
      const uniqueOperators = new Set<number>();
      for (const op of package_day_operators) {
        uniqueOperators.add(op.operator_template_id);
        for (const eq of op.equipment) {
          if (eq.equipment.category === 'CAMERA') cameraCount++;
          else if (eq.equipment.category === 'AUDIO') audioCount++;
        }
      }
      return {
        ...pkg,
        _equipmentCounts: { cameras: cameraCount, audio: audioCount },
        _crewCount: uniqueOperators.size,
      };
    });
  }

  async findOne(id: number, brandId: number) {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id, brand_id: brandId },
      include: {
        wedding_type: true, // Include wedding type template info
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
