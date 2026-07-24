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
                { provide: InquiryTasksService, useValue: inquiryTasksService },
                { provide: InquiryWizardTemplateService, useValue: templateService },
                { provide: InquiryWizardEstimateService, useValue: estimateService },
                { provide: InquiryWizardLinkService, useValue: linkService },
            ],
        }).compile();

        service = module.get(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('creates discovery-call submissions without linking or estimate generation', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 3,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            const created = {
                id: 50,
                inquiry_id: 9,
                call_notes: 'Great rapport',
                transcript: 'Hello there',
            };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const result = await service.createSubmission(
                {
                    template_id: 3,
                    inquiry_id: 9,
                    responses: { venue_story: 'Beach ceremony' },
                    call_notes: 'Great rapport',
                    transcript: 'Hello there',
                    call_duration_seconds: 900,
                },
                1,
            );

            expect(result).toEqual(created);
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        inquiry_id: 9,
                        call_notes: 'Great rapport',
                        transcript: 'Hello there',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(9, 'Discovery Call');
        });

        it('auto-creates a draft estimate for intake submissions linked to an inquiry', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
            });
            linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 12, contactId: 44 });
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 60, inquiry_id: 12 });

            await service.createSubmission(
                {
                    template_id: 1,
                    inquiry_id: 12,
                    responses: { event_type: 'wedding' },
                },
                1,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(12);
        });
    });

    describe('convertSubmission', () => {
        it('returns the submission unchanged when it already has an inquiry', async () => {
            const existing = { id: 8, inquiry_id: 15, responses: {} };
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(existing);

            const result = await service.convertSubmission(8, 1);

            expect(result).toBe(existing);
            expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
        });
    });

    describe('updateSubmissionResponses', () => {
        it('merges responses and syncs payment schedule template to the inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 21,
                inquiry_id: 33,
                responses: { budget: '5000' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({
                id: 21,
                responses: { budget: '5000', payment_schedule_template_id: 7 },
            });

            await service.updateSubmissionResponses(21, { payment_schedule_template_id: 7 });

            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        responses: {
                            budget: '5000',
                            payment_schedule_template_id: 7,
                        },
                    },
                }),
            );
            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 33 },
                data: { preferred_payment_schedule_template_id: 7 },
            });
        });

        it('throws when submission does not exist', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);
            await expect(
                service.updateSubmissionResponses(404, { budget: '1' }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
