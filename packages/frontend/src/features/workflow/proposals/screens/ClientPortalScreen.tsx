"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Box,
    Typography,
    Stack,
    Divider,
    IconButton,
    Chip,
    Collapse,
    LinearProgress,
    TextField,
    Button,
    CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Lock as LockIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationOnIcon,
    Language as LanguageIcon,
    Print as PrintIcon,
    Assignment as FormIcon,
    Description as ProposalIcon,
    Gavel as ContractIcon,
    CalendarToday as CalendarIcon,
    Place as PlaceIcon,
    Inventory as PackageIcon,
    RequestQuote as EstimateIcon,
    Receipt as InvoiceIcon,
    ExpandMore as ExpandMoreIcon,
    OpenInNew as OpenInNewIcon,
    Videocam as FilmIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    CardGiftcard as WelcomePackIcon,
    MarkEmailRead as MarkEmailReadIcon,
} from "@mui/icons-material";

import { api } from "@/lib/api";
import { computeTaxBreakdown } from "@/lib/utils/pricing";
import {
    fadeInUp, fadeIn, scaleIn, shimmer, float, gradientShift, subtleFloat,
    useReveal, revealSx,
} from "@/lib/portal/animations";
import { getPortalDashboardColors, getThemeColors } from "@/lib/portal/themes";
import type { PortalDashboardColors } from "@/lib/portal/themes";
import { formatDate, formatCurrency, formatAnswerValue } from "@/lib/portal/formatting";
import type { PortalBrand, PortalProposalSectionData } from "@/lib/types/domains/portal";
import ProposalRenderer from "@/features/workflow/proposals/components/ProposalRenderer";
import ProposalAcceptanceBar from "@/features/workflow/proposals/components/ProposalAcceptanceBar";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface AnswerItem { field_key: string; prompt: string; field_type: string; value: unknown; options?: unknown }
interface ReviewStep { key: string; label: string; description: string | null; answers: AnswerItem[] }
interface InquiryReview { submission_id: number; template_name: string; submitted_at: string; steps: ReviewStep[] }

interface EstimateItem { id: number; description: string; quantity: string | number; unit_price: string | number; unit: string | null; category: string | null }
interface PaymentMilestone { id: number; label: string; amount: string | number; due_date: string; status: string; order_index: number }
interface EstimateData {
    id: number; estimate_number: string; title: string | null; status: string;
    total_amount: string | number; tax_rate: string | number | null;
    issue_date: string; expiry_date: string; notes: string | null;
    deposit_required: string | number | null;
    payment_method: string | null;
    items: EstimateItem[]; payment_milestones: PaymentMilestone[];
}

interface ContractSigner { id: number; name: string; role: string; status: string; signed_at: string | null }
interface ContractData {
    title: string; contract_status: string; signing_token: string | null;
    signed_date: string | null; sent_at: string | null; signers: ContractSigner[];
}

interface InvoiceData {
    id: number; invoice_number: string; status: string;
    total_amount: string | number; due_date: string | null;
    paid_date: string | null; issued_date: string | null;
}

interface PackageData {
    id: number; name: string; base_price: string | number | null;
    currency: string | null; description: string | null;
    films: { id: number; name: string }[];
}

type SectionStatus = "complete" | "available" | "locked" | "review_pending" | "accepted" | "changes_requested";
interface Section<T> { status: SectionStatus; data: T }

interface PortalData {
    inquiry_id: number;
    status: string;
    event_date: string | null;
    event_type: string | null;
    venue: string | null;
    venue_address: string | null;
    is_contract_signed?: boolean;
    contact: { first_name: string | null; last_name: string | null };
    brand: PortalBrand | null;
    sections: {
        questionnaire: Section<InquiryReview> | null;
        package: Section<PackageData> | null;
        estimate: Section<EstimateData> | null;
        proposal: Section<PortalProposalSectionData> | null;
        contract: Section<ContractData> | null;
        invoices: Section<InvoiceData[]> | null;
        welcome_pack: Section<{ sent_at: string }> | null;
    };
}

/* ================================================================== */
/* ExpandableCard — the interactive building block                     */
/* ================================================================== */

function ExpandableCard({
    icon,
    iconColor,
    title,
    subtitle,
    statusChip,
    locked,
    lockedMessage,
    children,
    action,
    defaultOpen = false,
    colors,
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    subtitle?: string;
    statusChip?: { label: string; color: string };
    locked?: boolean;
    lockedMessage?: string;
    children?: React.ReactNode;
    action?: React.ReactNode;
    defaultOpen?: boolean;
    colors: PortalDashboardColors;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const r = useReveal();

    const cardSx = {
        bgcolor: alpha(colors.card, 0.7),
        backdropFilter: "blur(20px) saturate(1.5)",
        border: `1px solid ${alpha(colors.border, 0.6)}`,
        borderRadius: "20px",
        overflow: "hidden",
        position: "relative" as const,
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        ...(locked
            ? { opacity: 0.5 }
            : {
                  "&:hover": {
                      borderColor: alpha(iconColor, 0.25),
                      boxShadow: `0 12px 40px ${alpha(iconColor, 0.08)}, 0 4px 12px ${alpha("#000", 0.2)}`,
                  },
              }),
    };

    return (
        <Box ref={r.ref} sx={{ ...revealSx(r.visible, 0.05) }}>
            <Box sx={cardSx}>
                {/* Top accent line */}
                <Box sx={{ height: 2, background: locked ? alpha(colors.border, 0.3) : `linear-gradient(90deg, transparent 5%, ${alpha(iconColor, 0.5)} 50%, transparent 95%)` }} />

                {/* Header — always clickable */}
                <Box
                    onClick={() => !locked && children && setOpen(!open)}
                    sx={{
                        display: "flex", alignItems: "center", gap: 2,
                        px: { xs: 2.5, md: 3 }, py: 2.5,
                        cursor: locked || !children ? "default" : "pointer",
                        userSelect: "none",
                        "&:hover": !locked && children ? { bgcolor: alpha(colors.border, 0.08) } : {},
                        transition: "background 0.2s",
                    }}
                >
                    {/* Icon box */}
                    <Box sx={{
                        width: 48, height: 48, borderRadius: "14px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: locked ? alpha(colors.border, 0.2) : alpha(iconColor, 0.12),
                        border: `1.5px ${locked ? "dashed" : "solid"} ${locked ? alpha(colors.border, 0.5) : alpha(iconColor, 0.25)}`,
                        color: locked ? colors.muted : iconColor,
                        position: "relative", flexShrink: 0,
                        transition: "all 0.3s",
                    }}>
                        {locked ? <LockIcon sx={{ fontSize: 18, opacity: 0.6 }} /> : icon}
                    </Box>

                    {/* Title + subtitle */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography sx={{ color: locked ? colors.muted : colors.text, fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.3 }}>
                                {title}
                            </Typography>
                            {statusChip && (
                                <Chip
                                    label={statusChip.label}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.04em",
                                        bgcolor: alpha(statusChip.color, 0.12),
                                        color: statusChip.color,
                                        border: "none",
                                        "& .MuiChip-label": { px: 1 },
                                    }}
                                />
                            )}
                        </Box>
                        {(subtitle || (locked && lockedMessage)) && (
                            <Typography sx={{ color: alpha(colors.muted, locked ? 0.5 : 0.8), fontSize: "0.78rem", mt: 0.25, lineHeight: 1.4 }}>
                                {locked ? lockedMessage : subtitle}
                            </Typography>
                        )}
                    </Box>

                    {/* Action button or expand toggle */}
                    {!locked && action && !children && action}
                    {!locked && children && (
                        <Box sx={{
                            width: 32, height: 32, borderRadius: "10px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            bgcolor: alpha(colors.border, 0.2),
                            color: colors.muted,
                            transition: "all 0.3s",
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        }}>
                            <ExpandMoreIcon sx={{ fontSize: 18 }} />
                        </Box>
                    )}
                </Box>

                {/* Expandable content */}
                {children && (
                    <Collapse in={open} timeout={350} easing="cubic-bezier(0.16,1,0.3,1)">
                        <Box sx={{ borderTop: `1px solid ${alpha(colors.border, 0.4)}` }}>
                            {children}
                        </Box>
                    </Collapse>
                )}

                {/* Inline action when card has no expandable content */}
                {!locked && action && children && (
                    <Collapse in={open} timeout={350}>
                        <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 2.5, display: "flex", justifyContent: "flex-end" }}>
                            {action}
                        </Box>
                    </Collapse>
                )}
            </Box>
        </Box>
    );
}

