"use client";

import React, { useState } from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import {
    DndContext, DragEndEvent, DragStartEvent, DragOverlay,
    PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { TaskLibrary, ProjectPhase, JobRole, SkillRoleMapping, Crew } from "@/features/catalog/task-library/types";
import { TaskSummaryStrip } from "@/shared/ui/tasks";
import { sumEffortHours } from "@/shared/utils/hours";
import { TasksHeader } from "./TasksHeader";
import { PhaseCardsGrid } from "./PhaseCardsGrid";
import { TaskTable } from "./TaskTable";
import { DragOverlayTask } from "./DragOverlayTask";
import { DroppableZone } from "./DroppableZone";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { TasksSnackbar } from "./TasksSnackbar";
import { TaskDetailPanel } from "./TaskDetailPanel";

interface TasksContentProps {
    loading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    phaseStats: { phase: string; label: string; count: number; activeCount: number }[];
    activePhase: string;
    onPhaseChange: (phase: string) => void;
    activeTasks: TaskLibrary[];
    tasksByPhase: Record<string, TaskLibrary[]>;
    onDragStart: () => void;
    onDragEnd: (event: DragEndEvent) => void;
    onUpdateTask: (taskId: number, data: Partial<TaskLibrary>) => Promise<void>;
    isDragging: boolean;
    deleteConfirmOpen: boolean;
    setDeleteConfirmOpen: (open: boolean) => void;
    taskToDelete: TaskLibrary | null;
    setTaskToDelete: (task: TaskLibrary) => void;
    handleDelete: () => void;
    snackbarOpen: boolean;
    setSnackbarOpen: (open: boolean) => void;
    snackbarMessage: string;
    snackbarSeverity: "success" | "error";
    quickAddPhase: string | null;
    quickAddData: Partial<TaskLibrary>;
    startQuickAdd: (phase: string, parentStageId?: number) => void;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof TaskLibrary, value: unknown) => void;
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    crew: Crew[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
    onUpdateCrew: (taskId: number, crewId: number | null) => Promise<void>;
}

export function TasksContent({
    loading,
    error,
    setError,
    phaseStats,
    activePhase,
    onPhaseChange,
    activeTasks,
    tasksByPhase,
    onDragStart,
    onDragEnd,
    onUpdateTask,
    isDragging,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    taskToDelete,
    setTaskToDelete,
    handleDelete,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    quickAddPhase,
    quickAddData,
    startQuickAdd,
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
    jobRoles,
    allMappings,
    crew,
    expandedTaskId,
    onToggleExpand,
    onUpdateRoleSkills,
    onUpdateCrew,
}: TasksContentProps) {
    const [activeTask, setActiveTask] = useState<TaskLibrary | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [taskOverrides, setTaskOverrides] = useState<Map<number, TaskLibrary>>(new Map());

    // Find a task by id across all phases (with local overrides for optimistic panel updates)
    const findTask = (id: number): TaskLibrary | null => {
        if (taskOverrides.has(id)) return taskOverrides.get(id)!;
        for (const tasks of Object.values(tasksByPhase)) {
            const found = tasks.find(t => t.id === id);
            if (found) return found;
        }
        return null;
    };

    const handlePanelTaskUpdated = (taskId: number, updater: (t: TaskLibrary) => TaskLibrary) => {
        const base = findTask(taskId);
        if (!base) return;
        setTaskOverrides(prev => new Map(prev).set(taskId, updater(base)));
    };

    const hoveredTask = hoveredTaskId ? findTask(hoveredTaskId) : null;
    const selectedTask = selectedTaskId ? findTask(selectedTaskId) : null;
    const detailTask = selectedTask ?? hoveredTask;

    // When phase card is clicked, clear selected task (show placeholder)
    const handlePhaseCardClick = (phase: string) => {
        setSelectedTaskId(null);
        onPhaseChange(phase);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        const task = activeTasks.find(t => t.id.toString() === event.active.id) ?? null;
        setActiveTask(task);
        onDragStart();
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        onDragEnd(event);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    // Calculate statistics
    const totalTasks = phaseStats.reduce((sum, p) => sum + p.count, 0);
    const totalActive = phaseStats.reduce((sum, p) => sum + p.activeCount, 0);
    const totalHours = sumEffortHours(Object.values(tasksByPhase).flat());

    return (
        <Box sx={{ p: 3 }}>
            <TasksHeader />

            <TaskSummaryStrip items={[
                { label: 'Total', value: totalTasks, color: '#579BFC' },
                { label: 'Active', value: totalActive, color: '#00C875' },
                { label: 'Inactive', value: totalTasks - totalActive, color: '#676879' },
                { label: 'Phases', value: phaseStats.filter(p => p.count > 0).length, color: '#A25DDC' },
                { label: 'Hours', value: `${totalHours.toFixed(1)}h`, color: '#FDAB3D' },
            ]} />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Phase summary cards */}
            <PhaseCardsGrid
                phaseStats={phaseStats}
                tasksByPhase={tasksByPhase}
                onPhaseCardClick={handlePhaseCardClick}
            />

            {/* 2-column: task table (2/3) + detail panel (1/3) */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {/* Left — task table */}
                <Box sx={{ flex: '0 0 65%', minWidth: 0 }}>
                    {/* Table for active phase */}
                    <Box sx={{
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        bgcolor: 'rgba(255,255,255,0.01)',
                    }}>
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <DroppableZone id={`phase-${activePhase}`} phase={activePhase as ProjectPhase}>
                                <TaskTable
                                    tasks={activeTasks}
                                    phase={activePhase}
                                    onUpdateTask={onUpdateTask}
                                    setTaskToDelete={setTaskToDelete}
                                    setDeleteConfirmOpen={setDeleteConfirmOpen}
                                    isDragging={isDragging}
                                    quickAddPhase={quickAddPhase}
                                    quickAddData={quickAddData}
                                    startQuickAdd={startQuickAdd}
                                    cancelQuickAdd={cancelQuickAdd}
                                    saveQuickAdd={saveQuickAdd}
                                    updateQuickAddData={updateQuickAddData}
                                    jobRoles={jobRoles}
                                    allMappings={allMappings}
                                    crew={crew}
                                    expandedTaskId={expandedTaskId}
                                    onToggleExpand={onToggleExpand}
                                    onUpdateRoleSkills={onUpdateRoleSkills}
                                    onUpdateCrew={onUpdateCrew}
                                    selectedTaskId={selectedTaskId}
                                    onRowClick={(t) => setSelectedTaskId(prev => prev === t.id ? null : t.id)}
                                    onRowHover={(t) => setHoveredTaskId(t ? t.id : null)}
                                />
                            </DroppableZone>

                            <DragOverlay>
                                {activeTask && <DragOverlayTask task={activeTask} phase={activePhase} />}
                            </DragOverlay>
                        </DndContext>
                    </Box>
                </Box>

                {/* Right — sticky detail panel */}
                <Box sx={{ flex: '1 1 0', minWidth: 0, position: 'sticky', top: 80 }}>
                    <TaskDetailPanel
                        task={detailTask ?? null}
                        isSelected={selectedTaskId !== null}
                        onClose={() => setSelectedTaskId(null)}
                        onTaskUpdated={handlePanelTaskUpdated}
                    />
                </Box>
            </Box>

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                taskToDelete={taskToDelete}
            />

            <TasksSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={() => setSnackbarOpen(false)}
            />
        </Box>
    );
}
