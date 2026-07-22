import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryCrudService } from '../../inquiries/services/inquiry-crud.service';
import { InquiryPackageService } from '../../inquiries/services/inquiry-package.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';

const buildPrisma = () => ({
    inquiries: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    contacts: {
        update: jest.fn(),
    },
});

describe('InquiryWizardLinkService', () => {
    let service: InquiryWizardLinkService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(async () => {
        prisma = buildPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardLinkService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryCrudService, useValue: {} },
                { provide: InquiryPackageService, useValue: { handlePackageSelection: jest.fn() } },
                { provide: InquiryTasksService, useValue: { syncReviewInquiryAutoSubtasks: jest.fn() } },
                { provide: InquiryWizardPrefillService, useValue: { prefillLocationSlots: jest.fn(), prefillSubjectNames: jest.fn() } },
            ],
        }).compile();
        service = module.get(InquiryWizardLinkService);
    });

    describe('linkToExistingInquiry', () => {
        it('rejects archived inquiries', async () => {
            prisma.inquiries.findUnique.mockResolvedValue({
                id: 42,
                contact_id: 7,
                archived_at: new Date('2026-01-01'),
                status: 'Booked',
                contact: { id: 7, first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: null },
            });

            await expect(
                service.linkToExistingInquiry({ inquiry_id: 42, template_id: 1, responses: {} }, 1),
            ).rejects.toThrow(BadRequestException);
            expect(prisma.inquiries.update).not.toHaveBeenCalled();
        });

        it('rejects missing inquiries', async () => {
            prisma.inquiries.findUnique.mockResolvedValue(null);

            await expect(
                service.linkToExistingInquiry({ inquiry_id: 42, template_id: 1, responses: {} }, 1),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
