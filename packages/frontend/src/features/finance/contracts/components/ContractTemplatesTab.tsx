"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Stack,
    TextField,
    Chip,
    IconButton,
    Tooltip,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Avatar,
    Checkbox,
    Snackbar,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Description as ClauseIcon,
    Visibility as PreviewIcon,
    DragIndicator as DragIcon,
    Article as TemplateIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import { contractClausesApi, contractTemplatesApi } from "@/features/finance/contracts";
import { paymentSchedulesApi } from "@/features/finance/payment-schedules";
import { useBrand } from "@/app/providers/BrandProvider";
import type {
    ContractClauseCategory,
    ContractTemplate,
    CreateContractTemplateData,
    UpdateContractTemplateData,
    TemplateClauseInput,
    ContractPreview,
    ContractVariableCategory,
    PaymentScheduleTemplate,
} from "@/lib/types";

// ---------------------------------------------------------------------------

export default function ContractTemplatesTab() {
    const { currentBrand } = useBrand();

    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [categories, setCategories] = useState<ContractClauseCategory[]>([]);
    const [paymentSchedules, setPaymentSchedules] = useState<PaymentScheduleTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Builder dialog
    const [builderOpen, setBuilderOpen] = useState(false);
    const [builderMode, setBuilderMode] = useState<"create" | "edit">("create");
    const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
    const [templateForm, setTemplateForm] = useState({ name: "", description: "", payment_schedule_template_id: null as number | null });
    const [selectedClauses, setSelectedClauses] = useState<TemplateClauseInput[]>([]);

    // Preview
    const [previewOpen, setPreviewOpen] = useState(false);
    const [preview, setPreview] = useState<ContractPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Variables reference
    const [variableCategories, setVariableCategories] = useState<ContractVariableCategory[]>([]);

    // Delete
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ContractTemplate | null>(null);

    // DnD state for clause ordering within template
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    // ── Load data ─────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        if (!currentBrand?.id) {
            setTemplates([]);
            setCategories([]);
            setVariableCategories([]);
            setPaymentSchedules([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const [tData, cData, vData, psData] = await Promise.all([
                contractTemplatesApi.getAll(),
                contractClausesApi.getCategories(),
                contractTemplatesApi.getVariables(),
                paymentSchedulesApi.getAll(),
            ]);
            setTemplates(tData);
            setCategories(cData);
            setVariableCategories(vData);
            setPaymentSchedules(psData);
        } catch {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [currentBrand?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Builder ───────────────────────────────────────────────────────

    const openCreateTemplate = () => {
        setTemplateForm({ name: "", description: "", payment_schedule_template_id: null });
        setSelectedClauses([]);
        setBuilderMode("create");
        setEditingTemplate(null);
        setBuilderOpen(true);
    };

    const openEditTemplate = (tmpl: ContractTemplate) => {
        setEditingTemplate(tmpl);
        setTemplateForm({ name: tmpl.name, description: tmpl.description || "", payment_schedule_template_id: tmpl.payment_schedule_template_id ?? null });
        setSelectedClauses(
            tmpl.template_clauses.map((tc) => ({
                clause_id: tc.clause_id,
                order_index: tc.order_index,
                override_body: tc.override_body || undefined,
            })),
        );
        setBuilderMode("edit");
        setBuilderOpen(true);
    };

    const toggleClause = (clauseId: number) => {
        setSelectedClauses((prev) => {
            const exists = prev.find((c) => c.clause_id === clauseId);
            if (exists) return prev.filter((c) => c.clause_id !== clauseId);
            return [...prev, { clause_id: clauseId, order_index: prev.length }];
        });
    };

    const isClauseSelected = (clauseId: number) =>
        selectedClauses.some((c) => c.clause_id === clauseId);

    const handleSubmitTemplate = async () => {
        if (!templateForm.name.trim()) return;
        try {
            setSubmitting(true);
            setError(null);
            const clauses = selectedClauses.map((c, i) => ({
                ...c,
                order_index: i,
            }));
            if (builderMode === "create") {
                const data: CreateContractTemplateData = {
                    name: templateForm.name.trim(),
                    description: templateForm.description.trim() || undefined,
                    payment_schedule_template_id: templateForm.payment_schedule_template_id ?? undefined,
                    clauses,
                };
                await contractTemplatesApi.create(data);
                setSuccess("Template created");
            } else if (editingTemplate) {
                const data: UpdateContractTemplateData = {
                    name: templateForm.name.trim(),
                    description: templateForm.description.trim() || undefined,
                    payment_schedule_template_id: templateForm.payment_schedule_template_id,
                    clauses,
                };
                await contractTemplatesApi.update(editingTemplate.id, data);
                setSuccess("Template updated");
            }
            await loadData();
            setBuilderOpen(false);
        } catch {
            setError(`Failed to ${builderMode} template`);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Preview ───────────────────────────────────────────────────────

    const openPreview = async (tmpl: ContractTemplate) => {
        try {
            setPreviewLoading(true);
            setPreviewOpen(true);
            const data = await contractTemplatesApi.preview(tmpl.id);
            setPreview(data);
        } catch {
            setError("Failed to generate preview");
            setPreviewOpen(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setSubmitting(true);
            await contractTemplatesApi.delete(deleteTarget.id);
            await loadData();
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
            setSuccess("Template deleted");
        } catch {
            setError("Failed to delete template");
        } finally {
            setSubmitting(false);
        }
    };

    // ── DnD for clause ordering inside builder ────────────────────────

    const handleDragStart = (index: number) => {
        setDragIdx(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === index) return;
        setSelectedClauses((prev) => {
            const next = [...prev];
            const [moved] = next.splice(dragIdx, 1);
            next.splice(index, 0, moved);
            return next;
        });
        setDragIdx(index);
    };

    const handleDragEnd = () => {
        setDragIdx(null);
    };

    // ── Helpers ───────────────────────────────────────────────────────

    const findClause = (clauseId: number) => {
        for (const cat of categories) {
            const clause = cat.clauses?.find((c) => c.id === clauseId);
            if (clause) return { clause, category: cat };
        }
        return null;
    };

    // ── Render ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            {/* ── Header ─────────────────────────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: (t) => alpha(t.palette.secondary.main, 0.04),
                    border: 1,
                    borderColor: (t) => alpha(t.palette.secondary.main, 0.1),
                }}
            >
                <Avatar sx={{ width: 52, height: 52, bgcolor: (t) => alpha(t.palette.secondary.main, 0.12) }}>
                    <TemplateIcon sx={{ color: "secondary.main" }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Contract Templates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Compose contracts from your clause library. Templates auto-fill variables from inquiry data.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateTemplate} size="small">
                    New Template
                </Button>
            </Box>

            <Collapse in={!!error}>
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Collapse>

            {/* ── Empty state ────────────────────────────────────── */}
            {templates.length === 0 && (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 8,
                        px: 3,
                        borderRadius: 2,
                        border: "2px dashed",
                        borderColor: "divider",
                    }}
                >
                    <TemplateIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No contract templates yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Create a template or seed defaults from your clause library.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateTemplate}>
                        Create Template
                    </Button>
                </Box>
            )}

            {/* ── Template cards ──────────────────────────────────── */}
            <Stack spacing={2}>
                {templates.map((tmpl) => (
                    <Paper
                        key={tmpl.id}
                        variant="outlined"
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            opacity: tmpl.is_active ? 1 : 0.6,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: (t) => alpha(t.palette.secondary.main, 0.1),
                                }}
                            >
                                <TemplateIcon sx={{ color: "secondary.main", fontSize: 20 }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {tmpl.name}
                                    </Typography>
                                    {tmpl.is_default && (
                                        <Chip label="Default" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                                    )}
                                    <Chip
                                        label={`${tmpl.template_clauses.length} clauses`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: "0.7rem" }}
                                    />
                                    {tmpl.payment_schedule && (
                                        <Chip
                                            label={tmpl.payment_schedule.name}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: "0.7rem" }}
                                        />
                                    )}
                                </Box>
                                {tmpl.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {tmpl.description}
                                    </Typography>
                                )}
                                {/* Show clause titles */}
                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                    {tmpl.template_clauses.slice(0, 6).map((tc) => (
                                        <Chip
                                            key={tc.id}
                                            label={tc.clause.title}
                                            size="small"
                                            icon={<ClauseIcon sx={{ fontSize: 12 }} />}
                                            sx={{ fontSize: "0.65rem", height: 22 }}
                                            variant="outlined"
                                        />
                                    ))}
                                    {tmpl.template_clauses.length > 6 && (
                                        <Chip
                                            label={`+${tmpl.template_clauses.length - 6} more`}
                                            size="small"
                                            sx={{ fontSize: "0.65rem", height: 22 }}
                                        />
                                    )}
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Preview">
                                    <IconButton size="small" onClick={() => openPreview(tmpl)}>
                                        <PreviewIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => openEditTemplate(tmpl)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setDeleteTarget(tmpl);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" color="error" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Paper>
                ))}
            </Stack>

            {/* ── Builder Dialog ──────────────────────────────────── */}
            <Dialog
                open={builderOpen}
                onClose={() => setBuilderOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, height: "80vh" } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: (t) => alpha(t.palette.secondary.main, 0.1) }}>
                            <TemplateIcon sx={{ color: "secondary.main", fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {builderMode === "create" ? "New Template" : "Edit Template"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Select and order the clauses for this contract template
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setBuilderOpen(false)} size="small">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
                    {/* Template info */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                            label="Template Name"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            fullWidth
                            size="small"
                            placeholder="e.g. Standard Wedding Contract"
                        />
                        <TextField
                            label="Description"
                            value={templateForm.description}
                            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                            fullWidth
                            size="small"
                            placeholder="Brief description"
                        />
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel>Payment Schedule</InputLabel>
                            <Select
                                value={templateForm.payment_schedule_template_id ?? ""}
                                label="Payment Schedule"
                                onChange={(e) =>
                                    setTemplateForm({
                                        ...templateForm,
                                        payment_schedule_template_id: e.target.value === "" ? null : Number(e.target.value),
                                    })
                                }
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {paymentSchedules.map((ps) => (
                                    <MenuItem key={ps.id} value={ps.id}>
                                        {ps.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Two-column layout: available clauses | selected order */}
                    <Box sx={{ display: "flex", gap: 2, flex: 1, minHeight: 0, overflow: "hidden" }}>
                        {/* LEFT: Available clauses */}
                        <Box
                            sx={{
                                flex: 1,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                overflow: "auto",
                            }}
                        >
                            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: (t) => alpha(t.palette.grey[500], 0.04) }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Available Clauses
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Click to add/remove from template
                                </Typography>
                            </Box>
                            <List dense disablePadding>
                                {categories.map((cat) => (
                                    <React.Fragment key={cat.id}>
                                        <ListItem sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.03), py: 0.5 }}>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="caption" fontWeight={700} color="primary">
                                                        {cat.name}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                        {cat.clauses
                                            ?.filter((cl) => cl.is_active)
                                            .map((clause) => (
                                                <ListItem
                                                    key={clause.id}
                                                    component="div"
                                                    onClick={() => toggleClause(clause.id)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        py: 0.5,
                                                        pl: 3,
                                                        "&:hover": { bgcolor: (t) => alpha(t.palette.action.hover, 0.04) },
                                                        ...(isClauseSelected(clause.id) && {
                                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                                                        }),
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                                        <Checkbox
                                                            checked={isClauseSelected(clause.id)}
                                                            size="small"
                                                            tabIndex={-1}
                                                            disableRipple
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <Typography variant="body2" fontSize="0.8rem">
                                                                    {clause.title}
                                                                </Typography>
                                                                <Chip
                                                                    label={clause.clause_type}
                                                                    size="small"
                                                                    color={clause.clause_type === "STANDARD" ? "primary" : "secondary"}
                                                                    variant="outlined"
                                                                    sx={{ height: 16, fontSize: "0.6rem" }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{
                                                                    display: "-webkit-box",
                                                                    WebkitLineClamp: 1,
                                                                    WebkitBoxOrient: "vertical",
                                                                    overflow: "hidden",
                                                                    fontSize: "0.7rem",
                                                                }}
                                                            >
                                                                {clause.body}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Box>

                        {/* RIGHT: Selected clauses (orderable) */}
                        <Box
                            sx={{
                                flex: 1,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                overflow: "auto",
                            }}
                        >
                            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: (t) => alpha(t.palette.grey[500], 0.04) }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Template Order ({selectedClauses.length} clauses)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Drag to reorder clauses in the contract
                                </Typography>
                            </Box>
                            {selectedClauses.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Select clauses from the left panel
                                    </Typography>
                                </Box>
                            ) : (
                                <List dense disablePadding>
                                    {selectedClauses.map((sc, idx) => {
                                        const found = findClause(sc.clause_id);
                                        if (!found) return null;
                                        return (
                                            <ListItem
                                                key={sc.clause_id}
                                                draggable
                                                onDragStart={() => handleDragStart(idx)}
                                                onDragOver={(e) => handleDragOver(e, idx)}
                                                onDragEnd={handleDragEnd}
                                                sx={{
                                                    py: 1,
                                                    px: 1.5,
                                                    borderBottom: 1,
                                                    borderColor: "divider",
                                                    cursor: "grab",
                                                    bgcolor: dragIdx === idx ? (t) => alpha(t.palette.primary.main, 0.08) : "transparent",
                                                    "&:hover": { bgcolor: (t) => alpha(t.palette.action.hover, 0.04) },
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 28 }}>
                                                    <DragIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <Chip
                                                                label={idx + 1}
                                                                size="small"
                                                                sx={{ height: 18, fontSize: "0.65rem", minWidth: 24, fontWeight: 700 }}
                                                            />
                                                            <Typography variant="body2" fontSize="0.8rem" fontWeight={600}>
                                                                {found.clause.title}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                                                            {found.category.name}
                                                        </Typography>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={() => toggleClause(sc.clause_id)}
                                                    >
                                                        <CloseIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitTemplate}
                        disabled={submitting || !templateForm.name.trim() || selectedClauses.length === 0}
                    >
                        {submitting ? "Saving..." : builderMode === "create" ? "Create Template" : "Save Template"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Preview Dialog ──────────────────────────────────── */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: (t) => alpha(t.palette.info.main, 0.1) }}>
                            <PreviewIcon sx={{ color: "info.main", fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Contract Preview
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {preview?.template_name || "Loading..."}
                                {" — "}Unresolved variables shown as {"{{variable}}"}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setPreviewOpen(false)} size="small">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 3 }}>
                    {previewLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : preview ? (
                        <Stack spacing={3}>
                            {preview.sections.map((section, idx) => (
                                <Box key={section.clause_id}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <Chip label={idx + 1} size="small" sx={{ fontWeight: 700, height: 22 }} />
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {section.title}
                                        </Typography>
                                        <Chip label={section.category} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.8,
                                            pl: 4.5,
                                            color: "text.secondary",
                                        }}
                                    >
                                        {highlightVariables(section.body)}
                                    </Typography>
                                    {idx < preview.sections.length - 1 && <Divider sx={{ mt: 2 }} />}
                                </Box>
                            ))}

                            {/* Variable reference */}
                            {variableCategories.length > 0 && (
                                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.info.main, 0.04), border: 1, borderColor: (t) => alpha(t.palette.info.main, 0.1) }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        Available Variables
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        {variableCategories.map((vc) => (
                                            <Box key={vc.category}>
                                                <Typography variant="caption" fontWeight={700} color="primary">
                                                    {vc.category}
                                                </Typography>
                                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                                                    {vc.variables.map((v) => (
                                                        <Chip
                                                            key={v.key}
                                                            label={`{{${v.key}}}`}
                                                            size="small"
                                                            sx={{ fontSize: "0.6rem", height: 20, fontFamily: "monospace" }}
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Stack>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ────────────────────────────── */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Delete template?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={submitting}>
                        {submitting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Snackbar ───────────────────────────────────────── */}
            <Snackbar
                open={!!success}
                autoHideDuration={3500}
                onClose={() => setSuccess(null)}
                message={success}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </>
    );
}

// Highlight {{variables}} in preview text with styled spans
function highlightVariables(text: string): React.ReactNode {
    const parts = text.split(/(\{\{[\w.]+\}\})/g);
    return parts.map((part, i) => {
        if (/^\{\{[\w.]+\}\}$/.test(part)) {
            return (
                <Box
                    key={i}
                    component="span"
                    sx={{
                        bgcolor: (t: { palette: { warning: { main: string } } }) => alpha(t.palette.warning.main, 0.15),
                        px: 0.5,
                        py: 0.2,
                        borderRadius: 0.5,
                        fontFamily: "monospace",
                        fontSize: "0.85em",
                        color: "warning.dark",
                    }}
                >
                    {part}
                </Box>
            );
        }
        return part;
    });
}
