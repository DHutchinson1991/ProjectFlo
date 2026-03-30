"use client";

import React from "react";
import {
    Box,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Add as AddIcon,
} from "@mui/icons-material";
import { TaskLibrary, TaskLibraryPhaseGroup, JobRole, SkillRoleMapping } from "@/features/catalog/task-library/types";
import { TaskGroupHeader } from "@/shared/ui/tasks";
import { getPhaseConfig } from "@/shared/ui/tasks";
import { sumEffortHours } from "@/shared/utils/hours";
import { TaskTable } from "./TaskTable";
import { EmptyPhase } from "./EmptyPhase";

interface TaskAccordionProps {
    group: TaskLibraryPhaseGroup;
    onPhaseToggle: (phase: string) => void;
    inlineEditingTask: number | null;
    inlineEditData: Partial<TaskLibrary>;
    updateInlineEditData: (field: keyof TaskLibrary, value: unknown) => void;
    startInlineEdit: (task: TaskLibrary) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    setTaskToDelete: (task: TaskLibrary) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    isDragging: boolean;
    quickAddPhase: string | null;
    quickAddData: Partial<TaskLibrary>;
    startQuickAdd: (phase: string, parentStageId?: number) => void;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof TaskLibrary, value: unknown) => void;
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    crew: { id: number; contact: { first_name?: string; last_name?: string } }[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
    onUpdateCrew: (taskId: number, crewId: number | null) => Promise<void>;
}

export function TaskAccordion({
    group,
    onPhaseToggle,
    inlineEditingTask,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    setTaskToDelete,
    setDeleteConfirmOpen,
    isDragging,
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
}: TaskAccordionProps) {
    const cfg = getPhaseConfig(group.phase);
    const leafTasks = group.tasks.filter(t => !t.is_task_group);
    const activeCount = leafTasks.filter(t => t.is_active).length;
    const totalHours = sumEffortHours(leafTasks);
    const progress = leafTasks.length > 0 ? (activeCount / leafTasks.length) * 100 : 0;

    const addButton = (
        <Tooltip title={`Add task to ${cfg.label}`} arrow>
            <IconButton
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!group.expanded) onPhaseToggle(group.phase);
                    startQuickAdd(group.phase);
                }}
                size="small"
                sx={{
                    width: 28, height: 28,
                    bgcolor: `${cfg.color}14`, color: cfg.color,
                    border: `1px solid ${cfg.color}33`,
                    '&:hover': { bgcolor: `${cfg.color}25` },
                }}
            >
                <AddIcon sx={{ fontSize: 15 }} />
            </IconButton>
        </Tooltip>
    );

    return (
        <TaskGroupHeader
            title={cfg.label}
            color={cfg.color}
            count={leafTasks.length}
            expanded={group.expanded}
            onToggle={() => onPhaseToggle(group.phase)}
            icon={
                <Box sx={{
                    width: 30, height: 30, borderRadius: '8px',
                    bgcolor: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <cfg.icon sx={{ fontSize: 16, color: cfg.color }} />
                </Box>
            }
            badge={group.tasks.filter(t => t.is_task_group).length > 0
                ? `${group.tasks.filter(t => t.is_task_group).length} groups`
                : undefined}
            progress={progress}
            progressLabel={`${activeCount}/${leafTasks.length}`}
            totalHours={totalHours}
            actions={addButton}
        >
            {group.tasks.length === 0 ? (
                <Box sx={{ px: 3, py: 2 }}>
                    <EmptyPhase />
                </Box>
            ) : (
                <TaskTable
                    tasks={group.tasks}
                    phase={group.phase}
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
                    crew={crew}
                    expandedTaskId={expandedTaskId}
                    onToggleExpand={onToggleExpand}
                    onUpdateRoleSkills={onUpdateRoleSkills}
                    onUpdateCrew={onUpdateCrew}
                />
            )}
        </TaskGroupHeader>
    );
}
