import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
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
        it('returns the existing INTAKE template when one is active', async () => {
            const existing = { id: 1, stage: InquiryWizardStage.INTAKE, is_active: true, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(existing);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.INTAKE);

            expect(result).toBe(existing);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });

        it('creates a default INTAKE template when none exists for the brand', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            const created = { id: 2, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.INTAKE);

            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 10,
                        is_active: true,
                        name: 'Sales Inquiry Wizard',
                    }),
                }),
            );
            expect(result).toBe(created);
        });

        it('throws when INTAKE is requested without a brand id and no global template exists', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);

            await expect(service.getActiveTemplate(undefined, InquiryWizardStage.INTAKE)).rejects.toThrow(
                'No active inquiry wizard template found',
            );
        });

        it('throws when DISCOVERY_CALL is requested without a brand id', async () => {
            await expect(service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL)).rejects.toThrow(
                'No active discovery-call template found',
            );
        });

        it('auto-resets stale DISCOVERY_CALL templates missing the current version tag', async () => {
            const stale = {
                id: 3,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: 'Old template without version tag',
                questions: [],
            };
            const refreshed = { id: 4, stage: InquiryWizardStage.DISCOVERY_CALL, questions: [] };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 5 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(refreshed);

            const resetSpy = jest.spyOn(service, 'resetActiveTemplate').mockResolvedValue(refreshed as never);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.DISCOVERY_CALL);

            expect(resetSpy).toHaveBeenCalledWith(10, InquiryWizardStage.DISCOVERY_CALL);
            expect(result).toBe(refreshed);
        });

        it('keeps DISCOVERY_CALL template when version tag is current', async () => {
            const current = {
                id: 5,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(10, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(current);
        });
    });

    describe('generateShareToken', () => {
        it('reuses an existing share token', async () => {
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

        it('generates and persists a new share token when none exists', async () => {
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
        it('throws when token is unknown or template is inactive', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);

            await expect(service.findByShareToken('bad-token')).rejects.toThrow(
                'Questionnaire not found or no longer active',
            );

            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: false,
                brand_id: 10,
                questions: [],
                brand: {},
            });

            await expect(service.findByShareToken('inactive-token')).rejects.toThrow(
                'Questionnaire not found or no longer active',
            );
        });

        it('returns template with packages and package sets for active share links', async () => {
            const template = {
                id: 1,
                is_active: true,
                brand_id: 10,
                questions: [],
                brand: { id: 10, name: 'Moonrise' },
            };
            const packages = [{ id: 1, name: 'Gold' }];
            const packageSets = [{ id: 2, slots: [] }];

            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);
            prisma.service_packages.findMany.mockResolvedValue(packages);
            prisma.package_sets.findMany.mockResolvedValue(packageSets);

            const result = await service.findByShareToken('valid-token');

            expect(result).toEqual({ ...template, packages, package_sets: packageSets });
        });
    });

    describe('getTemplateById', () => {
        it('throws NotFoundException when template is missing', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);

            await expect(service.getTemplateById(99, 10)).rejects.toThrow(NotFoundException);
        });
    });
});
