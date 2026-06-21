import { DayBlueprintAiGeneratorService } from './day-blueprint-ai-generator.service';
import {
  BASE_DAY,
  buildAiEventsMock,
  buildDensity,
  buildExpansionReply,
  buildGemma,
  buildOutlineReply,
  buildPrisma,
  buildTx,
  RUN_LOGGER,
  SKILLS,
  SPATIAL,
} from './day-blueprint-ai-generator.spec.fixtures';

describe('DayBlueprintAiGeneratorService.generateDay', () => {
  it('runs the two-phase pipeline and persists model-only data', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = buildAiEventsMock();
    const runLogger = RUN_LOGGER();
    const runLoggerFactory = { create: jest.fn().mockReturnValue(runLogger) };
    const skills = SKILLS();

    const outlineReply = buildOutlineReply({
      morningDurations: [300, 300, 300],
      ceremonyDurations: [300, 600, 0],
    });
    const morningExpansion = buildExpansionReply(3);
    const ceremonyExpansion = buildExpansionReply(3);
    const gemma = buildGemma(outlineReply, [morningExpansion, ceremonyExpansion]);

    prisma.dayBlueprintDay.findUnique.mockResolvedValue(BASE_DAY);
    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ id: 34, generation_mode: 'NORMAL' });
    prisma.dayBlueprintVersion.update.mockResolvedValue({ id: 34, generation_mode: 'AI' });
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 88 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 88 });
    tx.dayBlueprintMoment.deleteMany.mockResolvedValue({ count: 0 });
    tx.dayBlueprintActivity.update.mockResolvedValue({ id: 101 });
    tx.dayBlueprintMoment.create.mockImplementation((args: any) =>
      Promise.resolve({ id: Math.floor(Math.random() * 1_000_000), ...args.data }),
    );
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
      SPATIAL() as never,
      skills as never,
      buildDensity() as never,
      runLoggerFactory as never,
    );

    const result = await service.generateDay(34, 12, { mode: 'AI' });

    expect(skills.load).toHaveBeenCalledWith('planning/day-outline.md');
    expect(skills.load).toHaveBeenCalledWith('planning/moment-expansion.md');
    expect(gemma.chatStream).toHaveBeenCalledTimes(1);
    expect(gemma.chat).toHaveBeenCalledTimes(2);
    expect((tx as any).dayBlueprintActivity.deleteMany).toBeUndefined();
    expect((tx as any).dayBlueprintActivity.create).toBeUndefined();
    expect(tx.dayBlueprintMoment.deleteMany).toHaveBeenCalledWith({
      where: { day_blueprint_activity_id: { in: [101, 102] } },
    });
    expect(result.momentsCreated).toBe(6);
    expect(result.actionsCreated).toBeGreaterThan(0);
    expect(tx.dayBlueprintMomentPlacement.create).not.toHaveBeenCalled();

    const createCalls = tx.dayBlueprintMoment.create.mock.calls.map(([args]) => args.data);
    const morningKeyFlags = createCalls
      .filter((data) => data.day_blueprint_activity_id === 101)
      .map((data) => data.is_key_moment);
    const ceremonyKeyFlags = createCalls
      .filter((data) => data.day_blueprint_activity_id === 102)
      .map((data) => data.is_key_moment);
    expect(morningKeyFlags).toEqual([true, false, false]);
    expect(ceremonyKeyFlags).toEqual([false, true, false]);
  });

  it('includes per-activity description in the Phase 1 user message when non-empty', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = buildAiEventsMock();
    const runLogger = RUN_LOGGER();
    const runLoggerFactory = { create: jest.fn().mockReturnValue(runLogger) };
    const skills = SKILLS();
    const outlineReply = buildOutlineReply();
    const gemma = buildGemma(outlineReply, [buildExpansionReply(3), buildExpansionReply(3)]);

    const scopeText = 'Ritual through recessional only; no portrait session.';
    prisma.dayBlueprintDay.findUnique.mockResolvedValue({
      ...BASE_DAY,
      activities: [
        { id: 101, name: 'Morning Preparation', order_index: 0, default_duration_minutes: 15, description: null },
        {
          id: 102,
          name: 'Ceremony Coverage',
          order_index: 1,
          default_duration_minutes: 15,
          description: `  ${scopeText}  `,
        },
      ],
    });
    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ id: 34, generation_mode: 'NORMAL' });
    prisma.dayBlueprintVersion.update.mockResolvedValue({ id: 34, generation_mode: 'AI' });
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 89 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 89 });
    tx.dayBlueprintMoment.deleteMany.mockResolvedValue({ count: 0 });
    tx.dayBlueprintActivity.update.mockResolvedValue({ id: 101 });
    tx.dayBlueprintMoment.create.mockImplementation((args: any) =>
      Promise.resolve({ id: Math.floor(Math.random() * 1_000_000), ...args.data }),
    );
    tx.dayBlueprintMomentAction.create.mockResolvedValue({ id: 301 });
    tx.dayBlueprintMomentPlacement.create.mockResolvedValue({ id: 401 });
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
      SPATIAL() as never,
      skills as never,
      buildDensity() as never,
      runLoggerFactory as never,
    );

    await service.generateDay(34, 12, { mode: 'AI' });

    const streamRequest = gemma.chatStream.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const userMessage = streamRequest.messages.find((message) => message.role === 'user')?.content ?? '';
    const jsonPayload = userMessage.split('\n\n').slice(1).join('\n\n');
    const parsed = JSON.parse(jsonPayload) as {
      activities: Array<{ name: string; description?: string }>;
    };
    expect(parsed.activities[0].description).toBeUndefined();
    expect(parsed.activities[1].description).toBe(scopeText);
    expect(userMessage).not.toContain('"description": ""');
  });

  it('throws when the day has no activities', async () => {
    const prisma = buildPrisma();
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = buildAiEventsMock();
    const runLoggerFactory = { create: jest.fn() };
    const gemma = { chat: jest.fn(), chatStream: jest.fn() };

    prisma.dayBlueprintDay.findUnique.mockResolvedValue({ ...BASE_DAY, activities: [] });
    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ id: 34, generation_mode: 'NORMAL' });

    const service = new DayBlueprintAiGeneratorService(
      prisma as never,
      versions as never,
      gemma as never,
      aiEvents as never,
      SPATIAL() as never,
      SKILLS() as never,
      buildDensity() as never,
      runLoggerFactory as never,
    );

    await expect(service.generateDay(34, 12, { mode: 'AI' })).rejects.toThrow(
      'Add at least one activity before running AI',
    );
    expect(gemma.chat).not.toHaveBeenCalled();
    expect(gemma.chatStream).not.toHaveBeenCalled();
  });

  it('uses deterministic NORMAL mode and never calls Gemma', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = buildAiEventsMock();
    const runLogger = RUN_LOGGER();
    const runLoggerFactory = { create: jest.fn().mockReturnValue(runLogger) };
    const gemma = buildGemma(buildOutlineReply(), [buildExpansionReply(3), buildExpansionReply(3)]);

    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ id: 34, generation_mode: 'NORMAL' });
    prisma.dayBlueprintDay.findUnique.mockResolvedValue(BASE_DAY);
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 93 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 93 });
    tx.dayBlueprintMoment.deleteMany.mockResolvedValue({ count: 0 });
    tx.dayBlueprintActivity.update.mockResolvedValue({ id: 101 });
    tx.dayBlueprintMoment.create.mockImplementation((args: any) =>
      Promise.resolve({ id: Math.floor(Math.random() * 1_000_000), ...args.data }),
    );
    tx.dayBlueprintMomentAction.create.mockResolvedValue({ id: 301 });
    tx.dayBlueprintSubjectRole.findMany.mockResolvedValue([
      { subject_role_id: 1, subject_role: { role_name: 'Bride' } },
      { subject_role_id: 2, subject_role: { role_name: 'Groom' } },
    ]);
    prisma.momentKnowledgeBase.findMany.mockResolvedValue([]);

    const service = new DayBlueprintAiGeneratorService(
      prisma as never,
      versions as never,
      gemma as never,
      aiEvents as never,
      SPATIAL() as never,
      SKILLS() as never,
      buildDensity() as never,
      runLoggerFactory as never,
    );

    const result = await service.generateDay(34, 12, {});
    expect(gemma.chat).not.toHaveBeenCalled();
    expect(gemma.chatStream).not.toHaveBeenCalled();
    expect(result.momentsCreated).toBeGreaterThan(0);
  });
});
