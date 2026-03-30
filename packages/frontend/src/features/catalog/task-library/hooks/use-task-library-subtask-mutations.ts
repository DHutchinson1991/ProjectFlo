import { taskLibraryApi } from '../api';
import type { TaskLibrary, TaskLibrarySubtaskTemplate, CreateSubtaskTemplateDto, UpdateSubtaskTemplateDto } from '../types';

/**
 * Low-level async helpers for subtask template CRUD.
 * Designed to be called from TaskDetailPanel with local optimistic state.
 */
export function useTaskLibrarySubtaskMutations(
    onTaskUpdated: (taskId: number, updater: (t: TaskLibrary) => TaskLibrary) => void,
) {
    const applySubtaskUpdate = (taskId: number, updater: (subtasks: TaskLibrarySubtaskTemplate[]) => TaskLibrarySubtaskTemplate[]) => {
        onTaskUpdated(taskId, (task) => ({
            ...task,
            task_library_subtask_templates: updater(task.task_library_subtask_templates ?? []),
        }));
    };

    const createSubtask = async (taskId: number, dto: CreateSubtaskTemplateDto) => {
        const created = await taskLibraryApi.subtasks.create(taskId, dto);
        applySubtaskUpdate(taskId, (prev) => [...prev, created].sort((a, b) => a.order_index - b.order_index));
        return created;
    };

    const updateSubtask = async (taskId: number, subtaskId: number, dto: UpdateSubtaskTemplateDto) => {
        const updated = await taskLibraryApi.subtasks.update(taskId, subtaskId, dto);
        applySubtaskUpdate(taskId, (prev) =>
            prev.map((s) => (s.id === subtaskId ? { ...s, ...updated } : s)),
        );
        return updated;
    };

    const removeSubtask = async (taskId: number, subtaskId: number) => {
        await taskLibraryApi.subtasks.delete(taskId, subtaskId);
        applySubtaskUpdate(taskId, (prev) => prev.filter((s) => s.id !== subtaskId));
    };

    return { createSubtask, updateSubtask, removeSubtask };
}
