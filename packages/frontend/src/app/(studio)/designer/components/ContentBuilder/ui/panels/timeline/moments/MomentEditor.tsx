"use client";

import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
    Typography,
    Stack,
    IconButton,
    Divider,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Switch,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListItemText
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useMomentForm } from "@/hooks/content-builder/moments";
import { MomentEditorFields } from "./MomentEditorFields";
import { TimelineTrack } from "@/lib/types/timeline";
import { isLogEnabled } from "@/lib/debug/log-flags";
import { useMusic } from "@/hooks/music/useMusic";
import { MusicType, MUSIC_TYPE_LABELS } from "@/lib/types/domains/music";
import type { ShotType } from "@/types/coverage.types";
import { useContentBuilder } from "../../../../context/ContentBuilderContext";
import { getEquipmentLabelForTrackName } from "@/lib/utils/equipmentAssignments";

interface Moment {
    id?: number;
    name: string;
    duration: number;
    duration_seconds?: number;
    coverage?: {
        [trackName: string]: boolean | undefined;
    };
    [key: string]: any;
}

interface MomentEditorProps {
    open: boolean;
    anchorEl?: HTMLElement | null;
    moment: Moment | null;
    allTracks?: TimelineTrack[];
    sceneRecordingSetup?: {
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        camera_assignments?: Array<{ track_id: number }>;
    } | null;
    onClose: () => void;
    onSave: (moment: Moment) => void;
    onDelete?: (momentId?: number) => void;
    onClearRecordingSetup?: (momentId?: number) => void | Promise<void>;
    onUpsertRecordingSetup?: (momentId: number, data: { camera_track_ids?: number[]; camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>; audio_track_ids?: number[]; graphics_enabled?: boolean; graphics_title?: string | null }) => Promise<void> | void;
    readOnly?: boolean;
    mode?: "full" | "track";
    trackLabel?: string;
    trackKey?: string;
    onRemoveTrack?: (momentId?: number, trackKey?: string) => void;
    /** The activity linked to this moment's parent scene */
    activity?: {
        id: number;
        name: string;
        start_time?: string | null;
        end_time?: string | null;
        duration_minutes?: number | null;
        package_event_day_id?: number | null;
        event_day_template_id?: number | null;
        dayName?: string | null;
    } | null;
    /** All package subjects (will be filtered to activity-inherited) */
    activitySubjects?: any[];
    /** All package operators (will be filtered to activity-inherited) */
    activityOperators?: any[];
    /** Per-track defaults from the track icon click UI */
    trackDefaults?: Record<number, { subject_ids: number[]; shot_type: string; audio_enabled?: boolean }>;
}

