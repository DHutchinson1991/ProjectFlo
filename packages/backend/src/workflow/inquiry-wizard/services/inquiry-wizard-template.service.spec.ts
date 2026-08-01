import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DISCOVERY_CALL_TEMPLATE_VERSION } from '../constants/default-discovery-call-template';

const buildPrismaTx = () => ({
    inquiry_wizard_templates: {
        findFirst: jest.fn(),
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
        findMany: jest.fn(),
    },
    package_sets: {
        findMany: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: ReturnType<typeof buildPrismaTx>) => unknown) => fn(buildPrismaTx())),
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
        it('requires brandId for DISCOVERY_CALL stage', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('creates default INTAKE template when none exists for brand', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            const created = { id: 1, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.INTAKE);

            expect(result).toEqual(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 1,
                        is_active: true,
                        status: 'live',
                    }),
                }),
            );
        });

        it('auto-resets stale DISCOVERY_CALL template when version tag is missing', async () => {
            const staleTemplate = {
                id: 9,
                description: 'Old discovery template without version tag',
            };
            const freshTemplate = {
                id: 10,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: [],
            };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(staleTemplate)
                .mockResolvedValueOnce(staleTemplate);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 1 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(staleTemplate);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(freshTemplate);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 9 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 9 },
            });
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        description: expect.stringContaining(`[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`),
                        stage: InquiryWizardStage.DISCOVERY_CALL,
                    }),
                }),
            );
            expect(result).toEqual(freshTemplate);
        });

        it('returns current DISCOVERY_CALL template when version tag matches', async () => {
            const current = {
                id: 11,
                description: `Discovery guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toEqual(current);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
            expect(prisma.inquiry_wizard_templates.delete).not.toHaveBeenCalled();
        });
    });

    describe('generateShareToken', () => {
        it('reuses existing share token', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 3,
                share_token: 'existing-token',
            });

            const token = await service.generateShareToken(3, 1);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });

        it('creates share token when missing', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 4,
                share_token: null,
            });
            prisma.inquiry_wizard_templates.update.mockResolvedValue({});

            const token = await service.generateShareToken(4, 1);

            expect(token).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
            expect(prisma.inquiry_wizard_templates.update).toHaveBeenCalledWith({
                where: { id: 4 },
                data: { share_token: token },
            });
        });
    });

    describe('findByShareToken', () => {
        it('throws when template is inactive or missing', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: false,
                brand_id: 1,
            });

            await expect(service.findByShareToken('bad-token')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('returns template with packages and package sets for public wizard', async () => {
            const template = {
                id: 2,
                is_active: true,
                brand_id: 1,
                questions: [],
                brand: { id: 1, name: 'Brand' },
            };
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);
            prisma.service_packages.findMany.mockResolvedValue([{ id: 5, name: 'Gold' }]);
            prisma.package_sets.findMany.mockResolvedValue([{ id: 6, slots: [] }]);

            const result = await service.findByShareToken('share-token');

            expect(result.packages).toEqual([{ id: 5, name: 'Gold' }]);
            expect(result.package_sets).toEqual([{ id: 6, slots: [] }]);
        });
    });
});
