import { Test } from '@nestjs/testing';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';

describe('InquiryWizardTemplateService', () => {
  let service: InquiryWizardTemplateService;
  let prisma: {
    inquiry_wizard_templates: {
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      create: jest.Mock;
    };
    inquiry_wizard_questions: { deleteMany: jest.Mock };
    inquiry_wizard_submissions: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      inquiry_wizard_templates: {
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
      },
      inquiry_wizard_questions: { deleteMany: jest.fn() },
      inquiry_wizard_submissions: { count: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        InquiryWizardTemplateService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(InquiryWizardTemplateService);
  });

  describe('resetActiveTemplate', () => {
    it('deactivates instead of deleting when submissions exist', async () => {
      prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({ id: 42 });
      prisma.inquiry_wizard_submissions.count.mockResolvedValue(3);
      prisma.inquiry_wizard_templates.create.mockResolvedValue({ id: 99, questions: [] });

      await service.resetActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

      expect(prisma.inquiry_wizard_templates.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { is_active: false },
      });
      expect(prisma.inquiry_wizard_templates.delete).not.toHaveBeenCalled();
      expect(prisma.inquiry_wizard_questions.deleteMany).not.toHaveBeenCalled();
      expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
    });

    it('deletes template when no submissions exist', async () => {
      prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({ id: 42 });
      prisma.inquiry_wizard_submissions.count.mockResolvedValue(0);
      prisma.inquiry_wizard_templates.create.mockResolvedValue({ id: 99, questions: [] });

      await service.resetActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

      expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
        where: { template_id: 42 },
      });
      expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
    });
  });
});
