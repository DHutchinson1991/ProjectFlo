import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { DISCOVERY_CALL_TEMPLATE_VERSION } from '../constants/default-discovery-call-template';

const buildPrismaTx = () => ({
    inquiry_wizard_templates: {
        update: jest.fn(),
    },
    inquiry_wizard_questions: {
        deleteMany: jest.fn(),
    },
});

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
    $transaction: jest.fn((fn) => fn(buildPrismaTx())),
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
        it('creates default INTAKE template when none exists for brand', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue({
                id: 1,
                stage: InquiryWizardStage.INTAKE,
                questions: [],
            });

            const result = await service.getActiveTemplate(10, InquiryWizardStage.INTAKE);

            expect(result.stage).toBe(InquiryWizardStage.INTAKE);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 10,
                        name: 'Sales Inquiry Wizard',
                    }),
                }),
            );
        });

        it('throws when INTAKE requested without brand id and no global template', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            await expect(service.getActiveTemplate(undefined, InquiryWizardStage.INTAKE)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('auto-resets stale DISCOVERY_CALL template missing version tag', async () => {
            const staleTemplate = {
                id: 5,
                description: 'Old discovery guide without version tag',
                stage: InquiryWizardStage.DISCOVERY_CALL,
            };
            const freshTemplate = {
                id: 6,
                description: `Updated [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: [],
            };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(staleTemplate)
                .mockResolvedValueOnce(staleTemplate);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 3 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(staleTemplate);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(freshTemplate);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 5 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 5 },
            });
            expect(result.description).toContain(`[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`);
        });

        it('returns current DISCOVERY_CALL template when version tag matches', async () => {
            const current = {
                id: 7,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(current);
            expect(prisma.inquiry_wizard_templates.delete).not.toHaveBeenCalled();
        });
    });

    describe('generateShareToken', () => {
        it('returns existing share token without regenerating', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 1,
                brand_id: 10,
                share_token: 'existing-token',
                questions: [],
            });

            const token = await service.generateShareToken(1, 10);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });

        it('generates and persists a new share token when absent', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 1,
                brand_id: 10,
                share_token: null,
                questions: [],
            });
            prisma.inquiry_wizard_templates.update.mockResolvedValue({});

            const token = await service.generateShareToken(1, 10);

            expect(token).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
            expect(prisma.inquiry_wizard_templates.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { share_token: token },
            });
        });
    });

    describe('findByShareToken', () => {
        it('throws when template is inactive or missing', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: false,
                brand_id: 10,
            });

            await expect(service.findByShareToken('bad-token')).rejects.toThrow(NotFoundException);
        });
    });
});
