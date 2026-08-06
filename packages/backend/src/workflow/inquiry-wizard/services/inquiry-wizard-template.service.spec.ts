import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DISCOVERY_CALL_TEMPLATE_VERSION } from '../constants/default-discovery-call-template';

describe('InquiryWizardTemplateService', () => {
    let service: InquiryWizardTemplateService;
    let prisma: {
        inquiry_wizard_templates: {
            findFirst: jest.Mock;
            findUnique: jest.Mock;
            findMany: jest.Mock;
            create: jest.Mock;
            update: jest.Mock;
            delete: jest.Mock;
        };
        inquiry_wizard_questions: { deleteMany: jest.Mock };
        service_packages: { findMany: jest.Mock };
        package_sets: { findMany: jest.Mock };
        $transaction: jest.Mock;
    };

    beforeEach(async () => {
        prisma = {
            inquiry_wizard_templates: {
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            inquiry_wizard_questions: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
            service_packages: { findMany: jest.fn().mockResolvedValue([]) },
            package_sets: { findMany: jest.fn().mockResolvedValue([]) },
            $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({
                inquiry_wizard_questions: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
                inquiry_wizard_templates: {
                    update: jest.fn().mockResolvedValue({ id: 1, questions: [] }),
                },
            })),
        };

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

        it('returns existing INTAKE template when one is active', async () => {
            const template = { id: 1, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(template);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.INTAKE);

            expect(result).toBe(template);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });

        it('creates default INTAKE template when none exists for brand', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            const created = { id: 2, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.INTAKE);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 1,
                        name: 'Sales Inquiry Wizard',
                        status: 'live',
                    }),
                }),
            );
        });

        it('auto-resets stale DISCOVERY_CALL template when version tag is missing', async () => {
            const stale = {
                id: 3,
                description: 'Old template without version tag',
                questions: [],
            };
            const fresh = { id: 4, stage: InquiryWizardStage.DISCOVERY_CALL, questions: [] };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(fresh);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(fresh);
            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 3 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 3 },
            });
        });

        it('keeps DISCOVERY_CALL template when version tag matches current version', async () => {
            const current = {
                id: 5,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(current);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(current);
            expect(prisma.inquiry_wizard_templates.delete).not.toHaveBeenCalled();
        });
    });

    describe('findByShareToken', () => {
        it('throws when template is missing or inactive', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);

            await expect(service.findByShareToken('bad-token')).rejects.toThrow(
                'Questionnaire not found or no longer active',
            );
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

            const result = await service.findByShareToken('share-token');

            expect(result.packages).toEqual([]);
            expect(result.package_sets).toEqual([]);
            expect(prisma.service_packages.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { brand_id: 1, is_active: true } }),
            );
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
    });
});
