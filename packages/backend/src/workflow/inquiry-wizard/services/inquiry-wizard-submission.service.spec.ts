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

        service = module.get(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('routes DISCOVERY_CALL submissions without inquiry linking or estimates', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            const created = {
                id: 10,
                inquiry_id: 5,
                template: { questions: [] },
                inquiry: { id: 5 },
                contact: null,
            };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const result = await service.createSubmission({
                template_id: 2,
                inquiry_id: 5,
                responses: { vibe: 'romantic' },
                call_notes: 'Great chemistry',
                transcript: 'Hello there',
                sentiment: { score: 0.8 },
                call_duration_seconds: 900,
            }, 1);

            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 5,
                        call_notes: 'Great chemistry',
                        transcript: 'Hello there',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(5, 'Discovery Call');
            expect(result).toEqual(created);
        });

        it('creates INTAKE submissions via inquiry linking and draft estimate', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 8, contactId: 3 });
            const created = {
                id: 11,
                inquiry_id: 8,
                template: { questions: [] },
                inquiry: { id: 8, portal_token: 'token' },
                contact: { id: 3 },
            };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            await service.createSubmission({
                template_id: 1,
                inquiry_id: 8,
                responses: { guest_count: '120' },
            }, 1);

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(8);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
        });
    });

    describe('convertSubmission', () => {
        it('returns the submission unchanged when inquiry_id already exists', async () => {
            const submission = {
                id: 3,
                inquiry_id: 12,
                responses: {},
                template: { questions: [] },
                inquiry: { id: 12 },
                contact: null,
            };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(submission);

            const result = await service.convertSubmission(3, 1);

            expect(result).toEqual(submission);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.update).not.toHaveBeenCalled();
        });
    });

    describe('reviewSubmission', () => {
        it('marks submission reviewed and auto-completes Review Inquiry task', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 4,
                inquiry_id: 15,
            });
            const updated = {
                id: 4,
                reviewed_at: new Date(),
                review_notes: 'Looks good',
                template: { questions: [] },
                inquiry: { id: 15 },
                contact: null,
            };
            prisma.inquiry_wizard_submissions.update.mockResolvedValue(updated);

            const result = await service.reviewSubmission(4, 1, {
                review_notes: 'Looks good',
                review_checklist_state: { package: true },
            });

            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(15, 'Review Inquiry');
            expect(result.review_notes).toBe('Looks good');
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs preferred payment schedule to inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 6,
                inquiry_id: 20,
                responses: { guest_count: '100' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 6,
                responses: { guest_count: '100', payment_schedule_template_id: 77 },
                template: { questions: [] },
                inquiry: { id: 20, portal_token: 'abc' },
            });

            await service.updateSubmissionResponses(6, { payment_schedule_template_id: 77 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 20 },
                data: { preferred_payment_schedule_template_id: 77 },
            });
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { responses: { guest_count: '100', payment_schedule_template_id: 77 } },
                }),
            );
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);
            await expect(
                service.updateSubmissionResponses(999, { notes: 'x' }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
