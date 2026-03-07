"use client";

import React from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import { DragEndEvent } from "@dnd-kit/core";
import { TaskLibrary, TaskLibraryPhaseGroup, JobRole, SkillRoleMapping } from "@/lib/types";
import { TasksHeader } from "./TasksHeader";
import { TasksSummaryCards } from "./TasksSummaryCards";
import { PhaseCardsGrid } from "./PhaseCardsGrid";
import { TaskAccordionList } from "./TaskAccordionList";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { TasksSnackbar } from "./TasksSnackbar";

interface TasksContentProps {
    loading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    phaseGroups: TaskLibraryPhaseGroup[];
    onPhaseToggle: (phase: string) => void;
    onPhaseCardClick: (phase: string) => void;
    onDragStart: () => void;
    onDragEnd: (event: DragEndEvent) => void;
    inlineEditingTask: number | null;
    inlineEditData: Partial<TaskLibrary>;
    updateInlineEditData: (field: keyof TaskLibrary, value: unknown) => void;
    startInlineEdit: (task: TaskLibrary) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
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
    startQuickAdd: (phase: string) => void;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof TaskLibrary, value: unknown) => void;
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
}

export function TasksContent({
    loading,
    error,
    setError,
    phaseGroups,
    onPhaseToggle,
    onPhaseCardClick,
    onDragStart,
    onDragEnd,
    inlineEditingTask,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
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
    expandedTaskId,
    onToggleExpand,
    onUpdateRoleSkills,
}: TasksContentProps) {
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    // Calculate statistics
    const totalTasks = phaseGroups.reduce((sum, group) => sum + group.tasks.length, 0);
    const totalActive = phaseGroups.reduce((sum, group) => sum + group.tasks.filter(t => t.is_active).length, 0);
    const phaseStats = phaseGroups.map(group => ({
        phase: group.phase,
        label: group.label,
        count: group.tasks.length,
        activeCount: group.tasks.filter(task => task.is_active).length,
        totalHours: group.tasks.reduce((sum, t) => sum + parseFloat(String(t.effort_hours || '0')), 0),
    }));

    // Convert phase groups to tasksByPhase format for PhaseCardsGrid
    const tasksByPhase = phaseGroups.reduce((acc, group) => {
        acc[group.phase] = group.tasks;
        return acc;
    }, {} as Record<string, TaskLibrary[]>);

    return (
        <Box sx={{ p: 3 }}>
            <TasksHeader />

            <Box sx={{ mb: 3 }}>
                <TasksSummaryCards
                    totalTasks={totalTasks}
                    totalActive={totalActive}
                    phaseStats={phaseStats}
                />

                <PhaseCardsGrid
                    phaseStats={phaseStats}
                    tasksByPhase={tasksByPhase}
                    onPhaseCardClick={onPhaseCardClick}
                />
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Task Accordions */}
            <TaskAccordionList
                phaseGroups={phaseGroups}
                onPhaseToggle={onPhaseToggle}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                inlineEditingTask={inlineEditingTask}
                inlineEditData={inlineEditData}
                updateInlineEditData={updateInlineEditData}
                startInlineEdit={startInlineEdit}
                cancelInlineEdit={cancelInlineEdit}
                saveInlineEdit={saveInlineEdit}
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
                expandedTaskId={expandedTaskId}
                onToggleExpand={onToggleExpand}
                onUpdateRoleSkills={onUpdateRoleSkills}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                taskToDelete={taskToDelete}
            />

            {/* Snackbar */}
            <TasksSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={() => setSnackbarOpen(false)}
            />
        </Box>
    );
}
