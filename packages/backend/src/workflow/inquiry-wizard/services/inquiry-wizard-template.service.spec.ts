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
        findMany: jest.fn(),
    },
    package_sets: {
        findMany: jest.fn(),
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
        service = module.get<InquiryWizardTemplateService>(InquiryWizardTemplateService);
    });

    describe('getActiveTemplate', () => {
        it('requires brandId for DISCOVERY_CALL stage', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toThrow(NotFoundException);
        });

        it('creates default discovery-call template when none exists', async () => {
            const created = { id: 1, stage: InquiryWizardStage.DISCOVERY_CALL };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(5, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 5,
                        stage: InquiryWizardStage.DISCOVERY_CALL,
                        description: expect.stringContaining(`[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`),
                    }),
                }),
            );
        });

        it('auto-resets stale discovery-call template when version tag is missing', async () => {
            const stale = {
                id: 9,
                brand_id: 5,
                is_active: true,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: 'Old template without version tag',
            };
            const reset = { id: 10, stage: InquiryWizardStage.DISCOVERY_CALL };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 1 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(reset);

            const result = await service.getActiveTemplate(5, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(reset);
            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 9 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 9 },
            });
        });

        it('returns existing discovery template when version tag is current', async () => {
            const current = {
                id: 11,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(5, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(current);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });

        it('creates default INTAKE template when brand has no active intake template', async () => {
            const created = { id: 2, stage: InquiryWizardStage.INTAKE };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(3, InquiryWizardStage.INTAKE);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 3,
                        name: 'Sales Inquiry Wizard',
                        status: 'live',
                    }),
                }),
            );
        });
    });

    describe('findByShareToken', () => {
        it('throws when share token is inactive or missing', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);
            await expect(service.findByShareToken('bad-token')).rejects.toThrow(NotFoundException);

            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: false,
                brand_id: 1,
            });
            await expect(service.findByShareToken('inactive-token')).rejects.toThrow(NotFoundException);
        });

        it('returns template with active packages and package sets', async () => {
            const template = {
                id: 4,
                is_active: true,
                brand_id: 2,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);
            prisma.service_packages.findMany.mockResolvedValue([{ id: 100 }]);
            prisma.package_sets.findMany.mockResolvedValue([{ id: 200, slots: [] }]);

            const result = await service.findByShareToken('share-token');

            expect(result.packages).toEqual([{ id: 100 }]);
            expect(result.package_sets).toEqual([{ id: 200, slots: [] }]);
        });
    });

    describe('generateShareToken', () => {
        it('reuses existing share token when already set', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 7,
                brand_id: 1,
                share_token: 'existing-token',
            });

            const token = await service.generateShareToken(7, 1);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });

        it('generates and persists a new share token when absent', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 7,
                brand_id: 1,
                share_token: null,
            });
            prisma.inquiry_wizard_templates.update.mockResolvedValue({});

            const token = await service.generateShareToken(7, 1);

            expect(token).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
            expect(prisma.inquiry_wizard_templates.update).toHaveBeenCalledWith({
                where: { id: 7 },
                data: { share_token: token },
            });
        });
    });
});
