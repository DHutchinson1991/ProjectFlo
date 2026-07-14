import { ConflictException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { InquiryCrudService } from './inquiry-crud.service';

const baseDto = {
  first_name: 'Alex',
  last_name: 'Smith',
  email: 'alex@example.com',
  phone_number: '',
  wedding_date: new Date().toISOString(),
  status: $Enums.inquiries_status.New,
};

describe('InquiryCrudService', () => {
  const prisma = {
    contacts: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    inquiries: { create: jest.fn() },
  };

  let service: InquiryCrudService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InquiryCrudService(
      prisma as never,
      { generateForInquiry: jest.fn() } as never,
      { handlePackageSelection: jest.fn() } as never,
    );
  });

  it('refuses to create an inquiry when the email belongs to another brand', async () => {
    prisma.contacts.findUnique.mockResolvedValue({ brand_id: 2 });

    await expect(
      service.create(baseDto, 1),
    ).rejects.toThrow(ConflictException);

    expect(prisma.contacts.upsert).not.toHaveBeenCalled();
    expect(prisma.inquiries.create).not.toHaveBeenCalled();
  });

  it('does not re-home contacts when the email already belongs to the same brand', async () => {
    prisma.contacts.findUnique.mockResolvedValue({ brand_id: 1 });
    prisma.contacts.upsert.mockResolvedValue({ id: 5 });
    prisma.inquiries.create.mockResolvedValue({
      id: 10,
      status: 'New',
      wedding_date: new Date(),
      notes: null,
      lead_source: null,
      lead_source_details: null,
      contact: {
        first_name: 'Alex',
        last_name: 'Smith',
        email: 'alex@example.com',
        phone_number: null,
      },
    });

    await service.create(baseDto, 1);

    expect(prisma.contacts.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.not.objectContaining({ brand_id: expect.anything() }),
      }),
    );
  });
});
