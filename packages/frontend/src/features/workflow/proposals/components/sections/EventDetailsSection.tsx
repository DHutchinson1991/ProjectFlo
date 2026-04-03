"use client";

import { Box, Typography, Stack } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    CalendarMonth as CalendarIcon,
    Schedule as ClockIcon,
} from "@mui/icons-material";
import { getDaysUntil } from "@/features/workflow/proposals/utils/portal/formatting";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import { useReveal, revealSx } from "@/features/workflow/proposals/utils/portal/animations";

/* ── Helpers ── */

function parseTimeToMinutes(t: string | null | undefined): number | null {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

function formatTime12(t: string | null | undefined): string | null {
    const mins = parseTimeToMinutes(t);
    if (mins === null) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const shimmer = keyframes`
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

interface EventDetailsSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    weddingDate: string | null;
    venueDetails: string | null;
    venueAddress: string | null;
    eventDays: PublicProposalEventDay[];
}

export default function EventDetailsSection({ content, weddingDate, venueDetails, venueAddress, eventDays, colors, isDark, cardSx }: EventDetailsSectionProps) {
    if (!isSectionVisible(content, "event_details")) return null;

    const { ref, visible } = useReveal();

    /* ── Date parsing ── */
    const dateObj = weddingDate ? (() => {
        const d = new Date(weddingDate.includes("T") ? weddingDate : weddingDate + "T00:00:00");
        return isNaN(d.getTime()) ? null : d;
    })() : null;

    const dayOfWeek = dateObj ? dateObj.toLocaleDateString(undefined, { weekday: "long" }) : "";
    const monthLong = dateObj ? dateObj.toLocaleDateString(undefined, { month: "long" }) : "";
    const dayNum = dateObj ? dateObj.getDate() : 0;
    const year = dateObj ? dateObj.getFullYear() : 0;

    /* ── Time range from activities ── */
    const allActivities = eventDays.flatMap((d) => d.activities);
    const times = allActivities
        .map((a) => parseTimeToMinutes(a.start_time))
        .filter((t): t is number => t !== null)
        .sort((a, b) => a - b);
    const endTimes = allActivities
        .map((a) => {
            const s = parseTimeToMinutes(a.start_time);
            const e = parseTimeToMinutes(a.end_time);
            if (e !== null) return e;
            if (s !== null && a.duration_minutes) return s + a.duration_minutes;
            return null;
        })
        .filter((t): t is number => t !== null)
        .sort((a, b) => a - b);

    const earliestTime = times[0] ?? null;
    const latestEnd = endTimes[endTimes.length - 1] ?? null;

    const formatMins = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    const totalHours = (earliestTime !== null && latestEnd !== null) ? Math.round((latestEnd - earliestTime) / 60) : null;

    const cardBase = {
        borderRadius: 4,
        border: `1px solid ${alpha(colors.border, 0.2)}`,
        bgcolor: alpha(colors.card, isDark ? 0.4 : 0.6),
        backdropFilter: "blur(12px)",
        p: { xs: 3, md: 4 },
        flex: 1,
        minWidth: 0,
    };

    return (
        <Box ref={ref}>
            <Typography sx={{
                color: colors.accent, textTransform: "uppercase", letterSpacing: 2,
                fontSize: "0.65rem", fontWeight: 700, textAlign: "center", mb: 3,
                ...revealSx(visible, 0),
            }}>
                {getSectionTitle(content, "event_details", "Event Details")}
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={revealSx(visible, 0.15)}>
                {/* ── Date card ── */}
                <Box sx={cardBase}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <CalendarIcon sx={{ fontSize: 18, color: colors.accent }} />
                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Date
                        </Typography>
                    </Box>
                    {dateObj ? (
                        <>
                            <Typography sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 200, color: colors.text, lineHeight: 1.1 }}>
                                {dayOfWeek}
                            </Typography>
                            <Typography sx={{ fontSize: "0.9rem", color: colors.muted, fontWeight: 300, mt: 0.5 }}>
                                {monthLong} {dayNum}, {year}
                            </Typography>
                        </>
                    ) : (
                        <Typography sx={{ fontSize: "1rem", color: colors.muted, fontWeight: 300, fontStyle: "italic" }}>
                            Date to be confirmed
                        </Typography>
                    )}
                </Box>

                {/* ── Time card ── */}
                <Box sx={cardBase}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <ClockIcon sx={{ fontSize: 18, color: colors.accent }} />
                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Coverage
                        </Typography>
                    </Box>
                    {earliestTime !== null ? (
                        <>
                            <Typography sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 200, color: colors.text, lineHeight: 1.1 }}>
                                {formatMins(earliestTime)}
                                {latestEnd !== null && (
                                    <Typography component="span" sx={{ fontSize: "0.5em", color: colors.muted, mx: 1 }}>–</Typography>
                                )}
                                {latestEnd !== null && formatMins(latestEnd)}
                            </Typography>
                            {totalHours !== null && totalHours > 0 && (
                                <Typography sx={{ fontSize: "0.85rem", color: colors.muted, fontWeight: 300, mt: 0.5 }}>
                                    {totalHours} hours of coverage
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Typography sx={{ fontSize: "1rem", color: colors.muted, fontWeight: 300, fontStyle: "italic" }}>
                            Times to be confirmed
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}
