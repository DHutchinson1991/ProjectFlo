import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

const intakeTemplate = { id: 1, stage: InquiryWizardStage.INTAKE };
const discoveryTemplate = { id: 2, stage: InquiryWizardStage.DISCOVERY_CALL };

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: {
        inquiry_wizard_submissions: {
            findMany: jest.Mock;
            findFirst: jest.Mock;
            findUnique: jest.Mock;
            create: jest.Mock;
            update: jest.Mock;
        };
        inquiries: { update: jest.Mock };
    };
    let templateService: { getTemplateById: jest.Mock; findByShareToken: jest.Mock };
    let linkService: {
        linkToExistingInquiry: jest.Mock;
        createNewInquiry: jest.Mock;
        createInquiryFromResponses: jest.Mock;
    };
    let estimateService: { autoCreateDraftEstimate: jest.Mock };
    let inquiryTasksService: { autoCompleteByName: jest.Mock };

    beforeEach(async () => {
        prisma = {
            inquiry_wizard_submissions: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            inquiries: { update: jest.fn().mockResolvedValue({}) },
        };
        templateService = {
            getTemplateById: jest.fn(),
            findByShareToken: jest.fn(),
        };
        linkService = {
            linkToExistingInquiry: jest.fn().mockResolvedValue({ inquiryId: 10, contactId: 5 }),
            createNewInquiry: jest.fn().mockResolvedValue({ inquiryId: 20, contactId: 6 }),
            createInquiryFromResponses: jest.fn().mockResolvedValue(30),
        };
        estimateService = { autoCreateDraftEstimate: jest.fn().mockResolvedValue(undefined) };
        inquiryTasksService = { autoCompleteByName: jest.fn().mockResolvedValue(undefined) };

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
        it('routes DISCOVERY_CALL templates without inquiry linking or estimate creation', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            const created = { id: 99, inquiry_id: 10 };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const payload = {
                template_id: 2,
                inquiry_id: 10,
                responses: { vibe: 'romantic' },
                call_notes: 'Great chemistry',
                transcript: 'Hello there',
                sentiment: { score: 0.9 },
                call_duration_seconds: 900,
            };

            const result = await service.createSubmission(payload, 1);

            expect(result).toBe(created);
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        template_id: 2,
                        inquiry_id: 10,
                        call_notes: 'Great chemistry',
                        transcript: 'Hello there',
                        sentiment: { score: 0.9 },
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(10, 'Discovery Call');
        });

        it('creates INTAKE submission with new inquiry and draft estimate', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 1, inquiry_id: 20 });

            await service.createSubmission(
                { template_id: 1, responses: { wedding_date: '2026-06-01' }, create_inquiry: true },
                1,
            );

            expect(linkService.createNewInquiry).toHaveBeenCalled();
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(20);
        });

        it('links INTAKE submission to an existing inquiry when inquiry_id is provided', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 1, inquiry_id: 10 });

            await service.createSubmission(
                { template_id: 1, responses: {}, inquiry_id: 10 },
                1,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(10);
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 10,
                responses: { wedding_date: '2026-06-01' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 5 });

            await service.updateSubmissionResponses(5, {
                payment_schedule_template_id: 42,
                notes: 'Updated',
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            wedding_date: '2026-06-01',
                            payment_schedule_template_id: 42,
                            notes: 'Updated',
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { preferred_payment_schedule_template_id: 42 },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);

            await expect(
                service.updateSubmissionResponses(999, { notes: 'x' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('convertSubmission', () => {
        it('returns submission unchanged when inquiry_id already exists', async () => {
            const existing = { id: 1, inquiry_id: 10, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                ...existing,
                template: { questions: [] },
                inquiry: null,
                contact: null,
            });

            const result = await service.convertSubmission(1, 1);

            expect(result.inquiry_id).toBe(10);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.update).not.toHaveBeenCalled();
        });

        it('creates inquiry from responses when submission is unlinked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry_id: null,
                responses: { contact_email: 'couple@example.com' },
                template: { questions: [] },
                inquiry: null,
                contact: null,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 1,
                inquiry_id: 30,
                status: 'converted',
            });

            await service.convertSubmission(1, 1);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { contact_email: 'couple@example.com' },
                1,
            );
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { inquiry_id: 30, status: 'converted' },
                }),
            );
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry_id: 10,
                template: { questions: [] },
                inquiry: null,
                contact: null,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 1, reviewed_at: new Date() });

            await service.reviewSubmission(1, 1, { review_notes: 'Looks good' });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(10, 'Review Inquiry');
        });
    });
});
