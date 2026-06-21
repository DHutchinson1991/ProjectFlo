import { Test } from '@nestjs/testing';
import { ActivityPlannerService } from '../../../content/activity-planning/services/activity-planner.service';
import { PackageBlockingPlannerService } from '../../../content/activity-planning/services/package-blocking-planner.service';
import { PlanningEventsService } from '../../../content/activity-planning/services/planning-events.service';
import { PackagePlanningCancelRegistryService } from '../../../content/activity-planning/services/package-planning-cancel-registry.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { PackageCreationPipelineService } from './package-creation-pipeline.service';
import { PackageCreationRunLogger } from './run/package-creation-run-logger';
import { DayBlueprintPlacementSeedService } from '../../../content/day-blueprints/services';
import { SandboxLayoutService } from './shared/sandbox-layout.service';

/** Drain microtasks/setImmediate until predicate holds or attempts exhaust. */
async function waitUntil(predicate: () => boolean, attempts = 20): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    if (predicate()) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

const buildPlanningRun = (packageId: number) => ({
  packageId,
  totalSteps: 7,
  summary: {
    packageId,
    startedAt: new Date().toISOString(),
    finalStatus: 'RUNNING',
    eventType: '',
    totalActivities: 0,
    totalSubjects: 0,
    steps: [],
    errors: [],
  },
  succeeded: true,
  deferredCompletion: true,
});

