"use client";

import React, { useState, useRef } from "react";
import {
    Box, Typography, Chip, Divider, IconButton, Stack, alpha,
    TextField, Button, InputBase,
} from "@mui/material";
import {
    Assignment as TaskIcon,
    Close as CloseIcon,
    Timer as TimerIcon,
    AutoAwesome as AutoIcon,
    AccountTree as WorkflowIcon,
    Person as PersonIcon,
    Psychology as SkillIcon,
    CalendarMonth as CalendarIcon,
    LocationOn as OnsiteIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    PlayCircle as ManualIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import {
    TaskLibrary, TaskLibrarySubtaskTemplate,
    PricingType,
    PHASE_LABELS, PRICING_TYPE_LABELS, TRIGGER_TYPE_LABELS,
    UpdateSubtaskTemplateDto, CreateSubtaskTemplateDto,
} from "@/features/catalog/task-library/types";
import { getPhaseConfig } from "@/shared/ui/tasks";
import { formatCurrency, DEFAULT_CURRENCY } from "@projectflo/shared";
import { taskLibraryApi } from "@/features/catalog/task-library/api";

// ─── Label maps ────────────────────────────────────────────────────────────────

const DUE_REF_LABELS: Record<string, string> = {
    inquiry_created: "Inquiry",
    booking_date: "Booking",
    event_date: "Event",
    delivery_date: "Delivery",
};

// ─── Section helpers ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Typography sx={{
            fontSize: "0.6875rem", fontWeight: 700, color: "text.disabled",
            letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5, mt: 1.5,
        }}>
            {children}
        </Typography>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75 }}>
            <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>{label}</Typography>
            <Box sx={{ textAlign: "right" }}>{value}</Box>
        </Box>
    );
}

// ─── Placeholder ───────────────────────────────────────────────────────────────

