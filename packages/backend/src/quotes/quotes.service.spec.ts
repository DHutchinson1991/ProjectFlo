import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';
import { Decimal } from '@prisma/client/runtime/library';

/* ---- helpers ---- */
const buildPrisma = () => ({
    $transaction: jest.fn((fn) => fn(buildPrismaTx())),
    quotes: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
});

const buildPrismaTx = () => ({
    quotes: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
    },
    quote_items: {
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

const mockInquiryTasks = () => ({
    autoCompleteByName: jest.fn(),
});

const sampleQuote = (overrides: Record<string, any> = {}) => ({
    id: 1,
    inquiry_id: 10,
    quote_number: 'Q-A2B3',
    title: 'Gold',
    status: 'Draft',
    issue_date: new Date('2025-01-01'),
    expiry_date: new Date('2025-02-01'),
    total_amount: new Decimal('2000.00'),
    tax_rate: new Decimal('20.00'),
    deposit_required: new Decimal('500.00'),
    is_primary: true,
    consultation_notes: null,
    version: 1,
    currency: 'GBP',
    created_at: new Date(),
    updated_at: new Date(),
    items: [
        { id: 1, quote_id: 1, description: 'Filming', category: 'Production', quantity: new Decimal('10'), unit: 'Hours', unit_price: new Decimal('100.00') },
        { id: 2, quote_id: 1, description: 'Editing', category: 'Post', quantity: new Decimal('10'), unit: 'Hours', unit_price: new Decimal('100.00') },
    ],
    ...overrides,
});

describe('QuotesService', () => {
    let service: QuotesService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(async () => {
        prisma = buildPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuotesService,
                { provide: PrismaService, useValue: prisma },
                { provide: InquiryTasksService, useValue: mockInquiryTasks() },
            ],
        }).compile();
        service = module.get<QuotesService>(QuotesService);
    });

    describe('findAll', () => {
        it('converts Decimal fields and computes total_with_tax', async () => {
            prisma.quotes.findMany.mockResolvedValue([sampleQuote()]);

            const results = await service.findAll(10);

            expect(results).toHaveLength(1);
            const q = results[0];
            expect(typeof q.total_amount).toBe('number');
            expect(q.total_amount).toBe(2000);
            expect(q.total_with_tax).toBe(2400); // 2000 + 2000 * 0.20
            expect(typeof q.items[0].quantity).toBe('number');
            expect(typeof q.items[0].unit_price).toBe('number');
        });

        it('returns total_with_tax equal to total_amount when no tax', async () => {
            prisma.quotes.findMany.mockResolvedValue([
                sampleQuote({ tax_rate: null }),
            ]);
            const results = await service.findAll(10);
            expect(results[0].total_with_tax).toBe(2000);
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException for missing quote', async () => {
            prisma.quotes.findFirst.mockResolvedValue(null);
            await expect(service.findOne(10, 999)).rejects.toThrow(NotFoundException);
        });

        it('computes total_with_tax for a single quote', async () => {
            prisma.quotes.findFirst.mockResolvedValue(sampleQuote());
            const q = await service.findOne(10, 1);
            expect(q.total_with_tax).toBe(2400);
        });
    });

    describe('total_with_tax precision', () => {
        it('rounds to 2 decimal places', async () => {
            prisma.quotes.findMany.mockResolvedValue([
                sampleQuote({ total_amount: new Decimal('33.33'), tax_rate: new Decimal('7.00') }),
            ]);
            const results = await service.findAll(10);
            expect(results[0].total_with_tax).toBe(35.66);
        });
    });
});
