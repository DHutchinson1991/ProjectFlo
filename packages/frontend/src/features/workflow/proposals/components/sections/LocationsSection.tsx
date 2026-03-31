"use client";

import { Box, Typography, Stack, Divider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Place as PlaceIcon } from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

interface LocationsSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    eventDays: PublicProposalEventDay[];
}

export default function LocationsSection({ content, eventDays, colors, isDark, cardSx }: LocationsSectionProps) {
    if (!isSectionVisible(content, "locations")) return null;

    const allLocations = eventDays.flatMap((d) => d.location_slots || []);
    const uniqueLocations = allLocations.filter(
        (l, i, arr) => arr.findIndex((x) => (x.name || x.location?.name) === (l.name || l.location?.name)) === i,
    );
    if (uniqueLocations.length === 0) return null;

    return (
        <RevealBox>
            <Box sx={cardSx}>
                <Box sx={{ px: { xs: 3.5, md: 5 }, pt: { xs: 3, md: 4 }, pb: 1 }}>
                    <Typography sx={{ color: colors.accent, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.65rem", fontWeight: 700 }}>
                        {getSectionTitle(content, "locations", "Locations")}
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: alpha(colors.border, 0.5), mx: { xs: 3.5, md: 5 } }} />
                <Stack spacing={0} sx={{ px: { xs: 3.5, md: 5 }, py: { xs: 2, md: 2.5 } }}>
                    {uniqueLocations.map((loc, idx) => {
                        const locName = loc.location?.name || loc.name || "Location";
                        const locAddr = loc.address || [loc.location?.address_line1, loc.location?.city, loc.location?.state].filter(Boolean).join(", ");
                        return (
                            <Box
                                key={loc.id || idx}
                                sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, borderTop: idx > 0 ? `1px solid ${alpha(colors.border, 0.3)}` : "none" }}
                            >
                                <Box
                                    sx={{
                                        width: 36, height: 36, borderRadius: 2,
                                        bgcolor: alpha(colors.accent, isDark ? 0.12 : 0.08),
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}
                                >
                                    <PlaceIcon sx={{ color: colors.accent, fontSize: 18 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: "0.92rem", lineHeight: 1.3 }}>{locName}</Typography>
                                    {locAddr && <Typography sx={{ color: colors.muted, fontSize: "0.78rem", mt: 0.15 }}>{locAddr}</Typography>}
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>
        </RevealBox>
    );
}
