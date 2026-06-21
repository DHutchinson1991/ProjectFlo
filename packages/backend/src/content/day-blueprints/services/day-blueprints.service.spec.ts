import { DayBlueprintsService } from './day-blueprints.service';

describe('DayBlueprintsService.cloneFromBlueprint', () => {
  it('clones a source blueprint into a new draft with NORMAL mode', async () => {
    const prisma = {
      dayBlueprint: {
        findFirst: jest.fn(),
      },
      dayBlueprintVersion: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    const defaults = { seedInitialVersionDefaults: jest.fn() } as any;
    const versionCopy = { copyVersionStructure: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new DayBlueprintsService(prisma, defaults, versionCopy);

    prisma.dayBlueprint.findFirst.mockResolvedValue({
      id: 10,
      brand_id: 2,
      key: 'seeded-template',
      display_name: 'Seeded Template',
      event_category: 'Wedding',
      description: null,
      icon: null,
      color: null,
      variant_tags: null,
      order_index: 0,
      versions: [{ id: 101, version_number: 3, status: 'PUBLISHED' }],
    });
    prisma.dayBlueprintVersion.findUnique.mockResolvedValue({
      id: 101,
      day_blueprint_id: 10,
      version_number: 3,
      subject_roles: [],
      space_slots: [],
      lock_rules: [],
      days: [],
    });

    const tx = {
      dayBlueprint: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 77, key: 'seeded-template-copy-20260512120000' }),
      },
      dayBlueprintVersion: {
        create: jest.fn().mockResolvedValue({ id: 201 }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const result = await service.cloneFromBlueprint(2, 10, { display_name: 'Wedding Copy' });

    expect(result.id).toBe(77);
    expect(tx.dayBlueprintVersion.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        generation_mode: 'NORMAL',
        status: 'DRAFT',
      }),
    }));
    expect(versionCopy.copyVersionStructure).toHaveBeenCalled();
  });
});
