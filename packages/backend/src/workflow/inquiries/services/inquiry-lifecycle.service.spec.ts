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

const buildPrisma = (tx: ReturnType<typeof buildPrismaTx>) => ({
    $transaction: jest.fn((fn) => fn(tx)),
});

describe('InquiryLifecycleService', () => {
    let service: InquiryLifecycleService;
    let prisma: ReturnType<typeof buildPrisma>;
    let tx: ReturnType<typeof buildPrismaTx>;
    let packageCloneService: { clonePackageToProject: jest.Mock };
    let snapshotService: { transferScheduleOwnership: jest.Mock };

    const baseInquiry = (overrides: Record<string, unknown> = {}) => ({
        id: 10,
        status: 'Active',
        contact_id: 5,
        wedding_date: new Date('2026-09-01'),
        notes: 'VIP',
        guest_count: '100-150',
        portal_token: 'token-abc',
        event_category: 'Birthday',
        source_package_id: null,
        selected_package_id: 20,
        package_contents_snapshot: null,
        contact: { first_name: 'Jamie', last_name: 'Lee', brand_id: 1 },
        ...overrides,
    });

    beforeEach(async () => {
        tx = buildPrismaTx();
        prisma = buildPrisma(tx);
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

        service = module.get<InquiryLifecycleService>(InquiryLifecycleService);
    });

    describe('convertInquiryToProject', () => {
        it('throws NotFoundException when inquiry is missing', async () => {
            tx.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.convertInquiryToProject(10, 1)).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException when inquiry is already booked', async () => {
            tx.inquiries.findFirst.mockResolvedValue(baseInquiry({ status: 'Booked' }));
            await expect(service.convertInquiryToProject(10, 1)).rejects.toThrow(BadRequestException);
        });

        it('creates project with event-specific name and clones package when no schedule exists', async () => {
            tx.inquiries.findFirst.mockResolvedValue(baseInquiry());
            tx.clients.create.mockResolvedValue({ id: 50 });
            tx.projects.create.mockResolvedValue({ id: 60 });
            tx.projectEventDay.count.mockResolvedValue(0);
            packageCloneService.clonePackageToProject.mockResolvedValue({
                event_days_created: 1,
                activities_created: 5,
                films_created: 2,
                crew_slots_created: 3,
            });

            const result = await service.convertInquiryToProject(10, 1);

            expect(result).toEqual({ projectId: 60 });
            expect(tx.projects.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        project_name: "Jamie & Lee's Birthday",
                        event_category: 'Birthday',
                        source_package_id: 20,
                        portal_token: 'token-abc',
                    }),
                }),
            );
            expect(packageCloneService.clonePackageToProject).toHaveBeenCalledWith(
                60,
                20,
                tx,
                { guestCount: 125 },
            );
            expect(tx.inquiries.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { status: 'Booked', archived_at: expect.any(Date), portal_token: null },
            });
            expect(tx.contacts.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: { type: 'Client' },
            });
        });

        it('transfers existing schedule instead of cloning package', async () => {
            tx.inquiries.findFirst.mockResolvedValue(baseInquiry({ selected_package_id: 20 }));
            tx.clients.create.mockResolvedValue({ id: 50 });
            tx.projects.create.mockResolvedValue({ id: 60 });
            tx.projectEventDay.count.mockResolvedValue(2);

            await service.convertInquiryToProject(10, 1);

            expect(snapshotService.transferScheduleOwnership).toHaveBeenCalledWith(10, 60, tx);
            expect(packageCloneService.clonePackageToProject).not.toHaveBeenCalled();
        });

        it('builds snapshot from selected package when inquiry has no stored snapshot', async () => {
            tx.inquiries.findFirst.mockResolvedValue(baseInquiry({ selected_package_id: 20 }));
            tx.clients.create.mockResolvedValue({ id: 50 });
            tx.projects.create.mockResolvedValue({ id: 60 });
            tx.projectEventDay.count.mockResolvedValue(0);
            tx.service_packages.findUnique.mockResolvedValue({
                id: 20,
                name: 'Premium',
                currency: 'GBP',
                contents: { days: 1 },
                source_day_blueprint_id: 9,
                source_day_blueprint_version_id: 4,
                source_day_blueprint: { id: 9, key: 'wedding-day', display_name: 'Wedding Day' },
                source_day_blueprint_version: { id: 4, version_number: 2 },
            });
            packageCloneService.clonePackageToProject.mockResolvedValue({
                event_days_created: 0,
                activities_created: 0,
                films_created: 0,
                crew_slots_created: 0,
            });

            await service.convertInquiryToProject(10, 1);

            expect(tx.projects.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        package_contents_snapshot: expect.objectContaining({
                            package_id: 20,
                            source_day_blueprint_id: 9,
                            source_day_blueprint_version_id: 4,
                        }),
                    }),
                }),
            );
        });

        it('defaults project category to Wedding when event_category is absent', async () => {
            tx.inquiries.findFirst.mockResolvedValue(
                baseInquiry({ event_category: null, contact: { first_name: 'Alex', last_name: null, brand_id: 1 } }),
            );
            tx.clients.create.mockResolvedValue({ id: 50 });
            tx.projects.create.mockResolvedValue({ id: 60 });
            tx.projectEventDay.count.mockResolvedValue(1);

            await service.convertInquiryToProject(10, 1);

            expect(tx.projects.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        project_name: "Alex's Wedding",
                    }),
                }),
            );
        });
    });
});
