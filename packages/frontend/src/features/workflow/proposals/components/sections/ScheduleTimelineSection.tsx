"use client";

import React, { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    Add as ZoomInIcon,
    Remove as ZoomOutIcon,
    Videocam as CameraIcon,
    VideocamOutlined as CameraOutlinedIcon,
    Mic as MicIcon,
    MicNone as MicOutlinedIcon,
    MusicNote as MusicIcon,
    MusicNoteOutlined as MusicOutlinedIcon,
    TouchApp as TouchAppIcon,
} from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContent, PublicProposalEventDay, PublicProposalFilm } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import { useReveal, revealSx } from "@/features/workflow/proposals/utils/portal/animations";

/* ── Assembly animations ── */

const slideInLeft = keyframes`
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
`;

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
const CAMERA_CATEGORIES = new Set(["CAMERA"]);
const AUDIO_CATEGORIES = new Set(["AUDIO"]);

/** Shot-type enum → short display abbrev */
const SHOT_TYPE_LABEL: Record<string, string> = {
    ESTABLISHING_SHOT: "ES",
    WIDE_SHOT: "WS",
    MEDIUM_SHOT: "MS",
    TWO_SHOT: "2S",
    CLOSE_UP: "CU",
    EXTREME_CLOSE_UP: "ECU",
    DETAIL_SHOT: "DS",
    REACTION_SHOT: "RS",
    OVER_SHOULDER: "OTS",
    CUTAWAY: "CA",
    INSERT_SHOT: "INS",
    MASTER_SHOT: "MSTR",
};

/** Full human-readable shot type names for summaries */
const SHOT_TYPE_FULL: Record<string, string> = {
    ES: "Establishing Shot", ESTABLISHING_SHOT: "Establishing Shot",
    WS: "Wide Shot", WIDE_SHOT: "Wide Shot",
    MS: "Medium Shot", MEDIUM_SHOT: "Medium Shot",
    "2S": "Two Shot", TWO_SHOT: "Two Shot",
    CU: "Close Up", CLOSE_UP: "Close Up",
    ECU: "Extreme Close Up", EXTREME_CLOSE_UP: "Extreme Close Up",
    DS: "Detail Shot", DETAIL_SHOT: "Detail Shot",
    RS: "Reaction Shot", REACTION_SHOT: "Reaction Shot",
    OTS: "Over the Shoulder", OVER_SHOULDER: "Over the Shoulder",
    CA: "Cutaway", CUTAWAY: "Cutaway",
    INS: "Insert Shot", INSERT_SHOT: "Insert Shot",
    MSTR: "Master Shot", MASTER_SHOT: "Master Shot",
};

/** Creative description for each shot type */
const SHOT_TYPE_VIBE: Record<string, string> = {
    ES: "setting the scene and establishing the atmosphere",
    ESTABLISHING_SHOT: "setting the scene and establishing the atmosphere",
    WS: "showing the full environment and sense of place",
    WIDE_SHOT: "showing the full environment and sense of place",
    MS: "balancing subject and surroundings",
    MEDIUM_SHOT: "balancing subject and surroundings",
    "2S": "framing the connection between two people",
    TWO_SHOT: "framing the connection between two people",
    CU: "revealing emotion and fine detail up close",
    CLOSE_UP: "revealing emotion and fine detail up close",
    ECU: "focusing on the most intimate details",
    EXTREME_CLOSE_UP: "focusing on the most intimate details",
    DS: "highlighting meaningful details and textures",
    DETAIL_SHOT: "highlighting meaningful details and textures",
    RS: "catching authentic reactions and emotions",
    REACTION_SHOT: "catching authentic reactions and emotions",
    OTS: "drawing the viewer into the moment",
    OVER_SHOULDER: "drawing the viewer into the moment",
    CA: "adding visual variety and context",
    CUTAWAY: "adding visual variety and context",
    INS: "emphasising a key visual element",
    INSERT_SHOT: "emphasising a key visual element",
    MSTR: "covering the entire scene from start to finish",
    MASTER_SHOT: "covering the entire scene from start to finish",
};

