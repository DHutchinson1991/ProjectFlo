import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

const buildPrisma = () => ({
    inquiries: {
        findUnique: jest.fn(),
    },
    inquiry_wizard_submissions: {
        create: jest.fn(),
    },
});

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    let prisma: ReturnType<typeof buildPrisma>;
    let templateService: { getTemplateById: jest.Mock };

    beforeEach(async () => {
        prisma = buildPrisma();
        templateService = { getTemplateById: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardSubmissionService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryTasksService, useValue: { autoCompleteByName: jest.fn() } },
                { provide: InquiryWizardTemplateService, useValue: templateService },
                { provide: InquiryWizardEstimateService, useValue: { autoCreateDraftEstimate: jest.fn() } },
                { provide: InquiryWizardLinkService, useValue: { linkToExistingInquiry: jest.fn() } },
            ],
        }).compile();
        service = module.get(InquiryWizardSubmissionService);
    });

    describe('createSubmission', () => {
        it('rejects discovery call submissions for archived inquiries', async () => {
            templateService.getTemplateById.mockResolvedValue({
                id: 3,
                stage: InquiryWizardStage.DISCOVERY_CALL,
            });
            prisma.inquiries.findUnique.mockResolvedValue({
                id: 42,
                archived_at: new Date('2026-01-01'),
                status: 'Booked',
            });

            await expect(
                service.createSubmission({
                    template_id: 3,
                    inquiry_id: 42,
                    responses: {},
                }, 1),
            ).rejects.toThrow(BadRequestException);
            expect(prisma.inquiry_wizard_submissions.create).not.toHaveBeenCalled();
        });
    });
});
