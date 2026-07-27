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
    projectEventDay: {
        count: jest.fn(),
    },
    service_packages: {
        findUnique: jest.fn(),
    },
    proposals: { updateMany: jest.fn() },
    estimates: { updateMany: jest.fn() },
    quotes: { updateMany: jest.fn() },
    invoices: { updateMany: jest.fn() },
    contracts: { updateMany: jest.fn() },
    inquiry_tasks: { updateMany: jest.fn() },
    contacts: { update: jest.fn() },
});

const buildPrisma = (tx: ReturnType<typeof buildTx>) => ({
    $transaction: jest.fn((fn) => fn(tx)),
});

describe('InquiryLifecycleService', () => {
    let service: InquiryLifecycleService;
    let prisma: ReturnType<typeof buildPrisma>;
    let tx: ReturnType<typeof buildTx>;
    let packageCloneService: { clonePackageToProject: jest.Mock };
    let snapshotService: { transferScheduleOwnership: jest.Mock };

    const sampleInquiry = (overrides: Record<string, unknown> = {}) => ({
        id: 12,
        status: 'Qualified',
        contact_id: 30,
        source_package_id: 88,
        selected_package_id: null,
        package_contents_snapshot: null,
        event_category: 'Corporate',
        wedding_date: new Date('2026-09-01'),
        notes: 'VIP client',
        guest_count: '120-150',
        portal_token: 'portal-token',
        contact: { first_name: 'Jamie', last_name: 'Lee', brand_id: 1 },
        ...overrides,
    });

    beforeEach(async () => {
        tx = buildTx();
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
        it('builds project name from event category instead of always using Wedding', async () => {
            tx.inquiries.findFirst.mockResolvedValue(sampleInquiry());
            tx.clients.create.mockResolvedValue({ id: 40 });
            tx.projects.create.mockResolvedValue({ id: 99 });
            tx.projectEventDay.count.mockResolvedValue(0);
            tx.service_packages.findUnique.mockResolvedValue({
                id: 88,
                name: 'Corporate Day',
                currency: 'GBP',
                contents: { items: [] },
                source_day_blueprint_id: null,
                source_day_blueprint_version_id: null,
                source_day_blueprint: null,
                source_day_blueprint_version: null,
            });

            await service.convertInquiryToProject(12, 1);

            expect(tx.projects.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    project_name: "Jamie & Lee's Corporate",
                    source_package_id: 88,
                }),
            });
        });

        it('defaults project category to Wedding when event_category is blank', async () => {
            tx.inquiries.findFirst.mockResolvedValue(
                sampleInquiry({ event_category: '   ', selected_package_id: 5, source_package_id: null }),
            );
            tx.clients.create.mockResolvedValue({ id: 40 });
            tx.projects.create.mockResolvedValue({ id: 99 });
            tx.projectEventDay.count.mockResolvedValue(1);

            await service.convertInquiryToProject(12, 1);

            expect(tx.projects.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ project_name: "Jamie & Lee's Wedding" }),
            });
            expect(snapshotService.transferScheduleOwnership).toHaveBeenCalledWith(12, 99, tx);
        });

        it('builds package snapshot from source_package_id when selected_package_id is absent', async () => {
            tx.inquiries.findFirst.mockResolvedValue(sampleInquiry());
            tx.clients.create.mockResolvedValue({ id: 40 });
            tx.projects.create.mockResolvedValue({ id: 99 });
            tx.projectEventDay.count.mockResolvedValue(0);
            tx.service_packages.findUnique.mockResolvedValue({
                id: 88,
                name: 'Corporate Day',
                currency: 'GBP',
                contents: { items: [{ name: 'Filming' }] },
                source_day_blueprint_id: 7,
                source_day_blueprint_version_id: 9,
                source_day_blueprint: { id: 7, key: 'corp-day', display_name: 'Corporate Day' },
                source_day_blueprint_version: { id: 9, version_number: 2 },
            });

            await service.convertInquiryToProject(12, 1);

            expect(tx.service_packages.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 88 } }),
            );
            expect(tx.projects.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    package_contents_snapshot: expect.objectContaining({
                        package_id: 88,
                        source_day_blueprint_id: 7,
                    }),
                }),
            });
        });

        it('rejects conversion when inquiry is already booked', async () => {
            tx.inquiries.findFirst.mockResolvedValue(sampleInquiry({ status: 'Booked' }));
            await expect(service.convertInquiryToProject(12, 1)).rejects.toThrow(BadRequestException);
        });

        it('throws when inquiry does not exist for brand', async () => {
            tx.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.convertInquiryToProject(12, 1)).rejects.toThrow(NotFoundException);
        });
    });
});
