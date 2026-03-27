"use client";

import React from "react";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { MusicType, MUSIC_TYPE_LABELS } from "@/features/content/music/types";
import type { TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { useFilmSubjects } from "@/features/content/subjects";
import { useSceneSubjects } from '@/features/content/subjects';
import { scenesApi } from "@/features/content/scenes/api";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useContentBuilder } from "../../../context/ContentBuilderContext";
import { getEquipmentLabelForTrackName } from "@/features/content/films/utils/equipmentAssignments";

interface SceneRecordingSetupModalProps {
    open: boolean;
    sceneName?: string | null;
    sceneLabel?: string | null;
    sceneIds: number[];
    filmId?: number | null;
    isSaving: boolean;
    videoTracks: TimelineTrack[];
    audioTracks: TimelineTrack[];
    graphicsTracks: TimelineTrack[];
    selectedCameraTrackIds: number[];
    selectedAudioTrackIds: number[];
    graphicsEnabled: boolean;
    sceneMusicEnabled: boolean;
    sceneMusicForm: {
        music_name: string;
        artist: string;
        music_type: MusicType;
    };
    musicError: string | null;
    onClose: () => void;
    onSave: () => void;
    onClear: () => void;
    onToggleCameraTrack: (trackId: number) => void;
    onToggleAudioTrack: (trackId: number) => void;
    onGraphicsEnabledChange: (enabled: boolean) => void;
    onSceneMusicEnabledChange: (enabled: boolean) => void;
    onSceneMusicFormChange: (next: { music_name: string; artist: string; music_type: MusicType }) => void;
    /** Package activities for schedule linking (replaces raw event day / time fields) */
    activities?: Array<{
        id: number;
        name: string;
        color?: string | null;
        start_time?: string | null;
        end_time?: string | null;
        duration_minutes?: number | null;
        package_event_day_id: number;
        event_day_template_id?: number | null;
        dayName?: string;
    }>;
    /** Subjects from the package, assigned to activities */
    activitySubjects?: any[];
    /** Operators/crew from the package, assigned to activities */
    activityOperators?: any[];
    /** Current scene schedule data */
    sceneSchedule?: {
        event_day_template_id?: number | null;
        package_activity_id?: number | null;
        scheduled_start_time?: string | null;
        scheduled_duration_minutes?: number | null;
    } | null;
    /** Called when schedule fields change */
    onScheduleChange?: (field: string, value: number | string | null) => void;
}

