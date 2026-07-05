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
    clients: { create: jest.fn() },
    projects: { create: jest.fn() },
    projectEventDay: { count: jest.fn() },
    service_packages: { findUnique: jest.fn() },
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

    const baseInquiry = (overrides: Record<string, unknown> = {}) => ({
        id: 1,
        status: 'Qualified',
        contact_id: 10,
        wedding_date: new Date('2026-07-15'),
        notes: 'VIP',
        guest_count: '120-150',
        portal_token: 'token-abc',
        source_package_id: null,
        selected_package_id: 42,
        package_contents_snapshot: null,
        event_category: 'Birthday',
        contact: { first_name: 'Alex', last_name: 'Taylor', brand_id: 1 },
        ...overrides,
    });

    it('rejects conversion when inquiry is already booked', async () => {
        tx.inquiries.findFirst.mockResolvedValue(baseInquiry({ status: 'Booked' }));

        await expect(service.convertInquiryToProject(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('rejects conversion when inquiry is missing for brand', async () => {
        tx.inquiries.findFirst.mockResolvedValue(null);

        await expect(service.convertInquiryToProject(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('uses event_category for project name and source_package_id for snapshot fallback', async () => {
        tx.inquiries.findFirst.mockResolvedValue(
            baseInquiry({
                source_package_id: 99,
                selected_package_id: 42,
                event_category: 'Corporate',
            }),
        );
        tx.clients.create.mockResolvedValue({ id: 50 });
        tx.projects.create.mockResolvedValue({ id: 60 });
        tx.projectEventDay.count.mockResolvedValue(0);
        tx.service_packages.findUnique.mockResolvedValue({
            id: 99,
            name: 'Corp Package',
            currency: 'GBP',
            contents: { items: [] },
            source_day_blueprint_id: null,
            source_day_blueprint_version_id: null,
            source_day_blueprint: null,
            source_day_blueprint_version: null,
        });
        packageCloneService.clonePackageToProject.mockResolvedValue({
            event_days_created: 1,
            activities_created: 2,
            films_created: 0,
            crew_slots_created: 3,
        });

        const result = await service.convertInquiryToProject(1, 1);

        expect(result).toEqual({ projectId: 60 });
        expect(tx.service_packages.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 99 } }),
        );
        expect(tx.projects.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    project_name: "Alex & Taylor's Corporate",
                    source_package_id: 99,
                    event_category: 'Corporate',
                }),
            }),
        );
        expect(packageCloneService.clonePackageToProject).toHaveBeenCalledWith(
            60,
            42,
            tx,
            { guestCount: 135 },
        );
        expect(tx.inquiries.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: 'Booked', portal_token: null }),
            }),
        );
        expect(tx.contacts.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { type: 'Client' } }),
        );
    });

    it('transfers schedule ownership instead of cloning when schedule data exists', async () => {
        tx.inquiries.findFirst.mockResolvedValue(baseInquiry());
        tx.clients.create.mockResolvedValue({ id: 51 });
        tx.projects.create.mockResolvedValue({ id: 61 });
        tx.projectEventDay.count.mockResolvedValue(2);

        await service.convertInquiryToProject(1, 1);

        expect(snapshotService.transferScheduleOwnership).toHaveBeenCalledWith(1, 61, tx);
        expect(packageCloneService.clonePackageToProject).not.toHaveBeenCalled();
    });
});
