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
    let linkService: { linkToExistingInquiry: jest.Mock; createNewInquiry: jest.Mock; createInquiryFromResponses: jest.Mock };
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
        estimateService = {
            autoCreateDraftEstimate: jest.fn().mockResolvedValue(undefined),
        };
        inquiryTasksService = {
            autoCompleteByName: jest.fn().mockResolvedValue(undefined),
        };

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
        it('routes DISCOVERY_CALL submissions without linking or estimate generation', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            const created = { id: 99, inquiry_id: 10, template: discoveryTemplate };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const result = await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 10,
                    responses: { venue_story: 'Beach sunset' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello there',
                    sentiment: { positive: 0.8 },
                    call_duration_seconds: 900,
                },
                1,
            );

            expect(result).toBe(created);
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 10,
                        call_notes: 'Great rapport',
                        transcript: 'Hello there',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(10, 'Discovery Call');
        });

        it('creates INTAKE submission, links inquiry, and drafts estimate', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 42, contactId: 7 });
            const created = { id: 50, inquiry_id: 42, template: intakeTemplate };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            await service.createSubmission(
                { template_id: 1, inquiry_id: 42, responses: { wedding_date: '2026-09-01' } },
                1,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(42);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 20,
                responses: { guest_count: '120' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 5 });
            prisma.inquiries.update.mockResolvedValue({ id: 20 });

            await service.updateSubmissionResponses(5, {
                payment_schedule_template_id: 3,
                wedding_date: '2026-06-15',
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            guest_count: '120',
                            payment_schedule_template_id: 3,
                            wedding_date: '2026-06-15',
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 20 },
                data: { preferred_payment_schedule_template_id: 3 },
            });
        });

        it('clears inquiry payment schedule when template id is not a number', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 20,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 5 });

            await service.updateSubmissionResponses(5, { payment_schedule_template_id: null });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 20 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 8,
                inquiry_id: 15,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 8, reviewed_at: new Date() });

            await service.reviewSubmission(8, 1, {
                review_notes: 'Looks good',
                review_checklist_state: { contact_verified: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(15, 'Review Inquiry');
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

    describe('getSubmissionById', () => {
        it('throws when submission is outside brand scope', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);

            await expect(service.getSubmissionById(1, 99)).rejects.toThrow(NotFoundException);
        });
    });
});
