import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CeremonySeatLayoutMode } from '@projectflo/shared';
import { DayBlueprintPlacementSeedService } from '../../../content/day-blueprints/services';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SpaceSlotSpatialSyncService } from '../../../workflow/locations/modules/floor-plans/space-slot-spatial-sync.service';

export interface PackageBlueprintSpatialLoadResult {
  spaceSlots: Awaited<ReturnType<SpaceSlotSpatialSyncService['getByPackage']>>;
  placementSeed: {
    momentsSeeded: number;
    placementsWritten: number;
    skippedNoPosition: number;
  } | null;
}

/**
 * Loads package floor-plan slots for blueprint-backed packages: ensures
 * subject/camera base positions exist, then materializes blueprint
 * moment placements into SpaceSlotMomentSubject rows.
 */
@Injectable()
export class PackageBlueprintSpatialService {
  private readonly logger = new Logger(PackageBlueprintSpatialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly placementSeed: DayBlueprintPlacementSeedService,
    private readonly spatialSync: SpaceSlotSpatialSyncService,
  ) {}

  async loadForPackage(packageId: number): Promise<PackageBlueprintSpatialLoadResult> {
    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { id: true, source_day_blueprint_version_id: true },
    });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    let placementSeed: PackageBlueprintSpatialLoadResult['placementSeed'] = null;
    if (pkg.source_day_blueprint_version_id) {
      try {
        placementSeed = await this.placementSeed.seedPackagePlacementsFromBlueprint(packageId, {
          seatLayout: CeremonySeatLayoutMode.FLUID,
        });
        this.logger.log(
          `[blueprint-spatial] package=${packageId} seed moments=${placementSeed.momentsSeeded} ` +
          `placements=${placementSeed.placementsWritten} skipped=${placementSeed.skippedNoPosition}`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`[blueprint-spatial] placement seed failed package=${packageId}: ${message}`);
      }
    }

    const spaceSlots = await this.spatialSync.getByPackage(packageId, { sync: true });
    return { spaceSlots, placementSeed };
  }
}
