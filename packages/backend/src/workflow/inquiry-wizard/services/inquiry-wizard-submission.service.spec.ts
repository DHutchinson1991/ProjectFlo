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
        it('routes DISCOVERY_CALL templates through discovery submission path without estimate creation', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            const created = {
                id: 99,
                inquiry_id: 7,
                template: { questions: [] },
                inquiry: { id: 7 },
                contact: null,
            };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const result = await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 7,
                    responses: { story: 'They met in college' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello...',
                },
                1,
            );

            expect(result).toEqual(created);
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(7, 'Discovery Call');
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 7,
                        call_notes: 'Great rapport',
                        transcript: 'Hello...',
                    }),
                }),
            );
        });

        it('creates INTAKE submission, links inquiry, and auto-creates draft estimate', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 5, contactId: 10 });
            const created = {
                id: 50,
                inquiry_id: 5,
                template: { questions: [] },
                inquiry: { id: 5, portal_token: 'token' },
                contact: { id: 10 },
            };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const result = await service.createSubmission(
                {
                    template_id: 1,
                    inquiry_id: 5,
                    responses: { guest_count: '120' },
                },
                1,
            );

            expect(result).toEqual(created);
            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(5);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
        });

        it('does not fail discovery submission when task auto-complete throws', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 1, inquiry_id: 7 });

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 7, responses: {} },
                    1,
                ),
            ).resolves.toBeDefined();
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 12,
                inquiry_id: 8,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 12,
                reviewed_at: new Date('2026-01-01'),
            });

            await service.reviewSubmission(12, 1, {
                review_notes: 'Looks good',
                review_checklist_state: { contact_verified: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(8, 'Review Inquiry');
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 12 },
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { contact_verified: true },
                    }),
                }),
            );
        });
    });

    describe('convertSubmission', () => {
        it('returns existing submission when inquiry is already linked', async () => {
            const existing = { id: 3, inquiry_id: 15, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                ...existing,
                template: { questions: [] },
                inquiry: { id: 15 },
                contact: null,
            });

            const result = await service.convertSubmission(3, 1);

            expect(result.inquiry_id).toBe(15);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.update).not.toHaveBeenCalled();
        });

        it('creates inquiry from responses when submission is unlinked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 4,
                inquiry_id: null,
                responses: { contact_email: 'new@example.com' },
                template: { questions: [] },
                inquiry: null,
                contact: null,
            });
            linkService.createInquiryFromResponses.mockResolvedValue(22);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 4,
                inquiry_id: 22,
                status: 'converted',
            });

            const result = await service.convertSubmission(4, 1);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { contact_email: 'new@example.com' },
                1,
            );
            expect(result.inquiry_id).toBe(22);
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 6,
                inquiry_id: 9,
                responses: { guest_count: '100' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 6,
                responses: { guest_count: '100', payment_schedule_template_id: 3 },
            });

            await service.updateSubmissionResponses(6, { payment_schedule_template_id: 3 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 9 },
                data: { preferred_payment_schedule_template_id: 3 },
            });
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            guest_count: '100',
                            payment_schedule_template_id: 3,
                        },
                    },
                }),
            );
        });

        it('clears inquiry payment schedule when response is non-numeric', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 6,
                inquiry_id: 9,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 6 });

            await service.updateSubmissionResponses(6, { payment_schedule_template_id: null });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 9 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);

            await expect(
                service.updateSubmissionResponses(404, { guest_count: '50' }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
