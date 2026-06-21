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

describe('DayBlueprintAiGeneratorService.generateDay advanced flows', () => {
  it('normalizes Phase 1 outline durations to the activity target instead of failing', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = buildAiEventsMock();
    const runLoggerFactory = { create: jest.fn().mockReturnValue(RUN_LOGGER()) };

    const outlineReply = buildOutlineReply({
      morningDurations: [300, 300, 300],
      ceremonyDurations: [60, 60, 60],
    });

    const ceremonyExpansion = buildExpansionReply(3);
    const morningExpansion = buildExpansionReply(3);
    const gemma = buildGemma(outlineReply, [morningExpansion, ceremonyExpansion]);

    prisma.dayBlueprintDay.findUnique.mockResolvedValue(BASE_DAY);
    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ id: 34, generation_mode: 'NORMAL' });
    prisma.dayBlueprintVersion.update.mockResolvedValue({ id: 34, generation_mode: 'AI' });
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 90 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 90 });
    tx.dayBlueprintMoment.deleteMany.mockResolvedValue({ count: 0 });
    tx.dayBlueprintActivity.update.mockResolvedValue({ id: 102 });
    tx.dayBlueprintMoment.create.mockImplementation((args: any) =>
      Promise.resolve({ id: Math.floor(Math.random() * 1e6), ...args.data }),
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
      SKILLS() as never,
      buildDensity() as never,
      runLoggerFactory as never,
    );

    await service.generateDay(34, 12, { mode: 'AI' });

    const ceremonyMomentDurations = (tx.dayBlueprintMoment.create as jest.Mock).mock.calls
      .map((call) => call[0].data)
      .filter((data) => data.day_blueprint_activity_id === 102)
      .map((data) => data.duration_seconds);
    expect(ceremonyMomentDurations).toHaveLength(3);
    expect(ceremonyMomentDurations.reduce((a: number, b: number) => a + b, 0)).toBe(900);
  });

  it('hard-fails when a Phase 2 expansion returns a moment with no subject_actions', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = buildAiEventsMock();
    const runLoggerFactory = { create: jest.fn().mockReturnValue(RUN_LOGGER()) };

    const outlineReply = buildOutlineReply({
      morningDurations: [300, 300, 300],
      ceremonyDurations: [300, 300, 300],
    });
    const morningExpansion = buildExpansionReply(3);
    const brokenCeremonyExpansion = JSON.stringify({
      moments: [
        { description: 'ok', subject_actions: [{ subject_role: 'Bride', action_text: 'walks' }] },
        { description: 'broken', subject_actions: [] },
        { description: 'ok', subject_actions: [{ subject_role: 'Groom', action_text: 'waits' }] },
      ],
    });
    const gemma = buildGemma(outlineReply, [morningExpansion, brokenCeremonyExpansion]);

    prisma.dayBlueprintDay.findUnique.mockResolvedValue(BASE_DAY);
    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ id: 34, generation_mode: 'NORMAL' });
    prisma.dayBlueprintVersion.update.mockResolvedValue({ id: 34, generation_mode: 'AI' });
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 91 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 91 });

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

    await expect(service.generateDay(34, 12, { mode: 'AI' })).rejects.toThrow(/Expansion validation failed/);
    expect(prisma.dayBlueprintAiRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });

  it('runs Phase 2 expansions in parallel via Promise.all', async () => {
    const tx = buildTx();
    const prisma = buildPrisma(tx);
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = buildAiEventsMock();
    const runLoggerFactory = { create: jest.fn().mockReturnValue(RUN_LOGGER()) };

    const outlineReply = buildOutlineReply({
      morningDurations: [300, 300, 300],
      ceremonyDurations: [300, 300, 300],
    });
    const morningExpansion = buildExpansionReply(3);
    const ceremonyExpansion = buildExpansionReply(3);
    const gemma = buildGemma(outlineReply, [morningExpansion, ceremonyExpansion]);

    prisma.dayBlueprintDay.findUnique.mockResolvedValue(BASE_DAY);
    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ id: 34, generation_mode: 'NORMAL' });
    prisma.dayBlueprintVersion.update.mockResolvedValue({ id: 34, generation_mode: 'AI' });
    prisma.dayBlueprintAiRun.create.mockResolvedValue({ id: 92 });
    prisma.dayBlueprintAiRun.update.mockResolvedValue({ id: 92 });
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
    tx.dayBlueprintActivityLocation.findFirst.mockResolvedValue({ day_blueprint_location_role_id: 10 });
    tx.dayBlueprintSpaceSlot.findFirst.mockResolvedValue({ id: 501 });

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

    await service.generateDay(34, 12, { mode: 'AI' });

    expect(gemma.chat).toHaveBeenCalledTimes(2);
    expect(gemma.inFlight.peak).toBe(2);
  });
});
