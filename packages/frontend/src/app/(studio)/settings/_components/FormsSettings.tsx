"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import {
    Add, Delete, Save, OpenInNew, DragIndicator,
    Visibility, Publish, Settings, CheckCircle,
} from "@mui/icons-material";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/lib/api";
import {
    NeedsAssessmentQuestion,
    NeedsAssessmentTemplate,
    NeedsAssessmentSubmission,
    WizardStep,
} from "@/lib/types";
import { useBrand } from "@/app/providers/BrandProvider";

// ── Constants ──────────────────────────────────────────────────────────────
const FIELD_TYPES = ["text", "textarea", "email", "phone", "date", "select", "multiselect"];
const CONDITION_OPERATORS = ["equals", "not_equals", "contains"] as const;

const DEFAULT_STEPS: WizardStep[] = [
    { key: "contact", label: "You", description: "Let's start with the basics" },
    { key: "event", label: "Your Wedding", description: "Tell us about your day" },
    { key: "coverage", label: "Coverage", description: "What you'd like us to capture" },
    { key: "budget", label: "Budget", description: "Help us find the right fit" },
    { key: "package", label: "Package", description: "Choose your package", type: "package_select" },
    { key: "reach", label: "Reach You", description: "How best to connect" },
];

// ── Dark design tokens ──────────────────────────────────────────────────────
const bg0 = "#090d12";
const bg1 = "rgba(255,255,255,0.025)";
const border0 = "rgba(255,255,255,0.07)";
const border1 = "rgba(255,255,255,0.12)";
const accent = "#3b82f6";
const accentLight = "rgba(59,130,246,0.1)";
const accentBorder = "rgba(59,130,246,0.35)";
const muted = "#64748b";
const body = "#cbd5e1";
const heading = "#f1f5f9";

const cardSx = {
    bgcolor: bg1,
    border: `1px solid ${border0}`,
    borderRadius: "14px",
    backdropFilter: "blur(8px)",
};

const inputSx = {
    "& .MuiOutlinedInput-root": {
        color: body, fontSize: "0.85rem", bgcolor: "rgba(255,255,255,0.03)",
        "& fieldset": { borderColor: border1 },
        "&:hover fieldset": { borderColor: accentBorder },
        "&.Mui-focused fieldset": { borderColor: accent, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": { color: muted, fontSize: "0.8rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: accent },
    "& .MuiSelect-select": { color: body, fontSize: "0.85rem" },
};

// ── SortableQuestionCard ───────────────────────────────────────────────────
function SortableQuestionCard({ id, children }: { id: number; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }}>
            <Box {...attributes} {...listeners}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, cursor: "grab", mb: 0.5, width: "fit-content", "&:active": { cursor: "grabbing" } }}>
                <DragIndicator sx={{ fontSize: "0.9rem", color: muted }} />
                <Typography sx={{ color: muted, fontSize: "0.65rem", userSelect: "none" }}>drag</Typography>
            </Box>
            {children}
        </Box>
    );
}

