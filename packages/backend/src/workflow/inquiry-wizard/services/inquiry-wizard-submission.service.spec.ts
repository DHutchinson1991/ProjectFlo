import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

describe('InquiryWizardSubmissionService', () => {
    let service: InquiryWizardSubmissionService;
    const prisma = {
        inquiry_wizard_submissions: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        inquiries: {
            findFirst: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardSubmissionService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryTasksService, useValue: {} },
                { provide: InquiryWizardTemplateService, useValue: {} },
                { provide: InquiryWizardEstimateService, useValue: {} },
                { provide: InquiryWizardLinkService, useValue: {} },
            ],
        }).compile();

        service = module.get<InquiryWizardSubmissionService>(InquiryWizardSubmissionService);
    });

    it('always filters listSubmissions by brand_id', async () => {
        prisma.inquiry_wizard_submissions.findMany.mockResolvedValue([]);

        await service.listSubmissions(7);

        expect(prisma.inquiry_wizard_submissions.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ brand_id: 7 }),
            }),
        );
    });

    it('rejects discovery-call submissions for inquiries outside the brand', async () => {
        prisma.inquiries.findFirst.mockResolvedValue(null);

        await expect(
            service['createDiscoveryCallSubmission'](
                {
                    template_id: 1,
                    responses: {},
                    inquiry_id: 99,
                },
                3,
                10,
            ),
        ).rejects.toThrow(NotFoundException);
    });
});
