import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintPlacementSeedService } from '../../day-blueprints/services';
import { MomentKnowledgeService } from '../../schedule/services/moment-knowledge.service';
import { PackageBlockingPlannerService } from './package-blocking-planner.service';
import { PackagePlanningOrchestratorService } from './package-planning-orchestrator.service';
import { ActivityPlanningMaintenanceService } from './activity-planning-maintenance.service';

describe('ActivityPlanningMaintenanceService.replanPackageActivities', () => {
  let service: ActivityPlanningMaintenanceService;

  const prisma = {
    packageActivity: {
      findMany: jest.fn(),
    },
    packageDaySubjectActivity: {
      deleteMany: jest.fn(),
    },
    packageActivityMoment: {
      deleteMany: jest.fn(),
    },
    service_packages: {
      findUnique: jest.fn(),
    },
  };

  const momentKnowledge = {
    ensureActivityMoments: jest.fn(),
    ensureSceneMomentsForActivity: jest.fn(),
  };

  const packagePlanningOrchestrator = {
    planPackageActivities: jest.fn(),
  };

  const packageBlockingPlanner = {
    planPackageBlocking: jest.fn(),
  };

  const placementSeed = {
    seedPackagePlacementsFromBlueprint: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityPlanningMaintenanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: MomentKnowledgeService, useValue: momentKnowledge },
        { provide: PackagePlanningOrchestratorService, useValue: packagePlanningOrchestrator },
        { provide: PackageBlockingPlannerService, useValue: packageBlockingPlanner },
        { provide: DayBlueprintPlacementSeedService, useValue: placementSeed },
      ],
    }).compile();

    service = module.get(ActivityPlanningMaintenanceService);
  });

  it('recovers skeleton moments when replan planning fails', async () => {
    prisma.packageActivity.findMany.mockResolvedValue([{ id: 11 }, { id: 12 }]);
    packagePlanningOrchestrator.planPackageActivities.mockResolvedValue({
      succeeded: false,
      summary: { errors: ['LLM timeout'] },
    });
    momentKnowledge.ensureActivityMoments.mockResolvedValue({ moments: [{ id: 1 }] });

    await expect(service.replanPackageActivities(7)).rejects.toThrow(InternalServerErrorException);

    expect(prisma.packageActivityMoment.deleteMany).toHaveBeenCalledWith({
      where: { package_activity_id: { in: [11, 12] } },
    });
    expect(momentKnowledge.ensureActivityMoments).toHaveBeenCalledWith(11);
    expect(momentKnowledge.ensureActivityMoments).toHaveBeenCalledWith(12);
    expect(packageBlockingPlanner.planPackageBlocking).not.toHaveBeenCalled();
  });

  it('runs blocking rerun after a successful replan', async () => {
    prisma.packageActivity.findMany.mockResolvedValue([{ id: 11 }]);
    packagePlanningOrchestrator.planPackageActivities.mockResolvedValue({
      succeeded: true,
      summary: { errors: [] },
    });
    prisma.service_packages.findUnique.mockResolvedValue({
      name: 'Test Package',
      brand_id: 1,
      source_day_blueprint_version_id: null,
    });
    packageBlockingPlanner.planPackageBlocking.mockResolvedValue(undefined);

    await service.replanPackageActivities(7);

    expect(momentKnowledge.ensureActivityMoments).not.toHaveBeenCalled();
    expect(packageBlockingPlanner.planPackageBlocking).toHaveBeenCalled();
  });
});