/** Scene mode → creative label */
const SCENE_MODE_LABEL: Record<string, string> = {
    MOMENTS: "filmed in real-time as it unfolds",
    MONTAGE: "edited highlights set to music",
};

/** Per-moment camera setup for stacked viewfinder cards */
interface MomentSetup {
    momentName: string;
    momentIndex: number;
    shotType: string | null;     // abbreviated label (WS, CU, etc.)
    subjects: string[];          // subject names for this specific moment
}

interface EquipmentDetail {
    type: "camera" | "mic" | "music";
    itemName: string | null;    // physical equipment model (Sony A7S III)
    equipmentType: string | null; // equipment type enum (LAVALIER, MIRRORLESS, etc.)
    trackName: string;          // film track name (Camera 1)
    manned: boolean;
    operatorName: string | null;
    roleName: string | null;
    shotTypes: string[];        // abbreviated shot types for this activity's scene
    subjects: string[];         // subject names this equipment films in this scene
    /** Per-moment setups, deduplicated (consecutive same shot+subjects collapsed). Only for cameras. */
    momentSetups: MomentSetup[];
    /** Audio subject names (from camera_assignments with track_type audio) */
    audioSubjects: string[];
    /** Music track names (for music type) */
    musicTrackNames: string[];
    /** Film name this equipment belongs to */
    filmName: string | null;
    /** Film type (Highlight, Documentary, etc.) */
    filmType: string | null;
    /** Matched scene name within the film */
    sceneName: string | null;
    /** Scene mode: MOMENTS (realtime) or MONTAGE */
    sceneMode: string | null;
}

/**
 * Build equipment details for a given activity from film instance tracks.
 * Uses instance_tracks as the source of truth (same as the film section),
 * then enriches each track with equipment names + operator info from crew slots.
 */
