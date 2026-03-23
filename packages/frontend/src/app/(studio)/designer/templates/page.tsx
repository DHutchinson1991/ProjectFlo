"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Card,
    Button,
    Stack,
    TextField,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
    Switch,
    FormControlLabel,
    Divider,
    Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CalendarMonth as EventDayIcon,
    People as SubjectsIcon,
    Category as EventTypeIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Star as StarIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { useBrand } from "@/app/providers/BrandProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PresetMoment {
    id: number;
    event_day_activity_preset_id: number;
    name: string;
    description?: string;
    duration_seconds: number;
    order_index: number;
    is_key_moment: boolean;
}

interface EventDayActivity {
    id: number;
    event_day_template_id: number;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    default_start_time?: string;
    default_duration_minutes?: number;
    order_index: number;
    is_active: boolean;
    moments?: PresetMoment[];
}

interface EventDay {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    order_index: number;
    is_active: boolean;
    activity_presets?: EventDayActivity[];
}

interface SubjectRole {
    id: number;
    subject_type_id: number;
    role_name: string;
    description?: string;
    is_core: boolean;
    order_index: number;
}

interface SubjectType {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    category: string;
    is_active: boolean;
    roles: SubjectRole[];
}

// Event Type types (from backend deep include)
interface EventTypeDay {
    id: number;
    event_type_id: number;
    event_day_template_id: number;
    order_index: number;
    is_default: boolean;
    event_day_template: EventDay;
}

interface EventTypeSubject {
    id: number;
    event_type_id: number;
    subject_type_template_id: number;
    order_index: number;
    is_default: boolean;
    subject_type_template: SubjectType;
}

interface EventType {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    default_duration_hours?: number;
    default_start_time?: string;
    typical_guest_count?: number;
    is_system: boolean;
    is_active: boolean;
    order_index: number;
    event_days: EventTypeDay[];
    subject_types: EventTypeSubject[];
}

// ---------------------------------------------------------------------------
// Preset Colors (shared)
// ---------------------------------------------------------------------------

const PRESET_COLORS = [
    "#f59e0b", "#10b981", "#648CFF", "#ec4899",
    "#a855f7", "#0ea5e9", "#ef4444", "#f97316",
    "#14b8a6", "#8b5cf6", "#06b6d4", "#d946ef",
];

// ---------------------------------------------------------------------------
// Event Day Section (within selected event type)
// ---------------------------------------------------------------------------

