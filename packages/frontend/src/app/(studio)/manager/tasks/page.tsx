"use client";

import React, { useState, useEffect } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { api } from "@/lib/api";
import {
    TaskLibrary,
    TaskLibraryByPhase,
    TaskLibraryPhaseGroup,
    ProjectPhase,
    PricingType,
    PHASE_LABELS,
    JobRole,
    SkillRoleMapping,
    Contributor,
} from "@/lib/types";
import { useBrand } from "@/app/providers/BrandProvider";
import { TasksContent } from "./components/TasksContent";

export default function TasksPage() {
    const { currentBrand } = useBrand();

    // State
    const [tasksByPhase, setTasksByPhase] = useState<TaskLibraryByPhase>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<TaskLibrary | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

    // Inline editing state
    const [inlineEditingTask, setInlineEditingTask] = useState<number | null>(null);
    const [inlineEditData, setInlineEditData] = useState<Partial<TaskLibrary>>({});

    // Quick add state
    const [quickAddPhase, setQuickAddPhase] = useState<string | null>(null);
    const [quickAddData, setQuickAddData] = useState<Partial<TaskLibrary>>({
        name: '',
        description: '',
        effort_hours: 1,
        pricing_type: PricingType.HOURLY,
        hourly_rate: 100,
        is_active: true,
    });

    // Expanded phases state
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

    // Drag and drop state
    const [isDragging, setIsDragging] = useState(false);

    // Role/skills state
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [allMappings, setAllMappings] = useState<SkillRoleMapping[]>([]);
    const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
    const [contributors, setContributors] = useState<Contributor[]>([]);

    // Load tasks
    const loadTasks = async () => {
        try {
            setLoading(true);
            const grouped = await api.taskLibrary.getGroupedByPhase();
            setTasksByPhase(grouped);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    // Load job roles
    const loadJobRoles = async () => {
        try {
            const roles = await api.jobRoles.getAll();
            setJobRoles(roles);
        } catch (err: unknown) {
            console.error("Failed to load job roles:", err);
        }
    };

    // Load all skill-role mappings (for tier/rate resolution in main rows)
    const loadAllMappings = async () => {
        try {
            const mappings = await api.skillRoleMappings.getAll();
            setAllMappings(mappings);
        } catch (err: unknown) {
            console.error("Failed to load skill-role mappings:", err);
        }
    };

    // Load contributors (for default contributor column)
    const loadContributors = async () => {
        try {
            const data = await api.contributors.getAll();
            setContributors(data);
        } catch (err: unknown) {
            console.error("Failed to load contributors:", err);
        }
    };

    useEffect(() => {
        if (currentBrand) {
            loadTasks();
            loadJobRoles();
            loadAllMappings();
            loadContributors();
        }
    }, [currentBrand]);

    // Handle phase expansion
    const handlePhaseToggle = (phase: string) => {
        setExpandedPhases(prev => ({
            ...prev,
            [phase]: !prev[phase],
        }));
    };

    // Handle phase card click - open specific phase and close others
    const handlePhaseCardClick = (phase: string) => {
        // Close all phases first, then open the clicked one
        const newExpandedPhases: Record<string, boolean> = {};
        Object.values(ProjectPhase).forEach(p => {
            newExpandedPhases[p] = p === phase;
        });
        setExpandedPhases(newExpandedPhases);
    };

    // Inline editing functions
    const startInlineEdit = (task: TaskLibrary) => {
        setInlineEditingTask(task.id);
        setInlineEditData({
            name: task.name,
            description: task.description || "",
            effort_hours: task.effort_hours,
            phase: task.phase,
            pricing_type: task.pricing_type,
            fixed_price: task.fixed_price,
            hourly_rate: task.hourly_rate,
            is_active: task.is_active,
            trigger_type: task.trigger_type,
            due_date_offset_days: task.due_date_offset_days,
        });
    };

    const cancelInlineEdit = () => {
        setInlineEditingTask(null);
        setInlineEditData({});
    };

    const saveInlineEdit = async () => {
        if (!inlineEditingTask) return;

        try {
            const updatedTaskData = {
                name: inlineEditData.name || "",
                description: inlineEditData.description || "",
                effort_hours: inlineEditData.effort_hours || 0,
                phase: inlineEditData.phase,
                pricing_type: inlineEditData.pricing_type || PricingType.HOURLY,
                fixed_price: inlineEditData.fixed_price,
                hourly_rate: inlineEditData.hourly_rate,
                is_active: inlineEditData.is_active ?? true,
                trigger_type: inlineEditData.trigger_type,
                due_date_offset_days: inlineEditData.due_date_offset_days ?? null,
            };

            await api.taskLibrary.update(inlineEditingTask, updatedTaskData);

            // Update the task in local state
            setTasksByPhase(prev => {
                const newState = { ...prev };
                for (const [phase, tasks] of Object.entries(newState)) {
                    const taskIndex = tasks.findIndex(t => t.id === inlineEditingTask);
                    if (taskIndex !== -1) {
                        newState[phase] = [
                            ...tasks.slice(0, taskIndex),
                            { ...tasks[taskIndex], ...updatedTaskData } as TaskLibrary,
                            ...tasks.slice(taskIndex + 1)
                        ];
                        break;
                    }
                }
                return newState;
            });

            setSnackbarMessage("Task updated successfully");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            setInlineEditingTask(null);
            setInlineEditData({});
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update task");
        }
    };

    const updateInlineEditData = (field: keyof TaskLibrary, value: unknown) => {
        setInlineEditData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleDelete = async () => {
        if (!taskToDelete) return;

        try {
            await api.taskLibrary.delete(taskToDelete.id);

            // Remove the task from local state
            setTasksByPhase(prev => {
                const newState = { ...prev };
                for (const [phase, tasks] of Object.entries(newState)) {
                    const taskIndex = tasks.findIndex(t => t.id === taskToDelete.id);
                    if (taskIndex !== -1) {
                        newState[phase] = tasks.filter(t => t.id !== taskToDelete.id);
                        break;
                    }
                }
                return newState;
            });

            setSnackbarMessage("Task deleted successfully");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            setDeleteConfirmOpen(false);
            setTaskToDelete(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to delete task");
        }
    };

    // Quick add functions
    const startQuickAdd = (phase: string, parentStageId?: number) => {
        setQuickAddPhase(phase);
        setQuickAddData({
            name: '',
            description: '',
            effort_hours: 1,
            pricing_type: PricingType.HOURLY,
            hourly_rate: 100,
            is_active: true,
            parent_task_id: parentStageId ?? null,
            default_job_role_id: null,
        });
    };

    const cancelQuickAdd = () => {
        setQuickAddPhase(null);
        setQuickAddData({
            name: '',
            description: '',
            effort_hours: 1,
            pricing_type: PricingType.HOURLY,
            hourly_rate: 100,
            is_active: true,
            parent_task_id: null,
            default_job_role_id: null,
        });
    };

    const saveQuickAdd = async () => {
        if (!quickAddPhase || !quickAddData.name || !currentBrand) return;

        try {
            const newTaskData = {
                name: quickAddData.name,
                description: quickAddData.description || '',
                effort_hours: quickAddData.effort_hours || 1,
                phase: quickAddPhase as ProjectPhase,
                pricing_type: quickAddData.pricing_type || PricingType.HOURLY,
                fixed_price: quickAddData.fixed_price,
                hourly_rate: quickAddData.hourly_rate,
                is_active: quickAddData.is_active ?? true,
                trigger_type: quickAddData.trigger_type,
                due_date_offset_days: quickAddData.due_date_offset_days ?? null,
                brand_id: currentBrand.id,
                parent_task_id: quickAddData.parent_task_id ?? undefined,
                default_job_role_id: quickAddData.default_job_role_id ?? undefined,
            };

            const createdTask = await api.taskLibrary.create(newTaskData);

            // If task has a parent_task_id, reload to get proper hierarchy
            // Otherwise add to local state optimistically
            if (quickAddData.parent_task_id) {
                await loadTasks();
            } else {
                setTasksByPhase(prev => {
                    const currentPhaseTasks = prev[quickAddPhase] || [];
                    const newOrder = currentPhaseTasks.length + 1;
                    const taskWithOrder = {
                        ...createdTask,
                        order_index: newOrder,
                        default_job_role: quickAddData.default_job_role_id
                            ? jobRoles.find(r => r.id === quickAddData.default_job_role_id) ?? null
                            : null,
                    };

                    return {
                        ...prev,
                        [quickAddPhase]: [...currentPhaseTasks, taskWithOrder],
                    };
                });
            }

            setSnackbarMessage("Task created successfully");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            setQuickAddPhase(null);
            setQuickAddData({
                name: '',
                description: '',
                effort_hours: 1,
                pricing_type: PricingType.HOURLY,
                hourly_rate: 100,
                is_active: true,
                parent_task_id: null,
                default_job_role_id: null,
            });
        } catch (err: unknown) {
            setSnackbarMessage(err instanceof Error ? err.message : "Failed to create task");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    const updateQuickAddData = (field: keyof TaskLibrary, value: unknown) => {
        setQuickAddData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // Drag and drop handlers
    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setIsDragging(false);

        if (!over || active.id === over.id) {
            return;
        }

        const activeId = parseInt(active.id as string);
        const overId = over.id as string;

        // Find the active task and its current phase
        let activeTask: TaskLibrary | null = null;
        let sourcePhase: ProjectPhase | null = null;

        for (const [phase, tasks] of Object.entries(tasksByPhase)) {
            const task = tasks.find(t => t.id === activeId);
            if (task) {
                activeTask = task;
                sourcePhase = phase as ProjectPhase;
                break;
            }
        }

        if (!activeTask || !sourcePhase) {
            return;
        }

        // Extract target phase from droppable zone ID (format: "phase-{phase}")
        let targetPhase: ProjectPhase | null = null;
        if (overId.startsWith('phase-')) {
            const phaseKey = overId.replace('phase-', '');
            targetPhase = phaseKey as ProjectPhase;
        } else {
            // If dropping on another task, find which phase that task belongs to
            const targetTaskId = parseInt(overId);
            for (const [phase, tasks] of Object.entries(tasksByPhase)) {
                if (tasks.find(t => t.id === targetTaskId)) {
                    targetPhase = phase as ProjectPhase;
                    break;
                }
            }
        }

        if (!targetPhase) {
            return;
        }

        // If dropping into a different phase, handle phase change
        if (targetPhase !== sourcePhase) {
            // Remove task from source phase
            const sourceTasks = tasksByPhase[sourcePhase].filter(t => t.id !== activeId);
            const reorderedSourceTasks = sourceTasks.map((task, index) => ({
                ...task,
                order_index: index + 1,
            }));

            // Add task to target phase
            const targetTasks = [...tasksByPhase[targetPhase]];
            const updatedTask = {
                ...activeTask,
                phase: targetPhase,
                order_index: targetTasks.length + 1,
            };
            targetTasks.push(updatedTask);

            // Update local state immediately for optimistic UI
            setTasksByPhase(prev => ({
                ...prev,
                [sourcePhase]: reorderedSourceTasks,
                [targetPhase]: targetTasks,
            }));

            try {
                // Update the task phase in the backend
                await api.taskLibrary.update(activeTask.id, {
                    phase: targetPhase,
                });

                // Update order for target phase (with the moved task)
                const targetBatchUpdateData = {
                    tasks: targetTasks.map(task => ({
                        id: task.id,
                        order_index: task.order_index,
                    })),
                    phase: targetPhase,
                    brand_id: currentBrand?.id || 0,
                };
                await api.taskLibrary.batchUpdateOrder(targetBatchUpdateData);

                // Update order for source phase if needed
                if (reorderedSourceTasks.length > 0) {
                    const sourceBatchUpdateData = {
                        tasks: reorderedSourceTasks.map(task => ({
                            id: task.id,
                            order_index: task.order_index,
                        })),
                        phase: sourcePhase,
                        brand_id: currentBrand?.id || 0,
                    };
                    await api.taskLibrary.batchUpdateOrder(sourceBatchUpdateData);
                }

                setSnackbarMessage(`Task moved to ${PHASE_LABELS[targetPhase]} phase`);
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
            } catch {
                // Revert the optimistic update on error
                setTasksByPhase(prev => ({
                    ...prev,
                    [sourcePhase]: tasksByPhase[sourcePhase],
                    [targetPhase]: tasksByPhase[targetPhase],
                }));

                setSnackbarMessage("Failed to move task to different phase");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
            return;
        }

        // Handle reordering within the same phase (existing logic)
        const targetTaskId = parseInt(overId);
        const tasks = tasksByPhase[targetPhase];
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === targetTaskId);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        // Reorder tasks array
        const newTasks = [...tasks];
        const [movedTask] = newTasks.splice(activeIndex, 1);
        newTasks.splice(overIndex, 0, movedTask);

        // Update order_index for all tasks in this phase
        const updatedTasks = newTasks.map((task, index) => ({
            ...task,
            order_index: index + 1,
        }));

        // Update local state immediately for optimistic UI
        setTasksByPhase(prev => ({
            ...prev,
            [targetPhase]: updatedTasks,
        }));

        // Save to backend
        try {
            const batchUpdateData = {
                tasks: updatedTasks.map(task => ({
                    id: task.id,
                    order_index: task.order_index,
                })),
                phase: targetPhase,
                brand_id: currentBrand?.id || 0,
            };

            await api.taskLibrary.batchUpdateOrder(batchUpdateData);

            setSnackbarMessage("Task order updated successfully");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch {
            // Revert the optimistic update on error
            setTasksByPhase(prev => ({
                ...prev,
                [targetPhase]: tasks,
            }));

            setSnackbarMessage("Failed to update task order");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    // Organize tasks by phase for display
    const getPhaseGroups = (): TaskLibraryPhaseGroup[] => {
        return Object.values(ProjectPhase).map(phase => ({
            phase,
            label: PHASE_LABELS[phase],
            tasks: tasksByPhase[phase] || [],
            expanded: expandedPhases[phase] || false,
        }));
    };

    const phaseGroups = getPhaseGroups();

    // Role/skills handlers
    const handleToggleExpand = (taskId: number) => {
        setExpandedTaskId(prev => (prev === taskId ? null : taskId));
    };

    const handleUpdateRoleSkills = async (
        taskId: number,
        data: { default_job_role_id?: number | null; skills_needed?: string[] }
    ) => {
        const updatedTask = await api.taskLibrary.update(taskId, {
            ...data,
            default_job_role_id: data.default_job_role_id ?? undefined,
        });

        // Refresh mappings so Tier/Rate columns resolve correctly
        loadAllMappings();

        // Helper: apply role/skills/contributor fields to a task object
        const applyUpdates = (t: TaskLibrary): TaskLibrary => {
            const updated = { ...t };
            if (data.default_job_role_id !== undefined) {
                updated.default_job_role_id = data.default_job_role_id;
                updated.default_job_role = data.default_job_role_id
                    ? jobRoles.find(r => r.id === data.default_job_role_id) ?? null
                    : null;
            }
            if (data.skills_needed !== undefined) {
                updated.skills_needed = data.skills_needed;
            }
            if (updatedTask) {
                updated.default_contributor_id = updatedTask.default_contributor_id ?? null;
                updated.default_contributor = updatedTask.default_contributor ?? null;
            }
            return updated;
        };

        // Update local state so UI reflects the change without refetch.
        // Child tasks exist BOTH as top-level items in the flat phase array AND inside
        // their parent's .children[] (which is what TaskTable actually renders from).
        // We must update both in a single pass — updating only the flat item won't
        // change what's displayed.
        setTasksByPhase(prev => {
            const newState = { ...prev };
            for (const [phase, tasks] of Object.entries(newState)) {
                let updated = false;
                const updatedTasks = tasks.map(t => {
                    let result = t;
                    // Update the flat item if it matches
                    if (t.id === taskId) {
                        result = applyUpdates(result);
                        updated = true;
                    }
                    // Also update within .children[] (stage parents render from here)
                    if (t.children) {
                        const childIdx = t.children.findIndex(c => c.id === taskId);
                        if (childIdx !== -1) {
                            updated = true;
                            result = {
                                ...result,
                                children: [
                                    ...t.children.slice(0, childIdx),
                                    applyUpdates(t.children[childIdx]),
                                    ...t.children.slice(childIdx + 1),
                                ],
                            };
                        }
                    }
                    return result;
                });
                if (updated) {
                    newState[phase] = updatedTasks;
                    break;
                }
            }
            return newState;
        });
    };

    const handleUpdateContributor = async (taskId: number, contributorId: number | null) => {
        try {
            const updatedTask = await api.taskLibrary.update(taskId, { default_contributor_id: contributorId as number });

            const newContributorId = updatedTask?.default_contributor_id ?? contributorId;
            const newContributor = updatedTask?.default_contributor ?? null;

            // Same dual-update strategy: child tasks live in both the flat array
            // and their parent's .children[] — update both in one pass.
            setTasksByPhase(prev => {
                const newState = { ...prev };
                for (const [phase, tasks] of Object.entries(newState)) {
                    let updated = false;
                    const updatedTasks = tasks.map(t => {
                        let result = t;
                        if (t.id === taskId) {
                            result = { ...result, default_contributor_id: newContributorId, default_contributor: newContributor };
                            updated = true;
                        }
                        if (t.children) {
                            const childIdx = t.children.findIndex(c => c.id === taskId);
                            if (childIdx !== -1) {
                                updated = true;
                                result = {
                                    ...result,
                                    children: [
                                        ...t.children.slice(0, childIdx),
                                        { ...t.children[childIdx], default_contributor_id: newContributorId, default_contributor: newContributor },
                                        ...t.children.slice(childIdx + 1),
                                    ],
                                };
                            }
                        }
                        return result;
                    });
                    if (updated) {
                        newState[phase] = updatedTasks;
                        break;
                    }
                }
                return newState;
            });
        } catch (err: unknown) {
            console.error('Failed to update contributor:', err);
            setError('Failed to save contributor assignment.');
        }
    };

    return (
        <TasksContent
            loading={loading}
            error={error}
            setError={setError}
            phaseGroups={phaseGroups}
            onPhaseToggle={handlePhaseToggle}
            onPhaseCardClick={handlePhaseCardClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            inlineEditingTask={inlineEditingTask}
            inlineEditData={inlineEditData}
            updateInlineEditData={updateInlineEditData}
            startInlineEdit={startInlineEdit}
            cancelInlineEdit={cancelInlineEdit}
            saveInlineEdit={saveInlineEdit}
            isDragging={isDragging}
            deleteConfirmOpen={deleteConfirmOpen}
            setDeleteConfirmOpen={setDeleteConfirmOpen}
            taskToDelete={taskToDelete}
            setTaskToDelete={setTaskToDelete}
            handleDelete={handleDelete}
            snackbarOpen={snackbarOpen}
            setSnackbarOpen={setSnackbarOpen}
            snackbarMessage={snackbarMessage}
            snackbarSeverity={snackbarSeverity}
            quickAddPhase={quickAddPhase}
            quickAddData={quickAddData}
            startQuickAdd={startQuickAdd}
            cancelQuickAdd={cancelQuickAdd}
            saveQuickAdd={saveQuickAdd}
            updateQuickAddData={updateQuickAddData}
            jobRoles={jobRoles}
            allMappings={allMappings}
            contributors={contributors}
            expandedTaskId={expandedTaskId}
            onToggleExpand={handleToggleExpand}
            onUpdateRoleSkills={handleUpdateRoleSkills}
            onUpdateContributor={handleUpdateContributor}
        />
    );
}
