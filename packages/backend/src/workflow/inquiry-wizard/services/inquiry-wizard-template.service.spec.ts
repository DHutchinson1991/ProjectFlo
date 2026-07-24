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
        it('requires a brand id for discovery-call templates', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toThrow(NotFoundException);
        });

        it('auto-resets stale discovery-call templates missing the version tag', async () => {
            const staleTemplate = {
                id: 9,
                description: 'Old discovery guide without version tag',
            };
            const freshTemplate = {
                id: 10,
                description: `Discovery guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };

            prisma.inquiry_wizard_templates.findFirst
                .mockResolvedValueOnce(staleTemplate)
                .mockResolvedValueOnce(staleTemplate);
            prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 5 });
            prisma.inquiry_wizard_templates.delete.mockResolvedValue(staleTemplate);
            prisma.inquiry_wizard_templates.create.mockResolvedValue(freshTemplate);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(prisma.inquiry_wizard_questions.deleteMany).toHaveBeenCalledWith({
                where: { template_id: 9 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 9 },
            });
            expect(result).toEqual(freshTemplate);
        });

        it('returns an existing discovery-call template when version tag is current', async () => {
            const currentTemplate = {
                id: 11,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [{ field_key: 'venue_story' }],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(currentTemplate);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toBe(currentTemplate);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });
    });
});
