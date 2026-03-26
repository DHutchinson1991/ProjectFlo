import type { ApiClient } from '@/lib/api/api-client.types';
import { apiClient } from '@/lib/api';
import type {
    ContractClause,
    ContractClauseCategory,
    CreateContractClauseCategoryData,
    UpdateContractClauseCategoryData,
    CreateContractClauseData,
    UpdateContractClauseData,
} from '../types';

export const createContractClausesApi = (client: ApiClient) => ({
    // Categories
    getCategories: (): Promise<ContractClauseCategory[]> =>
        client.get('/api/contract-clauses/categories'),

    getCategory: (id: number): Promise<ContractClauseCategory> =>
        client.get(`/api/contract-clauses/categories/${id}`),

    createCategory: (data: CreateContractClauseCategoryData): Promise<ContractClauseCategory> =>
        client.post('/api/contract-clauses/categories', data),

    updateCategory: (id: number, data: UpdateContractClauseCategoryData): Promise<ContractClauseCategory> =>
        client.patch(`/api/contract-clauses/categories/${id}`, data),

    deleteCategory: (id: number): Promise<void> =>
        client.delete(`/api/contract-clauses/categories/${id}`),

    reorderCategories: (ids: number[]): Promise<ContractClauseCategory[]> =>
        client.patch('/api/contract-clauses/categories/reorder', { ids }),

    reorderClauses: (categoryId: number, ids: number[]): Promise<ContractClauseCategory> =>
        client.patch(`/api/contract-clauses/categories/${categoryId}/reorder-clauses`, { ids }),

    // Clauses
    getAll: (categoryId?: number): Promise<ContractClause[]> => {
        const params = categoryId ? `?categoryId=${categoryId}` : '';
        return client.get(`/api/contract-clauses${params}`);
    },

    getById: (id: number): Promise<ContractClause> =>
        client.get(`/api/contract-clauses/${id}`),

    create: (data: CreateContractClauseData): Promise<ContractClause> =>
        client.post('/api/contract-clauses', data),

    update: (id: number, data: UpdateContractClauseData): Promise<ContractClause> =>
        client.patch(`/api/contract-clauses/${id}`, data),

    delete: (id: number): Promise<void> =>
        client.delete(`/api/contract-clauses/${id}`),

    seedDefaults: (countryCode: string): Promise<ContractClauseCategory[]> =>
        client.post('/api/contract-clauses/seed-defaults', { countryCode }),
});

export const contractClausesApi = createContractClausesApi(apiClient as unknown as ApiClient);
export type ContractClausesApi = ReturnType<typeof createContractClausesApi>;
