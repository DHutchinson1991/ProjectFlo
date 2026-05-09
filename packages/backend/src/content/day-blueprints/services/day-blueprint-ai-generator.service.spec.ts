import { DayBlueprintAiGeneratorService } from './day-blueprint-ai-generator.service';

const buildTx = () => ({
  dayBlueprintActivity: {
    update: jest.fn(),
  },
  dayBlueprintMoment: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  dayBlueprintMomentAction: {
    create: jest.fn(),
  },
  dayBlueprintMomentPlacement: {
    create: jest.fn(),
  },
  dayBlueprintSubjectRole: {
    findMany: jest.fn(),
  },
  dayBlueprintActivityLocation: {
    findFirst: jest.fn(),
  },
  dayBlueprintSpaceSlot: {
    findFirst: jest.fn(),
  },
  dayBlueprintAiRun: {
    update: jest.fn(),
  },
});

const buildPrisma = (tx = buildTx()) => ({
  dayBlueprintDay: {
    findUnique: jest.fn(),
  },
  dayBlueprintAiRun: {
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(tx)),
});

const BASE_DAY = {
  id: 12,
  name: 'Wedding Day',
  description: null,
  default_start_time: '08:00',
  day_blueprint_version_id: 34,
  version: {
    day_blueprint: {
      id: 2,
      brand_id: 9,
      event_category: 'Wedding',
      display_name: 'Hutchinson',
    },
    subject_roles: [
      { subject_role_id: 1, subject_role: { role_name: 'Bride' } },
      { subject_role_id: 2, subject_role: { role_name: 'Groom' } },
    ],
  },
  activities: [
    { id: 101, name: 'Morning Preparation', order_index: 0 },
    { id: 102, name: 'Ceremony Coverage', order_index: 1 },
  ],
};

const GEMMA_REPLY = JSON.stringify({
  activities: [
    {
      name: 'Morning Preparation',
      description: 'Bride and wedding party prepare together.',
      moments: [
        {
          name: 'Hair and Makeup',
          duration_seconds: 1200,
          subject_actions: [{ subject_role: 'Bride', action_text: 'Bride settles into hair and makeup.' }],
          subject_placements: [{ subject_role: 'Bride', position_hint: 'CENTER', facing_hint: 'TOWARD_CAMERA' }],
        },
      ],
    },
    {
      name: 'Ceremony Coverage',
      description: 'Couple exchange vows at the altar.',
      moments: [
        {
          name: 'Vows',
          duration_seconds: 900,
          subject_actions: [{ subject_role: 'Groom', action_text: 'Groom gives vows.' }],
          subject_placements: [{ subject_role: 'Groom', position_hint: 'STAGE_RIGHT', facing_hint: 'TOWARD_PARTNER' }],
        },
      ],
    },
  ],
});

