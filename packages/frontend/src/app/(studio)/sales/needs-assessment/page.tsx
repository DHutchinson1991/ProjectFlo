"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    Box,
    Typography,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Button,
    Stack,
    Switch,
    Alert,
    CircularProgress,
    Fade,
    Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import { api } from "@/lib/api";
import { NeedsAssessmentTemplate, ServicePackage, WizardStep } from "@/lib/types";
import { useBrand } from "@/app/providers/BrandProvider";

// ── Currency helpers ──────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$", GBP: "£", EUR: "€", AUD: "A$", CAD: "C$", NZD: "NZ$",
    JPY: "¥", CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr",
    ZAR: "R", INR: "₹", SGD: "S$", HKD: "HK$", MXN: "MX$",
};
function getCurrencySymbol(currency: string | null | undefined): string {
    if (!currency) return "$";
    return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

// ── Preferred-contact-time options ────────────────────────────────────────────
const CONTACT_TIME_OPTIONS = [
    "Morning (8am–12pm)",
    "Afternoon (12pm–5pm)",
    "Evening (5pm–9pm)",
    "Flexible",
];

// ── Design tokens ─────────────────────────────────────────────────────────────
const bg0 = "#090d12";
const bg1 = "rgba(255,255,255,0.025)";
const border0 = "rgba(255,255,255,0.07)";
const border1 = "rgba(255,255,255,0.12)";
const accent = "#3b82f6";
const accentLight = "rgba(59,130,246,0.10)";
const accentBorder = "rgba(59,130,246,0.35)";
const muted = "#64748b";
const body = "#cbd5e1";
const heading = "#f1f5f9";

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        color: body,
        borderRadius: "10px",
        fontSize: "0.925rem",
        bgcolor: "rgba(255,255,255,0.02)",
        "& fieldset": { borderColor: border0 },
        "&:hover fieldset": { borderColor: accentBorder },
        "&.Mui-focused fieldset": { borderColor: accent, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": { color: muted, fontSize: "0.875rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: accent },
    "& .MuiFormHelperText-root.Mui-error": { color: "#ef4444" },
};

