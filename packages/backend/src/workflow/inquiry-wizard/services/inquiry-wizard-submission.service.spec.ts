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

const buildDeps = () => ({
    prisma: buildPrisma(),
    inquiryTasksService: {
        autoCompleteByName: jest.fn(),
        syncReviewInquiryAutoSubtasks: jest.fn(),
    },
    templateService: {
        getTemplateById: jest.fn(),
        findByShareToken: jest.fn(),
    },
    estimateService: {
        autoCreateDraftEstimate: jest.fn(),
    },
    linkService: {
        linkToExistingInquiry: jest.fn(),
        createNewInquiry: jest.fn(),
        createInquiryFromResponses: jest.fn(),
    },
});

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let deps: ReturnType<typeof buildDeps>;

    beforeEach(async () => {
        deps = buildDeps();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardSubmissionService,
                { provide: PrismaService, useValue: deps.prisma },
                { provide: InquiryTasksService, useValue: deps.inquiryTasksService },
                { provide: InquiryWizardTemplateService, useValue: deps.templateService },
                { provide: InquiryWizardEstimateService, useValue: deps.estimateService },
                { provide: InquiryWizardLinkService, useValue: deps.linkService },
            ],
        }).compile();
        service = module.get(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('creates DISCOVERY_CALL submissions without linking inquiries or estimates', async () => {
            deps.templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            deps.prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 99,
                inquiry_id: 10,
            });

            const payload = {
                template_id: 2,
                inquiry_id: 10,
                status: 'submitted',
                responses: { venue_story: 'Beach sunset' },
                call_notes: 'Great rapport',
                transcript: 'Hello there',
                sentiment: { score: 0.9 },
                call_duration_seconds: 900,
            };

            const result = await service.createSubmission(payload, 1);

            expect(deps.linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(deps.linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(deps.estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(deps.prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 10,
                        call_notes: 'Great rapport',
                        transcript: 'Hello there',
                        sentiment: { score: 0.9 },
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(deps.inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(10, 'Discovery Call');
            expect(result).toEqual({ id: 99, inquiry_id: 10 });
        });

        it('does not fail DISCOVERY_CALL submission when task auto-complete throws', async () => {
            deps.templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            deps.inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));
            deps.prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 1 });

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 5, responses: {} },
                    1,
                ),
            ).resolves.toEqual({ id: 1 });
        });

        it('links existing inquiry and creates draft estimate for INTAKE submissions', async () => {
            deps.templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            deps.linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 42, contactId: 7 });
            deps.prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 5, inquiry_id: 42 });

            await service.createSubmission(
                {
                    template_id: 1,
                    inquiry_id: 42,
                    responses: { wedding_date: '2026-09-01' },
                },
                1,
            );

            expect(deps.linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(deps.linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(deps.estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(42);
        });

        it('creates a new inquiry for INTAKE when create_inquiry is set', async () => {
            deps.templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            deps.linkService.createNewInquiry.mockResolvedValue({ inquiryId: 55, contactId: 8 });
            deps.prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 6, inquiry_id: 55 });

            await service.createSubmission(
                {
                    template_id: 1,
                    create_inquiry: true,
                    responses: { contact_email: 'couple@example.com' },
                },
                1,
            );

            expect(deps.linkService.createNewInquiry).toHaveBeenCalled();
            expect(deps.estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(55);
        });
    });

    describe('convertSubmission', () => {
        it('returns submission unchanged when inquiry is already linked', async () => {
            const existing = { id: 3, inquiry_id: 12, responses: {} };
            deps.prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(existing);

            const result = await service.convertSubmission(3, 1);

            expect(result).toBe(existing);
            expect(deps.linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });

        it('creates inquiry from responses and marks submission converted', async () => {
            deps.prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 4,
                inquiry_id: null,
                responses: { contact_email: 'new@example.com' },
            });
            deps.linkService.createInquiryFromResponses.mockResolvedValue(77);
            deps.prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 4,
                inquiry_id: 77,
                status: 'converted',
            });

            const result = await service.convertSubmission(4, 1);

            expect(deps.linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { contact_email: 'new@example.com' },
                1,
            );
            expect(deps.prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 4 },
                    data: { inquiry_id: 77, status: 'converted' },
                }),
            );
            expect(result).toEqual({ id: 4, inquiry_id: 77, status: 'converted' });
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges new responses onto existing responses', async () => {
            deps.prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 8,
                inquiry_id: 20,
                responses: { wedding_date: '2026-06-01', guest_count: '120' },
            });
            deps.prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 8 });

            await service.updateSubmissionResponses(8, { venue_name: 'Cliff House' });

            expect(deps.prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            wedding_date: '2026-06-01',
                            guest_count: '120',
                            venue_name: 'Cliff House',
                        },
                    },
                }),
            );
        });

        it('syncs numeric payment schedule template id to the linked inquiry', async () => {
            deps.prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 9,
                inquiry_id: 30,
                responses: {},
            });
            deps.prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 9 });

            await service.updateSubmissionResponses(9, { payment_schedule_template_id: 15 });

            expect(deps.prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 30 },
                data: { preferred_payment_schedule_template_id: 15 },
            });
        });

        it('clears inquiry payment schedule when template id is not a number', async () => {
            deps.prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 10,
                inquiry_id: 31,
                responses: {},
            });
            deps.prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 10 });

            await service.updateSubmissionResponses(10, { payment_schedule_template_id: null });

            expect(deps.prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 31 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws when submission does not exist', async () => {
            deps.prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);

            await expect(service.updateSubmissionResponses(999, { notes: 'x' })).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            deps.prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 11,
                inquiry_id: 40,
            });
            deps.prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 11,
                reviewed_at: new Date('2026-01-01'),
            });

            await service.reviewSubmission(11, 1, {
                review_notes: 'Looks good',
                review_checklist_state: { package: true },
            });

            expect(deps.inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(40, 'Review Inquiry');
            expect(deps.prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { package: true },
                    }),
                }),
            );
        });
    });
});