function PanelPlaceholder() {
    return (
        <Box sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.01)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 3,
            p: 3,
            minHeight: 320,
        }}>
            <TaskIcon sx={{ fontSize: 36, color: "rgba(255,255,255,0.08)", mb: 1.5 }} />
            <Typography sx={{ fontSize: "0.8125rem", color: "text.disabled", textAlign: "center", lineHeight: 1.5 }}>
                Hover over a task to preview<br />or click to pin details
            </Typography>
        </Box>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    task: TaskLibrary | null;
    isSelected: boolean;
    onClose: () => void;
    onTaskUpdated?: (taskId: number, updater: (t: TaskLibrary) => TaskLibrary) => void;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function TaskDetailPanel({ task, isSelected, onClose, onTaskUpdated }: Props) {
    const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
    const [editingSubtaskField, setEditingSubtaskField] = useState<'name' | 'description' | null>(null);
    const [editingSubtaskValue, setEditingSubtaskValue] = useState('');
    const [addingStep, setAddingStep] = useState(false);
    const [newStepName, setNewStepName] = useState('');
    const [editingWorkflowDesc, setEditingWorkflowDesc] = useState(false);
    const [workflowDescValue, setWorkflowDescValue] = useState('');
    const addStepInputRef = useRef<HTMLInputElement>(null);

    if (!task) return <PanelPlaceholder />;

    const canEdit = !!onTaskUpdated;

    const applySubtask = (updater: (subtasks: TaskLibrarySubtaskTemplate[]) => TaskLibrarySubtaskTemplate[]) => {
        onTaskUpdated?.(task.id, t => ({
            ...t,
            task_library_subtask_templates: updater(t.task_library_subtask_templates ?? []),
        }));
    };

    const handleUpdateSubtask = async (subtaskId: number, data: UpdateSubtaskTemplateDto) => {
        try {
            const updated = await taskLibraryApi.subtasks.update(task.id, subtaskId, data);
            applySubtask(prev => prev.map(s => s.id === subtaskId ? { ...s, ...updated } : s));
        } catch { /* silent */ }
    };

    const handleDeleteSubtask = async (subtaskId: number) => {
        try {
            await taskLibraryApi.subtasks.delete(task.id, subtaskId);
            applySubtask(prev => prev.filter(s => s.id !== subtaskId));
        } catch { /* silent */ }
    };

    const handleAddStep = async () => {
        const name = newStepName.trim();
        if (!name) return;
        const existingManual = (task.task_library_subtask_templates ?? []).filter(s => !s.is_auto_only);
        const maxOrder = existingManual.reduce((m, s) => Math.max(m, s.order_index), 0);
        const dto: CreateSubtaskTemplateDto = {
            subtask_key: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            name,
            is_auto_only: false,
            order_index: maxOrder + 1,
        };
        try {
            const created = await taskLibraryApi.subtasks.create(task.id, dto);
            applySubtask(prev => [...prev, created].sort((a, b) => a.order_index - b.order_index));
        } catch { /* silent */ }
        setNewStepName('');
        setAddingStep(false);
    };

    const handleWorkflowDescBlur = async () => {
        setEditingWorkflowDesc(false);
        const trimmed = workflowDescValue.trim() || null;
        if (trimmed !== (task.workflow_description ?? null)) {
            try {
                await taskLibraryApi.update(task.id, { workflow_description: trimmed } as never);
                onTaskUpdated?.(task.id, t => ({ ...t, workflow_description: trimmed }));
            } catch { /* silent */ }
        }
    };

    const startEditSubtask = (subtask: TaskLibrarySubtaskTemplate, field: 'name' | 'description') => {
        setEditingSubtaskId(subtask.id);
        setEditingSubtaskField(field);
        setEditingSubtaskValue(field === 'name' ? subtask.name : (subtask.description ?? ''));
    };

    const saveEditSubtask = async () => {
        if (editingSubtaskId == null || editingSubtaskField == null) return;
        const trimmed = editingSubtaskValue.trim();
        await handleUpdateSubtask(editingSubtaskId, { [editingSubtaskField]: trimmed || null });
        setEditingSubtaskId(null);
        setEditingSubtaskField(null);
        setEditingSubtaskValue('');
    };

    const cfg = getPhaseConfig(task.phase);
    const phaseColor = cfg.color;

    const nameParts = task.name.trim().split(" ");
    const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : task.name.substring(0, 2).toUpperCase();

    const subtasks = task.task_library_subtask_templates ?? [];
    const autoSubtasks = subtasks.filter(s => s.is_auto_only);
    const manualSubtasks = subtasks.filter(s => !s.is_auto_only);

    const pricingLabel = PRICING_TYPE_LABELS[task.pricing_type] ?? task.pricing_type;
    const triggerLabel = TRIGGER_TYPE_LABELS[task.trigger_type] ?? task.trigger_type;
    const roleName = task.default_job_role
        ? (task.default_job_role.display_name || task.default_job_role.name)
        : null;
    const crewName = task.default_crew
        ? `${task.default_crew.contact.first_name} ${task.default_crew.contact.last_name}`.trim()
        : null;

    const dueLabel = task.due_date_offset_days != null
        ? `${task.due_date_offset_days > 0 ? "+" : ""}${task.due_date_offset_days}d${task.due_date_offset_reference ? ` from ${DUE_REF_LABELS[task.due_date_offset_reference] ?? task.due_date_offset_reference}` : ""}`
        : null;

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            bgcolor: "rgba(255,255,255,0.02)",
            border: "1px solid",
            borderColor: isSelected ? alpha(phaseColor, 0.4) : "rgba(255,255,255,0.08)",
            borderRadius: 3,
            overflow: "hidden",
            transition: "border-color 0.2s",
        }}>
            {/* ── Header ── */}
            <Box sx={{
                p: 2.5,
                pb: 2,
                background: `linear-gradient(135deg, ${phaseColor}33 0%, transparent 100%)`,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                        background: `linear-gradient(135deg, ${phaseColor} 0%, ${alpha(phaseColor, 0.6)} 100%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 700, color: "#fff",
                    }}>
                        {initials}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.25 }} noWrap>
                            {task.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {PHASE_LABELS[task.phase]} · {pricingLabel}
                        </Typography>
                    </Box>
                    {isSelected && (
                        <IconButton
                            size="small"
                            onClick={onClose}
                            sx={{ flexShrink: 0, color: "text.disabled", mt: -0.5, "&:hover": { color: "text.primary" } }}
                        >
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}
                </Box>

                {/* Status chips */}
                <Box sx={{ display: "flex", gap: 0.75, mt: 1.5, flexWrap: "wrap" }}>
                    <Chip
                        icon={task.is_active ? <ActiveIcon sx={{ fontSize: "0.75rem !important" }} /> : <InactiveIcon sx={{ fontSize: "0.75rem !important" }} />}
                        label={task.is_active ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                            bgcolor: task.is_active ? "rgba(0,200,117,0.12)" : "rgba(255,255,255,0.05)",
                            color: task.is_active ? "#00C875" : "text.disabled",
                            border: `1px solid ${task.is_active ? "rgba(0,200,117,0.25)" : "rgba(255,255,255,0.1)"}`,
                            fontWeight: 700, fontSize: "0.7rem",
                        }}
                    />
                    {task.effort_hours > 0 && (
                        <Chip
                            icon={<TimerIcon sx={{ fontSize: "0.75rem !important" }} />}
                            label={`${task.effort_hours}h`}
                            size="small"
                            sx={{
                                bgcolor: `${phaseColor}18`,
                                color: phaseColor,
                                border: `1px solid ${phaseColor}33`,
                                fontWeight: 700, fontSize: "0.7rem",
                            }}
                        />
                    )}
                    {task.is_on_site && (
                        <Chip
                            icon={<OnsiteIcon sx={{ fontSize: "0.75rem !important" }} />}
                            label="On-site"
                            size="small"
                            sx={{
                                bgcolor: "rgba(255,183,77,0.1)",
                                color: "#ffb74d",
                                border: "1px solid rgba(255,183,77,0.25)",
                                fontWeight: 700, fontSize: "0.7rem",
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* ── Body ── */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, pt: 1.5 }}>

                {/* Description */}
                {task.description && (
                    <>
                        <SectionLabel>Description</SectionLabel>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />
                        <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", lineHeight: 1.55, mb: 1 }}>
                            {task.description}
                        </Typography>
                    </>
                )}

                {/* Details */}
                <SectionLabel>Details</SectionLabel>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 0.5 }} />

                {dueLabel && (
                    <DetailRow
                        label="Due"
                        value={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 13, color: "rgba(255,183,77,0.7)" }} />
                                <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,183,77,0.9)" }}>
                                    {dueLabel}
                                </Typography>
                            </Box>
                        }
                    />
                )}
                <DetailRow
                    label="Trigger"
                    value={
                        <Chip
                            label={triggerLabel}
                            size="small"
                            sx={{
                                bgcolor: task.trigger_type === "always" ? "rgba(255,255,255,0.05)" : "rgba(79,172,254,0.1)",
                                color: task.trigger_type === "always" ? "text.secondary" : "#4facfe",
                                border: `1px solid ${task.trigger_type === "always" ? "rgba(255,255,255,0.1)" : "rgba(79,172,254,0.25)"}`,
                                fontWeight: 700, fontSize: "0.7rem",
                            }}
                        />
                    }
                />
                {task.effort_hours > 0 && (
                    <DetailRow label="Effort" value={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>{task.effort_hours}h estimated</Typography>} />
                )}

                {/* Pricing */}
                <SectionLabel>Pricing</SectionLabel>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 0.5 }} />
                <DetailRow label="Type" value={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>{pricingLabel}</Typography>} />
                {task.pricing_type === PricingType.HOURLY && task.hourly_rate != null && task.hourly_rate > 0 && (
                    <DetailRow
                        label="Rate"
                        value={
                            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64ffda" }}>
                                {formatCurrency(task.hourly_rate, DEFAULT_CURRENCY)}/hr
                            </Typography>
                        }
                    />
                )}
                {task.pricing_type === PricingType.FIXED && task.fixed_price != null && task.fixed_price > 0 && (
                    <DetailRow
                        label="Fixed price"
                        value={
                            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64ffda" }}>
                                {formatCurrency(task.fixed_price, DEFAULT_CURRENCY)}
                            </Typography>
                        }
                    />
                )}
                {task.base_price != null && task.base_price > 0 && (
                    <DetailRow
                        label="Base price"
                        value={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>{formatCurrency(task.base_price, DEFAULT_CURRENCY)}</Typography>}
                    />
                )}

                {/* Assignment */}
                {(roleName || (task.skills_needed && task.skills_needed.length > 0) || crewName) && (
                    <>
                        <SectionLabel>Assignment</SectionLabel>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 0.5 }} />
                        {roleName && (
                            <DetailRow
                                label="Role"
                                value={
                                    <Chip
                                        icon={<PersonIcon sx={{ fontSize: "0.75rem !important" }} />}
                                        label={roleName}
                                        size="small"
                                        sx={{ bgcolor: "rgba(100,255,218,0.08)", color: "#64ffda", border: "1px solid rgba(100,255,218,0.2)", fontWeight: 600, fontSize: "0.7rem" }}
                                    />
                                }
                            />
                        )}
                        {crewName && (
                            <DetailRow label="Crew" value={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>{crewName}</Typography>} />
                        )}
                        {task.skills_needed && task.skills_needed.length > 0 && (
                            <Box sx={{ py: 0.75 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
                                    <SkillIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                    <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>Skills</Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                    {task.skills_needed.map(skill => (
                                        <Chip
                                            key={skill}
                                            label={skill}
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(162,93,220,0.1)",
                                                color: "#a78bfa",
                                                border: "1px solid rgba(162,93,220,0.25)",
                                                fontSize: "0.7rem", fontWeight: 500,
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </>
                )}

                {/* ── Task Workflow Panel ── */}
                <SectionLabel>Task Workflow</SectionLabel>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />

                {/* Workflow overview description */}
                <Box sx={{ mb: 1.5 }}>
                    {editingWorkflowDesc ? (
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={5}
                            autoFocus
                            value={workflowDescValue}
                            onChange={e => setWorkflowDescValue(e.target.value)}
                            onBlur={handleWorkflowDescBlur}
                            onKeyDown={e => { if (e.key === 'Escape') { setEditingWorkflowDesc(false); } }}
                            placeholder="Describe what this task's workflow involves..."
                            size="small"
                            sx={{
                                "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.04)", borderRadius: 1.5, fontSize: "0.8125rem", color: "text.secondary" },
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" },
                            }}
                        />
                    ) : (
                        <Box
                            onClick={() => {
                                if (!canEdit) return;
                                setWorkflowDescValue(task.workflow_description ?? '');
                                setEditingWorkflowDesc(true);
                            }}
                            sx={{
                                cursor: canEdit ? "text" : "default",
                                borderRadius: 1.5,
                                px: canEdit ? 1.25 : 0,
                                py: canEdit ? 0.75 : 0,
                                border: canEdit ? "1px solid transparent" : "none",
                                "&:hover": canEdit ? { border: "1px solid rgba(255,255,255,0.1)", bgcolor: "rgba(255,255,255,0.03)" } : {},
                                transition: "all 0.15s",
                            }}
                        >
                            {task.workflow_description ? (
                                <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", lineHeight: 1.55 }}>
                                    {task.workflow_description}
                                </Typography>
                            ) : canEdit ? (
                                <Typography sx={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.55, display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <EditIcon sx={{ fontSize: 12 }} /> Add workflow overview...
                                </Typography>
                            ) : null}
                        </Box>
                    )}
                </Box>

                {subtasks.length === 0 && !canEdit ? (
                    <Box sx={{
                        py: 2.5, px: 2,
                        bgcolor: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 2,
                        textAlign: "center",
                    }}>
                        <WorkflowIcon sx={{ fontSize: 24, color: "rgba(255,255,255,0.1)", mb: 0.75 }} />
                        <Typography sx={{ fontSize: "0.8125rem", color: "text.disabled" }}>
                            No workflow steps defined
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {autoSubtasks.length > 0 && (
                            <Box sx={{
                                bgcolor: "rgba(100,255,218,0.04)",
                                border: "1px solid rgba(100,255,218,0.12)",
                                borderRadius: 2,
                                overflow: "hidden",
                            }}>
                                <Box sx={{
                                    px: 1.5, py: 0.875,
                                    borderBottom: "1px solid rgba(100,255,218,0.1)",
                                    display: "flex", alignItems: "center", gap: 0.75,
                                    bgcolor: "rgba(100,255,218,0.06)",
                                }}>
                                    <AutoIcon sx={{ fontSize: 13, color: "#64ffda" }} />
                                    <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "#64ffda", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Automated
                                    </Typography>
                                    <Chip
                                        label={autoSubtasks.length}
                                        size="small"
                                        sx={{ ml: "auto", bgcolor: "rgba(100,255,218,0.15)", color: "#64ffda", border: "none", fontSize: "0.6875rem", fontWeight: 700, height: 18, "& .MuiChip-label": { px: 0.75 } }}
                                    />
                                </Box>
                                {autoSubtasks.map((st, idx) => (
                                    <WorkflowStep
                                        key={st.id}
                                        step={st}
                                        isLast={idx === autoSubtasks.length - 1}
                                        color="#64ffda"
                                        canEdit={canEdit}
                                        isEditingName={editingSubtaskId === st.id && editingSubtaskField === 'name'}
                                        isEditingDesc={editingSubtaskId === st.id && editingSubtaskField === 'description'}
                                        editingValue={editingSubtaskId === st.id ? editingSubtaskValue : ''}
                                        onEditingValueChange={setEditingSubtaskValue}
                                        onStartEdit={startEditSubtask}
                                        onSaveEdit={saveEditSubtask}
                                        onCancelEdit={() => { setEditingSubtaskId(null); setEditingSubtaskField(null); }}
                                        onDelete={handleDeleteSubtask}
                                        allowDelete={false}
                                    />
                                ))}
                            </Box>
                        )}

                        {(manualSubtasks.length > 0 || canEdit) && (
                            <Box sx={{
                                bgcolor: "rgba(79,172,254,0.04)",
                                border: "1px solid rgba(79,172,254,0.12)",
                                borderRadius: 2,
                                overflow: "hidden",
                            }}>
                                <Box sx={{
                                    px: 1.5, py: 0.875,
                                    borderBottom: (manualSubtasks.length > 0 || canEdit) ? "1px solid rgba(79,172,254,0.1)" : "none",
                                    display: "flex", alignItems: "center", gap: 0.75,
                                    bgcolor: "rgba(79,172,254,0.06)",
                                }}>
                                    <ManualIcon sx={{ fontSize: 13, color: "#4facfe" }} />
                                    <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4facfe", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Manual Steps
                                    </Typography>
                                    <Chip
                                        label={manualSubtasks.length}
                                        size="small"
                                        sx={{ ml: "auto", bgcolor: "rgba(79,172,254,0.15)", color: "#4facfe", border: "none", fontSize: "0.6875rem", fontWeight: 700, height: 18, "& .MuiChip-label": { px: 0.75 } }}
                                    />
                                </Box>
                                {manualSubtasks.map((st, idx) => (
                                    <WorkflowStep
                                        key={st.id}
                                        step={st}
                                        isLast={idx === manualSubtasks.length - 1 && !canEdit}
                                        color="#4facfe"
                                        canEdit={canEdit}
                                        isEditingName={editingSubtaskId === st.id && editingSubtaskField === 'name'}
                                        isEditingDesc={editingSubtaskId === st.id && editingSubtaskField === 'description'}
                                        editingValue={editingSubtaskId === st.id ? editingSubtaskValue : ''}
                                        onEditingValueChange={setEditingSubtaskValue}
                                        onStartEdit={startEditSubtask}
                                        onSaveEdit={saveEditSubtask}
                                        onCancelEdit={() => { setEditingSubtaskId(null); setEditingSubtaskField(null); }}
                                        onDelete={handleDeleteSubtask}
                                        allowDelete
                                    />
                                ))}

                                {/* Add step */}
                                {canEdit && (
                                    <Box sx={{ borderTop: manualSubtasks.length > 0 ? "1px solid rgba(79,172,254,0.08)" : "none", px: 1.5, py: addingStep ? 1 : 0.5 }}>
                                        {addingStep ? (
                                            <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                                                <InputBase
                                                    inputRef={addStepInputRef}
                                                    autoFocus
                                                    value={newStepName}
                                                    onChange={e => setNewStepName(e.target.value)}
                                                    placeholder="Step name..."
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleAddStep();
                                                        if (e.key === 'Escape') { setAddingStep(false); setNewStepName(''); }
                                                    }}
                                                    sx={{
                                                        flex: 1, fontSize: "0.8125rem", color: "text.primary",
                                                        px: 0.75, py: 0.25,
                                                        bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1,
                                                        border: "1px solid rgba(79,172,254,0.3)",
                                                    }}
                                                />
                                                <Button size="small" onClick={handleAddStep} disabled={!newStepName.trim()} sx={{ minWidth: 0, px: 1, fontSize: "0.75rem", color: "#4facfe" }}>Add</Button>
                                                <Button size="small" onClick={() => { setAddingStep(false); setNewStepName(''); }} sx={{ minWidth: 0, px: 1, fontSize: "0.75rem", color: "text.disabled" }}>Cancel</Button>
                                            </Box>
                                        ) : (
                                            <Button
                                                startIcon={<AddIcon sx={{ fontSize: "0.875rem !important" }} />}
                                                size="small"
                                                onClick={() => setAddingStep(true)}
                                                sx={{
                                                    fontSize: "0.75rem", color: "rgba(79,172,254,0.6)", px: 0.5,
                                                    textTransform: "none",
                                                    "&:hover": { color: "#4facfe", bgcolor: "rgba(79,172,254,0.08)" },
                                                }}
                                            >
                                                Add step
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Bottom padding */}
                <Box sx={{ height: 12 }} />
            </Box>
        </Box>
    );
}

// ─── Workflow Step Row ─────────────────────────────────────────────────────────

function WorkflowStep({
    step,
    isLast,
    color,
    canEdit,
    isEditingName,
    isEditingDesc,
    editingValue,
    onEditingValueChange,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    allowDelete,
}: {
    step: TaskLibrarySubtaskTemplate;
    isLast: boolean;
    color: string;
    canEdit: boolean;
    isEditingName: boolean;
    isEditingDesc: boolean;
    editingValue: string;
    onEditingValueChange: (v: string) => void;
    onStartEdit: (step: TaskLibrarySubtaskTemplate, field: 'name' | 'description') => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: (id: number) => void;
    allowDelete: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const showDesc = descExpanded || !!(step.description) || isEditingDesc;

    return (
        <Box
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
                px: 1.5,
                pt: 0.875,
                pb: showDesc ? 1 : 0.875,
                borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                bgcolor: hovered && canEdit ? "rgba(255,255,255,0.02)" : "transparent",
                transition: "background 0.15s",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                {/* Step number */}
                <Box sx={{
                    width: 18, height: 18, borderRadius: "50%",
                    bgcolor: `${alpha(color, 0.15)}`,
                    border: `1px solid ${alpha(color, 0.25)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <Typography sx={{ fontSize: "0.5625rem", fontWeight: 700, color, lineHeight: 1 }}>
                        {step.order_index}
                    </Typography>
                </Box>

                {/* Name */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {isEditingName ? (
                        <InputBase
                            autoFocus
                            value={editingValue}
                            onChange={e => onEditingValueChange(e.target.value)}
                            onBlur={onSaveEdit}
                            onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
                            sx={{ fontSize: "0.8125rem", color: "text.primary", fontWeight: 500, width: "100%", px: 0.5, bgcolor: "rgba(255,255,255,0.06)", borderRadius: 0.75, border: `1px solid ${alpha(color, 0.4)}` }}
                        />
                    ) : (
                        <Typography
                            sx={{
                                fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)", fontWeight: 500,
                                cursor: canEdit && allowDelete ? "text" : "default",
                                "&:hover": canEdit && allowDelete ? { color: "rgba(255,255,255,0.95)" } : {},
                            }}
                            onClick={() => { if (canEdit && allowDelete) onStartEdit(step, 'name'); }}
                        >
                            {step.name}
                        </Typography>
                    )}
                </Box>

                {/* Actions */}
                {canEdit && hovered && !isEditingName && !isEditingDesc && (
                    <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                        <IconButton
                            size="small"
                            onClick={() => { setDescExpanded(true); onStartEdit(step, 'description'); }}
                            sx={{ p: 0.25, color: "rgba(255,255,255,0.3)", "&:hover": { color: color } }}
                        >
                            <EditIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                        {allowDelete && (
                            <IconButton
                                size="small"
                                onClick={() => onDelete(step.id)}
                                sx={{ p: 0.25, color: "rgba(255,255,255,0.2)", "&:hover": { color: "#ff5252" } }}
                            >
                                <DeleteIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                        )}
                    </Box>
                )}
            </Box>

            {/* Description row */}
            {showDesc && (
                <Box sx={{ pl: 3.5, mt: 0.5 }}>
                    {isEditingDesc ? (
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={5}
                            autoFocus
                            value={editingValue}
                            onChange={e => onEditingValueChange(e.target.value)}
                            onBlur={onSaveEdit}
                            onKeyDown={e => { if (e.key === 'Escape') onCancelEdit(); }}
                            placeholder="Describe what this step does..."
                            size="small"
                            sx={{
                                "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.04)", borderRadius: 1, fontSize: "0.75rem", color: "text.secondary" },
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: `${alpha(color, 0.3)}` },
                            }}
                        />
                    ) : step.description ? (
                        <Typography
                            sx={{
                                fontSize: "0.75rem", color: "text.disabled", lineHeight: 1.5,
                                cursor: canEdit ? "text" : "default",
                                "&:hover": canEdit ? { color: "text.secondary" } : {},
                            }}
                            onClick={() => { if (canEdit) onStartEdit(step, 'description'); }}
                        >
                            {step.description}
                        </Typography>
                    ) : canEdit ? (
                        <Typography
                            sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)", cursor: "text" }}
                            onClick={() => onStartEdit(step, 'description')}
                        >
                            Add description...
                        </Typography>
                    ) : null}
                </Box>
            )}
        </Box>
    );
}
