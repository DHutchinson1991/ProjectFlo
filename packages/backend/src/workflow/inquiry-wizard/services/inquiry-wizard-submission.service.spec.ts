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

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: ReturnType<typeof buildPrisma>;
    let templateService: { getTemplateById: jest.Mock; findByShareToken: jest.Mock };
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
        it('routes INTAKE submissions through inquiry linking and draft estimate creation', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 42, contactId: 7 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 99,
                inquiry_id: 42,
                template: { questions: [] },
                inquiry: { id: 42, portal_token: 'token' },
                contact: { id: 7 },
            });

            const result = await service.createSubmission(
                { template_id: 1, inquiry_id: 42, responses: { wedding_date: '2026-09-01' } },
                1,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(42);
            expect(result.id).toBe(99);
        });

        it('skips inquiry linking and estimates for DISCOVERY_CALL stage', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 100,
                inquiry_id: 42,
                template: { questions: [] },
                inquiry: { id: 42 },
                contact: null,
            });

            await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 42,
                    responses: { story_notes: 'Lovely couple' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello...',
                },
                1,
            );

            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(42, 'Discovery Call');
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        call_notes: 'Great rapport',
                        transcript: 'Hello...',
                    }),
                }),
            );
        });

        it('does not fail DISCOVERY_CALL submission when task auto-complete errors', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 101 });

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 42, responses: {} },
                    1,
                ),
            ).resolves.toEqual({ id: 101 });
        });
    });

    describe('convertSubmission', () => {
        it('returns existing submission when inquiry is already linked', async () => {
            const existing = { id: 5, inquiry_id: 42, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                ...existing,
                template: { questions: [] },
                inquiry: { id: 42 },
                contact: null,
            });

            const result = await service.convertSubmission(5, 1);

            expect(result.inquiry_id).toBe(42);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });

        it('creates inquiry from responses when submission is unlinked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 6,
                inquiry_id: null,
                responses: { contact_email: 'new@example.com' },
                template: { questions: [] },
                inquiry: null,
                contact: null,
            });
            linkService.createInquiryFromResponses.mockResolvedValue(88);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 6,
                inquiry_id: 88,
                status: 'converted',
            });

            const result = await service.convertSubmission(6, 1);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { contact_email: 'new@example.com' },
                1,
            );
            expect(result.inquiry_id).toBe(88);
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 10,
                inquiry_id: 42,
                responses: { wedding_date: '2026-09-01' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 10,
                responses: { wedding_date: '2026-09-01', payment_schedule_template_id: 3 },
            });

            await service.updateSubmissionResponses(10, { payment_schedule_template_id: 3 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 42 },
                data: { preferred_payment_schedule_template_id: 3 },
            });
        });

        it('clears preferred payment schedule when response is not a number', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 10,
                inquiry_id: 42,
                responses: { payment_schedule_template_id: 3 },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 10 });

            await service.updateSubmissionResponses(10, { payment_schedule_template_id: null });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 42 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);

            await expect(
                service.updateSubmissionResponses(404, { notes: 'x' }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 12,
                inquiry_id: 55,
                template: { questions: [] },
                inquiry: { id: 55 },
                contact: null,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 12,
                review_notes: 'Looks good',
            });

            await service.reviewSubmission(12, 1, { review_notes: 'Looks good' });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(55, 'Review Inquiry');
        });
    });
});
