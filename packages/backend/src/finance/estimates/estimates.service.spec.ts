import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/* ---- helpers ---- */
const buildPrisma = () => ({
  $transaction: jest.fn((fn) => fn(buildPrismaTx())),
  estimates: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  inquiries: {
    findUnique: jest.fn().mockResolvedValue({ updated_at: new Date(0) }),
  },
  projectDayOperator: {
    findFirst: jest.fn().mockResolvedValue(null),
  },
  projectFilm: {
    findFirst: jest.fn().mockResolvedValue(null),
  },
});

const buildPrismaTx = () => ({
  estimates: {
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  estimate_items: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  inquiries: {
    findUnique: jest.fn().mockResolvedValue({
      contact: { brand: { currency: 'GBP' } },
    }),
  },
});

const sampleEstimate = (overrides: Record<string, any> = {}) => ({
  id: 1,
  inquiry_id: 10,
  estimate_number: 'EST-A2B3',
  title: 'Gold',
  status: 'Draft',
  issue_date: new Date('2025-01-01'),
  expiry_date: new Date('2025-02-01'),
  total_amount: new Decimal('1500.00'),
  tax_rate: new Decimal('20.00'),
  deposit_required: new Decimal('500.00'),
  version: 1,
  currency: 'GBP',
  created_at: new Date(),
  updated_at: new Date(),
  items: [
    { id: 1, estimate_id: 1, description: 'Filming', quantity: new Decimal('8'), unit_price: new Decimal('100.00') },
    { id: 2, estimate_id: 1, description: 'Editing', quantity: new Decimal('7'), unit_price: new Decimal('100.00') },
  ],
  ...overrides,
});

describe('EstimatesService', () => {
  let service: EstimatesService;
  let prisma: ReturnType<typeof buildPrisma>;

  beforeEach(async () => {
    prisma = buildPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstimatesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<EstimatesService>(EstimatesService);
  });

  /* ----- findAll converts Decimals and adds total_with_tax ----- */
  describe('findAll', () => {
    it('converts Decimal fields and computes total_with_tax', async () => {
      prisma.estimates.findMany.mockResolvedValue([sampleEstimate()]);

      const results = await service.findAll(10);

      expect(results).toHaveLength(1);
      const est = results[0];
      expect(typeof est.total_amount).toBe('number');
      expect(est.total_amount).toBe(1500);
      expect(est.total_with_tax).toBe(1800); // 1500 + 1500 * 0.20
      expect(typeof est.items[0].quantity).toBe('number');
      expect(typeof est.items[0].unit_price).toBe('number');
    });

    it('returns total_with_tax equal to total_amount when no tax', async () => {
      prisma.estimates.findMany.mockResolvedValue([
        sampleEstimate({ tax_rate: null }),
      ]);

      const results = await service.findAll(10);
      expect(results[0].total_with_tax).toBe(1500); // no tax
    });
  });

  /* ----- findOne ----- */
  describe('findOne', () => {
    it('throws NotFoundException for missing estimate', async () => {
      prisma.estimates.findFirst.mockResolvedValue(null);
      await expect(service.findOne(10, 999)).rejects.toThrow(NotFoundException);
    });

    it('computes total_with_tax for a single estimate', async () => {
      prisma.estimates.findFirst.mockResolvedValue(sampleEstimate());
      const est = await service.findOne(10, 1);
      expect(est.total_with_tax).toBe(1800);
    });
  });

  /* ----- Decimal precision in totals ----- */
  describe('total_with_tax precision', () => {
    it('rounds to 2 decimal places', async () => {
      // $33.33 × 7% tax = $2.3331 → rounds to $2.33
      prisma.estimates.findMany.mockResolvedValue([
        sampleEstimate({ total_amount: new Decimal('33.33'), tax_rate: new Decimal('7.00') }),
      ]);
      const results = await service.findAll(10);
      // taxAmount = 33.33 * 0.07 = 2.3331, total = 35.6631 → 35.66
      expect(results[0].total_with_tax).toBe(35.66);
    });
  });
});
