"use client";

import React, { useState } from "react";
import { Stack } from "@mui/material";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { TaskLibrary, TaskLibraryPhaseGroup, ProjectPhase, JobRole, SkillRoleMapping } from "@/lib/types";
import { DroppableZone } from "./DroppableZone";
import { TaskAccordion } from "./TaskAccordion";
import { DragOverlayTask } from "./DragOverlayTask";

interface TaskAccordionListProps {
    phaseGroups: TaskLibraryPhaseGroup[];
    onPhaseToggle: (phase: string) => void;
    onDragStart: () => void;
    onDragEnd: (event: DragEndEvent) => void;
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
    contributors: { id: number; contact: { first_name?: string; last_name?: string } }[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
    onUpdateContributor: (taskId: number, contributorId: number | null) => Promise<void>;
}

export function TaskAccordionList({
    phaseGroups,
    onPhaseToggle,
    onDragStart,
    onDragEnd,
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
    contributors,
    expandedTaskId,
    onToggleExpand,
    onUpdateRoleSkills,
    onUpdateContributor,
}: TaskAccordionListProps) {
    const [activeTask, setActiveTask] = useState<TaskLibrary | null>(null);
    const [activePhase, setActivePhase] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        // Find the task being dragged
        let draggedTask: TaskLibrary | null = null;
        let draggedPhase: string | null = null;

        for (const group of phaseGroups) {
            const task = group.tasks.find(t => t.id.toString() === active.id);
            if (task) {
                draggedTask = task;
                draggedPhase = group.phase;
                break;
            }
        }

        setActiveTask(draggedTask);
        setActivePhase(draggedPhase);
        onDragStart();
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        setActivePhase(null);
        onDragEnd(event);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Stack spacing={3}>
                {phaseGroups.map((group) => (
                    <DroppableZone
                        key={group.phase}
                        id={`phase-${group.phase}`}
                        phase={group.phase as ProjectPhase}
                    >
                        <TaskAccordion
                            group={group}
                            onPhaseToggle={onPhaseToggle}
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
                            contributors={contributors}
                            expandedTaskId={expandedTaskId}
                            onToggleExpand={onToggleExpand}
                            onUpdateRoleSkills={onUpdateRoleSkills}
                            onUpdateContributor={onUpdateContributor}
                        />
                    </DroppableZone>
                ))}
            </Stack>

            <DragOverlay>
                {activeTask && activePhase ? (
                    <DragOverlayTask task={activeTask} phase={activePhase} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
