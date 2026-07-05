import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

const buildPrisma = () => ({
    inquiry_wizard_submissions: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    inquiries: {
        update: jest.fn(),
    },
});

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: ReturnType<typeof buildPrisma>;
    let templateService: {
        getTemplateById: jest.Mock;
        findByShareToken: jest.Mock;
    };
    let estimateService: { autoCreateDraftEstimate: jest.Mock };
    let linkService: {
        linkToExistingInquiry: jest.Mock;
        createNewInquiry: jest.Mock;
        createInquiryFromResponses: jest.Mock;
    };
    let inquiryTasksService: { autoCompleteByName: jest.Mock };

    beforeEach(async () => {
        prisma = buildPrisma();
        templateService = {
            getTemplateById: jest.fn(),
            findByShareToken: jest.fn(),
        };
        estimateService = { autoCreateDraftEstimate: jest.fn() };
        linkService = {
            linkToExistingInquiry: jest.fn(),
            createNewInquiry: jest.fn(),
            createInquiryFromResponses: jest.fn(),
        };
        inquiryTasksService = { autoCompleteByName: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardSubmissionService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
                { provide: InquiryWizardTemplateService, useValue: templateService },
                { provide: InquiryWizardEstimateService, useValue: estimateService },
                { provide: InquiryWizardLinkService, useValue: linkService },
            ],
        }).compile();

        service = module.get(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('skips inquiry linking and estimate creation for DISCOVERY_CALL stage', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 7,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 100,
                inquiry_id: 55,
            });

            await service.createSubmission(
                {
                    template_id: 7,
                    inquiry_id: 55,
                    responses: { story: 'How we met' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello...',
                    sentiment: { positive: 0.9 },
                    call_duration_seconds: 900,
                },
                1,
            );

            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 55,
                        call_notes: 'Great rapport',
                        transcript: 'Hello...',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(55, 'Discovery Call');
        });

        it('creates draft estimate after INTAKE submission linked to inquiry', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 3,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 12, contactId: 20 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 101, inquiry_id: 12 });

            await service.createSubmission(
                {
                    template_id: 3,
                    inquiry_id: 12,
                    responses: { event_type: 'wedding' },
                },
                1,
            );

            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(12);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
        });
    });

    describe('updateSubmissionResponses', () => {
        it('syncs preferred payment schedule template to inquiry when updated', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 200,
                inquiry_id: 33,
                responses: { event_type: 'wedding' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 200 });

            await service.updateSubmissionResponses(200, {
                payment_schedule_template_id: 9,
            });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 33 },
                data: { preferred_payment_schedule_template_id: 9 },
            });
        });

        it('clears preferred payment schedule when non-number value is sent', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 201,
                inquiry_id: 34,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 201 });

            await service.updateSubmissionResponses(201, {
                payment_schedule_template_id: null,
            });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 34 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);
            await expect(
                service.updateSubmissionResponses(999, { foo: 'bar' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 300,
                inquiry_id: 44,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 300, reviewed_at: new Date() });

            await service.reviewSubmission(300, 1, {
                review_notes: 'Looks good',
                review_checklist_state: { contact_verified: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(44, 'Review Inquiry');
        });
    });
});
