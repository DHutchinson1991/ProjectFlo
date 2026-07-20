import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InquiryLifecycleService } from './inquiry-lifecycle.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProjectPackageCloneService } from '../../projects/project-package-clone.service';
import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';

const buildPrismaTx = () => ({
    inquiries: {
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    clients: {
        create: jest.fn(),
    },
    service_packages: {
        findUnique: jest.fn(),
    },
    projects: {
        create: jest.fn(),
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
    let tx: ReturnType<typeof buildPrismaTx>;
    let packageCloneService: { clonePackageToProject: jest.Mock };
    let snapshotService: { transferScheduleOwnership: jest.Mock };

    beforeEach(async () => {
        tx = buildPrismaTx();
        prisma = {
            $transaction: jest.fn((fn) => fn(tx)),
        };
        packageCloneService = {
            clonePackageToProject: jest.fn().mockResolvedValue({
                event_days_created: 1,
                activities_created: 2,
                films_created: 1,
                crew_slots_created: 3,
            }),
        };
        snapshotService = {
            transferScheduleOwnership: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryLifecycleService,
                { provide: PrismaService, useValue: prisma },
                { provide: ProjectPackageCloneService, useValue: packageCloneService },
                { provide: InquiryScheduleSnapshotService, useValue: snapshotService },
            ],
        }).compile();

        service = module.get<InquiryLifecycleService>(InquiryLifecycleService);
    });

    it('throws NotFoundException when inquiry is missing', async () => {
        tx.inquiries.findFirst.mockResolvedValue(null);

        await expect(service.convertInquiryToProject(1, 10)).rejects.toThrow(NotFoundException);
    });

    it('rejects conversion when inquiry is already booked', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 1,
            status: 'Booked',
            contact: { brand_id: 10, first_name: 'Alex', last_name: 'Taylor' },
        });

        await expect(service.convertInquiryToProject(1, 10)).rejects.toThrow(BadRequestException);
    });

    it('creates a project using event category in the project name', async () => {
        const inquiry = {
            id: 1,
            status: 'Active',
            contact_id: 20,
            contact: { brand_id: 10, first_name: 'Alex', last_name: 'Taylor' },
            source_package_id: null,
            selected_package_id: null,
            package_contents_snapshot: null,
            event_category: 'Birthday',
            wedding_date: new Date('2026-09-01'),
            notes: 'VIP client',
            guest_count: '80 – 120',
            portal_token: 'portal-token',
        };

        tx.inquiries.findFirst.mockResolvedValue(inquiry);
        tx.clients.create.mockResolvedValue({ id: 30 });
        tx.projects.create.mockImplementation(({ data }) => Promise.resolve({ id: 40, ...data }));
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        const result = await service.convertInquiryToProject(1, 10);

        expect(result).toEqual({ projectId: 40 });
        expect(tx.projects.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    project_name: "Alex & Taylor's Birthday",
                    event_category: 'Birthday',
                    inquiry_id: 1,
                    portal_token: 'portal-token',
                }),
            }),
        );
        expect(packageCloneService.clonePackageToProject).not.toHaveBeenCalled();
        expect(snapshotService.transferScheduleOwnership).not.toHaveBeenCalled();
    });

    it('transfers existing schedule instead of cloning package when inquiry already has event days', async () => {
        const inquiry = {
            id: 1,
            status: 'Active',
            contact_id: 20,
            contact: { brand_id: 10, first_name: 'Jamie', last_name: 'Smith' },
            source_package_id: null,
            selected_package_id: 55,
            package_contents_snapshot: null,
            event_category: 'Wedding',
            wedding_date: new Date('2026-09-01'),
            notes: null,
            guest_count: null,
            portal_token: null,
        };

        tx.inquiries.findFirst.mockResolvedValue(inquiry);
        tx.clients.create.mockResolvedValue({ id: 30 });
        tx.projects.create.mockResolvedValue({ id: 40 });
        tx.projectEventDay.count.mockResolvedValue(2);
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        await service.convertInquiryToProject(1, 10);

        expect(snapshotService.transferScheduleOwnership).toHaveBeenCalledWith(1, 40, tx);
        expect(packageCloneService.clonePackageToProject).not.toHaveBeenCalled();
    });

    it('clones selected package when no schedule exists yet', async () => {
        const inquiry = {
            id: 1,
            status: 'Active',
            contact_id: 20,
            contact: { brand_id: 10, first_name: 'Jamie', last_name: 'Smith' },
            source_package_id: null,
            selected_package_id: 55,
            package_contents_snapshot: null,
            event_category: 'Wedding',
            wedding_date: new Date('2026-09-01'),
            notes: null,
            guest_count: '50 – 150',
            portal_token: null,
        };

        tx.inquiries.findFirst.mockResolvedValue(inquiry);
        tx.clients.create.mockResolvedValue({ id: 30 });
        tx.projects.create.mockResolvedValue({ id: 40 });
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        await service.convertInquiryToProject(1, 10);

        expect(packageCloneService.clonePackageToProject).toHaveBeenCalledWith(
            40,
            55,
            tx,
            { guestCount: 100 },
        );
    });
});
