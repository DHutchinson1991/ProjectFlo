import {
  Controller,
  Post,
  Get,
  Headers,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  RawBodyRequest,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';

@Controller('api/stripe')
export class StripeController {
  constructor(private readonly stripe: StripeService) {}

  /* ─── Studio endpoints (JWT-protected) ─── */

  @UseGuards(AuthGuard('jwt'))
  @Post('connect/create')
  createAccount(@Headers('x-brand-context') brandHeader: string) {
    return this.stripe.createConnectAccount(this.parseBrandId(brandHeader));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('connect/status')
  getStatus(@Headers('x-brand-context') brandHeader: string) {
    return this.stripe.getAccountStatus(this.parseBrandId(brandHeader));
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('connect/onboarding-link')
  getOnboardingLink(@Headers('x-brand-context') brandHeader: string) {
    return this.stripe.getOnboardingLink(this.parseBrandId(brandHeader));
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('connect/dashboard-link')
  getDashboardLink(@Headers('x-brand-context') brandHeader: string) {
    return this.stripe.getDashboardLink(this.parseBrandId(brandHeader));
  }

  /* ─── Client portal endpoint (public, token-authorized) ─── */

  @Post('checkout')
  createCheckout(@Req() req: Request) {
    const { invoice_id, portal_token } = req.body as {
      invoice_id: number;
      portal_token: string;
    };
    if (!invoice_id || !portal_token) {
      throw new BadRequestException('invoice_id and portal_token required');
    }
    return this.stripe.createCheckoutSession(invoice_id, portal_token);
  }

  /* ─── Webhook (no auth — Stripe signature verification) ─── */

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      return res.status(400).json({ error: 'Missing raw body — check rawBody middleware' });
    }

    try {
      const event = this.stripe.constructWebhookEvent(rawBody, signature);
      await this.stripe.handleWebhookEvent(event);
      return res.json({ received: true });
    } catch (err) {
      return res
        .status(400)
        .json({ error: `Webhook error: ${(err as Error).message}` });
    }
  }

  private parseBrandId(header: string): number {
    const brandId = parseInt(header, 10);
    if (!brandId) throw new BadRequestException('x-brand-context header required');
    return brandId;
  }
}
