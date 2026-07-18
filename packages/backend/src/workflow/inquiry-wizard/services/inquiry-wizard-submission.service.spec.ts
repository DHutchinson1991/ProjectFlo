import { BadRequestException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';

describe('InquiryWizardSubmissionService.reviewSubmission', () => {
    const prisma = {
        inquiry_wizard_submissions: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    };

    const inquiryTasksService = {
        autoCompleteByName: jest.fn(),
    };

    const service = new InquiryWizardSubmissionService(
        prisma as never,
        inquiryTasksService as never,
        {} as never,
        {} as never,
        {} as never,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects review for DISCOVERY_CALL-stage submissions', async () => {
        prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
            id: 42,
            brand_id: 1,
            inquiry_id: 9,
            template: { stage: InquiryWizardStage.DISCOVERY_CALL, questions: [] },
        });

        await expect(
            service.reviewSubmission(42, 1, { review_notes: 'looks good' }),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(prisma.inquiry_wizard_submissions.update).not.toHaveBeenCalled();
        expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
    });

    it('completes Review Inquiry for INTAKE-stage submissions', async () => {
        prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
            id: 7,
            brand_id: 1,
            inquiry_id: 3,
            template: { stage: InquiryWizardStage.INTAKE, questions: [] },
        });
        prisma.inquiry_wizard_submissions.update.mockResolvedValue({
            id: 7,
            inquiry_id: 3,
            template: { stage: InquiryWizardStage.INTAKE, questions: [] },
        });

        await service.reviewSubmission(7, 1, { review_notes: 'approved' });

        expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalled();
        expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(3, 'Review Inquiry');
    });
});
