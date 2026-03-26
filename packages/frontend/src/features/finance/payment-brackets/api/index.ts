import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
    AssignBracketData,
    ContributorBracketAssignment,
    CreatePaymentBracketData,
    EffectiveRate,
    PaymentBracket,
    PaymentBracketsByRole,
    UpdatePaymentBracketData,
} from '../types';

/**
 * Payment brackets are global (not brand-scoped) — the backend endpoints
 * live outside the /brands/:id namespace, so skipBrandContext prevents the
 * client from attaching the X-Brand-Context header.
 */
export function createPaymentBracketsApi(client: ApiClient) {
    return {
        getAll: (includeInactive = false) =>
            client.get<PaymentBracket[]>(`/payment-brackets${includeInactive ? '?include_inactive=true' : ''}`, { skipBrandContext: true }),
        getByRole: (brandId?: number) =>
            client.get<PaymentBracketsByRole>(`/payment-brackets/by-role${brandId ? `?brandId=${brandId}` : ''}`, { skipBrandContext: true }),
        getByJobRole: (jobRoleId: number, includeInactive = false) =>
            client.get<PaymentBracket[]>(`/payment-brackets/job-role/${jobRoleId}${includeInactive ? '?include_inactive=true' : ''}`, { skipBrandContext: true }),
        getById: (bracketId: number) => client.get<PaymentBracket>(`/payment-brackets/${bracketId}`, { skipBrandContext: true }),
        create: (data: CreatePaymentBracketData) => client.post<PaymentBracket>('/payment-brackets', data, { skipBrandContext: true }),
        update: (bracketId: number, data: UpdatePaymentBracketData) =>
            client.put<PaymentBracket>(`/payment-brackets/${bracketId}`, data, { skipBrandContext: true }),
        delete: (bracketId: number) => client.delete<void>(`/payment-brackets/${bracketId}`, { skipBrandContext: true }),
        assign: (data: AssignBracketData) =>
            client.post<ContributorBracketAssignment>('/payment-brackets/assign', data, { skipBrandContext: true }),
        unassign: (contributorId: number, jobRoleId: number) =>
            client.delete<ContributorBracketAssignment>(`/payment-brackets/contributor/${contributorId}/job-role/${jobRoleId}`, { skipBrandContext: true }),
        toggleUnmanned: (contributorId: number, jobRoleId: number, isUnmanned: boolean) =>
            client.patch<ContributorBracketAssignment>(
                `/payment-brackets/contributor/${contributorId}/job-role/${jobRoleId}/unmanned`,
                { is_unmanned: isUnmanned },
                { skipBrandContext: true }
            ),
        getContributorBrackets: (contributorId: number) =>
            client.get<ContributorBracketAssignment[]>(`/payment-brackets/contributor/${contributorId}`, { skipBrandContext: true }),
        getEffectiveRate: (contributorId: number, jobRoleId: number) =>
            client.get<EffectiveRate>(`/payment-brackets/effective-rate/${contributorId}/${jobRoleId}`, { skipBrandContext: true }),
    };
}

export const paymentBracketsApi = createPaymentBracketsApi(apiClient);

export type PaymentBracketsApi = ReturnType<typeof createPaymentBracketsApi>;
