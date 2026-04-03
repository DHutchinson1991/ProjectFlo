import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentScheduleRule { label: string; amount_type: string; amount_value: number }
export interface PaymentScheduleOption { id: number; name: string; is_default: boolean; rules: PaymentScheduleRule[] }

// ─── Client Portal API (public / token-authenticated) ────────────────────────

export function createClientPortalApi(client: ApiClient) {
    return {
        getByToken: (token: string): Promise<Record<string, unknown>> =>
            client.get(`/api/client-portal/${encodeURIComponent(token)}`, { skipBrandContext: true, skipAuth: true }),
        generateToken: (inquiryId: number): Promise<{ portal_token: string }> =>
            client.post(`/api/inquiries/${inquiryId}/portal-token`),
        getPackageOptions: (token: string): Promise<Record<string, unknown>[]> =>
            client.get(`/api/client-portal/${encodeURIComponent(token)}/packages`, { skipBrandContext: true, skipAuth: true }),
        submitPackageRequest: (token: string, data: Record<string, unknown>): Promise<Record<string, unknown>> =>
            client.post(`/api/client-portal/${encodeURIComponent(token)}/package-request`, data, { skipBrandContext: true, skipAuth: true }),
        respondToProposal: (token: string, response: string, message?: string): Promise<Record<string, unknown>> =>
            client.post(`/api/client-portal/${encodeURIComponent(token)}/proposal-respond`, { response, message }, { skipBrandContext: true, skipAuth: true }),
        saveSectionNote: (token: string, sectionType: string, note: string): Promise<{ id: number; section_type: string; note: string }> =>
            client.post(`/api/client-portal/${encodeURIComponent(token)}/section-note`, { section_type: sectionType, note }, { skipBrandContext: true, skipAuth: true }),
        getPaymentsData: (token: string, preview = false): Promise<Record<string, unknown>> =>
            client.get(`/api/client-portal/${encodeURIComponent(token)}/payments${preview ? '?preview=true' : ''}`, { skipBrandContext: true, skipAuth: true }),
        getPaymentScheduleOptions: (token: string): Promise<PaymentScheduleOption[]> =>
            client.get(`/api/client-portal/${encodeURIComponent(token)}/payment-schedules`, { skipBrandContext: true, skipAuth: true }),
        createCheckoutSession: (invoiceId: number, portalToken: string): Promise<{ checkout_url: string }> =>
            client.post('/api/stripe/checkout', { invoice_id: invoiceId, portal_token: portalToken }, { skipBrandContext: true, skipAuth: true }),
    };
}

export const clientPortalApi = createClientPortalApi(apiClient);

export type ClientPortalApi = ReturnType<typeof createClientPortalApi>;
