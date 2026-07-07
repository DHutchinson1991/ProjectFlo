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
        delete: jest.fn(),
        update: jest.fn(),
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
    $transaction: jest.fn(),
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

    describe('getActiveTemplate DISCOVERY_CALL', () => {
        it('requires brand id for discovery-call templates', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('creates a default discovery-call template when none exists', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            const created = { id: 5, stage: InquiryWizardStage.DISCOVERY_CALL, questions: [] };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 1,
                        stage: InquiryWizardStage.DISCOVERY_CALL,
                        description: expect.stringContaining(`[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`),
                    }),
                }),
            );
        });

        it('auto-resets stale discovery-call templates missing the version tag', async () => {
            const stale = {
                id: 9,
                description: 'Old discovery guide without version tag',
            };
            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 3 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            const recreated = { id: 10, stage: InquiryWizardStage.DISCOVERY_CALL, questions: [] };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(recreated);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 9 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(recreated);
        });

        it('returns current discovery-call template when version tag is present', async () => {
            const current = {
                id: 11,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(current);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_templates.delete).not.toHaveBeenCalled();
        });
    });

    describe('listTemplates', () => {
        it('filters templates by stage when provided', async () => {
            prisma.inquiry_wizard_templates.findMany.mockResolvedValue([]);

            await service.listTemplates(1, InquiryWizardStage.INTAKE);

            expect(prisma.inquiry_wizard_templates.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { brand_id: 1, stage: InquiryWizardStage.INTAKE },
                }),
            );
        });
    });
});
