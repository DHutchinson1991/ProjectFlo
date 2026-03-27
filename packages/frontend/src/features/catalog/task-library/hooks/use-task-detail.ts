import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/features/platform/brand';
import { taskLibraryApi } from '../api';
import { ProjectPhase, PricingType, TriggerType } from '@/features/catalog/task-library/types';
import type { TaskLibrary } from '@/features/catalog/task-library/types';

interface ValidationErrors { [key: string]: string; }

export interface TaskFormData {
    name: string; description: string; effort_hours: number;
    phase: ProjectPhase; pricing_type: PricingType;
    fixed_price: number; hourly_rate: number;
    is_active: boolean; trigger_type: TriggerType;
}

const DEFAULT_FORM: TaskFormData = {
    name: '', description: '', effort_hours: 0, phase: ProjectPhase.LEAD,
    pricing_type: PricingType.HOURLY, fixed_price: 0, hourly_rate: 0,
    is_active: true, trigger_type: TriggerType.ALWAYS,
};

function taskToForm(t: TaskLibrary): TaskFormData {
    return {
        name: t.name, description: t.description || '', effort_hours: t.effort_hours,
        phase: t.phase, pricing_type: t.pricing_type, fixed_price: t.fixed_price || 0,
        hourly_rate: t.hourly_rate || 0, is_active: t.is_active,
        trigger_type: t.trigger_type || TriggerType.ALWAYS,
    };
}

export function useTaskDetail(taskId: string) {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const isNewTask = taskId === 'new';
    const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

    const [task, setTask] = useState<TaskLibrary | null>(null);
    const [loading, setLoading] = useState(!isNewTask);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(isNewTask);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning',
    });
    const [formData, setFormData] = useState<TaskFormData>(DEFAULT_FORM);

    useEffect(() => {
        if (isNewTask) { setLoading(false); return; }
        const load = async () => {
            try {
                setLoading(true);
                const data = await taskLibraryApi.getById(parseInt(taskId));
                setTask(data); setFormData(taskToForm(data));
            } catch { setError('Failed to load task'); } finally { setLoading(false); }
        };
        load();
    }, [taskId, isNewTask]);

    const handleAutoSave = useCallback(async (data: TaskFormData) => {
        if (isNewTask || !isEditing) return;
        try {
            setAutoSaving(true);
            await taskLibraryApi.update(parseInt(taskId), data);
            setHasUnsavedChanges(false);
            setSnackbar({ open: true, message: 'Changes saved automatically', severity: 'info' });
        } catch { /* silent */ } finally { setAutoSaving(false); }
    }, [taskId, isNewTask, isEditing]);

    const handleFormChange = useCallback((field: keyof TaskFormData, value: unknown) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (validationErrors[field]) setValidationErrors(e => { const n = { ...e }; delete n[field]; return n; });
            setHasUnsavedChanges(true);
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
            if (!isNewTask && isEditing) autoSaveRef.current = setTimeout(() => handleAutoSave(next), 2000);
            return next;
        });
    }, [validationErrors, isNewTask, isEditing, handleAutoSave]);

    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors = {};
        if (!formData.name?.trim()) errors.name = 'Task name is required';
        if ((formData.effort_hours ?? 0) < 0) errors.effort_hours = 'Effort hours must be positive';
        if (formData.pricing_type === PricingType.FIXED && !formData.fixed_price) errors.fixed_price = 'Fixed price is required';
        if (formData.pricing_type === PricingType.HOURLY && !formData.hourly_rate) errors.hourly_rate = 'Hourly rate is required';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleSave = async () => {
        if (!validateForm()) { setSnackbar({ open: true, message: 'Please fix validation errors', severity: 'error' }); return; }
        try {
            setSaving(true);
            if (isNewTask) {
                if (!currentBrand?.id) { setSnackbar({ open: true, message: 'No brand selected', severity: 'error' }); return; }
                const created = await taskLibraryApi.create({ ...formData, brand_id: currentBrand.id });
                setSnackbar({ open: true, message: 'Task created successfully', severity: 'success' });
                router.push(`/tasks/${created.id}`);
            } else {
                const updated = await taskLibraryApi.update(parseInt(taskId), formData);
                setTask(updated);
                setSnackbar({ open: true, message: 'Task updated', severity: 'success' });
                setIsEditing(false); setHasUnsavedChanges(false);
            }
        } catch { setSnackbar({ open: true, message: isNewTask ? 'Failed to create task' : 'Failed to update task', severity: 'error' }); }
        finally { setSaving(false); }
    };

    const handleCancel = () => {
        if (isNewTask) { router.push('/task-library'); return; }
        setIsEditing(false);
        if (task) setFormData(taskToForm(task));
        setHasUnsavedChanges(false);
    };

    return {
        task, loading, saving, autoSaving, isEditing, setIsEditing, error, tabValue,
        handleTabChange: (_: React.SyntheticEvent, v: number) => setTabValue(v),
        validationErrors, hasUnsavedChanges, snackbar, setSnackbar, formData,
        handleFormChange, handleSave, handleCancel, isNewTask,
    };
}
