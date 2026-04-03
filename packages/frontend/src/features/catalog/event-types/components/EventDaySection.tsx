"use client";

import React, { useState } from "react";
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
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Star as StarIcon,
} from "@mui/icons-material";
import { eventTypesApi } from "@/features/catalog/event-types/api";
import { scheduleApi } from "@/features/workflow/scheduling/api";
import { PRESET_COLORS } from "../constants";
import type { EventTypeDay, EventDay, EventDayActivity, PresetMoment } from "../types";

interface EventDaySectionProps {
    linkedDays: EventTypeDay[];
    eventTypeId: number;
    brandId: number;
    onReload: () => Promise<void>;
}

export function EventDaySection({ linkedDays, eventTypeId, brandId, onReload }: EventDaySectionProps) {
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
                await scheduleApi.eventDays.update(brandId, editing.id, form);
            } else {
                const newDay = await scheduleApi.eventDays.create(brandId, {
                    name: form.name,
                    description: form.description || undefined,
                    order_index: eventDays.length,
                }) as { id?: number } | null | undefined;
                if (newDay?.id) {
                    await eventTypesApi.linkEventDay(eventTypeId, { event_day_template_id: newDay.id });
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
            await scheduleApi.eventDays.delete(brandId, id);
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
                await scheduleApi.activityPresets.update(editingPreset.id, data);
            } else {
                const existingPresets = eventDays.find(d => d.id === presetTargetId)?.activity_presets || [];
                await scheduleApi.activityPresets.create(presetTargetId, { ...data, order_index: existingPresets.length });
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
            await scheduleApi.activityPresets.delete(presetId);
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
                await scheduleApi.presetMoments.update(editingMoment.id, data);
            } else {
                const preset = eventDays.flatMap(d => d.activity_presets || []).find(p => p.id === momentTargetPresetId);
                const existingMoments = preset?.moments || [];
                await scheduleApi.presetMoments.create(momentTargetPresetId, { ...data, order_index: existingMoments.length });
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
            await scheduleApi.presetMoments.delete(momentId);
            await onReload();
        } catch {
            setError("Failed to delete moment");
        }
    };

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
