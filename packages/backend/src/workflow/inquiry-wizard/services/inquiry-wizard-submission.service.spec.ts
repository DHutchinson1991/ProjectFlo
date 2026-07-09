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
                { provide: InquiryWizardTemplateService, useValue: templateService },
                { provide: InquiryWizardEstimateService, useValue: estimateService },
                { provide: InquiryWizardLinkService, useValue: linkService },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
            ],
        }).compile();

        service = module.get<InquiryWizardSubmissionService>(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('routes DISCOVERY_CALL templates to discovery flow without estimate generation', async () => {
            const discoverySubmission = { id: 99, inquiry_id: 10 };
            templateService.getTemplateById.mockResolvedValue({
                id: 5,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(discoverySubmission);

            const payload = {
                template_id: 5,
                inquiry_id: 10,
                responses: { venue_story: 'Beach sunset' },
                call_notes: 'Great rapport',
                transcript: 'Hello there',
                sentiment: { positive: 0.9 },
                call_duration_seconds: 900,
            };

            const result = await service.createSubmission(payload, 1);

            expect(result).toBe(discoverySubmission);
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
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

        it('does not fail discovery submission when task auto-complete throws', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 5,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 1 });
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));

            await expect(
                service.createSubmission(
                    { template_id: 5, inquiry_id: 10, responses: {} },
                    1,
                ),
            ).resolves.toEqual({ id: 1 });
        });

        it('creates INTAKE submission, links inquiry, and drafts estimate', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 3,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.createNewInquiry.mockResolvedValue({ inquiryId: 20, contactId: 30 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 7, inquiry_id: 20 });

            await service.createSubmission(
                {
                    template_id: 3,
                    create_inquiry: true,
                    responses: { couple_names: 'Alex & Sam' },
                },
                1,
            );

            expect(linkService.createNewInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(20);
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 20,
                        contact_id: 30,
                        status: 'submitted',
                    }),
                }),
            );
        });
    });

    describe('updateSubmission', () => {
        it('throws when submission is not found for brand', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);
            await expect(
                service.updateSubmission(1, { responses: { note: 'x' } }, 2),
            ).rejects.toThrow(NotFoundException);
        });

        it('patches discovery-call fields on existing submission', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({ id: 4, brand_id: 1 });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 4, call_notes: 'Updated' });

            const result = await service.updateSubmission(
                4,
                { call_notes: 'Updated', call_duration_seconds: 1200 },
                1,
            );

            expect(result.call_notes).toBe('Updated');
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        call_notes: 'Updated',
                        call_duration_seconds: 1200,
                    }),
                }),
            );
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 8,
                brand_id: 1,
                inquiry_id: 15,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 8,
                reviewed_at: new Date(),
            });

            await service.reviewSubmission(8, 1, {
                review_notes: 'Looks good',
                review_checklist_state: { package: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(15, 'Review Inquiry');
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { package: true },
                    }),
                }),
            );
        });
    });

    describe('convertSubmission', () => {
        it('returns submission unchanged when inquiry already linked', async () => {
            const existing = { id: 3, inquiry_id: 12, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(existing);

            const result = await service.convertSubmission(3, 1);

            expect(result).toBe(existing);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });

        it('creates inquiry from responses when unlinked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 3,
                inquiry_id: null,
                responses: { email: 'couple@example.com' },
            });
            linkService.createInquiryFromResponses.mockResolvedValue(44);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 3,
                inquiry_id: 44,
                status: 'converted',
            });

            const result = await service.convertSubmission(3, 1);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { email: 'couple@example.com' },
                1,
            );
            expect(result.inquiry_id).toBe(44);
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 6,
                inquiry_id: 25,
                responses: { couple_names: 'Alex & Sam' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 6 });
            prisma.inquiries.update.mockResolvedValue({ id: 25 });

            await service.updateSubmissionResponses(6, {
                payment_schedule_template_id: 9,
                extra_field: 'value',
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            couple_names: 'Alex & Sam',
                            payment_schedule_template_id: 9,
                            extra_field: 'value',
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 25 },
                data: { preferred_payment_schedule_template_id: 9 },
            });
        });

        it('clears inquiry payment schedule when non-numeric template id is provided', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 6,
                inquiry_id: 25,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 6 });

            await service.updateSubmissionResponses(6, {
                payment_schedule_template_id: null,
            });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 25 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });
    });

    describe('listSubmissions', () => {
        it('filters by wizard stage when provided', async () => {
            prisma.inquiry_wizard_submissions.findMany.mockResolvedValue([]);

            await service.listSubmissions(1, 10, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_submissions.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        brand_id: 1,
                        inquiry_id: 10,
                        template: { stage: InquiryWizardStage.DISCOVERY_CALL },
                    }),
                }),
            );
        });
    });
});