function EventDaySection({ linkedDays, eventTypeId, brandId, onReload }: {
    linkedDays: EventTypeDay[];
    eventTypeId: number;
    brandId: number;
    onReload: () => Promise<void>;
}) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Event day dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<EventDay | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", description: "" });

    // Preset dialog
    const [presetDialogOpen, setPresetDialogOpen] = useState(false);
    const [presetTargetId, setPresetTargetId] = useState<number | null>(null);
    const [editingPreset, setEditingPreset] = useState<EventDayActivity | null>(null);
    const [presetForm, setPresetForm] = useState({ name: "", color: PRESET_COLORS[0], default_duration_minutes: "" as string, default_start_time: "", description: "" });

    // Moment state
    const [expandedPresetId, setExpandedPresetId] = useState<number | null>(null);
    const [momentDialogOpen, setMomentDialogOpen] = useState(false);
    const [momentTargetPresetId, setMomentTargetPresetId] = useState<number | null>(null);
    const [editingMoment, setEditingMoment] = useState<PresetMoment | null>(null);
    const [momentForm, setMomentForm] = useState({ name: "", duration_seconds: "60", is_key_moment: false, description: "" });

    // Derive flat event days from linked junction data
    const eventDays = linkedDays
        .sort((a, b) => a.order_index - b.order_index)
        .map(link => link.event_day_template);

    // ── Event day CRUD ──
    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", description: "" });
        setDialogOpen(true);
    };

    const openEdit = (ed: EventDay) => {
        setEditing(ed);
        setForm({ name: ed.name, description: ed.description || "" });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        try {
            setSaving(true);
            if (editing) {
                await api.schedule.eventDays.update(brandId, editing.id, form);
            } else {
                // Create new event day and auto-link to the selected event type
                const newDay = await api.schedule.eventDays.create(brandId, {
                    name: form.name,
                    description: form.description || undefined,
                    order_index: eventDays.length,
                });
                if (newDay?.id) {
                    await api.eventTypes.linkEventDay(eventTypeId, { event_day_template_id: newDay.id });
                }
            }
            setDialogOpen(false);
            await onReload();
        } catch {
            setError("Failed to save event day");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this event day template and all its activity presets?")) return;
        try {
            await api.schedule.eventDays.delete(brandId, id);
            await onReload();
        } catch {
            setError("Failed to delete event day");
        }
    };

    // ── Activity preset CRUD ──
    const openPresetCreate = (eventDayId: number) => {
        setPresetTargetId(eventDayId);
        setEditingPreset(null);
        setPresetForm({ name: "", color: PRESET_COLORS[0], default_duration_minutes: "", default_start_time: "", description: "" });
        setPresetDialogOpen(true);
    };

    const openPresetEdit = (preset: EventDayActivity) => {
        setPresetTargetId(preset.event_day_template_id);
        setEditingPreset(preset);
        setPresetForm({
            name: preset.name,
            color: preset.color || PRESET_COLORS[0],
            default_duration_minutes: preset.default_duration_minutes?.toString() || "",
            default_start_time: preset.default_start_time || "",
            description: preset.description || "",
        });
        setPresetDialogOpen(true);
    };

    const handlePresetSave = async () => {
        if (!presetTargetId || !presetForm.name.trim()) return;
        try {
            setSaving(true);
            const data = {
                name: presetForm.name,
                description: presetForm.description || undefined,
                color: presetForm.color || undefined,
                default_start_time: presetForm.default_start_time || undefined,
                default_duration_minutes: presetForm.default_duration_minutes ? parseInt(presetForm.default_duration_minutes, 10) : undefined,
            };
            if (editingPreset) {
                await api.schedule.activityPresets.update(editingPreset.id, data);
            } else {
                const existingPresets = eventDays.find(d => d.id === presetTargetId)?.activity_presets || [];
                await api.schedule.activityPresets.create(presetTargetId, { ...data, order_index: existingPresets.length });
            }
            setPresetDialogOpen(false);
            await onReload();
        } catch {
            setError("Failed to save activity preset");
        } finally {
            setSaving(false);
        }
    };

    const handlePresetDelete = async (presetId: number) => {
        if (!window.confirm("Remove this activity preset?")) return;
        try {
            await api.schedule.activityPresets.delete(presetId);
            await onReload();
        } catch {
            setError("Failed to delete preset");
        }
    };

    // ── Moment CRUD ──
    const openMomentCreate = (presetId: number) => {
        setMomentTargetPresetId(presetId);
        setEditingMoment(null);
        setMomentForm({ name: "", duration_seconds: "60", is_key_moment: false, description: "" });
        setMomentDialogOpen(true);
    };

    const openMomentEdit = (moment: PresetMoment) => {
        setMomentTargetPresetId(moment.event_day_activity_preset_id);
        setEditingMoment(moment);
        setMomentForm({
            name: moment.name,
            duration_seconds: moment.duration_seconds.toString(),
            is_key_moment: moment.is_key_moment,
            description: moment.description || "",
        });
        setMomentDialogOpen(true);
    };

    const handleMomentSave = async () => {
        if (!momentTargetPresetId || !momentForm.name.trim()) return;
        try {
            setSaving(true);
            const data = {
                name: momentForm.name,
                description: momentForm.description || undefined,
                duration_seconds: momentForm.duration_seconds ? parseInt(momentForm.duration_seconds, 10) : 60,
                is_key_moment: momentForm.is_key_moment,
            };
            if (editingMoment) {
                await api.schedule.presetMoments.update(editingMoment.id, data);
            } else {
                const preset = eventDays.flatMap(d => d.activity_presets || []).find(p => p.id === momentTargetPresetId);
                const existingMoments = preset?.moments || [];
                await api.schedule.presetMoments.create(momentTargetPresetId, { ...data, order_index: existingMoments.length });
            }
            setMomentDialogOpen(false);
            await onReload();
        } catch {
            setError("Failed to save moment");
        } finally {
            setSaving(false);
        }
    };

    const handleMomentDelete = async (momentId: number) => {
        if (!window.confirm("Remove this moment?")) return;
        try {
            await api.schedule.presetMoments.delete(momentId);
            await onReload();
        } catch {
            setError("Failed to delete moment");
        }
    };

    /** Format seconds to a human-friendly string */
    const formatDuration = (seconds: number) => {
        if (seconds >= 3600) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
        return `${seconds}s`;
    };

    return (
        <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Event Days</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Each event day has its own set of activity presets and moments.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disableElevation size="small" sx={{ borderRadius: 2, fontWeight: 600 }}>
                    Add Event Day
                </Button>
            </Box>

            {eventDays.length === 0 ? (
                <Card variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 3, borderStyle: "dashed" }}>
                    <EventDayIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No event days yet</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 1 }}>Add your first</Button>
                </Card>
            ) : (
                <Stack spacing={1.5}>
                    {eventDays.map((ed) => {
                        const presets = ed.activity_presets || [];
                        const isExpanded = expandedId === ed.id;
                        return (
                            <Card key={ed.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                                {/* Header */}
                                <Box
                                    sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 2, cursor: "pointer", "&:hover": { bgcolor: (theme) => alpha(theme.palette.action.hover, 0.04) } }}
                                    onClick={() => setExpandedId(isExpanded ? null : ed.id)}
                                >
                                    <Avatar sx={{ width: 36, height: 36, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
                                        <EventDayIcon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Typography fontWeight={700}>{ed.name}</Typography>
                                            <Chip label={`${presets.length} activit${presets.length === 1 ? "y" : "ies"}`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                                        </Box>
                                        {ed.description && <Typography variant="caption" color="text.secondary">{ed.description}</Typography>}
                                    </Box>
                                    <Tooltip title="Edit day type">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(ed); }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(ed.id); }} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                                </Box>

                                {/* Expanded: Activity Presets */}
                                {isExpanded && (
                                    <Box sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>Activity Presets</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    These appear as suggestions in the &quot;Add Activity&quot; dialog for this day type.
                                                </Typography>
                                            </Box>
                                            <Button size="small" startIcon={<AddIcon />} onClick={() => openPresetCreate(ed.id)}>Add Preset</Button>
                                        </Box>

                                        {presets.length === 0 ? (
                                            <Box sx={{ p: 2.5, textAlign: "center", border: 1, borderColor: "divider", borderStyle: "dashed", borderRadius: 2 }}>
                                                <Typography variant="body2" color="text.secondary">No activity presets yet</Typography>
                                                <Button size="small" startIcon={<AddIcon />} onClick={() => openPresetCreate(ed.id)} sx={{ mt: 1 }}>Add your first</Button>
                                            </Box>
                                        ) : (
                                            <Stack spacing={0.5}>
                                                {presets.sort((a, b) => a.order_index - b.order_index).map((preset) => {
                                                    const moments = preset.moments || [];
                                                    const isMomentExpanded = expandedPresetId === preset.id;
                                                    return (
                                                    <Box key={preset.id}>
                                                        <Box
                                                            sx={{
                                                                display: "flex", alignItems: "center", gap: 1.5,
                                                                px: 1.5, py: 1, borderRadius: 1.5,
                                                                bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                                                                border: 1, borderColor: isMomentExpanded ? "primary.main" : "divider",
                                                                "&:hover": { borderColor: "primary.main" },
                                                                transition: "border-color 0.15s",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => setExpandedPresetId(isMomentExpanded ? null : preset.id)}
                                                        >
                                                            {/* Color dot */}
                                                            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: preset.color || "#666", flexShrink: 0 }} />
                                                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{preset.name}</Typography>
                                                            <Chip label={`${moments.length} moment${moments.length !== 1 ? "s" : ""}`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6rem" }} />
                                                            {preset.default_start_time && (
                                                                <Chip label={preset.default_start_time} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6rem" }} />
                                                            )}
                                                            {preset.default_duration_minutes && (
                                                                <Chip label={`${preset.default_duration_minutes}min`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.6rem" }} />
                                                            )}
                                                            <Tooltip title="Edit">
                                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPresetEdit(preset); }}>
                                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Remove">
                                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePresetDelete(preset.id); }} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {isMomentExpanded ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                                                        </Box>

                                                        {/* Expanded Moments */}
                                                        {isMomentExpanded && (
                                                            <Box sx={{ ml: 3.5, mt: 0.5, mb: 1, pl: 2, borderLeft: 2, borderColor: preset.color || "divider" }}>
                                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                                                                    <Typography variant="caption" fontWeight={600} color="text.secondary">Moments</Typography>
                                                                    <Button size="small" sx={{ fontSize: "0.65rem", minWidth: 0, py: 0 }} startIcon={<AddIcon sx={{ fontSize: 12 }} />} onClick={() => openMomentCreate(preset.id)}>Add</Button>
                                                                </Box>
                                                                {moments.length === 0 ? (
                                                                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", py: 0.5 }}>No moments yet</Typography>
                                                                ) : (
                                                                    <Stack spacing={0.25}>
                                                                        {moments.sort((a, b) => a.order_index - b.order_index).map((m) => (
                                                                            <Box key={m.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.25, px: 1, borderRadius: 1, "&:hover": { bgcolor: (theme) => alpha(theme.palette.action.hover, 0.06) } }}>
                                                                                {m.is_key_moment && <StarIcon sx={{ fontSize: 12, color: "#f59e0b" }} />}
                                                                                <Typography variant="caption" sx={{ flex: 1, fontWeight: m.is_key_moment ? 600 : 400 }}>{m.name}</Typography>
                                                                                <Chip label={formatDuration(m.duration_seconds)} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.75 } }} />
                                                                                <IconButton size="small" onClick={() => openMomentEdit(m)} sx={{ p: 0.25 }}>
                                                                                    <EditIcon sx={{ fontSize: 12 }} />
                                                                                </IconButton>
                                                                                <IconButton size="small" onClick={() => handleMomentDelete(m.id)} sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                                                                    <DeleteIcon sx={{ fontSize: 12 }} />
                                                                                </IconButton>
                                                                            </Box>
                                                                        ))}
                                                                    </Stack>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    );
                                                })}
                                            </Stack>
                                        )}
                                    </Box>
                                )}
                            </Card>
                        );
                    })}
                </Stack>
            )}

            {/* Event Day Dialog */}
            <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Event Day" : "New Event Day"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} fullWidth multiline rows={2} size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()} disableElevation sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {saving ? "Saving…" : editing ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Activity Preset Dialog */}
            <Dialog open={presetDialogOpen} onClose={() => !saving && setPresetDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{editingPreset ? "Edit Activity Preset" : "New Activity Preset"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="Activity Name"
                            value={presetForm.name}
                            onChange={(e) => setPresetForm((p) => ({ ...p, name: e.target.value }))}
                            fullWidth required size="small"
                            placeholder='e.g., "Ceremony", "Bridal Prep"'
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Description"
                            value={presetForm.description}
                            onChange={(e) => setPresetForm((p) => ({ ...p, description: e.target.value }))}
                            fullWidth size="small" multiline rows={2}
                            placeholder="Brief description of this activity"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                label="Default Start Time"
                                type="time"
                                value={presetForm.default_start_time}
                                onChange={(e) => setPresetForm((p) => ({ ...p, default_start_time: e.target.value }))}
                                size="small"
                                sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Duration (minutes)"
                                value={presetForm.default_duration_minutes}
                                onChange={(e) => setPresetForm((p) => ({ ...p, default_duration_minutes: e.target.value.replace(/\D/g, "") }))}
                                size="small"
                                placeholder="e.g., 60"
                                sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Colour</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                {PRESET_COLORS.map((c) => {
                                    const selected = presetForm.color === c;
                                    return (
                                        <Box
                                            key={c}
                                            onClick={() => setPresetForm((p) => ({ ...p, color: c }))}
                                            sx={{
                                                width: 26, height: 26, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                border: selected ? "2px solid #fff" : "2px solid transparent",
                                                boxShadow: selected ? `0 0 0 2px ${c}` : "none",
                                                transition: "transform 0.1s, box-shadow 0.1s",
                                                "&:hover": { transform: "scale(1.2)", boxShadow: `0 0 0 2px ${c}` },
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setPresetDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handlePresetSave} disabled={saving || !presetForm.name.trim()} disableElevation sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {saving ? "Saving…" : editingPreset ? "Update" : "Add"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Moment Dialog */}
            <Dialog open={momentDialogOpen} onClose={() => !saving && setMomentDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{editingMoment ? "Edit Moment" : "New Moment"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="Moment Name"
                            value={momentForm.name}
                            onChange={(e) => setMomentForm((p) => ({ ...p, name: e.target.value }))}
                            fullWidth required size="small"
                            placeholder='e.g., "Processional", "Vows", "First Kiss"'
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Description"
                            value={momentForm.description}
                            onChange={(e) => setMomentForm((p) => ({ ...p, description: e.target.value }))}
                            fullWidth size="small" multiline rows={2}
                            placeholder="Brief description of this moment"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Duration (seconds)"
                            value={momentForm.duration_seconds}
                            onChange={(e) => setMomentForm((p) => ({ ...p, duration_seconds: e.target.value.replace(/\D/g, "") }))}
                            fullWidth size="small"
                            placeholder="e.g., 300"
                            helperText={momentForm.duration_seconds ? `= ${formatDuration(parseInt(momentForm.duration_seconds, 10) || 0)}` : ""}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <FormControlLabel
                            control={<Switch checked={momentForm.is_key_moment} onChange={(e) => setMomentForm((p) => ({ ...p, is_key_moment: e.target.checked }))} size="small" />}
                            label={<Typography variant="body2">Key moment (highlight reel)</Typography>}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setMomentDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleMomentSave} disabled={saving || !momentForm.name.trim()} disableElevation sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {saving ? "Saving…" : editingMoment ? "Update" : "Add"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// ---------------------------------------------------------------------------
// Subject Type Section (within selected event type)
// ---------------------------------------------------------------------------

function SubjectTypeSection({ linkedSubjects, eventTypeId, brandId, onReload }: {
    linkedSubjects: EventTypeSubject[];
    eventTypeId: number;
    brandId: number;
    onReload: () => Promise<void>;
}) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Create template dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ role_name: "", description: "", category: "PEOPLE" });

    // Add role dialog
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [roleTargetId, setRoleTargetId] = useState<number | null>(null);
    const [roleForm, setRoleForm] = useState({ role_name: "", description: "", is_core: false });

    // Derive flat subject type templates from linked junction data
    const templates = linkedSubjects
        .sort((a, b) => a.order_index - b.order_index)
        .map(link => link.subject_type_template);

    const handleCreateTemplate = async () => {
        if (!form.role_name.trim()) return;
        try {
            setSaving(true);
            // Create new subject type and auto-link to the selected event type
            const newTemplate = await api.subjects.createRole(brandId, form);
            if (newTemplate?.id) {
                await api.eventTypes.linkSubjectRole(eventTypeId, { subject_role_id: newTemplate.id });
            }
            setDialogOpen(false);
            setForm({ role_name: "", description: "", category: "PEOPLE" });
            await onReload();
        } catch {
            setError("Failed to create template");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!window.confirm("Delete this subject type and all its roles?")) return;
        try {
            await api.subjects.deleteRole(id);
            await onReload();
        } catch {
            setError("Failed to delete template");
        }
    };

    const handleAddRole = async () => {
        if (!roleForm.role_name.trim()) return;
        try {
            setSaving(true);
            await api.subjects.createRole(brandId, roleForm);
            setRoleDialogOpen(false);
            setRoleForm({ role_name: "", description: "", is_core: false });
            await onReload();
        } catch {
            setError("Failed to add role");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (roleId: number) => {
        if (!window.confirm("Remove this role?")) return;
        try {
            await api.subjects.deleteRole(roleId);
            await onReload();
        } catch {
            setError("Failed to remove role");
        }
    };

    const openRoleDialog = (templateId: number) => {
        setRoleTargetId(templateId);
        setRoleForm({ role_name: "", description: "", is_core: false });
        setRoleDialogOpen(true);
    };

    const categoryColor = (cat: string) => {
        switch (cat) {
            case "PEOPLE": return "info";
            case "OBJECTS": return "warning";
            case "LOCATIONS": return "success";
            default: return "default";
        }
    };

    return (
        <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Subject Types</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define subject types with roles (e.g., &quot;Couple&quot; &rarr; Bride, Groom).
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ name: "", description: "", category: "PEOPLE" }); setDialogOpen(true); }} disableElevation size="small" sx={{ borderRadius: 2, fontWeight: 600 }}>
                    Add Subject Type
                </Button>
            </Box>

            {templates.length === 0 ? (
                <Card variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 3, borderStyle: "dashed" }}>
                    <SubjectsIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No subject types yet</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ mt: 1 }}>Add your first</Button>
                </Card>
            ) : (
                <Stack spacing={1.5}>
                    {templates.map((tpl) => (
                        <Card key={tpl.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                            <Box
                                sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 2, cursor: "pointer", "&:hover": { bgcolor: (theme) => alpha(theme.palette.action.hover, 0.04) } }}
                                onClick={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
                            >
                                <Avatar sx={{ width: 36, height: 36, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12), color: "primary.main", fontSize: "0.85rem", fontWeight: 700 }}>
                                    {tpl.name.substring(0, 2).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography fontWeight={700}>{tpl.name}</Typography>
                                        <Chip label={tpl.category} size="small" color={categoryColor(tpl.category) as "info" | "warning" | "success" | "default"} sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }} />
                                        <Chip label={`${tpl.roles?.length || 0} roles`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                                    </Box>
                                    {tpl.description && <Typography variant="caption" color="text.secondary">{tpl.description}</Typography>}
                                </Box>
                                <Tooltip title="Delete">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                {expandedId === tpl.id ? <CollapseIcon /> : <ExpandIcon />}
                            </Box>

                            {expandedId === tpl.id && (
                                <Box sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Roles</Typography>
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => openRoleDialog(tpl.id)}>Add Role</Button>
                                    </Box>
                                    {(!tpl.roles || tpl.roles.length === 0) ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>No roles defined yet</Typography>
                                    ) : (
                                        <Stack spacing={0.5}>
                                            {tpl.roles.sort((a, b) => a.order_index - b.order_index).map((role) => (
                                                <Box key={role.id} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}>
                                                    <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{role.role_name}</Typography>
                                                    {role.is_core && <Chip label="Core" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />}
                                                    {role.description && <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>{role.description}</Typography>}
                                                    <Tooltip title="Remove role">
                                                        <IconButton size="small" onClick={() => handleDeleteRole(role.id)} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                                            <DeleteIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </Card>
                    ))}
                </Stack>
            )}

            {/* Create Template Dialog */}
            <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>New Subject Type</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Name" value={form.role_name} onChange={(e) => setForm((p) => ({ ...p, role_name: e.target.value }))} fullWidth required size="small" placeholder='e.g., "Couple", "Wedding Party"' sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} fullWidth multiline rows={2} size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Category</Typography>
                            <Stack direction="row" spacing={1}>
                                {["PEOPLE", "OBJECTS", "LOCATIONS"].map((cat) => (
                                    <Chip
                                        key={cat}
                                        label={cat}
                                        size="small"
                                        color={form.category === cat ? categoryColor(cat) as "info" | "warning" | "success" | "default" : "default"}
                                        variant={form.category === cat ? "filled" : "outlined"}
                                        onClick={() => setForm((p) => ({ ...p, category: cat }))}
                                        sx={{ fontWeight: 600, cursor: "pointer" }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateTemplate} disabled={saving || !form.role_name.trim()} disableElevation sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {saving ? "Creating…" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Role Dialog */}
            <Dialog open={roleDialogOpen} onClose={() => !saving && setRoleDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Add Role</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Role Name" value={roleForm.role_name} onChange={(e) => setRoleForm((p) => ({ ...p, role_name: e.target.value }))} fullWidth required size="small" placeholder='e.g., "Bride", "Groom"' sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Description" value={roleForm.description} onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <FormControlLabel
                            control={<Switch checked={roleForm.is_core} onChange={(e) => setRoleForm((p) => ({ ...p, is_core: e.target.checked }))} />}
                            label={<Typography variant="body2" fontWeight={500}>Core role (pre-selected by default)</Typography>}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setRoleDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddRole} disabled={saving || !roleForm.role_name.trim()} disableElevation sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {saving ? "Adding…" : "Add Role"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// ---------------------------------------------------------------------------
// Main Templates Page
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
    const { currentBrand } = useBrand();
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Event type create/edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<EventType | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", icon: "" });

    // ── Load ──
    const load = useCallback(async () => {
        if (!currentBrand?.id) return;
        try {
            setLoading(true);
            const data = await api.eventTypes.getAll();
            setEventTypes(data || []);
        } catch {
            setError("Failed to load event types");
        } finally {
            setLoading(false);
        }
    }, [currentBrand?.id]);

    useEffect(() => { load(); }, [load]);

    // Auto-select first event type when loaded
    useEffect(() => {
        if (eventTypes.length > 0 && !selectedId) {
            setSelectedId(eventTypes[0].id);
        }
    }, [eventTypes, selectedId]);

    const selectedEventType = eventTypes.find(et => et.id === selectedId) || null;

    // ── Event Type CRUD ──
    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", description: "", icon: "" });
        setDialogOpen(true);
    };

    const openEdit = (et: EventType) => {
        setEditing(et);
        setForm({
            name: et.name,
            description: et.description || "",
            icon: et.icon || "",
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        try {
            setSaving(true);
            // Auto-assign colour based on current count (cycles through palette)
            const autoColor = editing?.color || PRESET_COLORS[eventTypes.length % PRESET_COLORS.length];
            const data = {
                name: form.name,
                description: form.description || undefined,
                icon: form.icon || undefined,
                color: autoColor,
            };
            if (editing) {
                await api.eventTypes.update(editing.id, data);
            } else {
                const created = await api.eventTypes.create(data);
                if (created?.id) {
                    setSelectedId(created.id);
                }
            }
            setDialogOpen(false);
            await load();
        } catch {
            setError("Failed to save event type");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this event type? Linked presets won't be deleted.")) return;
        try {
            await api.eventTypes.remove(id);
            if (selectedId === id) {
                setSelectedId(null);
            }
            await load();
        } catch {
            setError("Failed to delete event type");
        }
    };

    if (loading) return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    Templates
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configure event types and the building-block presets that power your package creation workflow.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* ── Event Type Card Row ── */}
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    overflowX: "auto",
                    pb: 1,
                    mb: 3,
                    "&::-webkit-scrollbar": { height: 6 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 3 },
                }}
            >
                {eventTypes.sort((a, b) => a.order_index - b.order_index).map(et => {
                    const isSelected = selectedId === et.id;
                    const dayCount = et.event_days?.length || 0;
                    const subjectCount = et.subject_types?.length || 0;
                    return (
                        <Card
                            key={et.id}
                            variant="outlined"
                            onClick={() => setSelectedId(et.id)}
                            sx={{
                                minWidth: 170,
                                maxWidth: 210,
                                p: 2,
                                cursor: "pointer",
                                border: 2,
                                borderColor: isSelected ? (et.color || "primary.main") : "divider",
                                bgcolor: isSelected ? alpha(et.color || "#648CFF", 0.06) : "transparent",
                                borderRadius: 3,
                                transition: "all 0.2s",
                                "&:hover": { borderColor: et.color || "primary.main", bgcolor: alpha(et.color || "#648CFF", 0.03) },
                                flexShrink: 0,
                                position: "relative",
                            }}
                        >
                            {/* Edit / Delete (top right) */}
                            <Box sx={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 0.25 }}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); openEdit(et); }}
                                    sx={{ p: 0.25, opacity: 0.4, "&:hover": { opacity: 1 } }}
                                >
                                    <EditIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(et.id); }}
                                    sx={{ p: 0.25, opacity: 0.4, color: "text.disabled", "&:hover": { opacity: 1, color: "error.main" } }}
                                >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>

                            <Avatar
                                sx={{
                                    width: 44, height: 44, mb: 1,
                                    bgcolor: alpha(et.color || "#648CFF", 0.15),
                                    color: et.color || "primary.main",
                                    fontSize: "1.3rem",
                                }}
                            >
                                {et.icon || et.name.substring(0, 2).toUpperCase()}
                            </Avatar>
                            <Typography fontWeight={700} noWrap sx={{ mb: 0.5 }}>{et.name}</Typography>
                            {et.description && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mb: 0.75 }}>
                                    {et.description}
                                </Typography>
                            )}
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                                <Chip label={`${dayCount} day${dayCount !== 1 ? "s" : ""}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
                                <Chip label={`${subjectCount} subject${subjectCount !== 1 ? "s" : ""}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
                            </Stack>
                        </Card>
                    );
                })}

                {/* Add Event Type Card */}
                <Card
                    variant="outlined"
                    onClick={openCreate}
                    sx={{
                        minWidth: 140,
                        p: 2,
                        cursor: "pointer",
                        borderStyle: "dashed",
                        borderRadius: 3,
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                        flexShrink: 0,
                    }}
                >
                    <AddIcon sx={{ fontSize: 32, color: "text.disabled", mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Add Type</Typography>
                </Card>
            </Box>

            {/* ── Selected Event Type Content ── */}
            {selectedEventType ? (
                <Box>
                    {/* Event type name header with edit/delete */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                        <Box sx={{ width: 4, height: 28, borderRadius: 1, bgcolor: selectedEventType.color || "primary.main", flexShrink: 0 }} />
                        <Typography variant="h5" fontWeight={700}>{selectedEventType.name}</Typography>
                        {selectedEventType.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                — {selectedEventType.description}
                            </Typography>
                        )}
                        <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
                            <Tooltip title="Edit event type">
                                <IconButton size="small" onClick={() => openEdit(selectedEventType)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete event type">
                                <IconButton size="small" onClick={() => handleDelete(selectedEventType.id)} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <EventDaySection
                        linkedDays={selectedEventType.event_days}
                        eventTypeId={selectedEventType.id}
                        brandId={currentBrand!.id}
                        onReload={load}
                    />

                    <Divider sx={{ my: 4 }} />

                    <SubjectTypeSection
                        linkedSubjects={selectedEventType.subject_types}
                        eventTypeId={selectedEventType.id}
                        brandId={currentBrand!.id}
                        onReload={load}
                    />
                </Box>
            ) : eventTypes.length === 0 ? (
                <Card variant="outlined" sx={{ p: 6, textAlign: "center", borderRadius: 3, borderStyle: "dashed" }}>
                    <EventTypeIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>No event types yet</Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                        Create your first event type to get started with templates.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disableElevation sx={{ borderRadius: 2 }}>
                        Create Event Type
                    </Button>
                </Card>
            ) : null}

            {/* ── Event Type Create / Edit Dialog ── */}
            <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Event Type" : "New Event Type"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} fullWidth required size="small" placeholder='e.g., "Wedding", "Corporate"' sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Icon (emoji)" value={form.icon} onChange={(e) => setForm(p => ({ ...p, icon: e.target.value }))} fullWidth size="small" placeholder="💒" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Short Description" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} fullWidth size="small" placeholder="Brief summary of this event type" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()} disableElevation sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {saving ? "Saving…" : editing ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
