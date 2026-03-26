import type { ApiClient } from '@/lib/api/api-client.types';
import { apiClient } from '@/lib/api';
import type {
    Contract,
    CreateContractData,
    UpdateContractData,
    ComposeContractData,
    SendContractData,
} from '../types';

export const createContractsApi = (client: ApiClient) => ({
    getById: (inquiryId: number, contractId: number): Promise<Contract> =>
        client.get(`/api/inquiries/${inquiryId}/contracts/${contractId}`),

    getAllByInquiry: (inquiryId: number): Promise<Contract[]> =>
        client.get(`/api/inquiries/${inquiryId}/contracts`),

    create: (inquiryId: number, data: CreateContractData): Promise<Contract> =>
        client.post(`/api/inquiries/${inquiryId}/contracts`, data),

    update: (inquiryId: number, contractId: number, data: UpdateContractData): Promise<Contract> =>
        client.patch(`/api/inquiries/${inquiryId}/contracts/${contractId}`, data),

    delete: (inquiryId: number, contractId: number): Promise<void> =>
        client.delete(`/api/inquiries/${inquiryId}/contracts/${contractId}`),

    compose: (inquiryId: number, data: ComposeContractData): Promise<Contract> =>
        client.post(`/api/inquiries/${inquiryId}/contracts/compose`, data),

    syncTemplate: (inquiryId: number, contractId: number): Promise<Contract> =>
        client.post(`/api/inquiries/${inquiryId}/contracts/${contractId}/sync-template`, {}),

    send: (inquiryId: number, contractId: number, data: SendContractData): Promise<Contract> =>
        client.post(`/api/inquiries/${inquiryId}/contracts/${contractId}/send`, data),
});

export const contractsApi = createContractsApi(apiClient as unknown as ApiClient);
export type ContractsApi = ReturnType<typeof createContractsApi>;
