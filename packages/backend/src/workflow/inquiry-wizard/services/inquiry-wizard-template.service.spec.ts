import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
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
        findMany: jest.fn(),
    },
    package_sets: {
        findMany: jest.fn(),
    },
});

describe('InquiryWizardTemplateService', () => {
    let service: InquiryWizardTemplateService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(() => {
        prisma = buildPrisma();
        service = new InquiryWizardTemplateService(prisma as never);
    });

    describe('getActiveTemplate', () => {
        it('requires brandId for DISCOVERY_CALL stage', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('creates a default discovery-call template when none exists', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue({
                id: 9,
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: [],
            });

            const result = await service.getActiveTemplate(3, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        brand_id: 3,
                        stage: InquiryWizardStage.DISCOVERY_CALL,
                        description: expect.stringContaining(`[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`),
                    }),
                }),
            );
            expect(result.id).toBe(9);
        });

        it('auto-resets stale discovery-call templates missing the current version tag', async () => {
            const staleTemplate = {
                id: 4,
                description: 'Old template without version tag',
            };
            const resetTemplate = { id: 5, questions: [] };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(staleTemplate)
                .mockResolvedValueOnce(staleTemplate);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 3 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(staleTemplate);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(resetTemplate);

            const result = await service.getActiveTemplate(3, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 4 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 4 },
            });
            expect(result).toBe(resetTemplate);
        });

        it('returns existing INTAKE template without creating a default', async () => {
            const existing = { id: 1, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(existing);

            const result = await service.getActiveTemplate(2, InquiryWizardStage.INTAKE);

            expect(result).toBe(existing);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });
    });

    describe('generateShareToken', () => {
        it('reuses an existing share token', async () => {
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue({
                id: 6,
                brand_id: 1,
                share_token: 'existing-token',
                questions: [],
            });

            const token = await service.generateShareToken(6, 1);

            expect(token).toBe('existing-token');
            expect(prisma.inquiry_wizard_templates.update).not.toHaveBeenCalled();
        });
    });
});
