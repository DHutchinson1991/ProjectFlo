import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryCrudService } from '../../inquiries/services/inquiry-crud.service';
import { InquiryPackageService } from '../../inquiries/services/inquiry-package.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';

const buildPrisma = () => ({
    inquiries: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    contacts: {
        update: jest.fn(),
        findUnique: jest.fn(),
    },
});

describe('InquiryWizardLinkService', () => {
    let service: InquiryWizardLinkService;
    let prisma: ReturnType<typeof buildPrisma>;
    let inquiryPackageService: { handlePackageSelection: jest.Mock };
    let inquiryTasksService: { syncReviewInquiryAutoSubtasks: jest.Mock };
    let prefillService: {
        prefillLocationSlots: jest.Mock;
        prefillSubjectNames: jest.Mock;
    };

    beforeEach(async () => {
        prisma = buildPrisma();
        inquiryPackageService = { handlePackageSelection: jest.fn().mockResolvedValue(undefined) };
        inquiryTasksService = { syncReviewInquiryAutoSubtasks: jest.fn().mockResolvedValue(undefined) };
        prefillService = {
            prefillLocationSlots: jest.fn().mockResolvedValue(undefined),
            prefillSubjectNames: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardLinkService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryCrudService, useValue: { create: jest.fn() } },
                { provide: InquiryPackageService, useValue: inquiryPackageService },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
                { provide: InquiryWizardPrefillService, useValue: prefillService },
            ],
        }).compile();

        service = module.get(InquiryWizardLinkService);
    });

    describe('linkToExistingInquiry', () => {
        const baseInquiry = {
            id: 50,
            contact_id: 5,
            guest_count: null,
            notes: null,
            lead_source: null,
            selected_package_id: null,
            event_category: null,
            contact: {
                id: 5,
                first_name: 'Unknown',
                last_name: 'Lead',
                email: 'pending_abc@temp.com',
                phone_number: null,
            },
        };

        it('prefers wizard wedding_date over placeholder inquiry date', async () => {
            prisma.inquiries.findUnique.mockResolvedValue(baseInquiry);
            prisma.inquiries.update.mockResolvedValue({});

            await service.linkToExistingInquiry(
                {
                    inquiry_id: 50,
                    template_id: 1,
                    responses: { wedding_date: '2026-09-15', guest_count: '150' },
                },
                10,
            );

            expect(prisma.inquiries.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 50 },
                    data: expect.objectContaining({
                        wedding_date: new Date('2026-09-15'),
                        guest_count: '150',
                    }),
                }),
            );
        });

        it('resolves package id from responses when payload omits selected_package_id', async () => {
            prisma.inquiries.findUnique.mockResolvedValue(baseInquiry);
            prisma.inquiries.update.mockResolvedValue({});

            await service.linkToExistingInquiry(
                {
                    inquiry_id: 50,
                    template_id: 1,
                    responses: { selected_package: '42' },
                },
                10,
            );

            expect(prisma.inquiries.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ selected_package_id: 42 }),
                }),
            );
            expect(inquiryPackageService.handlePackageSelection).toHaveBeenCalledWith(50, 42, 10);
        });

        it('does not overwrite existing inquiry fields but still syncs lead_source_details', async () => {
            prisma.inquiries.findUnique.mockResolvedValue({
                ...baseInquiry,
                guest_count: '200',
                notes: 'Existing notes',
                selected_package_id: 99,
                event_category: 'Wedding',
            });
            prisma.inquiries.update.mockResolvedValue({});

            await service.linkToExistingInquiry(
                {
                    inquiry_id: 50,
                    template_id: 1,
                    responses: {
                        guest_count: '50',
                        notes: 'New notes',
                        selected_package: '42',
                        event_type: 'Birthday',
                    },
                },
                10,
            );

            expect(prisma.inquiries.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 50 },
                    data: {
                        lead_source_details: JSON.stringify({
                            guest_count: '50',
                            notes: 'New notes',
                            selected_package: '42',
                            event_type: 'Birthday',
                        }),
                    },
                }),
            );
            expect(inquiryPackageService.handlePackageSelection).not.toHaveBeenCalled();
        });

        it('fills placeholder contact fields from wizard responses', async () => {
            prisma.inquiries.findUnique.mockResolvedValue(baseInquiry);
            prisma.inquiries.update.mockResolvedValue({});
            prisma.contacts.update.mockResolvedValue({});

            await service.linkToExistingInquiry(
                {
                    inquiry_id: 50,
                    template_id: 1,
                    responses: {
                        contact_first_name: 'Jamie',
                        contact_last_name: 'Lee',
                        contact_email: 'jamie@example.com',
                        contact_phone: '+44123456789',
                    },
                },
                10,
            );

            expect(prisma.contacts.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: {
                    first_name: 'Jamie',
                    last_name: 'Lee',
                    email: 'jamie@example.com',
                    phone_number: '+44123456789',
                },
            });
        });
    });
});