const DEFAULT_STEPS: WizardStep[] = [
    { key: "contact",  label: "You",          description: "Tell us a little about yourself" },
    { key: "event",    label: "Your Wedding",  description: "Event details" },
    { key: "coverage", label: "Coverage",      description: "What you'd like captured" },
    { key: "budget",   label: "Budget",        description: "Investment range" },
    { key: "package",  label: "Package",       description: "Choose your package", type: "package_select" },
    { key: "reach",    label: "Reach You",     description: "How did you find us?" },
    { key: "call",     label: "Discovery Call", description: "How would you like to connect?", type: "discovery_call" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export default function NeedsAssessmentPage() {
    const { currentBrand } = useBrand();
    const searchParams = useSearchParams();
    const linkedInquiryId = searchParams.get("inquiry") ? Number(searchParams.get("inquiry")) : null;

    const [template, setTemplate] = useState<NeedsAssessmentTemplate | null>(null);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
    const [packageSets, setPackageSets] = useState<AnyRecord[]>([]);
    const [steps, setSteps] = useState<WizardStep[]>(DEFAULT_STEPS);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [responses, setResponses] = useState<AnyRecord>({});
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
    const [createInquiry, setCreateInquiry] = useState(true);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<AnyRecord>({});

    useEffect(() => {
        if (!currentBrand?.id) return;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const [templateData, packagesData, setsData] = await Promise.all([
                    api.needsAssessmentTemplates.getActive(),
                    api.servicePackages.getAll(currentBrand.id),
                    api.packageSets.getAll(currentBrand.id),
                ]);
                setTemplate(templateData);
                setAllPackages(packagesData || []);
                setPackageSets(setsData || []);
                if (templateData?.steps_config?.length) {
                    const stepsFromConfig = templateData.steps_config as WizardStep[];
                    const hasCallStep = stepsFromConfig.some((s) => s.key === 'call');
                    setSteps(hasCallStep ? stepsFromConfig : [
                        ...stepsFromConfig,
                        { key: 'call', label: 'Discovery Call', description: 'How would you like to connect?', type: 'discovery_call' },
                    ]);
                }
            } catch {
                setError("Unable to load the questionnaire. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentBrand?.id]);

    // Unique event-type options derived from package set categories
    const eventTypeOptions = useMemo(() => {
        const seen = new Set<string>();
        const options: string[] = [];
        for (const set of packageSets) {
            const name: string | undefined = set.category?.name;
            if (name && !seen.has(name)) { seen.add(name); options.push(name); }
        }
        return options;
    }, [packageSets]);

    const packages = useMemo(() => {
        const activeSets = selectedEventType
            ? packageSets.filter((s: AnyRecord) =>
                (s.category?.name ?? "").toLowerCase() === selectedEventType.toLowerCase()
              )
            : packageSets;
        const activeIds = new Set<number>();
        for (const set of activeSets) {
            for (const slot of (set.slots ?? [])) {
                if (slot.service_package_id != null) activeIds.add(slot.service_package_id);
            }
        }
        return allPackages.filter((pkg) => activeIds.has(pkg.id));
    }, [allPackages, packageSets, selectedEventType]);

    const shouldShowQuestion = useCallback((condition: AnyRecord | null) => {
        if (!condition?.field_key) return true;
        const cur = responses[condition.field_key];
        const exp = condition.value;
        switch (condition.operator) {
            case "not_equals": return cur !== exp;
            case "contains":
                return Array.isArray(cur)
                    ? cur.includes(exp)
                    : String(cur || "").includes(String(exp || ""));
            case "equals":
            default: return cur === exp;
        }
    }, [responses]);

    const questionsForStep = useCallback((stepKey: string) => {
        if (!template) return [];
        return (template.questions as unknown as AnyRecord[]).filter(
            (q) => q.category === stepKey && shouldShowQuestion(q.condition_json)
        );
    }, [template, shouldShowQuestion]);

    const currentStep = steps[currentStepIdx];
    const currentQuestions = useMemo(
        () => currentStep ? questionsForStep(currentStep.key) : [],
        [currentStep, questionsForStep]
    );

    const validateCurrentStep = useCallback((): boolean => {
        if (!currentStep || currentStep.type === "package_select" || currentStep.type === "discovery_call") return true;
        const errors: AnyRecord = {};
        for (const q of currentQuestions) {
            const key = q.field_key || `question_${q.id}`;
            const val = responses[key];
            const empty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
            if (q.required && empty) errors[key] = "Required";
            else if (q.field_type === "email" && val && !/^[^s@]+@[^s@]+.[^s@]+$/.test(String(val))) {
                errors[key] = "Enter a valid email";
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [currentStep, currentQuestions, responses]);

    const handleNext = () => {
        if (!validateCurrentStep()) return;
        setFieldErrors({});
        setCurrentStepIdx((i) => Math.min(i + 1, steps.length - 1));
    };
    const handleBack = () => { setFieldErrors({}); setCurrentStepIdx((i) => Math.max(i - 1, 0)); };

    const handleChange = (fieldKey: string, value: unknown) => {
        setResponses((prev) => ({ ...prev, [fieldKey]: value }));
        setFieldErrors((prev) => { const n = { ...prev }; delete n[fieldKey]; return n; });
    };

    const handleSubmit = async () => {
        if (!template) return;
        const allErrors: AnyRecord = {};
        for (const step of steps) {
            if (step.type === "package_select" || step.type === "discovery_call") continue;
            for (const q of questionsForStep(step.key)) {
                const key = q.field_key || `question_${q.id}`;
                const val = responses[key];
                const empty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
                if (q.required && empty) allErrors[key] = "Required";
                else if (q.field_type === "email" && val && !/^[^s@]+@[^s@]+.[^s@]+$/.test(String(val))) {
                    allErrors[key] = "Enter a valid email";
                }
            }
        }
        if (Object.keys(allErrors).length > 0) {
            setFieldErrors(allErrors);
            for (let i = 0; i < steps.length; i++) {
                if (questionsForStep(steps[i].key).some((q: AnyRecord) => allErrors[q.field_key || `question_${q.id}`])) {
                    setCurrentStepIdx(i);
                    break;
                }
            }
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            const payload: AnyRecord = { template_id: template.id, responses, selected_package_id: selectedPackageId };
            if (linkedInquiryId) payload.inquiry_id = linkedInquiryId;
            else payload.create_inquiry = createInquiry;
            await api.needsAssessmentSubmissions.create(payload);
            setSubmitted(true);
            setTimeout(() => {
                window.location.href = linkedInquiryId
                    ? `/sales/inquiries/${linkedInquiryId}`
                    : "/studio/sales";
            }, 2800);
        } catch {
            setError("Failed to submit the questionnaire. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const isLastStep = currentStepIdx === steps.length - 1;

    const stepAnsweredCount = useCallback((stepKey: string) => {
        return questionsForStep(stepKey).filter((q: AnyRecord) => {
            const val = responses[q.field_key || `question_${q.id}`];
            return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
        }).length;
    }, [questionsForStep, responses]);

    const stepComplete = useCallback((idx: number): boolean => {
        const s = steps[idx];
        if (!s || s.type === "package_select" || s.type === "discovery_call") return true;
        return questionsForStep(s.key)
            .filter((q: AnyRecord) => q.required)
            .every((q: AnyRecord) => {
                const val = responses[q.field_key || `question_${q.id}`];
                return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
            });
    }, [steps, questionsForStep, responses]);

    if (loading) return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: bg0 }}>
            <Stack alignItems="center" spacing={2}>
                <CircularProgress size={40} thickness={2.5} sx={{ color: accent }} />
                <Typography sx={{ color: muted, fontSize: "0.8rem", letterSpacing: "0.06em" }}>Loading questionnaire…</Typography>
            </Stack>
        </Box>
    );

    if (!template) return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: bg0, p: 3 }}>
            <Box sx={{ maxWidth: 420, textAlign: "center" }}>
                <Typography sx={{ color: heading, fontSize: "1.1rem", fontWeight: 600, mb: 1 }}>No questionnaire available</Typography>
                <Typography sx={{ color: muted, fontSize: "0.875rem" }}>There's no active questionnaire at the moment. Please check back later.</Typography>
            </Box>
        </Box>
    );

    if (submitted) return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: bg0 }}>
            <Fade in timeout={500}>
                <Box sx={{ textAlign: "center", maxWidth: 440, p: 4 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                        <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 32 }} />
                    </Box>
                    <Typography sx={{ color: heading, fontSize: "1.4rem", fontWeight: 700, mb: 1 }}>All done!</Typography>
                    <Typography sx={{ color: muted, fontSize: "0.875rem", lineHeight: 1.6 }}>Your questionnaire has been submitted. We'll be in touch soon.</Typography>
                    <CircularProgress size={18} thickness={3} sx={{ color: muted, mt: 3 }} />
                </Box>
            </Fade>
        </Box>
    );

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: bg0 }}>
            <Box sx={{ height: "2px", background: `linear-gradient(90deg, transparent, ${accent} 50%, transparent)`, opacity: 0.5 }} />
            <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>

                {/* Header */}
                <Fade in timeout={500}>
                    <Box sx={{ mb: 5 }}>
                        <Typography sx={{ color: accent, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1 }}>
                            Questionnaire
                        </Typography>
                        <Typography sx={{ color: heading, fontSize: { xs: "1.5rem", sm: "1.9rem" }, fontWeight: 700, lineHeight: 1.2, mb: 0.75 }}>
                            {template.name}
                        </Typography>
                        {template.description && (
                            <Typography sx={{ color: muted, fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 520 }}>
                                {template.description}
                            </Typography>
                        )}
                    </Box>
                </Fade>

                {/* Step indicator */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{
                        display: "flex", alignItems: "center", overflowX: "auto", pb: 1.5,
                        "&::-webkit-scrollbar": { height: 4, display: "block" },
                        "&::-webkit-scrollbar-thumb": { bgcolor: border1, borderRadius: 2 },
                        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                    }}>
                        {steps.map((step, idx) => {
                            const isActive = idx === currentStepIdx;
                            const isDone = !isActive && idx < currentStepIdx;
                            const isClickable = idx < currentStepIdx;
                            return (
                                <React.Fragment key={step.key}>
                                    <Box
                                        onClick={() => isClickable ? setCurrentStepIdx(idx) : undefined}
                                        sx={{
                                            display: "flex", alignItems: "center", gap: 1,
                                            px: 1.5, py: 0.75, borderRadius: "8px",
                                            cursor: isClickable ? "pointer" : "default",
                                            flexShrink: 0, transition: "all 0.2s",
                                            bgcolor: isActive ? accentLight : "transparent",
                                            border: `1px solid ${isActive ? accentBorder : "transparent"}`,
                                            "&:hover": isClickable ? { bgcolor: "rgba(255,255,255,0.04)" } : {},
                                        }}
                                    >
                                        <Box sx={{
                                            width: 22, height: 22, borderRadius: "50%",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            bgcolor: isActive ? accent : isDone ? "rgba(34,197,94,0.15)" : border0,
                                            border: `1.5px solid ${isActive ? accent : isDone ? "rgba(34,197,94,0.5)" : border1}`,
                                            fontSize: "0.65rem", fontWeight: 700,
                                            color: isActive ? "#fff" : isDone ? "#22c55e" : muted,
                                            flexShrink: 0, transition: "all 0.2s",
                                        }}>
                                            {isDone ? <CheckIcon sx={{ fontSize: 11 }} /> : idx + 1}
                                        </Box>
                                        <Typography sx={{
                                            fontSize: "0.78rem", fontWeight: isActive ? 600 : 400,
                                            color: isActive ? "#93c5fd" : isDone ? body : muted,
                                            whiteSpace: "nowrap", transition: "color 0.2s",
                                        }}>
                                            {step.label}
                                        </Typography>
                                    </Box>
                                    {idx < steps.length - 1 && (
                                        <Box sx={{
                                            width: 20, height: 1, mx: 0.25, flexShrink: 0,
                                            bgcolor: idx < currentStepIdx ? "rgba(34,197,94,0.4)" : border0,
                                            transition: "background 0.3s",
                                        }} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
                        <Typography sx={{ color: heading, fontSize: "1rem", fontWeight: 600 }}>{currentStep?.label}</Typography>
                        <Typography sx={{ color: muted, fontSize: "0.75rem" }}>Step {currentStepIdx + 1} of {steps.length}</Typography>
                    </Box>
                    {currentStep?.description && (
                        <Typography sx={{ color: muted, fontSize: "0.8rem", mt: 0.3 }}>{currentStep.description}</Typography>
                    )}
                    <Box sx={{ mt: 1.5, height: 3, borderRadius: 2, bgcolor: border0, overflow: "hidden" }}>
                        <Box sx={{
                            height: "100%",
                            width: `${((currentStepIdx + 1) / steps.length) * 100}%`,
                            bgcolor: accent, borderRadius: 2, transition: "width 0.4s ease",
                        }} />
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, bgcolor: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", "& .MuiAlert-icon": { color: "#ef4444" } }}>
                        {error}
                    </Alert>
                )}

                {/* Step content */}
                <Fade in key={currentStepIdx} timeout={280}>
                    <Box>
                        {currentStep?.type === "discovery_call" ? (
                            <DiscoveryCallStep
                                responses={responses}
                                onChange={handleChange}
                            />
                        ) : currentStep?.type === "package_select" ? (
                            <PackageStep
                                packages={packages}
                                selectedPackageId={selectedPackageId}
                                onSelect={setSelectedPackageId}
                                currencySymbol={getCurrencySymbol(currentBrand?.currency)}
                                selectedEventType={selectedEventType}
                            />
                        ) : (
                            <Stack spacing={2}>
                                {/* ── Event-type selector (shown on the "event" step) ── */}
                                {currentStep?.key === "event" && eventTypeOptions.length > 0 && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography sx={{ color: body, fontSize: "0.82rem", fontWeight: 600, mb: 1.5, letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.7 }}>
                                            What type of event is it?
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                            {eventTypeOptions.map((opt) => {
                                                const active = selectedEventType === opt;
                                                return (
                                                    <Box
                                                        key={opt}
                                                        onClick={() => {
                                                            const newVal = active ? null : opt;
                                                            setSelectedEventType(newVal);
                                                            handleChange('event_type', newVal ?? '');
                                                        }}
                                                        sx={{
                                                            px: 2.5, py: 1.25, borderRadius: "10px", cursor: "pointer",
                                                            border: `1.5px solid ${active ? accent : border1}`,
                                                            bgcolor: active ? accentLight : bg1,
                                                            transition: "all 0.2s",
                                                            display: "flex", alignItems: "center", gap: 1,
                                                            "&:hover": { bgcolor: active ? accentLight : "rgba(255,255,255,0.05)", borderColor: active ? accent : border1 },
                                                        }}
                                                    >
                                                        {active && <CheckIcon sx={{ fontSize: 14, color: accent }} />}
                                                        <Typography sx={{ color: active ? "#93c5fd" : body, fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}>
                                                            {opt}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}
                                {currentQuestions.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: "center", borderRadius: "12px", bgcolor: bg1, border: `1px solid ${border0}` }}>
                                        <Typography sx={{ color: muted, fontSize: "0.875rem" }}>No questions for this step</Typography>
                                    </Box>
                                ) : currentQuestions.map((q: AnyRecord, idx: number) => {
                                    const key = q.field_key || `question_${q.id}`;
                                    const val = responses[key] ?? "";
                                    const err = fieldErrors[key];
                                    const isFilled = val !== "" && val !== null && val !== undefined && !(Array.isArray(val) && val.length === 0);
                                    const opts: string[] = (q.options as AnyRecord)?.values ?? [];

                                    return (
                                        <Fade in timeout={200 + idx * 50} key={key}>
                                            <Box sx={{
                                                p: { xs: 2.5, sm: 3 }, borderRadius: "12px",
                                                bgcolor: isFilled ? accentLight : bg1,
                                                border: `1px solid ${isFilled ? accentBorder : border0}`,
                                                transition: "all 0.25s",
                                            }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                                                    <Box sx={{
                                                        width: 26, height: 26, borderRadius: "8px",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        bgcolor: isFilled ? accent : border0,
                                                        color: isFilled ? "#fff" : muted,
                                                        fontSize: "0.68rem", fontWeight: 700,
                                                        transition: "all 0.2s", flexShrink: 0,
                                                    }}>
                                                        {isFilled ? <CheckIcon sx={{ fontSize: 13 }} /> : idx + 1}
                                                    </Box>
                                                    <Typography sx={{ color: body, fontSize: "0.9rem", fontWeight: 500, flex: 1 }}>
                                                        {q.prompt}
                                                        {q.required && <Box component="span" sx={{ color: "#ef4444", ml: 0.5 }}>*</Box>}
                                                    </Typography>
                                                </Box>

                                                {/* ── Preferred contact time → chip-toggle time slots ── */}
                                                {(key === "preferred_contact_time" || key.toLowerCase().includes("contact_time")) ? (
                                                    <Box>
                                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                            {CONTACT_TIME_OPTIONS.map((opt) => {
                                                                const selected = val === opt;
                                                                return (
                                                                    <Chip key={opt} label={opt} size="small"
                                                                        onClick={() => handleChange(key, selected ? "" : opt)}
                                                                        sx={{
                                                                            fontSize: "0.78rem", height: 30, cursor: "pointer",
                                                                            color: selected ? "#93c5fd" : muted,
                                                                            bgcolor: selected ? accentLight : "rgba(255,255,255,0.04)",
                                                                            border: `1px solid ${selected ? accentBorder : border0}`,
                                                                            "& .MuiChip-label": { px: 1.5 },
                                                                            "&:hover": { bgcolor: selected ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.07)" },
                                                                            transition: "all 0.15s",
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                        {err && <Typography sx={{ color: "#ef4444", fontSize: "0.72rem", mt: 0.75 }}>{err}</Typography>}
                                                    </Box>
                                                ) : q.field_type === "multiselect" && opts.length > 0 ? (
                                                    <Box>
                                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                            {opts.map((opt: string) => {
                                                                const selected = Array.isArray(val) && val.includes(opt);
                                                                return (
                                                                    <Chip key={opt} label={opt} size="small"
                                                                        onClick={() => {
                                                                            const cur: string[] = Array.isArray(val) ? val : [];
                                                                            handleChange(key, selected ? cur.filter((x) => x !== opt) : [...cur, opt]);
                                                                        }}
                                                                        sx={{
                                                                            fontSize: "0.78rem", height: 30, cursor: "pointer",
                                                                            color: selected ? "#93c5fd" : muted,
                                                                            bgcolor: selected ? accentLight : "rgba(255,255,255,0.04)",
                                                                            border: `1px solid ${selected ? accentBorder : border0}`,
                                                                            "& .MuiChip-label": { px: 1.5 },
                                                                            "&:hover": { bgcolor: selected ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.07)" },
                                                                            transition: "all 0.15s",
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                        {err && <Typography sx={{ color: "#ef4444", fontSize: "0.72rem", mt: 0.75 }}>{err}</Typography>}
                                                    </Box>
                                                ) : q.field_type === "select" && opts.length > 0 ? (
                                                    <FormControl fullWidth>
                                                        <Select
                                                            value={val || ""} displayEmpty
                                                            onChange={(e) => handleChange(key, e.target.value)}
                                                            sx={{
                                                                color: body, borderRadius: "10px", fontSize: "0.9rem",
                                                                bgcolor: "rgba(255,255,255,0.02)",
                                                                "& .MuiOutlinedInput-notchedOutline": { borderColor: border0 },
                                                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentBorder },
                                                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: accent, borderWidth: "1.5px" },
                                                                "& .MuiSvgIcon-root": { color: muted },
                                                            }}
                                                            MenuProps={{ PaperProps: { sx: {
                                                                bgcolor: "#111827", border: `1px solid ${border1}`, borderRadius: "10px", mt: 0.5,
                                                                "& .MuiMenuItem-root": { color: body, fontSize: "0.875rem", "&:hover": { bgcolor: accentLight }, "&.Mui-selected": { bgcolor: accentLight, color: "#93c5fd" } },
                                                            }}}}
                                                        >
                                                            <MenuItem value="" disabled sx={{ color: muted, fontSize: "0.875rem" }}>Select an option</MenuItem>
                                                            {opts.map((opt: string) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                                        </Select>
                                                        {err && <Typography sx={{ color: "#ef4444", fontSize: "0.72rem", mt: 0.5 }}>{err}</Typography>}
                                                    </FormControl>
                                                ) : q.field_type === "textarea" ? (
                                                    <TextField
                                                        value={val} multiline rows={3} placeholder={q.prompt}
                                                        onChange={(e) => handleChange(key, e.target.value)}
                                                        required={Boolean(q.required)} error={Boolean(err)} helperText={err}
                                                        fullWidth sx={fieldSx}
                                                    />
                                                ) : (
                                                    <TextField
                                                        value={val} placeholder={q.field_type === "date" ? undefined : q.prompt}
                                                        onChange={(e) => handleChange(key, e.target.value)}
                                                        type={q.field_type === "date" ? "date" : q.field_type === "email" ? "email" : "text"}
                                                        required={Boolean(q.required)} error={Boolean(err)} helperText={err}
                                                        fullWidth InputLabelProps={q.field_type === "date" ? { shrink: true } : undefined}
                                                        sx={fieldSx}
                                                    />
                                                )}
                                            </Box>
                                        </Fade>
                                    );
                                })}
                                {currentQuestions.length > 0 && (
                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Typography sx={{ color: muted, fontSize: "0.72rem" }}>
                                            {stepAnsweredCount(currentStep!.key)}/{currentQuestions.length} answered
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        )}

                        {isLastStep && !linkedInquiryId && (
                            <Box sx={{ mt: 2.5, p: 2.5, borderRadius: "12px", bgcolor: bg1, border: `1px solid ${border0}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                    <Typography sx={{ color: heading, fontSize: "0.85rem", fontWeight: 600 }}>Create Inquiry</Typography>
                                    <Typography sx={{ color: muted, fontSize: "0.72rem", mt: 0.2 }}>Auto-create a sales inquiry from this submission</Typography>
                                </Box>
                                <Switch checked={createInquiry} onChange={(e) => setCreateInquiry(e.target.checked)} size="small"
                                    sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: accent }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: accent }, "& .MuiSwitch-track": { bgcolor: border1 } }} />
                            </Box>
                        )}
                        {isLastStep && linkedInquiryId && (
                            <Box sx={{ mt: 2.5, p: 2.5, borderRadius: "12px", bgcolor: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)" }}>
                                <Typography sx={{ color: "#10b981", fontSize: "0.85rem", fontWeight: 600 }}>Linked to Inquiry #{linkedInquiryId}</Typography>
                                <Typography sx={{ color: muted, fontSize: "0.72rem", mt: 0.25 }}>Submission will be tied to this inquiry</Typography>
                            </Box>
                        )}
                    </Box>
                </Fade>

                {/* Navigation */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 4, pt: 3, borderTop: `1px solid ${border0}` }}>
                    <Button
                        onClick={handleBack} disabled={currentStepIdx === 0}
                        startIcon={<ArrowBackIcon sx={{ fontSize: "0.9rem !important" }} />}
                        sx={{ color: muted, fontSize: "0.85rem", textTransform: "none", px: 2, borderRadius: "10px", "&:hover": { bgcolor: bg1, color: body }, "&:disabled": { color: "rgba(100,116,139,0.3)" } }}
                    >
                        Back
                    </Button>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            {steps.map((_, idx) => (
                                <Box key={idx} sx={{ width: idx === currentStepIdx ? 16 : 6, height: 6, borderRadius: 3, bgcolor: idx === currentStepIdx ? accent : stepComplete(idx) ? "rgba(34,197,94,0.5)" : border1, transition: "all 0.25s" }} />
                            ))}
                        </Box>
                        {isLastStep ? (
                            <Button
                                onClick={handleSubmit} disabled={submitting}
                                endIcon={!submitting && <CheckCircleIcon sx={{ fontSize: "0.9rem !important" }} />}
                                sx={{ bgcolor: accent, color: "#fff", fontWeight: 600, fontSize: "0.85rem", px: 3, py: 1.1, borderRadius: "10px", textTransform: "none", boxShadow: "0 0 20px rgba(59,130,246,0.25)", "&:hover": { bgcolor: "#2563eb" }, "&:disabled": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)", boxShadow: "none" } }}
                            >
                                {submitting && <CircularProgress size={16} sx={{ color: "inherit", mr: 1 }} />}
                                {submitting ? "Submitting…" : "Submit"}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                endIcon={<ArrowForwardIcon sx={{ fontSize: "0.9rem !important" }} />}
                                sx={{ bgcolor: accent, color: "#fff", fontWeight: 600, fontSize: "0.85rem", px: 3, py: 1.1, borderRadius: "10px", textTransform: "none", boxShadow: "0 0 20px rgba(59,130,246,0.25)", "&:hover": { bgcolor: "#2563eb" } }}
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// ── Discovery call booking step ──────────────────────────────────────────────
function DiscoveryCallStep({
    responses,
    onChange,
}: {
    responses: AnyRecord;
    onChange: (key: string, val: unknown) => void;
}) {
    const CALL_METHODS = [
        { key: "Phone Call", emoji: "📞" },
        { key: "Video Call", emoji: "🎥" },
    ];

    return (
        <Stack spacing={3}>
            {/* Method selector */}
            <Box sx={{ p: 3, borderRadius: "12px", bgcolor: bg1, border: `1px solid ${border0}` }}>
                <Typography sx={{ color: body, fontWeight: 600, mb: 2, fontSize: "0.9rem" }}>
                    How would you like your discovery call?
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    {CALL_METHODS.map(({ key, emoji }) => {
                        const active = responses.discovery_call_method === key;
                        return (
                            <Box
                                key={key}
                                onClick={() => onChange("discovery_call_method", active ? "" : key)}
                                sx={{
                                    flex: 1, p: 2.5, borderRadius: "12px", cursor: "pointer",
                                    textAlign: "center",
                                    border: `1.5px solid ${active ? accent : border1}`,
                                    bgcolor: active ? accentLight : "rgba(255,255,255,0.02)",
                                    transition: "all 0.2s",
                                    "&:hover": { borderColor: accent, bgcolor: accentLight },
                                }}
                            >
                                <Typography sx={{ fontSize: "1.8rem", mb: 0.75 }}>{emoji}</Typography>
                                <Typography sx={{ color: active ? "#93c5fd" : body, fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}>
                                    {key}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Preferred date */}
            <Box sx={{ p: 3, borderRadius: "12px", bgcolor: bg1, border: `1px solid ${border0}` }}>
                <Typography sx={{ color: body, fontWeight: 600, mb: 2, fontSize: "0.9rem" }}>
                    Preferred date
                </Typography>
                <TextField
                    type="date"
                    value={responses.discovery_call_date || ""}
                    onChange={(e) => onChange("discovery_call_date", e.target.value)}
                    fullWidth
                    sx={fieldSx}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split("T")[0] }}
                />
            </Box>

            {/* Preferred time slot */}
            <Box sx={{ p: 3, borderRadius: "12px", bgcolor: bg1, border: `1px solid ${border0}` }}>
                <Typography sx={{ color: body, fontWeight: 600, mb: 2, fontSize: "0.9rem" }}>
                    Preferred time slot
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {CONTACT_TIME_OPTIONS.map((opt) => {
                        const sel = responses.discovery_call_time === opt;
                        return (
                            <Chip
                                key={opt}
                                label={opt}
                                size="small"
                                onClick={() => onChange("discovery_call_time", sel ? "" : opt)}
                                sx={{
                                    cursor: "pointer", fontSize: "0.78rem", height: 30,
                                    color: sel ? "#93c5fd" : muted,
                                    bgcolor: sel ? accentLight : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${sel ? accentBorder : border0}`,
                                    "& .MuiChip-label": { px: 1.5 },
                                    "&:hover": { bgcolor: sel ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.07)" },
                                    transition: "all 0.15s",
                                }}
                            />
                        );
                    })}
                </Box>
            </Box>
        </Stack>
    );
}

// ── Package selection step ────────────────────────────────────────────────────
function PackageStep({
    packages,
    selectedPackageId,
    onSelect,
    currencySymbol,
    selectedEventType,
}: {
    packages: ServicePackage[];
    selectedPackageId: number | null;
    onSelect: (id: number | null) => void;
    currencySymbol: string;
    selectedEventType: string | null;
}) {
    return (
        <Stack spacing={2}>
            {/* Context note when filtered by event type */}
            {selectedEventType && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ color: muted, fontSize: "0.78rem" }}>
                        Showing packages for
                    </Typography>
                    <Box sx={{ px: 1.25, py: 0.3, borderRadius: "6px", bgcolor: accentLight, border: `1px solid ${accentBorder}` }}>
                        <Typography sx={{ color: "#93c5fd", fontSize: "0.75rem", fontWeight: 600 }}>{selectedEventType}</Typography>
                    </Box>
                </Box>
            )}

            {/* Decide later card */}
            <Box
                onClick={() => onSelect(null)}
                sx={{
                    p: 2.5, borderRadius: "12px", cursor: "pointer",
                    bgcolor: selectedPackageId === null ? accentLight : bg1,
                    border: `1.5px solid ${selectedPackageId === null ? accentBorder : border0}`,
                    display: "flex", alignItems: "center", gap: 2,
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: selectedPackageId === null ? accentLight : "rgba(255,255,255,0.04)", borderColor: selectedPackageId === null ? accentBorder : border1 },
                }}
            >
                <Box sx={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: `2px solid ${selectedPackageId === null ? accent : border1}`,
                    bgcolor: selectedPackageId === null ? accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    {selectedPackageId === null && <Box sx={{ width: 8, height: 8, bgcolor: "#fff", borderRadius: "50%" }} />}
                </Box>
                <Box>
                    <Typography sx={{ color: body, fontSize: "0.875rem", fontWeight: 500 }}>Decide later</Typography>
                    <Typography sx={{ color: muted, fontSize: "0.72rem", mt: 0.2 }}>Skip for now — you can discuss packages with us directly</Typography>
                </Box>
            </Box>

            {/* Package cards */}
            {packages.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center", borderRadius: "12px", bgcolor: bg1, border: `1px solid ${border0}` }}>
                    <Typography sx={{ color: muted, fontSize: "0.875rem" }}>
                        {selectedEventType
                            ? `No packages available for ${selectedEventType} events`
                            : "No packages available at the moment"}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 2,
                }}>
                    {packages.map((pkg) => {
                        const isSelected = selectedPackageId === pkg.id;
                        const itemCount = pkg.contents?.items?.length ?? 0;
                        const price = pkg.base_price ?? (pkg as Record<string, unknown>).price as number | null;

                        return (
                            <Box
                                key={pkg.id}
                                onClick={() => onSelect(pkg.id)}
                                sx={{
                                    p: 3, borderRadius: "14px", cursor: "pointer",
                                    bgcolor: isSelected ? accentLight : bg1,
                                    border: `1.5px solid ${isSelected ? accentBorder : border0}`,
                                    display: "flex", flexDirection: "column", gap: 1.5,
                                    transition: "all 0.2s",
                                    position: "relative", overflow: "hidden",
                                    "&:hover": {
                                        bgcolor: isSelected ? accentLight : "rgba(255,255,255,0.04)",
                                        borderColor: isSelected ? accentBorder : border1,
                                        transform: "translateY(-1px)",
                                        boxShadow: isSelected ? "0 4px 24px rgba(59,130,246,0.15)" : "0 4px 16px rgba(0,0,0,0.3)",
                                    },
                                }}
                            >
                                {/* Selected indicator stripe */}
                                {isSelected && (
                                    <Box sx={{
                                        position: "absolute", top: 0, left: 0, right: 0, height: 3,
                                        background: `linear-gradient(90deg, ${accent}, #60a5fa)`,
                                    }} />
                                )}

                                {/* Top row: name + radio */}
                                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                                    <Typography sx={{
                                        color: isSelected ? "#93c5fd" : heading,
                                        fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.3, flex: 1,
                                    }}>
                                        {pkg.name}
                                    </Typography>
                                    <Box sx={{
                                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, mt: 0.15,
                                        border: `2px solid ${isSelected ? accent : border1}`,
                                        bgcolor: isSelected ? accent : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {isSelected && <Box sx={{ width: 7, height: 7, bgcolor: "#fff", borderRadius: "50%" }} />}
                                    </Box>
                                </Box>

                                {/* Price */}
                                {price != null && (
                                    <Typography sx={{
                                        color: isSelected ? "#93c5fd" : accent,
                                        fontSize: "1.35rem", fontWeight: 700, lineHeight: 1,
                                    }}>
                                        {currencySymbol}{Number(price).toLocaleString()}
                                    </Typography>
                                )}

                                {/* Badges row */}
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                    {pkg.category && (
                                        <Box sx={{
                                            px: 1, py: 0.3, borderRadius: "5px",
                                            bgcolor: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)",
                                        }}>
                                            <Typography sx={{ color: "#c084fc", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                {pkg.category}
                                            </Typography>
                                        </Box>
                                    )}
                                    {itemCount > 0 && (
                                        <Box sx={{
                                            px: 1, py: 0.3, borderRadius: "5px",
                                            bgcolor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                                        }}>
                                            <Typography sx={{ color: "#34d399", fontSize: "0.68rem", fontWeight: 600 }}>
                                                {itemCount} {itemCount === 1 ? "item" : "items"} included
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Description */}
                                {pkg.description && (
                                    <Typography sx={{
                                        color: muted, fontSize: "0.775rem", lineHeight: 1.55,
                                        display: "-webkit-box", WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical", overflow: "hidden",
                                    }}>
                                        {pkg.description}
                                    </Typography>
                                )}

                                {/* Items list (first 3) */}
                                {itemCount > 0 && (
                                    <Stack spacing={0.4} sx={{ mt: 0.5 }}>
                                        {pkg.contents.items.slice(0, 3).map((item, i) => (
                                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: isSelected ? accent : border1, flexShrink: 0 }} />
                                                <Typography sx={{ color: muted, fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                        ))}
                                        {itemCount > 3 && (
                                            <Typography sx={{ color: muted, fontSize: "0.68rem", opacity: 0.6, pl: 1.5 }}>
                                                + {itemCount - 3} more
                                            </Typography>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Stack>
    );
}
