import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

interface PackageSnapshot {
  name: string;
  description: string | null;
  category: string | null;
  category_id: number | null;
  currency: string;
  contents: unknown;
}

@Injectable()
export class ServicePackagesVersionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensurePackageExists(packageId: number, brandId: number) {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
    });
    if (!pkg) throw new NotFoundException('Service Package not found');
    return pkg;
  }

  async createVersion(packageId: number, brandId: number, changeSummary?: string) {
    const pkg = await this.ensurePackageExists(packageId, brandId);

    const lastVersion = await this.prisma.packageVersion.findFirst({
      where: { package_id: packageId },
      orderBy: { version_number: 'desc' },
    });
    const nextVersion = (lastVersion?.version_number ?? 0) + 1;

    const snapshot = {
      name: pkg.name,
      description: pkg.description,
      category: pkg.category,
      category_id: pkg.category_id,
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
    await this.ensurePackageExists(packageId, brandId);

    return this.prisma.packageVersion.findMany({
      where: { package_id: packageId },
      orderBy: { version_number: 'desc' },
    });
  }

  async getVersion(packageId: number, versionId: number, brandId: number) {
    await this.ensurePackageExists(packageId, brandId);

    const version = await this.prisma.packageVersion.findFirst({
      where: { id: versionId, package_id: packageId },
    });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  async restoreVersion(packageId: number, versionId: number, brandId: number) {
    const version = await this.getVersion(packageId, versionId, brandId);
    const snapshot = version.snapshot as unknown as PackageSnapshot;

    await this.createVersion(packageId, brandId, `Restored from version ${version.version_number}`);

    return this.prisma.service_packages.update({
      where: { id: packageId },
      data: {
        name: snapshot.name,
        description: snapshot.description,
        category: snapshot.category,
        category_id: snapshot.category_id,
        currency: snapshot.currency,
        contents: snapshot.contents as object,
      },
    });
  }
}
