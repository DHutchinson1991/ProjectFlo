import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { SigningContractView } from '../types';

export const createContractSigningApi = (client: ApiClient) => ({
    getContract: (token: string): Promise<SigningContractView> =>
        client.get(`/api/signing/${token}`),

    submitSignature: (token: string, signatureText: string): Promise<{ success: boolean; allSigned: boolean }> =>
        client.post(`/api/signing/${token}/sign`, { signature_text: signatureText }),
});

export const contractSigningApi = createContractSigningApi(apiClient);
export type ContractSigningApi = ReturnType<typeof createContractSigningApi>;
