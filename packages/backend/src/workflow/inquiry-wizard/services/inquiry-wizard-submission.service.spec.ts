import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

const buildPrisma = () => ({
    inquiry_wizard_submissions: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    inquiries: {
        update: jest.fn(),
    },
});

const intakeTemplate = {
    id: 1,
    brand_id: 10,
    stage: InquiryWizardStage.INTAKE,
    questions: [],
};

const discoveryTemplate = {
    id: 2,
    brand_id: 10,
    stage: InquiryWizardStage.DISCOVERY_CALL,
    questions: [],
};

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: ReturnType<typeof buildPrisma>;
    let templateService: {
        getTemplateById: jest.Mock;
        findByShareToken: jest.Mock;
    };
    let linkService: {
        linkToExistingInquiry: jest.Mock;
        createNewInquiry: jest.Mock;
        createInquiryFromResponses: jest.Mock;
    };
    let estimateService: { autoCreateDraftEstimate: jest.Mock };
    let inquiryTasksService: { autoCompleteByName: jest.Mock };

    beforeEach(async () => {
        prisma = buildPrisma();
        templateService = {
            getTemplateById: jest.fn(),
            findByShareToken: jest.fn(),
        };
        linkService = {
            linkToExistingInquiry: jest.fn(),
            createNewInquiry: jest.fn(),
            createInquiryFromResponses: jest.fn(),
        };
        estimateService = { autoCreateDraftEstimate: jest.fn().mockResolvedValue(undefined) };
        inquiryTasksService = { autoCompleteByName: jest.fn().mockResolvedValue(undefined) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardSubmissionService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryWizardTemplateService, useValue: templateService },
                { provide: InquiryWizardEstimateService, useValue: estimateService },
                { provide: InquiryWizardLinkService, useValue: linkService },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
            ],
        }).compile();

        service = module.get(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('INTAKE: links to existing inquiry and auto-creates draft estimate', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 50, contactId: 5 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 100,
                inquiry_id: 50,
                template: intakeTemplate,
            });

            await service.createSubmission(
                { template_id: 1, inquiry_id: 50, responses: { guest_count: 120 } },
                10,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(50);
        });

        it('DISCOVERY_CALL: skips inquiry linking and estimate generation', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 101,
                inquiry_id: 50,
                template: discoveryTemplate,
            });

            await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 50,
                    responses: { notes: 'Loves candid shots' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello...',
                },
                10,
            );

            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 50,
                        call_notes: 'Great rapport',
                        transcript: 'Hello...',
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(50, 'Discovery Call');
        });

        it('DISCOVERY_CALL: still completes submission when task auto-complete fails', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 102 });

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 50, responses: {} },
                    10,
                ),
            ).resolves.toEqual({ id: 102 });
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 1,
                inquiry_id: 50,
                responses: { guest_count: 100 },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 1 });
            prisma.inquiries.update.mockResolvedValue({});

            await service.updateSubmissionResponses(1, {
                payment_schedule_template_id: 7,
                notes: 'Updated',
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            guest_count: 100,
                            payment_schedule_template_id: 7,
                            notes: 'Updated',
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 50 },
                data: { preferred_payment_schedule_template_id: 7 },
            });
        });

        it('clears inquiry payment schedule when template id is non-numeric', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 1,
                inquiry_id: 50,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 1 });

            await service.updateSubmissionResponses(1, {
                payment_schedule_template_id: null,
            });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 50 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);
            await expect(service.updateSubmissionResponses(99, {})).rejects.toThrow(NotFoundException);
        });
    });

    describe('convertSubmission', () => {
        it('returns submission unchanged when inquiry already linked', async () => {
            const submission = {
                id: 1,
                inquiry_id: 50,
                responses: {},
                template: intakeTemplate,
            };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(submission);

            const result = await service.convertSubmission(1, 10);

            expect(result).toEqual(submission);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });

        it('creates inquiry from responses when not yet linked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry_id: null,
                responses: { email: 'couple@example.com' },
                template: intakeTemplate,
            });
            linkService.createInquiryFromResponses.mockResolvedValue(77);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 1,
                inquiry_id: 77,
                status: 'converted',
            });

            const result = await service.convertSubmission(1, 10);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { email: 'couple@example.com' },
                10,
            );
            expect(result.inquiry_id).toBe(77);
        });
    });

    describe('updateSubmission', () => {
        it('patches DISCOVERY_CALL fields on an existing submission', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                brand_id: 10,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 1,
                call_notes: 'Updated notes',
            });

            await service.updateSubmission(
                1,
                {
                    call_notes: 'Updated notes',
                    sentiment: { score: 0.9 },
                    call_duration_seconds: 900,
                },
                10,
            );

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                    data: {
                        call_notes: 'Updated notes',
                        sentiment: { score: 0.9 },
                        call_duration_seconds: 900,
                    },
                }),
            );
        });

        it('throws when submission is not found for brand', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);
            await expect(service.updateSubmission(99, {}, 10)).rejects.toThrow(NotFoundException);
        });
    });

    describe('reviewSubmission', () => {
        it('marks reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry_id: 50,
                template: intakeTemplate,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 1,
                reviewed_at: new Date(),
            });

            await service.reviewSubmission(1, 10, {
                review_notes: 'Looks good',
                review_checklist_state: { contact_verified: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(50, 'Review Inquiry');
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { contact_verified: true },
                    }),
                }),
            );
        });
    });
});
