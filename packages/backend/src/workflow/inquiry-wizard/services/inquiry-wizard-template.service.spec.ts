import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DISCOVERY_CALL_TEMPLATE_VERSION } from '../constants/default-discovery-call-template';

const buildPrisma = () => ({
    inquiry_wizard_templates: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    inquiry_wizard_questions: {
        deleteMany: jest.fn(),
    },
    service_packages: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    package_sets: {
        findMany: jest.fn().mockResolvedValue([]),
    },
});

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
        it('creates a default INTAKE template when none exists', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            const created = { id: 1, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(5, InquiryWizardStage.INTAKE);

            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
            expect(result).toEqual(created);
        });

        it('auto-resets stale DISCOVERY_CALL templates missing the version tag', async () => {
            const staleTemplate = {
                id: 9,
                description: 'Old discovery template without version tag',
                is_active: true,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(staleTemplate)
                .mockResolvedValueOnce(staleTemplate);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 3 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue({ id: 9 });
            const recreated = {
                id: 10,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: `[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(recreated);

            const result = await service.getActiveTemplate(5, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({ where: { template_id: 9 } });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toEqual(recreated);
        });

        it('requires brandId for DISCOVERY_CALL templates', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('generateShareToken', () => {
        it('returns an existing share token without updating', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 3,
                share_token: 'existing-token',
            });

            const token = await service.generateShareToken(3, 1);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });

        it('creates a share token when missing', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({ id: 3, share_token: null });
            prisma.inquiry_wizard_templates.update.mockResolvedValue({ id: 3 });

            const token = await service.generateShareToken(3, 1);

            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(10);
            expect(prisma.inquiry_wizard_templates.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 3 },
                    data: { share_token: token },
                }),
            );
        });
    });

    describe('findByShareToken', () => {
        it('throws when template is missing or inactive', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);
            await expect(service.findByShareToken('bad-token')).rejects.toThrow(NotFoundException);

            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: false,
                brand_id: 1,
            });
            await expect(service.findByShareToken('inactive')).rejects.toThrow(NotFoundException);
        });
    });
});
