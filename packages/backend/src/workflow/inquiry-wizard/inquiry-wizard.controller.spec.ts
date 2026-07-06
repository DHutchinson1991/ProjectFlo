import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardController } from './inquiry-wizard.controller';
import { InquiryWizardTemplateService } from './services/inquiry-wizard-template.service';
import { InquiryWizardSubmissionService } from './services/inquiry-wizard-submission.service';
import { InquiryWizardConflictService } from './services/inquiry-wizard-conflict.service';

describe('InquiryWizardController', () => {
    let controller: InquiryWizardController;
    const submissionService = {
        listSubmissions: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InquiryWizardController],
            providers: [
                { provide: InquiryWizardTemplateService, useValue: {} },
                { provide: InquiryWizardSubmissionService, useValue: submissionService },
                { provide: InquiryWizardConflictService, useValue: {} },
            ],
        }).compile();

        controller = module.get<InquiryWizardController>(InquiryWizardController);
    });

    it('rejects listing submissions without a brand context', () => {
        expect(() => controller.listSubmissions('', {} as never)).toThrow(NotFoundException);
        expect(submissionService.listSubmissions).not.toHaveBeenCalled();
    });

    it('scopes submission listing to the requested brand', async () => {
        submissionService.listSubmissions.mockResolvedValue([]);

        await controller.listSubmissions('12', {} as never);

        expect(submissionService.listSubmissions).toHaveBeenCalledWith(12, undefined, undefined);
    });
});
