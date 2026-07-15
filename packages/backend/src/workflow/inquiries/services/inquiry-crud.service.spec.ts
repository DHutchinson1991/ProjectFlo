import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryCrudService } from './inquiry-crud.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryPackageService } from './inquiry-package.service';

describe('InquiryCrudService package selection consistency', () => {
  let service: InquiryCrudService;
  let packageService: { handlePackageSelection: jest.Mock };
  let prisma: {
    inquiries: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    contacts: {
      update: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const existingInquiry = {
    id: 42,
    selected_package_id: 10,
    contact_id: 7,
    contact: {
      id: 7,
      brand_id: 1,
      email: 'lead@example.com',
      first_name: 'Alex',
      last_name: 'Lee',
      phone_number: null,
    },
  };

  beforeEach(async () => {
    packageService = {
      handlePackageSelection: jest.fn(),
    };

    prisma = {
      inquiries: {
        findFirst: jest.fn().mockResolvedValue(existingInquiry),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...existingInquiry,
            ...data,
            contact: existingInquiry.contact,
          }),
        ),
      },
      contacts: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryCrudService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: InquiryTasksService,
          useValue: {
            generateForInquiry: jest.fn(),
            syncReviewInquiryAutoSubtasks: jest.fn(),
            autoCompleteByName: jest.fn(),
          },
        },
        { provide: InquiryPackageService, useValue: packageService },
      ],
    }).compile();

    service = module.get(InquiryCrudService);
  });

  it('reverts selected_package_id when package snapshot cloning fails on update', async () => {
    packageService.handlePackageSelection.mockRejectedValue(new Error('clone failed'));

    const result = await service.update(
      42,
      { selected_package_id: 99, status: 'New' as const },
      1,
    );

    expect(packageService.handlePackageSelection).toHaveBeenCalledWith(42, 99, 1);
    expect(prisma.inquiries.update).toHaveBeenLastCalledWith({
      where: { id: 42 },
      data: { selected_package_id: 10 },
      include: {
        contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } },
      },
    });
    expect(result.selected_package_id).toBe(10);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Package selection was reverted'),
      ]),
    );
  });

  it('throws when inquiry is not found for the brand', async () => {
    prisma.inquiries.findFirst.mockResolvedValue(null);

    await expect(
      service.update(42, { selected_package_id: 99 }, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
