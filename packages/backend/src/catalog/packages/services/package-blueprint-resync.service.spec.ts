import { Test } from '@nestjs/testing';
import { CeremonySeatLayoutMode } from '@projectflo/shared';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  DayBlueprintPlacementSeedService,
  DayBlueprintSnapshotService,
} from '../../../content/day-blueprints/services';
import { ActivityPlanningMaintenanceService } from '../../../content/activity-planning/services/activity-planning-maintenance.service';
import { PackageVersionsService } from './package-versions.service';
import { PackageBlueprintResyncService } from './package-blueprint-resync.service';
import { PackageBlueprintResyncStrategy } from '../dto/resync-blueprint.dto';

describe('PackageBlueprintResyncService', () => {
  let service: PackageBlueprintResyncService;
  let placementSeed: { seedPackagePlacementsFromBlueprint: jest.Mock };
  let planningMaintenance: { rerunPackageBlocking: jest.Mock };
  let snapshotService: { consumeIntoPackage: jest.Mock };
  let versionsService: { createVersion: jest.Mock };
  let prisma: {
    service_packages: { findFirst: jest.Mock; findUnique: jest.Mock };
    dayBlueprintVersion: { findUnique: jest.Mock };
    packageActivity: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    placementSeed = {
      seedPackagePlacementsFromBlueprint: jest.fn().mockResolvedValue({
        momentsSeeded: 3,
        placementsWritten: 12,
        skippedNoPosition: 0,
      }),
    };
    planningMaintenance = {
      rerunPackageBlocking: jest.fn().mockResolvedValue(undefined),
    };
    snapshotService = {
      consumeIntoPackage: jest.fn().mockResolvedValue(undefined),
    };
    versionsService = {
      createVersion: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      service_packages: {
        findFirst: jest.fn().mockResolvedValue({
          id: 7,
          name: 'Test Package',
          source_day_blueprint_id: 10,
          source_day_blueprint_version_id: 20,
          source_day_blueprint: {
            id: 10,
            display_name: 'Wedding Blueprint',
            latest_published_version_id: 30,
          },
          source_day_blueprint_version: { id: 20, version_number: 1 },
        }),
        findUnique: jest.fn().mockResolvedValue({ contents: {} }),
      },
      dayBlueprintVersion: {
        findUnique: jest.fn().mockResolvedValue({ version_number: 2 }),
      },
      packageActivity: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) => fn({ packageActivity: { deleteMany: jest.fn() } })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PackageBlueprintResyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: DayBlueprintSnapshotService, useValue: snapshotService },
        { provide: PackageVersionsService, useValue: versionsService },
        { provide: DayBlueprintPlacementSeedService, useValue: placementSeed },
        { provide: ActivityPlanningMaintenanceService, useValue: planningMaintenance },
      ],
    }).compile();

    service = moduleRef.get(PackageBlueprintResyncService);
  });

  it('refreshes placements without replacing blueprint structure', async () => {
    const result = await service.resyncToLatestBlueprint(7, 1, {
      strategy: PackageBlueprintResyncStrategy.PLACEMENTS_REFRESH,
      seat_layout: CeremonySeatLayoutMode.FLUID,
    });

    expect(result).toEqual({
      already_current: false,
      package_id: 7,
      placements_refreshed: true,
    });
    expect(versionsService.createVersion).toHaveBeenCalledWith(
      7,
      1,
      'Pre-placement refresh safety snapshot',
    );
    expect(placementSeed.seedPackagePlacementsFromBlueprint).toHaveBeenCalledWith(7, {
      seatLayout: CeremonySeatLayoutMode.FLUID,
    });
    expect(planningMaintenance.rerunPackageBlocking).toHaveBeenCalledWith(7, 'placements-refresh', {
      skipPlacementSeed: true,
      seatLayout: CeremonySeatLayoutMode.FLUID,
    });
    expect(snapshotService.consumeIntoPackage).not.toHaveBeenCalled();
  });

  it('replaces blueprint structure atomically via consumeIntoPackage', async () => {
    const result = await service.resyncToLatestBlueprint(7, 1, {
      strategy: PackageBlueprintResyncStrategy.STRUCTURE_ONLY,
    });

    expect(result).toEqual({
      already_current: false,
      package_id: 7,
      new_blueprint_version_id: 30,
    });
    expect(versionsService.createVersion).toHaveBeenCalledWith(
      7,
      1,
      'Pre-resync safety snapshot (blueprint → v2)',
    );
    expect(snapshotService.consumeIntoPackage).toHaveBeenCalledWith({
      packageId: 7,
      blueprintVersionId: 30,
      blueprintDayMappings: undefined,
      replaceExistingBlueprintContent: true,
    });
    expect(placementSeed.seedPackagePlacementsFromBlueprint).toHaveBeenCalled();
    expect(planningMaintenance.rerunPackageBlocking).toHaveBeenCalledWith(7, 'blueprint-resync', {
      skipPlacementSeed: true,
      seatLayout: CeremonySeatLayoutMode.FLUID,
    });
  });
});
