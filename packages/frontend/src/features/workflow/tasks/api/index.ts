import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { ActiveTask, TaskAutoGenerationPreview } from '@/features/workflow/tasks/types';

export function createActiveTasksApi(client: ApiClient) {
    return {
        getAll: (status?: string) =>
            client.get<ActiveTask[]>(`/api/calendar/active-tasks${status ? `?status=${status}` : ''}`),
        previewAutoGeneration: (packageId: number, _brandId?: number, inquiryId?: number, projectId?: number) => {
            const params = new URLSearchParams();
            if (inquiryId) params.set('inquiryId', String(inquiryId));
            if (projectId) params.set('projectId', String(projectId));
            const query = params.toString();
            return client.get<TaskAutoGenerationPreview>(`/api/task-library/auto-generate/preview/${packageId}${query ? `?${query}` : ''}`);
        },
        assign: (taskId: number, source: 'inquiry' | 'project', assignedToId: number | null, taskKind: 'task' | 'subtask' = 'task') =>
            client.patch<unknown>(`/api/calendar/active-tasks/${taskId}/assign`, { source, assigned_to_id: assignedToId, task_kind: taskKind }),
        toggle: (taskId: number, source: 'inquiry' | 'project', taskKind: 'task' | 'subtask' = 'task', completedById?: number) =>
            client.patch<unknown>(`/api/calendar/active-tasks/${taskId}/toggle`, { source, task_kind: taskKind, completed_by_id: completedById }),
    };
}

export const activeTasksApi = createActiveTasksApi(apiClient);
