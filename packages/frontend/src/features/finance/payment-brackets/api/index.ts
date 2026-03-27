import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
    AssignBracketData,
    CrewMemberBracketAssignment,
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
            client.get<PaymentBracket[]>(`/api/payment-brackets${includeInactive ? '?include_inactive=true' : ''}`, { skipBrandContext: true }),
        getByRole: (brandId?: number) =>
            client.get<PaymentBracketsByRole>(`/api/payment-brackets/by-role${brandId ? `?brandId=${brandId}` : ''}`, { skipBrandContext: true }),
        getByJobRole: (jobRoleId: number, includeInactive = false) =>
            client.get<PaymentBracket[]>(`/api/payment-brackets/job-role/${jobRoleId}${includeInactive ? '?include_inactive=true' : ''}`, { skipBrandContext: true }),
        getById: (bracketId: number) => client.get<PaymentBracket>(`/api/payment-brackets/${bracketId}`, { skipBrandContext: true }),
        create: (data: CreatePaymentBracketData) => client.post<PaymentBracket>('/api/payment-brackets', data, { skipBrandContext: true }),
        update: (bracketId: number, data: UpdatePaymentBracketData) =>
            client.patch<PaymentBracket>(`/api/payment-brackets/${bracketId}`, data, { skipBrandContext: true }),
        delete: (bracketId: number) => client.delete<void>(`/api/payment-brackets/${bracketId}`, { skipBrandContext: true }),
        assign: (data: AssignBracketData) =>
            client.post<CrewMemberBracketAssignment>('/api/payment-brackets/assign', data, { skipBrandContext: true }),
        unassign: (crewMemberId: number, jobRoleId: number) =>
            client.delete<CrewMemberBracketAssignment>(`/api/payment-brackets/contributor/${crewMemberId}/job-role/${jobRoleId}`, { skipBrandContext: true }),
        toggleUnmanned: (crewMemberId: number, jobRoleId: number, isUnmanned: boolean) =>
            client.patch<CrewMemberBracketAssignment>(
                `/api/payment-brackets/contributor/${crewMemberId}/job-role/${jobRoleId}/unmanned`,
                { is_unmanned: isUnmanned },
                { skipBrandContext: true }
            ),
        getCrewMemberBrackets: (crewMemberId: number) =>
            client.get<CrewMemberBracketAssignment[]>(`/api/payment-brackets/contributor/${crewMemberId}`, { skipBrandContext: true }),
        getEffectiveRate: (crewMemberId: number, jobRoleId: number) =>
            client.get<EffectiveRate>(`/api/payment-brackets/effective-rate/${crewMemberId}/${jobRoleId}`, { skipBrandContext: true }),
    };
}

export const paymentBracketsApi = createPaymentBracketsApi(apiClient);

export type PaymentBracketsApi = ReturnType<typeof createPaymentBracketsApi>;
