import { useState } from 'react';
import { useBrand } from '@/app/providers/BrandProvider';
import { taskLibraryApi } from '../api';
import { PricingType } from '@/lib/types';
import type { TaskLibrary, TaskLibraryByPhase, JobRole } from '@/lib/types';

interface Props {
    tasksByPhase: TaskLibraryByPhase;
    setTasksByPhase: React.Dispatch<React.SetStateAction<TaskLibraryByPhase>>;
    setError: (err: string | null) => void;
    jobRoles: JobRole[];
    loadTasks: () => void;
}

export function useTaskLibraryMutations({ tasksByPhase, setTasksByPhase, setError, jobRoles, loadTasks }: Props) {
    const { currentBrand } = useBrand();
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<TaskLibrary | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [inlineEditingTask, setInlineEditingTask] = useState<number | null>(null);
    const [inlineEditData, setInlineEditData] = useState<Partial<TaskLibrary>>({});
    const [quickAddPhase, setQuickAddPhase] = useState<string | null>(null);
    const [quickAddData, setQuickAddData] = useState<Partial<TaskLibrary>>({
        name: '', description: '', effort_hours: 1,
        pricing_type: PricingType.HOURLY, hourly_rate: 100, is_active: true,
    });

    const showSnackbar = (msg: string, severity: 'success' | 'error') => {
        setSnackbarMessage(msg); setSnackbarSeverity(severity); setSnackbarOpen(true);
    };

    const startInlineEdit = (task: TaskLibrary) => {
        setInlineEditingTask(task.id);
        setInlineEditData({
            name: task.name, description: task.description || '',
            effort_hours: task.effort_hours, phase: task.phase,
            pricing_type: task.pricing_type, fixed_price: task.fixed_price,
            hourly_rate: task.hourly_rate, is_active: task.is_active,
            trigger_type: task.trigger_type, due_date_offset_days: task.due_date_offset_days,
        });
    };

    const cancelInlineEdit = () => { setInlineEditingTask(null); setInlineEditData({}); };
    const updateInlineEditData = (field: keyof TaskLibrary, value: unknown) =>
        setInlineEditData(prev => ({ ...prev, [field]: value }));

    const saveInlineEdit = async () => {
        if (!inlineEditingTask) return;
        try {
            const data = {
                name: inlineEditData.name || '',
                description: inlineEditData.description || '',
                effort_hours: inlineEditData.effort_hours || 0,
                phase: inlineEditData.phase,
                pricing_type: inlineEditData.pricing_type || PricingType.HOURLY,
                fixed_price: inlineEditData.fixed_price,
                hourly_rate: inlineEditData.hourly_rate,
                is_active: inlineEditData.is_active ?? true,
                trigger_type: inlineEditData.trigger_type,
                due_date_offset_days: inlineEditData.due_date_offset_days ?? null,
            };
            await taskLibraryApi.update(inlineEditingTask, data);
            setTasksByPhase(prev => {
                const next = { ...prev };
                for (const [phase, tasks] of Object.entries(next)) {
                    const idx = tasks.findIndex(t => t.id === inlineEditingTask);
                    if (idx !== -1) {
                        next[phase] = [...tasks.slice(0, idx), { ...tasks[idx], ...data } as TaskLibrary, ...tasks.slice(idx + 1)];
                        break;
                    }
                }
                return next;
            });
            showSnackbar('Task updated successfully', 'success');
            setInlineEditingTask(null); setInlineEditData({});
        } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update task'); }
    };

    const handleDelete = async () => {
        if (!taskToDelete) return;
        try {
            await taskLibraryApi.delete(taskToDelete.id);
            setTasksByPhase(prev => {
                const next = { ...prev };
                for (const [phase, tasks] of Object.entries(next)) {
                    const idx = tasks.findIndex(t => t.id === taskToDelete.id);
                    if (idx !== -1) { next[phase] = tasks.filter(t => t.id !== taskToDelete.id); break; }
                }
                return next;
            });
            showSnackbar('Task deleted successfully', 'success');
            setDeleteConfirmOpen(false); setTaskToDelete(null);
        } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete task'); }
    };

    const startQuickAdd = (phase: string, parentStageId?: number) => {
        setQuickAddPhase(phase);
        setQuickAddData({ name: '', description: '', effort_hours: 1, pricing_type: PricingType.HOURLY, hourly_rate: 100, is_active: true, parent_task_id: parentStageId ?? null, default_job_role_id: null });
    };

    const cancelQuickAdd = () => {
        setQuickAddPhase(null);
        setQuickAddData({ name: '', description: '', effort_hours: 1, pricing_type: PricingType.HOURLY, hourly_rate: 100, is_active: true, parent_task_id: null, default_job_role_id: null });
    };

    const updateQuickAddData = (field: keyof TaskLibrary, value: unknown) =>
        setQuickAddData(prev => ({ ...prev, [field]: value }));

    const saveQuickAdd = async () => {
        if (!quickAddPhase || !quickAddData.name || !currentBrand) return;
        try {
            const data = {
                name: quickAddData.name, description: quickAddData.description || '',
                effort_hours: quickAddData.effort_hours || 1,
                phase: quickAddPhase as TaskLibrary['phase'],
                pricing_type: quickAddData.pricing_type || PricingType.HOURLY,
                fixed_price: quickAddData.fixed_price, hourly_rate: quickAddData.hourly_rate,
                is_active: quickAddData.is_active ?? true, trigger_type: quickAddData.trigger_type,
                due_date_offset_days: quickAddData.due_date_offset_days ?? null,
                brand_id: currentBrand.id,
                parent_task_id: quickAddData.parent_task_id ?? undefined,
                default_job_role_id: quickAddData.default_job_role_id ?? undefined,
            };
            const created = await taskLibraryApi.create(data);
            if (quickAddData.parent_task_id) {
                await loadTasks();
            } else {
                setTasksByPhase(prev => {
                    const current = prev[quickAddPhase] || [];
                    return { ...prev, [quickAddPhase]: [...current, { ...created, order_index: current.length + 1, default_job_role: quickAddData.default_job_role_id ? jobRoles.find(r => r.id === quickAddData.default_job_role_id) ?? null : null }] };
                });
            }
            showSnackbar('Task created successfully', 'success');
            cancelQuickAdd();
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to create task', 'error');
        }
    };

    return {
        deleteConfirmOpen, setDeleteConfirmOpen, taskToDelete, setTaskToDelete,
        snackbarOpen, setSnackbarOpen, snackbarMessage, snackbarSeverity,
        inlineEditingTask, inlineEditData, updateInlineEditData, startInlineEdit, cancelInlineEdit, saveInlineEdit,
        quickAddPhase, quickAddData, startQuickAdd, cancelQuickAdd, saveQuickAdd, updateQuickAddData,
        handleDelete,
    };
}