const SceneRecordingSetupModal: React.FC<SceneRecordingSetupModalProps> = ({
    open,
    sceneName,
    sceneLabel,
    sceneIds,
    filmId,
    isSaving,
    videoTracks,
    audioTracks,
    graphicsTracks,
    selectedCameraTrackIds,
    selectedAudioTrackIds,
    graphicsEnabled,
    sceneMusicEnabled,
    sceneMusicForm,
    musicError,
    onClose,
    onSave,
    onClear,
    onToggleCameraTrack,
    onToggleAudioTrack,
    onGraphicsEnabledChange,
    onSceneMusicEnabledChange,
    onSceneMusicFormChange,
    sceneSchedule,
    onScheduleChange,
    activities = [],
    activitySubjects = [],
    activityOperators = [],
}) => {
    const { equipmentAssignmentsBySlot, loadAvailableScenes } = useContentBuilder();
    useFilmSubjects(filmId ?? undefined); // retained for potential future use
    const {
        subjects: sceneSubjects,
        isLoading: isSceneSubjectsLoading,
        removeSubject,
    } = useSceneSubjects({ sceneIds });

    const primarySceneId = React.useMemo(() => sceneIds.find((id) => typeof id === "number") ?? null, [sceneIds]);
    const [isLibraryAdding, setIsLibraryAdding] = React.useState(false);
    const [libraryMessage, setLibraryMessage] = React.useState<string | null>(null);
    // Derive the selected activity so we can show its inherited times
    const selectedActivity = React.useMemo(
        () => activities.find(a => a.id === sceneSchedule?.package_activity_id) ?? null,
        [activities, sceneSchedule?.package_activity_id]
    );

    // Derive subjects assigned to the selected activity.
    // Includes: (a) explicitly assigned to this activity, (b) day-level subjects on
    // the same event day with no specific activity assignment (available everywhere).
    const inheritedSubjects = React.useMemo(() => {
        if (!selectedActivity) return [];
        // Use event_day_template_id (the template ID) to match with subject/operator records.
        // package_event_day_id is the join-table ID which differs from the template ID.
        const eventDayId = selectedActivity.event_day_template_id ?? selectedActivity.package_event_day_id;
        return activitySubjects.filter((s: any) => {
            // Explicitly assigned to this activity (direct or M2M)
            if (s.package_activity_id === selectedActivity.id) return true;
            if (s.activity_assignments?.some((a: any) => a.package_activity_id === selectedActivity.id)) return true;
            // Day-level subject: same event day, no activity assignment at all
            const hasNoAssignment = !s.package_activity_id && (!s.activity_assignments || s.activity_assignments.length === 0);
            if (hasNoAssignment && s.event_day_template_id === eventDayId) return true;
            return false;
        });
    }, [activitySubjects, selectedActivity]);

    // Derive operators/crew for the selected activity (deduplicated by template).
    // Includes: (a) explicitly assigned to this activity, (b) day-level operators on
    // the same event day with no specific activity assignment (available everywhere).
    const inheritedCrew = React.useMemo(() => {
        if (!selectedActivity) return [];
        // Use event_day_template_id (the template ID) to match with operator records.
        const eventDayId = selectedActivity.event_day_template_id ?? selectedActivity.package_event_day_id;
        const matched = activityOperators.filter((o: any) => {
            // Explicitly assigned to this activity (direct or M2M)
            if (o.package_activity_id === selectedActivity.id) return true;
            if (o.activity_assignments?.some((a: any) => a.package_activity_id === selectedActivity.id)) return true;
            // Day-level operator: same event day, no activity assignment at all
            const hasNoAssignment = !o.package_activity_id && (!o.activity_assignments || o.activity_assignments.length === 0);
            if (hasNoAssignment && o.event_day_template_id === eventDayId) return true;
            return false;
        });
        // Deduplicate by crew_member_id (same person on multiple days)
        const seen = new Map<number, any>();
        matched.forEach((o: any) => {
            const crewId = o.crew_member_id ?? o.id;
            if (!seen.has(crewId)) seen.set(crewId, o);
        });
        return Array.from(seen.values());
    }, [activityOperators, selectedActivity]);

    // Helper: format "HH:MM" → "12:30 PM"
    const fmtTime = (t: string | null | undefined) => {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return t;
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    // Group activities by day for the Select
    const activitiesByDay = React.useMemo(() => {
        const map = new Map<string, typeof activities>();
        activities.forEach(a => {
            const day = a.dayName ?? 'Day';
            const list = map.get(day) ?? [];
            list.push(a);
            map.set(day, list);
        });
        return Array.from(map.entries());
    }, [activities]);

    const getTrackDisplayName = (track: TimelineTrack) => {
        const normalized = track.track_type?.toString().toLowerCase();
        const shouldShow = normalized === "video" || normalized === "audio";
        if (!shouldShow) return track.name;
        const equipmentLabel = getEquipmentLabelForTrackName(track.name, equipmentAssignmentsBySlot);
        return equipmentLabel ? `${track.name} · ${equipmentLabel}` : track.name;
    };

    const handleAddToLibrary = async () => {
        if (!primarySceneId) return;
        setIsLibraryAdding(true);
        setLibraryMessage(null);
        try {
            await scenesApi.templates.createFromScene(primarySceneId, sceneName ?? undefined);
            loadAvailableScenes();
            setLibraryMessage("Scene added to library.");
        } catch (err) {
            console.error(err);
            setLibraryMessage("Failed to add scene to library.");
        } finally {
            setIsLibraryAdding(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
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
            <DialogTitle sx={{ color: "white", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>
                    Scene Settings
                    {sceneLabel ? ` • ${sceneLabel}` : ""}
                    {sceneName ? ` • ${sceneName}` : ""}
                </span>
                <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.6)" }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 3 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                            Video Tracks
                        </Typography>
                        {videoTracks.length === 0 ? (
                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                                No video tracks available.
                            </Typography>
                        ) : (
                            <FormGroup>
                                {videoTracks.map((track) => (
                                    <FormControlLabel
                                        key={`video-track-${track.id}`}
                                        control={
                                            <Checkbox
                                                checked={selectedCameraTrackIds.includes(track.id)}
                                                onChange={() => onToggleCameraTrack(track.id)}
                                                sx={{ color: "rgba(255,255,255,0.5)", "&.Mui-checked": { color: "#7B61FF" } }}
                                            />
                                        }
                                        label={<Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{getTrackDisplayName(track)}</Typography>}
                                    />
                                ))}
                            </FormGroup>
                        )}

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                            Audio Tracks
                        </Typography>
                        {audioTracks.length === 0 ? (
                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                                No audio tracks available.
                            </Typography>
                        ) : (
                            <FormGroup>
                                {audioTracks.map((track) => (
                                    <FormControlLabel
                                        key={`audio-track-${track.id}`}
                                        control={
                                            <Checkbox
                                                checked={selectedAudioTrackIds.includes(track.id)}
                                                onChange={() => onToggleAudioTrack(track.id)}
                                                sx={{ color: "rgba(255,255,255,0.5)", "&.Mui-checked": { color: "#7B61FF" } }}
                                            />
                                        }
                                        label={<Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{getTrackDisplayName(track)}</Typography>}
                                    />
                                ))}
                            </FormGroup>
                        )}

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                            Graphics
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Switch
                                checked={graphicsEnabled}
                                onChange={(e) => onGraphicsEnabledChange(e.target.checked)}
                                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#7B61FF" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#7B61FF" } }}
                            />
                            <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                                Enable graphics overlays
                            </Typography>
                            {graphicsTracks.length === 0 && (
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                    (No graphics track configured)
                                </Typography>
                            )}
                        </Stack>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                            Music
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Switch
                                checked={sceneMusicEnabled}
                                onChange={(e) => onSceneMusicEnabledChange(e.target.checked)}
                                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#7B61FF" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#7B61FF" } }}
                            />
                            <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                                Enable scene music (spans entire scene)
                            </Typography>
                        </Stack>
                        <Stack spacing={1.5} sx={{ opacity: sceneMusicEnabled ? 1 : 0.5 }}>
                            <TextField
                                size="small"
                                label="Scene music name"
                                value={sceneMusicForm.music_name}
                                onChange={(e) => onSceneMusicFormChange({ ...sceneMusicForm, music_name: e.target.value })}
                                disabled={!sceneMusicEnabled}
                                fullWidth
                                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}
                                sx={{ input: { color: "white" } }}
                            />
                            <TextField
                                size="small"
                                label="Artist"
                                value={sceneMusicForm.artist}
                                onChange={(e) => onSceneMusicFormChange({ ...sceneMusicForm, artist: e.target.value })}
                                disabled={!sceneMusicEnabled}
                                fullWidth
                                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}
                                sx={{ input: { color: "white" } }}
                            />
                            <FormControl size="small" fullWidth disabled={!sceneMusicEnabled}>
                                <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Music Type</InputLabel>
                                <Select
                                    label="Music Type"
                                    value={sceneMusicForm.music_type}
                                    onChange={(e) => onSceneMusicFormChange({ ...sceneMusicForm, music_type: e.target.value as MusicType })}
                                    sx={{ color: "white" }}
                                >
                                    {Object.values(MusicType).map((type) => (
                                        <MenuItem key={`scene-music-${type}`} value={type}>
                                            {MUSIC_TYPE_LABELS[type]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                        {musicError && (
                            <Typography sx={{ color: "#FF6B6B", fontSize: 12 }}>
                                {musicError}
                            </Typography>
                        )}
                    </Stack>

                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {/* Activity Section - replaces old event day / time fields */}
                        {onScheduleChange && (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pb: 0.25 }}>
                                    <Box sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: 'rgba(245,158,11,0.7)' }} />
                                    <Typography variant="caption" sx={{ color: "rgba(245,158,11,0.9)", textTransform: "uppercase", fontWeight: 700, letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                                        Activity
                                    </Typography>
                                    {selectedActivity && (
                                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {selectedActivity.color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: selectedActivity.color }} />}
                                            <Typography sx={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', fontWeight: 600 }}>{selectedActivity.name}</Typography>
                                        </Box>
                                    )}
                                </Box>
                                {activities.length === 0 ? (
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                                        No activities on this package yet. Add them from the Package page.
                                    </Typography>
                                ) : (
                                    <FormControl size="small" fullWidth>
                                        <InputLabel sx={{ color: "rgba(245,158,11,0.5)" }}>Assign to activity</InputLabel>
                                        <Select
                                            label="Assign to activity"
                                            value={sceneSchedule?.package_activity_id ?? ""}
                                            onChange={(e) => {
                                                const actId = e.target.value ? Number(e.target.value) : null;
                                                onScheduleChange("package_activity_id", actId);
                                                // Inherit times from the activity
                                                const act = activities.find(a => a.id === actId);
                                                onScheduleChange("scheduled_start_time", act?.start_time ?? null);
                                                const dur = act?.duration_minutes
                                                    ?? (act?.start_time && act?.end_time
                                                        ? (() => {
                                                            const [sh, sm] = act.start_time!.split(':').map(Number);
                                                            const [eh, em] = act.end_time!.split(':').map(Number);
                                                            return (eh * 60 + em) - (sh * 60 + sm);
                                                        })()
                                                        : null);
                                                onScheduleChange("scheduled_duration_minutes", dur ?? null);
                                            }}
                                            sx={{ color: "rgba(245,158,11,0.9)", '& fieldset': { borderColor: 'rgba(245,158,11,0.2)' } }}
                                        >
                                            <MenuItem value=""><em>No activity</em></MenuItem>
                                            {activitiesByDay.map(([dayName, acts]) => [
                                                <MenuItem key={`day-${dayName}`} disabled sx={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', py: 0.5 }}>
                                                    {dayName}
                                                </MenuItem>,
                                                ...acts.map(act => (
                                                    <MenuItem key={act.id} value={act.id} sx={{ pl: 3 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                            {act.color && (
                                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: act.color, flexShrink: 0 }} />
                                                            )}
                                                            <Box sx={{ flex: 1 }}>{act.name}</Box>
                                                            {act.start_time && (
                                                                <Box sx={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', ml: 'auto' }}>
                                                                    {fmtTime(act.start_time)}{act.end_time && ` – ${fmtTime(act.end_time)}`}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </MenuItem>
                                                ))
                                            ])}
                                        </Select>
                                    </FormControl>
                                )}
                                {/* Inherited activity summary card */}
                                {selectedActivity && (
                                    <Box sx={{
                                        bgcolor: 'rgba(245,158,11,0.08)',
                                        border: '1px solid rgba(245,158,11,0.25)',
                                        borderLeft: '3px solid rgba(245,158,11,0.7)',
                                        borderRadius: 1,
                                        px: 1.5,
                                        py: 1.25,
                                    }}>
                                        <Typography sx={{ fontSize: 10, color: 'rgba(245,158,11,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, mb: 0.75 }}>
                                            Inherited from activity
                                        </Typography>
                                        {/* Schedule row */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                            <Typography sx={{ fontSize: 13, color: 'rgba(245,158,11,1)', fontWeight: 700 }}>
                                                {fmtTime(selectedActivity.start_time)}
                                                {selectedActivity.end_time && ` – ${fmtTime(selectedActivity.end_time)}`}
                                            </Typography>
                                            {(selectedActivity.duration_minutes ?? 0) > 0 && (
                                                <Box sx={{ bgcolor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 0.75, px: 0.75, py: 0.25 }}>
                                                    <Typography sx={{ fontSize: 11, color: 'rgba(245,158,11,0.85)', fontWeight: 600 }}>{selectedActivity.duration_minutes}m</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        {/* Subjects summary */}
                                        {inheritedSubjects.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                                                <Typography sx={{ fontSize: 10, color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', fontWeight: 700, width: '100%', mb: 0.25 }}>
                                                    {inheritedSubjects.length} Subject{inheritedSubjects.length !== 1 && 's'}
                                                </Typography>
                                                {inheritedSubjects.slice(0, 6).map((s: any) => (
                                                    <Box key={s.id} sx={{
                                                        bgcolor: 'rgba(167,139,250,0.12)',
                                                        color: '#c4b5fd',
                                                        px: 0.75,
                                                        py: 0.15,
                                                        borderRadius: 0.5,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 500,
                                                        border: '1px solid rgba(167,139,250,0.15)',
                                                    }}>
                                                        {s.name}
                                                    </Box>
                                                ))}
                                                {inheritedSubjects.length > 6 && (
                                                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(167,139,250,0.5)', alignSelf: 'center' }}>
                                                        +{inheritedSubjects.length - 6} more
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                        {/* Crew summary */}
                                        {inheritedCrew.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                <Typography sx={{ fontSize: 10, color: 'rgba(236,72,153,0.6)', textTransform: 'uppercase', fontWeight: 700, width: '100%', mb: 0.25 }}>
                                                    {inheritedCrew.length} Crew
                                                </Typography>
                                                {inheritedCrew.slice(0, 4).map((o: any) => (
                                                    <Box key={o.id} sx={{
                                                        bgcolor: 'rgba(236,72,153,0.12)',
                                                        color: '#f9a8d4',
                                                        px: 0.75,
                                                        py: 0.15,
                                                        borderRadius: 0.5,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 500,
                                                        border: '1px solid rgba(236,72,153,0.15)',
                                                    }}>
                                                        {o.label || o.job_role?.display_name || o.job_role?.name || o.name || 'Crew'}
                                                    </Box>
                                                ))}
                                                {inheritedCrew.length > 4 && (
                                                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(236,72,153,0.5)', alignSelf: 'center' }}>
                                                        +{inheritedCrew.length - 4} more
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                )}
                                {!selectedActivity && activities.length > 0 && (
                                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 1, px: 1.5, py: 1 }}>
                                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                            No activity linked — assign one above to inherit schedule, subjects &amp; crew.
                                        </Typography>
                                    </Box>
                                )}
                                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                            </>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: 'rgba(249,115,22,0.6)' }} />
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                                Location
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1 }}>
                            <LocationOnOutlinedIcon sx={{ color: 'rgba(249,115,22,0.7)', fontSize: 15 }} />
                            {selectedActivity ? (
                                <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                                    {selectedActivity.name} Location
                                </Typography>
                            ) : (
                                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                    Assign an activity above to inherit a location.
                                </Typography>
                            )}
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        {/* ── Subjects Section ── */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: 'rgba(167,139,250,0.6)' }} />
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                                Subjects
                            </Typography>
                            {(inheritedSubjects.length > 0 || sceneSubjects.length > 0) && (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', ml: 0.5 }}>
                                    ({inheritedSubjects.length > 0 ? `${inheritedSubjects.length} from activity` : `${sceneSubjects.length} assigned`})
                                </Typography>
                            )}
                        </Box>

                        <Stack spacing={0.75}>
                            {isSceneSubjectsLoading ? (
                                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                                    Loading scene subjects…
                                </Typography>
                            ) : inheritedSubjects.length > 0 ? (
                                /* Show activity-inherited subjects */
                                <>
                                    <Typography sx={{ color: "rgba(167,139,250,0.5)", fontSize: 11 }}>
                                        Inherited from {selectedActivity?.name || 'linked activity'}
                                    </Typography>
                                    {inheritedSubjects.map((subject: any) => (
                                        <Box
                                            key={`inherited-subject-${subject.id}`}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                bgcolor: "rgba(167,139,250,0.06)",
                                                border: "1px solid rgba(167,139,250,0.12)",
                                                borderRadius: 1,
                                                px: 1.5,
                                                py: 0.75,
                                            }}
                                        >
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(167,139,250,0.5)', flexShrink: 0 }} />
                                            <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500, flex: 1 }}>
                                                {subject.name}
                                            </Typography>
                                            {subject.role_template?.role_name && (
                                                <Box sx={{
                                                    bgcolor: 'rgba(167,139,250,0.15)',
                                                    color: '#c4b5fd',
                                                    px: 0.75,
                                                    py: 0.15,
                                                    borderRadius: 0.5,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                }}>
                                                    {subject.role_template.role_name}
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </>
                            ) : sceneSubjects.length > 0 ? (
                                /* Show directly-assigned scene subjects (fallback) */
                                sceneSubjects.map((assignment) => (
                                    <Box
                                        key={`scene-subject-${assignment.subject_id}`}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            bgcolor: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 1,
                                            px: 1.5,
                                            py: 0.75,
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>
                                                {assignment.subject.name}
                                            </Typography>
                                            {assignment.subject.role && (
                                                <Box
                                                    sx={{
                                                        bgcolor: assignment.subject.role.is_core ? "rgba(156, 39, 176, 0.3)" : "rgba(100, 100, 100, 0.3)",
                                                        color: assignment.subject.role.is_core ? "#9c27b0" : "#b0b0b0",
                                                        px: 0.75,
                                                        py: 0.15,
                                                        borderRadius: 0.5,
                                                        fontSize: "0.65rem",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {assignment.subject.role.role_name}
                                                </Box>
                                            )}
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => removeSubject(assignment.subject_id)}
                                            sx={{ color: "#FF6B9D", p: 0.5 }}
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 1, px: 1.5, py: 1 }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: 'italic' }}>
                                        {selectedActivity ? 'No subjects assigned to this activity.' : 'Link an activity above to inherit subjects.'}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        {/* ── Crew Section ── */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: 'rgba(236,72,153,0.6)' }} />
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                                Crew
                            </Typography>
                            {inheritedCrew.length > 0 && (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', ml: 0.5 }}>
                                    ({inheritedCrew.length} from activity)
                                </Typography>
                            )}
                        </Box>

                        <Stack spacing={0.75}>
                            {inheritedCrew.length > 0 ? (
                                <>
                                    <Typography sx={{ color: "rgba(236,72,153,0.5)", fontSize: 11 }}>
                                        Inherited from {selectedActivity?.name || 'linked activity'}
                                    </Typography>
                                    {inheritedCrew.map((crew: any) => {
                                        const crewName = crew.label || crew.job_role?.display_name || crew.job_role?.name || crew.name || 'Crew';
                                        const crewRole = crew.job_role?.display_name || crew.job_role?.name;
                                        const crewColor = crew.crew_member?.crew_color;
                                        return (
                                            <Box
                                                key={`inherited-crew-${crew.id}`}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    bgcolor: "rgba(236,72,153,0.06)",
                                                    border: "1px solid rgba(236,72,153,0.12)",
                                                    borderRadius: 1,
                                                    px: 1.5,
                                                    py: 0.75,
                                                }}
                                            >
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: crewColor || 'rgba(236,72,153,0.5)', flexShrink: 0 }} />
                                                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500, flex: 1 }}>
                                                    {crewName}
                                                </Typography>
                                                {crewRole && (
                                                    <Box sx={{
                                                        bgcolor: 'rgba(236,72,153,0.15)',
                                                        color: '#f9a8d4',
                                                        px: 0.75,
                                                        py: 0.15,
                                                        borderRadius: 0.5,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                    }}>
                                                        {crewRole}
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </>
                            ) : (
                                <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 1, px: 1.5, py: 1 }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: 'italic' }}>
                                        {selectedActivity ? 'No crew assigned to this activity.' : 'Link an activity above to inherit crew.'}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Button onClick={onClear} disabled={isSaving} sx={{ color: "#FF6B9D" }}>
                        Clear Settings
                    </Button>
                    <Button
                        onClick={handleAddToLibrary}
                        disabled={isSaving || isLibraryAdding}
                        variant="outlined"
                        sx={{ color: "#4CAF50", borderColor: "#4CAF50", '&:hover': { borderColor: '#43a047', bgcolor: 'rgba(76,175,80,0.1)' } }}
                    >
                        {isLibraryAdding ? 'Adding…' : 'Add to Library'}
                    </Button>
                    {libraryMessage && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{libraryMessage}</Typography>
                    )}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        variant="contained"
                        disabled={isSaving}
                        sx={{ bgcolor: "#7B61FF", '&:hover': { bgcolor: '#6b55e0' } }}
                    >
                        Save Settings
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default SceneRecordingSetupModal;
