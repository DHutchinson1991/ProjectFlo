import { DayBlueprintDefaultsService } from './day-blueprint-defaults.service';

const buildPrisma = () => ({
  eventDayActivity: {
    findUnique: jest.fn(),
  },
  subjectRole: {
    findMany: jest.fn(),
  },
  dayBlueprintLocationRole: {
    upsert: jest.fn(),
  },
  dayBlueprintSpaceSlot: {
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  dayBlueprintSubjectRole: {
    createMany: jest.fn(),
  },
  dayBlueprintActivityLocation: {
    createMany: jest.fn(),
  },
});

describe('DayBlueprintDefaultsService', () => {
  it('seeds sandbox defaults and matching wedding subject roles', async () => {
    const prisma = buildPrisma();
    prisma.dayBlueprintLocationRole.upsert.mockResolvedValue({ id: 77, key: 'sandbox' });
    prisma.subjectRole.findMany.mockResolvedValue([
      { id: 1, role_name: 'Bride', is_group: false },
      { id: 2, role_name: 'Groom', is_group: false },
      { id: 3, role_name: 'Maid of Honor', is_group: false },
      { id: 4, role_name: 'Guests', is_group: true },
      { id: 5, role_name: 'Random Role', is_group: false },
    ]);
    prisma.dayBlueprintSubjectRole.createMany.mockResolvedValue({ count: 4 });

    const service = new DayBlueprintDefaultsService(prisma as never);

    await service.seedInitialVersionDefaults(prisma as never, {
      brandId: 12,
      versionId: 34,
      eventCategory: 'Wedding',
    });

    expect(prisma.dayBlueprintLocationRole.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          brand_id_key: {
            brand_id: 12,
            key: 'sandbox',
          },
        },
      }),
    );
    expect(prisma.dayBlueprintSpaceSlot.create).not.toHaveBeenCalled();
    expect(prisma.dayBlueprintSubjectRole.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ subject_role_id: 1, is_primary: true, typical_count: 1, order_index: 0 }),
        expect.objectContaining({ subject_role_id: 2, is_primary: true, typical_count: 1, order_index: 1 }),
        expect.objectContaining({ subject_role_id: 3, is_primary: false, typical_count: 1, order_index: 3 }),
        expect.objectContaining({ subject_role_id: 4, is_primary: false, typical_count: 100, order_index: 12 }),
      ]),
      skipDuplicates: true,
    });
  });

  it('does not seed wedding subject roles for non-wedding categories', async () => {
    const prisma = buildPrisma();
    prisma.dayBlueprintLocationRole.upsert.mockResolvedValue({ id: 77, key: 'sandbox' });

    const service = new DayBlueprintDefaultsService(prisma as never);

    await service.seedInitialVersionDefaults(prisma as never, {
      brandId: 12,
      versionId: 34,
      eventCategory: 'Birthday',
    });

    expect(prisma.subjectRole.findMany).not.toHaveBeenCalled();
    expect(prisma.dayBlueprintSubjectRole.createMany).not.toHaveBeenCalled();
  });

  it('creates a shared location role and space slot from the source activity label', async () => {
    const prisma = buildPrisma();
    prisma.eventDayActivity.findUnique.mockResolvedValue({ location_label: 'Bridal Suite' });
    prisma.dayBlueprintLocationRole.upsert.mockResolvedValue({ id: 77, key: 'bridal_suite' });
    prisma.dayBlueprintSpaceSlot.findFirst.mockResolvedValue(null);
    prisma.dayBlueprintSpaceSlot.count.mockResolvedValue(0);
    prisma.dayBlueprintSpaceSlot.create.mockResolvedValue({ id: 88 });
    prisma.dayBlueprintActivityLocation.createMany.mockResolvedValue({ count: 1 });

    const service = new DayBlueprintDefaultsService(prisma as never);

    await service.ensureActivityLocationDefaults(prisma as never, {
      brandId: 12,
      versionId: 34,
      activityId: 56,
      activityName: 'Bridal Prep',
      sourceEventDayActivityId: 99,
    });

    expect(prisma.dayBlueprintLocationRole.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          brand_id_key: {
            brand_id: 12,
            key: 'bridal_suite',
          },
        },
      }),
    );
    expect(prisma.dayBlueprintSpaceSlot.create).toHaveBeenCalledWith({
      data: {
        day_blueprint_version_id: 34,
        day_blueprint_location_role_id: 77,
        key: 'bridal_suite',
        label: 'Bridal Suite',
        description: 'Default placement canvas for Bridal Suite.',
        order_index: 0,
      },
    });
    expect(prisma.dayBlueprintActivityLocation.createMany).toHaveBeenCalledWith({
      data: [
        {
          day_blueprint_activity_id: 56,
          day_blueprint_location_role_id: 77,
          is_primary: true,
          order_index: 0,
        },
      ],
      skipDuplicates: true,
    });
  });

  it('creates an activity-specific sandbox slot when no source label exists', async () => {
    const prisma = buildPrisma();
    prisma.dayBlueprintLocationRole.upsert.mockResolvedValue({ id: 77, key: 'sandbox' });
    prisma.dayBlueprintSpaceSlot.findFirst.mockResolvedValue(null);
    prisma.dayBlueprintSpaceSlot.count.mockResolvedValue(0);
    prisma.dayBlueprintSpaceSlot.create.mockResolvedValue({ id: 88 });
    prisma.dayBlueprintActivityLocation.createMany.mockResolvedValue({ count: 1 });

    const service = new DayBlueprintDefaultsService(prisma as never);

    await service.ensureActivityLocationDefaults(prisma as never, {
      brandId: 12,
      versionId: 34,
      activityId: 56,
      activityName: 'Morning Preparation',
    });

    expect(prisma.dayBlueprintSpaceSlot.create).toHaveBeenCalledWith({
      data: {
        day_blueprint_version_id: 34,
        day_blueprint_location_role_id: 77,
        key: 'morning_preparation_space',
        label: 'Morning Preparation Space',
        description: 'Default sandbox canvas for Morning Preparation.',
        order_index: 0,
      },
    });
  });
});