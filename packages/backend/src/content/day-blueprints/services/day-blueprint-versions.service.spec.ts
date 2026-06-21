import { ExistingDraftVersionException } from '../exceptions/existing-draft-version.exception';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';

describe('DayBlueprintVersionsService.createDraft', () => {
  it('branches from latest published and copies structure', async () => {
    const prisma = {
      dayBlueprint: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, is_system_seeded: false }),
      },
      dayBlueprintVersion: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ version_number: 3 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          day_blueprint_id: 1,
          version_number: 3,
          generation_mode: 'NORMAL',
          subject_roles: [],
          space_slots: [],
          lock_rules: [],
          days: [],
        }),
        delete: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    const guardrails = { assertPublishable: jest.fn() } as any;
    const versionCopy = { copyVersionStructure: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new DayBlueprintVersionsService(prisma, guardrails, versionCopy);

    const draft = { id: 11, version_number: 4, status: 'DRAFT' };
    prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        dayBlueprintVersion: { create: jest.fn().mockResolvedValue(draft) },
      };
      return cb(tx);
    });

    const result = await service.createDraft(2, 1, { source_version_id: 10 });

    expect(result).toEqual(draft);
    expect(versionCopy.copyVersionStructure).toHaveBeenCalled();
  });

  it('throws when a draft exists and replace_existing_draft is false', async () => {
    const prisma = {
      dayBlueprint: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, is_system_seeded: false }),
      },
      dayBlueprintVersion: {
        findFirst: jest.fn().mockResolvedValue({ id: 9, version_number: 4 }),
      },
    } as any;

    const service = new DayBlueprintVersionsService(prisma, {} as any, {} as any);

    await expect(service.createDraft(2, 1, {})).rejects.toBeInstanceOf(ExistingDraftVersionException);
  });
});
