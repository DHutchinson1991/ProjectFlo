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
        service = module.get<InquiryWizardSubmissionService>(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('links INTAKE submissions to inquiries and auto-creates draft estimates', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 20, contactId: 30 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 100,
                inquiry_id: 20,
                template: { questions: [] },
                inquiry: { id: 20, portal_token: 'tok' },
                contact: { id: 30 },
            });

            await service.createSubmission(
                {
                    template_id: 1,
                    inquiry_id: 20,
                    responses: { guest_count: '100' },
                },
                1,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(20);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
        });

        it('creates DISCOVERY_CALL submissions without linking or estimate generation', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 200,
                inquiry_id: 15,
                template: { questions: [] },
                inquiry: { id: 15 },
                contact: null,
            });

            await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 15,
                    responses: { couple_story: 'Met at university' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello...',
                    call_duration_seconds: 1800,
                },
                1,
            );

            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        call_notes: 'Great rapport',
                        transcript: 'Hello...',
                        call_duration_seconds: 1800,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(15, 'Discovery Call');
        });

        it('does not fail DISCOVERY_CALL submission when task auto-complete throws', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 2,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 201 });

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 15, responses: {} },
                    1,
                ),
            ).resolves.toEqual({ id: 201 });
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs preferred payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 50,
                inquiry_id: 77,
                responses: { guest_count: '80' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 50,
                responses: { guest_count: '80', payment_schedule_template_id: 9 },
            });

            await service.updateSubmissionResponses(50, { payment_schedule_template_id: 9 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 77 },
                data: { preferred_payment_schedule_template_id: 9 },
            });
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            guest_count: '80',
                            payment_schedule_template_id: 9,
                        },
                    },
                }),
            );
        });

        it('clears preferred payment schedule when response is not a number', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 50,
                inquiry_id: 77,
                responses: { payment_schedule_template_id: 9 },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 50 });

            await service.updateSubmissionResponses(50, { payment_schedule_template_id: null });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 77 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });
    });

    describe('convertSubmission', () => {
        it('returns submission unchanged when inquiry is already linked', async () => {
            const existing = { id: 10, inquiry_id: 33, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(existing);

            const result = await service.convertSubmission(10, 1);
            expect(result).toBe(existing);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });
    });

    describe('updateSubmission', () => {
        it('throws when submission is missing for brand', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);
            await expect(
                service.updateSubmission(404, { call_notes: 'Updated' }, 1),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('listSubmissions', () => {
        it('filters by wizard stage when provided', async () => {
            prisma.inquiry_wizard_submissions.findMany.mockResolvedValue([]);
            await service.listSubmissions(1, 20, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_submissions.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        brand_id: 1,
                        inquiry_id: 20,
                        template: { stage: InquiryWizardStage.DISCOVERY_CALL },
                    }),
                }),
            );
        });
    });
});
