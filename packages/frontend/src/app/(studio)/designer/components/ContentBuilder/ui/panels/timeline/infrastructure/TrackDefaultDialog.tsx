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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    LinearProgress,
    Stack,
    IconButton,
    Divider,
    Alert,
    Tooltip,
    Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TuneIcon from "@mui/icons-material/Tune";
import {
    Videocam as VideoIcon,
    VolumeUp as AudioIcon,
    Palette as GraphicsIcon,
    MusicNote as MusicIcon,
} from "@mui/icons-material";
import { createScenesApi } from "@/lib/api/scenes.api";
import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import type { TimelineTrack, TimelineScene } from "@/lib/types/timeline";
import type { TrackDefault } from "@/app/(studio)/designer/components/ContentBuilder/context/ContentBuilderContext";
import { useContentBuilder } from "@/app/(studio)/designer/components/ContentBuilder/context/ContentBuilderContext";
import type { ShotType } from "@/types/coverage.types";

interface TrackDefaultDialogProps {
    open: boolean;
    track: TimelineTrack;
    currentDefault: TrackDefault | undefined;
    packageSubjects: Array<{ id: number; name: string; [key: string]: unknown }>;
    scenes: TimelineScene[];
    onClose: () => void;
    onSaveDefault: (trackId: number, defaults: TrackDefault) => void;
}

