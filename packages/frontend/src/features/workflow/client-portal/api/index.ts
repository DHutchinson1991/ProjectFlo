import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

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
    };
}

export const clientPortalApi = createClientPortalApi(apiClient);

export type ClientPortalApi = ReturnType<typeof createClientPortalApi>;
