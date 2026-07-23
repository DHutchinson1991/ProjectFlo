import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';

const INTAKE = 'INTAKE' as const;
const DISCOVERY_CALL = 'DISCOVERY_CALL' as const;

describe('InquiryWizardTemplateService.resetActiveTemplate', () => {
  const brandId = 42;

  function createService() {
    const prisma = {
      inquiry_wizard_templates: {
        findFirst: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
      },
      inquiry_wizard_questions: {
        deleteMany: jest.fn(),
      },
    };
    const service = new InquiryWizardTemplateService(prisma as never);
    return { service, prisma };
  }

  it('recreates an INTAKE default when resetting INTAKE stage', async () => {
    const { service, prisma } = createService();
    const intakeTemplate = { id: 1, stage: INTAKE };
    const createdIntake = { id: 2, stage: INTAKE, questions: [] };

    prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(intakeTemplate);
    prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 0 });
    prisma.inquiry_wizard_templates.delete.mockResolvedValue(intakeTemplate);
    jest.spyOn(service as never, 'createDefaultTemplate' as never).mockResolvedValue(createdIntake as never);

    const result = await service.resetActiveTemplate(brandId, INTAKE as never);

    expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(service['createDefaultTemplate']).toHaveBeenCalledWith(brandId);
    expect(result).toBe(createdIntake);
  });

  it('recreates a DISCOVERY_CALL default when resetting DISCOVERY_CALL stage', async () => {
    const { service, prisma } = createService();
    const discoveryTemplate = { id: 3, stage: DISCOVERY_CALL };
    const createdDiscovery = { id: 4, stage: DISCOVERY_CALL, questions: [] };

    prisma.inquiry_wizard_templates.findFirst.mockResolvedValue(discoveryTemplate);
    prisma.inquiry_wizard_questions.deleteMany.mockResolvedValue({ count: 0 });
    prisma.inquiry_wizard_templates.delete.mockResolvedValue(discoveryTemplate);
    jest
      .spyOn(service as never, 'createDefaultDiscoveryCallTemplate' as never)
      .mockResolvedValue(createdDiscovery as never);

    const result = await service.resetActiveTemplate(brandId, DISCOVERY_CALL as never);

    expect(prisma.inquiry_wizard_templates.delete).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(service['createDefaultDiscoveryCallTemplate']).toHaveBeenCalledWith(brandId);
    expect(result).toBe(createdDiscovery);
  });
});
