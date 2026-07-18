import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DISCOVERY_CALL_TEMPLATE_VERSION } from '../constants/default-discovery-call-template';

const versionTag = `[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`;

const buildPrisma = () => ({
    inquiry_wizard_templates: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
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
        it('requires brand id for DISCOVERY_CALL stage', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toThrow(NotFoundException);
        });

        it('returns existing discovery-call template when version tag is current', async () => {
            const existing = {
                id: 10,
                description: `Guide ${versionTag}`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(existing);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(existing);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });

        it('resets stale discovery-call templates missing the current version tag', async () => {
            const stale = { id: 11, description: 'Old guide [v1]' };
            const recreated = { id: 12, description: `Fresh ${versionTag}`, questions: [] };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(stale)
                .mockResolvedValueOnce(stale);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 5 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(stale);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(recreated);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({ where: { template_id: 11 } });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 11 } });
            expect(result).toBe(recreated);
        });

        it('creates default INTAKE template when none exists for brand', async () => {
            const created = { id: 3, stage: InquiryWizardStage.INTAKE, questions: [] };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(null);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(created);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.INTAKE);

            expect(result).toBe(created);
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
        });
    });

    describe('findByShareToken', () => {
        it('rejects inactive or missing share tokens', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);

            await expect(service.findByShareToken('bad-token')).rejects.toThrow(NotFoundException);
        });

        it('returns template with packages and package sets for active share link', async () => {
            const template = {
                id: 4,
                brand_id: 1,
                is_active: true,
                questions: [],
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
