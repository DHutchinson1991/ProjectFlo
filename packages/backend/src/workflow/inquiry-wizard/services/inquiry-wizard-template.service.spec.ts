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
        it('returns existing INTAKE template when one is active', async () => {
            const template = { id: 1, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(template);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.INTAKE);

            expect(result).toBe(template);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });

        it('creates default INTAKE template when none exists for brand', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            const created = { id: 2, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.INTAKE);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 10,
                        is_active: true,
                        status: 'live',
                    }),
                }),
            );
        });

        it('throws when INTAKE template requested without brand id', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);

            await expect(service.getActiveTemplate(undefined, InquiryWizardStage.INTAKE)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('auto-resets stale DISCOVERY_CALL template when version tag is missing', async () => {
            const stale = {
                id: 5,
                brand_id: 10,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: 'Old discovery guide without version tag',
                questions: [],
            };
            const refreshed = {
                id: 6,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: `[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 3 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(refreshed);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({ where: { template_id: 5 } });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 5 } });
            expect(result).toBe(refreshed);
        });

        it('keeps current DISCOVERY_CALL template when version tag matches', async () => {
            const current = {
                id: 7,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: `Discovery guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(current);
            expect(prisma.inquiry_wizard_templates.delete).not.toHaveBeenCalled();
        });
    });

    describe('generateShareToken', () => {
        it('returns existing share token without updating', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 1,
                brand_id: 10,
                share_token: 'existing-token',
            });

            const token = await service.generateShareToken(1, 10);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });

        it('creates and persists a new share token when missing', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 1,
                brand_id: 10,
                share_token: null,
            });
            prisma.inquiry_wizard_templates.update.mockResolvedValue({});

            const token = await service.generateShareToken(1, 10);

            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(10);
            expect(prisma.inquiry_wizard_templates.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { share_token: token },
            });
        });
    });

    describe('findByShareToken', () => {
        it('throws when template is inactive or missing', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);

            await expect(service.findByShareToken('bad-token')).rejects.toThrow(NotFoundException);
        });

        it('returns template with packages and package sets for public wizard', async () => {
            const template = {
                id: 1,
                brand_id: 10,
                is_active: true,
                questions: [],
                brand: { id: 10, name: 'Studio' },
            };
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);

            const result = await service.findByShareToken('valid-token');

            expect(result.packages).toEqual([]);
            expect(result.package_sets).toEqual([]);
            expect(prisma.service_packages.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { brand_id: 10, is_active: true } }),
            );
        });
    });
});
