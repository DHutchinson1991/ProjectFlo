import type { ApiClient } from '@/lib/api/api-client.types';
import { apiClient } from '@/lib/api';
import type { SigningContractView } from '../types';

export const createContractSigningApi = (client: ApiClient) => ({
    getContract: (token: string): Promise<SigningContractView> =>
        client.get(`/api/signing/${token}`),

    submitSignature: (token: string, signatureText: string): Promise<{ success: boolean; allSigned: boolean }> =>
        client.post(`/api/signing/${token}/sign`, { signature_text: signatureText }),
});

export const contractSigningApi = createContractSigningApi(apiClient as unknown as ApiClient);
export type ContractSigningApi = ReturnType<typeof createContractSigningApi>;
