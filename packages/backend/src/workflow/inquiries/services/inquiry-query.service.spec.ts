import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryQueryService } from './inquiry-query.service';

describe('InquiryQueryService', () => {
  let service: InquiryQueryService;
  let prisma: {
    inquiries: { findFirst: jest.Mock };
    dayBlueprint: { findUnique: jest.Mock; findMany: jest.Mock };
    dayBlueprintVersion: { findUnique: jest.Mock; findMany: jest.Mock };
    calendar_events: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      inquiries: { findFirst: jest.fn() },
      dayBlueprint: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      dayBlueprintVersion: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      calendar_events: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryQueryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(InquiryQueryService);
  });

  describe('assertInquiryOwnedByBrand', () => {
    it('passes when inquiry belongs to the brand', async () => {
      prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });

      await expect(service.assertInquiryOwnedByBrand(5, 1)).resolves.toBeUndefined();
      expect(prisma.inquiries.findFirst).toHaveBeenCalledWith({
        where: { id: 5, archived_at: null, contact: { brand_id: 1 } },
        select: { id: true },
      });
    });

    it('rejects cross-brand access', async () => {
      prisma.inquiries.findFirst.mockResolvedValue(null);

      await expect(service.assertInquiryOwnedByBrand(5, 1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('scopes lookup to the requesting brand', async () => {
      prisma.inquiries.findFirst.mockResolvedValue(null);

      await expect(service.findOne(9, 2)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.inquiries.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 9, archived_at: null, contact: { brand_id: 2 } },
        }),
      );
    });
  });
});