const MomentEditor: React.FC<MomentEditorProps> = ({
    open,
    moment,
    allTracks = [],
    sceneRecordingSetup,
    onClose,
    onSave,
    onDelete,
    onClearRecordingSetup,
    onUpsertRecordingSetup,
    readOnly = false,
    mode = "full",
    trackLabel,
    trackKey,
    onRemoveTrack,
    activity,
    activitySubjects = [],
    activityOperators = [],
    trackDefaults = {},
}) => {
    // Use the custom hook for form logic
    const {
        editName,
        setEditName,
        editDuration,
        setEditDuration,
        errors,
        setErrors,
        isTrackMode,
        effectiveTrackKey,
        effectiveTrackLabel,
        trackIsAssigned,
        handleSave,
        handleDelete,
        handleRemoveTrackClick
    } = useMomentForm({
        moment,
        open,
        onClose,
        onSave,
        onDelete,
        trackLabel,
        trackKey,
        onRemoveTrack,
        mode
    });

    const [selectedCameraTrackIds, setSelectedCameraTrackIds] = React.useState<number[]>([]);
    const [selectedAudioTrackIds, setSelectedAudioTrackIds] = React.useState<number[]>([]);
    const [cameraSubjectSelections, setCameraSubjectSelections] = React.useState<Record<number, number[]>>({});
    const [graphicsEnabled, setGraphicsEnabled] = React.useState(false);
    const [graphicsTitle, setGraphicsTitle] = React.useState("");
    const [cameraShotSelections, setCameraShotSelections] = React.useState<Record<number, ShotType | "">>({});
    const [isSavingSetup, setIsSavingSetup] = React.useState(false);
    const [isSetupDirty, setIsSetupDirty] = React.useState(false);
    const [sceneMusicEnabled, setSceneMusicEnabled] = React.useState(false);
    const [momentMusicEnabled, setMomentMusicEnabled] = React.useState(false);
    const [sceneMusicForm, setSceneMusicForm] = React.useState({
        music_name: "",
        artist: "",
        music_type: MusicType.MODERN,
    });
    const [momentMusicForm, setMomentMusicForm] = React.useState({
        music_name: "",
        artist: "",
        music_type: MusicType.MODERN,
    });
    const [musicError, setMusicError] = React.useState<string | null>(null);
    const [isSavingMusic, setIsSavingMusic] = React.useState(false);
    const prevMomentIdRef = React.useRef<number | undefined>(undefined);
    const prevOpenRef = React.useRef<boolean>(false);

    const { equipmentAssignmentsBySlot } = useContentBuilder();

    // Derive subjects inherited from the linked activity
    const inheritedSubjects = React.useMemo(() => {
        if (!activity) return [];
        const eventDayId = activity.event_day_template_id ?? activity.package_event_day_id;
        return activitySubjects.filter((s: any) => {
            if (s.package_activity_id === activity.id) return true;
            if (s.activity_assignments?.some((a: any) => a.package_activity_id === activity.id)) return true;
            const hasNoAssignment = !s.package_activity_id && (!s.activity_assignments || s.activity_assignments.length === 0);
            if (hasNoAssignment && s.event_day_template_id === eventDayId) return true;
            return false;
        });
    }, [activitySubjects, activity]);

    // Derive crew inherited from the linked activity (deduplicated by template)
    const inheritedCrew = React.useMemo(() => {
        if (!activity) return [];
        const eventDayId = activity.event_day_template_id ?? activity.package_event_day_id;
        const matched = activityOperators.filter((o: any) => {
            if (o.package_activity_id === activity.id) return true;
            if (o.activity_assignments?.some((a: any) => a.package_activity_id === activity.id)) return true;
            const hasNoAssignment = !o.package_activity_id && (!o.activity_assignments || o.activity_assignments.length === 0);
            if (hasNoAssignment && o.event_day_template_id === eventDayId) return true;
            return false;
        });
        const seen = new Map<number, any>();
        matched.forEach((o: any) => {
            const crewId = o.contributor_id ?? o.id;
            if (!seen.has(crewId)) seen.set(crewId, o);
        });
        return Array.from(seen.values());
    }, [activityOperators, activity]);

    const normalizeTrackType = (value?: string | null) => (value || "").toLowerCase();
    // Show all film tracks — the tracks on the film are the authoritative list.
    // Activity-based count filtering was unreliable (missed unmanned/per-equipment cameras).
    const videoTracks = React.useMemo(
        () => allTracks.filter(track => normalizeTrackType(track.track_type) === "video"),
        [allTracks]
    );
    const audioTracks = React.useMemo(
        () => allTracks.filter(track => normalizeTrackType(track.track_type) === "audio"),
        [allTracks]
    );
    const graphicsTracks = React.useMemo(
        () => allTracks.filter(track => normalizeTrackType(track.track_type) === "graphics"),
        [allTracks]
    );

    const hasRecordingSetup = !!(moment as any)?.recording_setup || !!(moment as any)?.has_recording_setup;
    const fallbackSetup = (moment as any)?.recording_setup || sceneRecordingSetup;
    const sceneId = (moment as any)?.film_scene_id as number | undefined;

    const {
        sceneMusic,
        momentMusic,
        isLoading: isMusicLoading,
        loadSceneMusic,
        loadMomentMusic,
        createSceneMusic,
        updateSceneMusic,
        removeSceneMusic,
        createMomentMusic,
        updateMomentMusic,
        removeMomentMusic,
    } = useMusic();

    const arraysEqual = (left: number[], right: number[]) => (
        left.length === right.length && left.every((value, index) => value === right[index])
    );

    const shotTypes: ShotType[] = [
        "ESTABLISHING_SHOT",
        "WIDE_SHOT",
        "MEDIUM_SHOT",
        "TWO_SHOT",
        "CLOSE_UP",
        "EXTREME_CLOSE_UP",
        "DETAIL_SHOT",
        "REACTION_SHOT",
        "OVER_SHOULDER",
        "CUTAWAY",
        "INSERT_SHOT",
        "MASTER_SHOT",
    ];

    const formatShotLabel = (value: string) =>
        value
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

    const getTrackDisplayName = (trackName: string, trackType?: string) => {
        const normalized = trackType?.toLowerCase();
        const shouldShow = normalized === "video" || normalized === "audio";
        if (!shouldShow) return trackName;
        const equipmentLabel = getEquipmentLabelForTrackName(trackName, equipmentAssignmentsBySlot);
        return equipmentLabel ? `${trackName} · ${equipmentLabel}` : trackName;
    };

    const getTrackEquipmentLabel = (trackName: string, trackType?: string) => {
        const normalized = trackType?.toLowerCase();
        const shouldShow = normalized === "video" || normalized === "audio";
        if (!shouldShow) return null;
        return getEquipmentLabelForTrackName(trackName, equipmentAssignmentsBySlot) || null;
    };

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

        const cameraIds: number[] = fallbackSetup?.camera_assignments?.map((a: any) => a.track_id) || videoTracks.map((track) => track.id);
        const audioIds: number[] = fallbackSetup?.audio_track_ids || audioTracks.map((track) => track.id);
        const graphicsDefault = fallbackSetup ? !!fallbackSetup?.graphics_enabled : false;
        const graphicsTitleDefault = typeof (fallbackSetup as any)?.graphics_title === "string"
            ? (fallbackSetup as any).graphics_title
            : "";
        const assignmentLookup = new Map<number, number[]>(
            (fallbackSetup?.camera_assignments || []).map((assignment: any) => [
                assignment.track_id,
                (assignment.subject_ids || []) as number[],
            ])
        );
        const shotLookup = new Map(
            (fallbackSetup?.camera_assignments || []).map((assignment: any) => [assignment.track_id, assignment.shot_type || ""])
        );
        // Fill in trackDefaults for tracks not present in existing recording setup
        if (Object.keys(trackDefaults).length > 0) {
            [...videoTracks, ...audioTracks].forEach((track) => {
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
        setCameraSubjectSelections((prev) => {
            const next: Record<number, number[]> = { ...prev };
            const allTrackIds = Array.from(new Set([...cameraIds, ...audioIds]));
            allTrackIds.forEach((trackId) => {
                if (!next[trackId]) {
                    next[trackId] = assignmentLookup.get(trackId) || [];
                } else if (assignmentLookup.has(trackId)) {
                    next[trackId] = assignmentLookup.get(trackId) || [];
                }
            });
            return next;
        });
        setCameraShotSelections((prev) => {
            const next: Record<number, ShotType | ""> = { ...prev };
            cameraIds.forEach((trackId) => {
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

    const toggleIdInList = (list: number[], id: number) => (
        list.includes(id) ? list.filter(value => value !== id) : [...list, id]
    );

    // Helper: format "HH:MM" → "12:30 PM"
    const fmtTime = (t: string | null | undefined) => {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return t;
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const shouldLog = isLogEnabled("moments");
    const isMusicTrack = [effectiveTrackKey, effectiveTrackLabel]
        .filter(Boolean)
        .some((value) => value!.toString().toLowerCase().includes("music"));

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
                    const loadedScene = await loadSceneMusic(sceneId);
                    if (!isActive) return;
                    setSceneMusicEnabled(!!loadedScene);
                    setSceneMusicForm({
                        music_name: loadedScene?.music_name || "",
                        artist: loadedScene?.artist || "",
                        music_type: (loadedScene?.music_type as MusicType) || MusicType.MODERN,
                    });
                } catch {
                    if (!isActive) return;
                    setSceneMusicEnabled(false);
                }
            }

            try {
                const loadedMoment = await loadMomentMusic(moment.id as number);
                if (!isActive) return;
                const overrides = loadedMoment?.overrides_scene_music ?? false;
                setMomentMusicEnabled(!!loadedMoment && overrides);
                setMomentMusicForm({
                    music_name: loadedMoment?.music_name || "",
                    artist: loadedMoment?.artist || "",
                    music_type: (loadedMoment?.music_type as MusicType) || MusicType.MODERN,
                });
            } catch {
                if (!isActive) return;
                setMomentMusicEnabled(false);
            }
        };

        loadMusic();

        return () => {
            isActive = false;
        };
    }, [moment, open, isMusicTrack, sceneId, loadSceneMusic, loadMomentMusic]);

    const handleSaveSceneMusic = async () => {
        if (!sceneId) return;
        setMusicError(null);

        if (!sceneMusicEnabled) {
            if (sceneMusic) {
                setIsSavingMusic(true);
                try {
                    await removeSceneMusic(sceneId);
                } finally {
                    setIsSavingMusic(false);
                }
            }
            return;
        }

        if (!sceneMusicForm.music_name.trim()) {
            setMusicError("Scene music name is required.");
            return;
        }

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
        } finally {
            setIsSavingMusic(false);
        }
    };

    const handleSaveMomentMusic = async () => {
        if (!moment?.id) return;
        setMusicError(null);

        if (!momentMusicEnabled) {
            if (momentMusic) {
                setIsSavingMusic(true);
                try {
                    await removeMomentMusic(moment.id as number);
                } finally {
                    setIsSavingMusic(false);
                }
            }
            return;
        }

        if (!momentMusicForm.music_name.trim()) {
            setMusicError("Moment music name is required.");
            return;
        }

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
        } finally {
            setIsSavingMusic(false);
        }
    };

    const handleSaveWithSetup = async () => {
        if (!moment) return;

        if (onUpsertRecordingSetup && !readOnly) {
            if (shouldLog) {
                if (typeof window !== "undefined") {
                    (window as any).__debugMomentId = moment.id;
                }
                console.info("[MOMENT] Saving recording setup", {
                    momentId: moment.id,
                    camera_track_ids: selectedCameraTrackIds,
                    audio_track_ids: selectedAudioTrackIds,
                    graphics_enabled: graphicsEnabled,
                });
            }
            setIsSavingSetup(true);
            try {
                const subjectAssignmentTrackIds = Array.from(
                    new Set([...selectedCameraTrackIds, ...selectedAudioTrackIds])
                );
                await onUpsertRecordingSetup(moment.id as number, {
                    camera_track_ids: selectedCameraTrackIds,
                    camera_assignments: subjectAssignmentTrackIds.map((trackId) => ({
                        track_id: trackId,
                        subject_ids: cameraSubjectSelections[trackId] || [],
                        shot_type: cameraShotSelections[trackId] || undefined,
                    })),
                    audio_track_ids: selectedAudioTrackIds,
                    graphics_enabled: graphicsEnabled,
                    graphics_title: graphicsEnabled ? (graphicsTitle.trim() || null) : null,
                });
                if (shouldLog) {
                    console.info("[MOMENT] Recording setup saved", {
                        momentId: moment.id,
                    });
                }
            } finally {
                setIsSavingSetup(false);
            }
        }

        // Save moment music for non-music-track moments when music is toggled
        if (!isMusicTrack && (momentMusicEnabled || momentMusic)) {
            await handleSaveMomentMusic();
            // If there was a music validation error, stop here so user can fix it
            if (momentMusicEnabled && !momentMusicForm.music_name.trim()) {
                return;
            }
        }

        handleSave();
    };

    if (!moment) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: "#1a1a1a",
                    backgroundImage: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    p: 1,
                },
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                pb: 1
            }}>
                {isTrackMode ? "Track Assignment" : "Edit Moment"}
                <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            
            <DialogContent>
                {isTrackMode ? (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Moment
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.95rem' }}>
                                {editName || moment?.name || "Untitled Moment"}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Track
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                                {effectiveTrackLabel}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Duration
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {editDuration ? `${editDuration} seconds` : "Not set"}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Status
                            </Typography>
                            <Typography sx={{ color: trackIsAssigned ? '#4ECDC4' : '#FF6B6B', fontWeight: 600 }}>
                                {trackIsAssigned ? 'Included on this track' : 'Not assigned to this track'}
                            </Typography>
                        </Box>
                    </Stack>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: activity ? '1fr 260px' : '1fr', gap: 2.5, mt: 1 }}>
                        {/* ─── LEFT COLUMN: Basic Info + Recording Setup ─── */}
                        <Stack spacing={3}>
                        {/* Basic Info Section */}
                        <MomentEditorFields
                            name={editName}
                            duration={editDuration}
                            errors={errors}
                            readOnly={readOnly}
                            onNameChange={setEditName}
                            onDurationChange={setEditDuration}
                        />

                        {/* Recording Setup */}
                        <Stack spacing={2}>
                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
                                Recording Setup
                            </Typography>
                            <Stack spacing={2}>
                                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                                <Box>
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                                        Video Tracks
                                    </Typography>
                                    {videoTracks.length === 0 ? (
                                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                                            No video tracks available.
                                        </Typography>
                                    ) : (
                                        <FormGroup>
                                            {videoTracks.map(track => (
                                                <Box
                                                    key={`moment-video-${track.id}`}
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: "auto 180px 1fr",
                                                        gap: 1,
                                                        alignItems: "center",
                                                        mb: 1,
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={selectedCameraTrackIds.includes(track.id)}
                                                                onChange={() => {
                                                                    setIsSetupDirty(true);
                                                                    setSelectedCameraTrackIds(prev => toggleIdInList(prev, track.id));
                                                                }}
                                                                sx={{ color: "rgba(255,255,255,0.5)", '&.Mui-checked': { color: '#7B61FF' } }}
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                                                                    {track.name}
                                                                </Typography>
                                                                {getTrackEquipmentLabel(track.name, track.track_type) && (
                                                                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                                                                        {getTrackEquipmentLabel(track.name, track.track_type)}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <FormControl size="small" fullWidth>
                                                        <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>Shot size</InputLabel>
                                                        <Select
                                                            label="Shot size"
                                                            value={cameraShotSelections[track.id] || ""}
                                                            onChange={(e) => {
                                                                setIsSetupDirty(true);
                                                                setCameraShotSelections((prev) => ({
                                                                    ...prev,
                                                                    [track.id]: e.target.value as ShotType | "",
                                                                }));
                                                            }}
                                                            displayEmpty
                                                            renderValue={(selected) => selected ? formatShotLabel(selected as string) : "Shot size"}
                                                            disabled={!selectedCameraTrackIds.includes(track.id)}
                                                            sx={{ color: "white" }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>Not set</em>
                                                            </MenuItem>
                                                            {shotTypes.map((type) => (
                                                                <MenuItem key={`shot-${track.id}-${type}`} value={type}>
                                                                    {formatShotLabel(type)}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl size="small" fullWidth>
                                                        <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>Subjects</InputLabel>
                                                        <Select
                                                            multiple
                                                            label="Subjects"
                                                            value={cameraSubjectSelections[track.id] || []}
                                                            onChange={(e) => {
                                                                setIsSetupDirty(true);
                                                                const value = e.target.value as number[];
                                                                setCameraSubjectSelections((prev) => ({
                                                                    ...prev,
                                                                    [track.id]: value,
                                                                }));
                                                            }}
                                                            renderValue={(selected) => {
                                                                const names = (selected as number[])
                                                                    .map((id) => inheritedSubjects.find((s: any) => s.id === id)?.name)
                                                                    .filter(Boolean);
                                                                return names.length ? names.join(", ") : "Subjects";
                                                            }}
                                                            disabled={!selectedCameraTrackIds.includes(track.id) || inheritedSubjects.length === 0}
                                                            sx={{ color: "white" }}
                                                        >
                                                            {inheritedSubjects.map((s: any) => (
                                                                <MenuItem key={`moment-subject-${track.id}-${s.id}`} value={s.id}>
                                                                    <Checkbox checked={(cameraSubjectSelections[track.id] || []).includes(s.id)} />
                                                                    <ListItemText primary={s.name} />
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            ))}
                                        </FormGroup>
                                    )}
                                </Box>

                                <Box>
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                                        Audio Tracks
                                    </Typography>
                                    {audioTracks.length === 0 ? (
                                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                                            No audio tracks available.
                                        </Typography>
                                    ) : (
                                        <FormGroup>
                                            {audioTracks.map(track => (
                                                <Box
                                                    key={`moment-audio-${track.id}`}
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: "auto 1fr",
                                                        gap: 1,
                                                        alignItems: "center",
                                                        mb: 1,
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={selectedAudioTrackIds.includes(track.id)}
                                                                onChange={() => {
                                                                    setIsSetupDirty(true);
                                                                    setSelectedAudioTrackIds(prev => toggleIdInList(prev, track.id));
                                                                }}
                                                                sx={{ color: "rgba(255,255,255,0.5)", '&.Mui-checked': { color: '#7B61FF' } }}
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                                                                    {track.name}
                                                                </Typography>
                                                                {getTrackEquipmentLabel(track.name, track.track_type) && (
                                                                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                                                                        {getTrackEquipmentLabel(track.name, track.track_type)}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <FormControl size="small" fullWidth>
                                                        <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>Subjects</InputLabel>
                                                        <Select
                                                            multiple
                                                            label="Subjects"
                                                            value={cameraSubjectSelections[track.id] || []}
                                                            onChange={(e) => {
                                                                setIsSetupDirty(true);
                                                                const value = e.target.value as number[];
                                                                setCameraSubjectSelections((prev) => ({
                                                                    ...prev,
                                                                    [track.id]: value,
                                                                }));
                                                            }}
                                                            renderValue={(selected) => {
                                                                const names = (selected as number[])
                                                                    .map((id) => inheritedSubjects.find((s: any) => s.id === id)?.name)
                                                                    .filter(Boolean);
                                                                return names.length ? names.join(", ") : "Subjects";
                                                            }}
                                                            disabled={!selectedAudioTrackIds.includes(track.id) || inheritedSubjects.length === 0}
                                                            sx={{ color: "white" }}
                                                        >
                                                            {inheritedSubjects.map((s: any) => (
                                                                <MenuItem key={`moment-audio-subject-${track.id}-${s.id}`} value={s.id}>
                                                                    <Checkbox checked={(cameraSubjectSelections[track.id] || []).includes(s.id)} />
                                                                    <ListItemText primary={s.name} />
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            ))}
                                        </FormGroup>
                                    )}
                                </Box>

                                <Box>
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                                        Graphics
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Switch
                                            checked={graphicsEnabled}
                                            onChange={(e) => {
                                                setIsSetupDirty(true);
                                                setGraphicsEnabled(e.target.checked);
                                            }}
                                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B61FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B61FF' } }}
                                        />
                                        <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                                            Enable graphics overlays
                                        </Typography>
                                        {graphicsTracks.length === 0 && (
                                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                                (No graphics track configured)
                                            </Typography>
                                        )}
                                    </Stack>
                                    {graphicsEnabled && (
                                        <TextField
                                            size="small"
                                            label="Graphics title"
                                            value={graphicsTitle}
                                            onChange={(e) => {
                                                setIsSetupDirty(true);
                                                setGraphicsTitle(e.target.value);
                                            }}
                                            placeholder="Lower third, title card, logo, etc."
                                            fullWidth
                                            sx={{ mt: 1 }}
                                            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}
                                            InputProps={{ sx: { color: "white" } }}
                                        />
                                    )}
                                </Box>
                            </Stack>
                        </Stack>

                        {/* ─── Moment Music (simple) – visible on all non-music-track moments ─── */}
                        {!isMusicTrack && (
                            <Stack spacing={1.5}>
                                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
                                    Music
                                </Typography>
                                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Switch
                                        checked={momentMusicEnabled}
                                        onChange={(e) => setMomentMusicEnabled(e.target.checked)}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B61FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B61FF' } }}
                                    />
                                    <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                                        Add moment music
                                    </Typography>
                                </Stack>
                                {momentMusicEnabled && (
                                    <TextField
                                        size="small"
                                        label="Music name"
                                        value={momentMusicForm.music_name}
                                        onChange={(e) => setMomentMusicForm(prev => ({ ...prev, music_name: e.target.value }))}
                                        fullWidth
                                        placeholder="Song or track name"
                                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                                        sx={{ input: { color: 'white' } }}
                                    />
                                )}
                                {musicError && momentMusicEnabled && (
                                    <Typography sx={{ color: "#FF6B6B", fontSize: "0.75rem" }}>{musicError}</Typography>
                                )}
                            </Stack>
                        )}

                        {isMusicTrack && (
                            <Stack spacing={2}>
                                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
                                    Music
                                </Typography>
                                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Switch
                                            checked={sceneMusicEnabled}
                                            onChange={(e) => setSceneMusicEnabled(e.target.checked)}
                                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B61FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B61FF' } }}
                                        />
                                        <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                                            Use scene music (spans entire scene)
                                        </Typography>
                                    </Stack>

                                    <Stack spacing={1.5} sx={{ mt: 1.5, opacity: sceneMusicEnabled ? 1 : 0.5 }}>
                                        <TextField
                                            size="small"
                                            label="Scene music name"
                                            value={sceneMusicForm.music_name}
                                            onChange={(e) => setSceneMusicForm(prev => ({ ...prev, music_name: e.target.value }))}
                                            disabled={!sceneMusicEnabled}
                                            fullWidth
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                                            sx={{ input: { color: 'white' } }}
                                        />
                                        <TextField
                                            size="small"
                                            label="Artist"
                                            value={sceneMusicForm.artist}
                                            onChange={(e) => setSceneMusicForm(prev => ({ ...prev, artist: e.target.value }))}
                                            disabled={!sceneMusicEnabled}
                                            fullWidth
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                                            sx={{ input: { color: 'white' } }}
                                        />
                                        <FormControl size="small" fullWidth disabled={!sceneMusicEnabled}>
                                            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Music Type</InputLabel>
                                            <Select
                                                label="Music Type"
                                                value={sceneMusicForm.music_type}
                                                onChange={(e) => setSceneMusicForm(prev => ({ ...prev, music_type: e.target.value as MusicType }))}
                                                sx={{ color: 'white' }}
                                            >
                                                {Object.values(MusicType).map((type) => (
                                                    <MenuItem key={`scene-music-${type}`} value={type}>
                                                        {MUSIC_TYPE_LABELS[type]}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                    <Button
                                        onClick={handleSaveSceneMusic}
                                        variant="outlined"
                                        size="small"
                                        disabled={isMusicLoading || isSavingMusic}
                                        sx={{ mt: 1.5, color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)" }}
                                    >
                                        Apply Scene Music
                                    </Button>
                                </Box>

                                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Switch
                                            checked={momentMusicEnabled}
                                            onChange={(e) => setMomentMusicEnabled(e.target.checked)}
                                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B61FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B61FF' } }}
                                        />
                                        <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                                            Override with moment music
                                        </Typography>
                                    </Stack>

                                    <Stack spacing={1.5} sx={{ mt: 1.5, opacity: momentMusicEnabled ? 1 : 0.5 }}>
                                        <TextField
                                            size="small"
                                            label="Moment music name"
                                            value={momentMusicForm.music_name}
                                            onChange={(e) => setMomentMusicForm(prev => ({ ...prev, music_name: e.target.value }))}
                                            disabled={!momentMusicEnabled}
                                            fullWidth
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                                            sx={{ input: { color: 'white' } }}
                                        />
                                        <TextField
                                            size="small"
                                            label="Artist"
                                            value={momentMusicForm.artist}
                                            onChange={(e) => setMomentMusicForm(prev => ({ ...prev, artist: e.target.value }))}
                                            disabled={!momentMusicEnabled}
                                            fullWidth
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                                            sx={{ input: { color: 'white' } }}
                                        />
                                        <FormControl size="small" fullWidth disabled={!momentMusicEnabled}>
                                            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Music Type</InputLabel>
                                            <Select
                                                label="Music Type"
                                                value={momentMusicForm.music_type}
                                                onChange={(e) => setMomentMusicForm(prev => ({ ...prev, music_type: e.target.value as MusicType }))}
                                                sx={{ color: 'white' }}
                                            >
                                                {Object.values(MusicType).map((type) => (
                                                    <MenuItem key={`moment-music-${type}`} value={type}>
                                                        {MUSIC_TYPE_LABELS[type]}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                    <Button
                                        onClick={handleSaveMomentMusic}
                                        variant="outlined"
                                        size="small"
                                        disabled={isMusicLoading || isSavingMusic}
                                        sx={{ mt: 1.5, color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)" }}
                                    >
                                        Apply Moment Override
                                    </Button>
                                </Box>

                                {musicError && (
                                    <Typography sx={{ color: "#FF6B6B", fontSize: "0.75rem" }}>
                                        {musicError}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Stack>
                    {/* ─── END LEFT COLUMN ─── */}

                    {/* ─── RIGHT COLUMN: Activity Context ─── */}
                    {activity && (
                        <Stack spacing={2} sx={{ borderLeft: '1px solid rgba(255,255,255,0.06)', pl: 2 }}>
                            {/* Activity header */}
                            <Box sx={{
                                bgcolor: 'rgba(245,158,11,0.06)',
                                border: '1px solid rgba(245,158,11,0.12)',
                                borderRadius: 1,
                                px: 1.5,
                                py: 1.25,
                            }}>
                                <Typography sx={{ fontSize: 10, color: 'rgba(245,158,11,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, mb: 0.75 }}>
                                    Inherited from activity
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: 'rgba(245,158,11,1)', fontWeight: 700 }}>
                                    {activity.name}
                                </Typography>
                                {(activity.start_time || activity.end_time) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Typography sx={{ fontSize: 12, color: 'rgba(245,158,11,0.85)', fontWeight: 600 }}>
                                            {fmtTime(activity.start_time)}
                                            {activity.end_time && ` – ${fmtTime(activity.end_time)}`}
                                        </Typography>
                                        {(activity.duration_minutes ?? 0) > 0 && (
                                            <Box sx={{ bgcolor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 0.75, px: 0.75, py: 0.25 }}>
                                                <Typography sx={{ fontSize: 11, color: 'rgba(245,158,11,0.85)', fontWeight: 600 }}>{activity.duration_minutes}m</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>

                            {/* Inherited Subjects */}
                            {inheritedSubjects.length > 0 && (
                                <Box>
                                    <Typography sx={{ fontSize: 10, color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', fontWeight: 700, mb: 0.75, letterSpacing: '0.05em' }}>
                                        {inheritedSubjects.length} Subject{inheritedSubjects.length !== 1 && 's'}
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {inheritedSubjects.map((s: any) => (
                                            <Box key={s.id} sx={{
                                                bgcolor: 'rgba(167,139,250,0.08)',
                                                border: '1px solid rgba(167,139,250,0.12)',
                                                borderRadius: 0.75,
                                                px: 1,
                                                py: 0.5,
                                            }}>
                                                <Typography sx={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500 }}>
                                                    {s.name}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Inherited Crew */}
                            {inheritedCrew.length > 0 && (
                                <Box>
                                    <Typography sx={{ fontSize: 10, color: 'rgba(236,72,153,0.6)', textTransform: 'uppercase', fontWeight: 700, mb: 0.75, letterSpacing: '0.05em' }}>
                                        {inheritedCrew.length} Crew
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {inheritedCrew.map((o: any) => (
                                            <Box key={o.id} sx={{
                                                bgcolor: 'rgba(236,72,153,0.08)',
                                                border: '1px solid rgba(236,72,153,0.12)',
                                                borderRadius: 0.75,
                                                px: 1,
                                                py: 0.5,
                                            }}>
                                                <Typography sx={{ fontSize: 12, color: '#f9a8d4', fontWeight: 500 }}>
                                                    {o.position_name || o.name || 'Crew'}
                                                    {(o.job_role?.display_name || o.job_role?.name) && (
                                                        <Typography component="span" sx={{ fontSize: 11, color: 'rgba(236,72,153,0.5)', ml: 0.5 }}>
                                                            · {o.job_role?.display_name || o.job_role?.name}
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {!inheritedSubjects.length && !inheritedCrew.length && (
                                <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                    No subjects or crew assigned to this activity.
                                </Typography>
                            )}
                        </Stack>
                    )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                {isTrackMode ? (
                    <>
                        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                            <Button
                                onClick={onClose}
                                sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                                Close
                            </Button>
                            {!readOnly && onRemoveTrack && effectiveTrackKey && (
                                <Button
                                    onClick={handleRemoveTrackClick}
                                    variant="contained"
                                    disabled={!trackIsAssigned}
                                    sx={{
                                        bgcolor: "#FF6B6B",
                                        color: "white",
                                        "&:hover": { bgcolor: "#e45a5a" },
                                    }}
                                >
                                    Remove From Track
                                </Button>
                            )}
                        </Box>
                    </>
                ) : (
                    <>
                        {!readOnly && onDelete && (
                            <Button
                                onClick={handleDelete}
                                startIcon={<DeleteIcon />}
                                sx={{
                                    color: "#ff6b6b",
                                    "&:hover": { bgcolor: "rgba(255, 107, 107, 0.1)" },
                                }}
                            >
                                Delete
                            </Button>
                        )}
                        {!readOnly && onClearRecordingSetup && hasRecordingSetup && (
                            <Button
                                onClick={() => {
                                    onClearRecordingSetup(moment.id);
                                    onClose();
                                }}
                                sx={{
                                    color: "#FFD166",
                                    "&:hover": { bgcolor: "rgba(255, 209, 102, 0.12)" },
                                }}
                            >
                                Clear Override
                            </Button>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                onClick={onClose}
                                sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                                Cancel
                            </Button>
                            {!readOnly && (
                                <Button
                                    onClick={handleSaveWithSetup}
                                    variant="contained"
                                    disabled={Object.keys(errors).length > 0 || isSavingSetup}
                                    sx={{
                                        bgcolor: "#7B61FF",
                                        color: "white",
                                        "&:hover": { bgcolor: "#6b4dd9" },
                                    }}
                                >
                                    Save Changes
                                </Button>
                            )}
                        </Box>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default MomentEditor;
