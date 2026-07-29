import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryPackageService } from './inquiry-package.service';
import { InquiryCrudService } from './inquiry-crud.service';

const buildPrisma = () => ({
    contacts: {
        upsert: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
    },
    inquiries: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    calendar_events: {
        findFirst: jest.fn(),
        create: jest.fn(),
    },
    crew: {
        findFirst: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn({
        inquiry_tasks: { deleteMany: jest.fn() },
        inquiries: { update: jest.fn() },
    })),
});

describe('InquiryCrudService', () => {
    let service: InquiryCrudService;
    let prisma: ReturnType<typeof buildPrisma>;
    let packageService: { handlePackageSelection: jest.Mock };
    let inquiryTasksService: {
        generateForInquiry: jest.Mock;
        syncReviewInquiryAutoSubtasks: jest.Mock;
        autoCompleteByName: jest.Mock;
    };

    const baseContact = {
        id: 5,
        first_name: 'Alex',
        last_name: 'Smith',
        email: 'alex@example.com',
        phone_number: null,
    };

    beforeEach(async () => {
        prisma = buildPrisma();
        packageService = { handlePackageSelection: jest.fn() };
        inquiryTasksService = {
            generateForInquiry: jest.fn().mockResolvedValue(undefined),
            syncReviewInquiryAutoSubtasks: jest.fn().mockResolvedValue(undefined),
            autoCompleteByName: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryCrudService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryPackageService, useValue: packageService },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
            ],
        }).compile();

        service = module.get(InquiryCrudService);
    });

    describe('create', () => {
        it('returns warnings when package snapshot creation fails but inquiry is created', async () => {
            prisma.contacts.upsert.mockResolvedValue(baseContact);
            prisma.inquiries.create.mockResolvedValue({
                id: 42,
                status: $Enums.inquiries_status.New,
                wedding_date: new Date('2026-09-01'),
                notes: null,
                lead_source: 'WEB',
                lead_source_details: null,
                contact: baseContact,
            });
            packageService.handlePackageSelection.mockRejectedValue(new Error('snapshot failed'));

            const result = await service.create(
                {
                    first_name: 'Alex',
                    last_name: 'Smith',
                    email: 'alex@example.com',
                    phone_number: '',
                    wedding_date: '2026-09-01',
                    status: $Enums.inquiries_status.New,
                    selected_package_id: 9,
                },
                1,
            );

            expect(result.id).toBe(42);
            expect(result.warnings).toEqual([
                'Failed to create package snapshot for inquiry 42. The inquiry was created, but its package snapshot may be missing.',
            ]);
        });

        it('omits warnings when package snapshot succeeds', async () => {
            prisma.contacts.upsert.mockResolvedValue(baseContact);
            prisma.inquiries.create.mockResolvedValue({
                id: 43,
                status: $Enums.inquiries_status.New,
                wedding_date: new Date('2026-09-01'),
                notes: null,
                lead_source: null,
                lead_source_details: null,
                contact: baseContact,
            });
            packageService.handlePackageSelection.mockResolvedValue(undefined);

            const result = await service.create(
                {
                    first_name: 'Alex',
                    last_name: 'Smith',
                    email: 'alex@example.com',
                    phone_number: '',
                    wedding_date: '2026-09-01',
                    status: $Enums.inquiries_status.New,
                    selected_package_id: 9,
                },
                1,
            );

            expect(result.warnings).toBeUndefined();
        });
    });

    describe('update', () => {
        const existingInquiry = {
            id: 10,
            contact_id: 5,
            selected_package_id: 3,
            status: $Enums.inquiries_status.New,
            wedding_date: new Date('2026-09-01'),
            contact: { ...baseContact, brand_id: 1 },
        };

        it('returns warnings when package selection change fails', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(existingInquiry);
            prisma.inquiries.update.mockResolvedValue({
                ...existingInquiry,
                selected_package_id: 8,
                notes: null,
                lead_source: null,
                lead_source_details: null,
                preferred_payment_schedule_template_id: null,
                contact: baseContact,
            });
            packageService.handlePackageSelection.mockRejectedValue(new Error('sync failed'));

            const result = await service.update(10, { selected_package_id: 8 }, 1);

            expect(result.selected_package_id).toBe(8);
            expect(result.warnings).toEqual([
                'Failed to handle package selection change for inquiry 10. The inquiry was updated, but its package snapshot may be out of date.',
            ]);
        });

        it('throws ConflictException when email belongs to another contact', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(existingInquiry);
            prisma.contacts.findUnique.mockResolvedValue({ id: 99 });

            await expect(
                service.update(10, { email: 'taken@example.com' }, 1),
            ).rejects.toThrow(ConflictException);
        });

        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.update(99, { notes: 'x' }, 1)).rejects.toThrow(NotFoundException);
        });
    });
});
