"use client";

import React from "react";
import { Box, Typography, Tooltip, Stack, Chip } from "@mui/material";

// ─── Types ───────────────────────────────────────────────────────────

interface MomentScheduleItem {
    moment_id: number;
    start_time: string | null;
    duration_minutes: number | null;
}

interface BeatScheduleItem {
    beat_id: number;
    start_time: string | null;
    duration_minutes: number | null;
}

export interface VisualTimelineScene {
    scene_id: number;
    scene_name: string;
    scene_mode?: string | null;
    event_day_name?: string | null;
    event_day_template_id?: number | null;
    scheduled_start_time?: string | null; // "HH:MM"
    scheduled_duration_minutes?: number | null;
    moment_schedules?: MomentScheduleItem[] | null;
    beat_schedules?: BeatScheduleItem[] | null;
    moments?: Array<{ id: number; name: string; duration?: number; duration_seconds?: number }>;
    beats?: Array<{ id: number; name: string; duration_seconds?: number }>;
    source?: "film" | "package" | "project" | "none";
}

export interface EventDayGroup {
    id?: number;
    name: string;
    order_index: number;
    scenes: VisualTimelineScene[];
}

interface VisualTimelineProps {
    scenes: VisualTimelineScene[];
    eventDays?: Array<{ id: number; name: string; order_index: number }>;
    /** Timeline display range: start hour (0-23), default 6 */
    startHour?: number;
    /** Timeline display range: end hour (0-23), default 23 */
    endHour?: number;
    onSceneClick?: (sceneId: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Parse "HH:MM" to total minutes from midnight */
function parseTimeToMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

/** Format minutes from midnight to "HH:MM" */
function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Scene color palette - muted pastel tones */
const SCENE_COLORS = [
    "rgba(123, 97, 255, 0.7)",   // Purple
    "rgba(59, 130, 246, 0.7)",   // Blue
    "rgba(16, 185, 129, 0.7)",   // Emerald
    "rgba(245, 158, 11, 0.7)",   // Amber
    "rgba(239, 68, 68, 0.7)",    // Red
    "rgba(236, 72, 153, 0.7)",   // Pink
    "rgba(14, 165, 233, 0.7)",   // Sky
    "rgba(168, 85, 247, 0.7)",   // Violet
];

// ─── Component ───────────────────────────────────────────────────────

const VisualTimeline: React.FC<VisualTimelineProps> = ({
    scenes,
    eventDays = [],
    startHour = 6,
    endHour = 23,
    onSceneClick,
}) => {
    const totalMinutes = (endHour - startHour) * 60;
    const hourMarkers = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    const visibleHourMarkers = hourMarkers.filter((h) => h % 2 === 0 || h === startHour || h === endHour);

    // Group scenes by event day
    const groups: EventDayGroup[] = React.useMemo(() => {
        const dayMap = new Map<string, VisualTimelineScene[]>();
        const unassigned: VisualTimelineScene[] = [];

        for (const scene of scenes) {
            const dayName = scene.event_day_name;
            if (dayName) {
                if (!dayMap.has(dayName)) dayMap.set(dayName, []);
                dayMap.get(dayName)!.push(scene);
            } else {
                unassigned.push(scene);
            }
        }

        // Sort event days by their order_index
        const sorted: EventDayGroup[] = eventDays
            .sort((a, b) => a.order_index - b.order_index)
            .map((ed) => ({
                id: ed.id,
                name: ed.name,
                order_index: ed.order_index,
                scenes: dayMap.get(ed.name) || [],
            }))
            .filter((g) => g.scenes.length > 0);

        // Add any days from scenes that aren't in the eventDays array
        for (const [dayName, dayScenes] of dayMap.entries()) {
            if (!sorted.find((g) => g.name === dayName)) {
                sorted.push({ name: dayName, order_index: sorted.length, scenes: dayScenes });
            }
        }

        if (unassigned.length > 0) {
            sorted.push({ name: "Unassigned", order_index: 999, scenes: unassigned });
        }

        return sorted;
    }, [scenes, eventDays]);

    /** Map scene position to percentage of the timeline width */
    const getPosition = (startMinutes: number): number => {
        const offset = startMinutes - startHour * 60;
        return Math.max(0, Math.min(100, (offset / totalMinutes) * 100));
    };

    const getWidth = (durationMinutes: number): number => {
        return Math.max(1, Math.min(100, (durationMinutes / totalMinutes) * 100));
    };

    const hourlyDensity = React.useMemo(() => {
        const buckets = Array.from({ length: endHour - startHour }, () => 0);
        for (const scene of scenes) {
            const start = parseTimeToMinutes(scene.scheduled_start_time);
            const duration = scene.scheduled_duration_minutes ?? 0;
            if (start === null || duration <= 0) continue;
            const end = start + duration;
            for (let hour = startHour; hour < endHour; hour++) {
                const bucketStart = hour * 60;
                const bucketEnd = (hour + 1) * 60;
                const overlap = Math.max(0, Math.min(end, bucketEnd) - Math.max(start, bucketStart));
                if (overlap > 0) {
                    buckets[hour - startHour] += overlap;
                }
            }
        }
        return buckets.map((mins) => Math.min(100, Math.round((mins / 60) * 100)));
    }, [scenes, startHour, endHour]);

    if (scenes.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                    No scheduled scenes to display. Add schedule times to see the visual timeline.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", overflowX: "hidden", overflowY: "visible", pr: 0.25 }}>
            {/* Hour markers header */}
            <Box sx={{ position: "relative", height: 28, ml: "140px", mb: 0.5 }}>
                {visibleHourMarkers.map((hour) => (
                    <Typography
                        key={hour}
                        sx={{
                            position: "absolute",
                            left: `${getPosition(hour * 60)}%`,
                            transform: "translateX(-50%)",
                            fontSize: "0.65rem",
                            color: "rgba(255,255,255,0.35)",
                            fontFamily: "monospace",
                            userSelect: "none",
                        }}
                    >
                        {`${hour.toString().padStart(2, "0")}`}
                    </Typography>
                ))}
            </Box>

            {/* Density bar */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Box sx={{ width: 140, minWidth: 140, px: 1.5 }}>
                    <Typography sx={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Day density
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, hourlyDensity.length)}, minmax(0, 1fr))`, gap: "2px" }}>
                    {hourlyDensity.map((density, idx) => (
                        <Box
                            key={`density-${idx}`}
                            sx={{
                                height: 6,
                                borderRadius: 0.5,
                                bgcolor: density > 80
                                    ? "rgba(239,68,68,0.65)"
                                    : density > 45
                                        ? "rgba(245,158,11,0.65)"
                                        : "rgba(16,185,129,0.5)",
                                opacity: density === 0 ? 0.2 : 1,
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Event day rows */}
            <Stack spacing={0.5}>
                {groups.map((group, gi) => (
                    <Box key={group.name} sx={{ display: "flex", alignItems: "stretch", minHeight: 44 }}>
                        {/* Day label */}
                        <Box
                            sx={{
                                width: 140,
                                minWidth: 140,
                                display: "flex",
                                alignItems: "center",
                                px: 1.5,
                                borderRight: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <Chip
                                label={group.name}
                                size="small"
                                sx={{
                                    bgcolor: group.name === "Unassigned"
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(123,97,255,0.12)",
                                    color: group.name === "Unassigned"
                                        ? "rgba(255,255,255,0.4)"
                                        : "rgba(123,97,255,0.9)",
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                    height: 24,
                                }}
                            />
                        </Box>

                        {/* Timeline area */}
                        <Box
                            sx={{
                                flex: 1,
                                position: "relative",
                                bgcolor: gi % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                                borderBottom: "1px solid rgba(255,255,255,0.04)",
                                minHeight: 40,
                            }}
                        >
                            {/* Hour grid lines */}
                            {visibleHourMarkers.map((hour) => (
                                <Box
                                    key={hour}
                                    sx={{
                                        position: "absolute",
                                        left: `${getPosition(hour * 60)}%`,
                                        top: 0,
                                        bottom: 0,
                                        width: "1px",
                                        bgcolor: "rgba(255,255,255,0.04)",
                                    }}
                                />
                            ))}

                            {/* Scene blocks */}
                            {group.scenes.map((scene, si) => {
                                const startMin = parseTimeToMinutes(scene.scheduled_start_time);
                                if (startMin === null) return null;
                                const duration = scene.scheduled_duration_minutes || 15;
                                const color = SCENE_COLORS[si % SCENE_COLORS.length];

                                return (
                                    <Tooltip
                                        key={scene.scene_id}
                                        title={
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{scene.scene_name}</Typography>
                                                <Typography sx={{ fontSize: "0.7rem" }}>
                                                    {scene.scheduled_start_time} – {minutesToTime(startMin + duration)} ({duration} min)
                                                </Typography>
                                                {scene.source && scene.source !== "none" && (
                                                    <Typography sx={{ fontSize: "0.65rem", opacity: 0.7, mt: 0.5 }}>
                                                        Source: {scene.source}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                    >
                                        <Box
                                            onClick={() => onSceneClick?.(scene.scene_id)}
                                            sx={{
                                                position: "absolute",
                                                left: `${getPosition(startMin)}%`,
                                                width: `${getWidth(duration)}%`,
                                                top: 4,
                                                bottom: 4,
                                                bgcolor: color,
                                                borderRadius: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                                px: 0.75,
                                                overflow: "hidden",
                                                cursor: onSceneClick ? "pointer" : "default",
                                                transition: "filter 0.15s",
                                                "&:hover": {
                                                    filter: "brightness(1.2)",
                                                },
                                                // Stacking: if scenes overlap, stack slightly
                                                zIndex: si,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: "0.65rem",
                                                    fontWeight: 600,
                                                    color: "white",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                {scene.scene_name}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    </Box>
                ))}
            </Stack>

            {/* Summary */}
            <Box sx={{ mt: 1.5, display: "flex", gap: 2, px: 1 }}>
                <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>
                    {scenes.filter((s) => s.scheduled_start_time).length} of {scenes.length} scenes scheduled
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>
                    {groups.filter((g) => g.name !== "Unassigned").length} event day{groups.filter((g) => g.name !== "Unassigned").length !== 1 ? "s" : ""}
                </Typography>
            </Box>
        </Box>
    );
};

export default VisualTimeline;
