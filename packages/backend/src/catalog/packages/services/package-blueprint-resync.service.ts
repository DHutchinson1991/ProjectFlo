import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  DayBlueprintPlacementSeedService,
  DayBlueprintSnapshotService,
} from '../../../content/day-blueprints/services';
import { dayBlueprintVersionCopyInclude } from '../../../content/day-blueprints/services/day-blueprint-version-copy.service';
import { ActivityPlanningMaintenanceService } from '../../../content/activity-planning/services/activity-planning-maintenance.service';
import { PackageVersionsService } from './package-versions.service';
import {
  PackageBlueprintResyncStrategy,
  ResyncPackageBlueprintDto,
} from '../dto/resync-blueprint.dto';
import { CeremonySeatLayoutMode } from '@projectflo/shared';

export type PackageBlueprintResyncPreview = {
  already_current: boolean;
  package_id: number;
  blueprint: {
    id: number;
    display_name: string;
  };
  current_version: {
    id: number;
    version_number: number;
  } | null;
  latest_version: {
    id: number;
    version_number: number;
  };
  structural_summary: {
    current_days: number;
    latest_days: number;
    current_activities: number;
    latest_activities: number;
    current_moments: number;
    latest_moments: number;
  };
  warning: string;
  moment_changes_sample: {
    added_moment_names: string[];
    removed_moment_names: string[];
  };
};

/**
 * Re-applies the latest published DayBlueprintVersion snapshot onto an
 * existing package. Blueprint-derived rows are replaced; camera / film /
 * crew / pricing rows are preserved.
 */
@Injectable()
export class PackageBlueprintResyncService {
  private readonly logger = new Logger(PackageBlueprintResyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotService: DayBlueprintSnapshotService,
    private readonly versionsService: PackageVersionsService,
    private readonly placementSeed: DayBlueprintPlacementSeedService,
    private readonly planningMaintenance: ActivityPlanningMaintenanceService,
  ) {}

  async previewResync(packageId: number, brandId: number): Promise<PackageBlueprintResyncPreview> {
    const context = await this.loadResyncContext(packageId, brandId);
    const [currentCounts, latestCounts, momentChanges] = await Promise.all([
      context.currentVersionId
        ? this.countVersionStructure(context.currentVersionId)
        : Promise.resolve({ days: 0, activities: 0, moments: 0 }),
      this.countVersionStructure(context.latestVersionId),
      this.sampleMomentChanges(context.currentVersionId, context.latestVersionId),
    ]);

    return {
      already_current: context.alreadyCurrent,
      package_id: packageId,
      blueprint: {
        id: context.blueprint.id,
        display_name: context.blueprint.display_name,
      },
      current_version: context.currentVersionNumber != null && context.currentVersionId != null
        ? { id: context.currentVersionId, version_number: context.currentVersionNumber }
        : null,
      latest_version: {
        id: context.latestVersionId,
        version_number: context.latestVersionNumber,
      },
      structural_summary: {
        current_days: currentCounts.days,
        latest_days: latestCounts.days,
        current_activities: currentCounts.activities,
        latest_activities: latestCounts.activities,
        current_moments: currentCounts.moments,
        latest_moments: latestCounts.moments,
      },
      warning:
        'Re-sync replaces blueprint-derived activities and moments. Camera, film, crew, and pricing are preserved. A package safety snapshot is taken before applying changes.',
      moment_changes_sample: momentChanges,
    };
  }

  private async sampleMomentChanges(
    currentVersionId: number | null,
    latestVersionId: number,
  ): Promise<{ added_moment_names: string[]; removed_moment_names: string[] }> {
    const collectLabels = async (versionId: number | null): Promise<Set<string>> => {
      if (!versionId) return new Set();
      const version = await this.prisma.dayBlueprintVersion.findUnique({
        where: { id: versionId },
        include: dayBlueprintVersionCopyInclude,
      });
      const labels = new Set<string>();
      for (const day of version?.days ?? []) {
        for (const activity of day.activities) {
          for (const moment of activity.moments) {
            labels.add(`${activity.name} — ${moment.name}`);
          }
        }
      }
      return labels;
    };

    const [current, latest] = await Promise.all([
      collectLabels(currentVersionId),
      collectLabels(latestVersionId),
    ]);
    const added = [...latest].filter((name) => !current.has(name)).slice(0, 8);
    const removed = [...current].filter((name) => !latest.has(name)).slice(0, 8);
    return { added_moment_names: added, removed_moment_names: removed };
  }