describe('PackageCreationPipelineService', () => {
  let abortSignal: AbortSignal;
  let planningCancelRegistry: { attach: jest.Mock; detach: jest.Mock };
  let service: PackageCreationPipelineService;
  let activityPlanner: {
    planPackageActivities: jest.Mock;
    startDeferredPackageBlocking: jest.Mock;
    completeDeferredPackagePlanning: jest.Mock;
    failDeferredPackagePlanning: jest.Mock;
  };
  let sandboxLayout: { applyCeremonyLayouts: jest.Mock };
  let packageBlockingPlanner: { planPackageBlocking: jest.Mock };
  let planningEvents: { emit: jest.Mock };
  let blueprintPlacementSeed: { seedPackagePlacementsFromBlueprint: jest.Mock };
  let prisma: {
    service_packages: { findUnique: jest.Mock };
    packageSpaceSlot: { findMany: jest.Mock };
    packageActivity: { findMany: jest.Mock };
    packageEventDay: { findMany: jest.Mock };
    packageCrewSlot: { findMany: jest.Mock };
    packageDaySubject: { findMany: jest.Mock };
    packageDaySubjectActivity: { createMany: jest.Mock; count: jest.Mock };
    packageCrewSlotActivity: { createMany: jest.Mock; count: jest.Mock };
  };
  let runLogger: PackageCreationRunLogger;

  beforeEach(async () => {
    abortSignal = { aborted: false } as AbortSignal;
    planningCancelRegistry = {
      attach: jest.fn().mockReturnValue(abortSignal),
      detach: jest.fn(),
    };

    activityPlanner = {
      planPackageActivities: jest.fn().mockResolvedValue(buildPlanningRun(42)),
      startDeferredPackageBlocking: jest.fn(),
      completeDeferredPackagePlanning: jest.fn().mockResolvedValue(undefined),
      failDeferredPackagePlanning: jest.fn().mockResolvedValue(undefined),
    };
    sandboxLayout = {
      applyCeremonyLayouts: jest.fn().mockResolvedValue(undefined),
    };
    packageBlockingPlanner = {
      planPackageBlocking: jest.fn().mockResolvedValue(undefined),
    };
    planningEvents = {
      emit: jest.fn(),
    };
    blueprintPlacementSeed = {
      seedPackagePlacementsFromBlueprint: jest.fn().mockResolvedValue({
        momentsSeeded: 0,
        placementsWritten: 0,
        skippedNoPosition: 0,
      }),
    };
    prisma = {
      service_packages: {
        findUnique: jest.fn().mockResolvedValue({ source_day_blueprint_version_id: null }),
      },
      packageSpaceSlot: { findMany: jest.fn().mockResolvedValue([]) },
      packageActivity: { findMany: jest.fn().mockResolvedValue([]) },
      packageEventDay: { findMany: jest.fn().mockResolvedValue([]) },
      packageCrewSlot: { findMany: jest.fn().mockResolvedValue([]) },
      packageDaySubject: { findMany: jest.fn().mockResolvedValue([]) },
      packageDaySubjectActivity: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
      },
      packageCrewSlotActivity: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        PackageCreationPipelineService,
        { provide: ActivityPlannerService, useValue: activityPlanner },
        { provide: SandboxLayoutService, useValue: sandboxLayout },
        { provide: PackageBlockingPlannerService, useValue: packageBlockingPlanner },
        { provide: PlanningEventsService, useValue: planningEvents },
        { provide: PrismaService, useValue: prisma },
        { provide: PackagePlanningCancelRegistryService, useValue: planningCancelRegistry },
        { provide: DayBlueprintPlacementSeedService, useValue: blueprintPlacementSeed },
      ],
    }).compile();

    service = module.get(PackageCreationPipelineService);
    runLogger = {
      setPlanningMode: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as PackageCreationRunLogger;
  });

  it('runs layout before planning in blocking mode', async () => {
    const calls: string[] = [];
    sandboxLayout.applyCeremonyLayouts.mockImplementation(async () => {
      calls.push('layout');
    });
    activityPlanner.planPackageActivities.mockImplementation(async () => {
      calls.push('planner');
      return buildPlanningRun(42);
    });
    activityPlanner.startDeferredPackageBlocking.mockImplementation(() => {
      calls.push('blocking-start');
    });
    packageBlockingPlanner.planPackageBlocking.mockImplementation(async () => {
      calls.push('blocking');
    });
    activityPlanner.completeDeferredPackagePlanning.mockImplementation(async () => {
      calls.push('complete');
    });

    await service.run(42, 'catalog', 'blocking', runLogger);

    expect(calls).toEqual(['layout', 'planner', 'blocking-start', 'blocking', 'complete']);
    expect(sandboxLayout.applyCeremonyLayouts).toHaveBeenCalledWith(42, runLogger);
    expect(planningCancelRegistry.attach).toHaveBeenCalledWith(42);
    expect(activityPlanner.planPackageActivities).toHaveBeenCalledWith(42, runLogger, {
      deferCompletion: true,
      additionalSteps: 1,
      planningMode: 'full',
      abortSignal,
    });
    expect(packageBlockingPlanner.planPackageBlocking).toHaveBeenCalledWith(42, runLogger, {
      stepIndex: 6,
      totalSteps: 7,
    }, abortSignal);
    expect(activityPlanner.completeDeferredPackagePlanning).toHaveBeenCalled();
    expect(planningCancelRegistry.detach).toHaveBeenCalledWith(42);
  });

  it('starts background mode without waiting for layout completion', async () => {
    let releaseLayout: (() => void) | undefined;
    sandboxLayout.applyCeremonyLayouts.mockImplementation(
      () => new Promise<void>((resolve) => {
        releaseLayout = resolve;
      }),
    );

    await service.run(84, 'inquiry', 'background', runLogger);
    await waitUntil(() => sandboxLayout.applyCeremonyLayouts.mock.calls.length > 0);

    expect(sandboxLayout.applyCeremonyLayouts).toHaveBeenCalledWith(84, runLogger);
    expect(activityPlanner.planPackageActivities).not.toHaveBeenCalled();

    releaseLayout?.();
    await waitUntil(() => activityPlanner.planPackageActivities.mock.calls.length > 0);

    expect(activityPlanner.planPackageActivities).toHaveBeenCalledWith(84, runLogger, {
      deferCompletion: true,
      additionalSteps: 1,
      planningMode: 'full',
      abortSignal,
    });
  });

  it('skips blocking completion when the activity planner reports failure', async () => {
    activityPlanner.planPackageActivities.mockResolvedValue({
      ...buildPlanningRun(42),
      succeeded: false,
    });

    await service.run(42, 'catalog', 'blocking', runLogger);

    expect(activityPlanner.startDeferredPackageBlocking).not.toHaveBeenCalled();
    expect(packageBlockingPlanner.planPackageBlocking).not.toHaveBeenCalled();
    expect(activityPlanner.completeDeferredPackagePlanning).not.toHaveBeenCalled();
    expect(planningCancelRegistry.detach).toHaveBeenCalledWith(42);
  });

  it('skips ceremony layout when blueprint snapshot slots already have objects', async () => {
    prisma.service_packages.findUnique.mockResolvedValue({ source_day_blueprint_version_id: 99 });
    prisma.packageSpaceSlot.findMany.mockResolvedValue([
      { _count: { objects: 12 } },
      { _count: { objects: 8 } },
    ]);

    await service.run(52, 'catalog', 'blocking', runLogger);

    expect(sandboxLayout.applyCeremonyLayouts).not.toHaveBeenCalled();
  });

  it('runs planner in blueprint mode when package has blueprint lineage', async () => {
    prisma.service_packages.findUnique.mockResolvedValue({ source_day_blueprint_version_id: 123 });

    await service.run(52, 'catalog', 'blocking', runLogger);

    expect(activityPlanner.planPackageActivities).toHaveBeenCalledWith(52, runLogger, {
      deferCompletion: true,
      additionalSteps: 1,
      planningMode: 'blueprint',
      abortSignal,
    });
  });

  it('seeds blueprint placements after planner in blueprint mode', async () => {
    prisma.service_packages.findUnique.mockResolvedValue({ source_day_blueprint_version_id: 456 });
    blueprintPlacementSeed.seedPackagePlacementsFromBlueprint.mockResolvedValue({
      momentsSeeded: 3,
      placementsWritten: 5,
      skippedNoPosition: 0,
    });

    await service.run(52, 'catalog', 'blocking', runLogger);

    expect(blueprintPlacementSeed.seedPackagePlacementsFromBlueprint).toHaveBeenCalledWith(52);
    expect(runLogger.log).toHaveBeenCalledWith(
      'BUILDER',
      'Seeded blueprint placement hints into package floor plan',
      expect.objectContaining({ packageId: 52, momentsSeeded: 3 }),
    );
  });

  it('uses blueprint hint for background runs before lineage stamp lookup', async () => {
    prisma.service_packages.findUnique.mockResolvedValue({ source_day_blueprint_version_id: null });

    await service.run(90, 'inquiry', 'background', runLogger, { blueprintModeHint: true });

    await waitUntil(() => activityPlanner.planPackageActivities.mock.calls.length > 0);

    expect(activityPlanner.planPackageActivities).toHaveBeenCalledWith(90, runLogger, {
      deferCompletion: true,
      additionalSteps: 1,
      planningMode: 'blueprint',
      abortSignal,
    });
  });

  it('fails deferred planning when blocking is cancelled by user', async () => {
    packageBlockingPlanner.planPackageBlocking.mockRejectedValue(new Error('CANCELLED_BY_USER'));

    await service.run(42, 'catalog', 'blocking', runLogger);

    expect(activityPlanner.failDeferredPackagePlanning).toHaveBeenCalledWith(
      expect.objectContaining({ packageId: 42 }),
      'Cancelled by user',
      runLogger,
    );
    expect(activityPlanner.completeDeferredPackagePlanning).not.toHaveBeenCalled();
    expect(planningCancelRegistry.detach).toHaveBeenCalledWith(42);
  });
});