function getEquipmentDetailsForActivity(
    activityId: number,
    eventDays: PublicProposalEventDay[],
    films: PublicProposalFilm[],
): EquipmentDetail[] {
    const activity = eventDays.flatMap((d) => d.activities).find((a) => a.id === activityId);
    if (!activity) return [];

    const actDay = eventDays.find((d) => d.activities.some((a) => a.id === activityId));
    const crewSlots = actDay?.day_crew_slots ?? [];

    // ── Collect all active instance tracks across films ──
    const items: EquipmentDetail[] = [];

    for (const film of films) {
        const tracks = (film.instance_tracks ?? []).filter((t) => t.is_active && t.type !== "GRAPHICS");
        if (tracks.length === 0) continue;

        // Subject name lookup from instance_subjects (fallback for subject_ids)
        const subjectMap = new Map<number, string>();
        for (const s of film.instance_subjects ?? []) subjectMap.set(s.id, s.name);

        // Find matching scene by name (activity name = scene name in the film)
        const matchedScene = (film.instance_scenes ?? []).find(
            (s) => s.name.toLowerCase().trim() === activity.name.toLowerCase().trim(),
        );

        // Build per-track shot/subject info from the matched scene's camera assignments
        const perTrackShots = new Map<number, Set<string>>();
        const perTrackSubjects = new Map<number, Set<string>>();
        // Per-moment setups for camera tracks (for stacked viewfinder cards)
        const perTrackMomentSetups = new Map<number, MomentSetup[]>();
        if (matchedScene) {
            const moments = matchedScene.moments ?? [];
            for (let mi = 0; mi < moments.length; mi++) {
                const moment = moments[mi];
                for (const ca of moment.recording_setup?.camera_assignments ?? []) {
                    const shotLabel = ca.shot_type ? (SHOT_TYPE_LABEL[ca.shot_type] || ca.shot_type) : null;
                    if (shotLabel) {
                        const set = perTrackShots.get(ca.track_id) ?? new Set();
                        set.add(shotLabel);
                        perTrackShots.set(ca.track_id, set);
                    }
                    // Use pre-resolved subject_names (backend enriched), fall back to subject_ids
                    const names: string[] = (ca as any).subject_names ?? [];
                    const resolvedNames: string[] = [];
                    if (names.length > 0) {
                        const set = perTrackSubjects.get(ca.track_id) ?? new Set();
                        for (const n of names) { set.add(n); resolvedNames.push(n); }
                        perTrackSubjects.set(ca.track_id, set);
                    } else {
                        for (const sid of ca.subject_ids ?? []) {
                            const name = subjectMap.get(sid);
                            if (name) {
                                const set = perTrackSubjects.get(ca.track_id) ?? new Set();
                                set.add(name);
                                perTrackSubjects.set(ca.track_id, set);
                                resolvedNames.push(name);
                            }
                        }
                    }
                    // Collect per-moment setup for this track
                    const setups = perTrackMomentSetups.get(ca.track_id) ?? [];
                    setups.push({
                        momentName: moment.name,
                        momentIndex: mi,
                        shotType: shotLabel,
                        subjects: resolvedNames,
                    });
                    perTrackMomentSetups.set(ca.track_id, setups);
                }
            }
        }

        // Build operator lookup from crew slots assigned to this activity
        const slotOperators: { crewId: number | null; operatorName: string | null; roleName: string | null; cameraEquip: { name: string; eqType: string | null }[]; micEquip: { name: string; eqType: string | null }[] }[] = [];
        const hasAnyAssignments = crewSlots.some((s) => (s.activity_assignments?.length ?? 0) > 0);
        for (const slot of crewSlots) {
            const assigned = slot.activity_assignments?.some((a) => a.project_activity_id === activityId);
            if (hasAnyAssignments && !assigned) continue;
            const contact = slot.crew?.contact;
            const opName = contact ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") || null : null;
            const rName = slot.job_role?.display_name || slot.job_role?.name || null;
            const cameraEquip: { name: string; eqType: string | null }[] = [];
            const micEquip: { name: string; eqType: string | null }[] = [];
            for (const eq of slot.equipment) {
                const cat = eq.equipment.category;
                const eqType = (eq.equipment as any).type ?? null;
                if (CAMERA_CATEGORIES.has(cat)) cameraEquip.push({ name: eq.equipment.item_name, eqType });
                else if (AUDIO_CATEGORIES.has(cat)) micEquip.push({ name: eq.equipment.item_name, eqType });
            }
            slotOperators.push({ crewId: slot.crew_id, operatorName: opName, roleName: rName, cameraEquip, micEquip });
        }

        // Build flat equipment pools for round-robin matching to tracks
        const allCameraEquipment: { name: string; eqType: string | null; operatorName: string | null; roleName: string | null }[] = [];
        const allMicEquipment: { name: string; eqType: string | null; operatorName: string | null; roleName: string | null }[] = [];
        for (const so of slotOperators) {
            for (const e of so.cameraEquip) allCameraEquipment.push({ name: e.name, eqType: e.eqType, operatorName: so.operatorName, roleName: so.roleName });
            for (const e of so.micEquip) allMicEquipment.push({ name: e.name, eqType: e.eqType, operatorName: so.operatorName, roleName: so.roleName });
        }

        let cameraIdx = 0;
        let micIdx = 0;
        let musicIdx = 0;

        for (const track of tracks) {
            const type: "camera" | "mic" | "music" =
                track.type === "AUDIO" ? "mic" :
                track.type === "MUSIC" ? "music" : "camera";

            // Match equipment by round-robin from the pool (music tracks have no physical equipment)
            const pool = type === "mic" ? allMicEquipment : type === "camera" ? allCameraEquipment : [];
            const idx = type === "mic" ? micIdx++ : type === "camera" ? cameraIdx++ : musicIdx++;
            const matched = idx < pool.length ? pool[idx] : null;

            // Operator: prefer track's own crew, then matched equipment's crew slot, then any crew slot with matching crew_id
            const trackContact = track.crew?.contact;
            const trackOperator = trackContact ? [trackContact.first_name, trackContact.last_name].filter(Boolean).join(" ") || null : null;

            let operatorName = trackOperator;
            let roleName: string | null = null;

            if (!operatorName && track.crew_id) {
                // Track has crew_id but crew relation didn't load — find from crew slots
                const matchingSlot = slotOperators.find((s) => s.crewId === track.crew_id);
                if (matchingSlot) {
                    operatorName = matchingSlot.operatorName;
                    roleName = matchingSlot.roleName;
                }
            }
            if (!operatorName && matched) {
                operatorName = matched.operatorName;
                roleName = matched.roleName;
            }

            // Deduplicate consecutive moment setups with same shot + subjects
            const rawSetups = perTrackMomentSetups.get(track.id) ?? [];
            const deduped: MomentSetup[] = [];
            for (const setup of rawSetups) {
                const prev = deduped[deduped.length - 1];
                const sameShot = prev && prev.shotType === setup.shotType;
                const sameSubjects = prev && prev.subjects.length === setup.subjects.length
                    && prev.subjects.every((s, i) => s === setup.subjects[i]);
                if (!(sameShot && sameSubjects)) {
                    deduped.push(setup);
                }
            }

            // Audio subjects: from moment recording_setup audio_track_ids
            const audioSubjects: string[] = [];
            if (type === "mic" && matchedScene) {
                for (const moment of matchedScene.moments ?? []) {
                    const ca = moment.recording_setup?.camera_assignments?.find(a => a.track_id === track.id);
                    if (ca) {
                        const names: string[] = (ca as any).subject_names ?? [];
                        if (names.length > 0) {
                            for (const n of names) { if (!audioSubjects.includes(n)) audioSubjects.push(n); }
                        } else {
                            for (const sid of ca.subject_ids ?? []) {
                                const name = subjectMap.get(sid);
                                if (name && !audioSubjects.includes(name)) audioSubjects.push(name);
                            }
                        }
                    }
                }
            }

            items.push({
                type,
                itemName: matched?.name ?? null,
                equipmentType: matched?.eqType ?? null,
                trackName: track.name,
                manned: !track.is_unmanned,
                operatorName,
                roleName,
                shotTypes: [...(perTrackShots.get(track.id) ?? [])],
                subjects: [...(perTrackSubjects.get(track.id) ?? [])],
                momentSetups: deduped,
                audioSubjects,
                musicTrackNames: type === "music" ? [track.name] : [],
                filmName: film.film?.name ?? null,
                filmType: film.film?.film_type ?? null,
                sceneName: matchedScene?.name ?? null,
                sceneMode: (matchedScene as any)?.mode ?? null,
            });
        }
    }

    // Fallback if no films/tracks: use crew-slot equipment directly
    if (items.length === 0) {
        const activitySubjects = (activity.subject_assignments ?? []).map(
            (sa) => sa.project_day_subject.real_name || sa.project_day_subject.name,
        );
        const hasAnyAssignments = crewSlots.some((s) => (s.activity_assignments?.length ?? 0) > 0);
        for (const slot of crewSlots) {
            const assigned = slot.activity_assignments?.some((a) => a.project_activity_id === activityId);
            if (hasAnyAssignments && !assigned) continue;
            const contact = slot.crew?.contact;
            const operatorName = contact ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") || null : null;
            const roleName = slot.job_role?.display_name || slot.job_role?.name || null;
            for (const eq of slot.equipment) {
                const name = eq.equipment.item_name;
                const cat = eq.equipment.category;
                let type: "camera" | "mic" | null = null;
                if (CAMERA_CATEGORIES.has(cat)) type = "camera";
                else if (AUDIO_CATEGORIES.has(cat)) type = "mic";
                if (type) {
                    items.push({ type, itemName: name, equipmentType: (eq.equipment as any).type ?? null, trackName: name, manned: slot.crew_id != null, operatorName, roleName, shotTypes: [], subjects: activitySubjects, momentSetups: [], audioSubjects: [], musicTrackNames: [], filmName: null, filmType: null, sceneName: null, sceneMode: null });
                }
            }
        }
    }

    return items;
}

