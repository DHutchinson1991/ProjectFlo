"use client";

import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { getDaysUntil } from "@/features/workflow/proposals/utils/portal/formatting";
import { useReveal } from "@/features/workflow/proposals/utils/portal/animations";
import { ProposalScrollContext } from "./ProposalScrollContext";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import type {
    PublicProposalBrand,
    PublicProposalContent,
    PublicProposalContractPreview,
    PublicProposalEstimate,
    PublicProposalEventDay,
    PublicProposalFilm,
    PublicProposalQuote,
    PublicProposalPhase,
} from "@/features/workflow/proposals/types";
import type { PackageData } from "@/features/workflow/proposals/types";
import {
    HeroSection,
    PersonalMessageSection,
    PricingSection,
    FilmsSection,
    ScheduleTimelineSection,
    TeamTiersSection,
    ProjectPhasesSection,
    QuoteSection,
    PaymentTermsSection,
    isSectionVisible,
    buildCardSx,
} from "./sections";
import SectionTracker from "./SectionTracker";
import SectionNoteInput from "./SectionNoteInput";
import { getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import type { ProposalSectionNote } from "@/features/workflow/proposals/types";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface ProposalViewProps {
    content: PublicProposalContent | null;
    brand: PublicProposalBrand | null;
    estimate?: PublicProposalEstimate;
    pkg?: PackageData | null;
    eventDays: PublicProposalEventDay[];
    films: PublicProposalFilm[];
    clientName: string;
    weddingDate: string | null;
    venueDetails: string | null;
    venueAddress: string | null;
    colors: PortalThemeColors;
    quote?: PublicProposalQuote | null;
    contract?: PublicProposalContractPreview | null;
    /** Partner first name from wizard submission (e.g. "James") */
    partnerFirstName?: string | null;
    /** Partner last name from wizard submission */
    partnerLastName?: string | null;
    /** Contact's last name (the inquiry creator) */
    contactLastName?: string | null;
    /** Contact role from wizard (e.g. "Bride", "Groom", "Partner") */
    contactRole?: string | null;
    /** Producer name from crew slots (first leadership crew member) */
    producerName?: string | null;
    /** Slot rendered between the last content card and the footer (e.g. AcceptanceBar) */
    ctaSlot?: React.ReactNode;
    /** Slot rendered at the very bottom of the scroll container (e.g. PortalFooter) */
    footerSlot?: React.ReactNode;
    /** Called when a section enters the viewport — used for section-level view tracking */
    onSectionView?: (sectionType: string) => void;
    /** Called while a section remains visible to accumulate time spent */
    onSectionDuration?: (sectionType: string, seconds: number) => void;
    /** Called when client saves a note on a section */
    onSectionNote?: (sectionType: string, note: string) => void;
    /** Existing section notes from the backend */
    sectionNotes?: ProposalSectionNote[];
    /** Backend-generated personal message (not from DB content) */
    personalMessage?: string | null;
    /** Project phases from task library */
    phases?: PublicProposalPhase[];
    /** Estimate/proposal expiry date — used for urgency nudge in CTA section */
    expiryDate?: string | null;
}

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
`;

function CountdownBar({ weddingDate, colors }: { weddingDate: string | null; colors: PortalThemeColors }) {
    const daysUntil = getDaysUntil(weddingDate);
    const { ref, visible } = useReveal();
    if (daysUntil === null || daysUntil <= 0) return null;
    return (
        <Box ref={ref} sx={{ textAlign: "center", py: 1 }}>
            <Typography sx={{
                fontSize: { xs: "1.15rem", md: "1.35rem" },
                fontWeight: 300,
                color: colors.text,
                letterSpacing: "0.01em",
                lineHeight: 1.5,
                animation: visible ? `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both` : "none",
                opacity: visible ? undefined : 0,
            }}>
                In <Box component="span" sx={{ fontWeight: 700, color: colors.accent }}>{daysUntil}</Box> days, we press record on your love story
            </Typography>
            <Typography sx={{
                fontSize: { xs: "0.82rem", md: "0.88rem" },
                fontWeight: 400,
                color: alpha(colors.muted, 0.55),
                letterSpacing: "0.03em",
                mt: 0.75,
                animation: visible ? `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both` : "none",
                opacity: visible ? undefined : 0,
            }}>
                Let&apos;s make sure every moment is captured
            </Typography>
        </Box>
    );
}

/* ── What happens next timeline ── */
const NEXT_STEPS = [
    { icon: "✓", label: "Accept Proposal", desc: "Lock in your date & pricing" },
    { icon: "✍", label: "Sign Contract", desc: "Quick digital signature" },
    { icon: "💳", label: "Pay Deposit", desc: "Secure your booking" },
    { icon: "🎬", label: "You\u2019re Booked", desc: "We\u2019ll handle the rest" },
];

function WhatsNextTimeline({ colors, isDark }: { colors: PortalThemeColors; isDark: boolean }) {
    const { ref, visible } = useReveal();
    return (
        <Box ref={ref} sx={{
            maxWidth: 520, mx: "auto", mt: { xs: 3, md: 4 }, mb: { xs: 1, md: 2 },
        }}>
            <Typography sx={{
                fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.12em", color: alpha(colors.muted, 0.45),
                mb: 2, textAlign: "center",
                animation: visible ? `${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both` : "none",
                opacity: visible ? undefined : 0,
            }}>
                What happens next
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 1.5, md: 2.5 } }}>
                {NEXT_STEPS.map((step, i) => (
                    <Box key={step.label} sx={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        flex: 1, maxWidth: 120, position: "relative",
                        animation: visible ? `${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.7 + i * 0.15}s both` : "none",
                        opacity: visible ? undefined : 0,
                    }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            bgcolor: i === 0
                                ? alpha(colors.accent, isDark ? 0.15 : 0.1)
                                : alpha(colors.border, isDark ? 0.15 : 0.08),
                            border: `1px solid ${i === 0 ? alpha(colors.accent, 0.3) : alpha(colors.border, 0.2)}`,
                            fontSize: "0.9rem", mb: 1,
                        }}>
                            {step.icon}
                        </Box>
                        <Typography sx={{
                            fontSize: "0.72rem", fontWeight: 600, color: colors.text,
                            textAlign: "center", lineHeight: 1.3,
                        }}>
                            {step.label}
                        </Typography>
                        <Typography sx={{
                            fontSize: "0.65rem", color: alpha(colors.muted, 0.6),
                            textAlign: "center", lineHeight: 1.4, mt: 0.3,
                        }}>
                            {step.desc}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

/* ── Expiry urgency nudge ── */

function ExpiryNudge({ expiryDate, colors }: { expiryDate: string | null; colors: PortalThemeColors }) {
    const { ref, visible } = useReveal();
    if (!expiryDate) return null;

    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Don't show if already expired or more than 60 days away
    if (daysLeft <= 0 || daysLeft > 60) return null;

    const isUrgent = daysLeft <= 7;
    const nudgeColor = isUrgent ? "#f59e0b" : alpha(colors.muted, 0.5);

    const formattedDate = expiry.toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
    });

    return (
        <Box ref={ref} sx={{
            mt: 2,
            animation: visible ? `${fadeInUp} 0.6s ease 0.3s both` : "none",
            opacity: visible ? undefined : 0,
        }}>
            <Typography sx={{
                color: nudgeColor,
                fontSize: "0.76rem",
                fontWeight: isUrgent ? 600 : 400,
                letterSpacing: "0.02em",
            }}>
                {isUrgent
                    ? `⏳ This proposal expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — respond by ${formattedDate}`
                    : `Proposal valid until ${formattedDate}`
                }
            </Typography>
        </Box>
    );
}

/* ================================================================== */
/* Gliding scroll hook                                                 */
/* ================================================================== */

/**
 * Intercepts wheel and touch events on `containerRef` and drives scroll
 * position with a custom easeInOutExpo curve so transitions feel slow and
 * intentional rather than instant. Sections are identified by the
 * `data-snap` attribute so variable-height sections work correctly.
 *
 * The final section is treated specially: once reached, wheel/swipe
 * downward scrolls freely within it. Upward snaps back to the previous
 * section only when the user is already at that section's top.
 */
function useGlidingScroll(containerRef: React.RefObject<HTMLElement>) {
    const currentIdx = useRef(0);
    const isAnimating = useRef(false);
    const rafId = useRef<number | null>(null);
    const touchStartY = useRef(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const getSections = () =>
            Array.from(el.querySelectorAll<HTMLElement>('[data-snap],[data-free-scroll]'));

        /** Check if a section allows free scrolling */
        const isFreeScroll = (section: HTMLElement) =>
            section.hasAttribute('data-free-scroll');

        /** easeInOutExpo — slow launch, fast middle, slow land */
        const ease = (t: number) =>
            t === 0 ? 0
            : t === 1 ? 1
            : t < 0.5
                ? Math.pow(2, 20 * t - 10) / 2
                : (2 - Math.pow(2, -20 * t + 10)) / 2;

        const animateTo = (targetTop: number, duration = 950) => {
            if (rafId.current !== null) cancelAnimationFrame(rafId.current);
            const startTop = el.scrollTop;
            const distance = targetTop - startTop;
            if (Math.abs(distance) < 2) { isAnimating.current = false; return; }
            isAnimating.current = true;
            const startTime = performance.now();

            const step = (now: number) => {
                const progress = Math.min((now - startTime) / duration, 1);
                el.scrollTop = startTop + distance * ease(progress);
                if (progress < 1) {
                    rafId.current = requestAnimationFrame(step);
                } else {
                    isAnimating.current = false;
                    rafId.current = null;
                }
            };
            rafId.current = requestAnimationFrame(step);
        };

        const navigate = (delta: 1 | -1) => {
            const sections = getSections();
            if (!sections.length) return;
            const next = Math.max(0, Math.min(sections.length - 1, currentIdx.current + delta));
            currentIdx.current = next;
            animateTo(sections[next].offsetTop);
        };

        const handleWheel = (e: WheelEvent) => {
            const sections = getSections();
            if (!sections.length) return;

            // While a snap animation is running, swallow ALL wheel events
            // so the browser doesn't stack natural scroll on top.
            if (isAnimating.current) {
                e.preventDefault();
                return;
            }

            const isLast = currentIdx.current === sections.length - 1;
            const currentSection = sections[currentIdx.current];
            const isFree = isFreeScroll(currentSection);

            // Free-scroll sections: scroll normally within them,
            // snap to prev/next only at the very top/bottom edges.
            if (isFree || isLast) {
                const sectionTop = currentSection.offsetTop;
                const sectionBottom = sectionTop + currentSection.offsetHeight;
                const viewportH = el.clientHeight;
                const atTop = el.scrollTop <= sectionTop + 8;
                const atBottom = el.scrollTop + viewportH >= sectionBottom - 8;

                if (e.deltaY < 0 && atTop) {
                    e.preventDefault();
                    navigate(-1);
                    return;
                }
                if (e.deltaY > 0 && atBottom && !isLast) {
                    e.preventDefault();
                    navigate(1);
                    return;
                }
                // Otherwise let the browser scroll naturally within this section
                return;
            }

            e.preventDefault();
            if (Math.abs(e.deltaY) < 5) return;
            navigate(e.deltaY > 0 ? 1 : -1);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const dir = e.key === 'ArrowDown' || e.key === 'PageDown' ? 1
                      : e.key === 'ArrowUp'   || e.key === 'PageUp'   ? -1
                      : null;
            if (dir === null) return;
            e.preventDefault();
            if (!isAnimating.current) navigate(dir);
        };

        const handleTouchStart = (e: TouchEvent) => {
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const delta = touchStartY.current - e.changedTouches[0].clientY;
            if (Math.abs(delta) < 40) return;
            const sections = getSections();
            if (!sections.length) return;
            const currentSection = sections[currentIdx.current];
            const isLast = currentIdx.current === sections.length - 1;
            const isFree = isFreeScroll(currentSection);
            if ((isFree || isLast) && delta > 0) {
                // Let free-scroll sections scroll naturally on swipe-up
                const sectionBottom = currentSection.offsetTop + currentSection.offsetHeight;
                if (el.scrollTop + el.clientHeight < sectionBottom - 8) return;
            }
            if (isAnimating.current) return;
            navigate(delta > 0 ? 1 : -1);
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('keydown', handleKeyDown);
        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            el.removeEventListener('wheel', handleWheel);
            el.removeEventListener('keydown', handleKeyDown);
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchend', handleTouchEnd);
            if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        };
    }, [containerRef]);
}

/* ================================================================== */
/* ProposalView                                                        */
/* ================================================================== */

export default function ProposalView({
    content,
    brand,
    estimate,
    pkg,
    eventDays,
    films,
    clientName,
    weddingDate,
    venueDetails,
    venueAddress,
    colors,
    quote,
    contract,
    partnerFirstName,
    partnerLastName,
    contactLastName,
    contactRole,
    producerName,
    ctaSlot,
    footerSlot,
    onSectionView,
    onSectionDuration,
    onSectionNote,
    sectionNotes,
    personalMessage,
    phases,
    expiryDate,
}: ProposalViewProps) {
    const isDark = !content?.theme || content.theme === "cinematic-dark";
    const cardSx = buildCardSx(colors, isDark);

    const containerRef = useRef<HTMLDivElement>(null);
    useGlidingScroll(containerRef as React.RefObject<HTMLElement>);

    // Lock body scroll so this container is the only scroller.
    // Restored automatically when the proposal tab unmounts.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const shared = { colors, isDark, cardSx } as const;

    const noteMap = new Map(sectionNotes?.map((n) => [n.section_type, n]));

    const SECTION_LABEL_DEFAULTS: Record<string, string> = {
        text: "A Note For You",
        pricing: "Your Package",
        films: "Your Films",
        schedule: "Hour by Hour",
        team: "Your Team",
        locations: "Locations",
        quote: "Your Quote",
        "payment-terms": "Payment Terms",
        contract: "Contract",
    };

    /** Optionally wrap a section with a view tracker + note input */
    const track = (sectionType: string, node: React.ReactNode) => {
        // Skip sections that aren't visible in content
        if (!isSectionVisible(content, sectionType)) return null;

        const tracked = onSectionView ? (
            <SectionTracker sectionType={sectionType} onView={onSectionView} onDuration={onSectionDuration}>
                {node}
            </SectionTracker>
        ) : (
            node
        );

        // Don't show note inputs on hero section
        if (sectionType === "hero" || !onSectionNote) return tracked;

        const label = getSectionTitle(content, sectionType, SECTION_LABEL_DEFAULTS[sectionType] ?? sectionType);

        return (
            <Box className="section-group" sx={{ position: 'relative' }}>
                {tracked}
                <SectionNoteInput
                    sectionType={sectionType}
                    sectionLabel={label}
                    colors={colors}
                    existingNote={noteMap.get(sectionType)}
                    onSave={onSectionNote}
                />
            </Box>
        );
    };

    /** Full-viewport section wrapper — centers content vertically */
    const vpSection = (children: React.ReactNode, extra?: Record<string, unknown>) => ({
        minHeight: "100dvh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        position: "relative" as const,
        ...extra,
    });

    return (
        <ProposalScrollContext.Provider value={containerRef}>
        <Box ref={containerRef} tabIndex={-1} sx={{
            height: '100dvh',
            overflowY: 'scroll',
            outline: 'none',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
        }}>
            {/* ═══════════════════════════════════════════════════════════
                1. HERO — Mr & Mrs animation + countdown
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="">
                {track("hero", <HeroSection content={content} brand={brand} clientName={clientName} weddingDate={weddingDate} colors={colors} isDark={isDark} partnerFirstName={partnerFirstName} partnerLastName={partnerLastName} contactLastName={contactLastName} contactRole={contactRole} venueDetails={venueDetails} />)}
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                2. PERSONAL MESSAGE — typewriter intro
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="" sx={vpSection(null, { px: { xs: 2.5, md: 3 } })}>
                <Box sx={{ maxWidth: 680, width: "100%" }}>
                    <PersonalMessageSection content={content} brand={brand} producerName={producerName} personalMessage={personalMessage} {...shared} />
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                3. SCHEDULE TIMELINE — hour-by-hour coverage
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="" sx={vpSection(null)}>
                <Box sx={{
                    position: "absolute", top: "-30%", bottom: "-30%", left: "-20%", right: "-20%",
                    background: [
                        `radial-gradient(ellipse 60% 50% at 50% 50%, ${alpha(colors.gradient2, isDark ? 0.07 : 0.04)}, transparent 70%)`,
                        `radial-gradient(ellipse 90% 70% at 50% 50%, ${alpha(colors.gradient1, isDark ? 0.04 : 0.025)}, transparent 80%)`,
                    ].join(", "),
                    pointerEvents: "none", filter: "blur(40px)",
                }} />
                <Box sx={{ maxWidth: 912, width: "100%", px: { xs: 2, md: 3 }, position: "relative" }}>
                    {track("schedule", <ScheduleTimelineSection content={content} eventDays={eventDays} films={films} {...shared} />)}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                6. TEAM — simplified icon grid
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="" sx={vpSection(null)}>
                <Box sx={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${alpha(colors.gradient1, isDark ? 0.05 : 0.03)}, transparent 70%)`,
                    pointerEvents: "none", filter: "blur(60px)",
                }} />
                <Box sx={{ maxWidth: 760, width: "100%", px: { xs: 2.5, md: 3 }, position: "relative" }}>
                    {track("team", <TeamTiersSection content={content} eventDays={eventDays} {...shared} />)}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                6b. PROJECT PHASES — task breakdown by phase (free-scroll)
               ═══════════════════════════════════════════════════════════ */}
            <Box data-free-scroll="" sx={{
                minHeight: "100dvh",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "flex-start",
                position: "relative",
                py: 12,
            }}>
                <Box sx={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${alpha(colors.gradient2, isDark ? 0.04 : 0.025)}, transparent 70%)`,
                    pointerEvents: "none", filter: "blur(60px)",
                }} />
                <Box sx={{ maxWidth: 760, width: "100%", px: { xs: 2.5, md: 3 }, position: "relative" }}>
                    {track("phases", <ProjectPhasesSection phases={phases ?? []} {...shared} />)}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                7. FILMS — wider with gradient
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="" sx={vpSection(null)}>
                <Box sx={{
                    position: "absolute", top: "-30%", bottom: "-30%", left: "-20%", right: "-20%",
                    background: [
                        `radial-gradient(ellipse 60% 50% at 50% 50%, ${alpha(colors.gradient2, isDark ? 0.07 : 0.04)}, transparent 70%)`,
                        `radial-gradient(ellipse 90% 70% at 50% 50%, ${alpha(colors.gradient1, isDark ? 0.04 : 0.025)}, transparent 80%)`,
                    ].join(", "),
                    pointerEvents: "none", filter: "blur(40px)",
                }} />
                <Box sx={{ maxWidth: 912, width: "100%", px: { xs: 2, md: 3 }, position: "relative" }}>
                    {track("films", <FilmsSection content={content} films={films} {...shared} />)}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                8. PACKAGE / PRICING
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="" sx={vpSection(null, { px: { xs: 2.5, md: 3 } })}>
                <Box sx={{ maxWidth: 760, width: "100%" }}>
                    {track("pricing", <PricingSection content={content} estimate={estimate} pkg={pkg} eventDays={eventDays} films={films} {...shared} />)}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                9. QUOTE + PAYMENT TERMS
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="" sx={vpSection(null, { py: { xs: 6, md: 10 } })}>
                <Box sx={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${alpha(colors.gradient1, isDark ? 0.04 : 0.025)}, transparent 70%)`,
                    pointerEvents: "none", filter: "blur(60px)",
                }} />
                <Box sx={{ maxWidth: 760, width: "100%", px: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 5, position: "relative" }}>
                    {quote && track("quote", <QuoteSection quote={quote} {...shared} />)}

                    {quote && (quote.payment_milestones?.length ?? 0) > 0 && track("payment-terms", (
                        <PaymentTermsSection
                            milestones={quote.payment_milestones}
                            totalAmount={parseFloat(String(quote.total_amount))}
                            currency={quote.currency ?? "USD"}
                            {...shared}
                        />
                    ))}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════
                10. CTA — Full viewport decision section
               ═══════════════════════════════════════════════════════════ */}
            <Box data-snap="" sx={vpSection(null, { pb: { xs: 8, md: 12 } })}>
                {/* Ambient glow */}
                <Box sx={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${alpha(colors.gradient1, isDark ? 0.06 : 0.03)}, transparent 70%),
                                 radial-gradient(ellipse 40% 40% at 30% 70%, ${alpha(colors.gradient2, isDark ? 0.04 : 0.02)}, transparent 60%)`,
                    pointerEvents: "none", filter: "blur(80px)",
                }} />

                <Box sx={{ position: "relative", width: "100%", maxWidth: 680, px: { xs: 2.5, md: 3 }, textAlign: "center" }}>
                    {/* Wedding countdown headline */}
                    <CountdownBar weddingDate={weddingDate} colors={colors} />

                    {/* What happens next timeline */}
                    <WhatsNextTimeline colors={colors} isDark={isDark} />

                    {/* Glass card wrapping CTA + expiry */}
                    <Box sx={{
                        mt: { xs: 3, md: 4 },
                        p: { xs: 2.5, md: 3.5 },
                        borderRadius: 4,
                        bgcolor: alpha(colors.card, isDark ? 0.35 : 0.6),
                        border: `1px solid ${alpha(colors.border, isDark ? 0.12 : 0.08)}`,
                        backdropFilter: "blur(20px)",
                        animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both`,
                    }}>
                        {/* CTA slot (accept / already-responded banner) */}
                        {ctaSlot ?? null}

                        {/* Expiry nudge */}
                        <ExpiryNudge expiryDate={expiryDate ?? null} colors={colors} />
                    </Box>

                    {/* Terms fine print */}
                    {isSectionVisible(content, "terms") && !!(estimate?.terms || content?.sections?.find((s) => s.type === "terms")?.data?.customTerms) && (
                        <Box sx={{ opacity: 0.5, mt: { xs: 4, md: 6 } }}>
                            <Typography sx={{ color: colors.muted, fontSize: "0.68rem", lineHeight: 1.7, display: "block" }}>
                                {(content?.sections?.find((s) => s.type === "terms")?.data?.customTerms as string) || estimate?.terms}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Bottom spacer so footer slot is visible inside scroll container */}
            {footerSlot && <Box sx={{ py: { xs: 4, md: 6 } }}>{footerSlot}</Box>}
        </Box>
        </ProposalScrollContext.Provider>
    );
}
