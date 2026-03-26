import type { ApiClient } from '@/lib/api/api-client.types';
import { apiClient } from '@/lib/api';
import type {
    ContractTemplate,
    CreateContractTemplateData,
    UpdateContractTemplateData,
    ContractVariableCategory,
    ContractPreview,
} from '../types';

export const createContractTemplatesApi = (client: ApiClient) => ({
    getAll: (): Promise<ContractTemplate[]> =>
        client.get('/api/contract-templates'),

    getById: (id: number): Promise<ContractTemplate> =>
        client.get(`/api/contract-templates/${id}`),

    create: (data: CreateContractTemplateData): Promise<ContractTemplate> =>
        client.post('/api/contract-templates', data),

    update: (id: number, data: UpdateContractTemplateData): Promise<ContractTemplate> =>
        client.patch(`/api/contract-templates/${id}`, data),

    delete: (id: number): Promise<void> =>
        client.delete(`/api/contract-templates/${id}`),

    getVariables: (): Promise<ContractVariableCategory[]> =>
        client.get('/api/contract-templates/variables'),

    preview: (id: number, inquiryId?: number): Promise<ContractPreview> =>
        client.post(`/api/contract-templates/${id}/preview`, { inquiryId }),

    seedDefaults: (): Promise<ContractTemplate[]> =>
        client.post('/api/contract-templates/seed-defaults', {}),
});

export const contractTemplatesApi = createContractTemplatesApi(apiClient as unknown as ApiClient);
export type ContractTemplatesApi = ReturnType<typeof createContractTemplatesApi>;