interface ScheduleTimelineSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    eventDays: PublicProposalEventDay[];
    films: PublicProposalFilm[];
}

export default function ScheduleTimelineSection({ content, eventDays, films, colors, isDark, cardSx }: ScheduleTimelineSectionProps) {
    if (!isSectionVisible(content, "schedule")) return null;
    if (eventDays.length === 0 || !eventDays.some((d) => d.activities.length > 0)) return null;

    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { ref: revealRef, visible: sectionVisible } = useReveal({ threshold: 0.1 });
    const [zoom, setZoom] = useState<number | null>(null); // null = not yet auto-fitted
    const [clickedActivityId, setClickedActivityId] = useState<number | null>(null);
    const [selectedEquipmentIdx, setSelectedEquipmentIdx] = useState<number | null>(null);
    const activeActivityId = clickedActivityId;

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

    const equipmentItems = useMemo(() => {
        if (!selectedActivity) return [];
        const items = getEquipmentDetailsForActivity(selectedActivity.id, eventDays, films);
        // Sort: cameras first (by track number), then audio, then music
        const typeOrder: Record<string, number> = { camera: 0, mic: 1, music: 2 };
        items.sort((a, b) => {
            const ta = typeOrder[a.type] ?? 9;
            const tb = typeOrder[b.type] ?? 9;
            if (ta !== tb) return ta - tb;
            // Within same type, sort by track name naturally (Camera 1 < Camera 2)
            return a.trackName.localeCompare(b.trackName, undefined, { numeric: true });
        });
        return items;
    }, [selectedActivity, eventDays, films]);

    // Reset selected equipment when the selected activity changes (not on array ref)
    const selectedActivityId = selectedActivity?.id ?? null;
    useEffect(() => {
        setSelectedEquipmentIdx(equipmentItems.length > 0 ? 0 : null);
    }, [selectedActivityId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    /* ── Coverage stats for header ── */
    const earliestFormatted = formatHour(startMin);
    const latestFormatted = formatHour(endMin);

    return (
        <Box ref={revealRef}>
            <Box ref={containerRef} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, ...revealSx(sectionVisible, 0) }}>
                {/* ── Section header ── */}
                <Box sx={{ textAlign: "center", mb: 5 }}>
                    <Typography sx={{
                        fontSize: { xs: "2.2rem", md: "2.8rem" }, fontWeight: 300, color: colors.text,
                        lineHeight: 1.1, mb: 1.5, letterSpacing: "-0.02em",
                    }}>
                        {getSectionTitle(content, "schedule", "Your Timeline")}
                    </Typography>
                    <Typography sx={{
                        color: colors.accent, textTransform: "uppercase", letterSpacing: 3,
                        fontSize: "0.6rem", fontWeight: 700,
                    }}>
                        &amp; The Activities We&apos;re Covering
                    </Typography>
                </Box>

                {/* ── Tap prompt above timeline ── */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                    <TouchAppIcon sx={{ fontSize: 15, color: alpha(colors.muted, 0.5) }} />
                    <Typography sx={{
                        fontSize: "0.72rem", color: colors.muted, fontWeight: 400,
                        letterSpacing: "0.1px",
                    }}>
                        Tap an activity to explore the plan
                    </Typography>
                </Box>

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
                                        {activities.map((activity, aIdx) => {
                                            const s = parseTimeToMinutes(activity.start_time)!;
                                            const dur = activity.duration_minutes ?? (activity.end_time ? (parseTimeToMinutes(activity.end_time)! - s) : 30);
                                            const effectiveDur = Math.max(dur, 15);
                                            const x = (s - startMin) * pxPerMin;
                                            const w = effectiveDur * pxPerMin;
                                            const actColor = activityColorMap.get(activity.id) || BLOCK_COLORS[0];
                                            const isSelected = activity.id === activeActivityId;
                                            const assemblyAnim = sectionVisible ? `${aIdx % 2 === 0 ? slideInLeft : slideInRight} 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + aIdx * 0.08}s both` : "none";

                                            return (
                                                <Box
                                                    key={activity.id}
                                                    onClick={() => setClickedActivityId((prev) => prev === activity.id ? null : activity.id)}
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
                                                        transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                                                        animation: assemblyAnim,
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

                {/* ── Below timeline: detail strip ── */}
                {(() => {
                    const MANNED_COLOR = colors.accent;

                    const actColor = selectedActivity ? (activityColorMap.get(selectedActivity.id) || colors.accent) : null;

                    return (
                        <Box sx={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
                            width: "100%", mt: -0.5, position: "relative",
                        }}>
                            {/* Soft color glow shining down from the timeline */}
                            {actColor && (
                                <Box sx={{
                                    position: "absolute", top: -50, left: 0, right: 0,
                                    height: 220,
                                    background: `radial-gradient(ellipse 90% 80% at 50% 0%, ${alpha(actColor, 0.15)} 0%, ${alpha(actColor, 0.05)} 35%, transparent 70%)`,
                                    pointerEvents: "none",
                                    transition: "background 0.5s ease",
                                    filter: "blur(12px)",
                                    zIndex: 0,
                                }} />
                            )}

                            {/* Equipment icon row — clickable to show details */}
                            {selectedActivity && equipmentItems.length > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5, zIndex: 1 }}>
                                    {equipmentItems.map((item, i) => {
                                        const isActive = selectedEquipmentIdx === i;
                                        const iconColor = isActive ? (actColor || MANNED_COLOR) : alpha(colors.muted, 0.5);
                                        const Icon = item.manned
                                            ? (item.type === "camera" ? CameraIcon : item.type === "music" ? MusicIcon : MicIcon)
                                            : (item.type === "camera" ? CameraOutlinedIcon : item.type === "music" ? MusicOutlinedIcon : MicOutlinedIcon);
                                        return (
                                            <Box
                                                key={i}
                                                onClick={() => setSelectedEquipmentIdx(i)}
                                                sx={{
                                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25,
                                                    cursor: "pointer", px: 1.5, py: 0.75, borderRadius: 2,
                                                    bgcolor: isActive ? alpha(iconColor, 0.12) : "transparent",
                                                    border: `1px solid ${isActive ? alpha(iconColor, 0.3) : "transparent"}`,
                                                    transition: "all 0.25s ease",
                                                    "&:hover": { bgcolor: alpha(actColor || MANNED_COLOR, 0.08) },
                                                }}
                                            >
                                                <Icon sx={{ fontSize: 26, color: iconColor, transition: "color 0.25s ease" }} />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}

                            {/* ── Equipment summary description ── */}
                            {selectedActivity && (() => {
                                const sel = selectedEquipmentIdx != null ? equipmentItems[selectedEquipmentIdx] : null;
                                if (!sel) return null;

                                const fullShot = (s: string) => SHOT_TYPE_FULL[s] || s;
                                const shotVibe = (s: string) => SHOT_TYPE_VIBE[s] || null;
                                const modeLabel = sel.sceneMode ? (SCENE_MODE_LABEL[sel.sceneMode] || null) : null;
                                const subjectList = (names: string[]) => names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
                                const naturalList = (items: string[]) => items.length === 1 ? items[0] : items.length === 2 ? `${items[0]} and ${items[1]}` : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

                                // Duration helper
                                const dur = selectedActivity.duration_minutes;
                                const durStr = dur ? (dur >= 60 ? `${Math.floor(dur / 60)}-hour` : `${dur}-minute`) : null;

                                // Film label: prefer type + name, e.g. "your Wedding Highlight"
                                const filmLabel = sel.filmName
                                    ? (sel.filmType ? `your ${sel.filmName}` : `your ${sel.filmName}`)
                                    : null;

                                // Use the activity bar color for inline highlights
                                const hlColor = actColor || colors.accent;
                                const hl = (text: string) => <span style={{ color: hlColor, fontWeight: 500 }}>{text}</span>;
                                const soft = (text: string) => <span style={{ opacity: 0.6 }}>{text}</span>;

                                // Build two-part description: primary (who/what) + secondary (scene/film context)
                                let primary: React.ReactNode = null;
                                let secondary: React.ReactNode = null;

                                if (sel.type === "camera") {
                                    const subjects = sel.subjects.length > 0 ? subjectList(sel.subjects) : null;
                                    const shots = sel.shotTypes.length > 0 ? sel.shotTypes.map(fullShot) : [];
                                    const vibe = sel.shotTypes.length === 1
                                        ? shotVibe(sel.shotTypes[0])
                                        : sel.shotTypes.length > 1
                                            ? "moving between a range of perspectives"
                                            : null;

                                    if (sel.manned) {
                                        const who = sel.operatorName || "Your filmmaker";
                                        const role = sel.roleName ? <>, your {hl(sel.roleName)}</> : null;
                                        primary = <>
                                            {hl(who)}{role} will be on {hl(sel.trackName)}
                                            {sel.itemName ? <> {soft(`(${sel.itemName})`)}</> : null}
                                            {subjects && shots.length > 0 ? <>, filming {hl(subjects)} in {hl(naturalList(shots))}</> : null}
                                            {subjects && shots.length === 0 ? <>, filming {hl(subjects)}</> : null}
                                            {!subjects && shots.length > 0 ? <>, shooting {hl(naturalList(shots))}</> : null}
                                            {vibe ? <> — {vibe}</> : null}.
                                        </>;
                                    } else {
                                        primary = <>
                                            {hl(sel.trackName)} will be set in position
                                            {sel.itemName ? <> {soft(`(${sel.itemName})`)}</> : null}
                                            {subjects && shots.length > 0 ? <>, framing {hl(subjects)} in {hl(naturalList(shots))}</> : null}
                                            {subjects && shots.length === 0 ? <>, framing {hl(subjects)}</> : null}
                                            {!subjects && shots.length > 0 ? <>, locked on {hl(naturalList(shots))}</> : null}
                                            {vibe ? <> — {vibe}</> : null}.
                                        </>;
                                    }

                                    // Secondary: explain the reasoning — covering activity → for scene → for film
                                    if (sel.sceneName && filmLabel) {
                                        const modeReason = sel.sceneMode === "MONTAGE"
                                            ? <>to create the {hl(sel.sceneName)} scene {soft("(edited highlights set to music)")}</>
                                            : <>covering the {durStr ? `${durStr} ` : ""}{sel.sceneName} in full for the real-time {hl(sel.sceneName)} scene</>;
                                        secondary = <>This feeds into {hl(filmLabel)} — {modeReason}.</>;
                                    } else if (sel.sceneName) {
                                        const modeReason = sel.sceneMode === "MONTAGE"
                                            ? <>to create the {hl(sel.sceneName)} scene {soft("(edited highlights set to music)")}</>
                                            : <>covering the {durStr ? `${durStr} ` : ""}{sel.sceneName} in full for the real-time {hl(sel.sceneName)} scene</>;
                                        secondary = <>{modeReason}.</>;
                                    } else if (filmLabel) {
                                        secondary = <>This feeds into {hl(filmLabel)}.</>;
                                    }
                                } else if (sel.type === "mic") {
                                    const subjects = sel.audioSubjects.length > 0 ? sel.audioSubjects : sel.subjects;
                                    const who = sel.operatorName || null;
                                    const isWearable = sel.equipmentType ? ["LAVALIER", "LAPEL_MIC", "WIRELESS_MIC"].includes(sel.equipmentType) : false;
                                    const isPositional = sel.equipmentType ? ["SHOTGUN_MIC", "CONDENSER", "BOOM_MIC"].includes(sel.equipmentType) : false;
                                    const subjectStr = subjects.length > 0 ? subjectList(subjects) : null;
                                    const modelNote = sel.itemName ? <> {soft(`(${sel.itemName})`)}</> : null;

                                    if (who && subjectStr && isWearable) {
                                        // "Andy Galloway will fit Bride with a wireless mic (Rode Wireless GO II) — capturing every word clearly."
                                        primary = <>{hl(who)} will fit {hl(subjectStr)} with a wireless mic{modelNote} — capturing every word clearly.</>;
                                    } else if (who && subjectStr && isPositional) {
                                        // "Andy Galloway will position a mic (Rode NTG5) near Bride and Groom — picking up every detail."
                                        primary = <>{hl(who)} will position a mic{modelNote} near {hl(subjectStr)} — picking up every detail.</>;
                                    } else if (who && subjectStr) {
                                        primary = <>{hl(who)} will record {hl(subjectStr)} on {sel.trackName}{modelNote}.</>;
                                    } else if (subjectStr && isWearable) {
                                        primary = <>A wireless mic{modelNote} will be fitted to {hl(subjectStr)} — capturing every word clearly.</>;
                                    } else if (subjectStr && isPositional) {
                                        primary = <>A mic{modelNote} will be positioned near {hl(subjectStr)} — picking up every detail.</>;
                                    } else if (subjectStr) {
                                        primary = <>{sel.trackName}{modelNote} will be recording {hl(subjectStr)}.</>;
                                    } else if (who) {
                                        primary = <>{hl(who)} will handle audio on {sel.trackName}{modelNote}.</>;
                                    } else {
                                        primary = <>{sel.trackName}{modelNote} will be picking up audio.</>;
                                    }

                                    // Secondary: purpose tied to scene + film
                                    if (sel.sceneName && filmLabel) {
                                        const purpose = sel.sceneMode === "MONTAGE"
                                            ? <>Layering rich ambient sound for the {hl(sel.sceneName)} scene {soft("(edited highlights set to music)")}</>
                                            : <>For the {durStr ? `${durStr} ` : ""}real-time {hl(sel.sceneName)} scene in {hl(filmLabel)}</>;
                                        secondary = <>{purpose}.</>;
                                    } else if (sel.sceneName) {
                                        const purpose = sel.sceneMode === "MONTAGE"
                                            ? <>Layering rich ambient sound for the {hl(sel.sceneName)} scene {soft("(edited highlights set to music)")}</>
                                            : <>For the {durStr ? `${durStr} ` : ""}real-time {hl(sel.sceneName)} scene</>;
                                        secondary = <>{purpose}.</>;
                                    } else if (filmLabel) {
                                        secondary = <>For {hl(filmLabel)}.</>;
                                    }
                                } else if (sel.type === "music") {
                                    primary = <>
                                        {hl(sel.trackName)} will set the tone for
                                        {sel.sceneName ? <> the {durStr ? `${durStr} ` : ""}{hl(sel.sceneName)} scene</> : <> this scene</>}
                                        {modeLabel ? <> {soft(`(${modeLabel})`)}</> : null}.
                                    </>;
                                    if (filmLabel) {
                                        secondary = <>This feeds into {hl(filmLabel)}.</>;
                                    }
                                }

                                if (!primary) return null;

                                const baseSx = {
                                    fontSize: "0.74rem", color: colors.muted, fontWeight: 400,
                                    textAlign: "center" as const, lineHeight: 1.8, maxWidth: 460,
                                    letterSpacing: "0.15px", fontStyle: "italic" as const,
                                };

                                return (
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.6, zIndex: 1, mt: 1.5 }}>
                                        <Typography sx={baseSx}>
                                            {primary}
                                        </Typography>
                                        {secondary && (
                                            <Typography sx={{ ...baseSx, fontSize: "0.66rem", opacity: 0.6, mt: 0.25 }}>
                                                {secondary}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            })()}

                            {/* 3-column layout removed — text descriptions handle all context */}

                            {/* Zoom controls card */}
                            <Box sx={{
                                ...cardSx as any,
                                bgcolor: isDark ? alpha(colors.card, 0.35) : alpha(colors.card, 0.7),
                                display: "flex",
                                alignItems: "center",
                                gap: 0.25,
                                px: 1.5,
                                py: 0.8,
                                width: "auto",
                            }}>
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
            </Box>
    );
}