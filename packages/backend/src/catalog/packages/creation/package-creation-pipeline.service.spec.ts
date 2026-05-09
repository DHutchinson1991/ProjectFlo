import { Test } from '@nestjs/testing';
import { ActivityPlannerService } from '../../../content/activity-planning/services/activity-planner.service';
import { PackageBlockingPlannerService } from '../../../content/activity-planning/services/package-blocking-planner.service';
import { PlanningEventsService } from '../../../content/activity-planning/services/planning-events.service';
import { PackageCreationPipelineService } from './package-creation-pipeline.service';
import { PackageCreationRunLogger } from './run/package-creation-run-logger';
import { SandboxLayoutService } from './shared/sandbox-layout.service';

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
  let runLogger: PackageCreationRunLogger;

  beforeEach(async () => {
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

    const module = await Test.createTestingModule({
      providers: [
        PackageCreationPipelineService,
        { provide: ActivityPlannerService, useValue: activityPlanner },
        { provide: SandboxLayoutService, useValue: sandboxLayout },
        { provide: PackageBlockingPlannerService, useValue: packageBlockingPlanner },
        { provide: PlanningEventsService, useValue: planningEvents },
      ],
    }).compile();

    service = module.get(PackageCreationPipelineService);
    runLogger = {
      log: jest.fn(),
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
    expect(activityPlanner.planPackageActivities).toHaveBeenCalledWith(42, runLogger, {
      deferCompletion: true,
      additionalSteps: 1,
    });
    expect(packageBlockingPlanner.planPackageBlocking).toHaveBeenCalledWith(42, runLogger, {
      stepIndex: 6,
      totalSteps: 7,
    });
    expect(activityPlanner.completeDeferredPackagePlanning).toHaveBeenCalled();
  });

  it('starts background mode without waiting for layout completion', async () => {
    let releaseLayout: (() => void) | undefined;
    sandboxLayout.applyCeremonyLayouts.mockImplementation(
      () => new Promise<void>((resolve) => {
        releaseLayout = resolve;
      }),
    );

    await service.run(84, 'inquiry', 'background', runLogger);

    expect(sandboxLayout.applyCeremonyLayouts).toHaveBeenCalledWith(84, runLogger);
    expect(activityPlanner.planPackageActivities).not.toHaveBeenCalled();

    releaseLayout?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(activityPlanner.planPackageActivities).toHaveBeenCalledWith(84, runLogger, {
      deferCompletion: true,
      additionalSteps: 1,
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
  });
});