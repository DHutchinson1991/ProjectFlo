"use client";

import React, { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Add as ZoomInIcon,
    Remove as ZoomOutIcon,
    Videocam as CameraIcon,
    Mic as MicIcon,
    AccessTime as TimeIcon,
} from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

/* ── Helpers ── */

function parseTimeToMinutes(t: string | null | undefined): number | null {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

function formatHour(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12}${ampm}` : `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

function formatDuration(mins: number): string {
    if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
}

/** Default palette for activity blocks when no color is set */
const BLOCK_COLORS = [
    "#8b5cf6", "#6366f1", "#3b82f6", "#0ea5e9", "#14b8a6",
    "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#a855f7",
];

/* ── Constants ── */
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.3;
const HOUR_WIDTH_BASE = 120;
const BLOCK_HEIGHT = 44;
const BLOCK_GAP = 8;
const TICK_HEIGHT = 10;

/* ── Equipment classification helpers ── */
const CAMERA_PATTERNS = /camera|cam\b|videocam|dslr|mirrorless|cinema|blackmagic|sony\s?(a7|fx|a1)|canon\s?(r5|c70|c300)|red\b|arri/i;
const MIC_PATTERNS = /mic|microphone|lav|lavalier|shotgun|wireless|audio|rode|sennheiser|zoom\s?h/i;

function countEquipmentForActivity(
    activityId: number,
    eventDays: PublicProposalEventDay[],
): { cameras: number; mics: number } {
    let cameras = 0;
    let mics = 0;
    for (const day of eventDays) {
        for (const slot of day.day_crew_slots ?? []) {
            const assigned = slot.activity_assignments?.some((a) => a.project_activity_id === activityId);
            // If no assignments exist at all, count all crew (day-level); otherwise filter by assignment
            const hasAnyAssignments = (day.day_crew_slots ?? []).some((s) => (s.activity_assignments?.length ?? 0) > 0);
            if (hasAnyAssignments && !assigned) continue;

            for (const eq of slot.equipment) {
                const name = eq.equipment.item_name;
                if (CAMERA_PATTERNS.test(name)) cameras++;
                else if (MIC_PATTERNS.test(name)) mics++;
            }
        }
    }
    return { cameras, mics };
}

interface ScheduleTimelineSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    eventDays: PublicProposalEventDay[];
}

