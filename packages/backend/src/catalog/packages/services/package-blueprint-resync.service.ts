import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintSnapshotService } from '../../../content/day-blueprints/services';
import { PackageVersionsService } from './package-versions.service';

/**
 * PackageBlueprintResyncService
 *
 * Re-applies the latest published DayBlueprintVersion snapshot onto an
 * existing package. This replaces activities/moments/space-slots that were
 * originally snapshotted from an older version while preserving camera /
 * film / crew / pricing rows that are not blueprint-owned.
 *
 * Safety: a PackageVersion snapshot is taken before the resync so the
 * studio can roll back via the existing version-restore flow.
 */
@Injectable()
export class PackageBlueprintResyncService {
  private readonly logger = new Logger(PackageBlueprintResyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotService: DayBlueprintSnapshotService,
    private readonly versionsService: PackageVersionsService,
  ) {}

  async resyncToLatestBlueprint(packageId: number, brandId: number) {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      select: {
        id: true,
        name: true,
        source_day_blueprint_id: true,
        source_day_blueprint_version_id: true,
        source_day_blueprint: {
          select: {
            id: true,
            display_name: true,
            latest_published_version_id: true,
          },
        },
      },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    if (!pkg.source_day_blueprint_id || !pkg.source_day_blueprint) {
      throw new BadRequestException('Package was not created from a Day Blueprint');
    }
    const latestVersionId = pkg.source_day_blueprint.latest_published_version_id;
    if (!latestVersionId) {
      throw new BadRequestException('Blueprint has no published version to resync from');
    }
    if (latestVersionId === pkg.source_day_blueprint_version_id) {
      return { already_current: true, package_id: packageId };
    }

    // Safety snapshot before touching anything
    await this.versionsService.createVersion(
      packageId,
      brandId,
      `Pre-resync safety snapshot (blueprint → v${latestVersionId})`,
    );

    // Re-materialize blueprint structure into package rows
    await this.snapshotService.consumeIntoPackage({
      packageId,
      blueprintVersionId: latestVersionId,
    });

    this.logger.log(
      `Resynced package ${packageId} ("${pkg.name}") → blueprint "${pkg.source_day_blueprint.display_name}" v${latestVersionId}`,
    );
    return { already_current: false, package_id: packageId, new_blueprint_version_id: latestVersionId };
  }
}
