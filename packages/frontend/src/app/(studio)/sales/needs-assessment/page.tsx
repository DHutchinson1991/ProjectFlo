"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Stack,
    Checkbox,
    ListItemText,
    Switch,
    FormControlLabel,
    Alert,
    Radio,
    RadioGroup,
    CircularProgress,
    Fade,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { api } from "@/lib/api";
import { NeedsAssessmentTemplate, ServicePackage } from "@/lib/types";
import { useBrand } from "@/app/providers/BrandProvider";

export default function NeedsAssessmentPage() {
    const { currentBrand } = useBrand();
    const [template, setTemplate] = useState<NeedsAssessmentTemplate | null>(null);
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [createInquiry, setCreateInquiry] = useState(true);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadContent = async () => {
            try {
                setLoading(true);
                if (!currentBrand?.id) throw new Error("Brand context not loaded");
                const [templateData, packagesData] = await Promise.all([
                    api.needsAssessmentTemplates.getActive(),
                    api.servicePackages.getAll(currentBrand.id),
                ]);
                setTemplate(templateData);
                setPackages(packagesData || []);
            } catch (err) {
                setError("Unable to load the questionnaire. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [currentBrand?.id]);

    const handleChange = (fieldKey: string, value: any) => {
        setResponses((prev) => ({ ...prev, [fieldKey]: value }));
    };

    const shouldShowQuestion = (condition: Record<string, any> | null) => {
        if (!condition?.field_key) return true;
        const currentValue = responses[condition.field_key];
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

    const validate = () => {
        if (!template) return false;
        const errors: Record<string, string> = {};
        template.questions
            .filter((question) => shouldShowQuestion(question.condition_json as Record<string, any>))
            .forEach((question) => {
                const key = question.field_key || `question_${question.id}`;
                const value = responses[key];
                if (question.required && (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0))) {
                    errors[key] = "Required";
                    return;
                }
                if (question.field_type === "email" && value) {
                    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
                    if (!emailValid) {
                        errors[key] = "Enter a valid email";
                    }
                }
            });
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!template) return;
        if (!validate()) return;
        try {
            setError(null);
            setSuccessMessage(null);
            setSubmitting(true);
            const payload = {
                template_id: template.id,
                responses,
                create_inquiry: createInquiry,
                selected_package_id: selectedPackageId,
            };
            await api.needsAssessmentSubmissions.create(payload);
            setSuccessMessage("Questionnaire submitted successfully! We'll be in touch soon.");
            setResponses({});
            setSelectedPackageId(null);
            setTimeout(() => {
                window.location.href = "/studio/sales";
            }, 2000);
        } catch (err) {
            setError("Failed to submit the questionnaire. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const visibleQuestions = useMemo(() =>
        template?.questions.filter((question) =>
            shouldShowQuestion(question.condition_json as Record<string, any>)
        ) || [], [template, responses]);

    const answeredCount = visibleQuestions.filter((q) => {
        const key = q.field_key || `question_${q.id}`;
        const val = responses[key];
        return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
    }).length;

    const progress = visibleQuestions.length > 0
        ? (answeredCount / visibleQuestions.length) * 100
        : 0;

    // ── Shared style tokens ────────────────────────────────────────────
    const accent = "#3b82f6";
    const accentLight = "rgba(59, 130, 246, 0.12)";
    const accentBorder = "rgba(59, 130, 246, 0.35)";
    const cardBg = "rgba(255,255,255,0.03)";
    const cardBorder = "rgba(255,255,255,0.06)";
    const inputBorder = "rgba(255,255,255,0.08)";
    const mutedText = "#64748b";
    const bodyText = "#cbd5e1";
    const headingText = "#f1f5f9";

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            color: bodyText,
            borderRadius: "10px",
            fontSize: "0.925rem",
            bgcolor: "rgba(255,255,255,0.02)",
            "& fieldset": { borderColor: inputBorder },
            "&:hover fieldset": { borderColor: accentBorder },
            "&.Mui-focused fieldset": { borderColor: accent, borderWidth: "1.5px" },
        },
        "& .MuiInputLabel-root": { color: mutedText, fontSize: "0.875rem" },
        "& .MuiInputLabel-root.Mui-focused": { color: accent },
        "& .MuiFormHelperText-root.Mui-error": { color: "#ef4444" },
    };

    // ── Loading ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#0a0f14" }}>
                <Stack alignItems="center" spacing={3}>
                    <Box sx={{ position: "relative", width: 48, height: 48 }}>
                        <CircularProgress size={48} thickness={2} sx={{ color: accent, position: "absolute" }} />
                        <CircularProgress size={48} thickness={2} sx={{ color: "rgba(59,130,246,0.15)", position: "absolute" }} variant="determinate" value={100} />
                    </Box>
                    <Typography sx={{ color: mutedText, fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                        Loading questionnaire…
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (!template) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#0a0f14", p: 3 }}>
                <Box sx={{ maxWidth: 420, textAlign: "center" }}>
                    <Typography sx={{ color: headingText, fontSize: "1.1rem", fontWeight: 600, mb: 1 }}>
                        No questionnaire available
                    </Typography>
                    <Typography sx={{ color: mutedText, fontSize: "0.875rem" }}>
                        There's no active questionnaire at the moment. Please try again later or contact support.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#0a0f14" }}>
            {/* Subtle top gradient line */}
            <Box sx={{ height: 2, background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`, opacity: 0.5 }} />

            <Box sx={{ maxWidth: 1120, mx: "auto", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 5 } }}>

                {/* ── Header ─────────────────────────────────────── */}
                <Fade in timeout={600}>
                    <Box sx={{ mb: 5 }}>
                        <Typography sx={{ color: accent, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1.5 }}>
                            Questionnaire
                        </Typography>
                        <Typography sx={{ color: headingText, fontSize: { xs: "1.6rem", sm: "2rem" }, fontWeight: 700, lineHeight: 1.2, mb: 1 }}>
                            {template.name}
                        </Typography>
                        {template.description && (
                            <Typography sx={{ color: mutedText, fontSize: "0.95rem", maxWidth: 540, lineHeight: 1.6 }}>
                                {template.description}
                            </Typography>
                        )}

                        {/* Progress bar */}
                        <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                                <Box sx={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    borderRadius: 2,
                                    bgcolor: accent,
                                    transition: "width 0.4s ease",
                                }} />
                            </Box>
                            <Typography sx={{ color: mutedText, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 60, textAlign: "right" }}>
                                {answeredCount}/{visibleQuestions.length}
                            </Typography>
                        </Box>
                    </Box>
                </Fade>

                {/* ── Alerts ─────────────────────────────────────── */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3, bgcolor: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: "#ef4444" } }}>
                        {error}
                    </Alert>
                )}
                {successMessage && (
                    <Alert icon={<CheckCircleIcon />} severity="success" sx={{ mb: 3, bgcolor: "rgba(34,197,94,0.08)", color: "#86efac", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: "#22c55e" } }}>
                        {successMessage}
                    </Alert>
                )}

                {/* ── Two-column layout ──────────────────────────── */}
                <Box sx={{ display: "flex", gap: { xs: 3, lg: 4 }, flexDirection: { xs: "column", lg: "row" }, alignItems: "flex-start" }}>

                    {/* ── Questions column ────────────────────────── */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack spacing={2}>
                            {visibleQuestions.map((question, idx) => {
                                const key = question.field_key || `question_${question.id}`;
                                const value = responses[key] ?? "";
                                const errorMessage = fieldErrors[key];
                                const isFilled = value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);

                                return (
                                    <Fade in timeout={400 + idx * 60} key={key}>
                                        <Box
                                            sx={{
                                                p: { xs: 2.5, sm: 3 },
                                                borderRadius: "12px",
                                                bgcolor: isFilled ? accentLight : cardBg,
                                                border: `1px solid ${isFilled ? accentBorder : cardBorder}`,
                                                transition: "all 0.25s ease",
                                                "&:hover": { bgcolor: isFilled ? accentLight : "rgba(255,255,255,0.04)" },
                                            }}
                                        >
                                            {/* Question number */}
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                                                <Box sx={{
                                                    width: 26, height: 26, borderRadius: "8px",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    bgcolor: isFilled ? accent : "rgba(255,255,255,0.06)",
                                                    color: isFilled ? "#fff" : mutedText,
                                                    fontSize: "0.7rem", fontWeight: 700,
                                                    transition: "all 0.25s ease",
                                                }}>
                                                    {isFilled ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : idx + 1}
                                                </Box>
                                                {question.required && (
                                                    <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#ef4444" }} />
                                                )}
                                            </Box>

                                            {/* Field */}
                                            {question.field_type === "textarea" ? (
                                                <TextField
                                                    label={question.prompt}
                                                    value={value}
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                    multiline rows={3}
                                                    required={Boolean(question.required)}
                                                    error={Boolean(errorMessage)}
                                                    helperText={errorMessage}
                                                    fullWidth
                                                    sx={fieldSx}
                                                />
                                            ) : (question.field_type === "select" || question.field_type === "multiselect") ? (
                                                <FormControl fullWidth error={Boolean(errorMessage)}>
                                                    <InputLabel sx={{ color: mutedText, fontSize: "0.875rem", "&.Mui-focused": { color: accent } }}>
                                                        {question.prompt}
                                                    </InputLabel>
                                                    <Select
                                                        label={question.prompt}
                                                        multiple={question.field_type === "multiselect"}
                                                        value={value || (question.field_type === "multiselect" ? [] : "")}
                                                        onChange={(e) => handleChange(key, e.target.value)}
                                                        renderValue={(selected: any) => Array.isArray(selected) ? selected.join(", ") : selected}
                                                        sx={{
                                                            color: bodyText, borderRadius: "10px", fontSize: "0.925rem",
                                                            bgcolor: "rgba(255,255,255,0.02)",
                                                            "& .MuiOutlinedInput-notchedOutline": { borderColor: inputBorder },
                                                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentBorder },
                                                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: accent, borderWidth: "1.5px" },
                                                            "& .MuiSvgIcon-root": { color: mutedText },
                                                        }}
                                                        MenuProps={{
                                                            PaperProps: {
                                                                sx: {
                                                                    bgcolor: "#111827", border: "1px solid rgba(255,255,255,0.08)",
                                                                    borderRadius: "10px", mt: 0.5,
                                                                    "& .MuiMenuItem-root": {
                                                                        color: bodyText, fontSize: "0.875rem",
                                                                        "&:hover": { bgcolor: "rgba(59,130,246,0.08)" },
                                                                        "&.Mui-selected": { bgcolor: accentLight, color: "#93c5fd" },
                                                                    },
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        {((question.options as any)?.values || []).map((option: string) => (
                                                            <MenuItem key={option} value={option}>
                                                                {question.field_type === "multiselect" && (
                                                                    <Checkbox checked={Array.isArray(value) && value.includes(option)} sx={{ color: mutedText, "&.Mui-checked": { color: accent } }} size="small" />
                                                                )}
                                                                <ListItemText primary={option} />
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <TextField
                                                    label={question.prompt}
                                                    value={value}
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                    type={question.field_type === "date" ? "date" : "text"}
                                                    required={Boolean(question.required)}
                                                    error={Boolean(errorMessage)}
                                                    helperText={errorMessage}
                                                    fullWidth
                                                    InputLabelProps={question.field_type === "date" ? { shrink: true } : undefined}
                                                    sx={fieldSx}
                                                />
                                            )}
                                        </Box>
                                    </Fade>
                                );
                            })}
                        </Stack>
                    </Box>

                    {/* ── Sidebar ─────────────────────────────────── */}
                    <Box sx={{ width: { xs: "100%", lg: 320 }, flexShrink: 0, position: { lg: "sticky" }, top: { lg: 24 } }}>
                        <Stack spacing={2.5}>

                            {/* Package selection */}
                            <Box sx={{
                                borderRadius: "14px",
                                bgcolor: cardBg,
                                border: `1px solid ${cardBorder}`,
                                overflow: "hidden",
                            }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${cardBorder}` }}>
                                    <Typography sx={{ color: headingText, fontSize: "0.85rem", fontWeight: 600 }}>
                                        Package
                                    </Typography>
                                    <Typography sx={{ color: mutedText, fontSize: "0.75rem", mt: 0.25 }}>
                                        Select an interest or decide later
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 1.5 }}>
                                    {packages.length > 0 ? (
                                        <RadioGroup
                                            value={selectedPackageId?.toString() || "none"}
                                            onChange={(e) => setSelectedPackageId(e.target.value === "none" ? null : parseInt(e.target.value))}
                                        >
                                            <Stack spacing={0.75}>
                                                {/* Decide later */}
                                                <Box
                                                    onClick={() => setSelectedPackageId(null)}
                                                    sx={{
                                                        display: "flex", alignItems: "center", gap: 1.5,
                                                        px: 1.5, py: 1.25, borderRadius: "10px", cursor: "pointer",
                                                        bgcolor: selectedPackageId === null ? accentLight : "transparent",
                                                        border: `1px solid ${selectedPackageId === null ? accentBorder : "transparent"}`,
                                                        transition: "all 0.2s ease",
                                                        "&:hover": { bgcolor: selectedPackageId === null ? accentLight : "rgba(255,255,255,0.03)" },
                                                    }}
                                                >
                                                    <Radio
                                                        value="none"
                                                        size="small"
                                                        sx={{ p: 0, color: mutedText, "&.Mui-checked": { color: accent } }}
                                                    />
                                                    <Typography sx={{ color: bodyText, fontSize: "0.825rem" }}>
                                                        Decide later
                                                    </Typography>
                                                </Box>

                                                {/* Packages */}
                                                {packages.map((pkg) => {
                                                    const isSelected = selectedPackageId === pkg.id;
                                                    return (
                                                        <Box
                                                            key={pkg.id}
                                                            onClick={() => setSelectedPackageId(pkg.id)}
                                                            sx={{
                                                                display: "flex", alignItems: "flex-start", gap: 1.5,
                                                                px: 1.5, py: 1.25, borderRadius: "10px", cursor: "pointer",
                                                                bgcolor: isSelected ? accentLight : "transparent",
                                                                border: `1px solid ${isSelected ? accentBorder : "transparent"}`,
                                                                transition: "all 0.2s ease",
                                                                "&:hover": { bgcolor: isSelected ? accentLight : "rgba(255,255,255,0.03)" },
                                                            }}
                                                        >
                                                            <Radio
                                                                value={pkg.id?.toString() || ""}
                                                                size="small"
                                                                sx={{ p: 0, mt: 0.25, color: mutedText, "&.Mui-checked": { color: accent } }}
                                                            />
                                                            <Box>
                                                                <Typography sx={{ color: isSelected ? "#93c5fd" : bodyText, fontSize: "0.825rem", fontWeight: isSelected ? 600 : 400 }}>
                                                                    {pkg.name}
                                                                </Typography>
                                                                {pkg.description && (
                                                                    <Typography sx={{ color: mutedText, fontSize: "0.72rem", mt: 0.25, lineHeight: 1.4 }}>
                                                                        {pkg.description}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </RadioGroup>
                                    ) : (
                                        <Typography sx={{ color: mutedText, fontSize: "0.8rem", p: 1 }}>
                                            No packages available
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Create inquiry toggle */}
                            <Box sx={{
                                borderRadius: "14px",
                                bgcolor: cardBg,
                                border: `1px solid ${cardBorder}`,
                                px: 2.5, py: 2,
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <Box>
                                    <Typography sx={{ color: headingText, fontSize: "0.85rem", fontWeight: 600 }}>
                                        Create Inquiry
                                    </Typography>
                                    <Typography sx={{ color: mutedText, fontSize: "0.72rem", mt: 0.25 }}>
                                        Auto-create from submission
                                    </Typography>
                                </Box>
                                <Switch
                                    checked={createInquiry}
                                    onChange={(e) => setCreateInquiry(e.target.checked)}
                                    size="small"
                                    sx={{
                                        "& .MuiSwitch-switchBase.Mui-checked": { color: accent },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: accent },
                                        "& .MuiSwitch-track": { backgroundColor: "rgba(255,255,255,0.1)" },
                                    }}
                                />
                            </Box>

                            {/* Summary quick-stat */}
                            <Box sx={{
                                borderRadius: "14px",
                                bgcolor: cardBg,
                                border: `1px solid ${cardBorder}`,
                                px: 2.5, py: 2, textAlign: "center",
                            }}>
                                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 0.5 }}>
                                    <Typography sx={{ color: headingText, fontSize: "1.8rem", fontWeight: 700, lineHeight: 1 }}>
                                        {Math.round(progress)}
                                    </Typography>
                                    <Typography sx={{ color: mutedText, fontSize: "0.8rem" }}>%</Typography>
                                </Box>
                                <Typography sx={{ color: mutedText, fontSize: "0.72rem", mt: 0.5 }}>
                                    Complete
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Box>

                {/* ── Footer actions ─────────────────────────────── */}
                <Box sx={{
                    display: "flex", gap: 2, mt: 5, pt: 3,
                    borderTop: `1px solid ${cardBorder}`,
                    justifyContent: "flex-end",
                }}>
                    <Button
                        variant="text"
                        onClick={() => window.history.back()}
                        sx={{
                            color: mutedText, fontSize: "0.85rem", fontWeight: 500,
                            px: 2.5, borderRadius: "10px",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: bodyText },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                        endIcon={!submitting && <ArrowForwardIcon sx={{ fontSize: "1rem !important" }} />}
                        sx={{
                            bgcolor: accent,
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            px: 3, py: 1.25,
                            borderRadius: "10px",
                            textTransform: "none",
                            boxShadow: `0 0 20px rgba(59, 130, 246, 0.25)`,
                            "&:hover": { bgcolor: "#2563eb", boxShadow: `0 0 30px rgba(59, 130, 246, 0.35)` },
                            "&:disabled": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)", boxShadow: "none" },
                        }}
                    >
                        {submitting ? <CircularProgress size={18} sx={{ color: "inherit", mr: 1 }} /> : null}
                        {submitting ? "Submitting…" : "Submit"}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
