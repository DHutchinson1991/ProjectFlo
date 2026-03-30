/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useContentBuilder } from "../../../context/ContentBuilderContext";
import { getEquipmentLabelForTrackName } from "@/features/content/films/utils/equipmentAssignments";
import { useMusic } from "@/features/content/music/hooks";
import { MusicType } from "@/features/content/music/types";
import type { ShotType } from "@/features/content/coverage/types";
import type { MomentFormData } from "@/features/content/moments/types";
import type { TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { isLogEnabled } from "@/shared/debug/log-flags";

export interface MomentEditorActivity {
    id: number;
    name: string;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    package_event_day_id?: number | null;
    event_day_template_id?: number | null;
    dayName?: string | null;
}

interface Params {
    moment: MomentFormData | null;
    open: boolean;
    allTracks: TimelineTrack[];
    sceneRecordingSetup?: {
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        camera_assignments?: Array<{ track_id: number }>;
    } | null;
    trackDefaults: Record<number, { subject_ids: number[]; shot_type: string; audio_enabled?: boolean }>;
    activity?: MomentEditorActivity | null;
    activitySubjects: any[];
    activityCrewSlots: any[];
    onUpsertRecordingSetup?: (momentId: number, data: {
        camera_track_ids?: number[];
        camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>;
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        graphics_title?: string | null;
    }) => Promise<void> | void;
    readOnly: boolean;
    isMusicTrack: boolean;
    sceneId: number | undefined;
    handleSave: () => void;
}

const arraysEqual = (left: number[], right: number[]) =>
    left.length === right.length && left.every((v, i) => v === right[i]);

export const shotTypes: ShotType[] = [
    "ESTABLISHING_SHOT", "WIDE_SHOT", "MEDIUM_SHOT", "TWO_SHOT",
    "CLOSE_UP", "EXTREME_CLOSE_UP", "DETAIL_SHOT", "REACTION_SHOT",
    "OVER_SHOULDER", "CUTAWAY", "INSERT_SHOT", "MASTER_SHOT",
];

export const formatShotLabel = (value: string) =>
    value.toLowerCase().split("_").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

/** Format "HH:MM" → "12:30 PM" */
export const fmtTime = (t: string | null | undefined) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export function useMomentEditorState({
    moment,
    open,
    allTracks,
    sceneRecordingSetup,
    trackDefaults,
    activity,
    activitySubjects,
    activityCrewSlots,
    onUpsertRecordingSetup,
    readOnly,
    isMusicTrack,
    sceneId,
    handleSave,
}: Params) {
    const shouldLog = isLogEnabled("moments");

    // ─── Recording setup state ───────────────────────────────────────────────
    const [selectedCameraTrackIds, setSelectedCameraTrackIds] = React.useState<number[]>([]);
    const [selectedAudioTrackIds, setSelectedAudioTrackIds] = React.useState<number[]>([]);
    const [cameraSubjectSelections, setCameraSubjectSelections] = React.useState<Record<number, number[]>>({});
    const [graphicsEnabled, setGraphicsEnabled] = React.useState(false);
    const [graphicsTitle, setGraphicsTitle] = React.useState("");
    const [cameraShotSelections, setCameraShotSelections] = React.useState<Record<number, ShotType | "">>({});
    const [isSavingSetup, setIsSavingSetup] = React.useState(false);
    const [isSetupDirty, setIsSetupDirty] = React.useState(false);

    // ─── Music state ─────────────────────────────────────────────────────────
    const [sceneMusicEnabled, setSceneMusicEnabled] = React.useState(false);
    const [momentMusicEnabled, setMomentMusicEnabled] = React.useState(false);
    const [sceneMusicForm, setSceneMusicForm] = React.useState({
        music_name: "", artist: "", music_type: MusicType.MODERN,
    });
    const [momentMusicForm, setMomentMusicForm] = React.useState({
        music_name: "", artist: "", music_type: MusicType.MODERN,
    });
    const [musicError, setMusicError] = React.useState<string | null>(null);
    const [isSavingMusic, setIsSavingMusic] = React.useState(false);

    const prevMomentIdRef = React.useRef<number | undefined>(undefined);
    const prevOpenRef = React.useRef<boolean>(false);

    const { equipmentAssignmentsBySlot } = useContentBuilder();
    const {
        sceneMusic, momentMusic, isLoading: isMusicLoading,
        loadSceneMusic, loadMomentMusic,
        createSceneMusic, updateSceneMusic, removeSceneMusic,
        createMomentMusic, updateMomentMusic, removeMomentMusic,
    } = useMusic();

    // ─── Derived subjects / crew from activity ────────────────────────────────
    const inheritedSubjects = React.useMemo(() => {
        if (!activity) return [];
        const eventDayId = activity.event_day_template_id ?? activity.package_event_day_id;
        return activitySubjects.filter((s: any) => {
            if (s.package_activity_id === activity.id) return true;
            if (s.activity_assignments?.some((a: any) => a.package_activity_id === activity.id)) return true;
            const noAssign = !s.package_activity_id && (!s.activity_assignments || s.activity_assignments.length === 0);
            return noAssign && s.event_day_template_id === eventDayId;
        });
    }, [activitySubjects, activity]);

    const inheritedCrew = React.useMemo(() => {
        if (!activity) return [];
        const eventDayId = activity.event_day_template_id ?? activity.package_event_day_id;
        const matched = activityCrewSlots.filter((o: any) => {
            if (o.package_activity_id === activity.id) return true;
            if (o.activity_assignments?.some((a: any) => a.package_activity_id === activity.id)) return true;
            const noAssign = !o.package_activity_id && (!o.activity_assignments || o.activity_assignments.length === 0);
            return noAssign && o.event_day_template_id === eventDayId;
        });
        const seen = new Map<number, any>();
        matched.forEach((o: any) => {
            const id = o.crew_id ?? o.id;
            if (!seen.has(id)) seen.set(id, o);
        });
        return Array.from(seen.values());
    }, [activityCrewSlots, activity]);

    // ─── Track lists ──────────────────────────────────────────────────────────
    const normalizeTrackType = (v?: string | null) => (v || "").toLowerCase();
    const videoTracks = React.useMemo(
        () => allTracks.filter(t => normalizeTrackType(t.track_type) === "video"),
        [allTracks],
    );
    const audioTracks = React.useMemo(
        () => allTracks.filter(t => normalizeTrackType(t.track_type) === "audio"),
        [allTracks],
    );
    const graphicsTracks = React.useMemo(
        () => allTracks.filter(t => normalizeTrackType(t.track_type) === "graphics"),
        [allTracks],
    );

    const fallbackSetup = (moment as any)?.recording_setup || sceneRecordingSetup;

    // ─── Recording setup sync effect ──────────────────────────────────────────
    React.useEffect(() => {
        if (!moment || !open) {
            prevOpenRef.current = open;
            return;
        }
        const momentId = moment.id;
        const justOpened = open && !prevOpenRef.current;
        const momentChanged = momentId !== prevMomentIdRef.current;
        if (!justOpened && !momentChanged && isSetupDirty) {
            prevOpenRef.current = open;
            prevMomentIdRef.current = momentId;
            return;
        }
        const cameraIds: number[] = fallbackSetup?.camera_assignments?.map((a: any) => a.track_id)
            || videoTracks.map(t => t.id);
        const audioIds: number[] = fallbackSetup?.audio_track_ids || audioTracks.map(t => t.id);
        const graphicsDefault = fallbackSetup ? !!fallbackSetup?.graphics_enabled : false;
        const graphicsTitleDefault = typeof (fallbackSetup as any)?.graphics_title === "string"
            ? (fallbackSetup as any).graphics_title : "";
        const assignmentLookup = new Map<number, number[]>(
            (fallbackSetup?.camera_assignments || []).map((a: any) => [a.track_id, (a.subject_ids || []) as number[]]),
        );
        const shotLookup = new Map(
            (fallbackSetup?.camera_assignments || []).map((a: any) => [a.track_id, a.shot_type || ""]),
        );
        if (Object.keys(trackDefaults).length > 0) {
            [...videoTracks, ...audioTracks].forEach(track => {
                const def = trackDefaults[track.id];
                if (!def) return;
                if (!assignmentLookup.has(track.id) && def.subject_ids?.length) {
                    assignmentLookup.set(track.id, def.subject_ids as number[]);
                }
                if (!shotLookup.has(track.id) && def.shot_type) {
                    shotLookup.set(track.id, def.shot_type);
                }
            });
        }
        setSelectedCameraTrackIds(prev => (arraysEqual(prev, cameraIds) ? prev : cameraIds));
        setSelectedAudioTrackIds(prev => (arraysEqual(prev, audioIds) ? prev : audioIds));
        setGraphicsEnabled(prev => (prev === graphicsDefault ? prev : graphicsDefault));
        setGraphicsTitle(prev => (prev === graphicsTitleDefault ? prev : graphicsTitleDefault));
        setCameraSubjectSelections(prev => {
            const next = { ...prev };
            Array.from(new Set([...cameraIds, ...audioIds])).forEach(trackId => {
                if (!next[trackId]) {
                    next[trackId] = assignmentLookup.get(trackId) || [];
                } else if (assignmentLookup.has(trackId)) {
                    next[trackId] = assignmentLookup.get(trackId) || [];
                }
            });
            return next;
        });
        setCameraShotSelections(prev => {
            const next: Record<number, ShotType | ""> = { ...prev };
            cameraIds.forEach(trackId => {
                if (!next[trackId]) {
                    next[trackId] = (shotLookup.get(trackId) as ShotType) || "";
                } else if (shotLookup.has(trackId)) {
                    next[trackId] = (shotLookup.get(trackId) as ShotType) || "";
                }
            });
            return next;
        });
        setIsSetupDirty(false);
        prevOpenRef.current = open;
        prevMomentIdRef.current = momentId;
    }, [moment, open, fallbackSetup, videoTracks, audioTracks, isSetupDirty, trackDefaults]);

    // ─── Music load effect ────────────────────────────────────────────────────
    React.useEffect(() => {
        if (!moment || !open || !isMusicTrack) {
            setMusicError(null);
            return;
        }
        let isActive = true;
        const loadMusic = async () => {
            setMusicError(null);
            if (sceneId) {
                try {
                    const loaded = await loadSceneMusic(sceneId);
                    if (!isActive) return;
                    setSceneMusicEnabled(!!loaded);
                    setSceneMusicForm({
                        music_name: loaded?.music_name || "",
                        artist: loaded?.artist || "",
                        music_type: (loaded?.music_type as MusicType) || MusicType.MODERN,
                    });
                } catch {
                    if (!isActive) return;
                    setSceneMusicEnabled(false);
                }
            }
            try {
                const loaded = await loadMomentMusic(moment.id as number);
                if (!isActive) return;
                const overrides = (loaded as any)?.overrides_scene_music ?? false;
                setMomentMusicEnabled(!!loaded && overrides);
                setMomentMusicForm({
                    music_name: loaded?.music_name || "",
                    artist: loaded?.artist || "",
                    music_type: (loaded?.music_type as MusicType) || MusicType.MODERN,
                });
            } catch {
                if (!isActive) return;
                setMomentMusicEnabled(false);
            }
        };
        loadMusic();
        return () => { isActive = false; };
    }, [moment, open, isMusicTrack, sceneId, loadSceneMusic, loadMomentMusic]);

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const getTrackEquipmentLabel = (trackName: string, trackType?: string) => {
        const normalized = trackType?.toLowerCase();
        if (normalized !== "video" && normalized !== "audio") return null;
        return getEquipmentLabelForTrackName(trackName, equipmentAssignmentsBySlot) || null;
    };

    const toggleIdInList = (list: number[], id: number) =>
        list.includes(id) ? list.filter(v => v !== id) : [...list, id];

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleSaveSceneMusic = async () => {
        if (!sceneId) return;
        setMusicError(null);
        if (!sceneMusicEnabled) {
            if (sceneMusic) {
                setIsSavingMusic(true);
                try { await removeSceneMusic(sceneId); } finally { setIsSavingMusic(false); }
            }
            return;
        }
        if (!sceneMusicForm.music_name.trim()) { setMusicError("Scene music name is required."); return; }
        setIsSavingMusic(true);
        try {
            const payload = {
                music_name: sceneMusicForm.music_name.trim(),
                artist: sceneMusicForm.artist.trim() || undefined,
                music_type: sceneMusicForm.music_type,
            };
            if (sceneMusic) {
                await updateSceneMusic(sceneId, payload);
            } else {
                await createSceneMusic(sceneId, { film_scene_id: sceneId, ...payload });
            }
        } finally { setIsSavingMusic(false); }
    };

    const handleSaveMomentMusic = async () => {
        if (!moment?.id) return;
        setMusicError(null);
        if (!momentMusicEnabled) {
            if (momentMusic) {
                setIsSavingMusic(true);
                try { await removeMomentMusic(moment.id as number); } finally { setIsSavingMusic(false); }
            }
            return;
        }
        if (!momentMusicForm.music_name.trim()) { setMusicError("Moment music name is required."); return; }
        setIsSavingMusic(true);
        try {
            const payload = {
                music_name: momentMusicForm.music_name.trim(),
                artist: momentMusicForm.artist.trim() || undefined,
                music_type: momentMusicForm.music_type,
                overrides_scene_music: true,
            };
            if (momentMusic) {
                await updateMomentMusic(moment.id as number, payload);
            } else {
                await createMomentMusic(moment.id as number, { moment_id: moment.id as number, ...payload });
            }
        } finally { setIsSavingMusic(false); }
    };

    const handleSaveWithSetup = async () => {
        if (!moment) return;
        if (onUpsertRecordingSetup && !readOnly) {
            if (shouldLog) {
                if (typeof window !== "undefined") (window as any).__debugMomentId = moment.id;
                console.info("[MOMENT] Saving recording setup", {
                    momentId: moment.id,
                    camera_track_ids: selectedCameraTrackIds,
                    audio_track_ids: selectedAudioTrackIds,
                    graphics_enabled: graphicsEnabled,
                });
            }
            setIsSavingSetup(true);
            try {
                const subjectTrackIds = Array.from(new Set([...selectedCameraTrackIds, ...selectedAudioTrackIds]));
                await onUpsertRecordingSetup(moment.id as number, {
                    camera_track_ids: selectedCameraTrackIds,
                    camera_assignments: subjectTrackIds.map(trackId => ({
                        track_id: trackId,
                        subject_ids: cameraSubjectSelections[trackId] || [],
                        shot_type: cameraShotSelections[trackId] || undefined,
                    })),
                    audio_track_ids: selectedAudioTrackIds,
                    graphics_enabled: graphicsEnabled,
                    graphics_title: graphicsEnabled ? (graphicsTitle.trim() || null) : null,
                });
                if (shouldLog) console.info("[MOMENT] Recording setup saved", { momentId: moment.id });
            } finally { setIsSavingSetup(false); }
        }
        if (!isMusicTrack && (momentMusicEnabled || momentMusic)) {
            await handleSaveMomentMusic();
            if (momentMusicEnabled && !momentMusicForm.music_name.trim()) return;
        }
        handleSave();
    };

    return {
        // Recording setup
        selectedCameraTrackIds, setSelectedCameraTrackIds,
        selectedAudioTrackIds, setSelectedAudioTrackIds,
        cameraSubjectSelections, setCameraSubjectSelections,
        graphicsEnabled, setGraphicsEnabled,
        graphicsTitle, setGraphicsTitle,
        cameraShotSelections, setCameraShotSelections,
        isSavingSetup,
        isSetupDirty, setIsSetupDirty,
        // Music
        sceneMusicEnabled, setSceneMusicEnabled,
        momentMusicEnabled, setMomentMusicEnabled,
        sceneMusicForm, setSceneMusicForm,
        momentMusicForm, setMomentMusicForm,
        musicError,
        isSavingMusic,
        isMusicLoading,
        sceneMusic, momentMusic,
        // Derived
        inheritedSubjects,
        inheritedCrew,
        videoTracks,
        audioTracks,
        graphicsTracks,
        // Helpers
        getTrackEquipmentLabel,
        toggleIdInList,
        // Handlers
        handleSaveSceneMusic,
        handleSaveMomentMusic,
        handleSaveWithSetup,
    };
}
