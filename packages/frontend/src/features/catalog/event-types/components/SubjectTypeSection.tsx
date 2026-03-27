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
    Delete as DeleteIcon,
    People as SubjectsIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
} from "@mui/icons-material";
import { eventTypesApi } from "@/features/catalog/event-types/api";
import { rolesApi } from "@/features/content/subjects";
import type { EventTypeSubject } from "../types";

interface SubjectTypeSectionProps {
    linkedSubjects: EventTypeSubject[];
    eventTypeId: number;
    brandId: number;
    onReload: () => Promise<void>;
}

export function SubjectTypeSection({ linkedSubjects, eventTypeId, brandId, onReload }: SubjectTypeSectionProps) {
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
            const newTemplate = await rolesApi.createRole(brandId, form);
            if (newTemplate && !Array.isArray(newTemplate) && newTemplate.id) {
                await eventTypesApi.linkSubjectRole(eventTypeId, { subject_role_id: newTemplate.id });
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
            await rolesApi.deleteRole(id);
            await onReload();
        } catch {
            setError("Failed to delete template");
        }
    };

    const handleAddRole = async () => {
        if (!roleForm.role_name.trim()) return;
        try {
            setSaving(true);
            await rolesApi.createRole(brandId, roleForm);
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
            await rolesApi.deleteRole(roleId);
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
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ role_name: "", description: "", category: "PEOPLE" }); setDialogOpen(true); }} disableElevation size="small" sx={{ borderRadius: 2, fontWeight: 600 }}>
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
