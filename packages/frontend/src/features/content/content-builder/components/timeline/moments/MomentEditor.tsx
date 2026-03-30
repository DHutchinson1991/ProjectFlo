"use client";

import React from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Button, Typography, Stack, IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useMomentForm } from "@/features/content/moments/hooks";
import type { MomentFormData } from "@/features/content/moments/types";
import { MomentEditorFields } from "./MomentEditorFields";
import { TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { useMomentEditorState, shotTypes, formatShotLabel, fmtTime, type MomentEditorActivity } from "./useMomentEditorState";
import { MomentRecordingSetupSection } from "./MomentRecordingSetupSection";
import { MomentMusicSection } from "./MomentMusicSection";

interface MomentEditorProps {
    open: boolean;
    anchorEl?: HTMLElement | null;
    moment: MomentFormData | null;
    allTracks?: TimelineTrack[];
    sceneRecordingSetup?: {
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        camera_assignments?: Array<{ track_id: number }>;
    } | null;
    onClose: () => void;
    onSave: (moment: MomentFormData) => void;
    onDelete?: (momentId?: number) => void;
    onClearRecordingSetup?: (momentId?: number) => void | Promise<void>;
    onUpsertRecordingSetup?: (momentId: number, data: { camera_track_ids?: number[]; camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>; audio_track_ids?: number[]; graphics_enabled?: boolean; graphics_title?: string | null }) => Promise<void> | void;
    readOnly?: boolean;
    mode?: "full" | "track";
    trackLabel?: string;
    trackKey?: string;
    onRemoveTrack?: (momentId?: number, trackKey?: string) => void;
    activity?: MomentEditorActivity | null;
    /** All package subjects (will be filtered to activity-inherited) */
    activitySubjects?: any[];
    /** All package crew slots (will be filtered to activity-inherited) */
    activityCrewSlots?: any[];
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
    activityCrewSlots = [],
    trackDefaults = {},
}) => {
    const {
        editName, setEditName,
        editDuration, setEditDuration,
        errors,
        isTrackMode,
        effectiveTrackKey, effectiveTrackLabel,
        trackIsAssigned,
        handleSave,
        handleDelete,
        handleRemoveTrackClick,
    } = useMomentForm({ moment, open, onClose, onSave, onDelete, trackLabel, trackKey, onRemoveTrack, mode });

    const isMusicTrack = [effectiveTrackKey, effectiveTrackLabel]
        .filter(Boolean)
        .some(v => v!.toString().toLowerCase().includes("music"));
    const sceneId = (moment as any)?.film_scene_id as number | undefined;
    const hasRecordingSetup = !!(moment as any)?.recording_setup || !!(moment as any)?.has_recording_setup;

    const {
        selectedCameraTrackIds, setSelectedCameraTrackIds,
        selectedAudioTrackIds, setSelectedAudioTrackIds,
        cameraSubjectSelections, setCameraSubjectSelections,
        graphicsEnabled, setGraphicsEnabled,
        graphicsTitle, setGraphicsTitle,
        cameraShotSelections, setCameraShotSelections,
        isSavingSetup,
        setIsSetupDirty,
        sceneMusicEnabled, setSceneMusicEnabled,
        momentMusicEnabled, setMomentMusicEnabled,
        sceneMusicForm, setSceneMusicForm,
        momentMusicForm, setMomentMusicForm,
        musicError,
        isSavingMusic, isMusicLoading,
        inheritedSubjects, inheritedCrew,
        videoTracks, audioTracks, graphicsTracks,
        getTrackEquipmentLabel, toggleIdInList,
        handleSaveSceneMusic, handleSaveMomentMusic, handleSaveWithSetup,
    } = useMomentEditorState({
        moment, open, allTracks, sceneRecordingSetup, trackDefaults,
        activity, activitySubjects, activityCrewSlots,
        onUpsertRecordingSetup, readOnly,
        isMusicTrack, sceneId, handleSave,
    });

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
                display: "flex", justifyContent: "space-between", alignItems: "center",
                color: "white", fontSize: "1rem", fontWeight: 600, pb: 1,
            }}>
                {isTrackMode ? "Track Assignment" : "Edit Moment"}
                <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.5)" }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {isTrackMode ? (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.5 }}>Moment</Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: "0.95rem" }}>{editName || moment?.name || "Untitled Moment"}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.5 }}>Track</Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{effectiveTrackLabel}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.5 }}>Duration</Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>{editDuration ? `${editDuration} seconds` : "Not set"}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.5 }}>Status</Typography>
                            <Typography sx={{ color: trackIsAssigned ? "#4ECDC4" : "#FF6B6B", fontWeight: 600 }}>
                                {trackIsAssigned ? "Included on this track" : "Not assigned to this track"}
                            </Typography>
                        </Box>
                    </Stack>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: activity ? "1fr 260px" : "1fr", gap: 2.5, mt: 1 }}>
                        {/* ─── LEFT COLUMN ─── */}
                        <Stack spacing={3}>
                            <MomentEditorFields
                                name={editName}
                                duration={editDuration}
                                errors={errors}
                                readOnly={readOnly}
                                onNameChange={setEditName}
                                onDurationChange={setEditDuration}
                            />
                            <MomentRecordingSetupSection
                                videoTracks={videoTracks}
                                audioTracks={audioTracks}
                                graphicsTracks={graphicsTracks}
                                selectedCameraTrackIds={selectedCameraTrackIds}
                                selectedAudioTrackIds={selectedAudioTrackIds}
                                cameraSubjectSelections={cameraSubjectSelections}
                                cameraShotSelections={cameraShotSelections}
                                graphicsEnabled={graphicsEnabled}
                                graphicsTitle={graphicsTitle}
                                inheritedSubjects={inheritedSubjects}
                                shotTypes={shotTypes}
                                formatShotLabel={formatShotLabel}
                                getTrackEquipmentLabel={getTrackEquipmentLabel}
                                onSetDirty={() => setIsSetupDirty(true)}
                                onCameraTrackToggle={(id) => setSelectedCameraTrackIds(prev => toggleIdInList(prev, id))}
                                onAudioTrackToggle={(id) => setSelectedAudioTrackIds(prev => toggleIdInList(prev, id))}
                                onSubjectChange={(trackId, value) => setCameraSubjectSelections(prev => ({ ...prev, [trackId]: value }))}
                                onShotChange={(trackId, value) => setCameraShotSelections(prev => ({ ...prev, [trackId]: value }))}
                                onGraphicsToggle={setGraphicsEnabled}
                                onGraphicsTitleChange={setGraphicsTitle}
                            />
                            <MomentMusicSection
                                isMusicTrack={isMusicTrack}
                                sceneMusicEnabled={sceneMusicEnabled}
                                momentMusicEnabled={momentMusicEnabled}
                                sceneMusicForm={sceneMusicForm}
                                momentMusicForm={momentMusicForm}
                                musicError={musicError}
                                isMusicLoading={isMusicLoading}
                                isSavingMusic={isSavingMusic}
                                onSceneMusicToggle={setSceneMusicEnabled}
                                onMomentMusicToggle={setMomentMusicEnabled}
                                onSceneMusicFormChange={(patch) => setSceneMusicForm(prev => ({ ...prev, ...patch }))}
                                onMomentMusicFormChange={(patch) => setMomentMusicForm(prev => ({ ...prev, ...patch }))}
                                onSaveSceneMusic={handleSaveSceneMusic}
                                onSaveMomentMusic={handleSaveMomentMusic}
                            />
                        </Stack>

                        {/* ─── RIGHT COLUMN: Activity Context ─── */}
                        {activity && (
                            <Stack spacing={2} sx={{ borderLeft: "1px solid rgba(255,255,255,0.06)", pl: 2 }}>
                                <Box sx={{ bgcolor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 1, px: 1.5, py: 1.25 }}>
                                    <Typography sx={{ fontSize: 10, color: "rgba(245,158,11,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, mb: 0.75 }}>
                                        Inherited from activity
                                    </Typography>
                                    <Typography sx={{ fontSize: 13, color: "rgba(245,158,11,1)", fontWeight: 700 }}>{activity.name}</Typography>
                                    {(activity.start_time || activity.end_time) && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                            <Typography sx={{ fontSize: 12, color: "rgba(245,158,11,0.85)", fontWeight: 600 }}>
                                                {fmtTime(activity.start_time)}{activity.end_time && ` – ${fmtTime(activity.end_time)}`}
                                            </Typography>
                                            {(activity.duration_minutes ?? 0) > 0 && (
                                                <Box sx={{ bgcolor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 0.75, px: 0.75, py: 0.25 }}>
                                                    <Typography sx={{ fontSize: 11, color: "rgba(245,158,11,0.85)", fontWeight: 600 }}>{activity.duration_minutes}m</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                {inheritedSubjects.length > 0 && (
                                    <Box>
                                        <Typography sx={{ fontSize: 10, color: "rgba(167,139,250,0.6)", textTransform: "uppercase", fontWeight: 700, mb: 0.75, letterSpacing: "0.05em" }}>
                                            {inheritedSubjects.length} Subject{inheritedSubjects.length !== 1 && "s"}
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            {inheritedSubjects.map((s: any) => (
                                                <Box key={s.id} sx={{ bgcolor: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: 0.75, px: 1, py: 0.5 }}>
                                                    <Typography sx={{ fontSize: 12, color: "#c4b5fd", fontWeight: 500 }}>{s.name}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {inheritedCrew.length > 0 && (
                                    <Box>
                                        <Typography sx={{ fontSize: 10, color: "rgba(236,72,153,0.6)", textTransform: "uppercase", fontWeight: 700, mb: 0.75, letterSpacing: "0.05em" }}>
                                            {inheritedCrew.length} Crew
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            {inheritedCrew.map((o: any) => (
                                                <Box key={o.id} sx={{ bgcolor: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.12)", borderRadius: 0.75, px: 1, py: 0.5 }}>
                                                    <Typography sx={{ fontSize: 12, color: "#f9a8d4", fontWeight: 500 }}>
                                                        {o.label || o.job_role?.display_name || o.job_role?.name || o.name || "Crew"}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {!inheritedSubjects.length && !inheritedCrew.length && (
                                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                                        No subjects or crew assigned to this activity.
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
                {isTrackMode ? (
                    <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                        <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>Close</Button>
                        {!readOnly && onRemoveTrack && effectiveTrackKey && (
                            <Button
                                onClick={handleRemoveTrackClick}
                                variant="contained"
                                disabled={!trackIsAssigned}
                                sx={{ bgcolor: "#FF6B6B", color: "white", "&:hover": { bgcolor: "#e45a5a" } }}
                            >
                                Remove From Track
                            </Button>
                        )}
                    </Box>
                ) : (
                    <>
                        {!readOnly && onDelete && (
                            <Button
                                onClick={handleDelete}
                                startIcon={<DeleteIcon />}
                                sx={{ color: "#ff6b6b", "&:hover": { bgcolor: "rgba(255, 107, 107, 0.1)" } }}
                            >
                                Delete
                            </Button>
                        )}
                        {!readOnly && onClearRecordingSetup && hasRecordingSetup && (
                            <Button
                                onClick={() => { onClearRecordingSetup(moment.id); onClose(); }}
                                sx={{ color: "#FFD166", "&:hover": { bgcolor: "rgba(255, 209, 102, 0.12)" } }}
                            >
                                Clear Override
                            </Button>
                        )}
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>Cancel</Button>
                            {!readOnly && (
                                <Button
                                    onClick={handleSaveWithSetup}
                                    variant="contained"
                                    disabled={Object.keys(errors).length > 0 || isSavingSetup}
                                    sx={{ bgcolor: "#7B61FF", color: "white", "&:hover": { bgcolor: "#6b4dd9" } }}
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

