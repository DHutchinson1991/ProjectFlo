import { Test, TestingModule } from '@nestjs/testing';
import { $Enums } from '@prisma/client';
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
    let inquiryCrudService: { create: jest.Mock };
    let inquiryPackageService: { handlePackageSelection: jest.Mock };
    let inquiryTasksService: { syncReviewInquiryAutoSubtasks: jest.Mock };
    let prefillService: {
        prefillLocationSlots: jest.Mock;
        prefillSubjectNames: jest.Mock;
    };

    beforeEach(async () => {
        prisma = buildPrisma();
        inquiryCrudService = { create: jest.fn() };
        inquiryPackageService = { handlePackageSelection: jest.fn() };
        inquiryTasksService = { syncReviewInquiryAutoSubtasks: jest.fn() };
        prefillService = {
            prefillLocationSlots: jest.fn(),
            prefillSubjectNames: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardLinkService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryCrudService, useValue: inquiryCrudService },
                { provide: InquiryPackageService, useValue: inquiryPackageService },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
                { provide: InquiryWizardPrefillService, useValue: prefillService },
            ],
        }).compile();

        service = module.get(InquiryWizardLinkService);
    });

    describe('linkToExistingInquiry', () => {
        it('updates inquiry fields from wizard responses without overwriting existing values', async () => {
            prisma.inquiries.findUnique.mockResolvedValue({
                id: 10,
                contact_id: 5,
                guest_count: '80',
                notes: 'Existing notes',
                lead_source: 'Referral',
                selected_package_id: null,
                contact: {
                    id: 5,
                    first_name: 'Jane',
                    last_name: 'Doe',
                    email: 'jane@example.com',
                    phone_number: '555-0100',
                },
            });
            prisma.inquiries.update.mockResolvedValue({ id: 10 });

            const result = await service.linkToExistingInquiry(
                {
                    template_id: 1,
                    inquiry_id: 10,
                    responses: {
                        wedding_date: '2026-09-15',
                        guest_count: '150',
                        special_requests: 'Outdoor ceremony',
                        lead_source: 'Instagram',
                        selected_package: '42',
                        payment_schedule_template_id: 7,
                        event_type: 'Wedding',
                    },
                    preferred_payment_schedule_template_id: 7,
                },
                1,
            );

            expect(result).toEqual({ inquiryId: 10, contactId: 5 });
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: expect.objectContaining({
                    wedding_date: new Date('2026-09-15'),
                    selected_package_id: 42,
                    preferred_payment_schedule_template_id: 7,
                    event_category: 'Wedding',
                    lead_source_details: expect.any(String),
                }),
            });
            expect(prisma.inquiries.update.mock.calls[0][0].data).not.toHaveProperty('guest_count');
            expect(prisma.inquiries.update.mock.calls[0][0].data).not.toHaveProperty('notes');
            expect(prisma.inquiries.update.mock.calls[0][0].data).not.toHaveProperty('lead_source');
            expect(inquiryTasksService.syncReviewInquiryAutoSubtasks).toHaveBeenCalledWith(10);
            expect(inquiryPackageService.handlePackageSelection).toHaveBeenCalledWith(10, 42, 1);
            expect(prefillService.prefillLocationSlots).toHaveBeenCalledWith(10, expect.any(Object), 1);
            expect(prefillService.prefillSubjectNames).toHaveBeenCalledWith(10, expect.any(Object), 'Jane Doe');
        });

        it('fills placeholder contact fields from wizard responses', async () => {
            prisma.inquiries.findUnique.mockResolvedValue({
                id: 11,
                contact_id: 6,
                guest_count: null,
                notes: null,
                lead_source: null,
                selected_package_id: null,
                contact: {
                    id: 6,
                    first_name: 'Unknown',
                    last_name: 'Lead',
                    email: 'pending_abc@temp.com',
                    phone_number: null,
                },
            });
            prisma.inquiries.update.mockResolvedValue({ id: 11 });

            await service.linkToExistingInquiry(
                {
                    template_id: 1,
                    inquiry_id: 11,
                    responses: {
                        contact_first_name: 'Alex',
                        contact_last_name: 'Smith',
                        contact_email: 'alex@example.com',
                        contact_phone: '555-0199',
                    },
                },
                1,
            );

            expect(prisma.contacts.update).toHaveBeenCalledWith({
                where: { id: 6 },
                data: {
                    first_name: 'Alex',
                    last_name: 'Smith',
                    email: 'alex@example.com',
                    phone_number: '555-0199',
                },
            });
        });
    });

    describe('createNewInquiry', () => {
        it('creates inquiry from wizard payload and runs prefill hooks', async () => {
            inquiryCrudService.create.mockResolvedValue({ id: 20 });
            prisma.inquiries.update.mockResolvedValue({ id: 20 });
            prisma.contacts.findUnique.mockResolvedValue({ id: 8 });

            const result = await service.createNewInquiry(
                {
                    template_id: 1,
                    responses: {
                        wedding_date: '2026-10-01',
                        guest_count: '100',
                        contact_first_name: 'Sam',
                        contact_last_name: 'Lee',
                        contact_email: 'sam@example.com',
                        event_type: 'Wedding',
                    },
                    selected_package_id: 5,
                    preferred_payment_schedule_template_id: 2,
                },
                1,
            );

            expect(result).toEqual({ inquiryId: 20, contactId: 8 });
            expect(inquiryCrudService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    wedding_date: '2026-10-01',
                    guest_count: '100',
                    first_name: 'Sam',
                    last_name: 'Lee',
                    email: 'sam@example.com',
                    selected_package_id: 5,
                    preferred_payment_schedule_template_id: 2,
                    event_category: 'Wedding',
                    status: $Enums.inquiries_status.New,
                    lead_source: 'Inquiry Wizard',
                }),
                1,
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 20 },
                    data: expect.objectContaining({ portal_token: expect.any(String) }),
                }),
            );
            expect(prefillService.prefillLocationSlots).toHaveBeenCalledWith(20, expect.any(Object), 1);
            expect(prefillService.prefillSubjectNames).toHaveBeenCalledWith(20, expect.any(Object), 'Sam Lee');
        });
    });

    describe('createInquiryFromResponses', () => {
        it('creates inquiry from stored submission responses', async () => {
            inquiryCrudService.create.mockResolvedValue({ id: 30 });

            const inquiryId = await service.createInquiryFromResponses(
                {
                    wedding_date: '2026-11-20',
                    contact_first_name: 'Pat',
                    contact_last_name: 'Jones',
                    contact_email: 'pat@example.com',
                },
                1,
            );

            expect(inquiryId).toBe(30);
            expect(inquiryCrudService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    wedding_date: '2026-11-20',
                    first_name: 'Pat',
                    last_name: 'Jones',
                    email: 'pat@example.com',
                    lead_source: 'Inquiry Wizard',
                }),
                1,
            );
        });
    });
});