describe('DayBlueprintAiGeneratorService', () => {
  it('fills moments for existing activities without touching activity rows', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = { emit: jest.fn() };
    const runLogger = {
      getRunId: jest.fn().mockReturnValue('run-test'),
      attachDatabaseRun: jest.fn(),
      writeRequest: jest.fn(),
      writeLlmResponse: jest.fn(),
      writeReport: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    const runLoggerFactory = { create: jest.fn().mockReturnValue(runLogger) };
    const gemma = {
      chat: jest.fn().mockResolvedValue({
        reply: GEMMA_REPLY,
        model: 'gemma-test',
        provider: 'local',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        queueWaitMs: 1,
        requestDurationMs: 2,
      }),
    };

    prisma.dayBlueprintDay.findUnique.mockResolvedValue(BASE_DAY);
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 88 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 88 });
    tx.dayBlueprintMoment.deleteMany.mockResolvedValue({ count: 3 });
    tx.dayBlueprintActivity.update.mockResolvedValue({ id: 101 });
    tx.dayBlueprintMoment.create.mockResolvedValue({ id: 201 });
    tx.dayBlueprintMomentAction.create.mockResolvedValue({ id: 301 });
    tx.dayBlueprintMomentPlacement.create.mockResolvedValue({ id: 401 });
    tx.dayBlueprintAiRun.update.mockResolvedValue({ id: 88 });
    tx.dayBlueprintSubjectRole.findMany.mockResolvedValue([
      { subject_role_id: 1, subject_role: { role_name: 'Bride' } },
      { subject_role_id: 2, subject_role: { role_name: 'Groom' } },
    ]);
    tx.dayBlueprintActivityLocation.findFirst.mockResolvedValue({ day_blueprint_location_role_id: 10 });
    tx.dayBlueprintSpaceSlot.findFirst.mockResolvedValue({ id: 501 });

    const service = new DayBlueprintAiGeneratorService(
      prisma as never,
      versions as never,
      gemma as never,
      aiEvents as never,
      { generateForDay: jest.fn().mockResolvedValue({}) } as never,
      runLoggerFactory as never,
    );

    const result = await service.generateDay(34, 12, {});

    // Activities must never be deleted or created
    expect((tx as any).dayBlueprintActivity.deleteMany).toBeUndefined();
    expect((tx as any).dayBlueprintActivity.create).toBeUndefined();

    // Existing moments are wiped before new ones are written
    expect(tx.dayBlueprintMoment.deleteMany).toHaveBeenCalledWith({
      where: { day_blueprint_activity: { day_blueprint_day_id: 12 } },
    });

    // Activity descriptions are updated
    expect(tx.dayBlueprintActivity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 101 },
        data: { description: 'Bride and wedding party prepare together.' },
      }),
    );

    // Moments are created under the existing activity ids
    expect(tx.dayBlueprintMoment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ day_blueprint_activity_id: 101, name: 'Hair and Makeup' }),
      }),
    );

    // Moments, actions, placements counts are returned; no activitiesCreated
    expect(result).toMatchObject({ momentsCreated: 2, actionsCreated: 2, placementsCreated: 2 });
    expect((result as any).activitiesCreated).toBeUndefined();
  });

  it('throws when the day has no activities', async () => {
    const prisma = buildPrisma();
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = { emit: jest.fn() };
    const runLoggerFactory = { create: jest.fn() };
    const gemma = { chat: jest.fn() };

    prisma.dayBlueprintDay.findUnique.mockResolvedValue({ ...BASE_DAY, activities: [] });

    const service = new DayBlueprintAiGeneratorService(
      prisma as never,
      versions as never,
      gemma as never,
      aiEvents as never,
      { generateForDay: jest.fn().mockResolvedValue({}) } as never,
      runLoggerFactory as never,
    );

    await expect(service.generateDay(34, 12, {})).rejects.toThrow(
      'Add at least one activity before running AI',
    );
    expect(gemma.chat).not.toHaveBeenCalled();
  });

  it('skips AI activities that do not match any existing activity', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = { emit: jest.fn() };
    const runLogger = {
      getRunId: jest.fn().mockReturnValue('run-x'),
      attachDatabaseRun: jest.fn(),
      writeRequest: jest.fn(),
      writeLlmResponse: jest.fn(),
      writeReport: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    const runLoggerFactory = { create: jest.fn().mockReturnValue(runLogger) };
    const gemma = {
      chat: jest.fn().mockResolvedValue({
        reply: JSON.stringify({
          activities: [
            {
              name: 'Unknown Activity',
              moments: [
                {
                  name: 'Some Moment',
                  subject_actions: [{ subject_role: 'Bride', action_text: 'Bride does something.' }],
                  subject_placements: [{ subject_role: 'Bride', position_hint: 'CENTER', facing_hint: 'UNSPECIFIED' }],
                },
              ],
            },
          ],
        }),
        model: 'gemma-test', provider: 'local',
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        queueWaitMs: 1, requestDurationMs: 2,
      }),
    };

    prisma.dayBlueprintDay.findUnique.mockResolvedValue(BASE_DAY);
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 99 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 99 });
    tx.dayBlueprintMoment.deleteMany.mockResolvedValue({ count: 0 });
    tx.dayBlueprintSubjectRole.findMany.mockResolvedValue([]);

    const service = new DayBlueprintAiGeneratorService(
      prisma as never,
      versions as never,
      gemma as never,
      aiEvents as never,
      { generateForDay: jest.fn().mockResolvedValue({}) } as never,
      runLoggerFactory as never,
    );

    const result = await service.generateDay(34, 12, {});
    expect(result.momentsCreated).toBe(0);
    expect(tx.dayBlueprintMoment.create).not.toHaveBeenCalled();
  });
});

const buildPrisma = (tx = buildTx()) => ({
  dayBlueprintDay: {
    findUnique: jest.fn(),
  },
  dayBlueprintAiRun: {
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(tx)),
});

