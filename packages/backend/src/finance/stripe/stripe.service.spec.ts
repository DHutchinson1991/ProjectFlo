import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { StripeService } from './stripe.service';

describe('StripeService security', () => {
  let service: StripeService;
  let prisma: {
    invoices: { findUnique: jest.Mock };
    inquiries: { findUnique: jest.Mock };
    projects: { findUnique: jest.Mock };
    payments: { findFirst: jest.Mock; create: jest.Mock };
    brands: { findUnique: jest.Mock; update: jest.Mock };
    crew: { findUnique: jest.Mock };
    brandMember: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      invoices: { findUnique: jest.fn() },
      inquiries: { findUnique: jest.fn() },
      projects: { findUnique: jest.fn() },
      payments: { findFirst: jest.fn(), create: jest.fn() },
      brands: { findUnique: jest.fn(), update: jest.fn() },
      crew: { findUnique: jest.fn() },
      brandMember: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => {
              if (key === 'STRIPE_SECRET_KEY') return undefined;
              return fallback;
            },
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  describe('createCheckoutSession portal token validation', () => {
    it('rejects checkout when portal token does not match the invoice inquiry', async () => {
      prisma.invoices.findUnique.mockResolvedValue({
        id: 99,
        inquiry_id: 10,
        amount: 1000,
        amount_paid: 0,
        currency: 'USD',
        invoice_number: 'INV-99',
        title: 'Deposit',
        brand: { stripe_account_id: 'acct_test' },
        inquiry: { contact: { email: 'client@example.com' } },
        items: [],
      });
      prisma.inquiries.findUnique.mockResolvedValue({ id: 20 });

      await expect(
        service.createCheckoutSession(99, 'valid-token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects checkout when portal token is unknown', async () => {
      prisma.invoices.findUnique.mockResolvedValue({
        id: 99,
        inquiry_id: 10,
        amount: 1000,
        amount_paid: 0,
        currency: 'USD',
        invoice_number: 'INV-99',
        title: 'Deposit',
        brand: { stripe_account_id: 'acct_test' },
        inquiry: { contact: { email: 'client@example.com' } },
        items: [],
      });
      prisma.inquiries.findUnique.mockResolvedValue(null);
      prisma.projects.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(99, 'invalid-token'),
      ).rejects.toThrow('Invalid portal token');
    });
  });

  describe('handleCheckoutCompleted idempotency', () => {
    it('skips duplicate webhook deliveries for the same checkout session', async () => {
      prisma.payments.findFirst.mockResolvedValue({ id: 1 });
      prisma.invoices.findUnique.mockResolvedValue({
        id: 5,
        amount: 100,
        amount_paid: 0,
        invoice_number: 'INV-5',
      });

      await service.handleWebhookEvent({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { invoice_id: '5', brand_id: '1' },
            amount_total: 10000,
            currency: 'usd',
            payment_intent: 'pi_test',
          },
        },
      } as never);

      expect(prisma.payments.create).not.toHaveBeenCalled();
      expect(prisma.brands.update).not.toHaveBeenCalled();
    });
  });

  describe('createConnectAccount brand access', () => {
    it('rejects connect onboarding for brands the user does not belong to', async () => {
      prisma.crew.findUnique.mockResolvedValue({
        contact: { user_account: { system_role: { name: 'Studio User' } } },
      });
      prisma.brandMember.findFirst.mockResolvedValue(null);

      await expect(service.createConnectAccount(7, 42)).rejects.toThrow(
        'Access denied to this brand',
      );
    });
  });
});