export default function ScheduleTimelineSection({ content, eventDays, colors, isDark, cardSx }: ScheduleTimelineSectionProps) {
    if (!isSectionVisible(content, "schedule")) return null;
    if (eventDays.length === 0 || !eventDays.some((d) => d.activities.length > 0)) return null;

    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState<number | null>(null); // null = not yet auto-fitted
    const [clickedActivityId, setClickedActivityId] = useState<number | null>(null);
    const [hoveredActivityId, setHoveredActivityId] = useState<number | null>(null);
    const activeActivityId = clickedActivityId ?? hoveredActivityId;

    const handleZoom = useCallback((dir: 1 | -1) => {
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (z ?? 1) + dir * ZOOM_STEP)));
    }, []);

    /* Flatten all activities across days, compute time bounds */
    const { dayRows, startMin, endMin, totalMinutes } = useMemo(() => {
        type Activity = PublicProposalEventDay["activities"][number];
        const rows: { dayName: string; activities: Activity[] }[] = [];
        let earliest = Infinity;
        let latest = -Infinity;

        for (const day of eventDays) {
            const timed = day.activities.filter((a) => parseTimeToMinutes(a.start_time) !== null);
            if (timed.length === 0) continue;
            const sorted = [...timed].sort((a, b) => parseTimeToMinutes(a.start_time)! - parseTimeToMinutes(b.start_time)!);
            rows.push({ dayName: day.name, activities: sorted });

            for (const a of sorted) {
                const s = parseTimeToMinutes(a.start_time)!;
                const dur = a.duration_minutes ?? (a.end_time ? (parseTimeToMinutes(a.end_time)! - s) : 30);
                const e = s + Math.max(dur, 15);
                if (s < earliest) earliest = s;
                if (e > latest) latest = e;
            }
        }

        const sH = Math.floor(earliest / 60) * 60;
        const eH = Math.ceil(latest / 60) * 60;
        return { dayRows: rows, startMin: sH, endMin: eH, totalMinutes: eH - sH };
    }, [eventDays]);

    if (dayRows.length === 0) return null;

    /* Auto-fit: compute zoom so timeline fills container width on mount */
    useEffect(() => {
        if (zoom !== null) return; // already set
        const el = containerRef.current;
        if (!el) { setZoom(1); return; }
        const availableWidth = el.clientWidth - 32; // account for px padding
        const naturalWidth = totalMinutes * (HOUR_WIDTH_BASE / 60);
        if (naturalWidth <= 0) { setZoom(1); return; }
        const fitZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, availableWidth / naturalWidth));
        setZoom(fitZoom);
    }, [totalMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

    const effectiveZoom = zoom ?? 1;
    const hourWidth = HOUR_WIDTH_BASE * effectiveZoom;
    const pxPerMin = hourWidth / 60;
    const totalWidth = totalMinutes * pxPerMin;

    const hourMarkers: number[] = [];
    for (let m = startMin; m <= endMin; m += 60) hourMarkers.push(m);

    /* Color assignment */
    let colorIdx = 0;

    /* All activities flattened for lookup */
    const allActivities = useMemo(() => dayRows.flatMap((r) => r.activities), [dayRows]);

    const selectedActivity = allActivities.find((a) => a.id === activeActivityId) ?? null;

    const equipmentCounts = useMemo(() => {
        if (!selectedActivity) return { cameras: 0, mics: 0 };
        return countEquipmentForActivity(selectedActivity.id, eventDays);
    }, [selectedActivity, eventDays]);

    /* Build a stable color map so selected activity can reference its color */
    const activityColorMap = useMemo(() => {
        const map = new Map<number, string>();
        let idx = 0;
        for (const row of dayRows) {
            for (const a of row.activities) {
                map.set(a.id, a.color || BLOCK_COLORS[idx++ % BLOCK_COLORS.length]);
            }
        }
        return map;
    }, [dayRows]);

    return (
        <RevealBox>
            <Box ref={containerRef} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                {/* ── Bare title ── */}
                <Typography sx={{
                    color: colors.accent, textTransform: "uppercase", letterSpacing: 2,
                    fontSize: "0.62rem", fontWeight: 700, textAlign: "center",
                }}>
                    {getSectionTitle(content, "schedule", "Your Day Timeline")}
                </Typography>

                {/* ── Scrollable timeline ── */}
                <Box
                    ref={scrollRef}
                    sx={{
                        position: "relative",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        pt: 1.5,
                        pb: 1.5,
                        "&::-webkit-scrollbar": { height: 4 },
                        "&::-webkit-scrollbar-thumb": { bgcolor: alpha(colors.border, 0.3), borderRadius: 2 },
                        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                    }}
                >
                        {/* Center the timeline content when it fits in viewport */}
                        <Box sx={{
                            minWidth: totalWidth + 32,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            px: 2,
                        }}>
                            {/* ── Day rows ── */}
                            {dayRows.map(({ dayName, activities }, dIdx) => (
                                <Box key={dIdx} sx={{ position: "relative", width: totalWidth, mb: dayRows.length > 1 ? 3 : 0 }}>
                                    {/* Day label (multi-day only) */}
                                    {dayRows.length > 1 && (
                                        <Typography sx={{
                                            textAlign: "center", mb: 1,
                                            fontSize: "0.58rem", color: colors.muted, fontWeight: 600,
                                            textTransform: "uppercase", letterSpacing: "0.5px",
                                        }}>
                                            {dayName}
                                        </Typography>
                                    )}

                                    {/* Activity blocks row */}
                                    <Box sx={{ position: "relative", height: BLOCK_HEIGHT }}>
                                        {activities.map((activity) => {
                                            const s = parseTimeToMinutes(activity.start_time)!;
                                            const dur = activity.duration_minutes ?? (activity.end_time ? (parseTimeToMinutes(activity.end_time)! - s) : 30);
                                            const effectiveDur = Math.max(dur, 15);
                                            const x = (s - startMin) * pxPerMin;
                                            const w = effectiveDur * pxPerMin;
                                            const actColor = activityColorMap.get(activity.id) || BLOCK_COLORS[0];
                                            const isSelected = activity.id === activeActivityId;

                                            return (
                                                <Box
                                                    key={activity.id}
                                                    onClick={() => setClickedActivityId((prev) => prev === activity.id ? null : activity.id)}
                                                    onMouseEnter={() => setHoveredActivityId(activity.id)}
                                                    onMouseLeave={() => setHoveredActivityId(null)}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: x,
                                                        width: Math.max(w, 48),
                                                        height: BLOCK_HEIGHT,
                                                        borderRadius: 2.5,
                                                        bgcolor: alpha(actColor, isSelected ? (isDark ? 0.28 : 0.2) : (isDark ? 0.15 : 0.1)),
                                                        border: `1px solid ${alpha(actColor, isSelected ? 0.6 : 0.3)}`,
                                                        boxShadow: isSelected ? `0 0 12px ${alpha(actColor, 0.25)}` : "none",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        px: 1.25,
                                                        gap: 0.75,
                                                        overflow: "hidden",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                        "&:hover": {
                                                            bgcolor: alpha(actColor, isDark ? 0.25 : 0.18),
                                                            borderColor: alpha(actColor, 0.5),
                                                        },
                                                    }}
                                                >
                                                    <Box sx={{
                                                        width: 5, minWidth: 5, height: 5, borderRadius: "50%",
                                                        bgcolor: actColor, flexShrink: 0,
                                                    }} />
                                                    <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                                        <Typography noWrap sx={{
                                                            fontSize: "0.68rem", fontWeight: 600, color: colors.text, lineHeight: 1.2,
                                                        }}>
                                                            {activity.name}
                                                        </Typography>
                                                        <Typography noWrap sx={{
                                                            fontSize: "0.52rem", color: colors.muted, lineHeight: 1.2,
                                                        }}>
                                                            {activity.duration_minutes ? formatDuration(activity.duration_minutes) : ""}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>

                                    {/* ── Tick-mark timing row: |----|----|----| ── */}
                                    <Box sx={{ position: "relative", height: TICK_HEIGHT + 18, mt: 0.5 }}>
                                        {/* Horizontal baseline */}
                                        <Box sx={{
                                            position: "absolute", top: 0, left: 0, right: 0,
                                            height: "1px", bgcolor: alpha(colors.border, 0.35),
                                        }} />

                                        {/* Hour tick marks + labels */}
                                        {hourMarkers.map((m) => {
                                            const x = (m - startMin) * pxPerMin;
                                            return (
                                                <React.Fragment key={m}>
                                                    <Box sx={{
                                                        position: "absolute", left: x, top: 0,
                                                        width: "1px", height: TICK_HEIGHT,
                                                        bgcolor: alpha(colors.border, 0.5),
                                                    }} />
                                                    <Typography sx={{
                                                        position: "absolute", left: x, top: TICK_HEIGHT + 2,
                                                        transform: "translateX(-50%)",
                                                        fontSize: "0.56rem", color: colors.muted, fontWeight: 500,
                                                        letterSpacing: "0.2px", userSelect: "none", whiteSpace: "nowrap",
                                                    }}>
                                                        {formatHour(m)}
                                                    </Typography>
                                                </React.Fragment>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                {/* ── Activity detail strip with zoom controls ── */}
                {(() => {
                    const actColor = selectedActivity ? (activityColorMap.get(selectedActivity.id) || colors.accent) : colors.accent;
                    const startTime = selectedActivity?.start_time ? formatHour(parseTimeToMinutes(selectedActivity.start_time)!) : null;
                    const endTime = selectedActivity?.end_time ? formatHour(parseTimeToMinutes(selectedActivity.end_time)!) : null;
                    const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime ?? "";
                    const { cameras, mics } = equipmentCounts;
                    // Extract venue name from day-level location_slots (same data EventDetailsSection uses)
                    const actDay = selectedActivity ? eventDays.find((d) => d.activities.some((a) => a.id === selectedActivity.id)) : null;
                    const locSlot = actDay?.location_slots?.[0];
                    const lib = locSlot?.location;
                    let locationName: string | null = null;
                    if (lib) {
                        const a1First = lib.address_line1?.split(",")[0]?.trim();
                        locationName = (a1First && a1First !== lib.name) ? a1First : (lib.name || null);
                    }
                    if (!locationName) locationName = locSlot?.name || null;

                    return (
                        <Box sx={{
                            ...cardSx as any,
                            bgcolor: isDark ? alpha(colors.card, 0.35) : alpha(colors.card, 0.7),
                            display: "flex",
                            alignItems: "center",
                            gap: 2.5,
                            px: 3,
                            py: 1.8,
                            mx: "auto",
                            width: "auto",
                            maxWidth: "100%",
                        }}>

                        {selectedActivity ? (
                            <>
                            {/* Color accent dot */}
                            <Box sx={{
                                width: 10, minWidth: 10, height: 10, borderRadius: "50%",
                                bgcolor: actColor,
                                boxShadow: `0 0 8px ${alpha(actColor, 0.4)}`,
                            }} />

                            {/* Location or activity name */}
                            <Typography noWrap sx={{
                                fontSize: "0.78rem", fontWeight: 600, color: colors.text,
                                maxWidth: 200,
                            }}>
                                {locationName || selectedActivity.name}
                            </Typography>

                            <Box sx={{ width: "1px", height: 20, bgcolor: alpha(colors.border, 0.3) }} />

                            {/* Time range */}
                            {timeRange && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <TimeIcon sx={{ fontSize: 14, color: colors.muted }} />
                                    <Typography sx={{ fontSize: "0.66rem", color: colors.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
                                        {timeRange}
                                    </Typography>
                                </Box>
                            )}

                            {/* Duration */}
                            {selectedActivity.duration_minutes && (
                                <Typography sx={{ fontSize: "0.66rem", color: colors.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
                                    {formatDuration(selectedActivity.duration_minutes)}
                                </Typography>
                            )}

                            {/* Equipment counts */}
                            {(cameras > 0 || mics > 0) && (
                                <>
                                    <Box sx={{ width: "1px", height: 20, bgcolor: alpha(colors.border, 0.3) }} />
                                    {cameras > 0 && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <CameraIcon sx={{ fontSize: 15, color: colors.muted }} />
                                            <Typography sx={{ fontSize: "0.66rem", color: colors.muted, fontWeight: 600 }}>
                                                {cameras}
                                            </Typography>
                                        </Box>
                                    )}
                                    {mics > 0 && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <MicIcon sx={{ fontSize: 15, color: colors.muted }} />
                                            <Typography sx={{ fontSize: "0.66rem", color: colors.muted, fontWeight: 600 }}>
                                                {mics}
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            )}

                            <Box sx={{ width: "1px", height: 20, bgcolor: alpha(colors.border, 0.3) }} />
                            </>
                        ) : (
                            <Typography sx={{
                                fontSize: "0.68rem", color: colors.muted, fontWeight: 400,
                                letterSpacing: "0.1px", py: 0.2,
                            }}>
                                Select an activity to see details
                            </Typography>
                        )}

                        {/* Zoom controls — always visible */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ...(!selectedActivity && { ml: "auto" }) }}>
                            <IconButton size="small" onClick={() => handleZoom(-1)} disabled={effectiveZoom <= MIN_ZOOM}
                                sx={{ color: colors.muted, width: 26, height: 26, "&:hover": { color: colors.text }, "&.Mui-disabled": { color: alpha(colors.muted, 0.3) } }}>
                                <ZoomOutIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                            <Typography sx={{ fontSize: "0.6rem", color: colors.muted, fontWeight: 600, minWidth: 30, textAlign: "center", userSelect: "none" }}>
                                {Math.round(effectiveZoom * 100)}%
                            </Typography>
                            <IconButton size="small" onClick={() => handleZoom(1)} disabled={effectiveZoom >= MAX_ZOOM}
                                sx={{ color: colors.muted, width: 26, height: 26, "&:hover": { color: colors.text }, "&.Mui-disabled": { color: alpha(colors.muted, 0.3) } }}>
                                <ZoomInIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Box>
                        </Box>
                    );
                })()}

                </Box>
            </RevealBox>
    );
}