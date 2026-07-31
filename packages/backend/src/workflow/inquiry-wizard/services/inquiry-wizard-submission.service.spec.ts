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

const intakeTemplate = { id: 1, stage: InquiryWizardStage.INTAKE };
const discoveryTemplate = { id: 2, stage: InquiryWizardStage.DISCOVERY_CALL };

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
                { provide: InquiryWizardTemplateService, useValue: templateService },
                { provide: InquiryWizardLinkService, useValue: linkService },
                { provide: InquiryWizardEstimateService, useValue: estimateService },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
            ],
        }).compile();

        service = module.get<InquiryWizardSubmissionService>(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('routes INTAKE submissions through inquiry linking and draft estimate creation', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            linkService.createNewInquiry.mockResolvedValue({ inquiryId: 42, contactId: 7 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 99,
                inquiry_id: 42,
                template: intakeTemplate,
            });

            await service.createSubmission(
                { template_id: 1, create_inquiry: true, responses: { guest_count: '120' } },
                1,
            );

            expect(linkService.createNewInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(42);
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 42,
                        contact_id: 7,
                        status: 'submitted',
                    }),
                }),
            );
        });

        it('routes DISCOVERY_CALL submissions without inquiry creation or estimate generation', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 100,
                inquiry_id: 42,
                template: discoveryTemplate,
            });

            await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 42,
                    responses: { vibe: 'romantic' },
                    call_notes: 'Great chemistry',
                    transcript: 'Hello...',
                    call_duration_seconds: 900,
                },
                1,
            );

            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 42,
                        call_notes: 'Great chemistry',
                        transcript: 'Hello...',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(42, 'Discovery Call');
        });

        it('does not fail DISCOVERY_CALL submission when task auto-complete throws', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
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

    describe('updateSubmissionResponses', () => {
        it('merges new responses onto existing payload', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 10,
                responses: { guest_count: '100', notes: 'old' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 5,
                responses: { guest_count: '150', notes: 'old' },
            });

            await service.updateSubmissionResponses(5, { guest_count: '150' });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { responses: { guest_count: '150', notes: 'old' } },
                }),
            );
            expect(prisma.inquiries.update).not.toHaveBeenCalled();
        });

        it('syncs preferred payment schedule template id to the linked inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 10,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 5 });
            prisma.inquiries.update.mockResolvedValue({ id: 10 });

            await service.updateSubmissionResponses(5, { payment_schedule_template_id: 33 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { preferred_payment_schedule_template_id: 33 },
            });
        });

        it('clears inquiry payment schedule when response is non-numeric', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 10,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 5 });

            await service.updateSubmissionResponses(5, { payment_schedule_template_id: null });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);
            await expect(service.updateSubmissionResponses(999, {})).rejects.toThrow(NotFoundException);
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 8,
                inquiry_id: 20,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 8,
                reviewed_at: new Date(),
            });

            await service.reviewSubmission(8, 1, {
                review_notes: 'Looks good',
                review_checklist_state: { contact_verified: true },
            });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { contact_verified: true },
                        reviewed_at: expect.any(Date),
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(20, 'Review Inquiry');
        });
    });

    describe('convertSubmission', () => {
        it('returns submission unchanged when inquiry already linked', async () => {
            const existing = { id: 3, inquiry_id: 15, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(existing);

            const result = await service.convertSubmission(3, 1);

            expect(result).toBe(existing);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });

        it('creates inquiry from responses when submission is unlinked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 3,
                inquiry_id: null,
                responses: { contact_email: 'new@example.com' },
            });
            linkService.createInquiryFromResponses.mockResolvedValue(77);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 3,
                inquiry_id: 77,
                status: 'converted',
            });

            const result = await service.convertSubmission(3, 1);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { contact_email: 'new@example.com' },
                1,
            );
            expect(result.inquiry_id).toBe(77);
        });
    });
});
