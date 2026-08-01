import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

describe('InquiryWizardLinkService', () => {
  const brandId = 1;

  function createService(overrides: {
    existingInquiry?: Record<string, unknown> | null;
    handlePackageSelection?: jest.Mock;
  } = {}) {
    const handlePackageSelection = overrides.handlePackageSelection
      ?? jest.fn().mockResolvedValue(undefined);

    const prisma = {
      inquiries: {
        findUnique: jest.fn().mockResolvedValue(overrides.existingInquiry ?? null),
        update: jest.fn().mockResolvedValue({}),
      },
      contacts: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const service = new InquiryWizardLinkService(
      prisma as never,
      {} as never,
      { handlePackageSelection } as never,
      { syncReviewInquiryAutoSubtasks: jest.fn() } as never,
      {
        prefillLocationSlots: jest.fn(),
        prefillSubjectNames: jest.fn(),
      } as never,
    );

    return { service, prisma, handlePackageSelection };
  }

  it('swaps package when wizard submits a different selected_package_id', async () => {
    const { service, prisma, handlePackageSelection } = createService({
      existingInquiry: {
        id: 10,
        contact_id: 5,
        selected_package_id: 100,
        contact: { id: 5, first_name: 'Alex', last_name: 'Lee', email: 'alex@example.com', phone_number: '' },
      },
    });

    await service.linkToExistingInquiry({
      inquiry_id: 10,
      selected_package_id: 200,
      responses: {},
    } as never, brandId);

    expect(handlePackageSelection).toHaveBeenCalledWith(10, 200, brandId);
    expect(prisma.inquiries.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({ selected_package_id: 200 }),
      }),
    );
  });

  it('does not call handlePackageSelection when package id is unchanged', async () => {
    const { service, handlePackageSelection } = createService({
      existingInquiry: {
        id: 10,
        contact_id: 5,
        selected_package_id: 100,
        contact: { id: 5, first_name: 'Alex', last_name: 'Lee', email: 'alex@example.com', phone_number: '' },
      },
    });

    await service.linkToExistingInquiry({
      inquiry_id: 10,
      selected_package_id: 100,
      responses: {},
    } as never, brandId);

    expect(handlePackageSelection).not.toHaveBeenCalled();
  });

  it('clones package on first selection when inquiry has no selected_package_id', async () => {
    const { service, handlePackageSelection } = createService({
      existingInquiry: {
        id: 10,
        contact_id: 5,
        selected_package_id: null,
        contact: { id: 5, first_name: 'Alex', last_name: 'Lee', email: 'alex@example.com', phone_number: '' },
      },
    });

    await service.linkToExistingInquiry({
      inquiry_id: 10,
      selected_package_id: 200,
      responses: {},
    } as never, brandId);

    expect(handlePackageSelection).toHaveBeenCalledWith(10, 200, brandId);
  });
});
