import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DISCOVERY_CALL_TEMPLATE_VERSION } from '../constants/default-discovery-call-template';

const buildPrisma = () => {
    const prisma = {
        inquiry_wizard_templates: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        inquiry_wizard_questions: { deleteMany: jest.fn() },
        service_packages: { findMany: jest.fn() },
        package_sets: { findMany: jest.fn() },
        $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
    return prisma;
};

describe('InquiryWizardTemplateService', () => {
    let service: InquiryWizardTemplateService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(async () => {
        prisma = buildPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardTemplateService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get(InquiryWizardTemplateService);
    });

    describe('getActiveTemplate', () => {
        it('auto-resets stale discovery-call templates missing version tag', async () => {
            const stale = {
                id: 1,
                description: 'Old template without version tag',
            };
            const fresh = { id: 2, description: `[v${DISCOVERY_CALL_TEMPLATE_VERSION}]` };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 5 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(fresh);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result).toBe(fresh);
        });

        it('creates default INTAKE template when none exists for brand', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            const created = { id: 10, stage: InquiryWizardStage.INTAKE };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.INTAKE);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
        });

        it('throws when INTAKE template requested without brandId and none exists', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);

            await expect(service.getActiveTemplate(undefined, InquiryWizardStage.INTAKE)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findByShareToken', () => {
        it('throws when template is inactive', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: false,
                brand_id: 1,
            });

            await expect(service.findByShareToken('bad-token')).rejects.toThrow(NotFoundException);
        });

        it('returns template with packages and package sets when active', async () => {
            const template = { id: 1, is_active: true, brand_id: 1 };
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);
            prisma.service_packages.findMany.mockResolvedValue([{ id: 5 }]);
            prisma.package_sets.findMany.mockResolvedValue([{ id: 2, slots: [] }]);

            const result = await service.findByShareToken('share-token');

            expect(result.packages).toEqual([{ id: 5 }]);
            expect(result.package_sets).toEqual([{ id: 2, slots: [] }]);
        });
    });
});
