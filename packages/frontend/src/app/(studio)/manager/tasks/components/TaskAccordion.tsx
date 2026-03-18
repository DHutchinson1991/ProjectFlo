"use client";

import React from "react";
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Search as SearchIcon,
    Schedule as ScheduleIcon,
    Assignment as TaskIcon,
    Timer as TimerIcon,
    TrendingUp as TrendingUpIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { TaskLibrary, TaskLibraryPhaseGroup, JobRole, SkillRoleMapping } from "@/lib/types";
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
    contributors: { id: number; contact: { first_name?: string; last_name?: string } }[];
    expandedTaskId: number | null;
    onToggleExpand: (taskId: number) => void;
    onUpdateRoleSkills: (taskId: number, data: { default_job_role_id?: number | null; skills_needed?: string[] }) => Promise<void>;
    onUpdateContributor: (taskId: number, contributorId: number | null) => Promise<void>;
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
    contributors,
    expandedTaskId,
    onToggleExpand,
    onUpdateRoleSkills,
    onUpdateContributor,
}: TaskAccordionProps) {
    const phaseColors = {
        'Lead': 'rgba(102, 126, 234, 0.3)',
        'Inquiry': 'rgba(240, 147, 251, 0.3)',
        'Booking': 'rgba(79, 172, 254, 0.3)',
        'Creative_Development': 'rgba(67, 233, 123, 0.3)',
        'Pre_Production': 'rgba(250, 112, 154, 0.3)',
        'Production': 'rgba(33, 150, 243, 0.3)',
        'Post_Production': 'rgba(156, 39, 176, 0.3)',
        'Delivery': 'rgba(255, 235, 59, 0.3)'
    };

    const phaseHoverColors = {
        'Lead': 'rgba(102, 126, 234, 0.15)',
        'Inquiry': 'rgba(240, 147, 251, 0.15)',
        'Booking': 'rgba(79, 172, 254, 0.15)',
        'Creative_Development': 'rgba(67, 233, 123, 0.15)',
        'Pre_Production': 'rgba(250, 112, 154, 0.15)',
        'Production': 'rgba(33, 150, 243, 0.15)',
        'Post_Production': 'rgba(156, 39, 176, 0.15)',
        'Delivery': 'rgba(255, 235, 59, 0.15)'
    };

    const phaseIconColors = {
        'Lead': '#667eea',
        'Inquiry': '#f093fb',
        'Booking': '#4facfe',
        'Creative_Development': '#43e97b',
        'Pre_Production': '#fa709a',
        'Production': '#2196f3',
        'Post_Production': '#9c27b0',
        'Delivery': '#ffeb3b'
    };

    const phaseIcons = {
        'Lead': TrendingUpIcon,
        'Inquiry': SearchIcon,
        'Booking': CheckIcon,
        'Creative_Development': EditIcon,
        'Pre_Production': ScheduleIcon,
        'Production': TaskIcon,
        'Post_Production': TimerIcon,
        'Delivery': CheckIcon
    };

    const IconComponent = phaseIcons[group.phase as keyof typeof phaseIcons] || TaskIcon;
    const iconColor = phaseIconColors[group.phase as keyof typeof phaseIconColors] || '#667eea';
    const phaseColor = phaseColors[group.phase as keyof typeof phaseColors] || phaseColors['Lead'];
    const phaseHoverColor = phaseHoverColors[group.phase as keyof typeof phaseHoverColors] || phaseHoverColors['Lead'];

    return (
        <Accordion
            expanded={group.expanded}
            onChange={() => onPhaseToggle(group.phase)}
            elevation={0}
            sx={{
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    borderColor: phaseColor,
                    boxShadow: `0 6px 24px ${phaseHoverColor}`,
                }
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    minHeight: 70,
                    px: 3,
                    py: 2,
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                        backgroundColor: `rgba(${iconColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}, 0.08)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${phaseHoverColor}`,
                        borderColor: iconColor
                    }
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, width: "100%" }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${phaseColor.replace('0.3', '0.15')} 0%, ${phaseHoverColor} 100%)`,
                            border: `1px solid ${phaseColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <IconComponent sx={{
                            fontSize: 20,
                            color: iconColor,
                            opacity: 0.8,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                        }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {group.label} <span style={{ fontWeight: 300, color: 'rgba(255, 255, 255, 0.6)' }}>Phase</span>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {group.tasks.filter(t => t.is_stage).length > 0 && <>{group.tasks.filter(t => t.is_stage).length} stages • </>}{group.tasks.filter(t => !t.is_stage).length} tasks • {group.tasks.filter(t => t.is_active && !t.is_stage).length} active
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                // First open the accordion if it's not already open
                                if (!group.expanded) {
                                    onPhaseToggle(group.phase);
                                }
                                // Then start quick add
                                startQuickAdd(group.phase);
                            }}
                            size="small"
                            sx={{
                                backgroundColor: `rgba(${iconColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}, 0.08)`,
                                color: iconColor,
                                border: `1px solid rgba(${iconColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}, 0.2)`,
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                '&:hover': {
                                    backgroundColor: `rgba(${iconColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}, 0.15)`,
                                    transform: 'scale(1.05)',
                                }
                            }}
                        >
                            <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
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
                        contributors={contributors}
                        expandedTaskId={expandedTaskId}
                        onToggleExpand={onToggleExpand}
                        onUpdateRoleSkills={onUpdateRoleSkills}
                        onUpdateContributor={onUpdateContributor}
                    />
                )}
            </AccordionDetails>
        </Accordion>
    );
}
