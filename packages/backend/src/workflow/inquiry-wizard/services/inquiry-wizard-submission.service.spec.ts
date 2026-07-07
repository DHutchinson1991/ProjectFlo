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
    let estimateService: { autoCreateDraftEstimate: jest.Mock };
    let linkService: {
        linkToExistingInquiry: jest.Mock;
        createNewInquiry: jest.Mock;
        createInquiryFromResponses: jest.Mock;
    };
    let inquiryTasksService: { autoCompleteByName: jest.Mock };

    const intakeTemplate = { id: 1, stage: InquiryWizardStage.INTAKE };
    const discoveryTemplate = { id: 2, stage: InquiryWizardStage.DISCOVERY_CALL };

    beforeEach(async () => {
        prisma = buildPrisma();
        templateService = {
            getTemplateById: jest.fn(),
            findByShareToken: jest.fn(),
        };
        estimateService = { autoCreateDraftEstimate: jest.fn().mockResolvedValue(undefined) };
        linkService = {
            linkToExistingInquiry: jest.fn().mockResolvedValue({ inquiryId: 10, contactId: 20 }),
            createNewInquiry: jest.fn().mockResolvedValue({ inquiryId: 11, contactId: 21 }),
            createInquiryFromResponses: jest.fn().mockResolvedValue(12),
        };
        inquiryTasksService = { autoCompleteByName: jest.fn().mockResolvedValue(undefined) };

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

    describe('listSubmissions', () => {
        it('filters by wizard stage when provided', async () => {
            prisma.inquiry_wizard_submissions.findMany.mockResolvedValue([]);

            await service.listSubmissions(1, 5, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_submissions.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        brand_id: 1,
                        inquiry_id: 5,
                        template: { stage: InquiryWizardStage.DISCOVERY_CALL },
                    },
                }),
            );
        });
    });

    describe('createSubmission', () => {
        it('routes DISCOVERY_CALL submissions without inquiry linking or estimate creation', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            const created = { id: 99, inquiry_id: 10 };
            prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

            const result = await service.createSubmission(
                {
                    template_id: 2,
                    inquiry_id: 10,
                    responses: { couple_story: 'Met at university' },
                    call_notes: 'Warm call',
                    transcript: 'Hello there',
                    call_duration_seconds: 900,
                },
                1,
            );

            expect(result).toBe(created);
            expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
            expect(linkService.createNewInquiry).not.toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        template_id: 2,
                        inquiry_id: 10,
                        call_notes: 'Warm call',
                        transcript: 'Hello there',
                        call_duration_seconds: 900,
                    }),
                }),
            );
            expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(10, 'Discovery Call');
        });

        it('does not fail DISCOVERY_CALL submission when task auto-complete errors', async () => {
            templateService.getTemplateById.mockResolvedValue(discoveryTemplate);
            inquiryTasksService.autoCompleteByName.mockRejectedValue(new Error('task missing'));
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 100 });

            await expect(
                service.createSubmission(
                    { template_id: 2, inquiry_id: 10, responses: {} },
                    1,
                ),
            ).resolves.toEqual({ id: 100 });
        });

        it('links inquiry and creates draft estimate for INTAKE submissions', async () => {
            templateService.getTemplateById.mockResolvedValue(intakeTemplate);
            prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 50, inquiry_id: 10 });

            await service.createSubmission(
                {
                    template_id: 1,
                    inquiry_id: 10,
                    responses: { wedding_date: '2026-09-01' },
                },
                1,
            );

            expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
            expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(10);
            expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
        });
    });

    describe('updateSubmission', () => {
        it('patches discovery call fields on an existing submission', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({ id: 7, brand_id: 1 });
            const updated = { id: 7, call_notes: 'Updated notes' };
            prisma.inquiry_wizard_submissions.update.mockResolvedValue(updated);

            const result = await service.updateSubmission(
                7,
                { call_notes: 'Updated notes', call_duration_seconds: 1200 },
                1,
            );

            expect(result).toBe(updated);
            expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 7 },
                    data: {
                        call_notes: 'Updated notes',
                        call_duration_seconds: 1200,
                    },
                }),
            );
        });

        it('throws when submission is not found', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);

            await expect(
                service.updateSubmission(7, { call_notes: 'nope' }, 1),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('updateSubmissionResponses', () => {
        it('syncs preferred payment schedule template id to the linked inquiry', async () => {
            prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
                id: 8,
                inquiry_id: 15,
                responses: { wedding_date: '2026-09-01' },
            });
            prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 8 });
            prisma.inquiries.update.mockResolvedValue({ id: 15 });

            await service.updateSubmissionResponses(8, { payment_schedule_template_id: 33 });

            expect(prisma.inquiries.update).toHaveBeenCalledWith({
                where: { id: 15 },
                data: { preferred_payment_schedule_template_id: 33 },
            });
        });
    });
});
