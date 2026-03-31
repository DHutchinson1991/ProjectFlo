"use client";

import { Box, Typography, Divider, Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CalendarToday as CalendarIcon,
    PeopleOutline as PeopleIcon,
    Videocam as VideocamIcon,
    Mic as MicIcon,
    LocationOn as LocationIcon,
} from "@mui/icons-material";
import { computeTaxBreakdown } from "@/shared/utils/pricing";
import { formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";
import { DEFAULT_CURRENCY } from "@projectflo/shared";
import type {
    SectionBaseProps,
    PublicProposalContent,
    PublicProposalEstimate,
    PackageData,
    PublicProposalEventDay,
    PublicProposalFilm,
} from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle, isAudioEquipment } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

interface PricingSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    estimate?: PublicProposalEstimate;
    pkg?: PackageData | null;
    eventDays?: PublicProposalEventDay[];
    films?: PublicProposalFilm[];
}

const STATS = [
    { key: "eventDays", Icon: CalendarIcon, label: "Event Days", color: "#ff5722" },
    { key: "crew",      Icon: PeopleIcon,   label: "Crew",        color: "#42a5f5" },
    { key: "cameras",   Icon: VideocamIcon, label: "Cameras",     color: "#26a69a" },
    { key: "audio",     Icon: MicIcon,      label: "Audio",       color: "#ab47bc" },
    { key: "locations", Icon: LocationIcon, label: "Locations",   color: "#ef5350" },
] as const;

export default function PricingSection({ content, estimate, pkg, eventDays = [], films = [], colors, isDark, cardSx }: PricingSectionProps) {
    if (!isSectionVisible(content, "pricing")) return null;
    if (!estimate && !pkg) return null;

    const currency = pkg?.currency ?? DEFAULT_CURRENCY;
    const rawTotal = estimate ? parseFloat(String(estimate.total_amount)) : 0;
    const taxRate  = estimate?.tax_rate ? parseFloat(String(estimate.tax_rate)) : 0;
    const { total: grandTotal } = computeTaxBreakdown(rawTotal, taxRate);

    // Derive summary counts from event day crew slots
    const allCrewSlots = eventDays.flatMap((d) => d.day_crew_slots ?? []);

    // Deduplicate crew by crew_id so the same person across multiple days counts once
    const seenCrewIds = new Set<number>();
    let crewCount = 0;
    for (const slot of allCrewSlots) {
        if (slot.crew_id) {
            if (!seenCrewIds.has(slot.crew_id)) {
                seenCrewIds.add(slot.crew_id);
                crewCount++;
            }
        } else {
            crewCount++; // unassigned slots each count as one
        }
    }

    const seenEquip = new Set<number>();
    const uniqueEquip: string[] = [];
    for (const slot of allCrewSlots) {
        for (const e of slot.equipment) {
            if (!seenEquip.has(e.equipment.id)) {
                seenEquip.add(e.equipment.id);
                uniqueEquip.push(e.equipment.item_name);
            }
        }
    }
    const audioCount  = uniqueEquip.filter(isAudioEquipment).length;
    const cameraCount = uniqueEquip.length - audioCount;
    const locationCount = new Set(
        eventDays.flatMap((d) => d.location_slots ?? []).map((l) => l.location?.name ?? l.name ?? String(l.id))
    ).size;

    const counts: Record<string, number> = {
        eventDays: eventDays.length,
        crew:      crewCount,
        cameras:   cameraCount,
        audio:     audioCount,
        locations: locationCount,
    };

    const hasStats = eventDays.length > 0 || allCrewSlots.length > 0;

    return (
        <RevealBox>
            <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 } }}>
                    {/* Header row: section label left, total right */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700 }}>
                            {getSectionTitle(content, "pricing", "Your Package")}
                        </Typography>

                        {rawTotal > 0 && (
                            <Box sx={{ textAlign: "right" }}>
                                <Typography sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: "1.35rem", md: "1.55rem" },
                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    lineHeight: 1.1,
                                }}>
                                    {formatCurrency(grandTotal, currency)}
                                </Typography>
                                {taxRate > 0 && (
                                    <Typography sx={{ color: colors.muted, fontSize: "0.68rem", mt: 0.3 }}>
                                        incl. {taxRate}% tax
                                    </Typography>
                                )}
                                {estimate?.deposit_required && parseFloat(String(estimate.deposit_required)) > 0 && (
                                    <Chip
                                        label={`Deposit: ${formatCurrency(estimate.deposit_required, currency)}`}
                                        size="small"
                                        sx={{ mt: 0.5, bgcolor: alpha(colors.accent, isDark ? 0.1 : 0.06), color: colors.accent, border: `1px solid ${alpha(colors.accent, 0.15)}`, fontWeight: 500, fontSize: "0.65rem" }}
                                    />
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Package name + description */}
                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: { xs: "1.25rem", md: "1.4rem" }, mt: 1.5 }}>
                        {estimate?.title || pkg?.name}
                    </Typography>
                    {pkg?.description && (
                        <Typography sx={{ color: colors.muted, fontSize: "0.88rem", lineHeight: 1.6, mt: 0.5 }}>
                            {pkg.description}
                        </Typography>
                    )}
                </Box>

                {/* Summary stats */}
                {hasStats && (
                    <Box sx={{ px: { xs: 3.5, md: 5 }, mt: 2.5 }}>
                        <Divider sx={{ borderColor: alpha(colors.border, 0.4), mb: 0.5 }} />
                        {STATS.map(({ key, Icon, label, color }) => (
                            <Box
                                key={key}
                                sx={{
                                    display: "flex", alignItems: "center", py: 1.25,
                                    borderBottom: `1px solid ${alpha(colors.border, 0.3)}`,
                                }}
                            >
                                <Box sx={{
                                    width: 30, height: 30, borderRadius: 1.5,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    bgcolor: alpha(color, 0.13),
                                    mr: 1.5, flexShrink: 0,
                                }}>
                                    <Icon sx={{ fontSize: 15, color }} />
                                </Box>
                                <Typography sx={{ color: colors.text, fontSize: "0.88rem", fontWeight: 500, flex: 1 }}>
                                    {label}
                                </Typography>
                                <Typography sx={{ color: colors.text, fontSize: "0.88rem", fontWeight: 700 }}>
                                    {counts[key]}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Films */}
                <Box sx={{ px: { xs: 3.5, md: 5 }, pt: 2.5, pb: { xs: 3, md: 4 } }}>
                    <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 1.5, fontSize: "0.6rem", fontWeight: 700, mb: 1 }}>
                        Films
                    </Typography>
                    {films.length > 0 ? (
                        films.map((f) => (
                            <Typography key={f.id} sx={{ color: colors.muted, fontSize: "0.88rem", py: 0.4 }}>
                                {f.film.name}
                            </Typography>
                        ))
                    ) : (
                        <Typography sx={{ color: alpha(colors.muted, 0.45), fontSize: "0.85rem", fontStyle: "italic" }}>
                            No films added
                        </Typography>
                    )}

                    {estimate?.notes && (
                        <Typography sx={{ color: alpha(colors.muted, 0.7), fontStyle: "italic", fontSize: "0.8rem", lineHeight: 1.6, mt: 2 }}>
                            {estimate.notes}
                        </Typography>
                    )}
                </Box>
            </Box>
        </RevealBox>
    );
}
