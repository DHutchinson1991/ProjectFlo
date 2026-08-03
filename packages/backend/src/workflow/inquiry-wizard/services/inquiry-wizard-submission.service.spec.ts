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

    const intakeTemplate = {
        id: 1,
        stage: InquiryWizardStage.INTAKE,
        brand_id: 10,
        questions: [],
    };

    const discoveryTemplate = {
        id: 2,
        stage: InquiryWizardStage.DISCOVERY_CALL,
        brand_id: 10,
        questions: [],
    };

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
                { provide: InquiryWizardTemplateService, useValue: templateService },
                { provide: InquiryWizardEstimateService, useValue: estimateService },
                { provide: InquiryWizardLinkService, useValue: linkService },
                { provide: InquiryTasksService, useValue: inquiryTasksService },
            ],
        }).compile();

        service = module.get(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('routes INTAKE submissions through inquiry linking and draft estimate creation', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            linkService.createNewInquiry.mockResolvedValue({ inquiryId: 42, contactId: 7 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 99,
                inquiry_id: 42,
                template: intakeTemplate,
                inquiry: { id: 42, portal_token: 'tok' },
                contact: { id: 7 },
            });

            const result = await service.createSubmission(
                {
                    template_id: 1,
                    create_inquiry: true,
                    contact: { first_name: 'Sam', last_name: 'Taylor', email: 'sam@example.com' },
                    responses: { selected_package: 5 },
                },
                10,
            );

            expect(linkService.createNewInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(42);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
            expect(result.id).toBe(99);
        });

        it('routes DISCOVERY_CALL submissions without inquiry creation or estimates', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 100,
                inquiry_id: 42,
                call_notes: 'Great rapport',
                template: discoveryTemplate,
                inquiry: { id: 42 },
                contact: null,
            });

            const result = await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 42,
                    responses: { venue_story: 'Chose the garden' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello there',
                    call_duration_seconds: 900,
                },
                10,
            );

            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 42,
                        call_notes: 'Great rapport',
                        transcript: 'Hello there',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(42, 'Discovery Call');
            expect(result.id).toBe(100);
        });

        it('does not fail DISCOVERY_CALL submission when task auto-complete errors', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 101,
                inquiry_id: 42,
                template: discoveryTemplate,
                inquiry: { id: 42 },
                contact: null,
            });

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 42, responses: {} },
                    10,
                ),
            ).resolves.toMatchObject({ id: 101 });
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 42,
                responses: { selected_package: 3 },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 5,
                responses: { selected_package: 3, payment_schedule_template_id: 8 },
            });

            await service.updateSubmissionResponses(5, { payment_schedule_template_id: 8 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 42 },
                data: { preferred_payment_schedule_template_id: 8 },
            });
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: { selected_package: 3, payment_schedule_template_id: 8 },
                    },
                }),
            );
        });

        it('clears inquiry payment schedule when template id is non-numeric', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 5,
                inquiry_id: 42,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 5 });

            await service.updateSubmissionResponses(5, { payment_schedule_template_id: null });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 42 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws NotFoundException when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);

            await expect(
                service.updateSubmissionResponses(99, { foo: 'bar' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 8,
                brand_id: 10,
                inquiry_id: 42,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 8,
                reviewed_at: new Date(),
                review_notes: 'Looks good',
            });

            await service.reviewSubmission(8, 10, {
                review_notes: 'Looks good',
                review_checklist_state: { package_ok: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(42, 'Review Inquiry');
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { package_ok: true },
                    }),
                }),
            );
        });
    });

    describe('convertSubmission', () => {
        it('returns existing submission when inquiry is already linked', async () => {
            const existing = { id: 3, inquiry_id: 42, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(existing);

            const result = await service.convertSubmission(3, 10);

            expect(result).toBe(existing);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });
    });
});
