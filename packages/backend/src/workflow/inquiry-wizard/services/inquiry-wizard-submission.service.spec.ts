import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
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

const intakeTemplate = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    brand_id: 10,
    stage: InquiryWizardStage.INTAKE,
    questions: [],
    ...overrides,
});

const discoveryTemplate = (overrides: Record<string, unknown> = {}) => ({
    id: 2,
    brand_id: 10,
    stage: InquiryWizardStage.DISCOVERY_CALL,
    questions: [],
    ...overrides,
});

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: ReturnType<typeof buildPrisma>;
    let templateService: { getTemplateById: jest.Mock; findByShareToken: jest.Mock };
    let estimateService: { autoCreateDraftEstimate: jest.Mock };
    let linkService: {
        linkToExistingInquiry: jest.Mock;
        createNewInquiry: jest.Mock;
        createInquiryFromResponses: jest.Mock;
    };
    let inquiryTasksService: { autoCompleteByName: jest.Mock };

    beforeEach(async () => {
        prisma = buildPrisma();
        templateService = {
            getTemplateById: jest.fn(),
            findByShareToken: jest.fn(),
        };
        estimateService = { autoCreateDraftEstimate: jest.fn() };
        linkService = {
            linkToExistingInquiry: jest.fn(),
            createNewInquiry: jest.fn(),
            createInquiryFromResponses: jest.fn(),
        };
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
        it('routes INTAKE submissions through inquiry linking and auto-creates a draft estimate', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate());
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 42, contactId: 7 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 99,
                inquiry_id: 42,
                template: intakeTemplate(),
            });

            const result = await service.createSubmission(
                { template_id: 1, responses: { wedding_date: '2026-09-01' }, inquiry_id: 42 },
                10,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalledWith(
                expect.objectContaining({ inquiry_id: 42 }),
                10,
            );
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(42);
            expect(result.inquiry_id).toBe(42);
        });

        it('creates a new inquiry when create_inquiry is set on INTAKE submissions', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate());
            linkService.createNewInquiry.mockResolvedValue({ inquiryId: 55, contactId: 8 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 100, inquiry_id: 55 });

            await service.createSubmission(
                { template_id: 1, responses: {}, create_inquiry: true },
                10,
            );

            expect(linkService.createNewInquiry).toHaveBeenCalled();
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(55);
        });

        it('skips inquiry linking and estimate generation for DISCOVERY_CALL submissions', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate());
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({
                id: 101,
                inquiry_id: 42,
                call_notes: 'Great call',
            });

            const result = await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 42,
                    responses: { venue_story: 'Beach wedding' },
                    call_notes: 'Great call',
                    transcript: 'Full transcript',
                    call_duration_seconds: 900,
                },
                10,
            );

            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(42, 'Discovery Call');
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        call_notes: 'Great call',
                        transcript: 'Full transcript',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(result.id).toBe(101);
        });

        it('does not fail DISCOVERY_CALL submission when task auto-complete throws', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate());
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task service down'));
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 102, inquiry_id: 42 });

            await expect(
                service.createSubmission({ template_id: 2, inquiry_id: 42, responses: {} }, 10),
            ).resolves.toEqual(expect.objectContaining({ id: 102 }));
        });
    });

    describe('convertSubmission', () => {
        it('returns the submission unchanged when it already has an inquiry_id', async () => {
            const existing = { id: 5, inquiry_id: 20, responses: {}, brand_id: 10 };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                ...existing,
                template: intakeTemplate(),
                inquiry: null,
                contact: null,
            });

            const result = await service.convertSubmission(5, 10);

            expect(result.inquiry_id).toBe(20);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.update).not.toHaveBeenCalled();
        });

        it('creates an inquiry from responses when submission is unlinked', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 6,
                inquiry_id: null,
                responses: { contact_email: 'couple@example.com' },
                brand_id: 10,
                template: intakeTemplate(),
                inquiry: null,
                contact: null,
            });
            linkService.createInquiryFromResponses.mockResolvedValue(77);
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 6,
                inquiry_id: 77,
                status: 'converted',
            });

            const result = await service.convertSubmission(6, 10);

            expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
                { contact_email: 'couple@example.com' },
                10,
            );
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 6 },
                    data: { inquiry_id: 77, status: 'converted' },
                }),
            );
            expect(result.inquiry_id).toBe(77);
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes the Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 8,
                inquiry_id: 30,
                brand_id: 10,
                template: intakeTemplate(),
                inquiry: null,
                contact: null,
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 8,
                review_notes: 'Looks good',
                reviewed_at: new Date('2026-07-01'),
            });

            await service.reviewSubmission(8, 10, {
                review_notes: 'Looks good',
                review_checklist_state: { package_confirmed: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(30, 'Review Inquiry');
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        review_notes: 'Looks good',
                        review_checklist_state: { package_confirmed: true },
                    }),
                }),
            );
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges new responses with existing ones', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 12,
                inquiry_id: 40,
                responses: { wedding_date: '2026-06-01', guest_count: '100' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 12 });

            await service.updateSubmissionResponses(12, { guest_count: '120', venue_name: 'The Barn' });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            wedding_date: '2026-06-01',
                            guest_count: '120',
                            venue_name: 'The Barn',
                        },
                    },
                }),
            );
        });

        it('syncs payment_schedule_template_id to the linked inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 13,
                inquiry_id: 41,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 13 });
            prisma.inquiries.update.mockResolvedValue({});

            await service.updateSubmissionResponses(13, { payment_schedule_template_id: 5 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 41 },
                data: { preferred_payment_schedule_template_id: 5 },
            });
        });

        it('clears preferred payment schedule when template id is not a number', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 14,
                inquiry_id: 42,
                responses: {},
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 14 });
            prisma.inquiries.update.mockResolvedValue({});

            await service.updateSubmissionResponses(14, { payment_schedule_template_id: null });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 42 },
                data: { preferred_payment_schedule_template_id: null },
            });
        });

        it('throws NotFoundException when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);

            await expect(
                service.updateSubmissionResponses(999, { guest_count: '50' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getSubmissionById', () => {
        it('throws NotFoundException when submission is missing or belongs to another brand', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);

            await expect(service.getSubmissionById(1, 10)).rejects.toThrow(
                'Inquiry wizard submission not found',
            );
        });
    });
});
