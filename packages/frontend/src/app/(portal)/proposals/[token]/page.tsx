"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    Divider,
    TextField,
    CircularProgress,
    Chip,
    Alert,
    IconButton,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    Place as PlaceIcon,
    CalendarToday as CalendarIcon,
    AccessTime as AccessTimeIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationOnIcon,
    Language as LanguageIcon,
    Close as CloseIcon,
    Videocam as VideocamIcon,
    Person as PersonIcon,
    Groups as GroupsIcon,
    Print as PrintIcon,
} from "@mui/icons-material";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { computeTaxBreakdown } from "@/lib/utils/pricing";

/* ------------------------------------------------------------------ */
/* Keyframe animations                                                 */
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

const pulseGlow = keyframes`
    0%, 100% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0.3); }
    50%      { box-shadow: 0 0 24px 4px rgba(124, 77, 255, 0.15); }
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
/* Types for the public proposal response                             */
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
    address_line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    logo_url: string | null;
}

interface PublicContact {
    first_name: string;
    last_name: string;
    email: string;
}

interface EstimateItem {
    id: number;
    category: string | null;
    description: string;
    quantity: string;
    unit: string | null;
    unit_price: string;
}

interface PublicEstimate {
    id: number;
    estimate_number: string;
    title: string | null;
    total_amount: string;
    tax_rate: string | null;
    deposit_required: string | null;
    notes: string | null;
    terms: string | null;
    items: EstimateItem[];
}

interface PackageItem {
    description: string;
    price: number;
    type?: string;
}

interface PublicPackage {
    id: number;
    name: string;
    description: string | null;
    base_price: string;
    currency: string;
    contents?: {
        items?: PackageItem[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    } | null;
}

interface PublicMoment {
    id: number;
    name: string;
    order_index: number;
    duration_seconds: number;
    is_required: boolean;
}

interface PublicActivity {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    order_index: number;
    notes: string | null;
    moments: PublicMoment[];
}

interface PublicSubject {
    id: number;
    name: string;
    real_name: string | null;
    count: number | null;
    category: string;
    order_index: number;
}

interface PublicLocationSlot {
    id: number;
    name: string | null;
    address: string | null;
    order_index: number;
    location: {
        name: string;
        address_line1: string | null;
        city: string | null;
        state: string | null;
    } | null;
}

interface PublicEventDay {
    id: number;
    name: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    order_index: number;
    activities: PublicActivity[];
    subjects: PublicSubject[];
    location_slots: PublicLocationSlot[];
}

interface PublicFilm {
    id: number;
    order_index: number;
    film: {
        id: number;
        name: string;
        film_type: string;
        target_duration_min: number | null;
        target_duration_max: number | null;
    };
}

interface PublicInquiry {
    id: number;
    wedding_date: string | null;
    venue_details: string | null;
    venue_address: string | null;
    contact: PublicContact;
    estimates: PublicEstimate[];
    selected_package: PublicPackage | null;
    schedule_event_days: PublicEventDay[];
    schedule_films: PublicFilm[];
}

interface ProposalSection {
    id: string;
    type: string;
    isVisible: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>;
}

interface ProposalContent {
    theme?: string;
    meta?: {
        personalVideoUrl?: string;
        expirationDate?: string;
        customCss?: string;
    };
    sections?: ProposalSection[];
}

interface PublicProposal {
    id: number;
    title: string;
    status: string;
    content: ProposalContent | null;
    sent_at: string | null;
    client_response: string | null;
    client_response_at: string | null;
    client_response_message: string | null;
    inquiry: PublicInquiry;
    brand: PublicBrand | null;
}

/* ------------------------------------------------------------------ */
/* Helper functions                                                    */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getDaysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: string | number, currency = "USD"): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(num);
}

/** XSS-safe HTML sanitizer (SSR-compatible) */
function sanitizeHtml(dirty: string): string {
    if (typeof window === "undefined") return dirty;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("dompurify");
    return DOMPurify.sanitize(dirty);
}

function getThemeColors(theme?: string) {
    switch (theme) {
        case "minimal-light":
            return {
                bg: "#fafafa", card: "#ffffff", text: "#1a1a1a", muted: "#71717a",
                accent: "#18181b", border: "#e4e4e7", accentSoft: "#f4f4f5",
                gradient1: "#e4e4e7", gradient2: "#d4d4d8",
            };
        case "classic-elegant":
            return {
                bg: "#faf8f4", card: "#ffffff", text: "#292524", muted: "#78716c",
                accent: "#92400e", border: "#e7e5e4", accentSoft: "#fef3c7",
                gradient1: "#fde68a", gradient2: "#f59e0b",
            };
        case "modern-clean":
            return {
                bg: "#f8fafc", card: "#ffffff", text: "#0f172a", muted: "#64748b",
                accent: "#3b82f6", border: "#e2e8f0", accentSoft: "#eff6ff",
                gradient1: "#93c5fd", gradient2: "#3b82f6",
            };
        case "cinematic-dark":
        default:
            return {
                bg: "#09090b", card: "#18181b", text: "#fafafa", muted: "#a1a1aa",
                accent: "#7c4dff", border: "#27272a", accentSoft: "#1e1b4b",
                gradient1: "#7c4dff", gradient2: "#a855f7",
            };
    }
}

/* ------------------------------------------------------------------ */
/* Scroll-reveal hook                                                  */
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

/* Shorthand for reveal animation sx */
function revealSx(visible: boolean, delay = 0) {
    return {
        opacity: visible ? 1 : 0,
        animation: visible ? `${fadeInUp} 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both` : "none",
    };
}

/* ================================================================== */
/* Sub-components                                                      */
/* ================================================================== */

/** Thin ornamental divider between sections */
function SectionDivider({ color }: { color: string }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 2 }}>
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(color, 0.3)})`, borderRadius: 1 }} />
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: alpha(color, 0.15), border: `1px solid ${alpha(color, 0.1)}` }} />
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, ${alpha(color, 0.3)}, transparent)`, borderRadius: 1 }} />
        </Box>
    );
}

/** Scroll-reveal wrapper – each instance gets its own IntersectionObserver */
function RevealBox({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, visible } = useReveal();
    return (
        <Box ref={ref} sx={revealSx(visible, delay)}>
            {children}
        </Box>
    );
}

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */

export default function PublicProposalPage() {
    const params = useParams();
    const token = params.token as string;

    const [proposal, setProposal] = useState<PublicProposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showChangesForm, setShowChangesForm] = useState(false);
    const [changesMessage, setChangesMessage] = useState("");
    const [responding, setResponding] = useState(false);
    const [responseSuccess, setResponseSuccess] = useState<string | null>(null);

    /* -- reveal refs -- */
    const heroReveal = useReveal();
    const ctaReveal = useReveal();
    const footerReveal = useReveal();

    const fetchProposal = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.publicProposals.getByShareToken(token);
            setProposal(data);
        } catch {
            setError("This proposal could not be found or may have expired.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchProposal();
    }, [token, fetchProposal]);

    const handleAccept = async () => {
        if (!proposal) return;
        try {
            setResponding(true);
            await api.publicProposals.respond(token, "Accepted");
            setResponseSuccess("accepted");
            setProposal((p) => p ? { ...p, client_response: "Accepted", status: "Accepted" } : p);
        } catch {
            setError("Failed to accept proposal. Please try again.");
        } finally {
            setResponding(false);
        }
    };

    const handleRequestChanges = async () => {
        if (!proposal) return;
        try {
            setResponding(true);
            await api.publicProposals.respond(token, "ChangesRequested", changesMessage);
            setResponseSuccess("changes");
            setShowChangesForm(false);
            setProposal((p) =>
                p ? { ...p, client_response: "ChangesRequested", client_response_message: changesMessage } : p,
            );
        } catch {
            setError("Failed to send your request. Please try again.");
        } finally {
            setResponding(false);
        }
    };

    /* ── Loading ─────────────────────────────────────────── */

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#09090b",
                    gap: 3,
                }}
            >
                {/* Animated skeleton bars */}
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

    if (error && !proposal) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#09090b",
                    p: 3,
                }}
            >
                <Box
                    sx={{
                        p: 5,
                        maxWidth: 420,
                        textAlign: "center",
                        bgcolor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: 3,
                        animation: `${scaleIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
                    }}
                >
                    <Typography variant="h6" sx={{ color: "#fafafa", mb: 1, fontWeight: 600 }}>
                        Proposal Not Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#a1a1aa", lineHeight: 1.6 }}>
                        {error}
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (!proposal) return null;

    /* ── Derived data ────────────────────────────────────── */

    const content = proposal.content;
    const colors = getThemeColors(content?.theme);
    const inquiry = proposal.inquiry;
    const contact = inquiry.contact;
    const brand = proposal.brand;
    const estimate = inquiry.estimates?.[0];
    const pkg = inquiry.selected_package;
    const clientName = `${contact.first_name} ${contact.last_name}`;
    const daysUntil = getDaysUntil(inquiry.wedding_date);
    const currency = pkg?.currency || "USD";
    const alreadyResponded = !!proposal.client_response;
    const isDark = !content?.theme || content.theme === "cinematic-dark";

    const textSection = content?.sections?.find((s) => s.type === "text" && s.isVisible);
    const personalMessage = textSection?.data?.blocks?.[0]?.data?.text;

    const heroSection = content?.sections?.find((s) => s.type === "hero" && s.isVisible);
    const heroTitle = (heroSection?.data?.title || `${clientName}'s Wedding`) as string;
    const heroSubtitle = (
        heroSection?.data?.subtitle || heroSection?.data?.date || formatDate(inquiry.wedding_date)
    ) as string;

    const brandName = brand?.display_name || brand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();

    // Schedule data
    const eventDays = inquiry.schedule_event_days || [];
    const films = inquiry.schedule_films || [];
    const allSubjects = eventDays.flatMap((d) => d.subjects || []);
    // Dedupe subjects by name
    const uniqueSubjects = allSubjects.filter(
        (s, i, arr) => arr.findIndex((x) => x.name === s.name) === i,
    );
    const allLocations = eventDays.flatMap((d) => d.location_slots || []);
    const uniqueLocations = allLocations.filter(
        (l, i, arr) => arr.findIndex((x) => (x.name || x.location?.name) === (l.name || l.location?.name)) === i,
    );

    /* shared card style */
    const cardSx = {
        bgcolor: isDark ? alpha(colors.card, 0.7) : colors.card,
        backdropFilter: isDark ? "blur(20px) saturate(1.5)" : "none",
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
            boxShadow: `0 12px 40px ${alpha(colors.accent, isDark ? 0.1 : 0.06)}, 0 4px 12px ${alpha("#000", isDark ? 0.2 : 0.04)}`,
            transform: "translateY(-2px)",
            "&::before": { opacity: 1 },
        },
    };

    /** Check whether a section type is visible according to builder config */
    const isSectionVisible = (type: string): boolean => {
        if (!content?.sections?.length) return true;
        const s = content.sections.find((x) => x.type === type);
        return s ? s.isVisible : true;
    };

    /** Get custom section title from builder, falling back to default */
    const getSectionTitle = (type: string, fallback: string): string => {
        const s = content?.sections?.find((x) => x.type === type);
        return (s?.data?.title as string) || fallback;
    };

    /* ================================================================ */
    /* Render                                                           */
    /* ================================================================ */

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: colors.bg,
                color: colors.text,
                overflowX: "hidden",
                /* Smooth-scroll for in-page links */
                scrollBehavior: "smooth",
                /* Base font smoothing */
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
            }}
        >
            {/* ── Sticky Branded Header ────────────────────────────── */}
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
                    bgcolor: alpha(colors.card, isDark ? 0.7 : 0.85),
                    borderBottom: `1px solid ${alpha(colors.border, 0.6)}`,
                    animation: `${fadeIn} 0.5s ease both`,
                }}
            >
                {brand?.logo_url ? (
                    <Box
                        component="img"
                        src={brand.logo_url}
                        alt={brandName}
                        sx={{
                            height: 28,
                            width: "auto",
                            objectFit: "contain",
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "scale(1.05)" },
                        }}
                    />
                ) : brandInitial ? (
                    <Box
                        sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", lineHeight: 1 }}>
                            {brandInitial}
                        </Typography>
                    </Box>
                ) : null}
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 600,
                        color: colors.text,
                        letterSpacing: 1,
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        flex: 1,
                    }}
                >
                    {brandName}
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => window.print()}
                    sx={{
                        color: colors.muted,
                        transition: "color 0.2s",
                        "&:hover": { color: colors.text },
                        "@media print": { display: "none" },
                    }}
                    aria-label="Save as PDF"
                >
                    <PrintIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* ── Hero Section ─────────────────────────────────────── */}
            <Box
                ref={heroReveal.ref}
                sx={{
                    position: "relative",
                    py: { xs: 14, md: 22 },
                    px: 3,
                    textAlign: "center",
                    background: `
                        radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(colors.gradient1, isDark ? 0.2 : 0.1)} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 50% at 80% 20%, ${alpha(colors.gradient2, isDark ? 0.12 : 0.06)} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 50% at 20% 80%, ${alpha(colors.gradient1, isDark ? 0.08 : 0.04)} 0%, transparent 50%),
                        ${colors.bg}
                    `,
                    overflow: "hidden",
                }}
            >
                {/* Floating decorative orbs */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "5%",
                        right: "8%",
                        width: { xs: 180, md: 320 },
                        height: { xs: 180, md: 320 },
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${alpha(colors.gradient1, isDark ? 0.15 : 0.08)} 0%, transparent 70%)`,
                        filter: "blur(60px)",
                        animation: `${float} 8s ease-in-out infinite`,
                        pointerEvents: "none",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: "0%",
                        left: "5%",
                        width: { xs: 140, md: 240 },
                        height: { xs: 140, md: 240 },
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${alpha(colors.gradient2, isDark ? 0.12 : 0.06)} 0%, transparent 70%)`,
                        filter: "blur(50px)",
                        animation: `${float} 10s ease-in-out 1s infinite`,
                        pointerEvents: "none",
                    }}
                />

                {/* Center glow */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "40%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: { xs: 200, md: 400 },
                        height: { xs: 200, md: 400 },
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${alpha(colors.accent, isDark ? 0.06 : 0.03)} 0%, transparent 70%)`,
                        filter: "blur(80px)",
                        animation: `${subtleFloat} 12s ease-in-out 1s infinite`,
                        pointerEvents: "none",
                    }}
                />

                {/* Animated gradient overlay */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(135deg, ${alpha(colors.gradient1, 0.04)}, transparent 40%, ${alpha(colors.gradient2, 0.04)})`,
                        backgroundSize: "400% 400%",
                        animation: `${gradientShift} 15s ease infinite`,
                        pointerEvents: "none",
                    }}
                />

                {/* Ornamental line */}
                <Box
                    sx={{
                        width: 64,
                        height: 2,
                        background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.5)}, transparent)`,
                        borderRadius: 1,
                        mx: "auto",
                        mb: 5,
                        position: "relative",
                        zIndex: 1,
                        ...revealSx(heroReveal.visible, 0),
                    }}
                />

                {/* Monogram circle */}
                {brandInitial && (
                    <Box
                        sx={{
                            width: { xs: 72, md: 88 },
                            height: { xs: 72, md: 88 },
                            borderRadius: "50%",
                            border: `2px solid ${alpha(colors.accent, 0.2)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 5,
                            position: "relative",
                            zIndex: 1,
                            animation: `${subtleFloat} 6s ease-in-out infinite`,
                            opacity: heroReveal.visible ? 1 : 0,
                            transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: -6,
                                borderRadius: "50%",
                                border: `1px solid ${alpha(colors.accent, 0.08)}`,
                            },
                        }}
                    >
                        {brand?.logo_url ? (
                            <Box
                                component="img"
                                src={brand.logo_url}
                                alt={brandName}
                                sx={{ width: "55%", height: "55%", objectFit: "contain" }}
                            />
                        ) : (
                            <Typography
                                sx={{
                                    fontSize: { xs: "1.5rem", md: "2rem" },
                                    fontWeight: 300,
                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                {brandInitial}
                            </Typography>
                        )}
                    </Box>
                )}

                <Typography
                    variant="h1"
                    sx={{
                        fontWeight: 200,
                        letterSpacing: "-0.03em",
                        position: "relative",
                        zIndex: 1,
                        fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem" },
                        lineHeight: 1.08,
                        ...(isDark ? {
                            background: `linear-gradient(135deg, ${colors.text} 0%, ${alpha(colors.text, 0.6)} 50%, ${colors.text} 100%)`,
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        } : { color: colors.text }),
                        ...revealSx(heroReveal.visible, 0.1),
                    }}
                >
                    {heroTitle}
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                        mt: 3,
                        mb: 4,
                        position: "relative",
                        zIndex: 1,
                        ...revealSx(heroReveal.visible, 0.2),
                    }}
                >
                    <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(colors.muted, 0.3)})` }} />
                    <Typography
                        sx={{
                            color: colors.muted,
                            fontWeight: 400,
                            fontSize: { xs: "0.95rem", md: "1.15rem" },
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        {heroSubtitle}
                    </Typography>
                    <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, ${alpha(colors.muted, 0.3)}, transparent)` }} />
                </Box>

                {daysUntil !== null && daysUntil > 0 && (
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 2.5,
                            py: 0.75,
                            borderRadius: 10,
                            bgcolor: alpha(colors.accent, isDark ? 0.1 : 0.06),
                            border: `1px solid ${alpha(colors.accent, 0.15)}`,
                            position: "relative",
                            zIndex: 1,
                            animation: `${pulseGlow} 4s ease-in-out infinite`,
                            opacity: heroReveal.visible ? 1 : 0,
                            transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
                        }}
                    >
                        <AccessTimeIcon sx={{ fontSize: 16, color: colors.accent }} />
                        <Typography sx={{ color: colors.accent, fontWeight: 600, fontSize: "0.85rem", letterSpacing: 0.5 }}>
                            {daysUntil} days to go
                        </Typography>
                    </Box>
                )}

                {/* Bottom ornamental */}
                <Box
                    sx={{
                        width: 48,
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.25)}, transparent)`,
                        borderRadius: 1,
                        mx: "auto",
                        mt: 6,
                        position: "relative",
                        zIndex: 1,
                        ...revealSx(heroReveal.visible, 0.35),
                    }}
                />
            </Box>

            {/* ── Main Content ─────────────────────────────────────── */}
            <Box
                sx={{
                    maxWidth: 680,
                    mx: "auto",
                    px: { xs: 2.5, md: 0 },
                    py: { xs: 5, md: 8 },
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 5, md: 7 },
                }}
            >

                {/* Already responded banner */}
                {alreadyResponded && (
                    <Alert
                        severity={proposal.client_response === "Accepted" ? "success" : "info"}
                        sx={{
                            bgcolor: alpha(proposal.client_response === "Accepted" ? "#22c55e" : colors.accent, isDark ? 0.1 : 0.06),
                            color: colors.text,
                            border: `1px solid ${alpha(proposal.client_response === "Accepted" ? "#22c55e" : colors.accent, 0.2)}`,
                            borderRadius: 3,
                            animation: `${scaleIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
                            "& .MuiAlert-icon": { color: proposal.client_response === "Accepted" ? "#22c55e" : colors.accent },
                        }}
                        icon={
                            proposal.client_response === "Accepted"
                                ? <CheckCircleIcon />
                                : <EditIcon />
                        }
                    >
                        {proposal.client_response === "Accepted"
                            ? "You've accepted this proposal. We'll be in touch soon!"
                            : "You've requested changes. We'll review your feedback and get back to you."}
                    </Alert>
                )}

                {/* Error alert */}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ borderRadius: 3, animation: `${scaleIn} 0.3s ease both` }}
                    >
                        {error}
                    </Alert>
                )}

                {/* ── Personal Message ──────────────────────────────── */}
                {isSectionVisible('text') && personalMessage && (
                    <RevealBox>
                        <Box
                            sx={{
                                ...cardSx,
                                p: { xs: 3.5, md: 5 },
                                position: "relative",
                            }}
                        >
                            {/* Accent bar */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 3,
                                    borderRadius: "3px 0 0 3px",
                                    background: `linear-gradient(180deg, ${colors.gradient1}, ${colors.gradient2})`,
                                }}
                            />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: colors.text,
                                    lineHeight: 1.85,
                                    fontStyle: "italic",
                                    fontSize: { xs: "1rem", md: "1.08rem" },
                                    "& p": { margin: 0 },
                                }}
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(personalMessage) }}
                            />
                            {brand && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: colors.muted,
                                        mt: 2.5,
                                        fontWeight: 500,
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    — {brand.display_name || brand.name}
                                </Typography>
                            )}
                        </Box>
                    </RevealBox>
                )}

                {/* ── Event Details ─────────────────────────────────── */}
                {isSectionVisible('event-details') && (inquiry.wedding_date || inquiry.venue_details) && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getSectionTitle('event-details', 'Event Details')}
                                </Typography>
                            </Box>

                            <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />

                            <Stack spacing={0} sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2.5, md: 3 } }}>
                                {inquiry.wedding_date && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2.5,
                                            py: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2.5,
                                                background: `linear-gradient(135deg, ${alpha(colors.gradient1, isDark ? 0.15 : 0.1)}, ${alpha(colors.gradient2, isDark ? 0.1 : 0.06)})`,
                                                border: `1px solid ${alpha(colors.accent, 0.1)}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <CalendarIcon sx={{ color: colors.accent, fontSize: 22 }} />
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    color: colors.text,
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {formatDate(inquiry.wedding_date)}
                                            </Typography>
                                            {daysUntil !== null && daysUntil > 0 && (
                                                <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mt: 0.25 }}>
                                                    {daysUntil} days from now
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                )}

                                {inquiry.venue_details && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2.5,
                                            py: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2.5,
                                                background: `linear-gradient(135deg, ${alpha(colors.gradient1, isDark ? 0.15 : 0.1)}, ${alpha(colors.gradient2, isDark ? 0.1 : 0.06)})`,
                                                border: `1px solid ${alpha(colors.accent, 0.1)}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <PlaceIcon sx={{ color: colors.accent, fontSize: 22 }} />
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    color: colors.text,
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {inquiry.venue_details}
                                            </Typography>
                                            {inquiry.venue_address && (
                                                <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mt: 0.25 }}>
                                                    {inquiry.venue_address}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </RevealBox>
                )}

                {(isSectionVisible('pricing') || isSectionVisible('films')) && <SectionDivider color={colors.accent} />}

                {/* ── Package & Pricing ─────────────────────────────── */}
                {isSectionVisible('pricing') && (estimate || pkg) && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getSectionTitle('pricing', 'Your Package')}
                                </Typography>
                            </Box>

                            <Box sx={{ px: { xs: 3.5, md: 5 }, pb: { xs: 3, md: 4 } }}>
                                {/* Package name */}
                                {(pkg || estimate?.title) && (
                                    <Typography
                                        sx={{
                                            fontWeight: 600,
                                            color: colors.text,
                                            fontSize: { xs: "1.25rem", md: "1.4rem" },
                                            mt: 1.5,
                                            mb: 0.5,
                                        }}
                                    >
                                        {estimate?.title || pkg?.name}
                                    </Typography>
                                )}
                                {pkg?.description && (
                                    <Typography
                                        sx={{
                                            color: colors.muted,
                                            fontSize: "0.88rem",
                                            lineHeight: 1.6,
                                            mb: 3,
                                        }}
                                    >
                                        {pkg.description}
                                    </Typography>
                                )}

                                {/* Line items */}
                                {estimate?.items && estimate.items.length > 0 && (() => {
                                    // Check if estimate items have real prices
                                    const hasItemPrices = estimate.items.some((i) => parseFloat(i.unit_price) > 0);
                                    // Try to match package content items by description for fallback prices
                                    const pkgItems = pkg?.contents?.items || [];
                                    const findPkgPrice = (desc: string): number => {
                                        const match = pkgItems.find((p) => p.description?.toLowerCase() === desc?.toLowerCase());
                                        return match?.price ?? 0;
                                    };

                                    return (
                                    <>
                                        <Divider sx={{ borderColor: alpha(colors.border, 0.5), mb: 1 }} />

                                        {hasItemPrices ? (
                                        <>
                                        {/* Header row — full grid with price columns */}
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: { xs: "1fr auto", md: "1fr 60px 90px 100px" },
                                                gap: { xs: 1, md: 2 },
                                                py: 1.5,
                                                px: 0.5,
                                            }}
                                        >
                                            <Typography sx={{ color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.6rem" }}>
                                                Description
                                            </Typography>
                                            <Typography sx={{ display: { xs: "none", md: "block" }, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.6rem", textAlign: "right" }}>
                                                Qty
                                            </Typography>
                                            <Typography sx={{ display: { xs: "none", md: "block" }, color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.6rem", textAlign: "right" }}>
                                                Rate
                                            </Typography>
                                            <Typography sx={{ color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.6rem", textAlign: "right" }}>
                                                Amount
                                            </Typography>
                                        </Box>

                                        {estimate.items.map((item, idx) => {
                                            const qty = parseFloat(item.quantity);
                                            const price = parseFloat(item.unit_price) || findPkgPrice(item.description);
                                            const lineTotal = qty * price;
                                            return (
                                                <Box
                                                    key={item.id || idx}
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: { xs: "1fr auto", md: "1fr 60px 90px 100px" },
                                                        gap: { xs: 1, md: 2 },
                                                        py: 1.5,
                                                        px: 0.5,
                                                        borderTop: `1px solid ${alpha(colors.border, 0.35)}`,
                                                        transition: "background-color 0.2s ease",
                                                        "&:hover": { bgcolor: alpha(colors.accent, 0.03) },
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography sx={{ color: colors.text, fontWeight: 500, fontSize: "0.88rem" }}>
                                                            {item.description}
                                                        </Typography>
                                                        {item.category && (
                                                            <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.72rem", mt: 0.25 }}>
                                                                {item.category}
                                                            </Typography>
                                                        )}
                                                        {/* Show qty/rate inline on mobile */}
                                                        <Typography sx={{ display: { xs: "block", md: "none" }, color: colors.muted, fontSize: "0.75rem", mt: 0.25 }}>
                                                            {qty}{item.unit ? ` ${item.unit}` : ""} &times; {formatCurrency(price, currency)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography sx={{ display: { xs: "none", md: "block" }, color: colors.muted, fontSize: "0.88rem", textAlign: "right" }}>
                                                        {qty}{item.unit ? ` ${item.unit}` : ""}
                                                    </Typography>
                                                    <Typography sx={{ display: { xs: "none", md: "block" }, color: colors.muted, fontSize: "0.88rem", textAlign: "right" }}>
                                                        {formatCurrency(price, currency)}
                                                    </Typography>
                                                    <Typography sx={{ color: colors.text, fontWeight: 500, fontSize: "0.88rem", textAlign: "right" }}>
                                                        {formatCurrency(lineTotal, currency)}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                        </>
                                        ) : (
                                        <>
                                        {/* Simplified layout — items without individual prices */}
                                        {estimate.items.map((item, idx) => {
                                            const fallbackPrice = findPkgPrice(item.description);
                                            return (
                                                <Box
                                                    key={item.id || idx}
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        py: 1.5,
                                                        px: 0.5,
                                                        borderTop: idx > 0 ? `1px solid ${alpha(colors.border, 0.35)}` : "none",
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography sx={{ color: colors.text, fontWeight: 500, fontSize: "0.88rem" }}>
                                                            {item.description}
                                                        </Typography>
                                                        {item.category && (
                                                            <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.72rem", mt: 0.25 }}>
                                                                {item.category}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {fallbackPrice > 0 && (
                                                        <Typography sx={{ color: colors.accent, fontWeight: 500, fontSize: "0.88rem", fontFamily: "monospace" }}>
                                                            {formatCurrency(fallbackPrice, currency)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                        </>
                                        )}

                                        {/* Totals */}
                                        <Divider sx={{ borderColor: alpha(colors.border, 0.5), mt: 1 }} />

                                        {estimate.tax_rate && parseFloat(estimate.tax_rate) > 0 && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between", px: 0.5, pt: 2 }}>
                                                <Typography sx={{ color: colors.muted, fontSize: "0.85rem" }}>
                                                    Tax ({estimate.tax_rate}%)
                                                </Typography>
                                                <Typography sx={{ color: colors.muted, fontSize: "0.85rem" }}>
                                                    {formatCurrency(
                                                        computeTaxBreakdown(parseFloat(estimate.total_amount), parseFloat(estimate.tax_rate)).taxAmount,
                                                        currency,
                                                    )}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                px: 3,
                                                py: 2.5,
                                                mt: 2,
                                                mb: 0.5,
                                                borderRadius: 2.5,
                                                background: `linear-gradient(135deg, ${alpha(colors.gradient1, isDark ? 0.08 : 0.04)}, ${alpha(colors.gradient2, isDark ? 0.05 : 0.02)})`,
                                                border: `1px solid ${alpha(colors.accent, 0.1)}`,
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "1.05rem" }}>
                                                Total Investment
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: { xs: "1.5rem", md: "1.75rem" },
                                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                                    backgroundClip: "text",
                                                    WebkitBackgroundClip: "text",
                                                    WebkitTextFillColor: "transparent",
                                                }}
                                            >
                                                {formatCurrency(
                                                    (() => {
                                                        const amt = parseFloat(estimate.total_amount);
                                                        if (amt <= 0) return pkg?.base_price ?? estimate.total_amount;
                                                        return computeTaxBreakdown(amt, estimate.tax_rate ? parseFloat(estimate.tax_rate) : 0).total;
                                                    })(),
                                                    currency,
                                                )}
                                            </Typography>
                                        </Box>

                                        {estimate.deposit_required && parseFloat(estimate.deposit_required) > 0 && (
                                            <Box sx={{ px: 0.5, pb: 1 }}>
                                                <Chip
                                                    label={`Deposit: ${formatCurrency(estimate.deposit_required, currency)}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(colors.accent, isDark ? 0.1 : 0.06),
                                                        color: colors.accent,
                                                        border: `1px solid ${alpha(colors.accent, 0.15)}`,
                                                        fontWeight: 500,
                                                        fontSize: "0.75rem",
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        {estimate.notes && (
                                            <Box sx={{ mt: 2, px: 0.5 }}>
                                                <Typography sx={{ color: alpha(colors.muted, 0.8), fontStyle: "italic", fontSize: "0.8rem", lineHeight: 1.6 }}>
                                                    {estimate.notes}
                                                </Typography>
                                            </Box>
                                        )}
                                    </>
                                    );
                                })()}

                                {/* Fallback: no estimate but has package */}
                                {!estimate && pkg && parseFloat(String(pkg.base_price)) > 0 && (
                                    <>
                                        <Divider sx={{ borderColor: colors.border, my: 2 }} />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                            <Typography sx={{ fontWeight: 600, color: colors.text }}>
                                                Package Price
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "1.5rem",
                                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                                    backgroundClip: "text",
                                                    WebkitBackgroundClip: "text",
                                                    WebkitTextFillColor: "transparent",
                                                }}
                                            >
                                                {formatCurrency(pkg.base_price, pkg.currency)}
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </RevealBox>
                )}

                {/* ── Package Details ───────────────────────────── */}
                {isSectionVisible('package-details') && pkg && (pkg.contents?.items?.length ?? 0) > 0 && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getSectionTitle('package-details', 'Package Details')}
                                </Typography>
                            </Box>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pb: { xs: 3, md: 4 } }}>
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        color: colors.text,
                                        fontSize: { xs: "1.15rem", md: "1.25rem" },
                                        mt: 1.5,
                                        mb: 0.5,
                                    }}
                                >
                                    {pkg.name}
                                </Typography>
                                {pkg.description && (
                                    <Typography sx={{ color: colors.muted, fontSize: "0.88rem", lineHeight: 1.6, mb: 2.5 }}>
                                        {pkg.description}
                                    </Typography>
                                )}
                                <Divider sx={{ borderColor: alpha(colors.border, 0.5), mb: 1 }} />
                                {pkg.contents!.items!.map((item, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            py: 1.5,
                                            px: 0.5,
                                            borderTop: idx > 0 ? `1px solid ${alpha(colors.border, 0.35)}` : "none",
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ color: colors.text, fontWeight: 500, fontSize: "0.88rem" }}>
                                                {item.description}
                                            </Typography>
                                            {item.type && (
                                                <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.72rem", mt: 0.25 }}>
                                                    {item.type}
                                                </Typography>
                                            )}
                                        </Box>
                                        {Number(item.price) > 0 && (
                                            <Typography sx={{ color: colors.accent, fontWeight: 500, fontSize: "0.88rem", fontFamily: "monospace" }}>
                                                {formatCurrency(item.price, currency)}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </RevealBox>
                )}

                {/* ── Your Films / Deliverables ───────────────────── */}
                {isSectionVisible('films') && films.length > 0 && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getSectionTitle('films', 'Your Films')}
                                </Typography>
                            </Box>

                            <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />

                            <Stack spacing={0} sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2, md: 2.5 } }}>
                                {films.map((pf, idx) => {
                                    const f = pf.film;
                                    const durationLabel = f.target_duration_min && f.target_duration_max
                                        ? `${f.target_duration_min}–${f.target_duration_max} min`
                                        : f.target_duration_min
                                            ? `~${f.target_duration_min} min`
                                            : null;
                                    const typeLabel = f.film_type
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (c) => c.toUpperCase());

                                    return (
                                        <Box
                                            key={f.id || idx}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                                py: 2,
                                                borderTop: idx > 0 ? `1px solid ${alpha(colors.border, 0.3)}` : "none",
                                                transition: "background-color 0.2s ease",
                                                mx: -1,
                                                px: 1,
                                                borderRadius: 1.5,
                                                "&:hover": { bgcolor: alpha(colors.accent, 0.03) },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 2,
                                                    background: `linear-gradient(135deg, ${alpha(colors.gradient1, isDark ? 0.15 : 0.1)}, ${alpha(colors.gradient2, isDark ? 0.1 : 0.06)})`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <VideocamIcon sx={{ color: colors.accent, fontSize: 20 }} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.95rem", lineHeight: 1.3 }}>
                                                    {f.name}
                                                </Typography>
                                                <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mt: 0.25 }}>
                                                    {typeLabel}
                                                </Typography>
                                            </Box>
                                            {durationLabel && (
                                                <Chip
                                                    label={durationLabel}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(colors.accent, isDark ? 0.1 : 0.06),
                                                        color: colors.accent,
                                                        border: `1px solid ${alpha(colors.accent, 0.15)}`,
                                                        fontWeight: 500,
                                                        fontSize: "0.7rem",
                                                        height: 24,
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </RevealBox>
                )}

                {(isSectionVisible('schedule') || isSectionVisible('subjects') || isSectionVisible('locations')) && <SectionDivider color={colors.accent} />}

                {/* ── Day Schedule / Timeline ──────────────────────── */}
                {isSectionVisible('schedule') && eventDays.length > 0 && eventDays.some((d) => d.activities.length > 0) && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getSectionTitle('schedule', 'Your Day')}
                                </Typography>
                            </Box>

                            {eventDays.map((day) => {
                                if (day.activities.length === 0) return null;
                                return (
                                    <Box key={day.id}>
                                        {/* Day header (for multi-day events) */}
                                        {eventDays.length > 1 && (
                                            <Box sx={{ px: { xs: 3.5, md: 5 }, py: 1.5 }}>
                                                <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.9rem" }}>
                                                    {day.name}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />

                                        {/* Visual timeline */}
                                        <Box sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2.5, md: 3 } }}>
                                            <Stack spacing={0}>
                                                {day.activities.map((activity, aIdx) => {
                                                    const isLast = aIdx === day.activities.length - 1;
                                                    const actColor = activity.color || colors.accent;
                                                    const durationText = activity.duration_minutes
                                                        ? activity.duration_minutes >= 60
                                                            ? `${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ""}`
                                                            : `${activity.duration_minutes}m`
                                                        : null;

                                                    return (
                                                        <Box
                                                            key={activity.id}
                                                            sx={{ display: "flex", gap: 2.5, position: "relative" }}
                                                        >
                                                            {/* Timeline track */}
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    alignItems: "center",
                                                                    pt: 0.5,
                                                                    width: 20,
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                {/* Dot */}
                                                                <Box
                                                                    sx={{
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: "50%",
                                                                        bgcolor: actColor,
                                                                        boxShadow: `0 0 0 3px ${alpha(actColor, 0.2)}`,
                                                                        flexShrink: 0,
                                                                        position: "relative",
                                                                        zIndex: 1,
                                                                    }}
                                                                />
                                                                {/* Connecting line */}
                                                                {!isLast && (
                                                                    <Box
                                                                        sx={{
                                                                            width: 1.5,
                                                                            flex: 1,
                                                                            bgcolor: alpha(colors.border, 0.5),
                                                                            mt: 0.5,
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>

                                                            {/* Activity content */}
                                                            <Box sx={{ flex: 1, pb: isLast ? 0 : 3, minWidth: 0 }}>
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "baseline",
                                                                        gap: 1.5,
                                                                        flexWrap: "wrap",
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            color: colors.text,
                                                                            fontSize: "0.92rem",
                                                                            lineHeight: 1.3,
                                                                        }}
                                                                    >
                                                                        {activity.name}
                                                                    </Typography>
                                                                    {activity.start_time && (
                                                                        <Typography sx={{ color: colors.muted, fontSize: "0.75rem" }}>
                                                                            {activity.start_time}{activity.end_time ? ` – ${activity.end_time}` : ""}
                                                                        </Typography>
                                                                    )}
                                                                    {durationText && (
                                                                        <Chip
                                                                            label={durationText}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: alpha(actColor, isDark ? 0.12 : 0.08),
                                                                                color: actColor,
                                                                                height: 20,
                                                                                fontSize: "0.65rem",
                                                                                fontWeight: 600,
                                                                                "& .MuiChip-label": { px: 1 },
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Box>

                                                                {activity.description && (
                                                                    <Typography sx={{ color: colors.muted, fontSize: "0.8rem", mt: 0.5, lineHeight: 1.5 }}>
                                                                        {activity.description}
                                                                    </Typography>
                                                                )}

                                                                {/* Key moments */}
                                                                {activity.moments.length > 0 && (
                                                                    <Box
                                                                        sx={{
                                                                            display: "flex",
                                                                            flexWrap: "wrap",
                                                                            gap: 0.75,
                                                                            mt: 1,
                                                                        }}
                                                                    >
                                                                        {activity.moments.map((m) => (
                                                                            <Chip
                                                                                key={m.id}
                                                                                label={m.name}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: alpha(colors.border, isDark ? 0.6 : 0.4),
                                                                                    color: colors.muted,
                                                                                    height: 22,
                                                                                    fontSize: "0.68rem",
                                                                                    fontWeight: 500,
                                                                                    "& .MuiChip-label": { px: 1 },
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </RevealBox>
                )}

                {/* ── People & Subjects ─────────────────────────────── */}
                {isSectionVisible('subjects') && uniqueSubjects.length > 0 && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getSectionTitle('subjects', 'Key People')}
                                </Typography>
                            </Box>

                            <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" },
                                    gap: 0,
                                    px: { xs: 3.5, md: 5 },
                                    py: { xs: 2, md: 2.5 },
                                }}
                            >
                                {uniqueSubjects.map((s) => {
                                    const isGroup = (s.count || 0) > 1;
                                    const SubjectIcon = isGroup ? GroupsIcon : PersonIcon;
                                    return (
                                        <Box
                                            key={s.id}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                py: 1.5,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "50%",
                                                    bgcolor: alpha(colors.accent, isDark ? 0.1 : 0.06),
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <SubjectIcon sx={{ color: colors.accent, fontSize: 16 }} />
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.85rem", lineHeight: 1.2 }}>
                                                    {s.name}
                                                </Typography>
                                                {s.real_name && (
                                                    <Typography sx={{ color: colors.muted, fontSize: "0.72rem", mt: 0.15 }}>
                                                        {s.real_name}
                                                    </Typography>
                                                )}
                                                {isGroup && (
                                                    <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.68rem", mt: 0.15 }}>
                                                        {s.count} people
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    </RevealBox>
                )}

                {/* ── Locations ─────────────────────────────────────── */}
                {isSectionVisible('locations') && uniqueLocations.length > 0 && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {getSectionTitle('locations', 'Locations')}
                                </Typography>
                            </Box>

                            <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />

                            <Stack spacing={0} sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2, md: 2.5 } }}>
                                {uniqueLocations.map((loc, idx) => {
                                    const locName = loc.name || loc.location?.name || "Location";
                                    const locAddr = loc.address || [loc.location?.address_line1, loc.location?.city, loc.location?.state].filter(Boolean).join(", ");

                                    return (
                                        <Box
                                            key={loc.id || idx}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                                py: 1.5,
                                                borderTop: idx > 0 ? `1px solid ${alpha(colors.border, 0.3)}` : "none",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(colors.accent, isDark ? 0.12 : 0.08),
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <PlaceIcon sx={{ color: colors.accent, fontSize: 18 }} />
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.92rem", lineHeight: 1.3 }}>
                                                    {locName}
                                                </Typography>
                                                {locAddr && (
                                                    <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mt: 0.15 }}>
                                                        {locAddr}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </RevealBox>
                )}

                {/* ── Your Team ──────────────────────────────────────── */}
                {isSectionVisible('crew') && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700 }}>
                                    {getSectionTitle('crew', 'Your Team')}
                                </Typography>
                            </Box>
                            <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />
                            <Box sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2, md: 2.5 }, textAlign: "center" }}>
                                <Typography sx={{ color: colors.muted, fontSize: "0.85rem", py: 2 }}>
                                    Your dedicated team will be confirmed closer to the event.
                                </Typography>
                            </Box>
                        </Box>
                    </RevealBox>
                )}

                {/* ── Equipment ───────────────────────────────────────── */}
                {isSectionVisible('equipment') && (
                    <RevealBox>
                        <Box sx={cardSx}>
                            <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                                <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700 }}>
                                    {getSectionTitle('equipment', 'Equipment')}
                                </Typography>
                            </Box>
                            <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />
                            <Box sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2, md: 2.5 }, textAlign: "center" }}>
                                <Typography sx={{ color: colors.muted, fontSize: "0.85rem", py: 2 }}>
                                    Equipment details will be included based on your package.
                                </Typography>
                            </Box>
                        </Box>
                    </RevealBox>
                )}

                <SectionDivider color={colors.accent} />

                {/* ── Accept / Request Changes ──────────────────────── */}
                {!alreadyResponded && proposal.status === "Sent" && (
                    <Box ref={ctaReveal.ref} sx={{ ...revealSx(ctaReveal.visible, 0), "@media print": { display: "none" } }}>
                        <Box
                            sx={{
                                ...cardSx,
                                p: { xs: 5, md: 7 },
                                textAlign: "center",
                                background: `
                                    radial-gradient(ellipse at 50% 0%, ${alpha(colors.gradient1, isDark ? 0.08 : 0.04)} 0%, transparent 50%),
                                    radial-gradient(ellipse at 50% 100%, ${alpha(colors.gradient2, isDark ? 0.06 : 0.03)} 0%, transparent 50%),
                                    ${isDark ? alpha(colors.card, 0.8) : colors.card}
                                `,
                                border: `1px solid ${alpha(colors.accent, 0.15)}`,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 600,
                                    color: colors.text,
                                    mb: 1.5,
                                    fontSize: { xs: "1.3rem", md: "1.5rem" },
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                Ready to move forward?
                            </Typography>
                            <Typography
                                sx={{
                                    color: colors.muted,
                                    mb: 4,
                                    fontSize: "0.88rem",
                                    lineHeight: 1.6,
                                    maxWidth: 440,
                                    mx: "auto",
                                }}
                            >
                                Accept this proposal to confirm your booking, or request changes if you&apos;d like to discuss adjustments.
                            </Typography>

                            <Stack spacing={2} alignItems="center">
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleAccept}
                                    disabled={responding}
                                    startIcon={responding ? <CircularProgress size={18} /> : <CheckCircleIcon />}
                                    sx={{
                                        background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                        "&:hover": {
                                            background: `linear-gradient(135deg, ${colors.gradient2}, ${colors.gradient1})`,
                                            transform: "translateY(-1px)",
                                            boxShadow: `0 8px 24px ${alpha(colors.accent, 0.35)}`,
                                        },
                                        textTransform: "none",
                                        fontWeight: 600,
                                        px: { xs: 5, md: 6 },
                                        py: 1.5,
                                        fontSize: "1rem",
                                        borderRadius: 2.5,
                                        boxShadow: `0 4px 16px ${alpha(colors.accent, 0.25)}`,
                                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                        animation: `${pulseGlow} 3s ease-in-out infinite`,
                                        color: isDark ? "#fff" : "#fff",
                                    }}
                                >
                                    Accept Proposal
                                </Button>

                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setShowChangesForm(!showChangesForm)}
                                    startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                                    sx={{
                                        color: colors.muted,
                                        textTransform: "none",
                                        fontSize: "0.82rem",
                                        transition: "color 0.2s ease",
                                        "&:hover": { color: colors.text, bgcolor: "transparent" },
                                    }}
                                >
                                    Request Changes
                                </Button>
                            </Stack>

                            {/* Changes request form */}
                            {showChangesForm && (
                                <Box
                                    sx={{
                                        mt: 4,
                                        textAlign: "left",
                                        animation: `${scaleIn} 0.35s cubic-bezier(0.16, 1, 0.3, 1) both`,
                                    }}
                                >
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                                        <Typography sx={{ color: colors.text, fontWeight: 600, fontSize: "0.9rem" }}>
                                            What would you like to change?
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowChangesForm(false)}
                                            sx={{ color: colors.muted, transition: "color 0.2s", "&:hover": { color: colors.text } }}
                                        >
                                            <CloseIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                    <TextField
                                        multiline
                                        rows={3}
                                        fullWidth
                                        size="small"
                                        placeholder="Let us know what adjustments you'd like..."
                                        value={changesMessage}
                                        onChange={(e) => setChangesMessage(e.target.value)}
                                        sx={{
                                            mb: 2,
                                            "& .MuiInputBase-root": {
                                                color: colors.text,
                                                borderRadius: 2,
                                                fontSize: "0.9rem",
                                                transition: "border-color 0.2s ease",
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border },
                                            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                                                borderColor: alpha(colors.accent, 0.4),
                                            },
                                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.accent,
                                            },
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={handleRequestChanges}
                                        disabled={responding || !changesMessage.trim()}
                                        sx={{
                                            borderColor: alpha(colors.accent, 0.3),
                                            color: colors.text,
                                            textTransform: "none",
                                            borderRadius: 2,
                                            fontWeight: 500,
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                borderColor: colors.accent,
                                                bgcolor: alpha(colors.accent, 0.06),
                                            },
                                        }}
                                    >
                                        {responding ? <CircularProgress size={16} sx={{ mr: 1, color: colors.accent }} /> : null}
                                        Send Request
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Success response */}
                {responseSuccess && (
                    <Alert
                        severity="success"
                        sx={{
                            bgcolor: alpha("#22c55e", isDark ? 0.1 : 0.06),
                            color: colors.text,
                            border: `1px solid ${alpha("#22c55e", 0.2)}`,
                            borderRadius: 3,
                            animation: `${scaleIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`,
                            "& .MuiAlert-icon": { color: "#22c55e" },
                        }}
                    >
                        {responseSuccess === "accepted"
                            ? "Proposal accepted! We'll be in touch shortly to discuss next steps."
                            : "Your change request has been sent. We'll review it and get back to you soon."}
                    </Alert>
                )}

                {/* ── Terms ─────────────────────────────────────────── */}
                {isSectionVisible('terms') && (estimate?.terms || content?.sections?.find((s) => s.type === 'terms')?.data?.customTerms) && (
                    <Box sx={{ opacity: 0.65 }}>
                        <Typography
                            sx={{ color: colors.muted, fontSize: "0.72rem", lineHeight: 1.7, display: "block" }}
                        >
                            {(content?.sections?.find((s) => s.type === 'terms')?.data?.customTerms as string) || estimate?.terms}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Footer ───────────────────────────────────────────── */}
            {brand && (
                <Box
                    ref={footerReveal.ref}
                    sx={{
                        borderTop: `1px solid ${alpha(colors.border, 0.4)}`,
                        background: isDark
                            ? `radial-gradient(ellipse 80% 50% at 50% 0%, ${alpha(colors.accent, 0.04)} 0%, ${alpha(colors.card, 0.5)} 70%)`
                            : colors.card,
                        py: { xs: 6, md: 8 },
                        px: 3,
                        ...revealSx(footerReveal.visible, 0),
                    }}
                >
                    <Box sx={{ maxWidth: 680, mx: "auto" }}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            spacing={4}
                        >
                            {/* Brand info */}
                            <Box>
                                {brand.logo_url ? (
                                    <Box
                                        component="img"
                                        src={brand.logo_url}
                                        alt={brandName}
                                        sx={{ height: 24, width: "auto", objectFit: "contain", mb: 1.5, opacity: 0.8 }}
                                    />
                                ) : brandInitial ? (
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 1.5,
                                            opacity: 0.8,
                                        }}
                                    >
                                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", lineHeight: 1 }}>
                                            {brandInitial}
                                        </Typography>
                                    </Box>
                                ) : null}
                                <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.95rem", mb: 0.75 }}>
                                    {brandName}
                                </Typography>
                                {brand.description && (
                                    <Typography sx={{ color: colors.muted, maxWidth: 280, fontSize: "0.82rem", lineHeight: 1.6 }}>
                                        {brand.description}
                                    </Typography>
                                )}

                                {brand.website && (
                                    <IconButton
                                        size="small"
                                        component="a"
                                        href={brand.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            color: colors.muted,
                                            mt: 1.5,
                                            transition: "color 0.2s ease, transform 0.2s ease",
                                            "&:hover": { color: colors.accent, transform: "scale(1.1)" },
                                        }}
                                    >
                                        <LanguageIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                )}
                            </Box>

                            {/* Contact info */}
                            <Box>
                                <Typography
                                    sx={{
                                        color: colors.accent,
                                        textTransform: "uppercase",
                                        letterSpacing: 2,
                                        fontWeight: 700,
                                        display: "block",
                                        mb: 2,
                                        fontSize: "0.6rem",
                                    }}
                                >
                                    Get in Touch
                                </Typography>
                                <Stack spacing={1.5}>
                                    {brand.email && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <EmailIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6) }} />
                                            <Typography
                                                component="a"
                                                href={`mailto:${brand.email}`}
                                                sx={{
                                                    color: colors.muted,
                                                    textDecoration: "none",
                                                    fontSize: "0.85rem",
                                                    transition: "color 0.2s ease",
                                                    "&:hover": { color: colors.accent },
                                                }}
                                            >
                                                {brand.email}
                                            </Typography>
                                        </Box>
                                    )}
                                    {brand.phone && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <PhoneIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6) }} />
                                            <Typography
                                                component="a"
                                                href={`tel:${brand.phone}`}
                                                sx={{
                                                    color: colors.muted,
                                                    textDecoration: "none",
                                                    fontSize: "0.85rem",
                                                    transition: "color 0.2s ease",
                                                    "&:hover": { color: colors.accent },
                                                }}
                                            >
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

                        {/* Bottom bar */}
                        <Divider sx={{ borderColor: alpha(colors.border, 0.3), mt: 4, mb: 3 }} />
                        <Typography
                            sx={{
                                color: alpha(colors.muted, 0.4),
                                textAlign: "center",
                                fontSize: "0.68rem",
                                letterSpacing: 0.5,
                            }}
                        >
                            &copy; {new Date().getFullYear()} {brand.display_name || brand.name}. Sent with ProjectFlo.
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

