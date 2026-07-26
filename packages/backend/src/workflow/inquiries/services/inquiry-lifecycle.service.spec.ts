import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InquiryLifecycleService } from './inquiry-lifecycle.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProjectPackageCloneService } from '../../projects/project-package-clone.service';
import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';

const buildTransactionPrisma = () => ({
    inquiries: {
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    clients: { create: jest.fn() },
    service_packages: { findUnique: jest.fn() },
    projects: { create: jest.fn() },
    projectEventDay: { count: jest.fn() },
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
    let tx: ReturnType<typeof buildTransactionPrisma>;
    let packageCloneService: { clonePackageToProject: jest.Mock };
    let snapshotService: { transferScheduleOwnership: jest.Mock };

    beforeEach(async () => {
        tx = buildTransactionPrisma();
        prisma = {
            $transaction: jest.fn(async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx)),
        };
        packageCloneService = { clonePackageToProject: jest.fn() };
        snapshotService = { transferScheduleOwnership: jest.fn() };

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

    it('throws NotFoundException when inquiry is missing or archived', async () => {
        tx.inquiries.findFirst.mockResolvedValue(null);

        await expect(service.convertInquiryToProject(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when inquiry is already Booked', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 1,
            status: 'Booked',
            contact_id: 5,
            contact: { first_name: 'Alex', last_name: 'Lee', brand_id: 1 },
        });

        await expect(service.convertInquiryToProject(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('builds project name from contact and event_category instead of always assuming Wedding', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 1,
            status: 'Active',
            contact_id: 5,
            contact: { first_name: 'Alex', last_name: 'Lee', brand_id: 1 },
            event_category: 'Corporate Gala',
            wedding_date: new Date('2026-09-01'),
            source_package_id: null,
            selected_package_id: null,
            package_contents_snapshot: null,
            notes: null,
            guest_count: null,
            portal_token: 'tok',
        });
        tx.clients.create.mockResolvedValue({ id: 20 });
        tx.projects.create.mockResolvedValue({ id: 30 });
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.proposals.updateMany.mockResolvedValue({ count: 0 });
        tx.estimates.updateMany.mockResolvedValue({ count: 0 });
        tx.quotes.updateMany.mockResolvedValue({ count: 0 });
        tx.invoices.updateMany.mockResolvedValue({ count: 0 });
        tx.contracts.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiry_tasks.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        const result = await service.convertInquiryToProject(1, 1);

        expect(result).toEqual({ projectId: 30 });
        expect(tx.projects.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    project_name: "Alex & Lee's Corporate Gala",
                    event_category: 'Corporate Gala',
                }),
            }),
        );
        expect(packageCloneService.clonePackageToProject).not.toHaveBeenCalled();
    });

    it('clones selected package when no schedule data exists on the inquiry', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 1,
            status: 'Active',
            contact_id: 5,
            contact: { first_name: 'Sam', last_name: 'Taylor', brand_id: 1 },
            event_category: null,
            wedding_date: new Date('2026-09-01'),
            source_package_id: null,
            selected_package_id: 42,
            package_contents_snapshot: null,
            notes: null,
            guest_count: '50 – 150',
            portal_token: 'tok',
        });
        tx.clients.create.mockResolvedValue({ id: 20 });
        tx.projects.create.mockResolvedValue({ id: 30 });
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.proposals.updateMany.mockResolvedValue({ count: 0 });
        tx.estimates.updateMany.mockResolvedValue({ count: 0 });
        tx.quotes.updateMany.mockResolvedValue({ count: 0 });
        tx.invoices.updateMany.mockResolvedValue({ count: 0 });
        tx.contracts.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiry_tasks.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});
        packageCloneService.clonePackageToProject.mockResolvedValue({
            event_days_created: 1,
            activities_created: 5,
            films_created: 2,
            crew_slots_created: 3,
        });

        await service.convertInquiryToProject(1, 1);

        expect(packageCloneService.clonePackageToProject).toHaveBeenCalledWith(
            30,
            42,
            tx,
            { guestCount: 100 },
        );
        expect(snapshotService.transferScheduleOwnership).not.toHaveBeenCalled();
    });

    it('prefers source_package_id over selected_package_id when building package snapshot', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 1,
            status: 'Active',
            contact_id: 5,
            contact: { first_name: 'Jamie', last_name: 'Fox', brand_id: 1 },
            event_category: 'Wedding',
            wedding_date: new Date('2026-09-01'),
            source_package_id: 99,
            selected_package_id: null,
            package_contents_snapshot: null,
            notes: null,
            guest_count: null,
            portal_token: 'tok',
        });
        tx.clients.create.mockResolvedValue({ id: 20 });
        tx.projects.create.mockResolvedValue({ id: 30 });
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.service_packages.findUnique.mockResolvedValue({
            id: 99,
            name: 'Source Package',
            currency: 'USD',
            contents: {},
            source_day_blueprint_id: 10,
            source_day_blueprint_version_id: 20,
            source_day_blueprint: { id: 10, key: 'wedding', display_name: 'Wedding Day' },
            source_day_blueprint_version: { id: 20, version_number: 2 },
        });
        tx.proposals.updateMany.mockResolvedValue({ count: 0 });
        tx.estimates.updateMany.mockResolvedValue({ count: 0 });
        tx.quotes.updateMany.mockResolvedValue({ count: 0 });
        tx.invoices.updateMany.mockResolvedValue({ count: 0 });
        tx.contracts.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiry_tasks.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        await service.convertInquiryToProject(1, 1);

        expect(tx.service_packages.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 99 } }),
        );
        expect(tx.projects.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    source_package_id: 99,
                    package_contents_snapshot: expect.objectContaining({
                        source_day_blueprint_id: 10,
                    }),
                }),
            }),
        );
    });

    it('transfers schedule ownership instead of cloning when inquiry already has event days', async () => {
        tx.inquiries.findFirst.mockResolvedValue({
            id: 1,
            status: 'Active',
            contact_id: 5,
            contact: { first_name: 'Sam', last_name: 'Taylor', brand_id: 1 },
            event_category: 'Wedding',
            wedding_date: new Date('2026-09-01'),
            source_package_id: null,
            selected_package_id: 42,
            package_contents_snapshot: null,
            notes: null,
            guest_count: null,
            portal_token: 'tok',
        });
        tx.clients.create.mockResolvedValue({ id: 20 });
        tx.projects.create.mockResolvedValue({ id: 30 });
        tx.projectEventDay.count.mockResolvedValue(2);
        tx.proposals.updateMany.mockResolvedValue({ count: 0 });
        tx.estimates.updateMany.mockResolvedValue({ count: 0 });
        tx.quotes.updateMany.mockResolvedValue({ count: 0 });
        tx.invoices.updateMany.mockResolvedValue({ count: 0 });
        tx.contracts.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiry_tasks.updateMany.mockResolvedValue({ count: 0 });
        tx.inquiries.update.mockResolvedValue({});
        tx.contacts.update.mockResolvedValue({});

        await service.convertInquiryToProject(1, 1);

        expect(snapshotService.transferScheduleOwnership).toHaveBeenCalledWith(1, 30, tx);
        expect(packageCloneService.clonePackageToProject).not.toHaveBeenCalled();
    });
});
