import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

export interface StripeConnectStatus {
  has_account: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  account_id: string | null;
}

export function createStripeApi(client: ApiClient) {
  return {
    /** Create a Stripe Express connected account + get onboarding URL */
    createConnectAccount: () =>
      client.post<{ url: string }>('/api/stripe/connect/create', {}),

    /** Get current Stripe Connect status for the brand */
    getConnectStatus: () =>
      client.get<StripeConnectStatus>('/api/stripe/connect/status'),

    /** Get a fresh onboarding link (for incomplete onboarding) */
    getOnboardingLink: () =>
      client.post<{ url: string }>('/api/stripe/connect/onboarding-link', {}),

    /** Get a Stripe Express dashboard login link */
    getDashboardLink: () =>
      client.post<{ url: string }>('/api/stripe/connect/dashboard-link', {}),

    /** Create a Checkout Session for a client invoice payment */
    createCheckout: (invoiceId: number, portalToken: string) =>
      client.post<{ checkout_url: string }>('/api/stripe/checkout', {
        invoice_id: invoiceId,
        portal_token: portalToken,
      }),
  };
}

export const stripeApi = createStripeApi(apiClient);
