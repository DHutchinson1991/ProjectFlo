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
    $transaction: jest.fn(),
});

describe('InquiryWizardTemplateService', () => {
    let service: InquiryWizardTemplateService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(async () => {
        prisma = buildPrisma();
        prisma.$transaction.mockImplementation(async (fn) => fn(prisma));

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardTemplateService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get<InquiryWizardTemplateService>(InquiryWizardTemplateService);
    });

    describe('getActiveTemplate', () => {
        it('returns existing INTAKE template for brand', async () => {
            const template = { id: 1, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(template);

            await expect(service.getActiveTemplate(5, InquiryWizardStage.INTAKE)).resolves.toBe(template);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });

        it('creates default INTAKE template when none exists', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue({ id: 2, questions: [] });

            await service.getActiveTemplate(5, InquiryWizardStage.INTAKE);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
        });

        it('requires brand id for DISCOVERY_CALL templates', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toThrow(NotFoundException);
        });

        it('creates default DISCOVERY_CALL template when missing', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue({
                id: 3,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: [],
            });

            await service.getActiveTemplate(5, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        stage: InquiryWizardStage.DISCOVERY_CALL,
                        description: expect.stringContaining(`[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`),
                    }),
                }),
            );
        });

        it('resets stale DISCOVERY_CALL templates missing the current version tag', async () => {
            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce({
                    id: 9,
                    description: 'Old discovery template [v1]',
                    questions: [],
                })
                .mockResolvedValueOnce({ id: 9, is_active: true, stage: InquiryWizardStage.DISCOVERY_CALL });
            prisma.inquiry_wizard_templates.create.mockResolvedValue({
                id: 10,
                description: `Fresh [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            });

            const result = await service.getActiveTemplate(5, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({ where: { template_id: 9 } });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result.id).toBe(10);
        });
    });

    describe('findByShareToken', () => {
        it('throws when share token is inactive or missing', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);
            await expect(service.findByShareToken('missing-token')).rejects.toThrow(NotFoundException);

            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: false,
                brand_id: 1,
            });
            await expect(service.findByShareToken('inactive-token')).rejects.toThrow(NotFoundException);
        });

        it('returns active template with packages and package sets', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue({
                id: 1,
                is_active: true,
                brand_id: 1,
                questions: [],
            });
            prisma.service_packages.findMany.mockResolvedValue([{ id: 5 }]);
            prisma.package_sets.findMany.mockResolvedValue([{ id: 2, slots: [] }]);

            const result = await service.findByShareToken('live-token');

            expect(result.packages).toEqual([{ id: 5 }]);
            expect(result.package_sets).toEqual([{ id: 2, slots: [] }]);
        });
    });
});
