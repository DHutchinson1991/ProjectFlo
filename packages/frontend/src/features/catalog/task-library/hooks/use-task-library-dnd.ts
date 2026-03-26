import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { taskLibraryApi } from '../api';
import { PHASE_LABELS, ProjectPhase } from '@/lib/types';
import type { TaskLibrary, TaskLibraryByPhase } from '@/lib/types';

interface Props {
    tasksByPhase: TaskLibraryByPhase;
    setTasksByPhase: React.Dispatch<React.SetStateAction<TaskLibraryByPhase>>;
    brandId: number | undefined;
    showSnackbar: (msg: string, severity: 'success' | 'error') => void;
}

export function useTaskLibraryDnd({ tasksByPhase, setTasksByPhase, brandId, showSnackbar }: Props) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = () => setIsDragging(true);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setIsDragging(false);
        if (!over || active.id === over.id) return;

        const activeId = parseInt(active.id as string);
        const overId = over.id as string;
        let activeTask: TaskLibrary | null = null;
        let sourcePhase: ProjectPhase | null = null;

        for (const [phase, tasks] of Object.entries(tasksByPhase)) {
            const task = tasks.find(t => t.id === activeId);
            if (task) { activeTask = task; sourcePhase = phase as ProjectPhase; break; }
        }
        if (!activeTask || !sourcePhase) return;

        let targetPhase: ProjectPhase | null = null;
        if (overId.startsWith('phase-')) {
            targetPhase = overId.replace('phase-', '') as ProjectPhase;
        } else {
            const targetTaskId = parseInt(overId);
            for (const [phase, tasks] of Object.entries(tasksByPhase)) {
                if (tasks.find(t => t.id === targetTaskId)) { targetPhase = phase as ProjectPhase; break; }
            }
        }
        if (!targetPhase) return;

        if (targetPhase !== sourcePhase) {
            const sourceTasks = tasksByPhase[sourcePhase].filter(t => t.id !== activeId).map((t, i) => ({ ...t, order_index: i + 1 }));
            const targetTasks = [...tasksByPhase[targetPhase], { ...activeTask, phase: targetPhase, order_index: tasksByPhase[targetPhase].length + 1 }];
            setTasksByPhase(prev => ({ ...prev, [sourcePhase!]: sourceTasks, [targetPhase!]: targetTasks }));
            try {
                await taskLibraryApi.update(activeTask.id, { phase: targetPhase });
                await taskLibraryApi.batchUpdateOrder({ tasks: targetTasks.map(t => ({ id: t.id, order_index: t.order_index })), phase: targetPhase, brand_id: brandId || 0 });
                if (sourceTasks.length > 0) {
                    await taskLibraryApi.batchUpdateOrder({ tasks: sourceTasks.map(t => ({ id: t.id, order_index: t.order_index })), phase: sourcePhase, brand_id: brandId || 0 });
                }
                showSnackbar(`Task moved to ${PHASE_LABELS[targetPhase]} phase`, 'success');
            } catch {
                setTasksByPhase(prev => ({ ...prev, [sourcePhase!]: tasksByPhase[sourcePhase!], [targetPhase!]: tasksByPhase[targetPhase!] }));
                showSnackbar('Failed to move task to different phase', 'error');
            }
            return;
        }

        const targetTaskId = parseInt(overId);
        const tasks = tasksByPhase[targetPhase];
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === targetTaskId);
        if (activeIndex === -1 || overIndex === -1) return;

        const newTasks = [...tasks];
        const [moved] = newTasks.splice(activeIndex, 1);
        newTasks.splice(overIndex, 0, moved);
        const updatedTasks = newTasks.map((t, i) => ({ ...t, order_index: i + 1 }));
        setTasksByPhase(prev => ({ ...prev, [targetPhase!]: updatedTasks }));
        try {
            await taskLibraryApi.batchUpdateOrder({ tasks: updatedTasks.map(t => ({ id: t.id, order_index: t.order_index })), phase: targetPhase, brand_id: brandId || 0 });
            showSnackbar('Task order updated successfully', 'success');
        } catch {
            setTasksByPhase(prev => ({ ...prev, [targetPhase!]: tasks }));
            showSnackbar('Failed to update task order', 'error');
        }
    };

    return { isDragging, handleDragStart, handleDragEnd };
}