export function FormsSettings() {
    const { currentBrand } = useBrand();
    const [template, setTemplate] = useState<NeedsAssessmentTemplate | null>(null);
    const [questions, setQuestions] = useState<NeedsAssessmentQuestion[]>([]);
    const [steps, setSteps] = useState<WizardStep[]>(DEFAULT_STEPS);
    const [templates, setTemplates] = useState<NeedsAssessmentTemplate[]>([]);
    const [submissions, setSubmissions] = useState<NeedsAssessmentSubmission[]>([]);
    const [activeStepKey, setActiveStepKey] = useState<string>("__all__");
    const [activeTab, setActiveTab] = useState<"builder" | "steps" | "submissions" | "templates">("builder");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [previewResponses, setPreviewResponses] = useState<Record<string, any>>({});

    // ── Load ────────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!currentBrand?.id) return;
        try {
            setLoading(true);
            const [activeTemplate, templateList, submissionData] = await Promise.all([
                api.needsAssessmentTemplates.getActive(),
                api.needsAssessmentTemplates.getAll(),
                api.needsAssessmentSubmissions.getAll(),
            ]);
            setTemplate(activeTemplate);
            setQuestions(activeTemplate.questions || []);
            setSteps((activeTemplate.steps_config as WizardStep[] | null) || DEFAULT_STEPS);
            setTemplates(templateList || []);
            setSubmissions(submissionData || []);
            setIsDirty(false);
        } catch {
            setError("Failed to load sales questionnaire.");
        } finally {
            setLoading(false);
        }
    }, [currentBrand?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    // Autosave
    useEffect(() => {
        if (!template || !isDirty || saving) return;
        const t = setTimeout(() => handleSave(), 1400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template, questions, steps, isDirty]);

    // ── Sensors ─────────────────────────────────────────────────────────────
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    // ── Derived ─────────────────────────────────────────────────────────────
    const stepQuestions = useMemo(() => {
        if (activeStepKey === "__all__") return questions;
        const activeStep = steps.find((s) => s.key === activeStepKey);
        if (activeStep?.type === "package_select") return [];
        return questions.filter((q) => (q.category || "") === activeStepKey);
    }, [questions, activeStepKey, steps]);

    const stepQuestionCount = useCallback((key: string) => {
        const step = steps.find((s) => s.key === key);
        if (step?.type === "package_select") return 0;
        return questions.filter((q) => (q.category || "") === key).length;
    }, [questions, steps]);

    // ── Handlers ────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = questions.findIndex((q) => q.order_index === active.id);
        const newIdx = questions.findIndex((q) => q.order_index === over.id);
        setQuestions(arrayMove(questions, oldIdx, newIdx).map((q, i) => ({ ...q, order_index: i + 1 })));
        setIsDirty(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleQuestionChange = (index: number, field: keyof NeedsAssessmentQuestion, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
        setIsDirty(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConditionChange = (index: number, field: string, value: any) => {
        const updated = [...questions];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = (updated[index].condition_json as Record<string, any>) || {};
        updated[index] = { ...updated[index], condition_json: { ...existing, [field]: value } };
        setQuestions(updated);
        setIsDirty(true);
    };

    const handleAddQuestion = () => {
        const nextIdx = questions.length > 0 ? Math.max(...questions.map((q) => q.order_index)) + 1 : 1;
        setQuestions([...questions, {
            order_index: nextIdx, prompt: "New question", field_type: "text",
            required: false, field_key: "", options: { values: [] },
            category: activeStepKey === "__all__" ? "" : activeStepKey,
        }]);
        setIsDirty(true);
    };

    const handleRemoveQuestion = (index: number) => {
        const updated = [...questions];
        updated.splice(index, 1);
        setQuestions(updated.map((q, i) => ({ ...q, order_index: i + 1 })));
        setIsDirty(true);
    };

    const handleStepChange = (index: number, field: keyof WizardStep, value: string) => {
        const updated = [...steps];
        updated[index] = { ...updated[index], [field]: value } as WizardStep;
        setSteps(updated);
        setIsDirty(true);
    };

    const handleAddStep = () => {
        setSteps([...steps, { key: `step_${Date.now()}`, label: "New Step", description: "" }]);
        setIsDirty(true);
    };

    const handleRemoveStep = (key: string) => {
        setSteps(steps.filter((s) => s.key !== key));
        if (activeStepKey === key) setActiveStepKey("__all__");
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!template) return;
        try {
            setSaving(true);
            const updated = await api.needsAssessmentTemplates.update(template.id, {
                name: template.name,
                description: template.description,
                is_active: template.is_active,
                status: template.status || "draft",
                version: template.version || "1.0",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                steps_config: steps as any,
                questions: questions.map((q, i) => ({ ...q, order_index: i + 1, options: q.options || undefined })),
            });
            setTemplate(updated);
            setQuestions(updated.questions || []);
            setSteps((updated.steps_config as WizardStep[] | null) || DEFAULT_STEPS);
            setLastSavedAt(new Date());
            setIsDirty(false);
        } catch {
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleSelectTemplate = async (id: number) => {
        try {
            const selected = await api.needsAssessmentTemplates.getById(id);
            setTemplate(selected);
            setQuestions(selected.questions || []);
            setSteps((selected.steps_config as WizardStep[] | null) || DEFAULT_STEPS);
            setIsDirty(false);
        } catch { setError("Failed to load template."); }
    };

    const handleConvertSubmission = async (submissionId: number) => {
        try {
            await api.needsAssessmentSubmissions.convert(submissionId);
            await loadData();
        } catch { setError("Failed to convert submission."); }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shouldShowQuestion = (q: NeedsAssessmentQuestion, resp: Record<string, any>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cond = (q.condition_json as Record<string, any>) || {};
        if (!cond.field_key) return true;
        const val = resp[cond.field_key];
        switch (cond.operator) {
            case "not_equals": return val !== cond.value;
            case "contains": return Array.isArray(val) ? val.includes(cond.value) : String(val || "").includes(String(cond.value || ""));
            default: return val === cond.value;
        }
    };

    // ── Loading ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={36} sx={{ color: accent }} />
                    <Typography sx={{ color: muted, fontSize: "0.8rem" }}>Loading…</Typography>
                </Stack>
            </Box>
        );
    }

    // ── Tab button ──────────────────────────────────────────────────────────
    const TabBtn = ({ id, label }: { id: typeof activeTab; label: string }) => (
        <Box component="button" onClick={() => setActiveTab(id)} sx={{
            px: 2, py: 0.75, borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
            bgcolor: activeTab === id ? accentLight : "transparent",
            color: activeTab === id ? "#93c5fd" : muted,
            "&:hover": { color: body, bgcolor: "rgba(255,255,255,0.04)" },
        }}>{label}</Box>
    );

    // ── Step tab ────────────────────────────────────────────────────────────
    const StepTab = ({ stepKey, label, count, isPackage }: { stepKey: string; label: string; count: number | string; isPackage?: boolean }) => {
        const isActive = activeStepKey === stepKey;
        return (
            <Box component="button" onClick={() => setActiveStepKey(stepKey)} sx={{
                display: "flex", alignItems: "center", gap: 0.75,
                px: 1.5, py: 1, borderRadius: "8px", border: "none", cursor: "pointer",
                bgcolor: isActive ? accentLight : "transparent",
                color: isActive ? "#93c5fd" : muted,
                fontSize: "0.78rem", fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap",
                "&:hover": { color: body, bgcolor: "rgba(255,255,255,0.04)" },
            }}>
                {label}
                <Box sx={{
                    px: 0.5, py: 0.1, borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700, minWidth: 16, textAlign: "center",
                    bgcolor: isActive ? `${accent}30` : "rgba(255,255,255,0.06)",
                    color: isActive ? "#93c5fd" : muted,
                }}>
                    {isPackage ? "pkg" : count}
                </Box>
            </Box>
        );
    };

    // ── Question card renderer ───────────────────────────────────────────────
    const renderQuestionCard = (question: NeedsAssessmentQuestion, visibleIndex: number) => {
        const realIndex = questions.findIndex((q) => q.order_index === question.order_index);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cond = (question.condition_json as Record<string, any>) || {};
        const hasOptions = ["select", "multiselect"].includes(question.field_type);

        return (
            <SortableQuestionCard key={question.order_index} id={question.order_index}>
                <Box sx={{ ...cardSx, p: 2, mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: "6px", flexShrink: 0, mt: 0.25, bgcolor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography sx={{ color: muted, fontSize: "0.65rem", fontWeight: 700 }}>{visibleIndex + 1}</Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Prompt */}
                            <TextField
                                value={question.prompt}
                                onChange={(e) => handleQuestionChange(realIndex, "prompt", e.target.value)}
                                placeholder="Question text…" fullWidth size="small" variant="outlined"
                                sx={{ ...inputSx, mb: 1.5, "& .MuiOutlinedInput-input": { fontWeight: 600, fontSize: "0.88rem" } }}
                            />
                            {/* Type / key / step */}
                            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                                <FormControl size="small" sx={{ flex: 1, ...inputSx }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select label="Type" value={question.field_type}
                                        onChange={(e) => handleQuestionChange(realIndex, "field_type", e.target.value)}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: "#111827", border: `1px solid ${border1}`, "& .MuiMenuItem-root": { color: body, fontSize: "0.8rem", "&:hover": { bgcolor: accentLight } } } } }}>
                                        {FIELD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField size="small" label="Field key" value={question.field_key || ""}
                                    onChange={(e) => handleQuestionChange(realIndex, "field_key", e.target.value)}
                                    sx={{ flex: 1.2, ...inputSx }} />
                                <FormControl size="small" sx={{ flex: 1, ...inputSx }}>
                                    <InputLabel>Step</InputLabel>
                                    <Select label="Step" value={question.category || ""}
                                        onChange={(e) => handleQuestionChange(realIndex, "category", e.target.value)}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: "#111827", border: `1px solid ${border1}`, "& .MuiMenuItem-root": { color: body, fontSize: "0.8rem", "&:hover": { bgcolor: accentLight } } } } }}>
                                        <MenuItem value=""><em style={{ color: muted }}>Unassigned</em></MenuItem>
                                        {steps.filter((s) => s.type !== "package_select").map((s) => (
                                            <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                            {/* Options */}
                            {hasOptions && (
                                <TextField size="small" label="Options (comma separated)"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    value={(question.options as any)?.values?.join(", ") || ""}
                                    onChange={(e) => handleQuestionChange(realIndex, "options", {
                                        values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
                                    })}
                                    fullWidth sx={{ ...inputSx, mb: 1.5 }} />
                            )}
                            {/* Condition + required + delete */}
                            <Stack direction="row" spacing={1} alignItems="center">
                                <FormControl size="small" sx={{ flex: 1.2, ...inputSx }}>
                                    <InputLabel>Show if field</InputLabel>
                                    <Select label="Show if field" value={cond.field_key || ""}
                                        onChange={(e) => handleConditionChange(realIndex, "field_key", e.target.value)}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: "#111827", border: `1px solid ${border1}`, "& .MuiMenuItem-root": { color: body, fontSize: "0.8rem", "&:hover": { bgcolor: accentLight } } } } }}>
                                        <MenuItem value=""><em style={{ color: muted }}>No condition</em></MenuItem>
                                        {questions.filter((q) => q.field_key && q.field_key !== question.field_key).map((q) => (
                                            <MenuItem key={q.field_key} value={q.field_key}>{q.field_key}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {cond.field_key && <>
                                    <FormControl size="small" sx={{ flex: 1, ...inputSx }}>
                                        <InputLabel>Operator</InputLabel>
                                        <Select label="Operator" value={cond.operator || "equals"}
                                            onChange={(e) => handleConditionChange(realIndex, "operator", e.target.value)}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: "#111827", "& .MuiMenuItem-root": { color: body, fontSize: "0.8rem" } } } }}>
                                            {CONDITION_OPERATORS.map((op) => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <TextField size="small" label="Value" value={cond.value || ""}
                                        onChange={(e) => handleConditionChange(realIndex, "value", e.target.value)}
                                        sx={{ flex: 1, ...inputSx }} />
                                </>}
                                <FormControlLabel
                                    control={<Switch checked={Boolean(question.required)} size="small"
                                        onChange={(e) => handleQuestionChange(realIndex, "required", e.target.checked)}
                                        sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: accent }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: accent } }} />}
                                    label={<Typography sx={{ color: muted, fontSize: "0.72rem" }}>Required</Typography>}
                                    sx={{ ml: "auto", mr: 0 }} />
                                <IconButton size="small" onClick={() => handleRemoveQuestion(realIndex)}
                                    sx={{ color: muted, p: 0.5, "&:hover": { color: "#ef4444" } }}>
                                    <Delete sx={{ fontSize: "0.9rem" }} />
                                </IconButton>
                            </Stack>
                        </Box>
                    </Box>
                </Box>
            </SortableQuestionCard>
        );
    };

    // ════════════════════════════════════════════════════════════════════════
    return (
        <Box sx={{ pb: 4 }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <Box sx={{ pt: 3, pb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography sx={{ color: heading, fontWeight: 700, fontSize: "1.25rem" }}>Sales Questionnaire</Typography>
                    <Box component="div" sx={{ color: muted, fontSize: "0.8rem", mt: 0.25, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <span>{template?.name || "No template loaded"}</span>
                        <Chip label={template?.status || "draft"} size="small" sx={{
                            height: 18, fontSize: "0.62rem", ml: 0.5,
                            bgcolor: template?.status === "live" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                            color: template?.status === "live" ? "#4ade80" : muted, border: "none",
                        }} />
                    </Box>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button size="small" startIcon={<Visibility sx={{ fontSize: "0.85rem !important" }} />}
                        onClick={() => { setPreviewResponses({}); setPreviewOpen(true); }}
                        sx={{ color: body, fontSize: "0.75rem", textTransform: "none", border: `1px solid ${border1}`, borderRadius: "8px", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", borderColor: accentBorder } }}>
                        Preview Wizard
                    </Button>
                    <Button size="small" startIcon={<OpenInNew sx={{ fontSize: "0.85rem !important" }} />}
                        onClick={() => window.open("/sales/needs-assessment", "_blank")}
                        sx={{ color: body, fontSize: "0.75rem", textTransform: "none", border: `1px solid ${border1}`, borderRadius: "8px", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", borderColor: accentBorder } }}>
                        Live Form
                    </Button>
                    <Button size="small" startIcon={<Publish sx={{ fontSize: "0.85rem !important" }} />}
                        onClick={() => { setTemplate((t) => t ? { ...t, status: "live", is_active: true } : t); setIsDirty(true); }}
                        sx={{ bgcolor: accent, color: "#fff", fontSize: "0.75rem", textTransform: "none", borderRadius: "8px", "&:hover": { bgcolor: "#2563eb" } }}>
                        Publish
                    </Button>
                    <Button size="small" startIcon={<Save sx={{ fontSize: "0.85rem !important" }} />}
                        disabled={!isDirty || saving} onClick={handleSave}
                        sx={{ color: isDirty ? "#4ade80" : muted, fontSize: "0.75rem", textTransform: "none", border: `1px solid ${isDirty ? "rgba(74,222,128,0.3)" : border1}`, borderRadius: "8px", "&:hover": { bgcolor: "rgba(74,222,128,0.06)" } }}>
                        {saving ? "Saving…" : isDirty ? "Save *" : lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Saved"}
                    </Button>
                </Stack>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: "#ef4444" } }}>
                    {error}
                </Alert>
            )}

            {/* ── Top tabs ───────────────────────────────────────────────── */}
            <Box sx={{ display: "flex", gap: 0.5, mb: 3, p: 0.5, borderRadius: "10px", bgcolor: bg1, border: `1px solid ${border0}`, width: "fit-content" }}>
                <TabBtn id="builder" label="Questions" />
                <TabBtn id="steps" label="Steps" />
                <TabBtn id="submissions" label={`Submissions (${submissions.length})`} />
                <TabBtn id="templates" label="Templates" />
            </Box>

            {/* ══════════════════════════════════════ BUILDER TAB ══════════ */}
            {activeTab === "builder" && template && (
                <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexDirection: { xs: "column", lg: "row" } }}>
                    {/* Left: step filter + questions */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Step filter tabs */}
                        <Box sx={{ display: "flex", gap: 0.25, mb: 2.5, overflowX: "auto", pb: 0.5 }}>
                            <StepTab stepKey="__all__" label="All" count={questions.length} />
                            {steps.map((s) => (
                                <StepTab key={s.key} stepKey={s.key} label={s.label}
                                    count={stepQuestionCount(s.key)} isPackage={s.type === "package_select"} />
                            ))}
                        </Box>

                        {/* Active step info bar */}
                        {activeStepKey !== "__all__" && (() => {
                            const s = steps.find((x) => x.key === activeStepKey);
                            if (!s) return null;
                            return (
                                <Box sx={{ ...cardSx, p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ color: heading, fontWeight: 600, fontSize: "0.9rem" }}>{s.label}</Typography>
                                        {s.description && <Typography sx={{ color: muted, fontSize: "0.75rem", mt: 0.25 }}>{s.description}</Typography>}
                                        {s.type === "package_select" && (
                                            <Chip label="Package selection — no questions" size="small" sx={{ mt: 0.75, bgcolor: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "none", fontSize: "0.65rem" }} />
                                        )}
                                    </Box>
                                    <Tooltip title="Edit step settings">
                                        <Button size="small" startIcon={<Settings sx={{ fontSize: "0.8rem !important" }} />}
                                            onClick={() => setActiveTab("steps")}
                                            sx={{ color: muted, fontSize: "0.72rem", textTransform: "none", border: `1px solid ${border1}`, borderRadius: "7px", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
                                            Edit step
                                        </Button>
                                    </Tooltip>
                                </Box>
                            );
                        })()}

                        {/* Empty state */}
                        {stepQuestions.length === 0 && activeStepKey !== "__all__" && steps.find((s) => s.key === activeStepKey)?.type !== "package_select" && (
                            <Box sx={{ ...cardSx, p: 4, textAlign: "center", mb: 2 }}>
                                <Typography sx={{ color: muted, fontSize: "0.8rem", mb: 1.5 }}>No questions in this step yet</Typography>
                                <Button size="small" startIcon={<Add />} onClick={handleAddQuestion}
                                    sx={{ color: accent, fontSize: "0.75rem", textTransform: "none", border: `1px solid ${accentBorder}`, borderRadius: "8px" }}>
                                    Add first question
                                </Button>
                            </Box>
                        )}

                        {/* DnD question list */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={stepQuestions.map((q) => q.order_index)} strategy={verticalListSortingStrategy}>
                                {stepQuestions.map((q, i) => renderQuestionCard(q, i))}
                            </SortableContext>
                        </DndContext>

                        <Button startIcon={<Add />} onClick={handleAddQuestion}
                            sx={{ mt: 1, color: accent, fontSize: "0.78rem", textTransform: "none", border: `1px dashed ${accentBorder}`, borderRadius: "8px", px: 2, py: 0.75, width: "100%", "&:hover": { bgcolor: accentLight } }}>
                            Add question{activeStepKey !== "__all__" ? ` to ${steps.find((s) => s.key === activeStepKey)?.label || "step"}` : ""}
                        </Button>
                    </Box>

                    {/* Right sidebar */}
                    <Box sx={{ width: { xs: "100%", lg: 280 }, flexShrink: 0, position: { lg: "sticky" }, top: 16 }}>
                        <Box sx={{ ...cardSx, p: 2.5 }}>
                            <Typography sx={{ color: heading, fontWeight: 600, fontSize: "0.85rem", mb: 2 }}>Template Settings</Typography>
                            <Stack spacing={1.5}>
                                <TextField size="small" label="Name" value={template.name}
                                    onChange={(e) => { setTemplate({ ...template, name: e.target.value }); setIsDirty(true); }}
                                    fullWidth sx={inputSx} />
                                <TextField size="small" label="Description" value={template.description || ""} multiline rows={2}
                                    onChange={(e) => { setTemplate({ ...template, description: e.target.value }); setIsDirty(true); }}
                                    fullWidth sx={inputSx} />
                                <FormControl size="small" fullWidth sx={inputSx}>
                                    <InputLabel>Status</InputLabel>
                                    <Select label="Status" value={template.status || "draft"}
                                        onChange={(e) => { setTemplate({ ...template, status: e.target.value }); setIsDirty(true); }}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: "#111827", "& .MuiMenuItem-root": { color: body, fontSize: "0.8rem" } } } }}>
                                        <MenuItem value="draft">Draft</MenuItem>
                                        <MenuItem value="live">Live</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControlLabel
                                    control={<Switch checked={template.is_active} size="small"
                                        onChange={(e) => { setTemplate({ ...template, is_active: e.target.checked }); setIsDirty(true); }}
                                        sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: accent }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: accent } }} />}
                                    label={<Typography sx={{ color: muted, fontSize: "0.78rem" }}>Active template</Typography>}
                                />
                            </Stack>
                            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${border0}` }}>
                                <Typography sx={{ color: muted, fontSize: "0.65rem" }}>
                                    {questions.length} questions · {steps.length} steps
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══════════════════════════════════════ STEPS TAB ════════════ */}
            {activeTab === "steps" && (
                <Box sx={{ maxWidth: 720 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Box>
                            <Typography sx={{ color: heading, fontWeight: 600 }}>Wizard Steps</Typography>
                            <Typography sx={{ color: muted, fontSize: "0.75rem", mt: 0.25 }}>
                                Define the steps shown in the public wizard. Questions are assigned to steps via the Step field.
                            </Typography>
                        </Box>
                        <Button size="small" startIcon={<Add />} onClick={handleAddStep}
                            sx={{ color: accent, fontSize: "0.75rem", textTransform: "none", border: `1px solid ${accentBorder}`, borderRadius: "8px" }}>
                            Add Step
                        </Button>
                    </Box>
                    <Stack spacing={1.5}>
                        {steps.map((step, idx) => (
                            <Box key={step.key} sx={{ ...cardSx, p: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: accentLight, border: `1px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Typography sx={{ color: "#93c5fd", fontSize: "0.6rem", fontWeight: 700 }}>{idx + 1}</Typography>
                                    </Box>
                                    <Typography sx={{ color: heading, fontSize: "0.82rem", fontWeight: 600, flex: 1 }}>{step.label}</Typography>
                                    <Chip label={`${stepQuestionCount(step.key)} Q`} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: "rgba(255,255,255,0.06)", color: muted, border: "none" }} />
                                    <IconButton size="small" onClick={() => handleRemoveStep(step.key)}
                                        sx={{ color: muted, p: 0.25, "&:hover": { color: "#ef4444" } }}>
                                        <Delete sx={{ fontSize: "0.85rem" }} />
                                    </IconButton>
                                </Box>
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1}>
                                        <TextField size="small" label="Label" value={step.label}
                                            onChange={(e) => handleStepChange(idx, "label", e.target.value)}
                                            sx={{ flex: 1, ...inputSx }} />
                                        <TextField size="small" label="Key (unique)" value={step.key}
                                            onChange={(e) => handleStepChange(idx, "key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                                            sx={{ flex: 1, ...inputSx }} />
                                    </Stack>
                                    <TextField size="small" label="Description" value={step.description || ""}
                                        onChange={(e) => handleStepChange(idx, "description", e.target.value)}
                                        fullWidth sx={inputSx} />
                                    <FormControl size="small" sx={{ ...inputSx, maxWidth: 200 }}>
                                        <InputLabel>Step type</InputLabel>
                                        <Select label="Step type" value={step.type || "questions"}
                                            onChange={(e) => handleStepChange(idx, "type", e.target.value)}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: "#111827", "& .MuiMenuItem-root": { color: body, fontSize: "0.8rem" } } } }}>
                                            <MenuItem value="questions">Questions</MenuItem>
                                            <MenuItem value="package_select">Package selection</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* ══════════════════════════════════════ SUBMISSIONS TAB ══════ */}
            {activeTab === "submissions" && (
                <Box sx={{ maxWidth: 900 }}>
                    <Typography sx={{ color: heading, fontWeight: 600, mb: 2 }}>Recent Submissions</Typography>
                    {submissions.length === 0 ? (
                        <Box sx={{ ...cardSx, p: 4, textAlign: "center" }}>
                            <Typography sx={{ color: muted, fontSize: "0.8rem" }}>No submissions yet</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1}>
                            {submissions.map((s) => (
                                <Box key={s.id} sx={{ ...cardSx, p: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ color: heading, fontSize: "0.82rem", fontWeight: 600 }}>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {[((s.responses as any)?.contact_first_name || ""), ((s.responses as any)?.contact_last_name || "")].filter(Boolean).join(" ") || `Submission #${s.id}`}
                                        </Typography>
                                        <Typography sx={{ color: muted, fontSize: "0.72rem", mt: 0.25 }}>
                                            {new Date(s.submitted_at).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Chip label={s.status} size="small" sx={{ height: 20, fontSize: "0.62rem", bgcolor: s.status === "converted" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)", color: s.status === "converted" ? "#4ade80" : muted, border: "none" }} />
                                    {s.inquiry_id ? (
                                        <Tooltip title="View inquiry">
                                            <IconButton size="small" onClick={() => window.open(`/sales/inquiries/${s.inquiry_id}`, "_blank")}
                                                sx={{ color: muted, "&:hover": { color: body } }}>
                                                <OpenInNew sx={{ fontSize: "0.85rem" }} />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Button size="small" onClick={() => handleConvertSubmission(s.id)}
                                            sx={{ color: accent, fontSize: "0.7rem", textTransform: "none", border: `1px solid ${accentBorder}`, borderRadius: "7px", "&:hover": { bgcolor: accentLight } }}>
                                            Create Inquiry
                                        </Button>
                                    )}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* ══════════════════════════════════════ TEMPLATES TAB ════════ */}
            {activeTab === "templates" && (
                <Box sx={{ maxWidth: 720 }}>
                    <Typography sx={{ color: heading, fontWeight: 600, mb: 2 }}>Template Library</Typography>
                    <Stack spacing={1}>
                        {templates.map((t) => (
                            <Box key={t.id} onClick={() => handleSelectTemplate(t.id)} sx={{
                                ...cardSx, p: 2, cursor: "pointer", transition: "all 0.15s",
                                borderColor: template?.id === t.id ? accentBorder : border0,
                                bgcolor: template?.id === t.id ? accentLight : bg1,
                                "&:hover": { borderColor: accentBorder, bgcolor: "rgba(255,255,255,0.04)" },
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    {template?.id === t.id && <CheckCircle sx={{ color: accent, fontSize: "1rem" }} />}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ color: heading, fontSize: "0.85rem", fontWeight: 600 }}>{t.name}</Typography>
                                        {t.description && <Typography sx={{ color: muted, fontSize: "0.72rem" }}>{t.description}</Typography>}
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        <Chip label={t.status || "draft"} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: t.status === "live" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)", color: t.status === "live" ? "#4ade80" : muted, border: "none" }} />
                                        <Chip label={`v${t.version}`} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: "rgba(255,255,255,0.06)", color: muted, border: "none" }} />
                                    </Stack>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* ══════════════════════════════════════ PREVIEW DIALOG ═══════ */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: "#0a0f14", border: `1px solid ${border1}`, borderRadius: "16px" } }}>
                <DialogTitle sx={{ color: heading, fontWeight: 700, fontSize: "1rem", borderBottom: `1px solid ${border0}`, pb: 1.5 }}>
                    Wizard Preview
                    <Typography sx={{ color: muted, fontSize: "0.72rem", fontWeight: 400, mt: 0.25 }}>
                        Interactive step-by-step walkthrough
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <WizardPreview
                        steps={steps} questions={questions}
                        responses={previewResponses} onChange={setPreviewResponses}
                        shouldShowQuestion={shouldShowQuestion}
                    />
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${border0}`, px: 3, py: 1.5 }}>
                    <Button onClick={() => setPreviewOpen(false)} sx={{ color: muted, fontSize: "0.78rem", textTransform: "none" }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ── WizardPreview ──────────────────────────────────────────────────────────
function WizardPreview({
    steps, questions, responses, onChange, shouldShowQuestion,
}: {
    steps: WizardStep[];
    questions: NeedsAssessmentQuestion[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responses: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (r: Record<string, any>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shouldShowQuestion: (q: NeedsAssessmentQuestion, r: Record<string, any>) => boolean;
}) {
    const [stepIdx, setStepIdx] = useState(0);
    const activeStep = steps[stepIdx];

    const stepQs = useMemo(() => {
        if (!activeStep || activeStep.type === "package_select") return [];
        return questions
            .filter((q) => (q.category || "") === activeStep.key && shouldShowQuestion(q, responses))
            .sort((a, b) => a.order_index - b.order_index);
    }, [activeStep, questions, responses, shouldShowQuestion]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (key: string, value: any) => onChange({ ...responses, [key]: value });

    return (
        <Box>
            {/* Step pills */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 3 }}>
                {steps.map((s, i) => (
                    <Box key={s.key} onClick={() => setStepIdx(i)} sx={{
                        px: 1.25, py: 0.4, borderRadius: "20px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                        bgcolor: i === stepIdx ? accentLight : "rgba(255,255,255,0.04)",
                        border: `1px solid ${i === stepIdx ? accentBorder : "transparent"}`,
                        color: i === stepIdx ? "#93c5fd" : muted,
                        transition: "all 0.15s",
                    }}>
                        {i + 1}. {s.label}
                    </Box>
                ))}
            </Box>

            {/* Step header */}
            {activeStep && (
                <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ color: heading, fontWeight: 700, fontSize: "1.1rem" }}>{activeStep.label}</Typography>
                    {activeStep.description && <Typography sx={{ color: muted, fontSize: "0.8rem", mt: 0.25 }}>{activeStep.description}</Typography>}
                </Box>
            )}

            {/* Package step placeholder */}
            {activeStep?.type === "package_select" && (
                <Box sx={{ ...cardSx, p: 3, textAlign: "center" }}>
                    <Typography sx={{ color: muted, fontSize: "0.8rem" }}>Package selection cards will appear here</Typography>
                </Box>
            )}

            {/* Questions */}
            <Stack spacing={1.5}>
                {stepQs.map((q) => {
                    const key = q.field_key || `q_${q.order_index}`;
                    const value = responses[key] ?? "";
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const opts = (q.options as any)?.values || [];

                    if (q.field_type === "multiselect") {
                        return (
                            <Box key={key}>
                                <Typography sx={{ color: body, fontSize: "0.78rem", fontWeight: 500, mb: 0.75 }}>
                                    {q.prompt}{q.required && <span style={{ color: "#ef4444" }}> *</span>}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                    {opts.map((opt: string) => {
                                        const sel = Array.isArray(value) && value.includes(opt);
                                        return (
                                            <Box key={opt} onClick={() => {
                                                const arr: string[] = Array.isArray(value) ? [...value] : [];
                                                handleChange(key, sel ? arr.filter((v) => v !== opt) : [...arr, opt]);
                                            }} sx={{
                                                px: 1.5, py: 0.5, borderRadius: "20px", cursor: "pointer", fontSize: "0.75rem",
                                                bgcolor: sel ? accentLight : "rgba(255,255,255,0.04)",
                                                border: `1px solid ${sel ? accentBorder : border1}`,
                                                color: sel ? "#93c5fd" : body, transition: "all 0.15s",
                                            }}>{opt}</Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        );
                    }

                    if (q.field_type === "select") {
                        return (
                            <FormControl key={key} size="small" fullWidth sx={inputSx}>
                                <InputLabel>{q.prompt}{q.required && " *"}</InputLabel>
                                <Select label={`${q.prompt}${q.required ? " *" : ""}`} value={value}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: "#111827", "& .MuiMenuItem-root": { color: body, fontSize: "0.8rem", "&:hover": { bgcolor: accentLight } } } } }}>
                                    {opts.map((opt: string) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                </Select>
                            </FormControl>
                        );
                    }

                    return (
                        <TextField key={key} size="small" label={`${q.prompt}${q.required ? " *" : ""}`}
                            value={value} type={q.field_type === "date" ? "date" : "text"}
                            multiline={q.field_type === "textarea"} rows={q.field_type === "textarea" ? 3 : undefined}
                            InputLabelProps={q.field_type === "date" ? { shrink: true } : undefined}
                            onChange={(e) => handleChange(key, e.target.value)}
                            fullWidth sx={inputSx} />
                    );
                })}
            </Stack>

            {stepQs.length === 0 && activeStep?.type !== "package_select" && (
                <Typography sx={{ color: muted, fontSize: "0.75rem", fontStyle: "italic" }}>No questions assigned to this step</Typography>
            )}

            {/* Nav */}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, pt: 2, borderTop: `1px solid ${border0}` }}>
                <Button disabled={stepIdx === 0} onClick={() => setStepIdx((i) => i - 1)}
                    sx={{ color: muted, fontSize: "0.75rem", textTransform: "none", border: `1px solid ${border1}`, borderRadius: "8px", "&:disabled": { opacity: 0.3 } }}>
                    Back
                </Button>
                {stepIdx < steps.length - 1 ? (
                    <Button onClick={() => setStepIdx((i) => i + 1)}
                        sx={{ bgcolor: accent, color: "#fff", fontSize: "0.75rem", textTransform: "none", borderRadius: "8px", "&:hover": { bgcolor: "#2563eb" } }}>
                        Next
                    </Button>
                ) : (
                    <Button sx={{ bgcolor: "#22c55e", color: "#fff", fontSize: "0.75rem", textTransform: "none", borderRadius: "8px" }}>
                        Submit
                    </Button>
                )}
            </Stack>
        </Box>
    );
}

export default FormsSettings;
