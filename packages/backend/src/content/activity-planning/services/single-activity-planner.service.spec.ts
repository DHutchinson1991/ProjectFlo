import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { MomentKnowledgeService } from '../../schedule/services/moment-knowledge.service';
import { PlannerSubject } from '../activity-planning.types';
import { ActivityActionsStep } from '../steps/activity-actions.step';
import { ActivityCastingStep } from '../steps/activity-casting.step';
import { PackageContextService } from './package-context.service';
import { SingleActivityPlannerService } from './single-activity-planner.service';

const buildPrisma = () => ({
  packageActivity: {
    findUnique: jest.fn(),
  },
  packageActivityMoment: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
});

const mockMomentKnowledge = () => ({
  ensureActivityMoments: jest.fn(),
});

const mockPackageContext = () => ({
  loadActivitySubjects: jest.fn(),
  loadPackageSubjects: jest.fn(),
});

const mockActivityCasting = () => ({
  execute: jest.fn(),
  toPresenceMaps: jest.fn(),
  toFocalMaps: jest.fn(),
});

const mockActivityActions = () => ({
  execute: jest.fn(),
  toActionMap: jest.fn(),
});

describe('SingleActivityPlannerService', () => {
  let service: SingleActivityPlannerService;
  let prisma: ReturnType<typeof buildPrisma>;
  let momentKnowledge: ReturnType<typeof mockMomentKnowledge>;
  let packageContext: ReturnType<typeof mockPackageContext>;
  let activityCasting: ReturnType<typeof mockActivityCasting>;
  let activityActions: ReturnType<typeof mockActivityActions>;

  beforeEach(async () => {
    prisma = buildPrisma();
    momentKnowledge = mockMomentKnowledge();
    packageContext = mockPackageContext();
    activityCasting = mockActivityCasting();
    activityActions = mockActivityActions();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SingleActivityPlannerService,
        { provide: PrismaService, useValue: prisma },
        { provide: MomentKnowledgeService, useValue: momentKnowledge },
        { provide: PackageContextService, useValue: packageContext },
        { provide: ActivityCastingStep, useValue: activityCasting },
        { provide: ActivityActionsStep, useValue: activityActions },
      ],
    }).compile();

    service = module.get(SingleActivityPlannerService);
  });

  it('falls back to package subjects when activity assignments are missing', async () => {
    const packageSubjects: PlannerSubject[] = [
      { id: 31, name: 'Alex', role: 'Lead', isGroup: false },
    ];

    momentKnowledge.ensureActivityMoments.mockResolvedValue({
      moments: [{ id: 91, name: 'Entrance', order_index: 0, duration_seconds: 45 }],
      source: 'knowledge-base',
      templateUsed: 'Ceremony',
    });
    prisma.packageActivity.findUnique.mockResolvedValue({
      id: 7,
      name: 'Ceremony',
      description: 'Exchange vows',
      duration_minutes: 45,
      package_id: 42,
      package_event_day_id: 3,
    });
    prisma.packageActivityMoment.findMany.mockResolvedValue([
      { id: 91, name: 'Entrance', description: null, order_index: 0, duration_seconds: 45 },
    ]);
    packageContext.loadActivitySubjects.mockResolvedValue([]);
    packageContext.loadPackageSubjects.mockResolvedValue(packageSubjects);

    const result = await service.preparePlanContext(7);

    expect(packageContext.loadActivitySubjects).toHaveBeenCalledWith(7);
    expect(packageContext.loadPackageSubjects).toHaveBeenCalledWith(42);
    expect(result.subjects).toEqual(packageSubjects);
    expect(result.activity).toEqual(
      expect.objectContaining({ id: 7, name: 'Ceremony', package_id: 42 }),
    );
  });

  it('plans a single activity and persists subject actions for each moment', async () => {
    const subjects: PlannerSubject[] = [
      { id: 11, name: 'Alice', role: 'Lead', isGroup: false },
      { id: 12, name: 'Bob', role: 'Guest', isGroup: false },
    ];

    momentKnowledge.ensureActivityMoments.mockResolvedValue({
      moments: [
        { id: 101, name: 'Processional', order_index: 0, duration_seconds: 60 },
        { id: 102, name: 'Vows', order_index: 1, duration_seconds: 120 },
      ],
      source: 'knowledge-base',
      templateUsed: 'Ceremony',
    });
    prisma.packageActivity.findUnique.mockResolvedValue({
      id: 7,
      name: 'Ceremony',
      description: 'Exchange vows',
      duration_minutes: 45,
      package_id: 42,
      package_event_day_id: 3,
    });
    prisma.packageActivityMoment.findMany.mockResolvedValue([
      { id: 101, name: 'Processional', description: null, order_index: 0, duration_seconds: 60 },
      { id: 102, name: 'Vows', description: 'Couple at altar', order_index: 1, duration_seconds: 120 },
    ]);
    packageContext.loadActivitySubjects.mockResolvedValue(subjects);

    activityCasting.execute
      .mockResolvedValueOnce({ moments: [] })
      .mockResolvedValueOnce({ moments: [] });
    activityCasting.toPresenceMaps
      .mockReturnValueOnce(new Map([[0, new Map([['alice', true], ['bob', false]])]]))
      .mockReturnValueOnce(new Map([[1, new Map([['alice', true], ['bob', true]])]]));
    activityCasting.toFocalMaps
      .mockReturnValueOnce(new Map([[0, new Map([['alice', 'PRIMARY'], ['bob', 'BACKGROUND']])]]))
      .mockReturnValueOnce(new Map([[1, new Map([['alice', 'PRIMARY'], ['bob', 'SECONDARY']])]]));

    activityActions.execute
      .mockResolvedValueOnce({ moments: [] })
      .mockResolvedValueOnce({ moments: [] });
    activityActions.toActionMap
      .mockReturnValueOnce(new Map([[0, new Map([['alice', 'walks down the aisle']])]]))
      .mockReturnValueOnce(new Map([[1, new Map([['alice', 'recites vows'], ['bob', 'watches from the front row']])]]));

    const result = await service.planActivity(7);

    expect(result).toEqual({ momentCount: 2, planned: true });
    expect(activityCasting.execute).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        activityName: 'Ceremony',
        moments: [expect.objectContaining({ index: 0, name: 'Processional' })],
        subjects: [
          expect.objectContaining({ name: 'Alice', role: 'Lead', isGroup: false }),
          expect.objectContaining({ name: 'Bob', role: 'Guest', isGroup: false }),
        ],
      }),
      undefined,
    );
    expect(activityCasting.execute).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        activityName: 'Ceremony',
        moments: [expect.objectContaining({ index: 1, name: 'Vows' })],
      }),
      undefined,
    );
    expect(activityActions.execute).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        activityName: 'Ceremony',
        moments: [
          expect.objectContaining({
            index: 0,
            subjects: [
              expect.objectContaining({ name: 'Alice', present: true }),
              expect.objectContaining({ name: 'Bob', present: false }),
            ],
          }),
        ],
      }),
      undefined,
    );
    expect(activityActions.execute).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        activityName: 'Ceremony',
        moments: [
          expect.objectContaining({
            index: 1,
            subjects: [
              expect.objectContaining({ name: 'Alice', present: true }),
              expect.objectContaining({ name: 'Bob', present: true }),
            ],
          }),
        ],
      }),
      undefined,
    );
    expect(activityCasting.execute).toHaveBeenCalledTimes(2);
    expect(activityActions.execute).toHaveBeenCalledTimes(2);
    expect(prisma.packageActivityMoment.update).toHaveBeenNthCalledWith(1, {
      where: { id: 101 },
      data: {
        subject_actions: {
          Alice: { action: 'walks down the aisle', focal: 'PRIMARY' },
          Bob: null,
        },
      },
    });
    expect(prisma.packageActivityMoment.update).toHaveBeenNthCalledWith(2, {
      where: { id: 102 },
      data: {
        subject_actions: {
          Alice: { action: 'recites vows', focal: 'PRIMARY' },
          Bob: { action: 'watches from the front row', focal: 'SECONDARY' },
        },
      },
    });
  });

  it('returns an unplanned result when no moments are available', async () => {
    momentKnowledge.ensureActivityMoments.mockResolvedValue({
      moments: [],
      source: 'none',
      templateUsed: null,
    });

    const result = await service.planActivity(99);

    expect(result).toEqual({ momentCount: 0, planned: false });
    expect(prisma.packageActivity.findUnique).not.toHaveBeenCalled();
    expect(activityCasting.execute).not.toHaveBeenCalled();
    expect(activityActions.execute).not.toHaveBeenCalled();
  });
});