import { Test, TestingModule } from '@nestjs/testing';
import { InquiryPackageCreator } from './inquiry-package-creator.service';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { DayBlueprintSnapshotService } from '../../../../content/day-blueprints/services';
import { PackageCreationPipelineService } from '../package-creation-pipeline.service';
import { BrandCurrencyResolver } from '../shared/brand-currency.resolver';
import { PackageCreationRunLogger } from '../run/package-creation-run-logger';

describe('InquiryPackageCreator', () => {
  let service: InquiryPackageCreator;
  let packageActivityCreate: jest.Mock;

  const template = {
    id: 1,
    event_category: 'Wedding',
    days: [
      {
        id: 10,
        order_index: 0,
        event_day_template: {
          id: 20,
          name: 'Wedding Day',
          activity_presets: [
            { id: 100, name: 'Ceremony', default_duration_minutes: 60 },
          ],
        },
      },
    ],
    subjects: [],
  };

  beforeEach(async () => {
    packageActivityCreate = jest.fn().mockResolvedValue({ id: 1 });

    const tx = {
      service_packages: {
        create: jest.fn().mockResolvedValue({ id: 500, name: 'Custom Package', contents: {} }),
        update: jest.fn(),
      },
      packageEventDay: {
        create: jest.fn().mockResolvedValue({ id: 600 }),
      },
      packageActivity: {
        create: packageActivityCreate,
        findMany: jest.fn().mockResolvedValue([]),
      },
      packageLocationSlot: { create: jest.fn() },
      locationActivityAssignment: { createMany: jest.fn() },
      packageSpaceSlot: { create: jest.fn() },
      spaceActivityAssignment: { create: jest.fn() },
      packageCrewSlot: {
        create: jest.fn().mockResolvedValue({ id: 700 }),
      },
      equipment: { findMany: jest.fn().mockResolvedValue([]) },
      packageCrewSlotEquipment: { create: jest.fn() },
    };

    const prisma = {
      packageTemplate: {
        findUnique: jest.fn().mockResolvedValue(template),
      },
      job_roles: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, name: 'videographer' }),
      },
      dayBlueprintVersion: {
        findUnique: jest.fn().mockResolvedValue({ days: [{ id: 1 }] }),
      },
      $transaction: jest.fn((fn) => fn(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryPackageCreator,
        { provide: PrismaService, useValue: prisma },
        {
          provide: DayBlueprintSnapshotService,
          useValue: {
            consumeIntoPackage: jest.fn().mockResolvedValue({
              activitiesCreated: 2,
              momentsCreated: 3,
              actionsCreated: 4,
            }),
          },
        },
        {
          provide: PackageCreationPipelineService,
          useValue: { run: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: BrandCurrencyResolver,
          useValue: { resolve: jest.fn().mockResolvedValue('GBP') },
        },
      ],
    }).compile();

    service = module.get(InquiryPackageCreator);
  });

  it('skips preset activities when a day blueprint version is provided', async () => {
    const runLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      attachPackage: jest.fn(),
      writeBuilderSummary: jest.fn(),
    } as unknown as PackageCreationRunLogger;

    await service.create(
      1,
      {
        packageTemplateId: 1,
        crewCount: 1,
        cameraCount: 1,
        selectedActivityPresetIds: [100],
        filmPreferences: [],
        sourceDayBlueprintVersionId: 999,
      },
      runLogger,
    );

    expect(packageActivityCreate).not.toHaveBeenCalled();
  });
});
