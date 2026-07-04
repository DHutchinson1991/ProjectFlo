import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryCrudService } from '../../inquiries/services/inquiry-crud.service';
import { InquiryPackageService } from '../../inquiries/services/inquiry-package.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';

describe('InquiryWizardLinkService', () => {
  let service: InquiryWizardLinkService;
  let prisma: {
    inquiries: { findUnique: jest.Mock; update: jest.Mock };
    contacts: { update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      inquiries: { findUnique: jest.fn(), update: jest.fn() },
      contacts: { update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        InquiryWizardLinkService,
        { provide: PrismaService, useValue: prisma },
        { provide: InquiryCrudService, useValue: {} },
        { provide: InquiryPackageService, useValue: {} },
        { provide: InquiryTasksService, useValue: { syncReviewInquiryAutoSubtasks: jest.fn() } },
        { provide: InquiryWizardPrefillService, useValue: { prefillLocationSlots: jest.fn(), prefillSubjectNames: jest.fn() } },
      ],
    }).compile();

    service = module.get(InquiryWizardLinkService);
  });

  describe('linkToExistingInquiry', () => {
    it('rejects cross-brand inquiry linking', async () => {
      prisma.inquiries.findUnique.mockResolvedValue({
        id: 5,
        contact_id: 1,
        contact: { id: 1, brand_id: 99, first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: null },
      });

      await expect(
        service.linkToExistingInquiry(
          { inquiry_id: 5, template_id: 1, responses: {} },
          1,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects missing inquiry', async () => {
      prisma.inquiries.findUnique.mockResolvedValue(null);

      await expect(
        service.linkToExistingInquiry(
          { inquiry_id: 5, template_id: 1, responses: {} },
          1,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
