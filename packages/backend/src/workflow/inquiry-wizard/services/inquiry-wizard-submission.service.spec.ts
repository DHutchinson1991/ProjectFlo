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
        estimateService = {
            autoCreateDraftEstimate: jest.fn(),
        };
        inquiryTasksService = {
            autoCompleteByName: jest.fn(),
        };

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

        service = module.get<InquiryWizardSubmissionService>(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('creates INTAKE submissions with inquiry linking and draft estimate', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.createNewInquiry.mockResolvedValue({ inquiryId: 10, contactId: 20 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 99,
                inquiry_id: 10,
            });

            await service.createSubmission(
                {
                    template_id: 1,
                    create_inquiry: true,
                    responses: { event_type: 'wedding' },
                },
                5,
            );

            expect(linkService.createNewInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(10);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
        });

        it('creates DISCOVERY_CALL submissions without estimate generation', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 100,
                inquiry_id: 10,
            });

            await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 10,
                    responses: { opening_notes: 'Warm intro' },
                    call_notes: 'Couple prefers documentary style',
                    transcript: 'Full transcript',
                    call_duration_seconds: 900,
                },
                5,
            );

            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 10,
                        call_notes: 'Couple prefers documentary style',
                        transcript: 'Full transcript',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(10, 'Discovery Call');
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
                    {
                        template_id: 2,
                        inquiry_id: 10,
                        responses: {},
                    },
                    5,
                ),
            ).resolves.toEqual({ id: 101 });
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 7,
                inquiry_id: 15,
                responses: { package_path: 'pick' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 7 });
            prisma.inquiries.update.mockResolvedValue({});

            await service.updateSubmissionResponses(7, {
                payment_schedule_template_id: 42,
                special_requests: 'Drone footage',
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            package_path: 'pick',
                            payment_schedule_template_id: 42,
                            special_requests: 'Drone footage',
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 15 },
                data: { preferred_payment_schedule_template_id: 42 },
            });
        });

        it('clears inquiry payment schedule when response is not a number', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 7,
                inquiry_id: 15,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 7 });

            await service.updateSubmissionResponses(7, {
                payment_schedule_template_id: null,
            });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 15 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);
            await expect(
                service.updateSubmissionResponses(404, { special_requests: 'x' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 8,
                inquiry_id: 16,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 8,
                reviewed_at: new Date('2026-07-20T12:00:00Z'),
            });

            await service.reviewSubmission(8, 5, {
                review_notes: 'Looks good',
                review_checklist_state: { budget_confirmed: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(16, 'Review Inquiry');
        });
    });
});
