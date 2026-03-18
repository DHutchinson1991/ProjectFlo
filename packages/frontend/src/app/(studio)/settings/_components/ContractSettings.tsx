"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Select,
    FormControl,
    InputLabel,
    Switch,
    Snackbar,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tab,
    Tabs,
    Popover,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    ExpandMore as ExpandMoreIcon,
    Gavel as GavelIcon,
    Category as CategoryIcon,
    Description as ClauseIcon,
    Star as StarIcon,
    AutoAwesome as ExtrasIcon,
    Public as CountryIcon,
    Refresh as SeedIcon,
    DataObject as VariableIcon,
    Article as TemplateIcon,
    Payments as PaymentIcon,
    EventBusy as CancellationIcon,
    WorkOutline as ScopeIcon,
    Security as SecurityIcon,
    MenuBook as IntellectualPropertyIcon,
    Bolt as ForceIcon,
    Lock as ConfidentialityIcon,
    AccountBalance as GeneralIcon,
    Person as TalentIcon,
    Place as LocationIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import type {
    ContractClauseCategory,
    ContractClause,
    CreateContractClauseCategoryData,
    UpdateContractClauseCategoryData,
    CreateContractClauseData,
    UpdateContractClauseData,
    ContractVariableCategory,
} from "@/lib/types";
import ContractTemplatesTab from "./ContractTemplatesTab";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ContractSettings() {
    // Inner tab state
    const [activeTab, setActiveTab] = useState(0);

    const [categories, setCategories] = useState<ContractClauseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Expanded accordion state
    const [expanded, setExpanded] = useState<number | false>(false);

    // Variable picker state
    const [variableAnchor, setVariableAnchor] = useState<HTMLElement | null>(null);
    const [variableCategories, setVariableCategories] = useState<ContractVariableCategory[]>([]);
    const bodyFieldRef = useRef<HTMLTextAreaElement>(null);

    // Category dialog state
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [catDialogMode, setCatDialogMode] = useState<"create" | "edit">("create");
    const [editingCategory, setEditingCategory] = useState<ContractClauseCategory | null>(null);
    const [catForm, setCatForm] = useState({ name: "", description: "", country_code: "" });
    const [catFormErrors, setCatFormErrors] = useState<Record<string, string>>({});

    // Clause dialog state
    const [clauseDialogOpen, setClauseDialogOpen] = useState(false);
    const [clauseDialogMode, setClauseDialogMode] = useState<"create" | "edit">("create");
    const [editingClause, setEditingClause] = useState<ContractClause | null>(null);
    const [clauseForm, setClauseForm] = useState({
        category_id: 0,
        title: "",
        body: "",
        clause_type: "STANDARD" as "STANDARD" | "EXTRA",
        country_code: "",
    });
    const [clauseFormErrors, setClauseFormErrors] = useState<Record<string, string>>({});

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "clause"; id: number; name: string } | null>(null);

    // Menu
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuTarget, setMenuTarget] = useState<{ type: "category" | "clause"; item: ContractClauseCategory | ContractClause } | null>(null);

    // Seed dialog
    const [seedDialogOpen, setSeedDialogOpen] = useState(false);
    const [seedCountry, setSeedCountry] = useState("GB");

    const [submitting, setSubmitting] = useState(false);

    // ── Data loading ──────────────────────────────────────────────────

    const loadCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [data, vars] = await Promise.all([
                api.contractClauses.getCategories(),
                api.contractTemplates.getVariables(),
            ]);
            setCategories(data);
            setVariableCategories(vars);
        } catch {
            setError("Failed to load contract clauses");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // ── Category CRUD ─────────────────────────────────────────────────

    const openCreateCategory = () => {
        setCatForm({ name: "", description: "", country_code: "" });
        setCatFormErrors({});
        setCatDialogMode("create");
        setCatDialogOpen(true);
    };

    const openEditCategory = (cat: ContractClauseCategory) => {
        setEditingCategory(cat);
        setCatForm({
            name: cat.name,
            description: cat.description || "",
            country_code: cat.country_code || "",
        });
        setCatFormErrors({});
        setCatDialogMode("edit");
        setCatDialogOpen(true);
    };

    const validateCatForm = () => {
        const errors: Record<string, string> = {};
        if (!catForm.name.trim()) errors.name = "Category name is required";
        setCatFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitCategory = async () => {
        if (!validateCatForm()) return;
        try {
            setSubmitting(true);
            setError(null);
            const data: CreateContractClauseCategoryData = {
                name: catForm.name.trim(),
                description: catForm.description.trim() || undefined,
                country_code: catForm.country_code || undefined,
            };
            if (catDialogMode === "create") {
                await api.contractClauses.createCategory(data);
                setSuccess("Category created");
            } else if (editingCategory) {
                await api.contractClauses.updateCategory(editingCategory.id, data as UpdateContractClauseCategoryData);
                setSuccess("Category updated");
            }
            await loadCategories();
            setCatDialogOpen(false);
        } catch {
            setError(`Failed to ${catDialogMode} category`);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Clause CRUD ───────────────────────────────────────────────────

    const openCreateClause = (categoryId: number) => {
        setClauseForm({
            category_id: categoryId,
            title: "",
            body: "",
            clause_type: "STANDARD",
            country_code: "",
        });
        setClauseFormErrors({});
        setClauseDialogMode("create");
        setClauseDialogOpen(true);
    };

    const openEditClause = (clause: ContractClause) => {
        setEditingClause(clause);
        setClauseForm({
            category_id: clause.category_id,
            title: clause.title,
            body: clause.body,
            clause_type: clause.clause_type,
            country_code: clause.country_code || "",
        });
        setClauseFormErrors({});
        setClauseDialogMode("edit");
        setClauseDialogOpen(true);
    };

    const validateClauseForm = () => {
        const errors: Record<string, string> = {};
        if (!clauseForm.title.trim()) errors.title = "Clause title is required";
        if (!clauseForm.body.trim()) errors.body = "Clause body is required";
        setClauseFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitClause = async () => {
        if (!validateClauseForm()) return;
        try {
            setSubmitting(true);
            setError(null);
            if (clauseDialogMode === "create") {
                const data: CreateContractClauseData = {
                    category_id: clauseForm.category_id,
                    title: clauseForm.title.trim(),
                    body: clauseForm.body.trim(),
                    clause_type: clauseForm.clause_type,
                    country_code: clauseForm.country_code || undefined,
                };
                await api.contractClauses.create(data);
                setSuccess("Clause created");
            } else if (editingClause) {
                const data: UpdateContractClauseData = {
                    title: clauseForm.title.trim(),
                    body: clauseForm.body.trim(),
                    clause_type: clauseForm.clause_type,
                    country_code: clauseForm.country_code || undefined,
                };
                await api.contractClauses.update(editingClause.id, data);
                setSuccess("Clause updated");
            }
            await loadCategories();
            setClauseDialogOpen(false);
        } catch {
            setError(`Failed to ${clauseDialogMode} clause`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleClauseActive = async (clause: ContractClause) => {
        try {
            await api.contractClauses.update(clause.id, { is_active: !clause.is_active });
            await loadCategories();
            setSuccess(`Clause ${clause.is_active ? "disabled" : "enabled"}`);
        } catch {
            setError("Failed to update clause");
        }
    };

    // ── Delete ────────────────────────────────────────────────────────

    const openDelete = (type: "category" | "clause", id: number, name: string) => {
        setDeleteTarget({ type, id, name });
        setDeleteDialogOpen(true);
        setMenuAnchor(null);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setSubmitting(true);
            if (deleteTarget.type === "category") {
                await api.contractClauses.deleteCategory(deleteTarget.id);
            } else {
                await api.contractClauses.delete(deleteTarget.id);
            }
            await loadCategories();
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
            setSuccess(`${deleteTarget.type === "category" ? "Category" : "Clause"} deleted`);
        } catch {
            setError(`Failed to delete ${deleteTarget.type}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Seed defaults ─────────────────────────────────────────────────

    const handleSeedDefaults = async () => {
        try {
            setSubmitting(true);
            setError(null);
            await api.contractClauses.seedDefaults(seedCountry);
            await loadCategories();
            setSeedDialogOpen(false);
            setSuccess(`Default ${seedCountry} clauses loaded`);
        } catch {
            setError("Failed to seed defaults — they may already exist");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Menu ──────────────────────────────────────────────────────────

    const handleMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        type: "category" | "clause",
        item: ContractClauseCategory | ContractClause,
    ) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setMenuTarget({ type, item });
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuTarget(null);
    };

    // ── Variable insertion ────────────────────────────────────────────

    const handleInsertVariable = (key: string) => {
        const textarea = bodyFieldRef.current;
        if (!textarea) {
            setClauseForm((prev) => ({ ...prev, body: prev.body + `{{${key}}}` }));
        } else {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = clauseForm.body;
            const insert = `{{${key}}}`;
            setClauseForm((prev) => ({
                ...prev,
                body: value.substring(0, start) + insert + value.substring(end),
            }));
            // Restore cursor position after React re-renders
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + insert.length;
                textarea.focus();
            });
        }
        setVariableAnchor(null);
    };

    // ── Render ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    const totalClauses = categories.reduce((sum, c) => sum + (c.clauses?.length || 0), 0);
    const standardCount = categories.reduce(
        (sum, c) => sum + (c.clauses?.filter((cl) => cl.clause_type === "STANDARD").length || 0),
        0,
    );
    const extraCount = totalClauses - standardCount;

    const getCategoryVisual = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("payment")) return { Icon: PaymentIcon, color: "#22c55e", tint: "rgba(34,197,94,0.12)" };
        if (n.includes("cancellation") || n.includes("reschedul")) return { Icon: CancellationIcon, color: "#f59e0b", tint: "rgba(245,158,11,0.14)" };
        if (n.includes("scope") || n.includes("work")) return { Icon: ScopeIcon, color: "#3b82f6", tint: "rgba(59,130,246,0.12)" };
        if (n.includes("liability") || n.includes("insurance")) return { Icon: SecurityIcon, color: "#8b5cf6", tint: "rgba(139,92,246,0.12)" };
        if (n.includes("intellectual") || n.includes("copyright")) return { Icon: IntellectualPropertyIcon, color: "#ec4899", tint: "rgba(236,72,153,0.12)" };
        if (n.includes("force majeure")) return { Icon: ForceIcon, color: "#f97316", tint: "rgba(249,115,22,0.12)" };
        if (n.includes("confidential")) return { Icon: ConfidentialityIcon, color: "#14b8a6", tint: "rgba(20,184,166,0.12)" };
        if (n.includes("general")) return { Icon: GeneralIcon, color: "#64748b", tint: "rgba(100,116,139,0.12)" };
        if (n.includes("talent")) return { Icon: TalentIcon, color: "#a855f7", tint: "rgba(168,85,247,0.12)" };
        if (n.includes("location")) return { Icon: LocationIcon, color: "#10b981", tint: "rgba(16,185,129,0.12)" };
        return { Icon: CategoryIcon, color: "#3b82f6", tint: "rgba(59,130,246,0.12)" };
    };

    return (
        <>
            {/* ── Tab Navigation ──────────────────────────────────── */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
                }}
            >
                <Tab icon={<TemplateIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Templates" />
                <Tab icon={<GavelIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Clauses" />
            </Tabs>

            {/* ── Templates Tab ───────────────────────────────────── */}
            {activeTab === 0 && <ContractTemplatesTab />}

            {/* ── Clauses Tab ─────────────────────────────────────── */}
            {activeTab === 1 && (
                <>
                    {/* ── Header ─────────────────────────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { sm: "center" },
                    gap: 2,
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                    border: 1,
                    borderColor: (t) => alpha(t.palette.primary.main, 0.1),
                }}
            >
                <Avatar
                    sx={{
                        width: 52,
                        height: 52,
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                    }}
                >
                    <GavelIcon sx={{ color: "primary.main" }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Contract Clauses
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        <Chip
                            size="small"
                            label={`${categories.length} categories`}
                            icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                        />
                        <Chip
                            size="small"
                            label={`${standardCount} standard`}
                            icon={<StarIcon sx={{ fontSize: 14 }} />}
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            size="small"
                            label={`${extraCount} extras`}
                            icon={<ExtrasIcon sx={{ fontSize: 14 }} />}
                            variant="outlined"
                        />
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {categories.length === 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<SeedIcon />}
                            onClick={() => setSeedDialogOpen(true)}
                            size="small"
                        >
                            Load Defaults
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openCreateCategory}
                        size="small"
                    >
                        Add Category
                    </Button>
                </Box>
            </Box>

            {/* ── Alerts ─────────────────────────────────────────── */}
            <Collapse in={!!error}>
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Collapse>

            {/* ── Empty state ────────────────────────────────────── */}
            {categories.length === 0 && (
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
                    <GavelIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No contract clauses yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Load country-specific defaults to get started, or create your own from scratch.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
                        <Button
                            variant="contained"
                            startIcon={<SeedIcon />}
                            onClick={() => setSeedDialogOpen(true)}
                        >
                            Load Default Clauses
                        </Button>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateCategory}>
                            Create Category
                        </Button>
                    </Box>
                </Box>
            )}

            {/* ── Category Accordions ────────────────────────────── */}
            {categories.map((cat) => {
                const visual = getCategoryVisual(cat.name);
                return (
                <Accordion
                    key={cat.id}
                    expanded={expanded === cat.id}
                    onChange={(_, isExpanded) => setExpanded(isExpanded ? cat.id : false)}
                    sx={{
                        mb: 1.5,
                        borderRadius: "12px !important",
                        border: 1,
                        borderColor: "divider",
                        borderLeft: `3px solid ${visual.color}`,
                        "&::before": { display: "none" },
                        boxShadow: "none",
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            px: 2.5,
                            "& .MuiAccordionSummary-content": {
                                alignItems: "center",
                                gap: 1.5,
                                my: 1,
                            },
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: cat.is_active
                                    ? visual.tint
                                    : (t) => alpha(t.palette.text.disabled, 0.08),
                            }}
                        >
                            <visual.Icon
                                sx={{
                                    fontSize: 18,
                                    color: cat.is_active ? visual.color : "text.disabled",
                                }}
                            />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="subtitle2" fontWeight={700} noWrap>
                                    {cat.name}
                                </Typography>
                                {!cat.is_active && (
                                    <Chip label="Disabled" size="small" color="default" sx={{ height: 20, fontSize: "0.7rem" }} />
                                )}
                                {cat.country_code && (
                                    <Chip
                                        icon={<CountryIcon sx={{ fontSize: 12 }} />}
                                        label={cat.country_code}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: "0.7rem" }}
                                    />
                                )}
                            </Box>
                            {cat.description && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {cat.description}
                                </Typography>
                            )}
                        </Box>
                        <Chip
                            label={`${cat.clauses?.length || 0} clauses`}
                            size="small"
                            sx={{ mr: 1 }}
                        />
                        <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, "category", cat)}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </AccordionSummary>

                    <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />

                        {/* Add clause button */}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => openCreateClause(cat.id)}
                            >
                                Add Clause
                            </Button>
                        </Box>

                        {/* Clause list */}
                        {(!cat.clauses || cat.clauses.length === 0) && (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                                No clauses in this category yet.
                            </Typography>
                        )}

                        <Stack spacing={1.5}>
                            {cat.clauses?.map((clause) => (
                                <Box
                                    key={clause.id}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        border: 1,
                                        borderColor: clause.is_active
                                            ? "divider"
                                            : (t) => alpha(t.palette.text.disabled, 0.2),
                                        bgcolor: clause.is_active ? "transparent" : (t) => alpha(t.palette.text.disabled, 0.03),
                                        opacity: clause.is_active ? 1 : 0.7,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {clause.title}
                                                </Typography>
                                                <Chip
                                                    label={clause.clause_type}
                                                    size="small"
                                                    color={clause.clause_type === "STANDARD" ? "primary" : "secondary"}
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: "0.65rem" }}
                                                />
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {clause.body}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <Tooltip title={clause.is_active ? "Active — click to disable" : "Disabled — click to enable"}>
                                                <Switch
                                                    size="small"
                                                    checked={clause.is_active}
                                                    onChange={() => handleToggleClauseActive(clause)}
                                                />
                                            </Tooltip>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, "clause", clause)}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </AccordionDetails>
                </Accordion>
                );
            })}
                </>
            )}

            {/* ── Context Menu ───────────────────────────────────── */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        if (menuTarget?.type === "category") openEditCategory(menuTarget.item as ContractClauseCategory);
                        else if (menuTarget?.type === "clause") openEditClause(menuTarget.item as ContractClause);
                        handleMenuClose();
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        if (menuTarget) {
                            const name =
                                menuTarget.type === "category"
                                    ? (menuTarget.item as ContractClauseCategory).name
                                    : (menuTarget.item as ContractClause).title;
                            openDelete(menuTarget.type, menuTarget.item.id, name);
                        }
                        handleMenuClose();
                    }}
                    sx={{ color: "error.main" }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            {/* ── Category Dialog ────────────────────────────────── */}
            <Dialog
                open={catDialogOpen}
                onClose={() => setCatDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: (t) => alpha(t.palette.primary.main, 0.1) }}>
                            <CategoryIcon sx={{ color: "primary.main", fontSize: 18 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {catDialogMode === "create" ? "New Category" : "Edit Category"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Group related contract clauses together
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Category Name"
                            value={catForm.name}
                            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                            error={!!catFormErrors.name}
                            helperText={catFormErrors.name}
                            fullWidth
                            size="small"
                            placeholder="e.g. Payment Terms"
                        />
                        <TextField
                            label="Description"
                            value={catForm.description}
                            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            placeholder="Brief description of this category"
                        />
                        <FormControl size="small" fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                                value={catForm.country_code}
                                label="Country"
                                onChange={(e) => setCatForm({ ...catForm, country_code: e.target.value })}
                            >
                                <MenuItem value="">Universal (all countries)</MenuItem>
                                <MenuItem value="GB">United Kingdom</MenuItem>
                                <MenuItem value="US">United States</MenuItem>
                                <MenuItem value="AU">Australia</MenuItem>
                                <MenuItem value="CA">Canada</MenuItem>
                                <MenuItem value="IE">Ireland</MenuItem>
                                <MenuItem value="NZ">New Zealand</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setCatDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmitCategory} disabled={submitting}>
                        {submitting ? "Saving..." : catDialogMode === "create" ? "Create" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Clause Dialog ──────────────────────────────────── */}
            <Dialog
                open={clauseDialogOpen}
                onClose={() => setClauseDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: (t) => alpha(t.palette.primary.main, 0.1) }}>
                            <ClauseIcon sx={{ color: "primary.main", fontSize: 18 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {clauseDialogMode === "create" ? "New Clause" : "Edit Clause"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Define the clause text and type
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Clause Title"
                            value={clauseForm.title}
                            onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })}
                            error={!!clauseFormErrors.title}
                            helperText={clauseFormErrors.title}
                            fullWidth
                            size="small"
                            placeholder="e.g. Booking Deposit"
                        />
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Use {"{{variable}}"} syntax for auto-fill fields
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<VariableIcon />}
                                    onClick={(e) => setVariableAnchor(e.currentTarget)}
                                    sx={{ textTransform: "none", fontSize: "0.75rem" }}
                                >
                                    Insert Variable
                                </Button>
                            </Box>
                            <TextField
                                label="Clause Text"
                                value={clauseForm.body}
                                onChange={(e) => setClauseForm({ ...clauseForm, body: e.target.value })}
                                error={!!clauseFormErrors.body}
                                helperText={clauseFormErrors.body}
                                fullWidth
                                size="small"
                                multiline
                                rows={6}
                                placeholder="Enter the full clause text... Use {{client.full_name}} for variables"
                                inputRef={bodyFieldRef}
                            />
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <FormControl size="small" sx={{ flex: 1 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={clauseForm.clause_type}
                                    label="Type"
                                    onChange={(e) =>
                                        setClauseForm({ ...clauseForm, clause_type: e.target.value as "STANDARD" | "EXTRA" })
                                    }
                                >
                                    <MenuItem value="STANDARD">Standard</MenuItem>
                                    <MenuItem value="EXTRA">Extra</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ flex: 1 }}>
                                <InputLabel>Country</InputLabel>
                                <Select
                                    value={clauseForm.country_code}
                                    label="Country"
                                    onChange={(e) => setClauseForm({ ...clauseForm, country_code: e.target.value })}
                                >
                                    <MenuItem value="">Universal</MenuItem>
                                    <MenuItem value="GB">United Kingdom</MenuItem>
                                    <MenuItem value="US">United States</MenuItem>
                                    <MenuItem value="AU">Australia</MenuItem>
                                    <MenuItem value="CA">Canada</MenuItem>
                                    <MenuItem value="IE">Ireland</MenuItem>
                                    <MenuItem value="NZ">New Zealand</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setClauseDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmitClause} disabled={submitting}>
                        {submitting ? "Saving..." : clauseDialogMode === "create" ? "Create" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Confirmation ────────────────────────────── */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Delete {deleteTarget?.type}?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                        {deleteTarget?.type === "category" &&
                            " This will also delete all clauses in this category."}
                        {" "}This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={submitting}
                    >
                        {submitting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Seed Defaults Dialog ───────────────────────────── */}
            <Dialog
                open={seedDialogOpen}
                onClose={() => setSeedDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: (t) => alpha(t.palette.info.main, 0.1) }}>
                            <SeedIcon sx={{ color: "info.main", fontSize: 18 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Load Default Clauses
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Pre-populate with standard clauses for your country
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            This will create standard contract clause categories and clauses tailored to your
                            country&apos;s legal requirements. You can edit or remove them after.
                        </Typography>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                                value={seedCountry}
                                label="Country"
                                onChange={(e) => setSeedCountry(e.target.value)}
                            >
                                <MenuItem value="GB">United Kingdom</MenuItem>
                                <MenuItem value="US">United States</MenuItem>
                                <MenuItem value="AU">Australia</MenuItem>
                                <MenuItem value="CA">Canada</MenuItem>
                                <MenuItem value="IE">Ireland</MenuItem>
                                <MenuItem value="NZ">New Zealand</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setSeedDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSeedDefaults} disabled={submitting}>
                        {submitting ? "Loading..." : "Load Defaults"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Variable Picker Popover ──────────────────────── */}
            <Popover
                open={Boolean(variableAnchor)}
                anchorEl={variableAnchor}
                onClose={() => setVariableAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { borderRadius: 2, maxHeight: 400, width: 320 } }}
            >
                <Box sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Insert Variable
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                        Click a variable to insert it at the cursor position
                    </Typography>
                    {variableCategories.map((vc) => (
                        <Box key={vc.category} sx={{ mb: 1.5 }}>
                            <Typography variant="caption" fontWeight={700} color="primary" sx={{ mb: 0.5, display: "block" }}>
                                {vc.category}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                {vc.variables.map((v) => (
                                    <Chip
                                        key={v.key}
                                        label={v.key}
                                        size="small"
                                        onClick={() => handleInsertVariable(v.key)}
                                        sx={{
                                            height: 24,
                                            fontSize: "0.7rem",
                                            fontFamily: "monospace",
                                            cursor: "pointer",
                                            "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.12) },
                                        }}
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    ))}
                    {variableCategories.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                            No variables available
                        </Typography>
                    )}
                </Box>
            </Popover>

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
