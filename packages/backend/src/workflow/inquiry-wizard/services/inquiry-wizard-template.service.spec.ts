import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';

describe('InquiryWizardTemplateService', () => {
    let service: InquiryWizardTemplateService;
    let prisma: {
        inquiry_wizard_templates: {
            findFirst: jest.Mock;
            findUnique: jest.Mock;
            create: jest.Mock;
            update: jest.Mock;
        };
        service_packages: { findMany: jest.Mock };
        package_sets: { findMany: jest.Mock };
    };

    beforeEach(async () => {
        prisma = {
            inquiry_wizard_templates: {
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            service_packages: { findMany: jest.fn().mockResolvedValue([]) },
            package_sets: { findMany: jest.fn().mockResolvedValue([]) },
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                InquiryWizardTemplateService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = moduleRef.get(InquiryWizardTemplateService);
    });

    describe('getActiveTemplate', () => {
        it('requires brand context for INTAKE templates', async () => {
            await expect(service.getActiveTemplate(undefined, InquiryWizardStage.INTAKE)).rejects.toThrow(
                NotFoundException,
            );
            expect(prisma.inquiry_wizard_templates.findFirst).not.toHaveBeenCalled();
        });
    });

    describe('generateShareToken', () => {
        it('rejects DISCOVERY_CALL templates', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 3,
                brand_id: 1,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                share_token: null,
            });

            await expect(service.generateShareToken(3, 1)).rejects.toThrow(BadRequestException);
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });
    });

    describe('findByShareToken', () => {
        it('hides DISCOVERY_CALL templates from public share links', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 3,
                brand_id: 1,
                is_active: true,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: [],
                brand: { id: 1 },
            });

            await expect(service.findByShareToken('secret-token')).rejects.toThrow(NotFoundException);
        });
    });
});
