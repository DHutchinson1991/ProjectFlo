import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
    TaskLibrary,
    TaskLibraryBenchmark,
    TaskLibrarySkillRate,
    TaskLibraryByPhase,
    TaskLibrarySubtaskTemplate,
    CreateTaskLibraryDto,
    UpdateTaskLibraryDto,
    CreateTaskLibraryBenchmarkDto,
    UpdateTaskLibraryBenchmarkDto,
    CreateTaskLibrarySkillRateDto,
    UpdateTaskLibrarySkillRateDto,
    TaskAutoGenerationPreview,
    ExecuteAutoGenerationDto,
    ExecuteAutoGenerationResult,
    CreateSubtaskTemplateDto,
    UpdateSubtaskTemplateDto,
} from '@/features/catalog/task-library/types';

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
            client.get(`/api/task-library${buildQs(query ?? {})}`),

        getById: (id: number): Promise<TaskLibrary> =>
            client.get(`/api/task-library/${id}`),

        create: (data: CreateTaskLibraryDto): Promise<TaskLibrary> =>
            client.post('/api/task-library', data),

        update: (id: number, data: UpdateTaskLibraryDto): Promise<TaskLibrary> =>
            client.patch(`/api/task-library/${id}`, data),

        delete: (id: number): Promise<void> =>
            client.delete(`/api/task-library/${id}`),

        getGroupedByPhase: async (): Promise<TaskLibraryByPhase> => {
            const response: { groupedByPhase: TaskLibraryByPhase } =
                await client.get('/api/task-library?is_active=true');
            return response.groupedByPhase;
        },

        batchUpdateOrder: (data: BatchUpdateTaskOrderDto): Promise<void> =>
            client.patch('/api/task-library/batch-update-order', data),

        benchmarks: {
            getAll: (taskLibraryId: number): Promise<TaskLibraryBenchmark[]> =>
                client.get(`/api/task-library/${taskLibraryId}/benchmarks`),
            create: (data: CreateTaskLibraryBenchmarkDto): Promise<TaskLibraryBenchmark> =>
                client.post('/api/task-library/benchmarks', data),
            update: (id: number, data: UpdateTaskLibraryBenchmarkDto): Promise<TaskLibraryBenchmark> =>
                client.patch(`/api/task-library/benchmarks/${id}`, data),
            delete: (id: number): Promise<void> =>
                client.delete(`/api/task-library/benchmarks/${id}`),
        },

        skillRates: {
            getAll: (taskLibraryId: number): Promise<TaskLibrarySkillRate[]> =>
                client.get(`/api/task-library/${taskLibraryId}/skill-rates`),
            create: (data: CreateTaskLibrarySkillRateDto): Promise<TaskLibrarySkillRate> =>
                client.post('/api/task-library/skill-rates', data),
            update: (id: number, data: UpdateTaskLibrarySkillRateDto): Promise<TaskLibrarySkillRate> =>
                client.patch(`/api/task-library/skill-rates/${id}`, data),
            delete: (id: number): Promise<void> =>
                client.delete(`/api/task-library/skill-rates/${id}`),
        },

        previewAutoGeneration: (
            packageId: number,
            brandId: number,
            inquiryId?: number,
            projectId?: number,
        ): Promise<TaskAutoGenerationPreview> => {
            let url = `/api/task-library/auto-generate/preview/${packageId}?brandId=${brandId}`;
            if (inquiryId) url += `&inquiryId=${inquiryId}`;
            if (projectId) url += `&projectId=${projectId}`;
            return client.get(url);
        },

        executeAutoGeneration: (dto: ExecuteAutoGenerationDto): Promise<ExecuteAutoGenerationResult> =>
            client.post('/api/task-library/auto-generate/execute', dto),

        syncCrew: (): Promise<{ updated: number }> =>
            client.post('/api/task-library/sync-crew', {}),

        subtasks: {
            create: (taskId: number, data: CreateSubtaskTemplateDto): Promise<TaskLibrarySubtaskTemplate> =>
                client.post(`/api/task-library/${taskId}/subtasks`, data),
            update: (taskId: number, subtaskId: number, data: UpdateSubtaskTemplateDto): Promise<TaskLibrarySubtaskTemplate> =>
                client.patch(`/api/task-library/${taskId}/subtasks/${subtaskId}`, data),
            delete: (taskId: number, subtaskId: number): Promise<void> =>
                client.delete(`/api/task-library/${taskId}/subtasks/${subtaskId}`),
        },
    };
}

export const taskLibraryApi = createTaskLibraryApi(apiClient);
export type TaskLibraryApi = ReturnType<typeof createTaskLibraryApi>;
