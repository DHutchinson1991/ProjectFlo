import { Test, TestingModule } from '@nestjs/testing';
import { InquiryLifecycleService } from './inquiry-lifecycle.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProjectPackageCloneService } from '../../projects/project-package-clone.service';
import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';

describe('InquiryLifecycleService', () => {
  let service: InquiryLifecycleService;
  let clientsCreate: jest.Mock;
  let clientsFindUnique: jest.Mock;

  const inquiry = {
    id: 42,
    status: 'Active',
    contact_id: 7,
    contact: { first_name: 'Alex', last_name: 'Smith', brand_id: 1 },
    event_category: 'Wedding',
    wedding_date: new Date('2026-08-01'),
    guest_count: '100',
    notes: null,
    portal_token: 'token-abc',
    source_package_id: null,
    selected_package_id: null,
    package_contents_snapshot: null,
  };

  const existingClient = { id: 99, contact_id: 7, inquiry_id: 10 };

  beforeEach(async () => {
    clientsCreate = jest.fn();
    clientsFindUnique = jest.fn();

    const prismaTx = {
      inquiries: {
        findFirst: jest.fn().mockResolvedValue(inquiry),
        update: jest.fn().mockResolvedValue(inquiry),
      },
      clients: {
        findUnique: clientsFindUnique,
        create: clientsCreate,
      },
      projects: {
        create: jest.fn().mockResolvedValue({ id: 501 }),
      },
      projectEventDay: { count: jest.fn().mockResolvedValue(0) },
      proposals: { updateMany: jest.fn() },
      estimates: { updateMany: jest.fn() },
      quotes: { updateMany: jest.fn() },
      invoices: { updateMany: jest.fn() },
      contracts: { updateMany: jest.fn() },
      inquiry_tasks: { updateMany: jest.fn() },
      contacts: { update: jest.fn() },
    };

    const prisma = {
      $transaction: jest.fn((fn) => fn(prismaTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryLifecycleService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ProjectPackageCloneService,
          useValue: { clonePackageToProject: jest.fn() },
        },
        {
          provide: InquiryScheduleSnapshotService,
          useValue: { transferScheduleOwnership: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(InquiryLifecycleService);
  });

  it('reuses an existing client for the same contact instead of creating a duplicate', async () => {
    clientsFindUnique.mockResolvedValue(existingClient);

    const result = await service.convertInquiryToProject(42, 1);

    expect(clientsFindUnique).toHaveBeenCalledWith({ where: { contact_id: 7 } });
    expect(clientsCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ projectId: 501 });
  });

  it('creates a client when none exists for the contact', async () => {
    clientsFindUnique.mockResolvedValue(null);
    clientsCreate.mockResolvedValue({ id: 100, contact_id: 7, inquiry_id: 42 });

    await service.convertInquiryToProject(42, 1);

    expect(clientsCreate).toHaveBeenCalledWith({
      data: { contact_id: 7, inquiry_id: 42 },
    });
  });
});
