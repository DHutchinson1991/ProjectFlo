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
    Divider,
    Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Category as EventTypeIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { useBrand } from "@/app/providers/BrandProvider";
import { PRESET_COLORS } from "../constants";
import { EventDaySection, SubjectTypeSection } from "../components";
import type { EventType } from "../types";

export function EventTypesScreen() {
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
