import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);
  private readonly webhookSecret: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe features disabled');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
    }
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured on this server');
    }
    return this.stripe;
  }

  /* ─── Connect: Express account onboarding ─── */

  /**
   * Create a Stripe Express connected account for a brand
   * and return an Account Link URL for onboarding.
   */
  async createConnectAccount(brandId: number): Promise<{ url: string }> {
    const brand = await this.prisma.brands.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);

    // If already has an account, just generate a new onboarding link
    if (brand.stripe_account_id) {
      const link = await this.createAccountLink(brand.stripe_account_id);
      return { url: link.url };
    }

    const account = await this.stripeClient.accounts.create({
      type: 'express',
      email: brand.email || undefined,
      business_profile: {
        name: brand.display_name || brand.name,
      },
      metadata: { brand_id: String(brandId) },
    });

    await this.prisma.brands.update({
      where: { id: brandId },
      data: { stripe_account_id: account.id },
    });

    const link = await this.createAccountLink(account.id);
    return { url: link.url };
  }

  /**
   * Generate a new Account Link (for onboarding or refreshing an expired link).
   */
  async getOnboardingLink(brandId: number): Promise<{ url: string }> {
    const brand = await this.prisma.brands.findUnique({ where: { id: brandId } });
    if (!brand?.stripe_account_id) {
      throw new BadRequestException('Brand has no Stripe account. Create one first.');
    }

    const link = await this.createAccountLink(brand.stripe_account_id);
    return { url: link.url };
  }

  /**
   * Check whether a connected account has completed onboarding.
   */
  async getAccountStatus(brandId: number): Promise<{
    has_account: boolean;
    onboarding_complete: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    account_id: string | null;
  }> {
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { stripe_account_id: true, stripe_onboarding_complete: true },
    });

    if (!brand?.stripe_account_id) {
      return {
        has_account: false,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
        account_id: null,
      };
    }

    const account = await this.stripeClient.accounts.retrieve(brand.stripe_account_id);

    // Persist completion status if newly completed
    if (account.charges_enabled && !brand.stripe_onboarding_complete) {
      await this.prisma.brands.update({
        where: { id: brandId },
        data: { stripe_onboarding_complete: true },
      });
    }

    return {
      has_account: true,
      onboarding_complete: !!account.charges_enabled,
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      account_id: brand.stripe_account_id,
    };
  }

  /**
   * Generate a Stripe Dashboard login link for the connected account.
   */
  async getDashboardLink(brandId: number): Promise<{ url: string }> {
    const brand = await this.prisma.brands.findUnique({ where: { id: brandId } });
    if (!brand?.stripe_account_id) {
      throw new BadRequestException('No Stripe account connected');
    }
    const link = await this.stripeClient.accounts.createLoginLink(brand.stripe_account_id);
    return { url: link.url };
  }

  /* ─── Checkout: Create sessions for client payments ─── */

  /**
   * Create a Stripe Checkout Session for a specific invoice.
   * Money flows to the connected account (the studio's Stripe).
   */
  async createCheckoutSession(
    invoiceId: number,
    portalToken: string,
  ): Promise<{ checkout_url: string }> {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        brand: true,
        inquiry: { select: { contact: { select: { email: true } } } },
        items: true,
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    if (!invoice.brand?.stripe_account_id) {
      throw new BadRequestException('Studio has not connected a Stripe account');
    }

    const balance = Number(invoice.amount) - Number(invoice.amount_paid ?? 0);
    if (balance <= 0) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    const session = await this.stripeClient.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: (invoice.currency || 'usd').toLowerCase(),
              product_data: {
                name: invoice.title || `Invoice ${invoice.invoice_number}`,
                description: `Payment for invoice ${invoice.invoice_number}`,
              },
              unit_amount: Math.round(balance * 100), // Stripe uses cents
            },
            quantity: 1,
          },
        ],
        customer_email: invoice.inquiry?.contact?.email || undefined,
        metadata: {
          invoice_id: String(invoice.id),
          invoice_number: invoice.invoice_number,
          brand_id: String(invoice.brand_id),
          portal_token: portalToken,
        },
        success_url: `${this.frontendUrl}/portal/payments/${portalToken}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.frontendUrl}/portal/payments/${portalToken}?payment=cancelled`,
      },
      {
        stripeAccount: invoice.brand.stripe_account_id,
      },
    );

    return { checkout_url: session.url! };
  }

  /* ─── Webhook handling ─── */

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripeClient.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'account.updated':
        await this.handleAccountUpdated(
          event.data.object as Stripe.Account,
        );
        break;

      default:
        this.logger.debug(`Unhandled webhook event: ${event.type}`);
    }
  }

  /* ─── Private helpers ─── */

  private async createAccountLink(
    accountId: string,
  ): Promise<Stripe.AccountLink> {
    return this.stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: `${this.frontendUrl}/settings?stripe_refresh=true`,
      return_url: `${this.frontendUrl}/settings?stripe_onboarded=true`,
      type: 'account_onboarding',
    });
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const invoiceId = parseInt(session.metadata?.invoice_id || '0', 10);
    if (!invoiceId) {
      this.logger.warn('Checkout session missing invoice_id metadata');
      return;
    }

    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      this.logger.warn(`Invoice ${invoiceId} not found for checkout session`);
      return;
    }

    const amountPaid = (session.amount_total || 0) / 100; // cents → dollars
    const currency = session.currency || undefined;
    const payerEmail = session.customer_details?.email || session.customer_email || undefined;

    // Fetch PaymentIntent to get card details + receipt URL
    let receiptUrl: string | undefined;
    let cardBrand: string | undefined;
    let cardLast4: string | undefined;

    if (session.payment_intent) {
      try {
        const stripeAccountId = session.metadata?.brand_id
          ? (await this.prisma.brands.findUnique({
              where: { id: parseInt(session.metadata.brand_id, 10) },
              select: { stripe_account_id: true },
            }))?.stripe_account_id
          : undefined;

        const pi = await this.stripeClient.paymentIntents.retrieve(
          session.payment_intent as string,
          { expand: ['latest_charge'] },
          stripeAccountId ? { stripeAccount: stripeAccountId } : undefined,
        );

        const charge = pi.latest_charge as Stripe.Charge | null;
        if (charge) {
          receiptUrl = charge.receipt_url || undefined;
          const pm = charge.payment_method_details;
          if (pm?.card) {
            cardBrand = pm.card.brand || undefined;
            cardLast4 = pm.card.last4 || undefined;
          }
        }
      } catch (err) {
        this.logger.warn(`Could not fetch PaymentIntent details: ${err}`);
      }
    }

    // Record the payment
    await this.prisma.payments.create({
      data: {
        invoice_id: invoiceId,
        amount: amountPaid,
        payment_method: 'Stripe',
        transaction_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        payment_date: new Date(),
        receipt_url: receiptUrl,
        card_brand: cardBrand,
        card_last4: cardLast4,
        payer_email: payerEmail,
        currency: currency?.toUpperCase(),
      },
    });

    // Update invoice totals
    const newAmountPaid = Number(invoice.amount_paid ?? 0) + amountPaid;
    const fullyPaid = newAmountPaid >= Number(invoice.amount);

    await this.prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        amount_paid: newAmountPaid,
        status: fullyPaid ? 'Paid' : 'Partially Paid',
      },
    });

    this.logger.log(
      `Payment recorded: invoice=${invoice.invoice_number} amount=${amountPaid} status=${fullyPaid ? 'Paid' : 'Partially Paid'}`,
    );
  }

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const brandId = parseInt(account.metadata?.brand_id || '0', 10);
    if (!brandId) return;

    if (account.charges_enabled) {
      await this.prisma.brands.update({
        where: { id: brandId },
        data: { stripe_onboarding_complete: true },
      });
      this.logger.log(`Brand ${brandId} Stripe onboarding complete`);
    }
  }
}
