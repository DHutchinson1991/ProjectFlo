import { Test } from '@nestjs/testing';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryCrudService } from '../../inquiries/services/inquiry-crud.service';
import { InquiryPackageService } from '../../inquiries/services/inquiry-package.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';

describe('InquiryWizardLinkService', () => {
    let service: InquiryWizardLinkService;
    let prisma: {
        inquiries: { findUnique: jest.Mock; update: jest.Mock };
        inquiry_wizard_submissions: { findFirst: jest.Mock };
        contacts: { update: jest.Mock };
    };

    beforeEach(async () => {
        prisma = {
            inquiries: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            inquiry_wizard_submissions: {
                findFirst: jest.fn(),
            },
            contacts: { update: jest.fn() },
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                InquiryWizardLinkService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryCrudService, useValue: {} },
                { provide: InquiryPackageService, useValue: { handlePackageSelection: jest.fn() } },
                { provide: InquiryTasksService, useValue: { syncReviewInquiryAutoSubtasks: jest.fn() } },
                { provide: InquiryWizardPrefillService, useValue: { prefillLocationSlots: jest.fn(), prefillSubjectNames: jest.fn() } },
            ],
        }).compile();

        service = moduleRef.get(InquiryWizardLinkService);
    });

    it('does not overwrite wedding_date or lead_source_details on studio re-submit', async () => {
        prisma.inquiries.findUnique.mockResolvedValue({
            id: 9,
            contact_id: 2,
            wedding_date: new Date('2026-09-15'),
            lead_source_details: '{"original":"snapshot"}',
            contact: { id: 2, first_name: 'Alex', last_name: 'Smith', email: 'alex@example.com', phone_number: '555' },
        });
        prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({ id: 100 });
        prisma.inquiries.update.mockResolvedValue({});

        await service.linkToExistingInquiry(
            {
                inquiry_id: 9,
                template_id: 1,
                responses: {
                    wedding_date: '2026-12-25',
                    lead_source: 'Referral',
                },
            },
            1,
        );

        const updateCall = prisma.inquiries.update.mock.calls[0]?.[0];
        expect(updateCall?.data?.wedding_date).toBeUndefined();
        expect(updateCall?.data?.lead_source_details).toBeUndefined();
    });

    it('sets wedding_date and lead_source_details on first wizard link', async () => {
        prisma.inquiries.findUnique.mockResolvedValue({
            id: 9,
            contact_id: 2,
            wedding_date: null,
            lead_source_details: null,
            contact: { id: 2, first_name: 'Alex', last_name: 'Smith', email: 'alex@example.com', phone_number: '555' },
        });
        prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);
        prisma.inquiries.update.mockResolvedValue({});

        await service.linkToExistingInquiry(
            {
                inquiry_id: 9,
                template_id: 1,
                responses: {
                    wedding_date: '2026-12-25',
                    lead_source: 'Referral',
                },
            },
            1,
        );

        const updateCall = prisma.inquiries.update.mock.calls[0]?.[0];
        expect(updateCall?.data?.wedding_date).toEqual(new Date('2026-12-25'));
        expect(updateCall?.data?.lead_source_details).toBe(
            JSON.stringify({ wedding_date: '2026-12-25', lead_source: 'Referral' }),
        );
        expect(prisma.inquiry_wizard_submissions.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    template: { stage: InquiryWizardStage.INTAKE },
                }),
            }),
        );
    });
});
