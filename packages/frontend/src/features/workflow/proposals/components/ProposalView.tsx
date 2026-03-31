"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";
import type {
    PublicProposalBrand,
    PublicProposalContent,
    PublicProposalEstimate,
    PublicProposalEventDay,
    PublicProposalFilm,
} from "@/features/workflow/proposals/types";
import type { PackageData } from "@/features/workflow/proposals/types";
import {
    HeroSection,
    PersonalMessageSection,
    EventDetailsSection,
    PricingSection,
    PackageDetailsSection,
    FilmsSection,
    ScheduleTimelineSection,
    SubjectsSection,
    TeamTiersSection,
    FooterSection,
    SectionDivider,
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
    /** Slot rendered between the last content card and the footer (e.g. AcceptanceBar) */
    ctaSlot?: React.ReactNode;
    /** Called when a section enters the viewport — used for section-level view tracking */
    onSectionView?: (sectionType: string) => void;
    /** Called while a section remains visible to accumulate time spent */
    onSectionDuration?: (sectionType: string, seconds: number) => void;
    /** Called when client saves a note on a section */
    onSectionNote?: (sectionType: string, note: string) => void;
    /** Existing section notes from the backend */
    sectionNotes?: ProposalSectionNote[];
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
    ctaSlot,
    onSectionView,
    onSectionDuration,
    onSectionNote,
    sectionNotes,
}: ProposalViewProps) {
    const isDark = !content?.theme || content.theme === "cinematic-dark";
    const cardSx = buildCardSx(colors, isDark);

    const shared = { colors, isDark, cardSx } as const;

    const noteMap = new Map(sectionNotes?.map((n) => [n.section_type, n]));

    const SECTION_LABEL_DEFAULTS: Record<string, string> = {
        text: "A Note For You",
        "event-details": "Event Details",
        pricing: "Your Package",
        "package-details": "Package Details",
        films: "Your Films",
        schedule: "Your Day",
        subjects: "Key People",
        team: "Your Team",
        locations: "Locations",
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

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: colors.bg, overflow: "hidden" }}>
            {track("hero", <HeroSection content={content} brand={brand} clientName={clientName} weddingDate={weddingDate} colors={colors} isDark={isDark} />)}

            <Box sx={{ maxWidth: 760, mx: "auto", py: { xs: 5, md: 8 }, px: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 4 }}>
                <PersonalMessageSection content={content} brand={brand} {...shared} />
                {track("event-details", <EventDetailsSection content={content} weddingDate={weddingDate} venueDetails={venueDetails} venueAddress={venueAddress} eventDays={eventDays} {...shared} />)}
            </Box>

            {/* ── Schedule — wider than cards, page-level gradient backdrop ── */}
            <Box sx={{
                position: "relative",
                py: { xs: 3, md: 5 },
            }}>
                {/* Layered gradient wash — multiple soft layers for a natural fade */}
                <Box sx={{
                    position: "absolute",
                    top: "-40%",
                    bottom: "-40%",
                    left: "-20%",
                    right: "-20%",
                    background: [
                        `radial-gradient(ellipse 60% 50% at 50% 50%, ${alpha(colors.gradient1, isDark ? 0.07 : 0.04)}, transparent 70%)`,
                        `radial-gradient(ellipse 90% 70% at 50% 50%, ${alpha(colors.gradient2, isDark ? 0.04 : 0.025)}, transparent 80%)`,
                    ].join(", "),
                    pointerEvents: "none",
                    filter: "blur(40px)",
                }} />
                <Box sx={{ maxWidth: 912, mx: "auto", px: { xs: 2, md: 3 }, position: "relative" }}>
                    {track("schedule", <ScheduleTimelineSection content={content} eventDays={eventDays} {...shared} />)}
                </Box>
            </Box>

            <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 4 }}>
                {(isSectionVisible(content, "pricing") || isSectionVisible(content, "films")) && <SectionDivider color={colors.accent} />}

                {track("pricing", <PricingSection content={content} estimate={estimate} pkg={pkg} eventDays={eventDays} films={films} {...shared} />)}
            </Box>

            {/* ── Films — wider with gradient backdrop like timeline ── */}
            <Box sx={{
                position: "relative",
                py: { xs: 3, md: 5 },
            }}>
                {/* Layered gradient wash */}
                <Box sx={{
                    position: "absolute",
                    top: "-40%",
                    bottom: "-40%",
                    left: "-20%",
                    right: "-20%",
                    background: [
                        `radial-gradient(ellipse 60% 50% at 50% 50%, ${alpha(colors.gradient1, isDark ? 0.07 : 0.04)}, transparent 70%)`,
                        `radial-gradient(ellipse 90% 70% at 50% 50%, ${alpha(colors.gradient2, isDark ? 0.04 : 0.025)}, transparent 80%)`,
                    ].join(", "),
                    pointerEvents: "none",
                    filter: "blur(40px)",
                }} />
                <Box sx={{ maxWidth: 912, mx: "auto", px: { xs: 2, md: 3 }, position: "relative" }}>
                    {track("films", <FilmsSection content={content} films={films} {...shared} />)}
                </Box>
            </Box>

            <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 4 }}>
                {isSectionVisible(content, "subjects") && <SectionDivider color={colors.accent} />}

                {track("subjects", <SubjectsSection content={content} eventDays={eventDays} {...shared} />)}

                {track("team", <TeamTiersSection content={content} eventDays={eventDays} {...shared} />)}

                <SectionDivider color={colors.accent} />

                {/* CTA slot (e.g. AcceptanceBar) */}
                {ctaSlot ?? null}

                {/* Terms */}
                {isSectionVisible(content, "terms") && !!(estimate?.terms || content?.sections?.find((s) => s.type === "terms")?.data?.customTerms) && (
                    <Box sx={{ opacity: 0.65 }}>
                        <Typography sx={{ color: colors.muted, fontSize: "0.72rem", lineHeight: 1.7, display: "block" }}>
                            {(content?.sections?.find((s) => s.type === "terms")?.data?.customTerms as string) || estimate?.terms}
                        </Typography>
                    </Box>
                )}
            </Box>

            <FooterSection brand={brand} colors={colors} isDark={isDark} />
        </Box>
    );
}
