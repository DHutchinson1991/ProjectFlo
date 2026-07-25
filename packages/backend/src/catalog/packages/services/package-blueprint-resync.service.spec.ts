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
    packageActivity: { findMany: jest.Mock; deleteMany: jest.Mock };
    packageSpaceSlot: { deleteMany: jest.Mock };
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
            latest_published_version_id: 20,
          },
          source_day_blueprint_version: { id: 20, version_number: 1 },
        }),
        findUnique: jest.fn(),
      },
      dayBlueprintVersion: {
        findUnique: jest.fn().mockResolvedValue({ version_number: 1 }),
      },
      packageActivity: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      packageSpaceSlot: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) =>
        fn({
          packageActivity: prisma.packageActivity,
          packageSpaceSlot: prisma.packageSpaceSlot,
        }),
      ),
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

  it('clears blueprint-derived space slots before structure resync', async () => {
    prisma.service_packages.findFirst.mockResolvedValueOnce({
      id: 7,
      name: 'Test Package',
      source_day_blueprint_id: 10,
      source_day_blueprint_version_id: 19,
      source_day_blueprint: {
        id: 10,
        display_name: 'Wedding Blueprint',
        latest_published_version_id: 20,
      },
      source_day_blueprint_version: { id: 19, version_number: 1 },
    });
    prisma.dayBlueprintVersion.findUnique.mockResolvedValueOnce({ version_number: 2 });
    prisma.service_packages.findUnique.mockResolvedValueOnce({ contents: {} });
    prisma.packageActivity.findMany
      .mockResolvedValueOnce([{ source_day_blueprint_activity_id: 501 }])
      .mockResolvedValueOnce([{ id: 101 }]);

    await service.resyncToLatestBlueprint(7, 1);

    expect(prisma.packageSpaceSlot.deleteMany).toHaveBeenCalledWith({
      where: {
        package_id: 7,
        source_day_blueprint_space_slot_id: { not: null },
      },
    });
    expect(prisma.packageActivity.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [101] } },
    });
    expect(snapshotService.consumeIntoPackage).toHaveBeenCalled();
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
});
