"use client";

import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskLibrary, JobRole, SkillRoleMapping, Crew } from "@/features/catalog/task-library/types";
import { TaskColumnHeaders } from "@/shared/ui/tasks";
import { buildRenderItems } from "@/shared/utils/taskTree";
import { GRID_COLS, GRID_HEADERS } from "../constants";
import { SortableTaskRow } from "./SortableTaskRow";
import { TaskQuickAddRow } from "./TaskQuickAddRow";
import { TaskGroupHeaderRow } from "./TaskGroupHeaderRow";

interface TaskTableProps {
    tasks: TaskLibrary[];
    phase: string;
    onUpdateTask: (taskId: number, data: Partial<TaskLibrary>) => Promise<void>;
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
    crew: Crew[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
    onUpdateCrew: (taskId: number, crewId: number | null) => Promise<void>;
    selectedTaskId?: number | null;
    onRowClick?: (task: TaskLibrary) => void;
    onRowHover?: (task: TaskLibrary | null) => void;
}

export function TaskTable({
    tasks,
    phase,
    onUpdateTask,
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
    selectedTaskId,
    onRowClick,
    onRowHover,
}: TaskTableProps) {
    // Build ordered render list: stage headers with their children, then flat tasks
    const renderItems = useMemo(() => buildRenderItems(tasks), [tasks]);

    // Collect all sortable task IDs (skip stage header rows)
    const sortableIds = useMemo(
        () => renderItems.filter(i => i.type === 'task').map(i => (i as { type: 'task'; task: TaskLibrary }).task.id.toString()),
        [renderItems],
    );

    // Determine if quick-add targets a specific stage in this phase
    const isQuickAddForThisPhase = quickAddPhase === phase;
    const quickAddTargetStageId = quickAddData.parent_task_id;

    // Helper: check if the next item in renderItems is a different stage or end of list
    const isLastChildOfStage = (index: number, stageId: number) => {
        const nextItem = renderItems[index + 1];
        if (!nextItem) return true;
        if (nextItem.type === 'stage') return true;
        if (nextItem.type === 'task' && !nextItem.isChild) return true;
        if (nextItem.type === 'task' && nextItem.task.parent_task_id !== stageId) return true;
        return false;
    };

    const stages = useMemo(() => tasks.filter(t => t.is_task_group).map(t => ({ id: t.id, name: t.name })), [tasks]);

    return (
        <Box sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}>
            <Box sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <TaskColumnHeaders columns={GRID_HEADERS} gridCols={GRID_COLS} />
            </Box>

            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {renderItems.map((item, index) => {
                    const elements: React.ReactNode[] = [];

                    if (item.type === 'stage') {
                        const childCount = item.stage.children?.length ?? tasks.filter(t => t.parent_task_id === item.stage.id).length;
                        elements.push(
                            <TaskGroupHeaderRow
                                key={`stage-${item.stage.id}`}
                                stage={item.stage}
                                childCount={childCount}
                                onQuickAdd={(stageId) => startQuickAdd(phase, stageId)}
                            />
                        );

                        if (isQuickAddForThisPhase && quickAddTargetStageId === item.stage.id && childCount === 0) {
                            elements.push(
                                <TaskQuickAddRow
                                    key={`quick-add-stage-${item.stage.id}`}
                                    quickAddData={quickAddData}
                                    updateQuickAddData={updateQuickAddData}
                                    saveQuickAdd={saveQuickAdd}
                                    cancelQuickAdd={cancelQuickAdd}
                                    jobRoles={jobRoles}
                                    allMappings={allMappings}
                                    stages={stages}
                                />
                            );
                        }
                    } else {
                        elements.push(
                            <SortableTaskRow
                                key={item.task.id}
                                task={item.task}
                                phase={phase}
                                isChild={item.isChild}
                                onUpdateTask={onUpdateTask}
                                setTaskToDelete={setTaskToDelete}
                                setDeleteConfirmOpen={setDeleteConfirmOpen}
                                isDragging={isDragging}
                                jobRoles={jobRoles}
                                allMappings={allMappings}
                                crew={crew}
                                expandedTaskId={expandedTaskId}
                                onToggleExpand={onToggleExpand}
                                onUpdateRoleSkills={onUpdateRoleSkills}
                                onUpdateCrew={onUpdateCrew}
                                selectedTaskId={selectedTaskId}
                                onRowClick={onRowClick}
                                onRowHover={onRowHover}
                            />
                        );

                        if (
                            isQuickAddForThisPhase &&
                            item.isChild &&
                            item.task.parent_task_id &&
                            quickAddTargetStageId === item.task.parent_task_id &&
                            isLastChildOfStage(index, item.task.parent_task_id)
                        ) {
                            elements.push(
                                <TaskQuickAddRow
                                    key={`quick-add-child-${item.task.parent_task_id}`}
                                    quickAddData={quickAddData}
                                    updateQuickAddData={updateQuickAddData}
                                    saveQuickAdd={saveQuickAdd}
                                    cancelQuickAdd={cancelQuickAdd}
                                    jobRoles={jobRoles}
                                    allMappings={allMappings}
                                    stages={stages}
                                />
                            );
                        }
                    }

                    return elements;
                })}
            </SortableContext>

            {isQuickAddForThisPhase && !quickAddTargetStageId && (
                <TaskQuickAddRow
                    quickAddData={quickAddData}
                    updateQuickAddData={updateQuickAddData}
                    saveQuickAdd={saveQuickAdd}
                    cancelQuickAdd={cancelQuickAdd}
                    jobRoles={jobRoles}
                    allMappings={allMappings}
                    stages={stages}
                />
            )}

            {/* Empty state */}
            {tasks.length === 0 && !isQuickAddForThisPhase && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    py: 6, color: 'text.disabled', fontSize: '0.8125rem',
                }}>
                    No tasks in this phase
                </Box>
            )}
        </Box>
    );
}
