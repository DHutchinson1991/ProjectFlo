"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
    Box, Typography, Stack, IconButton, Button, CircularProgress,
    TextField, Chip, Dialog, DialogTitle, DialogContent, Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Assignment as FormIcon,
    Description as ProposalIcon,
    Gavel as ContractIcon,
    Inventory as PackageIcon,
    RequestQuote as EstimateIcon,
    Receipt as InvoiceIcon,
    Print as PrintIcon,
    CardGiftcard as WelcomePackIcon,
    PhoneInTalk as MeetingIcon,
    Payments as PaymentsIcon,
} from "@mui/icons-material";

import { clientPortalApi } from "@/features/workflow/client-portal/api";
import { publicInquiryWizardApi } from "@/features/workflow/inquiry-wizard/api";
import {
    fadeIn, scaleIn, shimmer,
} from "@/features/workflow/proposals/utils/portal/animations";
import { getPortalDashboardColors, getThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import { formatDate, formatCurrency, formatAnswerValue } from "@/features/workflow/proposals/utils/portal/formatting";
import { DEFAULT_CURRENCY } from "@projectflo/shared";
import type { PortalBrand, PortalProposalSectionData, JourneyStep } from "@/features/workflow/proposals/types/portal";
import ProposalView from "@/features/workflow/proposals/components/ProposalView";
import ProposalAcceptanceBar from "@/features/workflow/proposals/components/ProposalAcceptanceBar";
import AcceptanceWizard from "@/features/workflow/proposals/components/AcceptanceWizard";
import PaymentTermsSection from "@/features/workflow/proposals/components/sections/PaymentTermsSection";
import { AcceptedPaymentMethods } from "@/features/finance/stripe/components/AcceptedPaymentMethods";
import {
    FilmJourneyTracker,
    JourneyProgressRail,
    BackgroundMesh,
    PortalOverviewPanels,
    ExpandableCard,
    ActionLink,
    EstimateContent,
    InvoicesContent,
    PortalFooter,
    QuestionnaireContent,
    PackageContent,
    ContractContent,
    WelcomePackContent,
} from "@/features/workflow/proposals/components/portal";
import type {
    InquiryReview, EstimateData, ContractData, InvoiceData, PackageData,
} from "@/features/workflow/proposals/components/portal/PortalSectionContent";

/* ── Types ────────────────────────────────────────────────── */

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
    payment_schedule: {
        id: number;
        name: string;
        rules: { label: string; amount_type: string; amount_value: number; trigger_type: string; trigger_days?: number | null }[];
    } | null;
    payment_methods?: { id: number; type: string; label: string; is_default: boolean }[];
    journeySteps?: JourneyStep[];
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

type PortalModalKey = "meetings" | null;
type PortalTab = "overview" | "questionnaire" | "package" | "estimate" | "proposal" | "contract" | "invoices";

/* ── Main Component ──────────────────────────────────────── */

export function ClientPortalScreen({ token }: { token: string }) {
    const colors = getPortalDashboardColors();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const initialTab = (searchParams.get('tab') as PortalTab) || 'overview';
    const isPreview = searchParams.has('preview');
    const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);

    // Persist active tab in URL so refresh returns to same tab
    const handleTabChange = useCallback((tab: PortalTab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        if (tab === 'overview') {
            params.delete('tab');
        } else {
            params.set('tab', tab);
        }
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [searchParams, router, pathname]);

    const [data, setData] = useState<PortalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Questionnaire inline save
    const [, setSavingField] = useState(false);

    // Proposal response
    const [proposalResponding, setProposalResponding] = useState(false);
    const [proposalResponseSuccess, setProposalResponseSuccess] = useState(false);
    // Acceptance wizard flow (congrats → contract → payments)
    const [showAcceptanceWizard, setShowAcceptanceWizard] = useState(false);
    // Package browsing
    const [browsingPackages, setBrowsingPackages] = useState(false);
    const [availablePackages, setAvailablePackages] = useState<Array<{
        id: number; name: string; description: string | null;
        category: string | null; currency: string; contents: unknown;
    }>>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [selectedPkgId, setSelectedPkgId] = useState<number | null>(null);
    const [packageNotes, setPackageNotes] = useState("");
    const [submittingPackage, setSubmittingPackage] = useState(false);
    const [packageRequestSent, setPackageRequestSent] = useState(false);
    const [activeModal, setActiveModal] = useState<PortalModalKey>(null);

    // Journey rail scroll target
    const currentStepRef = useRef<HTMLDivElement>(null);

    const fetchPortal = useCallback(async () => {
        try {
            setLoading(true);
            const result = await clientPortalApi.getByToken(token);
            setData(result as unknown as PortalData);
        } catch {
            setError("This portal could not be found or may have expired.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Silent background refresh (no loading spinner)
    const refreshPortal = useCallback(async () => {
        try {
            const result = await clientPortalApi.getByToken(token);
            setData(result as unknown as PortalData);
        } catch { /* silent — keep existing data on transient failure */ }
    }, [token]);

    useEffect(() => { if (token) fetchPortal(); }, [token, fetchPortal]);

    // Poll for live updates every 5 seconds
    useEffect(() => {
        if (!token || !data) return;
        const interval = setInterval(refreshPortal, 5_000);
        return () => clearInterval(interval);
    }, [token, !!data, refreshPortal]);

    /* ── Proposal handlers ──────────────────────────── */

    const handleProposalAccept = useCallback(async () => {
        setProposalResponding(true);
        try {
            await clientPortalApi.respondToProposal(token, 'Accepted');
            setProposalResponseSuccess(true);
            await fetchPortal();
            // Trigger the acceptance wizard flow
            setShowAcceptanceWizard(true);
        } catch { /* stay on form */ } finally { setProposalResponding(false); }
    }, [token, fetchPortal]);

    const handleProposalRequestChanges = useCallback(async (message: string) => {
        setProposalResponding(true);
        try {
            await clientPortalApi.respondToProposal(token, 'ChangesRequested', message);
            setProposalResponseSuccess(true);
            await fetchPortal();
        } catch { /* stay on form */ } finally { setProposalResponding(false); }
    }, [token, fetchPortal]);

    const handleProposalReconsideration = useCallback(async (message: string) => {
        setProposalResponding(true);
        try {
            await clientPortalApi.respondToProposal(token, 'Reconsideration', message);
            setProposalResponseSuccess(true);
            await fetchPortal();
        } catch { /* stay on form */ } finally { setProposalResponding(false); }
    }, [token, fetchPortal]);

    const handleSectionNote = useCallback(async (sectionType: string, note: string) => {
        if (isPreview) return;
        try {
            await clientPortalApi.saveSectionNote(token, sectionType, note);
            await refreshPortal();
        } catch { /* silent */ }
    }, [token, isPreview, refreshPortal]);

    /* ── Questionnaire handlers ─────────────────────── */

    const saveQuestionnaireField = useCallback(async (fieldKey: string, value: unknown) => {
        if (!data?.sections?.questionnaire) return;
        const submissionId = data.sections.questionnaire.data.submission_id;
        setSavingField(true);
        try {
            await publicInquiryWizardApi.updateSubmission(submissionId, { [fieldKey]: value });
            await refreshPortal();
        } finally { setSavingField(false); }
    }, [data, refreshPortal]);

    /* ── Package handlers ───────────────────────────── */

    const openPackageBrowser = async () => {
        setBrowsingPackages(true);
        setLoadingPackages(true);
        try {
            const result = await clientPortalApi.getPackageOptions(token);
            setAvailablePackages(result.packages ?? []);
        } catch { setAvailablePackages([]); } finally { setLoadingPackages(false); }
    };

    const submitPackageRequest = async () => {
        try {
            setSubmittingPackage(true);
            await clientPortalApi.submitPackageRequest(token, {
                selected_package_id: selectedPkgId ?? undefined,
                notes: packageNotes || undefined,
            });
            setPackageRequestSent(true);
            await fetchPortal();
        } catch { /* stay on form */ } finally { setSubmittingPackage(false); }
    };

    /* ── Derived ─────────────────────────────────────── */

    const brand = data?.brand ?? null;
    const brandName = brand?.display_name || brand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const firstName = data?.contact?.first_name || "";
    const contactLastName = data?.contact?.last_name || "";
    const currency = brand?.currency ?? DEFAULT_CURRENCY;
    const journeySteps = data?.journeySteps ?? [];
    const questionnaire = data?.sections?.questionnaire?.data ?? null;

    /* Extract partner info + contact role from wizard answers */
    const wizardAnswers = React.useMemo(() => {
        if (!questionnaire) return { partnerFirstName: null, partnerLastName: null, contactRole: null };
        const map = new Map<string, unknown>();
        for (const step of questionnaire.steps) {
            for (const a of step.answers) map.set(a.field_key, a.value);
        }
        return {
            partnerFirstName: (map.get("partner_first_name") as string) || null,
            partnerLastName: (map.get("partner_last_name") as string) || null,
            contactRole: (map.get("contact_role") as string) || null,
        };
    }, [questionnaire]);

    /* Extract producer name from crew slots */
    const producerName = React.useMemo(() => {
        const pd = data?.sections?.proposal?.data;
        if (!pd) return null;
        for (const day of pd.event_days ?? []) {
            for (const slot of (day as any).day_crew_slots ?? []) {
                const roleName = slot.job_role?.name?.toLowerCase() ?? "";
                if (roleName.includes("producer") && slot.crew?.contact) {
                    const c = slot.crew.contact;
                    return [c.first_name, c.last_name].filter(Boolean).join(" ") || null;
                }
            }
        }
        return null;
    }, [data?.sections?.proposal?.data]);

    const meetingRows = React.useMemo(() => {
        if (!questionnaire) return [] as Array<{ label: string; value: string }>;
        const rows: Array<{ label: string; value: string }> = [];
        const callPattern = /(call|meeting|zoom|google meet|teams|phone|schedule|discovery)/i;
        const detailPattern = /(date|time|method|link|where|location|number|timezone|availability)/i;

        for (const step of questionnaire.steps) {
            for (const answer of step.answers) {
                const search = `${answer.prompt} ${answer.field_key}`;
                if (callPattern.test(search) || detailPattern.test(search)) {
                    const formatted = formatAnswerValue(answer.value);
                    if (formatted && formatted !== "-") {
                        rows.push({ label: answer.prompt, value: formatted });
                    }
                }
            }
        }
        return rows;
    }, [questionnaire]);

    const handleJourneyStepAction = useCallback((step: JourneyStep) => {
        if (step.key === "inquiry_received") {
            handleTabChange("questionnaire");
            return true;
        }
        if (step.key === "proposal_sent" || step.key === "proposal_accepted") {
            handleTabChange("proposal");
            return true;
        }
        if (step.key === "schedule_discovery" || step.key === "discovery_complete") {
            setActiveModal("meetings");
            return true;
        }
        return false;
    }, [handleTabChange]);

    const isJourneyStepClickable = useCallback((step: JourneyStep) => (
        step.key === "schedule_discovery" ||
        step.key === "discovery_complete" ||
        step.key === "inquiry_received" ||
        step.key === "proposal_sent" ||
        step.key === "proposal_accepted"
    ), []);

    /* ── Loading state ───────────────────────────────── */

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: colors.bg, gap: 3 }}>
                {[180, 120, 240].map((w, i) => (
                    <Box key={i} sx={{ width: w, height: 10, borderRadius: 5, background: "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)", backgroundSize: "200% 100%", animation: `${shimmer} 1.6s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                ))}
            </Box>
        );
    }

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

    // Proposal theme colors for background takeover
    const proposalTheme = (sections.proposal?.data?.content as any)?.theme;
    const proposalColors = activeTab === 'proposal' && sections.proposal ? getThemeColors(proposalTheme) : null;

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: proposalColors?.bg ?? colors.bg, color: colors.text, overflowX: "hidden", scrollBehavior: "smooth", WebkitFontSmoothing: "antialiased", position: 'relative', transition: 'background-color 0.6s ease' }}>
            {/* Animated background gradient mesh — shifts to proposal palette on proposal tab */}
            <BackgroundMesh
                {...(proposalColors ? {
                    primary: proposalColors.gradient1,
                    secondary: proposalColors.gradient2,
                    tertiary: proposalColors.accent,
                    cool: proposalColors.gradient1,
                } : {})}
            />

            {/* Top Nav */}
            <PortalNav
                brand={brand} brandName={brandName} brandInitial={brandInitial}
                sections={sections} colors={colors}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            <Box sx={{ maxWidth: 860, mx: "auto", px: { xs: 2, md: 3 }, pt: { xs: 4, md: 5 }, pb: { xs: 4, md: 6 } }}>
                {/* Overview tab */}
                {activeTab === "overview" && (
                    <>
                        {/* Journey Tracker Animation */}
                        {journeySteps.length > 0 && (
                            <FilmJourneyTracker
                                steps={journeySteps}
                                portalToken={token}
                                colors={colors}
                                onStepCtaClick={handleJourneyStepAction}
                            />
                        )}

                        {/* Journey Progress Rail */}
                        {journeySteps.length > 0 && (
                            <Box sx={{ mb: 1, mt: -1 }}>
                                <JourneyProgressRail
                                    steps={journeySteps}
                                    colors={colors}
                                    currentStepRef={currentStepRef}
                                    onStepCtaClick={handleJourneyStepAction}
                                    onStepClick={handleJourneyStepAction}
                                    isStepClickable={isJourneyStepClickable}
                                />
                            </Box>
                        )}

                        <PortalOverviewPanels
                            sections={{
                                questionnaire: sections.questionnaire,
                                estimate: sections.estimate,
                                proposal: sections.proposal,
                                contract: sections.contract,
                                invoices: sections.invoices,
                            }}
                            colors={colors}
                            onTabChange={handleTabChange}
                        />
                    </>
                )}

                {activeTab === "questionnaire" && (
                    <QuestionnaireCard sections={sections} colors={colors}
                        firstName={firstName}
                        portalToken={token}
                        paymentSchedule={data?.payment_schedule ?? null}
                        onFieldSave={saveQuestionnaireField} />
                )}

                {activeTab === "package" && (
                    <PackageCard sections={sections} colors={colors}
                        browsingPackages={browsingPackages} loadingPackages={loadingPackages}
                        availablePackages={availablePackages} selectedPkgId={selectedPkgId}
                        packageNotes={packageNotes} submittingPackage={submittingPackage}
                        packageRequestSent={packageRequestSent}
                        onBrowse={openPackageBrowser} onSubmit={submitPackageRequest}
                        onCancel={() => { setBrowsingPackages(false); setSelectedPkgId(null); setPackageNotes(""); }}
                        onSelectPkg={setSelectedPkgId} onNotesChange={setPackageNotes} />
                )}

                {activeTab === "estimate" && (
                    <EstimateCard sections={sections} colors={colors} currency={currency}
                        paymentSchedule={data?.payment_schedule ?? null} brandName={brandName}
                        paymentMethods={data?.payment_methods ?? []} />
                )}

                {activeTab === "proposal" && null}

                {activeTab === "contract" && (
                    <ContractCard sections={sections} colors={colors} />
                )}

                {activeTab === "invoices" && (
                    <InvoicesCard sections={sections} colors={colors} currency={currency} />
                )}
            </Box>

            {/* Proposal tab — full width, outside constrained container */}
            {activeTab === "proposal" && !showAcceptanceWizard && (
                <ProposalCard sections={sections} data={data}
                    brand={brand} firstName={firstName} contactLastName={contactLastName} colors={colors}
                    currency={currency}
                    isPreview={isPreview}
                    partnerFirstName={wizardAnswers.partnerFirstName}
                    partnerLastName={wizardAnswers.partnerLastName}
                    contactRole={wizardAnswers.contactRole}
                    producerName={producerName}
                    proposalResponding={proposalResponding}
                    proposalResponseSuccess={proposalResponseSuccess}
                    showingAcceptanceWizard={showAcceptanceWizard}
                    onAccept={handleProposalAccept}
                    onRequestChanges={handleProposalRequestChanges}
                    onRequestReconsideration={handleProposalReconsideration}
                    onContinueSetup={
                        sections.proposal?.status === 'accepted' &&
                        sections.contract?.data?.contract_status !== 'Signed'
                            ? () => setShowAcceptanceWizard(true)
                            : undefined
                    }
                    onSectionNote={isPreview ? undefined : handleSectionNote}
                    footerSlot={brand ? <PortalFooter brand={brand} colors={colors} /> : undefined} />
            )}

            {/* Acceptance Wizard — shown after proposal acceptance */}
            {activeTab === "proposal" && showAcceptanceWizard && (
                <AcceptanceWizard
                    colors={getThemeColors((sections.proposal?.data?.content as any)?.theme)}
                    clientName={firstName || 'there'}
                    brandName={brandName}
                    brandLogoUrl={brand?.logo_url}
                    contractData={sections.contract?.data ?? null}
                    portalToken={token}
                    onComplete={() => {
                        setShowAcceptanceWizard(false);
                        handleTabChange('overview');
                    }}
                    onRefresh={refreshPortal}
                />
            )}

            <PortalActionModal
                open={activeModal !== null}
                modal={activeModal}
                onClose={() => setActiveModal(null)}
                colors={colors}
                sections={sections}
                questionnaire={questionnaire}
                meetingRows={meetingRows}
                onJumpTo={(tab) => {
                    setActiveModal(null);
                    handleTabChange(tab as PortalTab);
                }}
            />

            {brand && activeTab !== 'proposal' && <PortalFooter brand={brand} colors={colors} />}
        </Box>
    );
}

/* ── Portal Nav ─────────────────────────────────────────── */

const NAV_ITEMS: Array<{
    label: string;
    tab: PortalTab;
    sectionKey: keyof PortalData["sections"] | null;
}> = [
    { label: "Overview", tab: "overview", sectionKey: null },
    { label: "Questionnaire", tab: "questionnaire", sectionKey: "questionnaire" },
    { label: "Estimate", tab: "estimate", sectionKey: "estimate" },
    { label: "Proposal", tab: "proposal", sectionKey: "proposal" },
    { label: "Contract", tab: "contract", sectionKey: "contract" },
    { label: "Payments", tab: "invoices", sectionKey: "invoices" },
];

function PortalNav({ brand, brandName, brandInitial, sections, colors, activeTab, onTabChange }: {
    brand: PortalBrand | null; brandName: string; brandInitial: string;
    sections: PortalData["sections"] | null;
    colors: ReturnType<typeof getPortalDashboardColors>;
    activeTab: PortalTab;
    onTabChange: (tab: PortalTab) => void;
}) {
    const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
        onTabChange(item.tab);
    };

    const visibleItems = NAV_ITEMS;

    return (
        <Box sx={{
            position: "sticky", top: 0, zIndex: 50,
            backdropFilter: "blur(20px) saturate(1.8)",
            bgcolor: alpha(colors.card, 0.75),
            borderBottom: `1px solid ${alpha(colors.border, 0.5)}`,
            animation: `${fadeIn} 0.4s ease both`,
            "@media print": { display: "none" },
        }}>
            <Box sx={{
                maxWidth: 960, mx: "auto",
                display: "flex", alignItems: "center",
                px: { xs: 2, md: 3 }, py: 0, gap: 0,
            }}>
                {/* Brand mark */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 3, py: 1.5, flexShrink: 0 }}>
                    {brand?.logo_url ? (
                        <Box component="img" src={brand.logo_url} alt={brandName} sx={{ height: 26, width: "auto", objectFit: "contain" }} />
                    ) : brandInitial ? (
                        <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.75rem", lineHeight: 1 }}>{brandInitial}</Typography>
                        </Box>
                    ) : null}
                    <Typography sx={{ fontWeight: 600, color: colors.text, letterSpacing: "0.06em", fontSize: "0.75rem", textTransform: "uppercase", display: { xs: "none", sm: "block" } }}>
                        {brandName}
                    </Typography>
                </Box>

                {/* Divider */}
                <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: alpha(colors.border, 0.4), mr: 2, flexShrink: 0 }} />

                {/* Nav links — horizontally scrollable on mobile */}
                <Box sx={{
                    display: "flex", alignItems: "center", gap: 0, flex: 1,
                    minWidth: 0,
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                }}>
                    {visibleItems.map((item) => {
                        const isActive = activeTab === item.tab;
                        return (
                            <Box
                                key={item.tab}
                                component="button"
                                onClick={() => handleNavClick(item)}
                                sx={{
                                    display: "flex", alignItems: "center", gap: 0.75,
                                    px: { xs: 1.5, md: 2 }, py: 1.75,
                                    background: "none", border: "none", cursor: "pointer",
                                    color: isActive ? colors.text : alpha(colors.text, 0.78),
                                    fontFamily: "inherit",
                                    fontSize: "0.75rem", fontWeight: isActive ? 600 : 500,
                                    letterSpacing: "0.03em",
                                    whiteSpace: "nowrap",
                                    borderBottom: isActive
                                        ? `2px solid ${colors.accent}`
                                        : "2px solid transparent",
                                    transition: "color 0.2s, border-color 0.2s",
                                    "&:hover": { color: colors.text },
                                    flexShrink: 0,
                                }}
                            >
                                {item.label}
                            </Box>
                        );
                    })}
                </Box>

                {/* Print */}
                <IconButton size="small" onClick={() => window.print()} sx={{ ml: 1, color: alpha(colors.muted, 0.5), "&:hover": { color: colors.text }, flexShrink: 0 }} aria-label="Print">
                    <PrintIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
        </Box>
    );
}

function PortalActionModal({
    open,
    modal,
    onClose,
    colors,
    sections,
    questionnaire,
    meetingRows,
    onJumpTo,
}: {
    open: boolean;
    modal: PortalModalKey;
    onClose: () => void;
    colors: ReturnType<typeof getPortalDashboardColors>;
    sections: PortalData["sections"];
    questionnaire: InquiryReview | null;
    meetingRows: Array<{ label: string; value: string }>;
    onJumpTo: (id: string) => void;
}) {
    if (!modal) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    bgcolor: alpha(colors.card, 0.96),
                    border: `1px solid ${alpha(colors.border, 0.7)}`,
                    backdropFilter: "blur(18px)",
                    color: colors.text,
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", borderBottom: `1px solid ${alpha(colors.border, 0.35)}` }}>
                Discovery Call Details
            </DialogTitle>
            <DialogContent sx={{ pt: 2.5 }}>
                <Stack spacing={1.25}>
                    {meetingRows.length > 0 ? (
                        meetingRows.map((row) => (
                            <Box key={`${row.label}-${row.value}`} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(colors.bg, 0.55), border: `1px solid ${alpha(colors.border, 0.35)}` }}>
                                <Typography sx={{ color: alpha(colors.muted, 0.9), fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.4 }}>{row.label}</Typography>
                                <Typography sx={{ color: colors.text, fontSize: "0.9rem", fontWeight: 500 }}>{row.value}</Typography>
                            </Box>
                        ))
                    ) : (
                        <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: alpha(colors.bg, 0.55), border: `1px solid ${alpha(colors.border, 0.35)}` }}>
                            <Typography sx={{ color: colors.muted, fontSize: "0.88rem" }}>
                                We will share your discovery call time and method here as soon as it is confirmed.
                            </Typography>
                        </Box>
                    )}
                    <Button onClick={() => onJumpTo("questionnaire")} startIcon={<MeetingIcon sx={{ fontSize: 16 }} />} sx={{ alignSelf: "flex-start", textTransform: "none", color: colors.accent }}>
                        View Questionnaire
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

/* ── Section Card Wrappers (keep data-specific rendering thin) ── */

function QuestionnaireCard({ sections, colors, firstName, portalToken, paymentSchedule, onFieldSave }: {
    sections: PortalData["sections"]; colors: ReturnType<typeof getPortalDashboardColors>;
    firstName: string;
    portalToken: string;
    paymentSchedule: PortalData["payment_schedule"];
    onFieldSave: (fieldKey: string, value: unknown) => Promise<void>;
}) {
    const submitted = sections.questionnaire?.data.submitted_at;

    return (
        <Box>
            {/* Above-card header (overview-style typography) */}
            <Box sx={{ mb: 4, textAlign: 'center', pt: 2 }}>
                <Typography sx={{
                    fontSize: { xs: '1.6rem', md: '1.9rem' }, fontWeight: 700,
                    lineHeight: 1.1, color: colors.text,
                }}>
                    Your Questionnaire
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {sections.questionnaire ? (
                        <Typography component="span" sx={{
                            fontSize: '0.82rem', fontWeight: 600,
                            color: alpha(colors.green, 0.92),
                        }}>
                            Completed
                        </Typography>
                    ) : (
                        <Typography component="span" sx={{
                            fontSize: '0.82rem', fontWeight: 600,
                            color: alpha(colors.muted, 0.7),
                        }}>
                            Pending
                        </Typography>
                    )}
                    {submitted && (
                        <Typography component="span" sx={{
                            fontSize: '0.82rem', color: alpha(colors.muted, 0.6),
                            lineHeight: 1.4,
                        }}>
                            {firstName ? `by ${firstName}` : ''} on {formatDate(submitted, { month: "long", day: "numeric", year: "numeric" })}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Card body */}
            {sections.questionnaire ? (
                <Box sx={{
                    bgcolor: alpha(colors.card, 0.55),
                    backdropFilter: 'blur(20px) saturate(1.5)',
                    border: `1px solid ${alpha(colors.border, 0.45)}`,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    px: { xs: 2.5, md: 3.5 }, py: 3,
                }}>
                    <QuestionnaireContent
                        data={sections.questionnaire.data} colors={colors}
                        portalToken={portalToken}
                        paymentSchedule={paymentSchedule}
                        onFieldSave={onFieldSave}
                    />
                </Box>
            ) : (
                <Box sx={{
                    bgcolor: alpha(colors.card, 0.35),
                    border: `1px dashed ${alpha(colors.border, 0.4)}`,
                    borderRadius: '20px',
                    px: 3, py: 4, textAlign: 'center',
                }}>
                    <Typography sx={{ color: alpha(colors.muted, 0.5), fontSize: '0.85rem' }}>
                        Your questionnaire will appear here after submission
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

function PackageCard({ sections, colors, browsingPackages, loadingPackages, availablePackages, selectedPkgId, packageNotes, submittingPackage, packageRequestSent, onBrowse, onSubmit, onCancel, onSelectPkg, onNotesChange }: {
    sections: PortalData["sections"]; colors: ReturnType<typeof getPortalDashboardColors>;
    browsingPackages: boolean; loadingPackages: boolean;
    availablePackages: Array<{ id: number; name: string; description: string | null; category: string | null; currency: string; contents: unknown }>;
    selectedPkgId: number | null; packageNotes: string;
    submittingPackage: boolean; packageRequestSent: boolean;
    onBrowse: () => void; onSubmit: () => void; onCancel: () => void;
    onSelectPkg: (id: number | null) => void; onNotesChange: (v: string) => void;
}) {
    const hasPackage = !!sections.package;
    const showBrowseButton = !hasPackage && !browsingPackages;

    const cardProps = {
        icon: <PackageIcon sx={{ fontSize: 20 }} />,
        iconColor: "#f59e0b",
        title: hasPackage ? (sections.package?.data.name ?? "Your Package") : "Your Package",
        subtitle: hasPackage ? sections.package?.data.name ?? "Your Package"
            : browsingPackages ? "Browse available packages" : "Select a package to get started",
        statusChip: hasPackage ? { label: "Selected", color: "#f59e0b" } as const : undefined,
        locked: false,
        colors,
    };

    if (showBrowseButton) {
        return (
            <ExpandableCard {...cardProps}
                action={
                    <Button size="small" onClick={(e) => { e.stopPropagation(); onBrowse(); }}
                        sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#f59e0b", borderColor: alpha("#f59e0b", 0.3), borderRadius: "10px", textTransform: "none", "&:hover": { borderColor: "#f59e0b", bgcolor: alpha("#f59e0b", 0.08) } }}
                        variant="outlined">
                        Browse Packages
                    </Button>
                }
            />
        );
    }

    return (
        <ExpandableCard {...cardProps} defaultOpen>
            {hasPackage && sections.package && <PackageContent data={sections.package.data} colors={colors} />}
            {browsingPackages && !hasPackage && (
                <PackageBrowser colors={colors} loading={loadingPackages} packages={availablePackages}
                    selectedId={selectedPkgId} notes={packageNotes} submitting={submittingPackage}
                    requestSent={packageRequestSent}
                    onSelect={onSelectPkg} onNotesChange={onNotesChange}
                    onCancel={onCancel} onSubmit={onSubmit} />
            )}
        </ExpandableCard>
    );
}

function EstimateCard({ sections, colors, currency, paymentSchedule, brandName, paymentMethods }: {
    sections: PortalData["sections"]; colors: ReturnType<typeof getPortalDashboardColors>;
    currency: string;
    paymentSchedule: PortalData["payment_schedule"];
    brandName: string;
    paymentMethods: NonNullable<PortalData["payment_methods"]>;
}) {
    const milestones = sections.estimate?.data.payment_milestones ?? [];
    const totalAmount = parseFloat(String(sections.estimate?.data.total_amount ?? 0));
    const hasStripe = paymentMethods.some((m) => m.type === 'STRIPE');

    const cardSx = {
        bgcolor: alpha(colors.card, 0.7),
        backdropFilter: 'blur(20px) saturate(1.5)',
        border: `1px solid ${alpha(colors.border, 0.6)}`,
        borderRadius: '20px',
        overflow: 'hidden',
    };

    // Build a human-readable list of payment method labels
    const methodLabels = paymentMethods.map((m) => m.label);

    return (
        <Box>
            {/* Title section */}
            <Box sx={{ mb: 5, textAlign: 'center', pt: 2 }}>
                <Typography sx={{
                    fontSize: { xs: '1.6rem', md: '1.9rem' }, fontWeight: 700,
                    lineHeight: 1.1, color: colors.text,
                }}>
                    Your Estimate
                </Typography>
                {sections.estimate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                        <Typography component="span" sx={{
                            fontSize: '0.82rem', fontWeight: 600,
                            color: alpha('#06b6d4', 0.92),
                        }}>
                            {sections.estimate.data.estimate_number}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: '0.82rem', color: alpha(colors.muted, 0.6) }}>
                            — {formatCurrency(sections.estimate.data.total_amount, currency)}
                        </Typography>
                    </Box>
                )}
                <Typography sx={{
                    fontSize: '0.82rem', color: alpha(colors.muted, 0.7), mt: 2,
                    maxWidth: 480, mx: 'auto', lineHeight: 1.7,
                }}>
                    This is a detailed breakdown of what's included in your package and the associated costs.
                    All prices are estimates and may be adjusted in your final quote.
                </Typography>
            </Box>

            {/* Estimate card — always open */}
            <ExpandableCard
                icon={<EstimateIcon sx={{ fontSize: 20 }} />} iconColor="#06b6d4"
                title={sections.estimate?.data.title ?? "Your Estimate"}
                subtitle={sections.estimate ? `${sections.estimate.data.estimate_number}` : undefined}
                statusChip={sections.estimate ? { label: sections.estimate.data.status, color: "#06b6d4" } : undefined}
                locked={!sections.estimate}
                lockedMessage="Your estimate will appear here once prepared"
                colors={colors}
                defaultOpen
            >
                {sections.estimate && <EstimateContent data={sections.estimate.data} colors={colors} currency={currency} />}
            </ExpandableCard>

            {/* Payment Terms — proposal-style, below estimate */}
            {milestones.length > 0 && (
                <Box sx={{ mt: 5 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography sx={{
                            color: colors.accent, fontSize: '0.66rem', fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5,
                        }}>
                            Payment Terms
                        </Typography>
                        <Typography sx={{
                            fontSize: '0.82rem', color: alpha(colors.muted, 0.7),
                            maxWidth: 480, mx: 'auto', lineHeight: 1.7,
                        }}>
                            Your payments are spread across key milestones so there are no surprises.
                            Each instalment is due on or before the date shown.
                        </Typography>
                    </Box>
                    <PaymentTermsSection
                        milestones={milestones}
                        totalAmount={totalAmount}
                        currency={currency}
                        colors={colors}
                        isDark={true}
                        cardSx={cardSx}
                    />
                </Box>
            )}

            {/* Accepted Payment Methods */}
            {methodLabels.length > 0 && (
                <Box sx={{ mt: 5, textAlign: 'center' }}>
                    <Typography sx={{
                        color: alpha(colors.muted, 0.5), fontSize: '0.62rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5,
                    }}>
                        Accepted Payments
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: alpha(colors.muted, 0.7), lineHeight: 1.7, maxWidth: 480, mx: 'auto' }}>
                        {brandName || 'We'} accept{brandName ? 's' : ''} payment via{' '}
                        {methodLabels.map((label, i) => (
                            <React.Fragment key={label}>
                                {i > 0 && i < methodLabels.length - 1 && ', '}
                                {i > 0 && i === methodLabels.length - 1 && ' and '}
                                <span style={{ fontWeight: 600, color: colors.text }}>{label}</span>
                            </React.Fragment>
                        ))}.
                        {' '}Full payment details will be provided on your invoice.
                    </Typography>
                    {hasStripe && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <AcceptedPaymentMethods labelColor={alpha(colors.muted, 0.4)} size={30} />
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

function ProposalCard({ sections, data, brand, firstName, contactLastName, colors, currency, isPreview, partnerFirstName, partnerLastName, contactRole, producerName, proposalResponding, proposalResponseSuccess, showingAcceptanceWizard, onAccept, onRequestChanges, onRequestReconsideration, onContinueSetup, onSectionNote, footerSlot }: {
    sections: PortalData["sections"]; data: PortalData;
    brand: PortalBrand | null; firstName: string; contactLastName: string;
    colors: ReturnType<typeof getPortalDashboardColors>;
    currency: string;
    isPreview?: boolean;
    partnerFirstName?: string | null; partnerLastName?: string | null;
    contactRole?: string | null; producerName?: string | null;
    proposalResponding: boolean; proposalResponseSuccess: boolean;
    showingAcceptanceWizard?: boolean;
    onAccept: () => void; onRequestChanges: (msg: string) => void;
    onRequestReconsideration?: (msg: string) => void;
    onContinueSetup?: () => void;
    onSectionNote?: (sectionType: string, note: string) => void;
    footerSlot?: React.ReactNode;
}) {
    if (!sections.proposal) {
        return (
            <ExpandableCard icon={<ProposalIcon sx={{ fontSize: 20 }} />} iconColor="#a855f7"
                title="Your Proposal" locked lockedMessage="Your personalized proposal will appear here once it's ready" colors={colors} />
        );
    }

    const pd = sections.proposal.data;
    const alreadyResponded = isPreview ? false : !!pd.client_response;
    const proposalTheme = (pd.content as any)?.theme;
    const proposalColors = getThemeColors(proposalTheme);

    // Map estimate → quote shape for ProposalView
    const estimateData = sections.estimate?.data as any;
    const rawQuote = estimateData
        ? { ...estimateData, quote_number: estimateData.estimate_number, currency }
        : null;
    // If quote has no milestones, fall back to estimate milestones
    const quote = rawQuote && !(rawQuote.payment_milestones?.length) && estimateData?.payment_milestones?.length
        ? { ...rawQuote, payment_milestones: estimateData.payment_milestones }
        : rawQuote;

    // Map contract data for ProposalView (portal contract lacks rendered_html so section simply won't render HTML preview)
    const contractData = sections.contract?.data as any;
    const contractForView = contractData
        ? { ...contractData, id: 0, rendered_html: null, signers: contractData.signers ?? [] }
        : null;

    return (
        <ProposalView
                content={pd.content}
                brand={brand}
                estimate={sections.estimate?.data as any}
                pkg={sections.package?.data as any ?? null}
                eventDays={pd.event_days ?? []}
                films={pd.films ?? []}
                phases={(data as any).projectPhases ?? []}
                clientName={firstName || 'You'}
                weddingDate={data.event_date}
                venueDetails={data.venue}
                venueAddress={data.venue_address}
                colors={proposalColors}
                quote={quote}
                contract={contractForView}
                partnerFirstName={partnerFirstName}
                partnerLastName={partnerLastName}
                contactLastName={contactLastName}
                contactRole={contactRole}
                producerName={producerName}
                onSectionNote={onSectionNote}
                sectionNotes={(pd as any).section_notes ?? []}
                expiryDate={(sections.estimate?.data as any)?.expiry_date ?? null}
                ctaSlot={
                    <ProposalAcceptanceBar
                        colors={proposalColors}
                        isDark={!proposalTheme || proposalTheme === 'cinematic-dark'}
                        alreadyResponded={alreadyResponded}
                        clientResponse={pd.client_response?.toLowerCase() ?? null}
                        clientResponseMessage={pd.client_response_message}
                        responding={proposalResponding}
                        responseSuccess={proposalResponseSuccess}
                        showingAcceptanceWizard={showingAcceptanceWizard}
                        onAccept={onAccept}
                        onRequestChanges={onRequestChanges}
                        onRequestReconsideration={onRequestReconsideration}
                        onContinueSetup={onContinueSetup}
                        sectionNotes={(pd as any).section_notes ?? []}
                    />
                }
                footerSlot={footerSlot}
            />
    );
}

function ContractCard({ sections, colors }: { sections: PortalData["sections"]; colors: ReturnType<typeof getPortalDashboardColors> }) {
    return (
        <ExpandableCard
            icon={<ContractIcon sx={{ fontSize: 20 }} />} iconColor="#6366f1"
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
                <>
                    <ContractContent data={sections.contract.data} colors={colors} />
                    {sections.contract.data.contract_status !== "Signed" && sections.contract.data.signing_token && (
                        <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 2.5, display: "flex", justifyContent: "flex-end" }}>
                            <ActionLink href={`/sign/${sections.contract.data.signing_token}`} label="Review & Sign" color="#6366f1" />
                        </Box>
                    )}
                </>
            )}
        </ExpandableCard>
    );
}

function InvoicesCard({ sections, colors, currency }: { sections: PortalData["sections"]; colors: ReturnType<typeof getPortalDashboardColors>; currency: string }) {
    return (
        <ExpandableCard
            icon={<InvoiceIcon sx={{ fontSize: 20 }} />} iconColor="#ec4899"
            title="Payments"
            subtitle={sections.invoices ? `${sections.invoices.data.length} invoice${sections.invoices.data.length !== 1 ? "s" : ""}` : undefined}
            statusChip={sections.invoices
                ? sections.invoices.data.every(i => i.status === "Paid")
                    ? { label: "All Paid", color: colors.green }
                    : { label: `${sections.invoices.data.filter(i => i.status !== "Paid").length} Outstanding`, color: "#ec4899" }
                : undefined}
            locked={!sections.invoices}
            lockedMessage="Your invoices and payment history will appear here"
            colors={colors}
        >
            {sections.invoices && <InvoicesContent data={sections.invoices.data} colors={colors} currency={currency} />}
        </ExpandableCard>
    );
}

/* ── Package Browser ────────────────────────────────────── */

function PackageBrowser({ colors, loading, packages: availablePackages, selectedId, notes, submitting, requestSent, onSelect, onNotesChange, onCancel, onSubmit }: {
    colors: ReturnType<typeof getPortalDashboardColors>;
    loading: boolean;
    packages: Array<{ id: number; name: string; description: string | null }>;
    selectedId: number | null; notes: string;
    submitting: boolean; requestSent: boolean;
    onSelect: (id: number | null) => void; onNotesChange: (v: string) => void;
    onCancel: () => void; onSubmit: () => void;
}) {
    return (
        <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} sx={{ color: "#f59e0b" }} />
                </Box>
            ) : requestSent ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: colors.green, mb: 1 }} />
                    <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>Package Request Submitted</Typography>
                    <Typography sx={{ color: colors.muted, fontSize: "0.82rem" }}>We&apos;ll review your selection and get back to you soon.</Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: availablePackages.length > 2 ? "repeat(3, 1fr)" : `repeat(${availablePackages.length || 1}, 1fr)` }, gap: 2, mb: 3 }}>
                        {availablePackages.map((pkg) => {
                            const isSelected = selectedId === pkg.id;
                            return (
                                <Box key={pkg.id} onClick={() => onSelect(isSelected ? null : pkg.id)}
                                    sx={{
                                        p: 2.5, borderRadius: "14px", cursor: "pointer",
                                        bgcolor: isSelected ? alpha("#f59e0b", 0.08) : alpha(colors.bg, 0.5),
                                        border: `1.5px solid ${isSelected ? "#f59e0b" : alpha(colors.border, 0.5)}`,
                                        transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                                        "&:hover": { borderColor: isSelected ? "#f59e0b" : alpha("#f59e0b", 0.3), bgcolor: alpha("#f59e0b", 0.04) },
                                    }}
                                >
                                    <Typography sx={{ color: colors.text, fontWeight: 600, fontSize: "0.9rem", mb: 0.5 }}>{pkg.name}</Typography>
                                    {pkg.description && <Typography sx={{ color: colors.muted, fontSize: "0.78rem", lineHeight: 1.5 }}>{pkg.description}</Typography>}
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
                        <Typography sx={{ color: colors.muted, fontSize: "0.85rem", textAlign: "center", py: 2 }}>No packages available at this time.</Typography>
                    )}
                    <TextField multiline rows={3} placeholder="Any notes or customization requests…"
                        value={notes} onChange={(e) => onNotesChange(e.target.value)} fullWidth
                        sx={{ mb: 2, "& .MuiOutlinedInput-root": { color: colors.text, fontSize: "0.85rem", bgcolor: alpha(colors.bg, 0.5), borderRadius: "12px", "& fieldset": { borderColor: alpha(colors.border, 0.5) }, "&:hover fieldset": { borderColor: alpha("#f59e0b", 0.3) }, "&.Mui-focused fieldset": { borderColor: "#f59e0b" } }, "& .MuiInputBase-input::placeholder": { color: colors.muted, opacity: 1 } }}
                    />
                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                        <Button size="small" onClick={onCancel} sx={{ color: colors.muted, textTransform: "none", fontSize: "0.8rem" }}>Cancel</Button>
                        <Button size="small" variant="contained" disabled={!selectedId || submitting} onClick={onSubmit}
                            startIcon={submitting ? <CircularProgress size={14} /> : undefined}
                            sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8rem", borderRadius: "10px", background: "linear-gradient(135deg, #f59e0b, #d97706)", "&:hover": { background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }, "&.Mui-disabled": { opacity: 0.5 } }}>
                            {submitting ? "Submitting…" : "Request This Package"}
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
}
