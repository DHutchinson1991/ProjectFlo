import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

/**
 * Brand-ownership guards for package-scoped schedule CRUD.
 * SchedulePackageController delegates here before mutating another brand's packages.
 */
@Injectable()
export class SchedulePackageAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertPackage(packageId: number, brandId: number): Promise<void> {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      select: { id: true },
    });
    if (!pkg) {
      throw new NotFoundException(`Package ${packageId} not found`);
    }
  }

  async assertPackageFilm(packageFilmId: number, brandId: number): Promise<void> {
    const row = await this.prisma.packageFilm.findFirst({
      where: { id: packageFilmId, package: { brand_id: brandId } },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`Package film ${packageFilmId} not found`);
    }
  }

  async assertActivity(activityId: number, brandId: number): Promise<void> {
    const row = await this.prisma.packageActivity.findFirst({
      where: { id: activityId, package: { brand_id: brandId } },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }
  }

  async assertActivityMoment(momentId: number, brandId: number): Promise<void> {
    const row = await this.prisma.packageActivityMoment.findFirst({
      where: { id: momentId, package_activity: { package: { brand_id: brandId } } },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`Activity moment ${momentId} not found`);
    }
  }
}