const SHOT_TYPES: ShotType[] = [
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

const getTrackIcon = (trackType: string) => {
    const type = trackType.toUpperCase();
    switch (type) {
        case "VIDEO": return <VideoIcon sx={{ fontSize: 16 }} />;
        case "AUDIO": return <AudioIcon sx={{ fontSize: 16 }} />;
        case "GRAPHICS": return <GraphicsIcon sx={{ fontSize: 16 }} />;
        case "MUSIC": return <MusicIcon sx={{ fontSize: 16 }} />;
        default: return <VideoIcon sx={{ fontSize: 16 }} />;
    }
};

type CameraAssignment = { track_id: number; subject_ids?: number[]; shot_type?: string | null };
type ExistingSetup = {
    camera_track_ids?: number[];
    camera_assignments?: CameraAssignment[];
    audio_track_ids?: number[];
    graphics_enabled?: boolean;
    graphics_title?: string | null;
} | null;

type SceneMoment = { id: number; name?: string; recording_setup?: ExistingSetup };
type SceneWithMoments = { moments?: SceneMoment[] };

// Per-moment status for the live progress list
type MomentStatus = "pending" | "applying" | "done" | "error";
interface MomentEntry {
    momentId: number;
    momentName: string;
    sceneName: string;
    status: MomentStatus;
}

const TrackDefaultDialog: React.FC<TrackDefaultDialogProps> = ({
    open,
    track,
    currentDefault,
    packageSubjects,
    scenes,
    onClose,
    onSaveDefault,
}) => {
    const scenesApi = React.useMemo(() => createScenesApi(apiClient as unknown as ApiClient), []);
    // Pull setScenes so we can update local state immediately after each API save
    const { setScenes } = useContentBuilder();

    const isVideo = track.track_type?.toUpperCase() === "VIDEO";
    const isAudio = track.track_type?.toUpperCase() === "AUDIO";

    const [selectedSubjects, setSelectedSubjects] = React.useState<number[]>([]);
    const [selectedShot, setSelectedShot] = React.useState<ShotType | "">("")
    const [audioEnabled, setAudioEnabled] = React.useState<boolean>(true);

    // Applying state
    const [isApplying, setIsApplying] = React.useState(false);
    const [momentEntries, setMomentEntries] = React.useState<MomentEntry[]>([]);
    const [applyDone, setApplyDone] = React.useState(false);
    const [applyError, setApplyError] = React.useState<string | null>(null);

    const progressDone = momentEntries.filter((m) => m.status === "done" || m.status === "error").length;
    const progressTotal = momentEntries.length;
    const progressPercent = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;

    // Populate from currentDefault on open
    React.useEffect(() => {
        if (!open) return;
        setSelectedSubjects(currentDefault?.subject_ids ?? []);
        setSelectedShot((currentDefault?.shot_type ?? "") as ShotType | "");
        setAudioEnabled(currentDefault?.audio_enabled ?? true);
        setApplyDone(false);
        setApplyError(null);
        setMomentEntries([]);
        setIsApplying(false);
    }, [open, currentDefault, track.id]);

    const currentDefaults: TrackDefault = React.useMemo(() => ({
        subject_ids: selectedSubjects,
        shot_type: selectedShot,
        audio_enabled: isAudio ? audioEnabled : undefined,
    }), [selectedSubjects, selectedShot, isAudio, audioEnabled]);

    const hasChanges = React.useMemo(() => {
        if (!currentDefault) return selectedSubjects.length > 0 || !!selectedShot || !audioEnabled;
        const subjectsChanged = JSON.stringify([...currentDefault.subject_ids].sort()) !== JSON.stringify([...selectedSubjects].sort());
        const shotChanged = (currentDefault.shot_type ?? "") !== selectedShot;
        const audioChanged = isAudio && (currentDefault.audio_enabled ?? true) !== audioEnabled;
        return subjectsChanged || shotChanged || audioChanged;
    }, [currentDefault, selectedSubjects, selectedShot, audioEnabled, isAudio]);

    const collectAllMoments = () => {
        const result: Array<{ momentId: number; momentName: string; sceneId: number; sceneName: string }> = [];
        for (const scene of scenes) {
            const sceneMoments = (scene as unknown as SceneWithMoments).moments;
            if (!Array.isArray(sceneMoments)) continue;
            for (const moment of sceneMoments) {
                if (typeof moment.id === "number" && moment.id > 0) {
                    result.push({
                        momentId: moment.id,
                        momentName: moment.name || `Moment ${moment.id}`,
                        sceneId: scene.id as number,
                        sceneName: scene.name || `Scene ${scene.id}`,
                    });
                }
            }
        }
        return result;
    };

    const buildMergedPayload = (existingSetup: ExistingSetup) => {
        if (isVideo) {
            const otherAssignments: CameraAssignment[] = (existingSetup?.camera_assignments || []).filter(
                (a) => a.track_id !== track.id
            );
            const thisAssignment: CameraAssignment = {
                track_id: track.id,
                subject_ids: selectedSubjects,
                shot_type: selectedShot || undefined,
            };
            const allAssignments = [...otherAssignments, thisAssignment];
            const otherCameraIds = (existingSetup?.camera_assignments || [])
                .filter((a) => a.track_id !== track.id)
                .map((a) => a.track_id);
            const uniqueCameraIds = Array.from(new Set([
                ...(existingSetup?.camera_track_ids || otherCameraIds),
                track.id,
            ]));
            return {
                camera_track_ids: uniqueCameraIds,
                camera_assignments: allAssignments,
                audio_track_ids: existingSetup?.audio_track_ids ?? [],
                graphics_enabled: existingSetup?.graphics_enabled ?? false,
                graphics_title: existingSetup?.graphics_title ?? null,
            };
        }

        if (isAudio) {
            const existingAudioIds: number[] = existingSetup?.audio_track_ids ?? [];
            let newAudioIds: number[];
            if (audioEnabled) {
                newAudioIds = Array.from(new Set([...existingAudioIds, track.id]));
            } else {
                newAudioIds = existingAudioIds.filter((id) => id !== track.id);
            }
            return {
                camera_track_ids: existingSetup?.camera_track_ids ?? [],
                camera_assignments: existingSetup?.camera_assignments ?? [],
                audio_track_ids: newAudioIds,
                graphics_enabled: existingSetup?.graphics_enabled ?? false,
                graphics_title: existingSetup?.graphics_title ?? null,
            };
        }

        return null;
    };

    const handleApplyAll = async () => {
        setApplyError(null);
        setApplyDone(false);

        const allMoments = collectAllMoments();
        if (allMoments.length === 0) {
            setApplyError("No moments found in this film.");
            return;
        }

        // Build initial entry list
        setMomentEntries(allMoments.map((m) => ({
            momentId: m.momentId,
            momentName: m.momentName,
            sceneName: m.sceneName,
            status: "pending",
        })));

        setIsApplying(true);
        let errorCount = 0;

        for (let i = 0; i < allMoments.length; i++) {
            const { momentId, sceneId } = allMoments[i];

            setMomentEntries((prev) =>
                prev.map((e, idx) => idx === i ? { ...e, status: "applying" } : e)
            );

            try {
                const currentScene = scenes.find((s) => s.id === sceneId);
                const currentMoment = (currentScene as unknown as SceneWithMoments).moments?.find((m) => m.id === momentId);
                const existingSetup: ExistingSetup = currentMoment?.recording_setup ?? null;
                const payload = buildMergedPayload(existingSetup);

                if (payload) {
                    const saved = await scenesApi.moments.upsertRecordingSetup(momentId, payload);

                    // Immediately update local state so playback screen reflects it without reload
                    const newSetup: ExistingSetup = {
                        camera_track_ids: payload.camera_track_ids,
                        camera_assignments: saved.camera_assignments?.map((a) => ({
                            track_id: a.track_id,
                            subject_ids: a.subject_ids ?? [],
                            shot_type: a.shot_type ?? null,
                        })) ?? payload.camera_assignments,
                        audio_track_ids: saved.audio_track_ids ?? payload.audio_track_ids,
                        graphics_enabled: saved.graphics_enabled ?? payload.graphics_enabled,
                        graphics_title: saved.graphics_title ?? payload.graphics_title,
                    };

                    setScenes((prev) =>
                        prev.map((scene) => {
                            if (scene.id !== sceneId) return scene;
                            const sceneWithMoments = scene as unknown as SceneWithMoments;
                            const updatedMoments = sceneWithMoments.moments?.map((m) =>
                                m.id === momentId
                                    ? { ...m, recording_setup: newSetup, has_recording_setup: true }
                                    : m
                            );
                            return { ...scene, moments: updatedMoments } as TimelineScene;
                        })
                    );
                }

                setMomentEntries((prev) =>
                    prev.map((e, idx) => idx === i ? { ...e, status: "done" } : e)
                );
            } catch {
                errorCount++;
                setMomentEntries((prev) =>
                    prev.map((e, idx) => idx === i ? { ...e, status: "error" } : e)
                );
            }
        }

        setIsApplying(false);
        if (errorCount > 0) {
            setApplyError(`${errorCount} moment${errorCount !== 1 ? "s" : ""} failed. Others were updated.`);
        } else {
            setApplyDone(true);
        }

        // Save in context as default
        onSaveDefault(track.id, currentDefaults);
    };

    const handleSaveDefault = () => {
        onSaveDefault(track.id, currentDefaults);
        onClose();
    };

    const trackColor = track.color || "#7B61FF";
    const totalMomentCount = React.useMemo(
        () => collectAllMoments().length,
        [scenes] // collectAllMoments reads scenes, so scenes is the correct dep
    );

    const subjectNames = React.useMemo(() =>
        selectedSubjects
            .map((id) => packageSubjects.find((s) => s.id === id)?.name)
            .filter((n): n is string => Boolean(n)),
        [selectedSubjects, packageSubjects]
    );

    return (
        <Dialog
            open={open}
            onClose={!isApplying ? onClose : undefined}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    bgcolor: "#161618",
                    backgroundImage: "none",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    overflow: "hidden",
                },
            }}
        >
            {/* Coloured top accent bar */}
            <Box sx={{ height: 3, bgcolor: trackColor, width: "100%" }} />

            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "white",
                    pb: 0.5,
                    pt: 2,
                    px: 2.5,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box
                        sx={{
                            p: 0.75,
                            borderRadius: 1,
                            bgcolor: `${trackColor}18`,
                            color: trackColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 32,
                            height: 32,
                            border: `1px solid ${trackColor}35`,
                        }}
                    >
                        {getTrackIcon(track.track_type)}
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                            {track.name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.3 }}>
                            Track default
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.4)" }} disabled={isApplying}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, pb: 1, pt: 1 }}>
                <Stack spacing={2}>
                    {/* Explanation banner */}
                    <Alert
                        icon={<TuneIcon sx={{ fontSize: 15 }} />}
                        severity="info"
                        sx={{
                            bgcolor: "rgba(99,102,241,0.08)",
                            color: "rgba(255,255,255,0.65)",
                            border: "1px solid rgba(99,102,241,0.18)",
                            "& .MuiAlert-icon": { color: "#818cf8" },
                            fontSize: "0.72rem",
                            py: 0.75,
                            px: 1.25,
                            "& .MuiAlert-message": { lineHeight: 1.5 },
                        }}
                    >
                        Set a default for <strong style={{ color: "#fff" }}>all {totalMomentCount} moment{totalMomentCount !== 1 ? "s" : ""}</strong>. Individual moments can still be overridden in the Moment Editor.
                    </Alert>

                    {/* Video controls */}
                    {isVideo && (
                        <Stack spacing={1.5}>
                            <FormControl size="small" fullWidth>
                                <InputLabel shrink sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>
                                    Shot size
                                </InputLabel>
                                <Select
                                    label="Shot size"
                                    value={selectedShot}
                                    onChange={(e) => setSelectedShot(e.target.value as ShotType | "")}
                                    displayEmpty
                                    renderValue={(v) => (
                                        <Typography sx={{ fontSize: "0.82rem", color: v ? "#fff" : "rgba(255,255,255,0.35)" }}>
                                            {v ? formatShotLabel(v as string) : "Not set"}
                                        </Typography>
                                    )}
                                    disabled={isApplying}
                                    sx={{
                                        color: "white",
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: trackColor },
                                    }}
                                >
                                    <MenuItem value=""><em style={{ color: "rgba(255,255,255,0.4)" }}>Not set</em></MenuItem>
                                    {SHOT_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            <Typography sx={{ fontSize: "0.82rem" }}>{formatShotLabel(type)}</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" fullWidth>
                                <InputLabel shrink sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>
                                    Subjects
                                </InputLabel>
                                <Select
                                    multiple
                                    label="Subjects"
                                    value={selectedSubjects}
                                    onChange={(e) => setSelectedSubjects(e.target.value as number[])}
                                    renderValue={() => (
                                        <Typography sx={{ fontSize: "0.82rem", color: subjectNames.length ? "#fff" : "rgba(255,255,255,0.35)" }}>
                                            {subjectNames.length ? subjectNames.join(", ") : "No subjects"}
                                        </Typography>
                                    )}
                                    disabled={isApplying || packageSubjects.length === 0}
                                    sx={{
                                        color: "white",
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: trackColor },
                                    }}
                                >
                                    {packageSubjects.length === 0 ? (
                                        <MenuItem disabled>No subjects available</MenuItem>
                                    ) : (
                                        packageSubjects.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                <Checkbox
                                                    checked={selectedSubjects.includes(s.id)}
                                                    size="small"
                                                    sx={{ py: 0.25, "&.Mui-checked": { color: trackColor } }}
                                                />
                                                <ListItemText
                                                    primary={<Typography sx={{ fontSize: "0.82rem" }}>{s.name as string}</Typography>}
                                                />
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Stack>
                    )}

                    {/* Audio toggle */}
                    {isAudio && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                bgcolor: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 1,
                                px: 1.5,
                                py: 1,
                            }}
                        >
                            <Box>
                                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", fontWeight: 500 }}>
                                    Enabled by default
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.69rem", mt: 0.25 }}>
                                    Include this audio track in all moments
                                </Typography>
                            </Box>
                            <Checkbox
                                checked={audioEnabled}
                                onChange={(e) => setAudioEnabled(e.target.checked)}
                                disabled={isApplying}
                                sx={{ color: "rgba(255,255,255,0.3)", "&.Mui-checked": { color: trackColor } }}
                            />
                        </Box>
                    )}

                    {!isVideo && !isAudio && (
                        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem", fontStyle: "italic", textAlign: "center", py: 1 }}>
                            Defaults are only configurable for Video and Audio tracks.
                        </Typography>
                    )}

                    {/* Live progress list */}
                    {momentEntries.length > 0 && (
                        <Box
                            sx={{
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 1.5,
                                overflow: "hidden",
                            }}
                        >
                            <Box sx={{ position: "relative" }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPercent}
                                    sx={{
                                        height: 3,
                                        bgcolor: "rgba(255,255,255,0.06)",
                                        "& .MuiLinearProgress-bar": {
                                            bgcolor: applyError ? "#f59e0b" : progressPercent === 100 ? "#10b981" : trackColor,
                                            transition: "transform 0.15s ease",
                                        },
                                    }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    px: 1.5,
                                    py: 0.75,
                                    bgcolor: "rgba(255,255,255,0.03)",
                                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {isApplying ? "Applying live..." : applyDone ? "All done" : "Results"}
                                </Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: applyError ? "#f59e0b" : progressPercent === 100 ? "#10b981" : "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                                    {progressDone} / {progressTotal}
                                </Typography>
                            </Box>
                            <Box sx={{ maxHeight: 160, overflowY: "auto" }}>
                                {momentEntries.map((entry) => (
                                    <Box
                                        key={entry.momentId}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            px: 1.5,
                                            py: 0.6,
                                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                                            bgcolor: entry.status === "applying" ? `${trackColor}12` : "transparent",
                                            transition: "background-color 0.15s ease",
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontSize: "0.75rem", color: entry.status === "applying" ? "#fff" : "rgba(255,255,255,0.65)", fontWeight: entry.status === "applying" ? 600 : 400, lineHeight: 1.3 }}>
                                                {entry.momentName}
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.2 }}>
                                                {entry.sceneName}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ ml: 1, flexShrink: 0 }}>
                                            {entry.status === "pending" && (
                                                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.12)" }} />
                                            )}
                                            {entry.status === "applying" && (
                                                <Box
                                                    sx={{
                                                        width: 7, height: 7, borderRadius: "50%",
                                                        bgcolor: trackColor,
                                                        animation: "pulse 0.8s ease-in-out infinite",
                                                        "@keyframes pulse": {
                                                            "0%, 100%": { opacity: 1, transform: "scale(1)" },
                                                            "50%": { opacity: 0.35, transform: "scale(0.65)" },
                                                        },
                                                    }}
                                                />
                                            )}
                                            {entry.status === "done" && (
                                                <CheckCircleIcon sx={{ fontSize: 14, color: "#10b981" }} />
                                            )}
                                            {entry.status === "error" && (
                                                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#ef4444" }} />
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {applyDone && momentEntries.length > 0 && (
                        <Alert
                            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                            severity="success"
                            sx={{
                                bgcolor: "rgba(16,185,129,0.08)",
                                color: "#6ee7b7",
                                border: "1px solid rgba(16,185,129,0.2)",
                                "& .MuiAlert-icon": { color: "#10b981" },
                                fontSize: "0.75rem",
                                py: 0.5,
                                px: 1.25,
                            }}
                        >
                            All {progressTotal} moments updated — visible immediately.
                        </Alert>
                    )}

                    {applyError && (
                        <Alert
                            severity="warning"
                            sx={{
                                bgcolor: "rgba(245,158,11,0.08)",
                                color: "#fbbf24",
                                border: "1px solid rgba(245,158,11,0.2)",
                                "& .MuiAlert-icon": { color: "#f59e0b" },
                                fontSize: "0.75rem",
                                py: 0.5,
                                px: 1.25,
                            }}
                        >
                            {applyError}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2.5 }} />

            <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1, justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        onClick={onClose}
                        size="small"
                        disabled={isApplying}
                        sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", minWidth: 0, px: 1 }}
                    >
                        {applyDone ? "Close" : "Cancel"}
                    </Button>
                    {(isVideo || isAudio) && !isApplying && (
                        <Tooltip
                            title="Saves as a pre-fill only (no DB write). When you open the Moment Editor it pre-selects these values, but you can still change each moment individually."
                            placement="top"
                            arrow
                        >
                            <span>
                                <Button
                                    onClick={handleSaveDefault}
                                    size="small"
                                    variant="outlined"
                                    disabled={!hasChanges && !!currentDefault}
                                    sx={{
                                        borderColor: "rgba(255,255,255,0.12)",
                                        color: "rgba(255,255,255,0.5)",
                                        fontSize: "0.78rem",
                                        px: 1.5,
                                        "&:hover": { borderColor: "rgba(255,255,255,0.25)", bgcolor: "rgba(255,255,255,0.04)" },
                                        "&:disabled": { borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" },
                                    }}
                                >
                                    Pre-fill only
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Box>

                {(isVideo || isAudio) && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={isApplying ? undefined : <AutoAwesomeIcon sx={{ fontSize: 15 }} />}
                        onClick={handleApplyAll}
                        disabled={isApplying}
                        sx={{
                            bgcolor: trackColor,
                            "&:hover": { bgcolor: trackColor, filter: "brightness(1.15)" },
                            "&:disabled": { bgcolor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)" },
                            fontSize: "0.8rem",
                            px: 2,
                            py: 0.75,
                            fontWeight: 600,
                            boxShadow: `0 0 14px ${trackColor}40`,
                        }}
                    >
                        {isApplying
                            ? `Updating ${progressDone + 1} / ${progressTotal}...`
                            : applyDone
                                ? "Apply Again"
                                : `Apply to All ${totalMomentCount} Moment${totalMomentCount !== 1 ? "s" : ""}`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default TrackDefaultDialog;