describe('DayBlueprintAiGeneratorService', () => {
  it('assigns sequential activity start times when the AI returns durations only', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const defaults = { ensureActivityLocationDefaults: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = { emit: jest.fn() };
    const runLogger = {
      getRunId: jest.fn().mockReturnValue('run-test'),
      attachDatabaseRun: jest.fn(),
      writeRequest: jest.fn(),
      writeLlmResponse: jest.fn(),
      writeReport: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    const runLoggerFactory = { create: jest.fn().mockReturnValue(runLogger) };
    const gemma = {
      chat: jest.fn().mockResolvedValue({
        reply: JSON.stringify({
          activities: [
            {
              name: 'Morning Preparation',
              default_duration_minutes: 90,
              moments: [
                  {
                    name: 'Hair and Makeup',
                    duration_seconds: 1200,
                    subject_actions: [{ subject_role: 'Bride', action_text: 'Bride settles into hair and makeup.' }],
                    subject_placements: [{ subject_role: 'Bride', position_hint: 'CENTER', facing_hint: 'TOWARD_CAMERA' }],
                  },
              ],
            },
            {
              name: 'Ceremony Coverage',
              default_duration_minutes: 60,
              moments: [
                  {
                    name: 'Vows',
                    duration_seconds: 900,
                    subject_actions: [{ subject_role: 'Groom', action_text: 'Groom gives vows.' }],
                    subject_placements: [{ subject_role: 'Groom', position_hint: 'STAGE_RIGHT', facing_hint: 'TOWARD_PARTNER' }],
                  },
              ],
            },
          ],
        }),
          model: 'gemma-test',
          provider: 'local',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          queueWaitMs: 1,
          requestDurationMs: 2,
      }),
    };

    prisma.dayBlueprintDay.findUnique.mockResolvedValue({
      id: 12,
      name: 'Wedding Day',
      description: null,
      default_start_time: '08:00',
      day_blueprint_version_id: 34,
      version: {
        day_blueprint: {
          id: 2,
          brand_id: 9,
          event_category: 'Wedding',
          display_name: 'Hutchinson',
        },
        subject_roles: [
          { subject_role_id: 1, subject_role: { role_name: 'Bride' } },
          { subject_role_id: 2, subject_role: { role_name: 'Groom' } },
        ],
      },
      activities: [{ id: 77, name: 'Existing Activity', order_index: 0 }],
    });
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 88 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 88 });
    tx.dayBlueprintActivity.deleteMany.mockResolvedValue({ count: 1 });
    tx.dayBlueprintActivity.create
      .mockResolvedValueOnce({ id: 101 })
      .mockResolvedValueOnce({ id: 102 });
    tx.dayBlueprintMoment.create.mockResolvedValue({ id: 201 });
    tx.dayBlueprintMomentAction.create.mockResolvedValue({ id: 301 });
    tx.dayBlueprintMomentPlacement.create.mockResolvedValue({ id: 401 });
    tx.dayBlueprintAiRun.update.mockResolvedValue({ id: 88 });
    tx.dayBlueprintSubjectRole.findMany.mockResolvedValue([
      { subject_role_id: 1, subject_role: { role_name: 'Bride' } },
      { subject_role_id: 2, subject_role: { role_name: 'Groom' } },
    ]);
    tx.dayBlueprintActivityLocation.findFirst.mockResolvedValue({ day_blueprint_location_role_id: 10 });
    tx.dayBlueprintSpaceSlot.findFirst.mockResolvedValue({ id: 501 });

    const service = new DayBlueprintAiGeneratorService(
      prisma as never,
      versions as never,
      gemma as never,
      defaults as never,
      aiEvents as never,
      { generateForDay: jest.fn().mockResolvedValue({}) } as never,
      runLoggerFactory as never,
    );

    await service.generateDay(34, 12, {});

    expect(runLoggerFactory.create).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: 9, blueprintId: 2, versionId: 34, dayId: 12 }),
    );
    expect(prisma.dayBlueprintAiRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ run_key: 'run-test' }),
    });
    expect(runLogger.writeRequest).toHaveBeenCalled();
    expect(runLogger.writeLlmResponse).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemma-test', reply: expect.any(String) }),
    );
    expect(runLogger.writeReport).toHaveBeenCalledWith(
      expect.objectContaining({
        v: 1,
        run: 'run-test',
        status: 'completed',
        persisted: expect.objectContaining({ activities: 2, moments: 2, actions: 2, placements: 2 }),
      }),
    );
    expect(runLogger.complete).toHaveBeenCalledWith(
      expect.objectContaining({ activitiesCreated: 2, momentsCreated: 2 }),
    );

    expect(tx.dayBlueprintActivity.deleteMany).toHaveBeenCalledWith({
      where: { day_blueprint_day_id: 12 },
    });

    expect(gemma.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        responseFormat: expect.objectContaining({
          json_schema: expect.objectContaining({
            schema: expect.objectContaining({
              properties: expect.objectContaining({
                activities: expect.objectContaining({
                  items: expect.objectContaining({
                    properties: expect.objectContaining({
                      default_start_time: expect.objectContaining({
                        pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    );

    expect(tx.dayBlueprintActivity.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        name: 'Morning Preparation',
        default_start_time: '08:00',
        default_duration_minutes: 90,
        order_index: 0,
      }),
    });
    expect(tx.dayBlueprintActivity.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        name: 'Ceremony Coverage',
        default_start_time: '09:30',
        default_duration_minutes: 60,
        order_index: 1,
      }),
    });
    expect(defaults.ensureActivityLocationDefaults).toHaveBeenNthCalledWith(1, tx, {
      brandId: 9,
      versionId: 34,
      activityId: 101,
      activityName: 'Morning Preparation',
    });
    expect(defaults.ensureActivityLocationDefaults).toHaveBeenNthCalledWith(2, tx, {
      brandId: 9,
      versionId: 34,
      activityId: 102,
      activityName: 'Ceremony Coverage',
    });
  });
});