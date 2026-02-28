"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Stack,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Divider,
    Alert,
} from "@mui/material";
import { Add, Delete, Save, OpenInNew, DragIndicator, Visibility, Publish } from "@mui/icons-material";
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
} from "@/lib/types";

const FIELD_TYPES = [
    "text",
    "textarea",
    "email",
    "phone",
    "date",
    "select",
    "multiselect",
];

const CONDITION_OPERATORS = ["equals", "not_equals", "contains"] as const;

function SortableQuestionCard({
    id,
    children,
}: {
    id: number;
    children: React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
    } as React.CSSProperties;

    return (
        <Box ref={setNodeRef} style={style}>
            <Box {...attributes} {...listeners} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <DragIndicator fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                    Drag to reorder
                </Typography>
            </Box>
            {children}
        </Box>
    );
}

export default function ManagerSalesPage() {
    const [template, setTemplate] = useState<NeedsAssessmentTemplate | null>(null);
    const [questions, setQuestions] = useState<NeedsAssessmentQuestion[]>([]);
    const [templates, setTemplates] = useState<NeedsAssessmentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<NeedsAssessmentSubmission[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [autosaveEnabled, setAutosaveEnabled] = useState(true);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [templateSearch, setTemplateSearch] = useState("");
    const [templateStatusFilter, setTemplateStatusFilter] = useState("all");
    const [previewResponses, setPreviewResponses] = useState<Record<string, any>>({});

    const hasTemplate = Boolean(template?.id);

    const loadData = async () => {
        try {
            setLoading(true);
            const activeTemplate = await api.needsAssessmentTemplates.getActive();
            setTemplate(activeTemplate);
            setQuestions(activeTemplate.questions || []);
            setIsDirty(false);

            const templateList = await api.needsAssessmentTemplates.getAll();
            setTemplates(templateList || []);

            const submissionData = await api.needsAssessmentSubmissions.getAll();
            setSubmissions(submissionData || []);
        } catch (err) {
            setError("Failed to load sales questionnaire.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (previewOpen) {
            setPreviewResponses({});
        }
    }, [previewOpen, template?.id]);

    const nextOrderIndex = useMemo(() => {
        if (questions.length === 0) return 1;
        return Math.max(...questions.map((q) => q.order_index)) + 1;
    }, [questions]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event: { active: { id: number }; over: { id: number } | null }) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = questions.findIndex((q) => q.order_index === active.id);
        const newIndex = questions.findIndex((q) => q.order_index === over.id);
        const reordered = arrayMove(questions, oldIndex, newIndex).map((q, idx) => ({
            ...q,
            order_index: idx + 1,
        }));
        setQuestions(reordered);
    };

    const handlePreviewChange = (fieldKey: string, value: any) => {
        setPreviewResponses((prev) => ({ ...prev, [fieldKey]: value }));
    };

    const handleQuestionChange = (index: number, field: keyof NeedsAssessmentQuestion, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
        setIsDirty(true);
    };

    const handleConditionChange = (index: number, field: string, value: any) => {
        const updated = [...questions];
        const existing = (updated[index].condition_json as Record<string, unknown>) || {};
        updated[index] = {
            ...updated[index],
            condition_json: {
                ...existing,
                [field]: value,
            },
        };
        setQuestions(updated);
        setIsDirty(true);
    };

    const handleSelectTemplate = async (templateId: number) => {
        try {
            const selected = await api.needsAssessmentTemplates.getById(templateId);
            setTemplate(selected);
            setQuestions(selected.questions || []);
            setIsDirty(false);
        } catch (err) {
            setError("Failed to load selected template.");
        }
    };

    const handleAddTemplate = async () => {
        try {
            setSaving(true);
            const payload = {
                name: "New Sales Template",
                description: "Customize this questionnaire for your sales workflow.",
                is_active: false,
                questions: [
                    {
                        order_index: 1,
                        prompt: "Contact first name",
                        field_type: "text",
                        field_key: "contact_first_name",
                        required: true,
                        category: "Contact",
                    },
                ],
            };

            const created = await api.needsAssessmentTemplates.create(payload);
            setTemplate(created);
            setQuestions(created.questions || []);
            setIsDirty(false);
            const templateList = await api.needsAssessmentTemplates.getAll();
            setTemplates(templateList || []);
        } catch (err) {
            setError("Failed to create template.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                order_index: nextOrderIndex,
                prompt: "New question",
                field_type: "text",
                required: false,
                field_key: "",
                category: "",
                options: { values: [] },
            },
        ]);
        setIsDirty(true);
    };

    const handleRemoveQuestion = (index: number) => {
        const updated = [...questions];
        updated.splice(index, 1);
        setQuestions(updated.map((q, idx) => ({ ...q, order_index: idx + 1 })));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!template) return;
        try {
            setSaving(true);
            const payload = {
                name: template.name,
                description: template.description,
                is_active: template.is_active,
                status: template.status || "draft",
                version: template.version || "1.0",
                questions: questions.map((q, idx) => ({
                    ...q,
                    order_index: idx + 1,
                    options: q.options || undefined,
                })),
            };

            const updated = await api.needsAssessmentTemplates.update(template.id, payload);
            setTemplate(updated);
            setQuestions(updated.questions || []);
            setLastSavedAt(new Date());
            setIsDirty(false);
        } catch (err) {
            setError("Failed to save questionnaire changes.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!autosaveEnabled || !template || !isDirty) return;
        const timer = setTimeout(() => {
            if (!saving) {
                handleSave();
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [template, questions, autosaveEnabled, isDirty, saving]);

    const handleConvertSubmission = async (submissionId: number) => {
        try {
            await api.needsAssessmentSubmissions.convert(submissionId);
            await loadData();
        } catch (err) {
            setError("Failed to convert submission.");
        }
    };

    const shouldShowQuestion = (question: NeedsAssessmentQuestion, previewResponses: Record<string, any>) => {
        const condition = (question.condition_json as Record<string, any>) || {};
        if (!condition.field_key) return true;
        const currentValue = previewResponses[condition.field_key];
        const expected = condition.value;
        switch (condition.operator) {
            case "not_equals":
                return currentValue !== expected;
            case "contains":
                return Array.isArray(currentValue)
                    ? currentValue.includes(expected)
                    : String(currentValue || "").includes(String(expected || ""));
            case "equals":
            default:
                return currentValue === expected;
        }
    };

    if (loading) {
        return (
            <Box>
                <Typography variant="h5">Loading sales questionnaire...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 3 }, pb: 6 }}>
            <Box sx={{ mb: 4 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Sales Questionnaire
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Configure the needs assessment questionnaire used to capture booking details
                            and convert submissions into inquiries.
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={() => window.open("/sales/needs-assessment", "_blank")}
                    >
                        Open Questionnaire Form
                    </Button>
                </Stack>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={12} lg={8}>
                    {template && (
                        <Card
                            sx={{
                                mb: 4,
                                background: "rgba(16, 18, 22, 0.85)",
                                borderRadius: 3,
                                border: "1px solid rgba(52, 58, 68, 0.4)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                            }}
                        >
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
                                        <Typography variant="h6">Template Builder</Typography>
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                            <Button
                                                size="small"
                                                startIcon={<Visibility />}
                                                variant="outlined"
                                                onClick={() => setPreviewOpen(true)}
                                            >
                                                Preview
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<Publish />}
                                                variant="contained"
                                                onClick={() => {
                                                    setTemplate({
                                                        ...template,
                                                        status: "live",
                                                        is_active: true,
                                                    });
                                                    setIsDirty(true);
                                                }}
                                            >
                                                Publish
                                            </Button>
                                        </Stack>
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                        <FormControl fullWidth>
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                label="Status"
                                                value={template.status || "draft"}
                                                onChange={(e) => {
                                                    setTemplate({ ...template, status: e.target.value });
                                                    setIsDirty(true);
                                                }}
                                            >
                                                <MenuItem value="draft">Draft</MenuItem>
                                                <MenuItem value="live">Live</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            label="Version"
                                            value={template.version || "1.0"}
                                            onChange={(e) => {
                                                setTemplate({ ...template, version: e.target.value });
                                                setIsDirty(true);
                                            }}
                                            fullWidth
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={autosaveEnabled}
                                                    onChange={(e) => setAutosaveEnabled(e.target.checked)}
                                                />
                                            }
                                            label="Autosave"
                                        />
                                    </Stack>
                                    <TextField
                                        label="Template Name"
                                        value={template.name}
                                        onChange={(e) => {
                                            setTemplate({ ...template, name: e.target.value });
                                            setIsDirty(true);
                                        }}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Description"
                                        value={template.description || ""}
                                        onChange={(e) => {
                                            setTemplate({ ...template, description: e.target.value });
                                            setIsDirty(true);
                                        }}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={template.is_active}
                                                onChange={(e) => {
                                                    setTemplate({ ...template, is_active: e.target.checked });
                                                    setIsDirty(true);
                                                }}
                                            />
                                        }
                                        label="Active Template"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {saving ? "Saving..." : lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : "Not saved yet"}
                                    </Typography>
                                </Stack>

                                <Divider sx={{ my: 3 }} />

                                <Stack spacing={2}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography variant="h6">Questions</Typography>
                                        <Button startIcon={<Add />} onClick={handleAddQuestion}>
                                            Add Question
                                        </Button>
                                    </Box>

                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext
                                            items={questions.map((q) => q.order_index)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {questions.map((question, index) => {
                                                const condition = (question.condition_json as Record<string, any>) || {};
                                                return (
                                                    <SortableQuestionCard key={question.order_index} id={question.order_index}>
                                                        <Card
                                                            variant="outlined"
                                                            sx={{
                                                                p: 2,
                                                                background: "rgba(17, 24, 39, 0.7)",
                                                                borderColor: "rgba(75, 85, 99, 0.4)",
                                                            }}
                                                        >
                                                            <Stack spacing={2}>
                                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                    <Typography variant="subtitle1">Question {index + 1}</Typography>
                                                                    <IconButton onClick={() => handleRemoveQuestion(index)}>
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                                <TextField
                                                                    label="Prompt"
                                                                    value={question.prompt}
                                                                    onChange={(e) => handleQuestionChange(index, "prompt", e.target.value)}
                                                                    fullWidth
                                                                />
                                                                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                                                    <FormControl fullWidth>
                                                                        <InputLabel>Field Type</InputLabel>
                                                                        <Select
                                                                            label="Field Type"
                                                                            value={question.field_type}
                                                                            onChange={(e) => handleQuestionChange(index, "field_type", e.target.value)}
                                                                        >
                                                                            {FIELD_TYPES.map((type) => (
                                                                                <MenuItem key={type} value={type}>
                                                                                    {type}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                    <TextField
                                                                        label="Field Key"
                                                                        value={question.field_key || ""}
                                                                        onChange={(e) => handleQuestionChange(index, "field_key", e.target.value)}
                                                                        fullWidth
                                                                    />
                                                                    <TextField
                                                                        label="Category"
                                                                        value={question.category || ""}
                                                                        onChange={(e) => handleQuestionChange(index, "category", e.target.value)}
                                                                        fullWidth
                                                                    />
                                                                </Stack>
                                                                <TextField
                                                                    label="Options (comma separated)"
                                                                    value={(question.options as any)?.values?.join(", ") || ""}
                                                                    onChange={(e) =>
                                                                        handleQuestionChange(index, "options", {
                                                                            values: e.target.value
                                                                                .split(",")
                                                                                .map((value) => value.trim())
                                                                                .filter(Boolean),
                                                                        })
                                                                    }
                                                                    fullWidth
                                                                    disabled={!['select', 'multiselect'].includes(question.field_type)}
                                                                />
                                                                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                                                    <FormControl fullWidth>
                                                                        <InputLabel>Show if field</InputLabel>
                                                                        <Select
                                                                            label="Show if field"
                                                                            value={condition.field_key || ""}
                                                                            onChange={(e) => handleConditionChange(index, "field_key", e.target.value)}
                                                                        >
                                                                            <MenuItem value="">None</MenuItem>
                                                                            {questions
                                                                                .filter((q) => q.field_key && q.field_key !== question.field_key)
                                                                                .map((q) => (
                                                                                    <MenuItem key={q.field_key} value={q.field_key}>
                                                                                        {q.field_key}
                                                                                    </MenuItem>
                                                                                ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                    <FormControl fullWidth>
                                                                        <InputLabel>Operator</InputLabel>
                                                                        <Select
                                                                            label="Operator"
                                                                            value={condition.operator || "equals"}
                                                                            onChange={(e) => handleConditionChange(index, "operator", e.target.value)}
                                                                        >
                                                                            {CONDITION_OPERATORS.map((op) => (
                                                                                <MenuItem key={op} value={op}>
                                                                                    {op}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                    <TextField
                                                                        label="Value"
                                                                        value={condition.value || ""}
                                                                        onChange={(e) => handleConditionChange(index, "value", e.target.value)}
                                                                        fullWidth
                                                                        disabled={!condition.field_key}
                                                                    />
                                                                </Stack>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Switch
                                                                            checked={Boolean(question.required)}
                                                                            onChange={(e) => handleQuestionChange(index, "required", e.target.checked)}
                                                                        />
                                                                    }
                                                                    label="Required"
                                                                />
                                                            </Stack>
                                                        </Card>
                                                    </SortableQuestionCard>
                                                );
                                            })}
                                        </SortableContext>
                                    </DndContext>

                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<Save />}
                                            onClick={handleSave}
                                            disabled={!hasTemplate || saving}
                                        >
                                            Save Questionnaire
                                        </Button>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    <Card
                        sx={{
                            background: "rgba(16, 18, 22, 0.85)",
                            borderRadius: 3,
                            border: "1px solid rgba(52, 58, 68, 0.4)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Recent Needs Assessment Submissions
                            </Typography>
                            {submissions.length === 0 ? (
                                <Typography color="text.secondary">No submissions yet.</Typography>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Submitted</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Inquiry</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {submissions.map((submission) => (
                                                <TableRow key={submission.id}>
                                                    <TableCell>
                                                        {new Date(submission.submitted_at).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={submission.status} size="small" />
                                                    </TableCell>
                                                    <TableCell>
                                                        {submission.inquiry_id ? `#${submission.inquiry_id}` : "Not created"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            {submission.inquiry_id && (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => window.open(`/sales/inquiries/${submission.inquiry_id}`, "_blank")}
                                                                >
                                                                    <OpenInNew fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                            {!submission.inquiry_id && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => handleConvertSubmission(submission.id)}
                                                                >
                                                                    Create Inquiry
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Stack spacing={3}>
                        <Card
                            sx={{
                                background: "rgba(16, 18, 22, 0.85)",
                                borderRadius: 3,
                                border: "1px solid rgba(52, 58, 68, 0.4)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6">Template Library</Typography>
                                    <Button size="small" startIcon={<Add />} onClick={handleAddTemplate}>
                                        Add New
                                    </Button>
                                </Box>
                                <Stack spacing={2} sx={{ mb: 2 }}>
                                    <TextField
                                        size="small"
                                        label="Search templates"
                                        value={templateSearch}
                                        onChange={(e) => setTemplateSearch(e.target.value)}
                                        fullWidth
                                    />
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            label="Status"
                                            value={templateStatusFilter}
                                            onChange={(e) => setTemplateStatusFilter(e.target.value)}
                                        >
                                            <MenuItem value="all">All</MenuItem>
                                            <MenuItem value="live">Live</MenuItem>
                                            <MenuItem value="draft">Draft</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                                <Stack spacing={1.5}>
                                    {templates.length === 0 && (
                                        <Typography color="text.secondary">No templates available.</Typography>
                                    )}
                                    {templates
                                        .filter((item) => {
                                            const matchesSearch = item.name.toLowerCase().includes(templateSearch.toLowerCase());
                                            const matchesStatus = templateStatusFilter === "all" || (item.status || "draft") === templateStatusFilter;
                                            return matchesSearch && matchesStatus;
                                        })
                                        .map((item) => (
                                        <Card
                                            key={item.id}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                cursor: "pointer",
                                                borderColor: template?.id === item.id ? "primary.main" : "rgba(75, 85, 99, 0.4)",
                                                background: template?.id === item.id
                                                    ? "rgba(59, 130, 246, 0.1)"
                                                    : "rgba(17, 24, 39, 0.6)",
                                            }}
                                            onClick={() => handleSelectTemplate(item.id)}
                                        >
                                            <Stack spacing={0.5}>
                                                <Typography variant="subtitle1">{item.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.description || "No description"}
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Chip
                                                        label={(item.status || "draft").toUpperCase()}
                                                        size="small"
                                                        color={(item.status || "draft") === "live" ? "success" : "default"}
                                                    />
                                                    <Chip label={`v${item.version || "1.0"}`} size="small" variant="outlined" />
                                                </Stack>
                                                {item.is_active && (
                                                    <Chip label="Active" size="small" color="success" sx={{ alignSelf: "flex-start" }} />
                                                )}
                                            </Stack>
                                        </Card>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card
                            sx={{
                                background: "rgba(16, 18, 22, 0.85)",
                                borderRadius: 3,
                                border: "1px solid rgba(52, 58, 68, 0.4)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Sales Metrics (Coming Soon)
                                </Typography>
                                <Typography color="text.secondary">
                                    Placeholder for conversion rates, average response times, and booking funnel KPIs.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Questionnaire Preview</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {questions
                            .filter((question) => shouldShowQuestion(question, previewResponses))
                            .map((question) => {
                                const key = question.field_key || `question_${question.order_index}`;
                                const value = previewResponses[key] ?? "";

                                if (question.field_type === "textarea") {
                                    return (
                                        <TextField
                                            key={key}
                                            label={question.prompt}
                                            value={value}
                                            onChange={(e) => handlePreviewChange(key, e.target.value)}
                                            multiline
                                            rows={3}
                                            fullWidth
                                        />
                                    );
                                }

                                if (question.field_type === "select" || question.field_type === "multiselect") {
                                    const options = (question.options as any)?.values || [];
                                    return (
                                        <FormControl key={key} fullWidth>
                                            <InputLabel>{question.prompt}</InputLabel>
                                            <Select
                                                label={question.prompt}
                                                multiple={question.field_type === "multiselect"}
                                                value={value || (question.field_type === "multiselect" ? [] : "")}
                                                onChange={(e) => handlePreviewChange(key, e.target.value)}
                                                renderValue={(selected: any) =>
                                                    Array.isArray(selected) ? selected.join(", ") : selected
                                                }
                                            >
                                                {options.map((option: string) => (
                                                    <MenuItem key={option} value={option}>
                                                        {question.field_type === "multiselect" && (
                                                            <Checkbox checked={Array.isArray(value) && value.includes(option)} />
                                                        )}
                                                        <ListItemText primary={option} />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    );
                                }

                                return (
                                    <TextField
                                        key={key}
                                        label={question.prompt}
                                        value={value}
                                        onChange={(e) => handlePreviewChange(key, e.target.value)}
                                        type={question.field_type === "date" ? "date" : "text"}
                                        fullWidth
                                        InputLabelProps={question.field_type === "date" ? { shrink: true } : undefined}
                                    />
                                );
                            })}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