/* ================================================================== */
/* Action Link Button                                                  */
/* ================================================================== */

function ActionLink({ href, label, color }: { href: string; label: string; color: string }) {
    return (
        <Box
            component="a"
            href={href}
            sx={{
                display: "inline-flex", alignItems: "center", gap: 1,
                py: 1, px: 2.5, borderRadius: "12px",
                background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
                color: "#fff", fontWeight: 600, fontSize: "0.8rem",
                textDecoration: "none",
                boxShadow: `0 4px 16px ${alpha(color, 0.3)}`,
                transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                "&:hover": { transform: "translateY(-1px)", boxShadow: `0 6px 24px ${alpha(color, 0.4)}` },
            }}
        >
            {label}
            <OpenInNewIcon sx={{ fontSize: 14 }} />
        </Box>
    );
}

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */

export function ClientPortalScreen({ token }: { token: string }) {
    const colors = getPortalDashboardColors();

    const [data, setData] = useState<PortalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Questionnaire edit mode
    const [editingQuestionnaire, setEditingQuestionnaire] = useState(false);
    const [editResponses, setEditResponses] = useState<Record<string, unknown>>({});
    const [savingQuestionnaire, setSavingQuestionnaire] = useState(false);

    // Proposal response
    const [proposalResponding, setProposalResponding] = useState(false);
    const [proposalResponseSuccess, setProposalResponseSuccess] = useState(false);
    const proposalRef = React.useRef<HTMLDivElement>(null);

    // Package browsing
    const [browsingPackages, setBrowsingPackages] = useState(false);
    const [availablePackages, setAvailablePackages] = useState<Array<{
        id: number; name: string; description: string | null;
        category: string | null; base_price: string | number;
        currency: string; contents: unknown;
    }>>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [selectedPkgId, setSelectedPkgId] = useState<number | null>(null);
    const [packageNotes, setPackageNotes] = useState("");
    const [submittingPackage, setSubmittingPackage] = useState(false);
    const [packageRequestSent, setPackageRequestSent] = useState(false);

    const heroReveal = useReveal();
    const footerReveal = useReveal();

    const fetchPortal = useCallback(async () => {
        try {
            setLoading(true);
            const result = await api.clientPortal.getByToken(token);
            setData(result);
        } catch {
            setError("This portal could not be found or may have expired.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchPortal();
    }, [token, fetchPortal]);

    // Auto-scroll to proposal when it's pending review
    useEffect(() => {
        if (!data) return;
        const proposal = data.sections?.proposal;
        if (proposal?.status === 'review_pending' && proposalRef.current) {
            setTimeout(() => {
                proposalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 600);
        }
    }, [data]);

    const handleProposalAccept = useCallback(async () => {
        setProposalResponding(true);
        try {
            await api.clientPortal.respondToProposal(token, 'Accepted');
            setProposalResponseSuccess(true);
            await fetchPortal();
        } catch {
            // stay on form
        } finally {
            setProposalResponding(false);
        }
    }, [token, fetchPortal]);

    const handleProposalRequestChanges = useCallback(async (message: string) => {
        setProposalResponding(true);
        try {
            await api.clientPortal.respondToProposal(token, 'ChangesRequested', message);
            setProposalResponseSuccess(true);
            await fetchPortal();
        } catch {
            // stay on form
        } finally {
            setProposalResponding(false);
        }
    }, [token, fetchPortal]);

    /* ── Questionnaire edit handlers ─────────────────────── */

    const startEditingQuestionnaire = () => {
        if (!data?.sections?.questionnaire) return;
        const current: Record<string, unknown> = {};
        for (const step of data.sections.questionnaire.data.steps) {
            for (const a of step.answers) {
                current[a.field_key] = a.value;
            }
        }
        setEditResponses(current);
        setEditingQuestionnaire(true);
    };

    const saveQuestionnaireEdits = async () => {
        if (!data?.sections?.questionnaire) return;
        const submissionId = data.sections.questionnaire.data.submission_id;
        try {
            setSavingQuestionnaire(true);
            const updates: Record<string, unknown> = {};
            for (const step of data.sections.questionnaire.data.steps) {
                for (const a of step.answers) {
                    if (editResponses[a.field_key] !== undefined && editResponses[a.field_key] !== a.value) {
                        updates[a.field_key] = editResponses[a.field_key];
                    }
                }
            }
            if (Object.keys(updates).length > 0) {
                await api.publicNeedsAssessment.updateSubmission(submissionId, updates);
                await fetchPortal();
            }
            setEditingQuestionnaire(false);
        } catch {
            // Keep editing mode open on error
        } finally {
            setSavingQuestionnaire(false);
        }
    };

    /* ── Package browsing handlers ───────────────────────── */

    const openPackageBrowser = async () => {
        setBrowsingPackages(true);
        setLoadingPackages(true);
        try {
            const result = await api.clientPortal.getPackageOptions(token);
            setAvailablePackages(result.packages ?? []);
        } catch {
            setAvailablePackages([]);
        } finally {
            setLoadingPackages(false);
        }
    };

    const submitPackageRequest = async () => {
        try {
            setSubmittingPackage(true);
            await api.clientPortal.submitPackageRequest(token, {
                selected_package_id: selectedPkgId ?? undefined,
                notes: packageNotes || undefined,
            });
            setPackageRequestSent(true);
            await fetchPortal();
        } catch {
            // stay on form
        } finally {
            setSubmittingPackage(false);
        }
    };

    /* ── Derived ─────────────────────────────────────────── */

    const brand = data?.brand ?? null;
    const brandName = brand?.display_name || brand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const firstName = data?.contact?.first_name || "";
    const currency = brand?.currency || "USD";

    /* ── Loading ─────────────────────────────────────────── */

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: colors.bg, gap: 3 }}>
                {[180, 120, 240].map((w, i) => (
                    <Box key={i} sx={{ width: w, height: 10, borderRadius: 5, background: "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)", backgroundSize: "200% 100%", animation: `${shimmer} 1.6s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                ))}
            </Box>
        );
    }

    /* ── Error ───────────────────────────────────────────── */

    if (error || !data) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: colors.bg, p: 3 }}>
                <Box sx={{ p: 5, maxWidth: 420, textAlign: "center", bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 3, animation: `${scaleIn} 0.5s cubic-bezier(0.16,1,0.3,1) both` }}>
                    <Typography variant="h6" sx={{ color: colors.text, mb: 1, fontWeight: 600 }}>Portal Not Found</Typography>
                    <Typography variant="body2" sx={{ color: colors.muted, lineHeight: 1.6 }}>{error || "Something went wrong."}</Typography>
                </Box>
            </Box>
        );
    }

    const { sections } = data;

    /* ── Section configs for the journey progress bar ─── */

    const journeySteps = [
        { key: "inquiry", label: "Inquiry Submitted", color: colors.green, icon: <FormIcon sx={{ fontSize: 18 }} />, done: !!sections.questionnaire },
        { key: "estimate", label: "Estimate Sent", color: "#06b6d4", icon: <EstimateIcon sx={{ fontSize: 18 }} />, done: !!sections.estimate?.data },
        { key: "proposal_sent", label: "Proposal Sent", color: "#a855f7", icon: <ProposalIcon sx={{ fontSize: 18 }} />, done: !!(sections.proposal?.data?.proposal_status) },
        { key: "proposal", label: "Proposal Accepted", color: "#8b5cf6", icon: <CheckCircleIcon sx={{ fontSize: 18 }} />, done: sections.proposal?.status === "accepted" },
        { key: "contract", label: "Contract Signed", color: "#6366f1", icon: <ContractIcon sx={{ fontSize: 18 }} />, done: sections.contract?.data?.contract_status === "Signed" },
        { key: "booked", label: "Booking Confirmed", color: "#ec4899", icon: <PackageIcon sx={{ fontSize: 18 }} />, done: data.status === "Booked" },
        { key: "welcome_pack", label: "Welcome Pack", color: "#10b981", icon: <WelcomePackIcon sx={{ fontSize: 18 }} />, done: !!sections.welcome_pack },
    ];

    const completedCount = journeySteps.filter(s => s.done).length;
    const progress = Math.round((completedCount / journeySteps.length) * 100);

    /* ================================================================ */
    /* Render                                                            */
    /* ================================================================ */

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: colors.bg, color: colors.text, overflowX: "hidden", scrollBehavior: "smooth", WebkitFontSmoothing: "antialiased" }}>

            {/* ── Sticky Header ───────────────────────────────── */}
            <Box sx={{
                position: "sticky", top: 0, zIndex: 50,
                display: "flex", alignItems: "center", gap: 1.5,
                py: 1.5, px: 3,
                backdropFilter: "blur(16px) saturate(1.8)",
                bgcolor: alpha(colors.card, 0.7),
                borderBottom: `1px solid ${alpha(colors.border, 0.6)}`,
                animation: `${fadeIn} 0.5s ease both`,
                "@media print": { display: "none" },
            }}>
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
                <IconButton size="small" onClick={() => window.print()} sx={{ color: colors.muted, "&:hover": { color: colors.text }, "@media print": { display: "none" } }} aria-label="Print">
                    <PrintIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* ── Hero ────────────────────────────────────────── */}
            <Box
                ref={heroReveal.ref}
                sx={{
                    position: "relative", py: { xs: 6, md: 9 }, px: 3, textAlign: "center",
                    background: `
                        radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(colors.gradient1, 0.18)} 0%, transparent 50%),
                        radial-gradient(ellipse 80% 50% at 80% 20%, ${alpha(colors.gradient2, 0.10)} 0%, transparent 50%),
                        ${colors.bg}
                    `,
                    overflow: "hidden",
                }}
            >
                {/* Floating orbs */}
                <Box sx={{ position: "absolute", top: "5%", right: "8%", width: { xs: 160, md: 280 }, height: { xs: 160, md: 280 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.gradient1, 0.12)} 0%, transparent 70%)`, filter: "blur(60px)", animation: `${float} 8s ease-in-out infinite`, pointerEvents: "none" }} />
                <Box sx={{ position: "absolute", bottom: "0%", left: "5%", width: { xs: 120, md: 200 }, height: { xs: 120, md: 200 }, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(colors.gradient2, 0.1)} 0%, transparent 70%)`, filter: "blur(50px)", animation: `${float} 10s ease-in-out 1s infinite`, pointerEvents: "none" }} />

                {/* Gradient overlay */}
                <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${alpha(colors.gradient1, 0.03)}, transparent 40%, ${alpha(colors.gradient2, 0.03)})`, backgroundSize: "400% 400%", animation: `${gradientShift} 15s ease infinite`, pointerEvents: "none" }} />

                {/* Monogram */}
                {brandInitial && (
                    <Box sx={{
                        width: { xs: 64, md: 76 }, height: { xs: 64, md: 76 }, borderRadius: "50%",
                        border: `2px solid ${alpha(colors.accent, 0.2)}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        mx: "auto", mb: 3, position: "relative", zIndex: 1,
                        animation: `${subtleFloat} 6s ease-in-out infinite`,
                        opacity: heroReveal.visible ? 1 : 0,
                        transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s",
                        "&::before": { content: '""', position: "absolute", inset: -5, borderRadius: "50%", border: `1px solid ${alpha(colors.accent, 0.08)}` },
                    }}>
                        {brand?.logo_url ? (
                            <Box component="img" src={brand.logo_url} alt={brandName} sx={{ width: "55%", height: "55%", objectFit: "contain" }} />
                        ) : (
                            <Typography sx={{ fontSize: { xs: "1.4rem", md: "1.8rem" }, fontWeight: 300, background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                {brandInitial}
                            </Typography>
                        )}
                    </Box>
                )}

                <Typography
                    variant="h1"
                    sx={{
                        fontWeight: 200, letterSpacing: "-0.03em", position: "relative", zIndex: 1,
                        fontSize: { xs: "1.85rem", sm: "2.5rem", md: "3rem" }, lineHeight: 1.08,
                        background: `linear-gradient(135deg, ${colors.text} 0%, ${alpha(colors.text, 0.6)} 50%, ${colors.text} 100%)`,
                        backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        ...revealSx(heroReveal.visible, 0.1),
                    }}
                >
                    {firstName ? `Welcome, ${firstName}` : "Your Portal"}
                </Typography>

                <Typography sx={{
                    color: colors.muted, fontWeight: 400, fontSize: { xs: "0.85rem", md: "0.95rem" },
                    letterSpacing: "0.02em", mt: 2, position: "relative", zIndex: 1,
                    ...revealSx(heroReveal.visible, 0.2),
                }}>
                    Everything about your {data.event_type ? data.event_type.toLowerCase() : "event"} in one place
                </Typography>

                {/* Event quick info pills */}
                {(data.event_date || data.venue) && (
                    <Box sx={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 3, flexWrap: "wrap",
                        position: "relative", zIndex: 1,
                        ...revealSx(heroReveal.visible, 0.3),
                    }}>
                        {data.event_date && (
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: "10px", bgcolor: alpha(colors.card, 0.6), border: `1px solid ${alpha(colors.border, 0.5)}`, backdropFilter: "blur(8px)" }}>
                                <CalendarIcon sx={{ fontSize: 14, color: colors.accent }} />
                                <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 500 }}>
                                    {new Date(data.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </Typography>
                            </Box>
                        )}
                        {data.venue && (
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: "10px", bgcolor: alpha(colors.card, 0.6), border: `1px solid ${alpha(colors.border, 0.5)}`, backdropFilter: "blur(8px)" }}>
                                <PlaceIcon sx={{ fontSize: 14, color: "#6366f1" }} />
                                <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 500 }}>
                                    {data.venue}
                                </Typography>
                            </Box>
                        )}
                        {data.event_type && (
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: "10px", bgcolor: alpha(colors.card, 0.6), border: `1px solid ${alpha(colors.border, 0.5)}`, backdropFilter: "blur(8px)" }}>
                                <FormIcon sx={{ fontSize: 14, color: "#a855f7" }} />
                                <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 500 }}>
                                    {data.event_type}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* ── Main Content ────────────────────────────────── */}
            <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 4, md: 6 } }}>

                {/* ── Progress overview ─────────────────────── */}
                <Box sx={{ mb: 5, animation: `${fadeInUp} 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both` }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700 }}>
                            Your Journey
                        </Typography>
                        <Typography sx={{ color: colors.muted, fontSize: "0.72rem", fontWeight: 500 }}>
                            {completedCount} of {journeySteps.length} steps
                        </Typography>
                    </Box>

                    {/* Mini progress bar */}
                    <Box sx={{ mb: 3 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 4, borderRadius: 2,
                                bgcolor: alpha(colors.border, 0.4),
                                "& .MuiLinearProgress-bar": {
                                    borderRadius: 2,
                                    background: `linear-gradient(90deg, ${colors.green}, ${colors.accent}, ${colors.gradient2})`,
                                },
                            }}
                        />
                    </Box>

                    {/* Journey step indicators */}
                    <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, justifyContent: "center", flexWrap: "wrap" }}>
                        {journeySteps.map((step) => {
                            return (
                                <Box key={step.key} sx={{
                                    display: "flex", alignItems: "center", gap: 0.5,
                                    px: { xs: 1, sm: 1.5 }, py: 0.75, borderRadius: "10px",
                                    bgcolor: step.done
                                        ? alpha(step.color, 0.1)
                                        : alpha(colors.border, 0.15),
                                    border: `1px solid ${
                                        step.done ? alpha(step.color, 0.3)
                                            : alpha(colors.border, 0.3)
                                    }`,
                                    transition: "all 0.3s",
                                }}>
                                    <Box sx={{ color: step.done ? step.color : colors.muted, display: "flex" }}>
                                        {step.done ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : step.icon}
                                    </Box>
                                    <Typography sx={{
                                        fontSize: "0.65rem", fontWeight: step.done ? 700 : 500,
                                        color: step.done ? colors.text : alpha(colors.muted, 0.5),
                                        display: { xs: "none", sm: "block" },
                                    }}>
                                        {step.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* ── Interactive Section Cards ─────────────── */}
                <Stack spacing={2}>

                    {/* QUESTIONNAIRE */}
                    <ExpandableCard
                        icon={<FormIcon sx={{ fontSize: 20 }} />}
                        iconColor={colors.green}
                        title="Your Questionnaire"
                        subtitle={sections.questionnaire?.data.submitted_at
                            ? `Submitted ${formatDate(sections.questionnaire.data.submitted_at, { month: "long", day: "numeric", year: "numeric" })}`
                            : undefined}
                        statusChip={sections.questionnaire
                            ? { label: "Complete", color: colors.green }
                            : undefined}
                        locked={!sections.questionnaire}
                        lockedMessage="Your questionnaire will appear here after submission"
                        defaultOpen
                        colors={colors}
                    >
                        {sections.questionnaire && (
                            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                                {/* Edit / Save / Cancel controls */}
                                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
                                    {editingQuestionnaire ? (
                                        <>
                                            <Button
                                                size="small"
                                                onClick={() => setEditingQuestionnaire(false)}
                                                startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                                                sx={{
                                                    color: colors.muted, fontSize: "0.75rem", textTransform: "none",
                                                    borderRadius: "8px", px: 1.5,
                                                    "&:hover": { bgcolor: alpha(colors.border, 0.2) },
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={saveQuestionnaireEdits}
                                                disabled={savingQuestionnaire}
                                                startIcon={savingQuestionnaire ? <CircularProgress size={12} /> : <SaveIcon sx={{ fontSize: 14 }} />}
                                                sx={{
                                                    background: `linear-gradient(135deg, ${colors.green}, ${alpha(colors.green, 0.7)})`,
                                                    color: "#fff", fontSize: "0.75rem", textTransform: "none",
                                                    borderRadius: "8px", px: 2,
                                                    "&:hover": { opacity: 0.9 },
                                                }}
                                            >
                                                Save Changes
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="small"
                                            onClick={startEditingQuestionnaire}
                                            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                                            sx={{
                                                color: colors.accent, fontSize: "0.75rem", textTransform: "none",
                                                borderRadius: "8px", px: 1.5,
                                                border: `1px solid ${alpha(colors.accent, 0.3)}`,
                                                "&:hover": { bgcolor: alpha(colors.accent, 0.08) },
                                            }}
                                        >
                                            Edit Answers
                                        </Button>
                                    )}
                                </Box>

                                <Stack spacing={2.5}>
                                    {sections.questionnaire.data.steps.map((step) => (
                                        <Box key={step.key}>
                                            <Typography sx={{ color: colors.accent, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1.25 }}>
                                                {step.label}
                                            </Typography>
                                            <Stack spacing={1}>
                                                {step.answers.map((answer, idx) => (
                                                    <Box key={idx} sx={{ display: "flex", gap: 2, py: 1, px: 2, borderRadius: "10px", bgcolor: alpha(colors.card, 0.5), border: `1px solid ${alpha(colors.border, 0.35)}`, alignItems: "center" }}>
                                                        <Typography sx={{ color: colors.muted, fontSize: "0.72rem", fontWeight: 500, minWidth: "35%", flexShrink: 0 }}>
                                                            {answer.prompt}
                                                        </Typography>
                                                        {editingQuestionnaire ? (
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                value={editResponses[answer.field_key] ?? ""}
                                                                onChange={(e) => setEditResponses((prev) => ({ ...prev, [answer.field_key]: e.target.value }))}
                                                                variant="outlined"
                                                                sx={{
                                                                    "& .MuiOutlinedInput-root": {
                                                                        fontSize: "0.82rem", color: colors.text,
                                                                        bgcolor: alpha(colors.card, 0.8),
                                                                        borderRadius: "8px",
                                                                        "& fieldset": { borderColor: alpha(colors.border, 0.5) },
                                                                        "&:hover fieldset": { borderColor: alpha(colors.accent, 0.3) },
                                                                        "&.Mui-focused fieldset": { borderColor: colors.accent },
                                                                    },
                                                                    "& .MuiOutlinedInput-input": { py: 0.75, px: 1.5 },
                                                                }}
                                                            />
                                                        ) : (
                                                            <Typography sx={{ color: colors.text, fontSize: "0.82rem", lineHeight: 1.5, wordBreak: "break-word" }}>
                                                                {formatAnswerValue(answer.value)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </ExpandableCard>

                    {/* PACKAGE */}
                    {(() => {
                        const hasPackage = !!sections.package;
                        const showBrowser = browsingPackages && !hasPackage;
                        const showBrowseButton = !hasPackage && !browsingPackages;

                        const cardProps = {
                            icon: <PackageIcon sx={{ fontSize: 20 }} />,
                            iconColor: "#f59e0b",
                            title: hasPackage ? (sections.package?.data.name ?? "Your Package") : "Your Package",
                            subtitle: hasPackage
                                ? `Starting at ${formatCurrency(sections.package!.data.base_price, sections.package!.data.currency || currency)}`
                                : showBrowser ? "Browse available packages" : "Select a package to get started",
                            statusChip: hasPackage ? { label: "Selected", color: "#f59e0b" } as const : undefined,
                            locked: false,
                            colors,
                        };

                        // No package, not browsing: show action button, no expandable children
                        if (showBrowseButton) {
                            return (
                                <ExpandableCard
                                    {...cardProps}
                                    action={
                                        <Button
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); openPackageBrowser(); }}
                                            sx={{
                                                fontSize: "0.75rem", fontWeight: 600,
                                                color: "#f59e0b", borderColor: alpha("#f59e0b", 0.3),
                                                borderRadius: "10px", textTransform: "none",
                                                "&:hover": { borderColor: "#f59e0b", bgcolor: alpha("#f59e0b", 0.08) },
                                            }}
                                            variant="outlined"
                                        >
                                            Browse Packages
                                        </Button>
                                    }
                                />
                            );
                        }

                        return (
                            <ExpandableCard {...cardProps} defaultOpen>
                        {/* Already-selected package view */}
                        {sections.package && (
                            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                                {sections.package.data.description && (
                                    <Typography sx={{ color: colors.muted, fontSize: "0.85rem", lineHeight: 1.7, mb: 2.5 }}>
                                        {sections.package.data.description}
                                    </Typography>
                                )}
                                {sections.package.data.films.length > 0 && (
                                    <Box>
                                        <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1 }}>
                                            Included Films
                                        </Typography>
                                        <Stack spacing={0.75}>
                                            {sections.package.data.films.map((film) => (
                                                <Box key={film.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.75, px: 1.5, borderRadius: "10px", bgcolor: alpha("#f59e0b", 0.06), border: `1px solid ${alpha("#f59e0b", 0.12)}` }}>
                                                    <FilmIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                                                    <Typography sx={{ color: colors.text, fontSize: "0.82rem", fontWeight: 500 }}>
                                                        {film.name}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Package browser view */}
                        {browsingPackages && !sections.package && (
                            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                                {loadingPackages ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                        <CircularProgress size={28} sx={{ color: "#f59e0b" }} />
                                    </Box>
                                ) : packageRequestSent ? (
                                    <Box sx={{ textAlign: "center", py: 3 }}>
                                        <CheckCircleIcon sx={{ fontSize: 40, color: colors.green, mb: 1 }} />
                                        <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>
                                            Package Request Submitted
                                        </Typography>
                                        <Typography sx={{ color: colors.muted, fontSize: "0.82rem" }}>
                                            We&apos;ll review your selection and get back to you soon.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        {/* Package comparison grid */}
                                        <Box sx={{
                                            display: "grid",
                                            gridTemplateColumns: { xs: "1fr", sm: availablePackages.length > 2 ? "repeat(3, 1fr)" : `repeat(${availablePackages.length || 1}, 1fr)` },
                                            gap: 2, mb: 3,
                                        }}>
                                            {availablePackages.map((pkg) => {
                                                const isSelected = selectedPkgId === pkg.id;
                                                return (
                                                    <Box
                                                        key={pkg.id}
                                                        onClick={() => setSelectedPkgId(isSelected ? null : pkg.id)}
                                                        sx={{
                                                            p: 2.5, borderRadius: "14px", cursor: "pointer",
                                                            bgcolor: isSelected ? alpha("#f59e0b", 0.08) : alpha(colors.bg, 0.5),
                                                            border: `1.5px solid ${isSelected ? "#f59e0b" : alpha(colors.border, 0.5)}`,
                                                            transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                                                            "&:hover": {
                                                                borderColor: isSelected ? "#f59e0b" : alpha("#f59e0b", 0.3),
                                                                bgcolor: alpha("#f59e0b", 0.04),
                                                            },
                                                        }}
                                                    >
                                                        <Typography sx={{ color: colors.text, fontWeight: 600, fontSize: "0.9rem", mb: 0.5 }}>
                                                            {pkg.name}
                                                        </Typography>
                                                        <Typography sx={{ color: "#f59e0b", fontWeight: 700, fontSize: "1.1rem", mb: 1 }}>
                                                            {formatCurrency(pkg.base_price, pkg.currency)}
                                                        </Typography>
                                                        {pkg.description && (
                                                            <Typography sx={{ color: colors.muted, fontSize: "0.78rem", lineHeight: 1.5 }}>
                                                                {pkg.description}
                                                            </Typography>
                                                        )}
                                                        {isSelected && (
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
                                                                <CheckCircleIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                                                                <Typography sx={{ color: "#f59e0b", fontSize: "0.72rem", fontWeight: 600 }}>Selected</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>

                                        {availablePackages.length === 0 && (
                                            <Typography sx={{ color: colors.muted, fontSize: "0.85rem", textAlign: "center", py: 2 }}>
                                                No packages available at this time.
                                            </Typography>
                                        )}

                                        {/* Notes field */}
                                        <TextField
                                            multiline
                                            rows={3}
                                            placeholder="Any notes or customization requests…"
                                            value={packageNotes}
                                            onChange={(e) => setPackageNotes(e.target.value)}
                                            fullWidth
                                            sx={{
                                                mb: 2,
                                                "& .MuiOutlinedInput-root": {
                                                    color: colors.text, fontSize: "0.85rem",
                                                    bgcolor: alpha(colors.bg, 0.5),
                                                    borderRadius: "12px",
                                                    "& fieldset": { borderColor: alpha(colors.border, 0.5) },
                                                    "&:hover fieldset": { borderColor: alpha("#f59e0b", 0.3) },
                                                    "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
                                                },
                                                "& .MuiInputBase-input::placeholder": { color: colors.muted, opacity: 1 },
                                            }}
                                        />

                                        {/* Actions */}
                                        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                                            <Button
                                                size="small"
                                                onClick={() => { setBrowsingPackages(false); setSelectedPkgId(null); setPackageNotes(""); }}
                                                sx={{ color: colors.muted, textTransform: "none", fontSize: "0.8rem" }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                disabled={!selectedPkgId || submittingPackage}
                                                onClick={submitPackageRequest}
                                                startIcon={submittingPackage ? <CircularProgress size={14} /> : undefined}
                                                sx={{
                                                    textTransform: "none", fontWeight: 600, fontSize: "0.8rem",
                                                    borderRadius: "10px",
                                                    background: `linear-gradient(135deg, #f59e0b, #d97706)`,
                                                    "&:hover": { background: `linear-gradient(135deg, #fbbf24, #f59e0b)` },
                                                    "&.Mui-disabled": { opacity: 0.5 },
                                                }}
                                            >
                                                {submittingPackage ? "Submitting…" : "Request This Package"}
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}
                    </ExpandableCard>
                        );
                    })()}

                    {/* ESTIMATE */}
                    <ExpandableCard
                        icon={<EstimateIcon sx={{ fontSize: 20 }} />}
                        iconColor="#06b6d4"
                        title={sections.estimate?.data.title ?? "Your Estimate"}
                        subtitle={sections.estimate
                            ? `${sections.estimate.data.estimate_number} — ${formatCurrency(sections.estimate.data.total_amount, currency)}`
                            : undefined}
                        statusChip={sections.estimate
                            ? { label: sections.estimate.data.status, color: "#06b6d4" }
                            : undefined}
                        locked={!sections.estimate}
                        lockedMessage="Your estimate will appear here once prepared"
                        colors={colors}
                    >
                        {sections.estimate && (() => {
                            const est = sections.estimate.data;
                            const CATEGORY_COLORS: Record<string, string> = {
                                equipment: "#f59e0b",
                                planning: "#22c55e",
                                coverage: "#ef4444",
                                "post-production": "#a855f7",
                                "ceremony film": "#ec4899",
                                "feature film": "#06b6d4",
                            };
                            const getCatColor = (cat: string) => CATEGORY_COLORS[cat.toLowerCase()] ?? "#7c4dff";
                            const toNum = (v: string | number) => typeof v === "string" ? parseFloat(v) : v;

                            // Group items by category
                            const groups: { category: string; items: EstimateItem[]; subtotal: number }[] = [];
                            const catMap = new Map<string, EstimateItem[]>();
                            for (const item of est.items) {
                                const cat = item.category || "Other";
                                if (!catMap.has(cat)) catMap.set(cat, []);
                                catMap.get(cat)!.push(item);
                            }
                            for (const [category, items] of catMap) {
                                const subtotal = items.reduce((sum, it) => sum + toNum(it.quantity) * toNum(it.unit_price), 0);
                                groups.push({ category, items, subtotal });
                            }

                            const itemsSubtotal = toNum(est.total_amount);
                            const { taxRate, taxAmount, total: grandTotal } = computeTaxBreakdown(itemsSubtotal, est.tax_rate ? toNum(est.tax_rate) : 0);

                            return (
                                <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.5 }}>
                                        {/* Left: Cost Breakdown */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1.5 }}>
                                                <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                                    Cost Breakdown
                                                </Typography>
                                                <Typography sx={{ color: alpha(colors.muted, 0.4), fontSize: "0.6rem", fontStyle: "italic" }}>
                                                    auto-generated from package
                                                </Typography>
                                            </Box>

                                            <Stack spacing={0}>
                                                {groups.map((group) => {
                                                    const catColor = getCatColor(group.category);
                                                    return (
                                                        <Box key={group.category}>
                                                            <Box sx={{
                                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                                py: 0.75, px: 1.5, mt: 1,
                                                                borderLeft: `3px solid ${catColor}`,
                                                                bgcolor: alpha(catColor, 0.06),
                                                                borderRadius: "0 6px 6px 0",
                                                            }}>
                                                                <Typography sx={{ color: catColor, fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                                                    {group.category}
                                                                </Typography>
                                                                <Typography sx={{ color: catColor, fontSize: "0.72rem", fontWeight: 700 }}>
                                                                    {formatCurrency(group.subtotal, currency)}
                                                                </Typography>
                                                            </Box>

                                                            {group.items.map((item) => {
                                                                const qty = toNum(item.quantity);
                                                                const price = toNum(item.unit_price);
                                                                const unitLabel = item.unit || (qty === 1 ? "" : "");
                                                                return (
                                                                    <Box key={item.id} sx={{
                                                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                                                        px: 1.5, py: 0.85,
                                                                        borderBottom: `1px solid ${alpha(colors.border, 0.15)}`,
                                                                    }}>
                                                                        <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 400, flex: 1, minWidth: 0 }}>
                                                                            {item.description}
                                                                        </Typography>
                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0, ml: 2 }}>
                                                                            <Typography sx={{ color: colors.muted, fontSize: "0.72rem" }}>
                                                                                {formatCurrency(price, currency)}
                                                                            </Typography>
                                                                            {(qty !== 1 || unitLabel) && (
                                                                                <Typography sx={{ color: alpha(colors.muted, 0.5), fontSize: "0.68rem" }}>
                                                                                    &times; {qty}{unitLabel ? ` ${unitLabel}` : ""}
                                                                                </Typography>
                                                                            )}
                                                                            <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 600, minWidth: 65, textAlign: "right" }}>
                                                                                {formatCurrency(qty * price, currency)}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>

                                            {est.notes && (
                                                <Box sx={{ mt: 2 }}>
                                                    <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 0.75 }}>
                                                        Internal Notes
                                                    </Typography>
                                                    <Typography sx={{ color: colors.muted, fontSize: "0.78rem", lineHeight: 1.6, fontStyle: "italic" }}>
                                                        {est.notes}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Right: Summary sidebar */}
                                        <Box sx={{
                                            width: { xs: "100%", md: 220 }, flexShrink: 0,
                                            bgcolor: alpha(colors.card, 0.5),
                                            border: `1px solid ${alpha(colors.border, 0.35)}`,
                                            borderRadius: "14px", p: 2.5,
                                            alignSelf: "flex-start",
                                        }}>
                                            <Box sx={{ textAlign: "center", mb: 2 }}>
                                                <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 0.5 }}>
                                                    Total Amount
                                                </Typography>
                                                <Typography sx={{ color: "#06b6d4", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.2 }}>
                                                    {formatCurrency(grandTotal, currency)}
                                                </Typography>
                                                {taxRate > 0 && (
                                                    <Typography sx={{ color: colors.muted, fontSize: "0.65rem", mt: 0.25 }}>
                                                        {formatCurrency(itemsSubtotal, currency)} + {taxRate}% tax
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Divider sx={{ borderColor: alpha(colors.border, 0.3), mb: 1.5 }} />

                                            <Stack spacing={1} sx={{ mb: 1.5 }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Typography sx={{ color: colors.muted, fontSize: "0.72rem" }}>Subtotal</Typography>
                                                    <Typography sx={{ color: colors.text, fontSize: "0.72rem", fontWeight: 600 }}>{formatCurrency(itemsSubtotal, currency)}</Typography>
                                                </Box>
                                                {taxRate > 0 && (
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <Typography sx={{ color: colors.muted, fontSize: "0.72rem" }}>Tax rate</Typography>
                                                        <Typography sx={{ color: colors.text, fontSize: "0.72rem", fontWeight: 600 }}>{taxRate}%</Typography>
                                                    </Box>
                                                )}
                                                {est.deposit_required && Number(est.deposit_required) > 0 && (
                                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                        <Typography sx={{ color: colors.muted, fontSize: "0.72rem" }}>Deposit</Typography>
                                                        <Typography sx={{ color: colors.text, fontSize: "0.72rem", fontWeight: 600 }}>{formatCurrency(est.deposit_required, currency)}</Typography>
                                                    </Box>
                                                )}
                                            </Stack>

                                            {est.payment_method && (
                                                <>
                                                    <Divider sx={{ borderColor: alpha(colors.border, 0.3), mb: 1.5 }} />
                                                    <Box sx={{ mb: 1.5 }}>
                                                        <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 0.5 }}>
                                                            Payment
                                                        </Typography>
                                                        <Typography sx={{ color: colors.muted, fontSize: "0.65rem", mb: 0.25 }}>Payment Method</Typography>
                                                        <Typography sx={{ color: colors.text, fontSize: "0.78rem", fontWeight: 500 }}>{est.payment_method}</Typography>
                                                    </Box>
                                                </>
                                            )}

                                            {est.payment_milestones.length > 0 && (
                                                <>
                                                    <Divider sx={{ borderColor: alpha(colors.border, 0.3), mb: 1.5 }} />
                                                    <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 1 }}>
                                                        Payment Schedule
                                                    </Typography>
                                                    <Stack spacing={1}>
                                                        {est.payment_milestones.map((ms) => (
                                                            <Box key={ms.id} sx={{
                                                                p: 1.25, borderRadius: "8px",
                                                                bgcolor: alpha(colors.card, 0.6),
                                                                border: `1px solid ${alpha(colors.border, 0.25)}`,
                                                            }}>
                                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                                                                    <Typography sx={{ color: colors.text, fontSize: "0.72rem", fontWeight: 600 }}>{ms.label}</Typography>
                                                                    <Typography sx={{ color: "#06b6d4", fontSize: "0.78rem", fontWeight: 700 }}>
                                                                        {formatCurrency(ms.amount, currency)}
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                    <Typography sx={{ color: colors.muted, fontSize: "0.62rem" }}>
                                                                        {formatDate(ms.due_date)}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={ms.status}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 16, fontSize: "0.5rem", fontWeight: 700,
                                                                            bgcolor: ms.status === "PAID" ? alpha(colors.green, 0.12) : alpha(colors.border, 0.3),
                                                                            color: ms.status === "PAID" ? colors.green : colors.muted,
                                                                            "& .MuiChip-label": { px: 0.5 },
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </>
                                            )}

                                            <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${alpha(colors.border, 0.2)}` }}>
                                                <Typography sx={{ color: colors.muted, fontSize: "0.62rem", mb: 0.25 }}>Issued: {formatDate(est.issue_date)}</Typography>
                                                <Typography sx={{ color: colors.muted, fontSize: "0.62rem" }}>Valid until: {formatDate(est.expiry_date)}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })()}
                    </ExpandableCard>

                    {/* PROPOSAL */}
                    <Box ref={proposalRef}>
                    {sections.proposal ? (() => {
                        const pd = sections.proposal.data;
                        const alreadyResponded = !!pd.client_response;
                        const proposalTheme = (pd.content as any)?.theme;
                        const proposalColors = getThemeColors(proposalTheme);
                        return (
                            <Box sx={{
                                border: `1px solid`,
                                borderColor: sections.proposal.status === 'accepted' ? alpha(colors.green, 0.35) : alpha('#a855f7', 0.3),
                                borderRadius: '20px',
                                overflow: 'hidden',
                            }}>
                                <ProposalRenderer
                                    content={pd.content}
                                    brand={brand}
                                    estimate={sections.estimate?.data as any}
                                    pkg={sections.package?.data as any ?? null}
                                    eventDays={pd.event_days ?? []}
                                    films={pd.films ?? []}
                                    clientName={firstName || 'You'}
                                    weddingDate={data.event_date}
                                    venueDetails={data.venue}
                                    venueAddress={data.venue_address}
                                    colors={proposalColors}
                                    ctaSlot={
                                        <ProposalAcceptanceBar
                                            colors={proposalColors}
                                            isDark={!proposalTheme || proposalTheme === 'cinematic-dark'}
                                            alreadyResponded={alreadyResponded}
                                            clientResponse={pd.client_response?.toLowerCase() ?? null}
                                            clientResponseMessage={pd.client_response_message}
                                            responding={proposalResponding}
                                            responseSuccess={proposalResponseSuccess}
                                            onAccept={handleProposalAccept}
                                            onRequestChanges={handleProposalRequestChanges}
                                        />
                                    }
                                />
                            </Box>
                        );
                    })() : (
                        <ExpandableCard
                            icon={<ProposalIcon sx={{ fontSize: 20 }} />}
                            iconColor="#a855f7"
                            title="Your Proposal"
                            locked
                            lockedMessage="Your personalized proposal will appear here once it's ready"
                            colors={colors}
                        />
                    )}
                    </Box>

                    {/* CONTRACT */}
                    <ExpandableCard
                        icon={<ContractIcon sx={{ fontSize: 20 }} />}
                        iconColor="#6366f1"
                        title={sections.contract?.data.title ?? "Your Contract"}
                        subtitle={sections.contract
                            ? sections.contract.data.contract_status === "Signed"
                                ? `Signed ${formatDate(sections.contract.data.signed_date)}`
                                : "Ready for review and signing"
                            : undefined}
                        statusChip={sections.contract
                            ? sections.contract.data.contract_status === "Signed"
                                ? { label: "Signed", color: colors.green }
                                : { label: "Action Required", color: "#f59e0b" }
                            : undefined}
                        locked={!sections.contract}
                        lockedMessage="Your contract will appear here once your proposal is finalized"
                        colors={colors}
                    >
                        {sections.contract && (
                            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                                {sections.contract.data.signers.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1 }}>
                                            Signers
                                        </Typography>
                                        <Stack spacing={0.75}>
                                            {sections.contract.data.signers.map((signer) => (
                                                <Box key={signer.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1, borderRadius: "10px", bgcolor: alpha(colors.card, 0.5), border: `1px solid ${alpha(colors.border, 0.3)}` }}>
                                                    <Box>
                                                        <Typography sx={{ color: colors.text, fontSize: "0.82rem", fontWeight: 500 }}>{signer.name}</Typography>
                                                        <Typography sx={{ color: colors.muted, fontSize: "0.68rem", textTransform: "capitalize" }}>{signer.role}</Typography>
                                                    </Box>
                                                    <Chip
                                                        label={signer.status === "signed" ? "Signed" : "Pending"}
                                                        size="small"
                                                        sx={{
                                                            height: 20, fontSize: "0.6rem", fontWeight: 700,
                                                            bgcolor: signer.status === "signed" ? alpha(colors.green, 0.12) : alpha("#f59e0b", 0.12),
                                                            color: signer.status === "signed" ? colors.green : "#f59e0b",
                                                            "& .MuiChip-label": { px: 0.75 },
                                                        }}
                                                    />
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {sections.contract.data.contract_status !== "Signed" && sections.contract.data.signing_token && (
                                    <ActionLink href={`/sign/${sections.contract.data.signing_token}`} label="Review & Sign" color="#6366f1" />
                                )}
                            </Box>
                        )}
                    </ExpandableCard>

                    {/* INVOICES / PAYMENTS */}
                    <ExpandableCard
                        icon={<InvoiceIcon sx={{ fontSize: 20 }} />}
                        iconColor="#ec4899"
                        title="Payments"
                        subtitle={sections.invoices
                            ? `${sections.invoices.data.length} invoice${sections.invoices.data.length !== 1 ? "s" : ""}`
                            : undefined}
                        statusChip={sections.invoices
                            ? sections.invoices.data.every(i => i.status === "Paid")
                                ? { label: "All Paid", color: colors.green }
                                : { label: `${sections.invoices.data.filter(i => i.status !== "Paid").length} Outstanding`, color: "#ec4899" }
                            : undefined}
                        locked={!sections.invoices}
                        lockedMessage="Your invoices and payment history will appear here"
                        colors={colors}
                    >
                        {sections.invoices && (
                            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                                <Stack spacing={0.75}>
                                    {sections.invoices.data.map((inv) => (
                                        <Box key={inv.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.25, borderRadius: "10px", bgcolor: alpha(colors.card, 0.5), border: `1px solid ${alpha(colors.border, 0.3)}` }}>
                                            <Box>
                                                <Typography sx={{ color: colors.text, fontSize: "0.82rem", fontWeight: 500 }}>{inv.invoice_number}</Typography>
                                                <Typography sx={{ color: colors.muted, fontSize: "0.68rem" }}>
                                                    {inv.status === "Paid"
                                                        ? `Paid ${formatDate(inv.paid_date)}`
                                                        : `Due ${formatDate(inv.due_date)}`}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography sx={{ color: colors.text, fontSize: "0.85rem", fontWeight: 600 }}>
                                                    {formatCurrency(inv.total_amount, currency)}
                                                </Typography>
                                                <Chip
                                                    label={inv.status}
                                                    size="small"
                                                    sx={{
                                                        height: 18, fontSize: "0.55rem", fontWeight: 700,
                                                        bgcolor: inv.status === "Paid" ? alpha(colors.green, 0.12) : inv.status === "Overdue" ? alpha("#ef4444", 0.12) : alpha("#f59e0b", 0.12),
                                                        color: inv.status === "Paid" ? colors.green : inv.status === "Overdue" ? "#ef4444" : "#f59e0b",
                                                        "& .MuiChip-label": { px: 0.75 },
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </ExpandableCard>

                    {/* WELCOME PACK */}
                    {sections.welcome_pack && (
                        <ExpandableCard
                            icon={<WelcomePackIcon sx={{ fontSize: 20 }} />}
                            iconColor="#10b981"
                            title="Welcome Pack"
                            subtitle={`Sent ${formatDate(sections.welcome_pack.data.sent_at)}`}
                            statusChip={{ label: "Sent", color: "#10b981" }}
                            locked={false}
                            lockedMessage=""
                            defaultOpen
                            colors={colors}
                        >
                            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: "12px", bgcolor: alpha("#10b981", 0.06), border: `1px solid ${alpha("#10b981", 0.15)}`, mb: 2 }}>
                                    <MarkEmailReadIcon sx={{ fontSize: 32, color: "#10b981", flexShrink: 0 }} />
                                    <Box>
                                        <Typography sx={{ color: colors.text, fontWeight: 700, fontSize: "0.95rem", mb: 0.25 }}>
                                            You&apos;re all booked! 🎉
                                        </Typography>
                                        <Typography sx={{ color: colors.muted, fontSize: "0.82rem", lineHeight: 1.5 }}>
                                            Your welcome pack has been sent. We&apos;re so excited to work with you and can&apos;t wait for your big day!
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: "0.68rem", textAlign: "right" }}>
                                    Welcome pack sent on {formatDate(sections.welcome_pack.data.sent_at, { month: "long", day: "numeric", year: "numeric" })}
                                </Typography>
                            </Box>
                        </ExpandableCard>
                    )}

                </Stack>
            </Box>

            {/* ── Footer ──────────────────────────────────────── */}
            {brand && (
                <Box
                    ref={footerReveal.ref}
                    sx={{
                        borderTop: `1px solid ${alpha(colors.border, 0.4)}`,
                        background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${alpha(colors.accent, 0.04)} 0%, ${alpha(colors.card, 0.5)} 70%)`,
                        py: { xs: 5, md: 7 }, px: 3,
                        ...revealSx(footerReveal.visible, 0),
                    }}
                >
                    <Box sx={{ maxWidth: 760, mx: "auto" }}>
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
                                    <IconButton size="small" component="a" href={brand.website} target="_blank" rel="noopener noreferrer" sx={{ color: colors.muted, mt: 1.5, "&:hover": { color: colors.accent, transform: "scale(1.1)" } }}>
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
                                            <Typography component="a" href={`mailto:${brand.email}`} sx={{ color: colors.muted, textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: colors.accent } }}>
                                                {brand.email}
                                            </Typography>
                                        </Box>
                                    )}
                                    {brand.phone && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <PhoneIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.6) }} />
                                            <Typography component="a" href={`tel:${brand.phone}`} sx={{ color: colors.muted, textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: colors.accent } }}>
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
                            &copy; {new Date().getFullYear()} {brandName}. Powered by ProjectFlo.
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
