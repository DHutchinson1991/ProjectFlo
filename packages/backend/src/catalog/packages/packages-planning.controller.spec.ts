import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ActivityPlannerService } from '../../content/activity-planning/services/activity-planner.service';
import { PlanningEventsService } from '../../content/activity-planning/services/planning-events.service';
import { PackagesPlanningController } from './packages-planning.controller';
import { PackageBlueprintResyncService } from './services/package-blueprint-resync.service';
import { PackageBlueprintSpatialService } from './services/package-blueprint-spatial.service';
import { PackagesService } from './packages.service';

describe('PackagesPlanningController brand scoping', () => {
  let controller: PackagesPlanningController;
  let packagesService: { findOne: jest.Mock };
  let activityPlanner: { replanPackageActivities: jest.Mock; resyncScheduledScenes: jest.Mock };
  let blueprintSpatial: { loadForPackage: jest.Mock };

  beforeEach(async () => {
    packagesService = {
      findOne: jest.fn().mockResolvedValue({ id: 7 }),
    };
    activityPlanner = {
      replanPackageActivities: jest.fn().mockResolvedValue(undefined),
      resyncScheduledScenes: jest.fn().mockResolvedValue([]),
    };
    blueprintSpatial = {
      loadForPackage: jest.fn().mockResolvedValue({ spaceSlots: [], placementSeed: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackagesPlanningController],
      providers: [
        { provide: ActivityPlannerService, useValue: activityPlanner },
        { provide: PlanningEventsService, useValue: { subscribe: jest.fn(() => of({ step: 'done', status: 'complete' })) } },
        { provide: PackageBlueprintResyncService, useValue: { previewResync: jest.fn(), resyncToLatestBlueprint: jest.fn() } },
        { provide: PackageBlueprintSpatialService, useValue: blueprintSpatial },
        { provide: PackagesService, useValue: packagesService },
      ],
    }).compile();

    controller = module.get(PackagesPlanningController);
  });

  it('rejects replan when brand context is missing', async () => {
    await expect(controller.replanActivities(7, undefined as unknown as number)).rejects.toThrow(NotFoundException);
    expect(activityPlanner.replanPackageActivities).not.toHaveBeenCalled();
  });

  it('rejects replan when package is not owned by the brand', async () => {
    packagesService.findOne.mockRejectedValue(new NotFoundException('Service Package not found'));

    await expect(controller.replanActivities(7, 1)).rejects.toThrow(NotFoundException);
    expect(activityPlanner.replanPackageActivities).not.toHaveBeenCalled();
  });

  it('replan succeeds after brand ownership is verified', async () => {
    await controller.replanActivities(7, 1);

    expect(packagesService.findOne).toHaveBeenCalledWith(7, 1);
    expect(activityPlanner.replanPackageActivities).toHaveBeenCalledWith(7);
  });

  it('rejects blueprint-spatial load for another brand package', async () => {
    packagesService.findOne.mockRejectedValue(new NotFoundException('Service Package not found'));

    await expect(controller.loadBlueprintSpatial(7, 2)).rejects.toThrow(NotFoundException);
    expect(blueprintSpatial.loadForPackage).not.toHaveBeenCalled();
  });
});
