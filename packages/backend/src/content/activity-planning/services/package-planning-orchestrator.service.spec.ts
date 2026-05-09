import { Test, TestingModule } from '@nestjs/testing';
import { PlanningStatus } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { PackagePlanningSummary, PlannerActivityRecord, PlannerSubject } from '../activity-planning.types';
import { ActivityPlanningStatusService } from './activity-planning-status.service';
import { PackageContextService } from './package-context.service';
import { PackagePlanningOrchestratorService } from './package-planning-orchestrator.service';
import { PackagePlanningProgressService } from './package-planning-progress.service';
import { PackagePlanningStepsService } from './package-planning-steps.service';
import { SingleActivityPlannerService } from './single-activity-planner.service';

const buildSummary = (packageId: number): PackagePlanningSummary => ({
  packageId,
  startedAt: new Date().toISOString(),
  finalStatus: 'RUNNING',
  eventType: '',
  totalActivities: 0,
  totalSubjects: 0,
  steps: [],
  errors: [],
});

const buildPrisma = () => ({
  packageActivity: { findMany: jest.fn() },
  service_packages: { findUnique: jest.fn() },
});

const mockPackageContext = () => ({
  loadPackageSubjects: jest.fn(),
  loadLocationContext: jest.fn(),
});

const mockStatus = () => ({
  markPlanning: jest.fn(),
  setStatus: jest.fn(),
});

const mockProgress = () => ({
  createSummary: jest.fn((packageId: number) => buildSummary(packageId)),
  recordStep: jest.fn(),
  emitLiveUpdate: jest.fn(),
  markReady: jest.fn(),
  markFailed: jest.fn(),
  writeSummary: jest.fn(),
});

const mockSteps = () => ({
  runDescriptionEnrichment: jest.fn(),
  runSubjectAssignment: jest.fn(),
  runTimingEstimation: jest.fn(),
});

const mockSingleActivityPlanner = () => ({
  preparePlanContext: jest.fn(),
  planCasting: jest.fn(),
  planActions: jest.fn(),
});

