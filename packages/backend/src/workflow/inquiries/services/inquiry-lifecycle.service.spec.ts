import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InquiryLifecycleService } from './inquiry-lifecycle.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProjectPackageCloneService } from '../../projects/project-package-clone.service';
import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';

const buildTx = () => ({
    inquiries: {
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    clients: {
        create: jest.fn(),
    },
    projects: {
        create: jest.fn(),
    },
    service_packages: {
        findUnique: jest.fn(),
    },
    projectEventDay: {
        count: jest.fn(),
    },
    proposals: { updateMany: jest.fn() },
    estimates: { updateMany: jest.fn() },
    quotes: { updateMany: jest.fn() },
    invoices: { updateMany: jest.fn() },
    contracts: { updateMany: jest.fn() },
    inquiry_tasks: { updateMany: jest.fn() },
    contacts: { update: jest.fn() },
});

describe('InquiryLifecycleService', () => {
    let service: InquiryLifecycleService;
    let prisma: { $transaction: jest.Mock };
    let tx: ReturnType<typeof buildTx>;
    let packageCloneService: { clonePackageToProject: jest.Mock };
    let snapshotService: { transferScheduleOwnership: jest.Mock };

    beforeEach(async () => {
        tx = buildTx();
        prisma = {
            $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
        };
        packageCloneService = {
            clonePackageToProject: jest.fn().mockResolvedValue({
                event_days_created: 1,
                activities_created: 2,
                films_created: 0,
                crew_slots_created: 3,
            }),
        };
        snapshotService = {
            transferScheduleOwnership: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryLifecycleService,
                { provide: PrismaService, useValue: prisma },
                { provide: ProjectPackageCloneService, useValue: packageCloneService },
                { provide: InquiryScheduleSnapshotService, useValue: snapshotService },
            ],
        }).compile();

        service = module.get(InquiryLifecycleService);
    });

    it('uses event_category in project name instead of always assuming wedding', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 1,
            status: 'Active',
            contact_id: 5,
            contact: { first_name: 'Sam', last_name: 'Lee', brand_id: 1 },
            event_category: 'Corporate Gala',
            wedding_date: new Date('2026-10-01'),
            source_package_id: null,
            selected_package_id: null,
            package_contents_snapshot: null,
            notes: null,
            guest_count: null,
            portal_token: 'token',
        });
        tx.clients.create.mockResolvedValue({ id: 50 });
        tx.projects.create.mockImplementation(({ data }) => Promise.resolve({ id: 60, ...data }));
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        await service.convertInquiryToProject(1, 1);

        expect(tx.projects.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    project_name: "Sam & Lee's Corporate Gala",
                    event_category: 'Corporate Gala',
                }),
            }),
        );
    });

    it('builds snapshot from source_package_id when selected_package_id is absent', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 2,
            status: 'Active',
            contact_id: 6,
            contact: { first_name: 'Jamie', last_name: 'Fox', brand_id: 1 },
            event_category: null,
            wedding_date: new Date('2026-11-01'),
            source_package_id: 77,
            selected_package_id: null,
            package_contents_snapshot: null,
            notes: null,
            guest_count: null,
            portal_token: null,
        });
        tx.clients.create.mockResolvedValue({ id: 51 });
        tx.service_packages.findUnique.mockResolvedValue({
            id: 77,
            name: 'Gold Package',
            currency: 'GBP',
            contents: { films: 2 },
            source_day_blueprint_id: 10,
            source_day_blueprint_version_id: 20,
            source_day_blueprint: { id: 10, key: 'wedding', display_name: 'Wedding Day' },
            source_day_blueprint_version: { id: 20, version_number: 1 },
        });
        tx.projects.create.mockImplementation(({ data }) => Promise.resolve({ id: 61, ...data }));
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        await service.convertInquiryToProject(2, 1);

        expect(tx.service_packages.findUnique).toHaveBeenCalledWith({
            where: { id: 77 },
            select: expect.any(Object),
        });
        expect(tx.projects.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    source_package_id: 77,
                    package_contents_snapshot: expect.objectContaining({
                        package_id: 77,
                        package_name: 'Gold Package',
                    }),
                }),
            }),
        );
    });

    it('rejects conversion when inquiry is already booked', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 3,
            status: 'Booked',
            contact: { brand_id: 1 },
        });

        await expect(service.convertInquiryToProject(3, 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when inquiry is not found', async () => {
        tx.inquiries.findFirst.mockResolvedValue(null);

        await expect(service.convertInquiryToProject(99, 1)).rejects.toBeInstanceOf(NotFoundException);
    });
});
