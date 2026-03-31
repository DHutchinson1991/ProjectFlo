"use client";

import dynamic from "next/dynamic";
import { Box, Typography, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    AccessTime as AccessTimeIcon,
    Place as PlaceIcon,
} from "@mui/icons-material";
import { getDaysUntil } from "@/features/workflow/proposals/utils/portal/formatting";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

const VenueMap = dynamic(() => import("@/features/workflow/inquiries/components/VenueMap"), { ssr: false });

interface EventDetailsSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    weddingDate: string | null;
    venueDetails: string | null;
    venueAddress: string | null;
    eventDays: PublicProposalEventDay[];
}

export default function EventDetailsSection({ content, weddingDate, venueDetails, venueAddress, eventDays, colors, isDark, cardSx }: EventDetailsSectionProps) {
    if (!isSectionVisible(content, "event_details")) return null;

    const daysUntil = getDaysUntil(weddingDate);

    /* ── Date badge ── */
    const dateObj = weddingDate ? (() => {
        // weddingDate may be "2026-05-30" or full ISO "2026-05-30T00:00:00.000Z"
        const d = new Date(weddingDate.includes("T") ? weddingDate : weddingDate + "T00:00:00");
        return isNaN(d.getTime()) ? null : d;
    })() : null;
    const monthShort = dateObj ? dateObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase() : "";
    const dayNum = dateObj ? dateObj.getDate().toString() : "";
    const displayDate = dateObj
        ? dateObj.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "long", day: "numeric" })
        : "Date not set";

    /* ── Locations ── */
    const allLocations = eventDays.flatMap((d) => d.location_slots || []);
    const uniqueLocations = allLocations.filter(
        (l, i, arr) => arr.findIndex((x) => (x.name || x.location?.name) === (l.name || l.location?.name)) === i,
    );

    /* Map — first location with lat/lng */
    const mapLoc = uniqueLocations.find((l) => l.location?.lat != null && l.location?.lng != null);
    const mapLat = mapLoc?.location?.lat ?? null;
    const mapLng = mapLoc?.location?.lng ?? null;
    const hasMap = mapLat != null && mapLng != null;

    /* Primary venue = venueDetails prop, or extract from location library data */
    const primaryVenue = venueDetails || (() => {
        const loc = uniqueLocations[0];
        if (!loc) return null;
        const lib = loc.location;
        if (!lib) return loc.name || null;
        // address_line1 often starts with venue name (e.g. "Buckatree Hall Hotel, Ercall Lane, ...")
        // Use the first comma-segment of address_line1 if it differs from the location name
        const a1First = lib.address_line1?.split(",")[0]?.trim();
        if (a1First && a1First !== lib.name) return a1First;
        return lib.name || loc.name || null;
    })();

    /* Build structured address parts */
    const addressFields: { label: string; value: string }[] = (() => {
        const loc = mapLoc ?? uniqueLocations[0];
        if (!loc) {
            // fallback to raw venueAddress
            if (!venueAddress) return [];
            return venueAddress.split(",").map((p) => p.trim()).filter(Boolean).map((v) => ({ label: "", value: v }));
        }
        const f = loc.location;
        if (!f) {
            if (loc.address) return loc.address.split(",").map((p) => p.trim()).filter(Boolean).map((v) => ({ label: "", value: v }));
            return [];
        }
        // Strip venue name from address_line1 if it starts with the venue name
        let street = f.address_line1 || "";
        if (primaryVenue && street.startsWith(primaryVenue)) {
            street = street.slice(primaryVenue.length).replace(/^[,\s]+/, "");
        }
        return [
            street && { label: "Street", value: street },
            f.city && { label: "City", value: f.city },
            f.state && { label: "County", value: f.state },
        ].filter(Boolean) as { label: string; value: string }[];
    })();

    const hasVenueInfo = !!primaryVenue || addressFields.length > 0;
    const locationCount = uniqueLocations.length;

    return (
        <RevealBox>
            <Box sx={cardSx}>
                {/* Header */}
                <Box sx={{
                    px: { xs: 3, md: 4 }, pt: { xs: 2.5, md: 3 }, pb: 1.5,
                    borderBottom: `1px solid ${alpha(colors.border, 0.3)}`,
                }}>
                    <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700, textAlign: "center" }}>
                        {getSectionTitle(content, "event_details", "Event Details")}
                    </Typography>
                </Box>

                {/* Body — left info + right map */}
                <Box sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    minHeight: hasMap ? 220 : "auto",
                }}>
                    {/* ── LEFT — Date + Venue ── */}
                    <Box sx={{
                        flex: "0 0 auto",
                        width: { xs: "100%", md: hasMap ? "50%" : "100%" },
                        p: { xs: 2.5, md: 3 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}>
                        {/* Date row */}
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: hasVenueInfo ? 2 : 0 }}>
                            {dateObj ? (
                                <Box sx={{
                                    width: 56, minWidth: 56, height: 56, borderRadius: 2.5,
                                    background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`,
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    boxShadow: `0 4px 12px ${alpha(colors.accent, 0.25)}`,
                                }}>
                                    <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1 }}>
                                        {monthShort}
                                    </Typography>
                                    <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                                        {dayNum}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{
                                    width: 56, minWidth: 56, height: 56, borderRadius: 2.5,
                                    bgcolor: alpha(colors.muted, 0.1),
                                    border: `2px dashed ${alpha(colors.muted, 0.2)}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <AccessTimeIcon sx={{ color: colors.muted, fontSize: 20 }} />
                                </Box>
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: "0.95rem", lineHeight: 1.3 }}>
                                    {displayDate}
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: colors.muted, mt: 0.25 }}>
                                    Event Date
                                </Typography>
                                {daysUntil !== null && daysUntil > 0 && (
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                                        <AccessTimeIcon sx={{ fontSize: 11, color: colors.accent }} />
                                        <Typography sx={{ color: colors.accent, fontSize: "0.7rem", fontWeight: 500 }}>{daysUntil} days away</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Venue info */}
                        {hasVenueInfo && (
                            <Box sx={{
                                display: "flex", alignItems: "flex-start", gap: 1.5,
                                borderLeft: `2px solid ${alpha(colors.border, 0.3)}`,
                                pl: 1.5,
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 0.15, flexShrink: 0 }}>
                                    <PlaceIcon sx={{ fontSize: 14, color: colors.muted }} />
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    {locationCount > 0 && (
                                        <Typography sx={{ fontSize: "0.65rem", color: colors.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.25 }}>
                                            Location {locationCount > 1 ? `1 of ${locationCount}` : "1 of 1"}
                                        </Typography>
                                    )}
                                    {primaryVenue && (
                                        <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>
                                            {primaryVenue}
                                        </Typography>
                                    )}
                                    {addressFields.length > 0 && (
                                        <Stack spacing={0.2} sx={{ mt: 0.5 }}>
                                            {addressFields.map((field, i) => (
                                                <Box key={i} sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                                                    {field.label && (
                                                        <Typography sx={{ fontSize: "0.62rem", color: colors.muted, fontWeight: 600, minWidth: 52, flexShrink: 0 }}>
                                                            {field.label}
                                                        </Typography>
                                                    )}
                                                    <Typography sx={{ fontSize: "0.72rem", color: alpha(colors.text, 0.65), lineHeight: 1.4 }}>
                                                        {field.value}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* ── RIGHT — Map ── */}
                    {hasMap && (
                        <Box sx={{ flex: 1, minWidth: 0, p: 1, display: "flex", flexDirection: "column" }}>
                            <Box sx={{
                                flex: 1,
                                borderRadius: 3,
                                overflow: "hidden",
                                border: `1px solid ${alpha(colors.accent, 0.2)}`,
                                background: `linear-gradient(180deg, ${alpha(colors.gradient1, isDark ? 0.06 : 0.03)}, ${alpha(colors.gradient2, isDark ? 0.04 : 0.02)})`,
                                boxShadow: `inset 0 1px 0 ${alpha("#fff", 0.04)}, 0 14px 30px ${alpha("#000", 0.26)}`,
                                minHeight: 180,
                                p: 0.35,
                            }}>
                                <VenueMap lat={mapLat} lng={mapLng} height="100%" />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </RevealBox>
    );
}
