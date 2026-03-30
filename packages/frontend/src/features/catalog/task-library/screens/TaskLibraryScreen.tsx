"use client";

import React, { useState } from 'react';
import { ProjectPhase, PHASE_LABELS } from '@/features/catalog/task-library/types';
import { useBrand } from '@/features/platform/brand';
import { useTaskLibraryData, useTaskLibraryPhaseExpand } from '../hooks/use-task-library-data';
import { useTaskLibraryMutations } from '../hooks/use-task-library-mutations';
import { useTaskLibraryDnd } from '../hooks/use-task-library-dnd';
import { useTaskLibraryRoleSkills } from '../hooks/use-task-library-role-skills';
import { TasksContent } from '../components/TasksContent';

export function TaskLibraryScreen() {
    const { currentBrand } = useBrand();

    const {
        tasksByPhase, setTasksByPhase, loading, error, setError,
        jobRoles, allMappings, loadAllMappings, crew, loadTasks,
    } = useTaskLibraryData();

    const {
        activePhase, expandedTaskId,
        handlePhaseChange, handleToggleExpand,
    } = useTaskLibraryPhaseExpand();

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const showSnackbar = (msg: string, severity: 'success' | 'error') => {
        setSnackbarMessage(msg); setSnackbarSeverity(severity); setSnackbarOpen(true);
    };

    const mutations = useTaskLibraryMutations({
        tasksByPhase, setTasksByPhase, setError, jobRoles, loadTasks,
    });

    const dnd = useTaskLibraryDnd({
        tasksByPhase, setTasksByPhase,
        brandId: currentBrand?.id,
        showSnackbar,
    });

    const roleSkills = useTaskLibraryRoleSkills({
        setTasksByPhase, setError, jobRoles, loadAllMappings,
    });

    const phaseStats = Object.values(ProjectPhase).map(phase => ({
        phase,
        label: PHASE_LABELS[phase],
        count: (tasksByPhase[phase] || []).length,
        activeCount: (tasksByPhase[phase] || []).filter(t => t.is_active).length,
    }));

    const activePhaseKey = activePhase as ProjectPhase;
    const activeTasks = tasksByPhase[activePhaseKey] || [];

    return (
        <TasksContent
            loading={loading}
            error={error}
            setError={setError}
            phaseStats={phaseStats}
            activePhase={activePhase}
            onPhaseChange={handlePhaseChange}
            activeTasks={activeTasks}
            tasksByPhase={tasksByPhase}
            onDragStart={dnd.handleDragStart}
            onDragEnd={dnd.handleDragEnd}
            onUpdateTask={mutations.updateTaskField}
            isDragging={dnd.isDragging}
            deleteConfirmOpen={mutations.deleteConfirmOpen}
            setDeleteConfirmOpen={mutations.setDeleteConfirmOpen}
            taskToDelete={mutations.taskToDelete}
            setTaskToDelete={mutations.setTaskToDelete}
            handleDelete={mutations.handleDelete}
            snackbarOpen={snackbarOpen || mutations.snackbarOpen}
            setSnackbarOpen={(v) => { setSnackbarOpen(v); mutations.setSnackbarOpen(v); }}
            snackbarMessage={mutations.snackbarOpen ? mutations.snackbarMessage : snackbarMessage}
            snackbarSeverity={mutations.snackbarOpen ? mutations.snackbarSeverity : snackbarSeverity}
            quickAddPhase={mutations.quickAddPhase}
            quickAddData={mutations.quickAddData}
            startQuickAdd={mutations.startQuickAdd}
            cancelQuickAdd={mutations.cancelQuickAdd}
            saveQuickAdd={mutations.saveQuickAdd}
            updateQuickAddData={mutations.updateQuickAddData}
            jobRoles={jobRoles}
            allMappings={allMappings}
            crew={crew}
            expandedTaskId={expandedTaskId}
            onToggleExpand={handleToggleExpand}
            onUpdateRoleSkills={roleSkills.handleUpdateRoleSkills}
            onUpdateCrew={roleSkills.handleUpdateCrew}
        />
    );
}