describe('PackagePlanningOrchestratorService', () => {
  let service: PackagePlanningOrchestratorService;
  let prisma: ReturnType<typeof buildPrisma>;
  let packageContext: ReturnType<typeof mockPackageContext>;
  let status: ReturnType<typeof mockStatus>;
  let progress: ReturnType<typeof mockProgress>;
  let steps: ReturnType<typeof mockSteps>;
  let singleActivityPlanner: ReturnType<typeof mockSingleActivityPlanner>;

  beforeEach(async () => {
    prisma = buildPrisma();
    packageContext = mockPackageContext();
    status = mockStatus();
    progress = mockProgress();
    steps = mockSteps();
    singleActivityPlanner = mockSingleActivityPlanner();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackagePlanningOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: PackageContextService, useValue: packageContext },
        { provide: ActivityPlanningStatusService, useValue: status },
        { provide: PackagePlanningProgressService, useValue: progress },
        { provide: PackagePlanningStepsService, useValue: steps },
        { provide: SingleActivityPlannerService, useValue: singleActivityPlanner },
      ],
    }).compile();

    service = module.get(PackagePlanningOrchestratorService);
  });

  it('marks the package ready and records a skipped step when no activities exist', async () => {
    prisma.packageActivity.findMany.mockResolvedValue([]);

    await service.planPackageActivities(42);

    expect(status.markPlanning).toHaveBeenCalledWith(42);
    expect(status.setStatus).toHaveBeenCalledWith(42, PlanningStatus.READY);
    expect(progress.markReady).toHaveBeenCalled();
    expect(progress.recordStep).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'activities', status: 'skipped', error: 'No activities found' }),
    );
    expect(progress.writeSummary).toHaveBeenCalled();
    expect(steps.runDescriptionEnrichment).not.toHaveBeenCalled();
  });

  it('runs package-level steps and per-activity planning through the split services', async () => {
    const activities: PlannerActivityRecord[] = [
      {
        id: 7,
        name: 'Ceremony',
        description: null,
        duration_minutes: 45,
        package_id: 42,
        package_event_day_id: 3,
      },
    ];
    const subjects: PlannerSubject[] = [
      { id: 11, name: 'Couple', role: 'Lead', isGroup: false },
    ];

    prisma.packageActivity.findMany.mockResolvedValue(activities);
    prisma.service_packages.findUnique.mockResolvedValue({
      wedding_type: { event_type: { name: 'Wedding' } },
    });
    packageContext.loadPackageSubjects.mockResolvedValue(subjects);
    packageContext.loadLocationContext.mockResolvedValue('Location 1');
    steps.runDescriptionEnrichment.mockResolvedValue(true);
    steps.runDescriptionEnrichment.mockResolvedValue({
      succeeded: true,
      updatedActivityCount: 1,
      metrics: { durationMs: 10, llmCallCount: 1, promptTokens: 10, completionTokens: 5, totalTokens: 15, promptChars: 20, responseChars: 10 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });
    steps.runSubjectAssignment.mockResolvedValue({
      succeeded: true,
      updatedActivityCount: 1,
      insertedAssignmentCount: 1,
      metrics: { durationMs: 11, llmCallCount: 1, promptTokens: 12, completionTokens: 6, totalTokens: 18, promptChars: 21, responseChars: 11 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });
    steps.runTimingEstimation.mockResolvedValue({
      succeeded: true,
      changedActivityCount: 1,
      metrics: { durationMs: 12, llmCallCount: 1, promptTokens: 14, completionTokens: 7, totalTokens: 21, promptChars: 22, responseChars: 12 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });
    singleActivityPlanner.preparePlanContext.mockResolvedValue({
      activity: activities[0],
      fullMoments: [
        { id: 100, name: 'Processional', description: null, order_index: 0, duration_seconds: 60 },
      ],
      momentSource: 'knowledge-base',
      templateUsed: 'Ceremony',
      subjects,
    });
    singleActivityPlanner.planCasting.mockImplementation(async (...args: unknown[]) => {
      const onMomentStart = args[4] as ((payload: { momentId: number; momentName: string; subjectIds: number[]; subjectNames: string[] }) => void) | undefined;
      onMomentStart?.({ momentId: 100, momentName: 'Processional', subjectIds: [11], subjectNames: ['Couple'] });
      return {
        presenceMaps: new Map(),
        focalMaps: new Map(),
        succeeded: true,
        metrics: { durationMs: 20, llmCallCount: 1, promptTokens: 20, completionTokens: 10, totalTokens: 30, promptChars: 30, responseChars: 15 },
        value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
      };
    });
    singleActivityPlanner.planActions.mockImplementation(async (...args: unknown[]) => {
      const onMomentStart = args[6] as ((payload: { momentId: number; momentName: string; subjectIds: number[]; subjectNames: string[] }) => void) | undefined;
      onMomentStart?.({ momentId: 100, momentName: 'Processional', subjectIds: [11], subjectNames: ['Couple'] });
      return {
        succeeded: true,
        metrics: { durationMs: 21, llmCallCount: 1, promptTokens: 22, completionTokens: 11, totalTokens: 33, promptChars: 31, responseChars: 16 },
        value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
      };
    });

    await service.planPackageActivities(42);

    expect(steps.runDescriptionEnrichment).toHaveBeenCalledWith(activities, subjects, 'Wedding', undefined);
    expect(steps.runSubjectAssignment).toHaveBeenCalledWith(activities, subjects, 'Wedding', undefined);
    expect(steps.runTimingEstimation).toHaveBeenCalledWith(activities, subjects, 'Location 1', 'Wedding', undefined);
    expect(singleActivityPlanner.preparePlanContext).toHaveBeenCalledWith(7, subjects, undefined);
    expect(singleActivityPlanner.planCasting).toHaveBeenCalled();
    expect(singleActivityPlanner.planActions).toHaveBeenCalled();
    expect(status.setStatus).toHaveBeenCalledWith(42, PlanningStatus.READY);
    expect(progress.recordStep).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'descriptions',
        status: 'completed',
        data: expect.objectContaining({
          metrics: expect.objectContaining({ totalTokens: 15 }),
          value: expect.objectContaining({ valueScore: 'high' }),
        }),
      }),
    );
    expect(progress.recordStep).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'done',
        status: 'completed',
      }),
    );
    expect(progress.emitLiveUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'activity-casting',
        activityName: 'Ceremony',
        momentId: 100,
        momentName: 'Processional',
        subjectIds: [11],
        subjectNames: ['Couple'],
      }),
    );
    expect(progress.emitLiveUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'activity-actions',
        activityName: 'Ceremony',
        momentId: 100,
        momentName: 'Processional',
        subjectIds: [11],
        subjectNames: ['Couple'],
      }),
    );
    expect(progress.writeSummary).toHaveBeenCalled();
  });

  it('can defer the terminal READY transition for callers that own post-planning work', async () => {
    const activities: PlannerActivityRecord[] = [
      {
        id: 7,
        name: 'Ceremony',
        description: null,
        duration_minutes: 45,
        package_id: 42,
        package_event_day_id: 3,
      },
    ];
    const subjects: PlannerSubject[] = [
      { id: 11, name: 'Couple', role: 'Lead', isGroup: false },
    ];

    prisma.packageActivity.findMany.mockResolvedValue(activities);
    prisma.service_packages.findUnique.mockResolvedValue({
      wedding_type: { event_type: { name: 'Wedding' } },
    });
    packageContext.loadPackageSubjects.mockResolvedValue(subjects);
    packageContext.loadLocationContext.mockResolvedValue('Location 1');
    steps.runDescriptionEnrichment.mockResolvedValue({
      succeeded: true,
      updatedActivityCount: 1,
      metrics: { durationMs: 10, llmCallCount: 1, promptTokens: 10, completionTokens: 5, totalTokens: 15, promptChars: 20, responseChars: 10 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });
    steps.runSubjectAssignment.mockResolvedValue({
      succeeded: true,
      updatedActivityCount: 1,
      insertedAssignmentCount: 1,
      metrics: { durationMs: 11, llmCallCount: 1, promptTokens: 12, completionTokens: 6, totalTokens: 18, promptChars: 21, responseChars: 11 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });
    steps.runTimingEstimation.mockResolvedValue({
      succeeded: true,
      changedActivityCount: 1,
      metrics: { durationMs: 12, llmCallCount: 1, promptTokens: 14, completionTokens: 7, totalTokens: 21, promptChars: 22, responseChars: 12 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });
    singleActivityPlanner.preparePlanContext.mockResolvedValue({
      activity: activities[0],
      fullMoments: [
        { id: 100, name: 'Processional', description: null, order_index: 0, duration_seconds: 60 },
      ],
      momentSource: 'knowledge-base',
      templateUsed: 'Ceremony',
      subjects,
    });
    singleActivityPlanner.planCasting.mockResolvedValue({
      presenceMaps: new Map(),
      focalMaps: new Map(),
      succeeded: true,
      metrics: { durationMs: 20, llmCallCount: 1, promptTokens: 20, completionTokens: 10, totalTokens: 30, promptChars: 30, responseChars: 15 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });
    singleActivityPlanner.planActions.mockResolvedValue({
      succeeded: true,
      metrics: { durationMs: 21, llmCallCount: 1, promptTokens: 22, completionTokens: 11, totalTokens: 33, promptChars: 31, responseChars: 16 },
      value: { candidateCount: 1, changedCount: 1, changeRate: 1, valueScore: 'high' },
    });

    const result = await service.planPackageActivities(42, undefined, {
      deferCompletion: true,
      additionalSteps: 1,
    });

    expect(result).toMatchObject({
      packageId: 42,
      totalSteps: 7,
      succeeded: true,
      deferredCompletion: true,
    });
    expect(status.setStatus).not.toHaveBeenCalledWith(42, PlanningStatus.READY);
    expect(progress.markReady).not.toHaveBeenCalled();
    expect(progress.recordStep).not.toHaveBeenCalledWith(
      expect.objectContaining({ step: 'done' }),
    );
    expect(progress.writeSummary).toHaveBeenCalled();
  });
});