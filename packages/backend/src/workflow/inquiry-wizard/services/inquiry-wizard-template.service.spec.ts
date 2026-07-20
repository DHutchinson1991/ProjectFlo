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
        service = module.get<InquiryWizardTemplateService>(InquiryWizardTemplateService);
    });

    describe('getActiveTemplate', () => {
        it('requires brand id for discovery-call stage', async () => {
            await expect(
                service.getActiveTemplate(undefined, InquiryWizardStage.DISCOVERY_CALL),
            ).rejects.toThrow(NotFoundException);
        });

        it('auto-resets stale discovery-call templates missing the current version tag', async () => {
            const staleTemplate = {
                id: 3,
                brand_id: 1,
                description: 'Old discovery call guide',
            };
            const freshTemplate = {
                id: 4,
                brand_id: 1,
                description: `Updated guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
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
                where: { template_id: 3 },
            });
            expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({
                where: { id: 3 },
            });
            expect(prisma.inquiry_wizard_templates.create).toHaveBeenCalled();
            expect(result).toEqual(freshTemplate);
        });

        it('returns existing discovery-call template when version tag is current', async () => {
            const currentTemplate = {
                id: 5,
                description: `Guide [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                questions: [],
            };
            prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(currentTemplate);

            const result = await service.getActiveTemplate(1, InquiryWizardStage.DISCOVERY_CALL);

            expect(result).toEqual(currentTemplate);
            expect(prisma.inquiry_wizard_templates.create).not.toHaveBeenCalled();
        });
    });

    describe('findByShareToken', () => {
        it('throws when share token is inactive or missing', async () => {
            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(null);
            await expect(service.findByShareToken('missing-token')).rejects.toThrow(NotFoundException);
        });

        it('returns template with packages and package sets for public wizard', async () => {
            const template = {
                id: 9,
                brand_id: 2,
                is_active: true,
                questions: [],
            };
            const packages = [{ id: 1, name: 'Gold' }];
            const packageSets = [{ id: 10, slots: [] }];

            prisma.inquiry_wizard_templates.findUnique.mockResolvedValue(template);
            prisma.service_packages.findMany.mockResolvedValue(packages);
            prisma.package_sets.findMany.mockResolvedValue(packageSets);

            const result = await service.findByShareToken('share-token');

            expect(result.packages).toEqual(packages);
            expect(result.package_sets).toEqual(packageSets);
        });
    });
});