  async resyncToLatestBlueprint(
    packageId: number,
    brandId: number,
    dto: ResyncPackageBlueprintDto = {},
  ) {
    const strategy = dto.strategy ?? PackageBlueprintResyncStrategy.STRUCTURE_ONLY;
    const seatLayout: CeremonySeatLayoutMode = dto.seat_layout ?? CeremonySeatLayoutMode.FLUID;
    const context = await this.loadResyncContext(packageId, brandId);

    if (strategy === PackageBlueprintResyncStrategy.PLACEMENTS_REFRESH) {
      return this.refreshPlacements(packageId, brandId, context.packageName, seatLayout);
    }

    if (context.alreadyCurrent) {
      return { already_current: true, package_id: packageId };
    }

    if (strategy !== PackageBlueprintResyncStrategy.STRUCTURE_ONLY) {
      throw new BadRequestException(`Unsupported resync strategy: ${strategy}`);
    }

    await this.versionsService.createVersion(
      packageId,
      brandId,
      `Pre-resync safety snapshot (blueprint → v${context.latestVersionNumber})`,
    );

    const pkgRow = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { contents: true },
    });
    const contents =
      pkgRow?.contents && typeof pkgRow.contents === 'object' && !Array.isArray(pkgRow.contents)
        ? (pkgRow.contents as Record<string, unknown>)
        : {};
    const storedMappings = Array.isArray(contents.blueprint_day_mappings)
      ? (contents.blueprint_day_mappings as Array<{ blueprintDayId: number; eventTypeDayLinkId: number }>)
      : undefined;

    await this.snapshotService.consumeIntoPackage({
      packageId,
      blueprintVersionId: context.latestVersionId,
      blueprintDayMappings: storedMappings,
      replaceExistingBlueprintContent: true,
    });

    await this.placementSeed.seedPackagePlacementsFromBlueprint(packageId, { seatLayout });

    await this.planningMaintenance.rerunPackageBlocking(packageId, 'blueprint-resync', {
      skipPlacementSeed: true,
      seatLayout,
    });

    this.logger.log(
      `Resynced package ${packageId} ("${context.packageName}") → blueprint "${context.blueprint.display_name}" v${context.latestVersionNumber}`,
    );

    return {
      already_current: false,
      package_id: packageId,
      new_blueprint_version_id: context.latestVersionId,
    };
  }

  private async refreshPlacements(
    packageId: number,
    brandId: number,
    packageName: string,
    seatLayout: CeremonySeatLayoutMode,
  ) {
    await this.versionsService.createVersion(
      packageId,
      brandId,
      'Pre-placement refresh safety snapshot',
    );

    await this.placementSeed.seedPackagePlacementsFromBlueprint(packageId, { seatLayout });

    await this.planningMaintenance.rerunPackageBlocking(packageId, 'placements-refresh', {
      skipPlacementSeed: true,
      seatLayout,
    });

    this.logger.log(
      `Refreshed blueprint placements for package ${packageId} ("${packageName}") seatLayout=${seatLayout}`,
    );

    return {
      already_current: false,
      package_id: packageId,
      placements_refreshed: true,
    };
  }

  private async loadResyncContext(packageId: number, brandId: number) {
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
        source_day_blueprint_version: {
          select: { id: true, version_number: true },
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

    const latestVersion = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: latestVersionId },
      select: { version_number: true },
    });
    if (!latestVersion) {
      throw new BadRequestException('Latest published blueprint version not found');
    }

    const alreadyCurrent = latestVersionId === pkg.source_day_blueprint_version_id;

    return {
      packageName: pkg.name,
      blueprint: pkg.source_day_blueprint,
      latestVersionId,
      latestVersionNumber: latestVersion.version_number,
      currentVersionId: pkg.source_day_blueprint_version_id,
      currentVersionNumber: pkg.source_day_blueprint_version?.version_number ?? null,
      alreadyCurrent,
    };
  }

  private async countVersionStructure(versionId: number) {
    const version = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: versionId },
      include: dayBlueprintVersionCopyInclude,
    });
    if (!version) {
      return { days: 0, activities: 0, moments: 0 };
    }
    const days = version.days.length;
    const activities = version.days.reduce((sum, day) => sum + day.activities.length, 0);
    const moments = version.days.reduce(
      (sum, day) =>
        sum + day.activities.reduce((activitySum, activity) => activitySum + activity.moments.length, 0),
      0,
    );
    return { days, activities, moments };
  }

}
