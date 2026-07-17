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
        it('throws when DISCOVERY_CALL is requested without brandId', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toThrow(NotFoundException);
        });

        it('returns existing discovery template when version tag is current', async () => {
            const current = {
                id: 3,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(current);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });

        it('resets stale discovery templates missing the current version tag', async () => {
            const stale = { id: 4, description: 'Old guide [v1]' };
            const recreated = { id: 5, description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]` };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(recreated);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 4 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 4 },
            });
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
            expect(result).toBe(recreated);
        });

        it('creates default INTAKE template when brand has none', async () => {
            const created = { id: 6, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(2, InquiryWizardStage.INTAKE);

            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 2,
                        is_active: true,
                        status: 'live',
                    }),
                }),
            );
            expect(result).toBe(created);
        });
    });

    describe('findByShareToken', () => {
        it('throws when share token is missing or inactive', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);

            await expect(service.findByShareToken('bad-token')).rejects.toThrow(
                'Questionnaire not found or no longer active',
            );
        });

        it('returns template with packages and package sets when active', async () => {
            const template = {
                id: 7,
                brand_id: 1,
                is_active: true,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);
            prisma.service_packages.findMany.mockResolvedValue([{ id: 1, name: 'Gold' }]);
            prisma.package_sets.findMany.mockResolvedValue([{ id: 2, slots: [] }]);

            const result = await service.findByShareToken('share-token');

            expect(result.packages).toEqual([{ id: 1, name: 'Gold' }]);
            expect(result.package_sets).toEqual([{ id: 2, slots: [] }]);
        });
    });

    describe('generateShareToken', () => {
        it('reuses existing share token when already set', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 8,
                share_token: 'existing-token',
            });

            const token = await service.generateShareToken(8, 1);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });
    });
});
