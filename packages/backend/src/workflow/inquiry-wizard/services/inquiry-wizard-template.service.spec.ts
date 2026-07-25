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

    describe('getActiveTemplate', () => {
        it('returns existing INTAKE template when one is active', async () => {
            const template = { id: 1, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(template);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.INTAKE);

            expect(result).toBe(template);
        });

        it('creates default INTAKE template when none exists for brand', async () => {
            const created = { id: 2, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.INTAKE);

            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
            expect(result).toBe(created);
        });

        it('throws when INTAKE template requested without brand id and none exists globally', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);

            await expect(service.getActiveTemplate(undefined, InquiryWizardStage.INTAKE))
                .rejects.toBeInstanceOf(NotFoundException);
        });

        it('creates default DISCOVERY_CALL template when brand has none', async () => {
            const created = {
                id: 3,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: `[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        stage: InquiryWizardStage.DISCOVERY_CALL,
                    }),
                }),
            );
        });

        it('resets stale DISCOVERY_CALL template when version tag is outdated', async () => {
            const stale = {
                id: 4,
                description: 'Old template without version tag',
                questions: [],
            };
            const refreshed = {
                id: 5,
                description: `[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 3 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(refreshed);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalled();
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalled();
            expect(result).toBe(refreshed);
        });
    });

    describe('generateShareToken', () => {
        it('returns existing share token without updating', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 1,
                share_token: 'existing-token',
            });

            const token = await service.generateShareToken(1, 1);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });

        it('generates and persists a new share token when missing', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 1,
                share_token: null,
            });
            prisma.inquiry_wizard_templates.update.mockResolvedValue({});

            const token = await service.generateShareToken(1, 1);

            expect(token).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
            expect(prisma.inquiry_wizard_templates.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 1 } }),
            );
        });
    });

    describe('findByShareToken', () => {
        it('throws when template is missing or inactive', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);

            await expect(service.findByShareToken('bad-token'))
                .rejects.toBeInstanceOf(NotFoundException);
        });

        it('returns template with packages and package sets when active', async () => {
            const template = {
                id: 1,
                brand_id: 1,
                is_active: true,
                questions: [],
                brand: { id: 1, name: 'Brand' },
            };
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);

            const result = await service.findByShareToken('valid-token');

            expect(result.packages).toEqual([]);
            expect(result.package_sets).toEqual([]);
            expect(prisma.service_packages.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { brand_id: 1, is_active: true } }),
            );
        });
    });
});
