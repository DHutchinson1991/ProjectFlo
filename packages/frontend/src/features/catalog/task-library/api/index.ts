import { apiClient } from '@/lib/api';
import type { ApiClient } from '@/lib/api/api-client.types';
import type {
    TaskLibrary,
    TaskLibraryBenchmark,
    TaskLibrarySkillRate,
    TaskLibraryByPhase,
    CreateTaskLibraryDto,
    UpdateTaskLibraryDto,
    CreateTaskLibraryBenchmarkDto,
    UpdateTaskLibraryBenchmarkDto,
    CreateTaskLibrarySkillRateDto,
    UpdateTaskLibrarySkillRateDto,
    TaskAutoGenerationPreview,
    ExecuteAutoGenerationDto,
    ExecuteAutoGenerationResult,
} from '@/lib/types';

export interface BatchUpdateTaskOrderDto {
    tasks: Array<{ id: number; order_index: number }>;
    phase: string;
    brand_id: number;
}

export function createTaskLibraryApi(client: ApiClient) {
    function buildQs(params: Record<string, string | number | boolean | undefined>): string {
        const p = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined) p.append(k, v.toString());
        }
        const qs = p.toString();
        return qs ? `?${qs}` : '';
    }

    return {
        getAll: (query?: { phase?: string; is_active?: boolean }): Promise<TaskLibrary[]> =>
            client.get(`/task-library${buildQs(query ?? {})}`),

        getById: (id: number): Promise<TaskLibrary> =>
            client.get(`/task-library/${id}`),

        create: (data: CreateTaskLibraryDto): Promise<TaskLibrary> =>
            client.post('/task-library', data),

        update: (id: number, data: UpdateTaskLibraryDto): Promise<TaskLibrary> =>
            client.patch(`/task-library/${id}`, data),

        delete: (id: number): Promise<void> =>
            client.delete(`/task-library/${id}`),

        getGroupedByPhase: async (): Promise<TaskLibraryByPhase> => {
            const response: { groupedByPhase: TaskLibraryByPhase } =
                await client.get('/task-library?is_active=true');
            return response.groupedByPhase;
        },

        batchUpdateOrder: (data: BatchUpdateTaskOrderDto): Promise<void> =>
            client.patch('/task-library/batch-update-order', data),

        benchmarks: {
            getAll: (taskLibraryId: number): Promise<TaskLibraryBenchmark[]> =>
                client.get(`/task-library/${taskLibraryId}/benchmarks`),
            create: (data: CreateTaskLibraryBenchmarkDto): Promise<TaskLibraryBenchmark> =>
                client.post('/task-library/benchmarks', data),
            update: (id: number, data: UpdateTaskLibraryBenchmarkDto): Promise<TaskLibraryBenchmark> =>
                client.patch(`/task-library/benchmarks/${id}`, data),
            delete: (id: number): Promise<void> =>
                client.delete(`/task-library/benchmarks/${id}`),
        },

        skillRates: {
            getAll: (taskLibraryId: number): Promise<TaskLibrarySkillRate[]> =>
                client.get(`/task-library/${taskLibraryId}/skill-rates`),
            create: (data: CreateTaskLibrarySkillRateDto): Promise<TaskLibrarySkillRate> =>
                client.post('/task-library/skill-rates', data),
            update: (id: number, data: UpdateTaskLibrarySkillRateDto): Promise<TaskLibrarySkillRate> =>
                client.patch(`/task-library/skill-rates/${id}`, data),
            delete: (id: number): Promise<void> =>
                client.delete(`/task-library/skill-rates/${id}`),
        },

        previewAutoGeneration: (
            packageId: number,
            brandId: number,
            inquiryId?: number,
            projectId?: number,
        ): Promise<TaskAutoGenerationPreview> => {
            let url = `/task-library/auto-generate/preview/${packageId}?brandId=${brandId}`;
            if (inquiryId) url += `&inquiryId=${inquiryId}`;
            if (projectId) url += `&projectId=${projectId}`;
            return client.get(url);
        },

        executeAutoGeneration: (dto: ExecuteAutoGenerationDto): Promise<ExecuteAutoGenerationResult> =>
            client.post('/task-library/auto-generate/execute', dto),

        syncContributors: (): Promise<{ updated: number }> =>
            client.post('/task-library/sync-contributors', {}),
    };
}

export const taskLibraryApi = createTaskLibraryApi(apiClient as unknown as ApiClient);
export type TaskLibraryApi = ReturnType<typeof createTaskLibraryApi>;
