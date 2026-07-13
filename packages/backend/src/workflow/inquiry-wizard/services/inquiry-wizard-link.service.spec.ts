import { Test, TestingModule } from '@nestjs/testing';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryCrudService } from '../../inquiries/services/inquiry-crud.service';
import { InquiryPackageService } from '../../inquiries/services/inquiry-package.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

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
        const existingInquiry = {
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

        it('merges wizard responses without overwriting populated inquiry fields', async () => {
            prisma.inquiries.findUnique.mockResolvedValue({
                ...existingInquiry,
                guest_count: '80-100',
                notes: 'Existing note',
                lead_source: 'Referral',
                selected_package_id: 7,
            });

            const result = await service.linkToExistingInquiry(
                {
                    inquiry_id: 1,
                    template_id: 10,
                    responses: {
                        wedding_date: '2026-09-15',
                        guest_count: '120-150',
                        notes: 'Wizard note',
                        lead_source: 'WEB',
                        selected_package: '99',
                        event_type: 'Wedding',
                        contact_first_name: 'Jamie',
                        contact_last_name: 'Lee',
                        contact_email: 'jamie@example.com',
                        contact_phone: '555-0100',
                    },
                },
                1,
            );

            expect(result).toEqual({ inquiryId: 1, contactId: 5 });
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({
                    wedding_date: new Date('2026-09-15'),
                    lead_source_details: expect.any(String),
                    event_category: 'Wedding',
                }),
            });
            const updateData = prisma.inquiries.update.mock.calls[0][0].data;
            expect(updateData).not.toHaveProperty('guest_count');
            expect(updateData).not.toHaveProperty('notes');
            expect(updateData).not.toHaveProperty('lead_source');
            expect(updateData).not.toHaveProperty('selected_package_id');
        });

        it('resolves package id from responses and triggers package snapshot', async () => {
            prisma.inquiries.findUnique.mockResolvedValue(existingInquiry);

            await service.linkToExistingInquiry(
                {
                    inquiry_id: 2,
                    template_id: 10,
                    responses: { selected_package: '42', wedding_date: '2026-10-01' },
                },
                1,
            );

            expect(prisma.inquiries.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ selected_package_id: 42 }),
                }),
            );
            expect(inquiryPackageService.handlePackageSelection).toHaveBeenCalledWith(2, 42, 1);
            expect(inquiryTasksService.syncReviewInquiryAutoSubtasks).toHaveBeenCalledWith(2);
        });

        it('fills placeholder contact fields from wizard responses', async () => {
            prisma.inquiries.findUnique.mockResolvedValue(existingInquiry);

            await service.linkToExistingInquiry(
                {
                    inquiry_id: 3,
                    template_id: 10,
                    responses: {
                        wedding_date: '2026-10-01',
                        contact_first_name: 'Alex',
                        contact_last_name: 'Smith',
                        contact_email: 'alex@example.com',
                        contact_phone: '555-0199',
                    },
                },
                1,
            );

            expect(prisma.contacts.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: {
                    first_name: 'Alex',
                    last_name: 'Smith',
                    email: 'alex@example.com',
                    phone_number: '555-0199',
                },
            });
            expect(prefillService.prefillLocationSlots).toHaveBeenCalledWith(3, expect.any(Object), 1);
            expect(prefillService.prefillSubjectNames).toHaveBeenCalledWith(3, expect.any(Object), 'Alex Smith');
        });
    });

    describe('createNewInquiry', () => {
        it('creates inquiry via CRUD service and assigns portal token', async () => {
            inquiryCrudService.create.mockResolvedValue({ id: 99, status: 'New' });
            prisma.inquiries.update.mockResolvedValue({});
            prisma.contacts.findUnique.mockResolvedValue({ id: 12 });

            const result = await service.createNewInquiry(
                {
                    template_id: 1,
                    responses: {
                        wedding_date: '2026-11-20',
                        guest_count: '50-75',
                        event_type: 'Corporate',
                        contact_first_name: 'Pat',
                        contact_last_name: 'Jones',
                        contact_email: 'pat@corp.com',
                        payment_schedule_template_id: 8,
                    },
                    preferred_payment_schedule_template_id: 8,
                },
                1,
            );

            expect(inquiryCrudService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    wedding_date: '2026-11-20',
                    guest_count: '50-75',
                    event_category: 'Corporate',
                    first_name: 'Pat',
                    last_name: 'Jones',
                    email: 'pat@corp.com',
                    preferred_payment_schedule_template_id: 8,
                    lead_source: 'Inquiry Wizard',
                    status: $Enums.inquiries_status.New,
                }),
                1,
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 99 },
                    data: expect.objectContaining({ portal_token: expect.any(String) }),
                }),
            );
            expect(result).toEqual({ inquiryId: 99, contactId: 12 });
        });
    });

    describe('createInquiryFromResponses', () => {
        it('delegates to inquiry CRUD with inferred contact fields', async () => {
            inquiryCrudService.create.mockResolvedValue({ id: 77 });

            const id = await service.createInquiryFromResponses(
                {
                    wedding_date: '2026-12-01',
                    contact_first_name: 'Sam',
                    contact_last_name: 'Rivera',
                    contact_email: 'sam@example.com',
                },
                2,
            );

            expect(id).toBe(77);
            expect(inquiryCrudService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    first_name: 'Sam',
                    last_name: 'Rivera',
                    email: 'sam@example.com',
                    lead_source: 'Inquiry Wizard',
                }),
                2,
            );
        });
    });
});
