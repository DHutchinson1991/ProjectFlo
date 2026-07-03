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
    inquiries: { update: jest.fn() },
});

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: ReturnType<typeof buildPrisma>;
    let templateService: { getTemplateById: jest.Mock; findByShareToken: jest.Mock };
    let linkService: {
        linkToExistingInquiry: jest.Mock;
        createNewInquiry: jest.Mock;
        createInquiryFromResponses: jest.Mock;
    };
    let estimateService: { autoCreateDraftEstimate: jest.Mock };
    let inquiryTasksService: { autoCompleteByName: jest.Mock };

    beforeEach(async () => {
        prisma = buildPrisma();
        templateService = { getTemplateById: jest.fn(), findByShareToken: jest.fn() };
        linkService = {
            linkToExistingInquiry: jest.fn(),
            createNewInquiry: jest.fn(),
            createInquiryFromResponses: jest.fn(),
        };
        estimateService = { autoCreateDraftEstimate: jest.fn() };
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
        it('routes DISCOVERY_CALL submissions without linking or estimate creation', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 7,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            const created = { id: 100, inquiry_id: 42 };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const result = await service.createSubmission(
                {
                    template_id: 7,
                    inquiry_id: 42,
                    responses: { venue_story: 'Beach' },
                    call_notes: 'Great call',
                },
                1,
            );

            expect(result).toBe(created);
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(42, 'Discovery Call');
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 42,
                        call_notes: 'Great call',
                    }),
                }),
            );
        });

        it('links existing inquiry and creates draft estimate for INTAKE stage', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 55, contactId: 9 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 200, inquiry_id: 55 });

            await service.createSubmission(
                { template_id: 1, inquiry_id: 55, responses: { wedding_date: '2026-08-01' } },
                1,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(55);
        });
    });

    describe('convertSubmission', () => {
        it('returns submission unchanged when inquiry is already linked', async () => {
            const submission = { id: 3, inquiry_id: 10 };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(submission);

            const result = await service.convertSubmission(3, 1);

            expect(result).toBe(submission);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });

        it('creates inquiry and marks submission converted when unlinked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 4,
                inquiry_id: null,
                responses: { contact_email: 'couple@example.com' },
            });
            linkService.createInquiryFromResponses.mockResolvedValue(88);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 4, inquiry_id: 88, status: 'converted' });

            const result = await service.convertSubmission(4, 1);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { contact_email: 'couple@example.com' },
                1,
            );
            expect(result.inquiry_id).toBe(88);
        });
    });

    describe('reviewSubmission', () => {
        it('marks reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({ id: 5, inquiry_id: 77 });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 5, reviewed_at: new Date() });

            await service.reviewSubmission(5, 1, { review_notes: 'Looks good' });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(77, 'Review Inquiry');
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ review_notes: 'Looks good' }),
                }),
            );
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 6,
                inquiry_id: 12,
                responses: { wedding_date: '2026-05-01' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 6 });

            await service.updateSubmissionResponses(6, {
                guest_count: '120',
                payment_schedule_template_id: 3,
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            wedding_date: '2026-05-01',
                            guest_count: '120',
                            payment_schedule_template_id: 3,
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 12 },
                data: { preferred_payment_schedule_template_id: 3 },
            });
        });

        it('throws when submission is missing', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);
            await expect(service.updateSubmissionResponses(999, {})).rejects.toThrow(NotFoundException);
        });
    });
});
