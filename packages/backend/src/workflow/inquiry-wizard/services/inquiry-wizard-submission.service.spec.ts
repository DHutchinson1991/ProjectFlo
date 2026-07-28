import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';

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

const mockTemplateService = () => ({
    getTemplateById: jest.fn(),
    findByShareToken: jest.fn(),
});

const mockEstimateService = () => ({
    autoCreateDraftEstimate: jest.fn(),
});

const mockLinkService = () => ({
    linkToExistingInquiry: jest.fn(),
    createNewInquiry: jest.fn(),
    createInquiryFromResponses: jest.fn(),
});

const mockInquiryTasks = () => ({
    autoCompleteByName: jest.fn(),
});

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: ReturnType<typeof buildPrisma>;
    let templateService: ReturnType<typeof mockTemplateService>;
    let estimateService: ReturnType<typeof mockEstimateService>;
    let linkService: ReturnType<typeof mockLinkService>;
    let inquiryTasks: ReturnType<typeof mockInquiryTasks>;

    beforeEach(() => {
        prisma = buildPrisma();
        templateService = mockTemplateService();
        estimateService = mockEstimateService();
        linkService = mockLinkService();
        inquiryTasks = mockInquiryTasks();

        service = new InquiryWizardSubmissionService(
            prisma as never,
            inquiryTasks as never,
            templateService as never,
            estimateService as never,
            linkService as never,
        );
    });

    describe('createSubmission', () => {
        it('INTAKE stage links inquiry and creates a draft estimate', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 42, contactId: 7 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 99, inquiry_id: 42 });

            await service.createSubmission(
                { template_id: 1, responses: { guest_count: 80 }, inquiry_id: 42 },
                5,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(42);
            expect(inquiryTasks.autoCompleteByName).not.toHaveBeenCalled();
        });

        it('DISCOVERY_CALL stage stores call metadata and auto-completes the Discovery Call task', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 100 });

            await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 42,
                    responses: { vibe: 'romantic' },
                    call_notes: 'Loves candid shots',
                    transcript: 'Full transcript',
                    sentiment: { tone: 'positive' },
                    call_duration_seconds: 900,
                },
                5,
            );

            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 42,
                        call_notes: 'Loves candid shots',
                        transcript: 'Full transcript',
                        sentiment: { tone: 'positive' },
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(inquiryTasks.autoCompleteByName).toHaveBeenCalledWith(42, 'Discovery Call');
        });

        it('DISCOVERY_CALL submission still succeeds when task auto-complete fails', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 101 });
            inquiryTasks.autoCompleteByName.mockRejectedValue(new Error('task missing'));

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 42, responses: {} },
                    5,
                ),
            ).resolves.toEqual({ id: 101 });
        });
    });

    describe('updateSubmission', () => {
        it('patches discovery-call fields on an existing submission', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({ id: 12, brand_id: 5 });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 12, call_notes: 'Updated' });

            const result = await service.updateSubmission(
                12,
                { call_notes: 'Updated', transcript: 'New transcript' },
                5,
            );

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 12 },
                    data: expect.objectContaining({
                        call_notes: 'Updated',
                        transcript: 'New transcript',
                    }),
                }),
            );
            expect(result).toEqual({ id: 12, call_notes: 'Updated' });
        });

        it('throws when submission is not found', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);
            await expect(
                service.updateSubmission(12, { call_notes: 'x' }, 5),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 20,
                brand_id: 5,
                inquiry_id: 55,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 20,
                reviewed_at: new Date('2026-07-01'),
            });

            await service.reviewSubmission(20, 5, {
                review_notes: 'Looks good',
                review_checklist_state: { package: true },
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { package: true },
                    }),
                }),
            );
            expect(inquiryTasks.autoCompleteByName).toHaveBeenCalledWith(55, 'Review Inquiry');
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs preferred payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 30,
                inquiry_id: 77,
                responses: { guest_count: 100 },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 30 });

            await service.updateSubmissionResponses(30, {
                venue: 'Barn',
                payment_schedule_template_id: 8,
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            guest_count: 100,
                            venue: 'Barn',
                            payment_schedule_template_id: 8,
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 77 },
                data: { preferred_payment_schedule_template_id: 8 },
            });
        });

        it('clears inquiry payment schedule when response value is not a number', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 31,
                inquiry_id: 78,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 31 });

            await service.updateSubmissionResponses(31, {
                payment_schedule_template_id: null,
            });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 78 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });
    });

    describe('listSubmissions', () => {
        it('filters by wizard stage when provided', async () => {
            prisma.inquiry_wizard_submissions.findMany.mockResolvedValue([]);

            await service.listSubmissions(5, 42, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_submissions.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        brand_id: 5,
                        inquiry_id: 42,
                        template: { stage: InquiryWizardStage.DISCOVERY_CALL },
                    },
                }),
            );
        });
    });
});
