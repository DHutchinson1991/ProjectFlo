"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    Box,
    Typography,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Button,
    Stack,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Alert,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon,
    Check as CheckIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationOnIcon,
    Language as LanguageIcon,
    Print as PrintIcon,
} from "@mui/icons-material";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Keyframe animations (matching proposal page)                        */
/* ------------------------------------------------------------------ */

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const scaleIn = keyframes`
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
`;

const shimmer = keyframes`
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-14px) rotate(1deg); }
`;

const gradientShift = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const subtleFloat = keyframes`
    0%, 100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-8px) scale(1.02); }
`;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface PublicBrand {
    id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    logo_url: string | null;
    currency: string | null;
}

interface WizardStep {
    key: string;
    label: string;
    description?: string;
    type?: string;
}

interface NAQuestion {
    id?: number;
    order_index: number;
    prompt: string;
    field_type: string;
    field_key?: string;
    required?: boolean;
    options?: { values?: string[] } | Record<string, unknown> | null;
    condition_json?: Record<string, unknown> | null;
    help_text?: string | null;
    category?: string | null;
}

interface NATemplate {
    id: number;
    brand_id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    steps_config?: WizardStep[] | null;
    questions: NAQuestion[];
    brand: PublicBrand | null;
    packages: PackageData[];
    package_sets: PackageSetData[];
}

interface PackageData {
    id: number;
    name: string;
    description?: string | null;
    base_price?: string | number | null;
    price?: string | number | null;
    currency?: string;
    category?: string | null;
    contents?: { items?: { description: string; price?: number; type?: string }[] } | null;
    is_active?: boolean;
}

interface PackageSetData {
    id: number;
    category?: { id: number; name: string } | null;
    slots?: { id: number; slot_label?: string; service_package_id?: number | null; order_index: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/* ------------------------------------------------------------------ */
/* Theme colors (cinematic-dark, matching proposal)                    */
/* ------------------------------------------------------------------ */

function getColors() {
    return {
        bg: "#09090b",
        card: "#18181b",
        text: "#fafafa",
        muted: "#a1a1aa",
        accent: "#7c4dff",
        border: "#27272a",
        accentSoft: "#1e1b4b",
        gradient1: "#7c4dff",
        gradient2: "#a855f7",
    };
}

/* ------------------------------------------------------------------ */
/* Currency helpers                                                    */
/* ------------------------------------------------------------------ */

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$", GBP: "£", EUR: "€", AUD: "A$", CAD: "C$", NZD: "NZ$",
    JPY: "¥", CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr",
    ZAR: "R", INR: "₹", SGD: "S$", HKD: "HK$", MXN: "MX$",
};
function getCurrencySymbol(currency: string | null | undefined): string {
    if (!currency) return "$";
    return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

/* ------------------------------------------------------------------ */
/* Preferred-contact-time options                                      */
/* ------------------------------------------------------------------ */

const CONTACT_TIME_OPTIONS = [
    "Morning (8am–12pm)",
    "Afternoon (12pm–5pm)",
    "Evening (5pm–9pm)",
    "Flexible",
];

/* ------------------------------------------------------------------ */
/* Default steps                                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_STEPS: WizardStep[] = [
    { key: "contact", label: "You", description: "Tell us a little about yourself" },
    { key: "event", label: "Your Wedding", description: "Event details" },
    { key: "coverage", label: "Coverage", description: "What you'd like captured" },
    { key: "budget", label: "Budget", description: "Investment range" },
    { key: "package", label: "Package", description: "Choose your package", type: "package_select" },
    { key: "reach", label: "Reach You", description: "How did you find us?" },
    { key: "call", label: "Discovery Call", description: "How would you like to connect?", type: "discovery_call" },
];

/* ------------------------------------------------------------------ */
/* Scroll-reveal hook (matching proposal)                              */
/* ------------------------------------------------------------------ */

function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}

function revealSx(visible: boolean, delay = 0) {
    return {
        opacity: visible ? 1 : 0,
        animation: visible ? `${fadeInUp} 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both` : "none",
    };
}

/* ------------------------------------------------------------------ */
/* Ornamental divider (matching proposal)                              */
/* ------------------------------------------------------------------ */

function SectionDivider({ color }: { color: string }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 2 }}>
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(color, 0.3)})`, borderRadius: 1 }} />
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: alpha(color, 0.15), border: `1px solid ${alpha(color, 0.1)}` }} />
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, ${alpha(color, 0.3)}, transparent)`, borderRadius: 1 }} />
        </Box>
    );
}

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */

