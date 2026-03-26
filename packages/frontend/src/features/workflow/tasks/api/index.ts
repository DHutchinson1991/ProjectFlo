import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { ActiveTask, TaskAutoGenerationPreview } from '@/lib/types';

export function createActiveTasksApi(client: ApiClient) {
    return {
        getAll: (status?: string) =>
            client.get<ActiveTask[]>(`/calendar/active-tasks${status ? `?status=${status}` : ''}`),
        previewAutoGeneration: (packageId: number, brandId: number, inquiryId?: number, projectId?: number) => {
            let url = `/task-library/auto-generate/preview/${packageId}?brandId=${brandId}`;
            if (inquiryId) url += `&inquiryId=${inquiryId}`;
            if (projectId) url += `&projectId=${projectId}`;
            return client.get<TaskAutoGenerationPreview>(url);
        },
        assign: (taskId: number, source: 'inquiry' | 'project', assignedToId: number | null, taskKind: 'task' | 'subtask' = 'task') =>
            client.patch<unknown>(`/calendar/active-tasks/${taskId}/assign`, { source, assigned_to_id: assignedToId, task_kind: taskKind }),
        toggle: (taskId: number, source: 'inquiry' | 'project', taskKind: 'task' | 'subtask' = 'task', completedById?: number) =>
            client.patch<unknown>(`/calendar/active-tasks/${taskId}/toggle`, { source, task_kind: taskKind, completed_by_id: completedById }),
    };
}

export const activeTasksApi = createActiveTasksApi(apiClient);
