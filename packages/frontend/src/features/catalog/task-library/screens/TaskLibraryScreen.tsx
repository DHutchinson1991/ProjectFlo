"use client";

import React, { useState } from 'react';
import { ProjectPhase, PHASE_LABELS } from '@/lib/types';
import type { TaskLibraryPhaseGroup } from '@/lib/types';
import { useBrand } from '@/app/providers/BrandProvider';
import { useTaskLibraryData, useTaskLibraryPhaseExpand } from '../hooks/use-task-library-data';
import { useTaskLibraryMutations } from '../hooks/use-task-library-mutations';
import { useTaskLibraryDnd } from '../hooks/use-task-library-dnd';
import { useTaskLibraryRoleSkills } from '../hooks/use-task-library-role-skills';
import { TasksContent } from '../components/TasksContent';

export function TaskLibraryScreen() {
    const { currentBrand } = useBrand();

    const {
        tasksByPhase, setTasksByPhase, loading, error, setError,
        jobRoles, allMappings, loadAllMappings, contributors, loadTasks,
    } = useTaskLibraryData();

    const {
        expandedPhases, expandedTaskId,
        handlePhaseToggle, handlePhaseCardClick, handleToggleExpand,
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

    const phaseGroups: TaskLibraryPhaseGroup[] = Object.values(ProjectPhase).map(phase => ({
        phase,
        label: PHASE_LABELS[phase],
        tasks: tasksByPhase[phase] || [],
        expanded: expandedPhases[phase] || false,
    }));

    return (
        <TasksContent
            loading={loading}
            error={error}
            setError={setError}
            phaseGroups={phaseGroups}
            onPhaseToggle={handlePhaseToggle}
            onPhaseCardClick={handlePhaseCardClick}
            onDragStart={dnd.handleDragStart}
            onDragEnd={dnd.handleDragEnd}
            inlineEditingTask={mutations.inlineEditingTask}
            inlineEditData={mutations.inlineEditData}
            updateInlineEditData={mutations.updateInlineEditData}
            startInlineEdit={mutations.startInlineEdit}
            cancelInlineEdit={mutations.cancelInlineEdit}
            saveInlineEdit={mutations.saveInlineEdit}
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
            contributors={contributors}
            expandedTaskId={expandedTaskId}
            onToggleExpand={handleToggleExpand}
            onUpdateRoleSkills={roleSkills.handleUpdateRoleSkills}
            onUpdateContributor={roleSkills.handleUpdateContributor}
        />
    );
}