export default function PublicNeedsAssessmentPage() {
    const params = useParams();
    const token = params.token as string;
    const colors = getColors();

    const [template, setTemplate] = useState<NATemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [steps, setSteps] = useState<WizardStep[]>(DEFAULT_STEPS);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [responses, setResponses] = useState<AnyRecord>({});
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<AnyRecord>({});

    const heroReveal = useReveal();
    const footerReveal = useReveal();

    /* ── Fetch template ─────────────────────────────────── */

    const fetchTemplate = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.publicNeedsAssessment.getByShareToken(token);
            setTemplate(data);
            if (data.steps_config?.length) {
                const stepsFromConfig = data.steps_config as WizardStep[];
                const hasCallStep = stepsFromConfig.some((s: WizardStep) => s.key === "call");
                setSteps(hasCallStep ? stepsFromConfig : [
                    ...stepsFromConfig,
                    { key: "call", label: "Discovery Call", description: "How would you like to connect?", type: "discovery_call" },
                ]);
            }
        } catch {
            setError("This questionnaire could not be found or may have expired.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchTemplate();
    }, [token, fetchTemplate]);

    /* ── Derived data ────────────────────────────────────── */

    const brand = template?.brand ?? null;
    const brandName = brand?.display_name || brand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const currencySymbol = getCurrencySymbol(brand?.currency);

    const eventTypeOptions = useMemo(() => {
        const seen = new Set<string>();
        const options: string[] = [];
        for (const set of (template?.package_sets ?? [])) {
            const name = set.category?.name;
            if (name && !seen.has(name)) { seen.add(name); options.push(name); }
        }
        return options;
    }, [template?.package_sets]);

    const packages = useMemo(() => {
        const allPackages = template?.packages ?? [];
        const packageSets = template?.package_sets ?? [];
        const activeSets = selectedEventType
            ? packageSets.filter((s) => (s.category?.name ?? "").toLowerCase() === selectedEventType.toLowerCase())
            : packageSets;
        const activeIds = new Set<number>();
        for (const set of activeSets) {
            for (const slot of (set.slots ?? [])) {
                if (slot.service_package_id != null) activeIds.add(slot.service_package_id);
            }
        }
        return activeIds.size > 0
            ? allPackages.filter((pkg) => activeIds.has(pkg.id))
            : allPackages;
    }, [template?.packages, template?.package_sets, selectedEventType]);

    /* ── Question filtering ──────────────────────────────── */

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
        return template.questions.filter(
            (q) => q.category === stepKey && shouldShowQuestion(q.condition_json as AnyRecord | null)
        );
    }, [template, shouldShowQuestion]);

    const currentStep = steps[currentStepIdx];
    const currentQuestions = useMemo(
        () => currentStep ? questionsForStep(currentStep.key) : [],
        [currentStep, questionsForStep]
    );

    /* ── Validation ──────────────────────────────────────── */

    const validateCurrentStep = useCallback((): boolean => {
        if (!currentStep || currentStep.type === "package_select" || currentStep.type === "discovery_call") return true;
        const errors: AnyRecord = {};
        for (const q of currentQuestions) {
            const key = q.field_key || `question_${q.id}`;
            const val = responses[key];
            const empty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
            if (q.required && empty) errors[key] = "Required";
            else if (q.field_type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
                errors[key] = "Enter a valid email";
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [currentStep, currentQuestions, responses]);

    /* ── Navigation handlers ─────────────────────────────── */

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

    /* ── Submit ─────────────────────────────────────────── */

    const handleSubmit = async () => {
        if (!template) return;
        // Validate all steps
        const allErrors: AnyRecord = {};
        for (const step of steps) {
            if (step.type === "package_select" || step.type === "discovery_call") continue;
            for (const q of questionsForStep(step.key)) {
                const key = q.field_key || `question_${q.id}`;
                const val = responses[key];
                const empty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
                if (q.required && empty) allErrors[key] = "Required";
                else if (q.field_type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
                    allErrors[key] = "Enter a valid email";
                }
            }
        }
        if (Object.keys(allErrors).length > 0) {
            setFieldErrors(allErrors);
            for (let i = 0; i < steps.length; i++) {
                if (questionsForStep(steps[i].key).some((q) => allErrors[q.field_key || `question_${q.id}`])) {
                    setCurrentStepIdx(i);
                    break;
                }
            }
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            await api.publicNeedsAssessment.submit(token, {
                template_id: template.id,
                responses,
                selected_package_id: selectedPackageId,
                create_inquiry: true,
            });
            setSubmitted(true);
        } catch {
            setError("Failed to submit the questionnaire. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const isLastStep = currentStepIdx === steps.length - 1;

    const stepAnsweredCount = useCallback((stepKey: string) => {
        return questionsForStep(stepKey).filter((q) => {
            const val = responses[q.field_key || `question_${q.id}`];
            return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
        }).length;
    }, [questionsForStep, responses]);

    const stepComplete = useCallback((idx: number): boolean => {
        const s = steps[idx];
        if (!s || s.type === "package_select" || s.type === "discovery_call") return true;
        return questionsForStep(s.key)
            .filter((q) => q.required)
            .every((q) => {
                const val = responses[q.field_key || `question_${q.id}`];
                return val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
            });
    }, [steps, questionsForStep, responses]);

    /* ── Field styles ────────────────────────────────────── */

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            color: colors.text,
            borderRadius: "12px",
            fontSize: "0.925rem",
            bgcolor: alpha(colors.card, 0.5),
            backdropFilter: "blur(8px)",
            "& fieldset": { borderColor: alpha(colors.border, 0.6) },
            "&:hover fieldset": { borderColor: alpha(colors.accent, 0.4) },
            "&.Mui-focused fieldset": { borderColor: colors.accent, borderWidth: "1.5px" },
        },
        "& .MuiInputLabel-root": { color: colors.muted, fontSize: "0.875rem" },
        "& .MuiInputLabel-root.Mui-focused": { color: colors.accent },
        "& .MuiFormHelperText-root.Mui-error": { color: "#ef4444" },
    };

    const cardSx = {
        bgcolor: alpha(colors.card, 0.7),
        backdropFilter: "blur(20px) saturate(1.5)",
        border: `1px solid ${alpha(colors.border, 0.6)}`,
        borderRadius: 4,
        overflow: "hidden",
        position: "relative" as const,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${alpha(colors.gradient1, 0.4)}, ${alpha(colors.gradient2, 0.4)}, transparent)`,
            opacity: 0,
            transition: "opacity 0.4s ease",
        },
        "&:hover": {
            borderColor: alpha(colors.accent, 0.2),
            boxShadow: `0 12px 40px ${alpha(colors.accent, 0.1)}, 0 4px 12px ${alpha("#000", 0.2)}`,
            transform: "translateY(-2px)",
            "&::before": { opacity: 1 },
        },
    };

    /* ================================================================ */
    /* Loading state                                                     */
    /* ================================================================ */

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: colors.bg,
                    gap: 3,
                }}
            >
                {[180, 120, 240].map((w, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: w,
                            height: 10,
                            borderRadius: 5,
                            background: `linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)`,
                            backgroundSize: "200% 100%",
                            animation: `${shimmer} 1.6s ease-in-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                        }}
                    />
                ))}
            </Box>
        );
    }

    /* ================================================================ */
    /* Error state                                                       */
    /* ================================================================ */

    if (error && !template) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: colors.bg,
                    p: 3,
                }}
            >
                <Box
                    sx={{
                        p: 5,
                        maxWidth: 420,
                        textAlign: "center",
                        bgcolor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 3,
                        animation: `${scaleIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
                    }}
                >
                    <Typography variant="h6" sx={{ color: colors.text, mb: 1, fontWeight: 600 }}>
                        Questionnaire Not Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.muted, lineHeight: 1.6 }}>
                        {error}
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (!template) return null;

    /* ================================================================ */
    /* Submitted state                                                   */
    /* ================================================================ */

    if (submitted) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: colors.bg, color: colors.text, overflowX: "hidden", WebkitFontSmoothing: "antialiased" }}>
                {/* Sticky branded header */}
                <Box
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                        py: 1.5,
                        px: 3,
                        backdropFilter: "blur(16px) saturate(1.8)",
                        bgcolor: alpha(colors.card, 0.7),
                        borderBottom: `1px solid ${alpha(colors.border, 0.6)}`,
                        animation: `${fadeIn} 0.5s ease both`,
                    }}
                >
                    {brand?.logo_url ? (
                        <Box component="img" src={brand.logo_url} alt={brandName} sx={{ height: 28, width: "auto", objectFit: "contain" }} />
                    ) : brandInitial ? (
                        <Box sx={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", lineHeight: 1 }}>{brandInitial}</Typography>
                        </Box>
                    ) : null}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.text, letterSpacing: 1, fontSize: "0.8rem", textTransform: "uppercase", flex: 1 }}>
                        {brandName}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
                    <Box sx={{ textAlign: "center", maxWidth: 500, p: 4, animation: `${scaleIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1) both` }}>
                        <Box sx={{
                            width: 80, height: 80, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${alpha("#22c55e", 0.15)}, ${alpha("#22c55e", 0.05)})`,
                            border: `2px solid ${alpha("#22c55e", 0.3)}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            mx: "auto", mb: 4,
                            animation: `${subtleFloat} 4s ease-in-out infinite`,
                        }}>
                            <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 40 }} />
                        </Box>
                        <Typography sx={{ color: colors.text, fontSize: "1.75rem", fontWeight: 200, letterSpacing: "-0.02em", mb: 1.5 }}>
                            All done!
                        </Typography>
                        <Typography sx={{ color: colors.muted, fontSize: "0.95rem", lineHeight: 1.7, maxWidth: 380, mx: "auto" }}>
                            Your questionnaire has been submitted successfully. We&apos;ll be in touch soon to discuss next steps.
                        </Typography>

                        <SectionDivider color={colors.accent} />

                        {brand && (
                            <Typography sx={{ color: alpha(colors.muted, 0.5), fontSize: "0.75rem", mt: 2 }}>
                                — {brandName}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        );
    }

    /* ================================================================ */
    /* Main render                                                       */
    /* ================================================================ */

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: colors.bg,
                color: colors.text,
                overflowX: "hidden",
                scrollBehavior: "smooth",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
            }}
        >
            {/* ── Sticky Branded Header ──────────────────────────── */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5,
                    "@media print": { display: "none" },
                    py: 1.5,
                    px: 3,
                    backdropFilter: "blur(16px) saturate(1.8)",
                    bgcolor: alpha(colors.card, 0.7),
                    borderBottom: `1px solid ${alpha(colors.border, 0.6)}`,
                    animation: `${fadeIn} 0.5s ease both`,
                }}
            >
                {brand?.logo_url ? (
                    <Box
                        component="img"
                        src={brand.logo_url}
                        alt={brandName}
                        sx={{ height: 28, width: "auto", objectFit: "contain", transition: "transform 0.3s ease", "&:hover": { transform: "scale(1.05)" } }}
                    />
                ) : brandInitial ? (
                    <Box sx={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", lineHeight: 1 }}>{brandInitial}</Typography>
                    </Box>
                ) : null}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.text, letterSpacing: 1, fontSize: "0.8rem", textTransform: "uppercase", flex: 1 }}>
                    {brandName}
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => window.print()}
                    sx={{ color: colors.muted, transition: "color 0.2s", "&:hover": { color: colors.text }, "@media print": { display: "none" } }}
                    aria-label="Save as PDF"
                >
                    <PrintIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* ── Hero Section ───────────────────────────────────── */}
            <Box
                ref={heroReveal.ref}
                sx={{
                    position: "relative",
                    py: { xs: 10, md: 14 },
                    px: 3,
                    textAlign: "center",
                    background: `
                        radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(colors.gradient1, 0.2)} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 50% at 80% 20%, ${alpha(colors.gradient2, 0.12)} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 50% at 20% 80%, ${alpha(colors.gradient1, 0.08)} 0%, transparent 50%),
                        ${colors.bg}
                    `,
                    overflow: "hidden",
                }}
            >
                {/* Floating decorative orbs */}
                <Box sx={{ position: "absolute", top: "5%", right: "8%", width: { xs: 180, md: 320 }, height: { xs: 180, md: 320 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.gradient1, 0.15)} 0%, transparent 70%)`, filter: "blur(60px)", animation: `${float} 8s ease-in-out infinite`, pointerEvents: "none" }} />
                <Box sx={{ position: "absolute", bottom: "0%", left: "5%", width: { xs: 140, md: 240 }, height: { xs: 140, md: 240 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.gradient2, 0.12)} 0%, transparent 70%)`, filter: "blur(50px)", animation: `${float} 10s ease-in-out 1s infinite`, pointerEvents: "none" }} />
                <Box sx={{ position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)", width: { xs: 200, md: 400 }, height: { xs: 200, md: 400 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.accent, 0.06)} 0%, transparent 70%)`, filter: "blur(80px)", animation: `${subtleFloat} 12s ease-in-out 1s infinite`, pointerEvents: "none" }} />

                {/* Animated gradient overlay */}
                <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${alpha(colors.gradient1, 0.04)}, transparent 40%, ${alpha(colors.gradient2, 0.04)})`, backgroundSize: "400% 400%", animation: `${gradientShift} 15s ease infinite`, pointerEvents: "none" }} />

                {/* Ornamental line */}
                <Box sx={{ width: 64, height: 2, background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.5)}, transparent)`, borderRadius: 1, mx: "auto", mb: 5, position: "relative", zIndex: 1, ...revealSx(heroReveal.visible, 0) }} />

                {/* Brand monogram */}
                {brandInitial && (
                    <Box sx={{
                        width: { xs: 72, md: 88 }, height: { xs: 72, md: 88 }, borderRadius: "50%",
                        border: `2px solid ${alpha(colors.accent, 0.2)}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        mx: "auto", mb: 5, position: "relative", zIndex: 1,
                        animation: `${subtleFloat} 6s ease-in-out infinite`,
                        opacity: heroReveal.visible ? 1 : 0,
                        transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s",
                        "&::before": { content: '""', position: "absolute", inset: -6, borderRadius: "50%", border: `1px solid ${alpha(colors.accent, 0.08)}` },
                    }}>
                        {brand?.logo_url ? (
                            <Box component="img" src={brand.logo_url} alt={brandName} sx={{ width: "55%", height: "55%", objectFit: "contain" }} />
                        ) : (
                            <Typography sx={{
                                fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: 300,
                                background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            }}>
                                {brandInitial}
                            </Typography>
                        )}
                    </Box>
                )}

                <Typography
                    variant="h1"
                    sx={{
                        fontWeight: 200, letterSpacing: "-0.03em", position: "relative", zIndex: 1,
                        fontSize: { xs: "2rem", sm: "2.75rem", md: "3.25rem" }, lineHeight: 1.08,
                        background: `linear-gradient(135deg, ${colors.text} 0%, ${alpha(colors.text, 0.6)} 50%, ${colors.text} 100%)`,
                        backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        ...revealSx(heroReveal.visible, 0.1),
                    }}
                >
                    {template.name}
                </Typography>

                {template.description && (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 3, mb: 4, position: "relative", zIndex: 1, ...revealSx(heroReveal.visible, 0.2) }}>
                        <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(colors.muted, 0.3)})` }} />
                        <Typography sx={{ color: colors.muted, fontWeight: 400, fontSize: { xs: "0.9rem", md: "1.05rem" }, letterSpacing: "0.02em", maxWidth: 480 }}>
                            {template.description}
                        </Typography>
                        <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, ${alpha(colors.muted, 0.3)}, transparent)` }} />
                    </Box>
                )}

                {/* Bottom ornamental */}
                <Box sx={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.25)}, transparent)`, borderRadius: 1, mx: "auto", mt: 4, position: "relative", zIndex: 1, ...revealSx(heroReveal.visible, 0.3) }} />
            </Box>

            {/* ── Main Wizard Content ─────────────────────────────── */}
            <Box sx={{ maxWidth: 680, mx: "auto", px: { xs: 2.5, md: 0 }, py: { xs: 5, md: 8 }, display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>

                {/* ── Step indicator ────────────────────────── */}
                <Box sx={cardSx}>
                    <Box sx={{ px: { xs: 3, md: 4 }, pt: { xs: 2.5, md: 3 }, pb: 1 }}>
                        <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700 }}>
                            Progress
                        </Typography>
                    </Box>
                    <Box sx={{ px: { xs: 3, md: 4 }, pb: { xs: 2.5, md: 3 } }}>
                        <Box sx={{
                            display: "flex", alignItems: "center", overflowX: "auto", pb: 1, mt: 1.5,
                            "&::-webkit-scrollbar": { height: 4, display: "block" },
                            "&::-webkit-scrollbar-thumb": { bgcolor: alpha(colors.border, 0.6), borderRadius: 2 },
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
                                                px: 1.5, py: 0.75, borderRadius: "10px",
                                                cursor: isClickable ? "pointer" : "default",
                                                flexShrink: 0, transition: "all 0.2s",
                                                bgcolor: isActive ? alpha(colors.accent, 0.12) : "transparent",
                                                border: `1px solid ${isActive ? alpha(colors.accent, 0.3) : "transparent"}`,
                                                "&:hover": isClickable ? { bgcolor: alpha(colors.text, 0.04) } : {},
                                            }}
                                        >
                                            <Box sx={{
                                                width: 24, height: 24, borderRadius: "50%",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                bgcolor: isActive ? colors.accent : isDone ? alpha("#22c55e", 0.15) : alpha(colors.border, 0.6),
                                                border: `1.5px solid ${isActive ? colors.accent : isDone ? alpha("#22c55e", 0.5) : colors.border}`,
                                                fontSize: "0.65rem", fontWeight: 700,
                                                color: isActive ? "#fff" : isDone ? "#22c55e" : colors.muted,
                                                flexShrink: 0, transition: "all 0.2s",
                                            }}>
                                                {isDone ? <CheckIcon sx={{ fontSize: 12 }} /> : idx + 1}
                                            </Box>
                                            <Typography sx={{
                                                fontSize: "0.78rem", fontWeight: isActive ? 600 : 400,
                                                color: isActive ? colors.text : isDone ? alpha(colors.text, 0.7) : colors.muted,
                                                whiteSpace: "nowrap", transition: "color 0.2s",
                                            }}>
                                                {step.label}
                                            </Typography>
                                        </Box>
                                        {idx < steps.length - 1 && (
                                            <Box sx={{ width: 20, height: 1, mx: 0.25, flexShrink: 0, bgcolor: idx < currentStepIdx ? alpha("#22c55e", 0.4) : alpha(colors.border, 0.5), transition: "background 0.3s" }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </Box>

                        {/* Progress bar */}
                        <Box sx={{ mt: 2, height: 3, borderRadius: 2, bgcolor: alpha(colors.border, 0.5), overflow: "hidden" }}>
                            <Box sx={{
                                height: "100%",
                                width: `${((currentStepIdx + 1) / steps.length) * 100}%`,
                                background: `linear-gradient(90deg, ${colors.gradient1}, ${colors.gradient2})`,
                                borderRadius: 2, transition: "width 0.4s ease",
                            }} />
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
                            <Box>
                                <Typography sx={{ color: colors.text, fontSize: "1.05rem", fontWeight: 600 }}>{currentStep?.label}</Typography>
                                {currentStep?.description && (
                                    <Typography sx={{ color: colors.muted, fontSize: "0.8rem", mt: 0.3 }}>{currentStep.description}</Typography>
                                )}
                            </Box>
                            <Typography sx={{ color: colors.muted, fontSize: "0.75rem" }}>Step {currentStepIdx + 1} of {steps.length}</Typography>
                        </Box>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{
                        bgcolor: alpha("#ef4444", 0.08), color: "#fca5a5",
                        border: `1px solid ${alpha("#ef4444", 0.2)}`, borderRadius: 3,
                        "& .MuiAlert-icon": { color: "#ef4444" },
                    }}>
                        {error}
                    </Alert>
                )}

                {/* ── Step content ─────────────────────────── */}
                <Box sx={{ animation: `${fadeInUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1) both` }} key={currentStepIdx}>
                    {currentStep?.type === "discovery_call" ? (
                        <DiscoveryCallStep responses={responses} onChange={handleChange} colors={colors} fieldSx={fieldSx} cardSx={cardSx} />
                    ) : currentStep?.type === "package_select" ? (
                        <PackageStep
                            packages={packages}
                            selectedPackageId={selectedPackageId}
                            onSelect={setSelectedPackageId}
                            currencySymbol={currencySymbol}
                            selectedEventType={selectedEventType}
                            colors={colors}
                            cardSx={cardSx}
                        />
                    ) : (
                        <Stack spacing={2.5}>
                            {currentStep?.key === "event" && eventTypeOptions.length > 0 && (
                                <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                                    <Typography sx={{ color: colors.accent, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 2 }}>
                                        Event Type
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                        {eventTypeOptions.map((opt) => {
                                            const active = selectedEventType === opt;
                                            return (
                                                <Box
                                                    key={opt}
                                                    onClick={() => { const newVal = active ? null : opt; setSelectedEventType(newVal); handleChange("event_type", newVal ?? ""); }}
                                                    sx={{
                                                        px: 2.5, py: 1.25, borderRadius: "12px", cursor: "pointer",
                                                        border: `1.5px solid ${active ? colors.accent : colors.border}`,
                                                        bgcolor: active ? alpha(colors.accent, 0.12) : alpha(colors.card, 0.5),
                                                        transition: "all 0.2s", display: "flex", alignItems: "center", gap: 1,
                                                        "&:hover": { bgcolor: active ? alpha(colors.accent, 0.12) : alpha(colors.text, 0.04), borderColor: active ? colors.accent : alpha(colors.border, 0.8) },
                                                    }}
                                                >
                                                    {active && <CheckIcon sx={{ fontSize: 14, color: colors.accent }} />}
                                                    <Typography sx={{ color: active ? colors.text : alpha(colors.text, 0.7), fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}>{opt}</Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            {currentQuestions.length === 0 ? (
                                <Box sx={{ ...cardSx, p: 4, textAlign: "center" }}>
                                    <Typography sx={{ color: colors.muted, fontSize: "0.875rem" }}>No questions for this step</Typography>
                                </Box>
                            ) : currentQuestions.map((q, idx) => (
                                <QuestionCard
                                    key={q.field_key || `question_${q.id}`}
                                    question={q}
                                    index={idx}
                                    value={responses[q.field_key || `question_${q.id}`] ?? ""}
                                    error={fieldErrors[q.field_key || `question_${q.id}`]}
                                    onChange={handleChange}
                                    colors={colors}
                                    fieldSx={fieldSx}
                                    cardSx={cardSx}
                                />
                            ))}

                            {currentQuestions.length > 0 && (
                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                    <Typography sx={{ color: colors.muted, fontSize: "0.72rem" }}>
                                        {stepAnsweredCount(currentStep!.key)}/{currentQuestions.length} answered
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </Box>

                <SectionDivider color={colors.accent} />

                {/* ── Navigation ──────────────────────────── */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Button
                        onClick={handleBack} disabled={currentStepIdx === 0}
                        startIcon={<ArrowBackIcon sx={{ fontSize: "0.9rem !important" }} />}
                        sx={{
                            color: colors.muted, fontSize: "0.85rem", textTransform: "none", px: 2.5, py: 1, borderRadius: "12px",
                            border: `1px solid transparent`,
                            "&:hover": { bgcolor: alpha(colors.text, 0.04), color: colors.text, borderColor: alpha(colors.border, 0.5) },
                            "&:disabled": { color: alpha(colors.muted, 0.3) },
                        }}
                    >
                        Back
                    </Button>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            {steps.map((_, idx) => (
                                <Box key={idx} sx={{
                                    width: idx === currentStepIdx ? 18 : 6, height: 6, borderRadius: 3,
                                    bgcolor: idx === currentStepIdx
                                        ? colors.accent
                                        : stepComplete(idx)
                                            ? alpha("#22c55e", 0.5)
                                            : alpha(colors.border, 0.8),
                                    transition: "all 0.25s",
                                }} />
                            ))}
                        </Box>

                        {isLastStep ? (
                            <Button
                                onClick={handleSubmit} disabled={submitting}
                                endIcon={!submitting && <CheckCircleIcon sx={{ fontSize: "0.9rem !important" }} />}
                                sx={{
                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                    color: "#fff", fontWeight: 600, fontSize: "0.85rem",
                                    px: 4, py: 1.25, borderRadius: "12px", textTransform: "none",
                                    boxShadow: `0 4px 20px ${alpha(colors.accent, 0.3)}`,
                                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                    "&:hover": { background: `linear-gradient(135deg, ${colors.gradient2}, ${colors.gradient1})`, transform: "translateY(-1px)", boxShadow: `0 8px 28px ${alpha(colors.accent, 0.4)}` },
                                    "&:disabled": { bgcolor: alpha(colors.text, 0.06), color: alpha(colors.text, 0.2), boxShadow: "none" },
                                }}
                            >
                                {submitting && <CircularProgress size={16} sx={{ color: "inherit", mr: 1 }} />}
                                {submitting ? "Submitting…" : "Submit"}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                endIcon={<ArrowForwardIcon sx={{ fontSize: "0.9rem !important" }} />}
                                sx={{
                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                    color: "#fff", fontWeight: 600, fontSize: "0.85rem",
                                    px: 4, py: 1.25, borderRadius: "12px", textTransform: "none",
                                    boxShadow: `0 4px 20px ${alpha(colors.accent, 0.3)}`,
                                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                    "&:hover": { background: `linear-gradient(135deg, ${colors.gradient2}, ${colors.gradient1})`, transform: "translateY(-1px)", boxShadow: `0 8px 28px ${alpha(colors.accent, 0.4)}` },
                                }}
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── Footer ─────────────────────────────────────────── */}
            {brand && (
                <Box
                    ref={footerReveal.ref}
                    sx={{
                        borderTop: `1px solid ${alpha(colors.border, 0.4)}`,
                        background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${alpha(colors.accent, 0.04)} 0%, ${alpha(colors.card, 0.5)} 70%)`,
                        py: { xs: 6, md: 8 },
                        px: 3,
                        ...revealSx(footerReveal.visible, 0),
                    }}
                >
                    <Box sx={{ maxWidth: 680, mx: "auto" }}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={4}>
                            <Box>
                                {brand.logo_url ? (
                                    <Box component="img" src={brand.logo_url} alt={brandName} sx={{ height: 24, width: "auto", objectFit: "contain", mb: 1.5, opacity: 0.8 }} />
                                ) : brandInitial ? (
                                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5, opacity: 0.8 }}>
                                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", lineHeight: 1 }}>{brandInitial}</Typography>
                                    </Box>
                                ) : null}
                                <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.95rem", mb: 0.75 }}>{brandName}</Typography>
                                {brand.description && (
                                    <Typography sx={{ color: colors.muted, maxWidth: 280, fontSize: "0.82rem", lineHeight: 1.6 }}>{brand.description}</Typography>
                                )}
                                {brand.website && (
                                    <IconButton size="small" component="a" href={brand.website} target="_blank" rel="noopener noreferrer" sx={{ color: colors.muted, mt: 1.5, transition: "color 0.2s ease, transform 0.2s ease", "&:hover": { color: colors.accent, transform: "scale(1.1)" } }}>
                                        <LanguageIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                )}
                            </Box>

                            <Box>
                                <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, display: "block", mb: 2, fontSize: "0.6rem" }}>
                                    Get in Touch
                                </Typography>
                                <Stack spacing={1.5}>
                                    {brand.email && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <EmailIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6) }} />
                                            <Typography component="a" href={`mailto:${brand.email}`} sx={{ color: colors.muted, textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s ease", "&:hover": { color: colors.accent } }}>
                                                {brand.email}
                                            </Typography>
                                        </Box>
                                    )}
                                    {brand.phone && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <PhoneIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6) }} />
                                            <Typography component="a" href={`tel:${brand.phone}`} sx={{ color: colors.muted, textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s ease", "&:hover": { color: colors.accent } }}>
                                                {brand.phone}
                                            </Typography>
                                        </Box>
                                    )}
                                    {brand.address_line1 && (
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                            <LocationOnIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6), mt: 0.15 }} />
                                            <Typography sx={{ color: colors.muted, fontSize: "0.85rem" }}>
                                                {brand.address_line1}
                                                {brand.city && `, ${brand.city}`}
                                                {brand.state && `, ${brand.state}`}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>

                        <Divider sx={{ borderColor: alpha(colors.border, 0.3), mt: 4, mb: 3 }} />
                        <Typography sx={{ color: alpha(colors.muted, 0.4), textAlign: "center", fontSize: "0.68rem", letterSpacing: 0.5 }}>
                            &copy; {new Date().getFullYear()} {brandName}. Sent with ProjectFlo.
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

/* ================================================================== */
/* Question Card                                                       */
/* ================================================================== */

function QuestionCard({
    question: q,
    index: idx,
    value: val,
    error: err,
    onChange,
    colors,
    fieldSx,
    cardSx,
}: {
    question: NAQuestion;
    index: number;
    value: unknown;
    error?: string;
    onChange: (key: string, value: unknown) => void;
    colors: ReturnType<typeof getColors>;
    fieldSx: object;
    cardSx: object;
}) {
    const key = q.field_key || `question_${q.id}`;
    const isFilled = val !== "" && val !== null && val !== undefined && !(Array.isArray(val) && val.length === 0);
    const opts: string[] = (q.options as AnyRecord)?.values ?? [];

    return (
        <Box sx={{
            ...cardSx,
            p: { xs: 3, md: 3.5 },
            borderColor: isFilled ? alpha(colors.accent, 0.25) : undefined,
            bgcolor: isFilled ? alpha(colors.accent, 0.06) : alpha(colors.card, 0.7),
            animation: `${fadeInUp} 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.06}s both`,
        }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{
                    width: 28, height: 28, borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: isFilled ? colors.accent : alpha(colors.border, 0.5),
                    color: isFilled ? "#fff" : colors.muted,
                    fontSize: "0.68rem", fontWeight: 700, transition: "all 0.2s", flexShrink: 0,
                }}>
                    {isFilled ? <CheckIcon sx={{ fontSize: 14 }} /> : idx + 1}
                </Box>
                <Typography sx={{ color: alpha(colors.text, 0.9), fontSize: "0.9rem", fontWeight: 500, flex: 1 }}>
                    {q.prompt}
                    {q.required && <Box component="span" sx={{ color: "#ef4444", ml: 0.5 }}>*</Box>}
                </Typography>
            </Box>

            {q.help_text && (
                <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mb: 1.5, lineHeight: 1.5 }}>{q.help_text}</Typography>
            )}

            {/* Preferred contact time → chip-toggle */}
            {(key === "preferred_contact_time" || key.toLowerCase().includes("contact_time")) ? (
                <Box>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {CONTACT_TIME_OPTIONS.map((opt) => {
                            const selected = val === opt;
                            return (
                                <Chip key={opt} label={opt} size="small"
                                    onClick={() => onChange(key, selected ? "" : opt)}
                                    sx={{
                                        fontSize: "0.78rem", height: 32, cursor: "pointer",
                                        color: selected ? colors.text : colors.muted,
                                        bgcolor: selected ? alpha(colors.accent, 0.15) : alpha(colors.text, 0.04),
                                        border: `1px solid ${selected ? alpha(colors.accent, 0.4) : alpha(colors.border, 0.5)}`,
                                        "& .MuiChip-label": { px: 1.5 },
                                        "&:hover": { bgcolor: selected ? alpha(colors.accent, 0.2) : alpha(colors.text, 0.07) },
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
                        {opts.map((opt) => {
                            const selected = Array.isArray(val) && val.includes(opt);
                            return (
                                <Chip key={opt} label={opt} size="small"
                                    onClick={() => {
                                        const cur: string[] = Array.isArray(val) ? val : [];
                                        onChange(key, selected ? cur.filter((x) => x !== opt) : [...cur, opt]);
                                    }}
                                    sx={{
                                        fontSize: "0.78rem", height: 32, cursor: "pointer",
                                        color: selected ? colors.text : colors.muted,
                                        bgcolor: selected ? alpha(colors.accent, 0.15) : alpha(colors.text, 0.04),
                                        border: `1px solid ${selected ? alpha(colors.accent, 0.4) : alpha(colors.border, 0.5)}`,
                                        "& .MuiChip-label": { px: 1.5 },
                                        "&:hover": { bgcolor: selected ? alpha(colors.accent, 0.2) : alpha(colors.text, 0.07) },
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
                        value={(val as string) || ""} displayEmpty
                        onChange={(e) => onChange(key, e.target.value)}
                        sx={{
                            color: colors.text, borderRadius: "12px", fontSize: "0.9rem",
                            bgcolor: alpha(colors.card, 0.5),
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(colors.border, 0.6) },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(colors.accent, 0.4) },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent, borderWidth: "1.5px" },
                            "& .MuiSvgIcon-root": { color: colors.muted },
                        }}
                        MenuProps={{ PaperProps: { sx: {
                            bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", mt: 0.5,
                            "& .MuiMenuItem-root": { color: alpha(colors.text, 0.8), fontSize: "0.875rem", "&:hover": { bgcolor: alpha(colors.accent, 0.1) }, "&.Mui-selected": { bgcolor: alpha(colors.accent, 0.12), color: colors.text } },
                        }}}}
                    >
                        <MenuItem value="" disabled sx={{ color: colors.muted, fontSize: "0.875rem" }}>Select an option</MenuItem>
                        {opts.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </Select>
                    {err && <Typography sx={{ color: "#ef4444", fontSize: "0.72rem", mt: 0.5 }}>{err}</Typography>}
                </FormControl>
            ) : q.field_type === "textarea" ? (
                <TextField
                    value={val} multiline rows={3} placeholder={q.prompt}
                    onChange={(e) => onChange(key, e.target.value)}
                    required={Boolean(q.required)} error={Boolean(err)} helperText={err}
                    fullWidth sx={fieldSx}
                />
            ) : (
                <TextField
                    value={val} placeholder={q.field_type === "date" ? undefined : q.prompt}
                    onChange={(e) => onChange(key, e.target.value)}
                    type={q.field_type === "date" ? "date" : q.field_type === "email" ? "email" : "text"}
                    required={Boolean(q.required)} error={Boolean(err)} helperText={err}
                    fullWidth InputLabelProps={q.field_type === "date" ? { shrink: true } : undefined}
                    sx={fieldSx}
                />
            )}
        </Box>
    );
}

/* ================================================================== */
/* Discovery Call Step                                                 */
/* ================================================================== */

function DiscoveryCallStep({
    responses,
    onChange,
    colors,
    fieldSx,
    cardSx,
}: {
    responses: AnyRecord;
    onChange: (key: string, val: unknown) => void;
    colors: ReturnType<typeof getColors>;
    fieldSx: object;
    cardSx: object;
}) {
    const CALL_METHODS = [
        { key: "Phone Call", emoji: "📞" },
        { key: "Video Call", emoji: "🎥" },
    ];

    return (
        <Stack spacing={2.5}>
            <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                <Typography sx={{ color: colors.accent, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 2 }}>
                    Call Method
                </Typography>
                <Typography sx={{ color: alpha(colors.text, 0.8), fontWeight: 500, mb: 2.5, fontSize: "0.9rem" }}>
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
                                    flex: 1, p: 3, borderRadius: "16px", cursor: "pointer", textAlign: "center",
                                    border: `1.5px solid ${active ? colors.accent : colors.border}`,
                                    bgcolor: active ? alpha(colors.accent, 0.1) : alpha(colors.card, 0.5),
                                    transition: "all 0.2s",
                                    "&:hover": { borderColor: colors.accent, bgcolor: alpha(colors.accent, 0.08) },
                                }}
                            >
                                <Typography sx={{ fontSize: "2rem", mb: 1 }}>{emoji}</Typography>
                                <Typography sx={{ color: active ? colors.text : alpha(colors.text, 0.7), fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}>
                                    {key}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                <Typography sx={{ color: colors.accent, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 2 }}>
                    Preferred Date
                </Typography>
                <TextField
                    type="date"
                    value={responses.discovery_call_date || ""}
                    onChange={(e) => onChange("discovery_call_date", e.target.value)}
                    fullWidth sx={fieldSx}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split("T")[0] }}
                />
            </Box>

            <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                <Typography sx={{ color: colors.accent, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 2 }}>
                    Preferred Time
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {CONTACT_TIME_OPTIONS.map((opt) => {
                        const sel = responses.discovery_call_time === opt;
                        return (
                            <Chip key={opt} label={opt} size="small"
                                onClick={() => onChange("discovery_call_time", sel ? "" : opt)}
                                sx={{
                                    cursor: "pointer", fontSize: "0.78rem", height: 32,
                                    color: sel ? colors.text : colors.muted,
                                    bgcolor: sel ? alpha(colors.accent, 0.15) : alpha(colors.text, 0.04),
                                    border: `1px solid ${sel ? alpha(colors.accent, 0.4) : alpha(colors.border, 0.5)}`,
                                    "& .MuiChip-label": { px: 1.5 },
                                    "&:hover": { bgcolor: sel ? alpha(colors.accent, 0.2) : alpha(colors.text, 0.07) },
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

/* ================================================================== */
/* Package Selection Step                                              */
/* ================================================================== */

function PackageStep({
    packages,
    selectedPackageId,
    onSelect,
    currencySymbol,
    selectedEventType,
    colors,
    cardSx,
}: {
    packages: PackageData[];
    selectedPackageId: number | null;
    onSelect: (id: number | null) => void;
    currencySymbol: string;
    selectedEventType: string | null;
    colors: ReturnType<typeof getColors>;
    cardSx: object;
}) {
    return (
        <Stack spacing={2.5}>
            {selectedEventType && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ color: colors.muted, fontSize: "0.78rem" }}>Showing packages for</Typography>
                    <Box sx={{ px: 1.25, py: 0.3, borderRadius: "8px", bgcolor: alpha(colors.accent, 0.12), border: `1px solid ${alpha(colors.accent, 0.3)}` }}>
                        <Typography sx={{ color: colors.text, fontSize: "0.75rem", fontWeight: 600 }}>{selectedEventType}</Typography>
                    </Box>
                </Box>
            )}

            {/* Decide later */}
            <Box
                onClick={() => onSelect(null)}
                sx={{
                    ...cardSx,
                    p: 3, cursor: "pointer",
                    borderColor: selectedPackageId === null ? alpha(colors.accent, 0.3) : undefined,
                    bgcolor: selectedPackageId === null ? alpha(colors.accent, 0.08) : alpha(colors.card, 0.7),
                    display: "flex", alignItems: "center", gap: 2,
                }}
            >
                <Box sx={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: `2px solid ${selectedPackageId === null ? colors.accent : colors.border}`,
                    bgcolor: selectedPackageId === null ? colors.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    {selectedPackageId === null && <Box sx={{ width: 8, height: 8, bgcolor: "#fff", borderRadius: "50%" }} />}
                </Box>
                <Box>
                    <Typography sx={{ color: alpha(colors.text, 0.9), fontSize: "0.875rem", fontWeight: 500 }}>Decide later</Typography>
                    <Typography sx={{ color: colors.muted, fontSize: "0.72rem", mt: 0.2 }}>Skip for now — you can discuss packages with us directly</Typography>
                </Box>
            </Box>

            {/* Package cards */}
            {packages.length === 0 ? (
                <Box sx={{ ...cardSx, p: 3, textAlign: "center" }}>
                    <Typography sx={{ color: colors.muted, fontSize: "0.875rem" }}>
                        {selectedEventType ? `No packages available for ${selectedEventType} events` : "No packages available at the moment"}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
                    {packages.map((pkg) => {
                        const isSelected = selectedPackageId === pkg.id;
                        const itemCount = pkg.contents?.items?.length ?? 0;
                        const price = pkg.base_price ?? pkg.price;

                        return (
                            <Box
                                key={pkg.id}
                                onClick={() => onSelect(pkg.id)}
                                sx={{
                                    ...cardSx,
                                    p: 3, cursor: "pointer",
                                    borderColor: isSelected ? alpha(colors.accent, 0.3) : undefined,
                                    bgcolor: isSelected ? alpha(colors.accent, 0.08) : alpha(colors.card, 0.7),
                                    display: "flex", flexDirection: "column", gap: 1.5,
                                    position: "relative", overflow: "hidden",
                                }}
                            >
                                {isSelected && (
                                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${colors.gradient1}, ${colors.gradient2})` }} />
                                )}

                                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                                    <Typography sx={{ color: isSelected ? colors.text : alpha(colors.text, 0.9), fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                                        {pkg.name}
                                    </Typography>
                                    <Box sx={{
                                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, mt: 0.15,
                                        border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                                        bgcolor: isSelected ? colors.accent : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {isSelected && <Box sx={{ width: 7, height: 7, bgcolor: "#fff", borderRadius: "50%" }} />}
                                    </Box>
                                </Box>

                                {price != null && (
                                    <Typography sx={{
                                        background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                        backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                        fontSize: "1.35rem", fontWeight: 700, lineHeight: 1,
                                    }}>
                                        {currencySymbol}{Number(price).toLocaleString()}
                                    </Typography>
                                )}

                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                    {pkg.category && (
                                        <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: alpha("#a855f7", 0.1), border: `1px solid ${alpha("#a855f7", 0.3)}` }}>
                                            <Typography sx={{ color: "#c084fc", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{pkg.category}</Typography>
                                        </Box>
                                    )}
                                    {itemCount > 0 && (
                                        <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: alpha("#22c55e", 0.08), border: `1px solid ${alpha("#22c55e", 0.25)}` }}>
                                            <Typography sx={{ color: "#34d399", fontSize: "0.68rem", fontWeight: 600 }}>{itemCount} {itemCount === 1 ? "item" : "items"} included</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {pkg.description && (
                                    <Typography sx={{ color: colors.muted, fontSize: "0.775rem", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {pkg.description}
                                    </Typography>
                                )}

                                {itemCount > 0 && (
                                    <Stack spacing={0.4} sx={{ mt: 0.5 }}>
                                        {pkg.contents!.items!.slice(0, 3).map((item, i) => (
                                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: isSelected ? colors.accent : alpha(colors.border, 0.8), flexShrink: 0 }} />
                                                <Typography sx={{ color: colors.muted, fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                        ))}
                                        {itemCount > 3 && (
                                            <Typography sx={{ color: colors.muted, fontSize: "0.68rem", opacity: 0.6, pl: 1.5 }}>+ {itemCount - 3} more</Typography>
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
