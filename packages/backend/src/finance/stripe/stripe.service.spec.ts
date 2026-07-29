import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../platform/prisma/prisma.service';

describe('StripeService', () => {
  let service: StripeService;
  let prisma: {
    invoices: { findUnique: jest.Mock; update: jest.Mock };
    payments: { findFirst: jest.Mock; create: jest.Mock };
    brands: { findUnique: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      invoices: { findUnique: jest.fn(), update: jest.fn() },
      payments: { findFirst: jest.fn(), create: jest.fn() },
      brands: { findUnique: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return 'sk_test_fake';
              if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_fake';
              if (key === 'FRONTEND_URL') return 'http://localhost:3001';
              return undefined;
            },
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(StripeService);
    (service as any).stripe = {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.test' }),
        },
      },
      paymentIntents: { retrieve: jest.fn() },
    };
  });

  it('rejects checkout for Draft invoices', async () => {
    prisma.invoices.findUnique.mockResolvedValue({
      id: 1,
      amount: 1000,
      amount_paid: 0,
      status: 'Draft',
      currency: 'GBP',
      title: 'Deposit',
      invoice_number: 'INV-1',
      brand: { stripe_account_id: 'acct_123' },
      inquiry: { contact: { email: 'couple@example.com' } },
      items: [],
    });

    await expect(service.createCheckoutSession(1, 'portal-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('caps webhook payments to the remaining invoice balance', async () => {
    prisma.payments.findFirst.mockResolvedValue(null);
    prisma.invoices.findUnique.mockResolvedValue({
      id: 1,
      amount: 500,
      amount_paid: 0,
      status: 'Sent',
      invoice_number: 'INV-1',
    });

    await (service as any).handleCheckoutCompleted({
      id: 'cs_test_1',
      payment_status: 'paid',
      amount_total: 100000,
      currency: 'gbp',
      metadata: { invoice_id: '1', brand_id: '1' },
      payment_intent: 'pi_test',
      customer_details: { email: 'couple@example.com' },
    });

    expect(prisma.payments.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 500 }) }),
    );
    expect(prisma.invoices.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount_paid: 500, status: 'Paid' }),
      }),
    );
  });

  it('skips webhook processing when payment_status is unpaid', async () => {
    await (service as any).handleCheckoutCompleted({
      id: 'cs_test_2',
      payment_status: 'unpaid',
      metadata: { invoice_id: '1' },
    });

    expect(prisma.payments.create).not.toHaveBeenCalled();
  });
});
