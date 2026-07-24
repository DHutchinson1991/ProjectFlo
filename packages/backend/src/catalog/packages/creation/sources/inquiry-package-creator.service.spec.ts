import { BadRequestException } from '@nestjs/common';
import { InquiryPackageCreator } from './inquiry-package-creator.service';

describe('InquiryPackageCreator blueprint scaffold', () => {
  it('scaffolds one package event day per blueprint day when mappings are omitted', async () => {
    const createdPackageEventDays: Array<{ event_day_template_id: number; order_index: number }> = [];
    const tx = {
      service_packages: {
        create: jest.fn().mockResolvedValue({
          id: 99,
          name: 'Custom Package',
          contents: {},
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      packageEventDay: {
        create: jest.fn().mockImplementation(({ data }) => {
          createdPackageEventDays.push({
            event_day_template_id: data.event_day_template_id,
            order_index: data.order_index,
          });
          return Promise.resolve({
            id: createdPackageEventDays.length,
            event_day_template_id: data.event_day_template_id,
          });
        }),
      },
      eventDay: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementationOnce(({ data }) => Promise.resolve({ id: 501, ...data }))
          .mockImplementationOnce(({ data }) => Promise.resolve({ id: 502, ...data })),
      },
      packageCrewSlot: { create: jest.fn().mockResolvedValue({ id: 1 }) },
      equipment: { findMany: jest.fn().mockResolvedValue([]) },
      packageCrewSlotEquipment: { create: jest.fn() },
    };

    const prisma = {
      packageTemplate: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          event_category: 'WEDDING',
          days: [
            {
              id: 10,
              order_index: 0,
              event_day_template: {
                id: 100,
                name: 'Wedding Day',
                activity_presets: [],
              },
            },
          ],
        }),
      },
      dayBlueprintVersion: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          days: [
            { id: 1, name: 'Ceremony', description: null, order_index: 0 },
            { id: 2, name: 'Reception', description: null, order_index: 1 },
          ],
        }),
      },
      job_roles: {
        findFirst: jest.fn().mockResolvedValue({ id: 3 }),
      },
      $transaction: jest.fn().mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };

    const creator = new InquiryPackageCreator(
      prisma as never,
      { run: jest.fn() } as never,
      { resolve: jest.fn().mockResolvedValue('GBP') } as never,
      { consumeIntoPackage: jest.fn().mockResolvedValue({ activitiesCreated: 1, momentsCreated: 0, actionsCreated: 0, spaceSlotsCreated: 0, subjectsCreated: 0 }) } as never,
    );

    await creator.create(
      42,
      {
        packageTemplateId: 1,
        selectedActivityPresetIds: [],
        crewCount: 1,
        sourceDayBlueprintVersionId: 7,
      } as never,
      { log: jest.fn(), attachPackage: jest.fn(), writeBuilderSummary: jest.fn(), warn: jest.fn() } as never,
    );

    expect(createdPackageEventDays).toHaveLength(2);
    expect(createdPackageEventDays.map((day) => day.order_index)).toEqual([0, 1]);
  });

  it('deletes the package when blueprint consume fails', async () => {
    const tx = {
      service_packages: {
        create: jest.fn().mockResolvedValue({
          id: 99,
          name: 'Custom Package',
          contents: {},
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      packageEventDay: {
        create: jest.fn().mockResolvedValue({ id: 1, event_day_template_id: 100 }),
      },
      eventDay: {
        findFirst: jest.fn().mockResolvedValue({ id: 100 }),
      },
      packageCrewSlot: { create: jest.fn().mockResolvedValue({ id: 1 }) },
      equipment: { findMany: jest.fn().mockResolvedValue([]) },
      packageCrewSlotEquipment: { create: jest.fn() },
    };

    const prisma = {
      packageTemplate: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          event_category: 'WEDDING',
          days: [
            {
              id: 10,
              order_index: 0,
              event_day_template: {
                id: 100,
                name: 'Wedding Day',
                activity_presets: [],
              },
            },
          ],
        }),
      },
      dayBlueprintVersion: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          days: [{ id: 1, name: 'Ceremony', description: null, order_index: 0 }],
        }),
      },
      job_roles: {
        findFirst: jest.fn().mockResolvedValue({ id: 3 }),
      },
      service_packages: {
        delete: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn().mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };

    const creator = new InquiryPackageCreator(
      prisma as never,
      { run: jest.fn() } as never,
      { resolve: jest.fn().mockResolvedValue('GBP') } as never,
      {
        consumeIntoPackage: jest.fn().mockRejectedValue(new Error('mapping mismatch')),
      } as never,
    );

    await expect(
      creator.create(
        42,
        {
          packageTemplateId: 1,
          selectedActivityPresetIds: [],
          crewCount: 1,
          sourceDayBlueprintVersionId: 7,
        } as never,
        { log: jest.fn(), attachPackage: jest.fn(), writeBuilderSummary: jest.fn(), warn: jest.fn() } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.service_packages.delete).toHaveBeenCalledWith({ where: { id: 99 } });
  });
});
