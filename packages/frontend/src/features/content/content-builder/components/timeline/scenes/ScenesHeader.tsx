"use client";

import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { TimelineScene } from "@/features/content/content-builder/types/timeline";
import { TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { ViewState } from "@/features/content/content-builder/types/timeline";
import MomentEditor from "../moments/MomentEditor";
import BeatEditor from "../beats/BeatEditor";
import { useSceneRecordingSetup, useSceneHeaderGroups, useSceneNameEditing } from "../../../hooks/scenes";
import { useSceneMomentInteractions } from "@/features/content/moments/hooks";
import { useSceneBeatInteractions } from "../../../hooks/beats";
import { useFilmSchedule } from "../../../hooks/data";
import { useBrand } from "@/features/platform/brand";
import { useContentBuilder } from "../../../context/ContentBuilderContext";
import { crewSlotsApi, scheduleApi } from "@/features/workflow/scheduling/api";
import SceneRecordingSetupModal from "./SceneRecordingSetupModal";
import SceneGroupHeader from "./SceneGroupHeader";

interface ScenesHeaderProps {
    scenes: TimelineScene[];
    viewState: ViewState;
    zoomLevel: number;
    tracks?: TimelineTrack[];
    onAddScene?: () => void;
    onReorderScene?: (direction: 'left' | 'right', sceneName: string) => void;
    onDeleteScene?: (sceneIds: number[]) => void | Promise<void>;
    onUpdateScene?: (scene: TimelineScene) => void;
    onMomentHover?: (momentId: number | null) => void;
}

/**
 * SceneHeaders component - displays scene titles and global moment headers
 */
const ScenesHeader: React.FC<ScenesHeaderProps> = ({
    scenes,
    viewState,
    zoomLevel,
    tracks = [],
    onAddScene,
    onReorderScene,
    onDeleteScene,
    onUpdateScene,
    onMomentHover
}) => {
    type SceneWithFilmId = TimelineScene & { film_id?: number };
    const {
        editingSceneName,
        sceneNameDraft,
        setSceneNameDraft,
        startSceneNameEdit,
        cancelSceneNameEdit,
        saveSceneNameEdit,
    } = useSceneNameEditing({ scenes, onUpdateScene });

    // State for Moment Editor
    const {
        recordingSetupOpen,
        recordingSetupSceneName,
        recordingSetupSceneLabel,
        recordingSetupSceneIds,
        selectedCameraTrackIds,
        setSelectedCameraTrackIds,
        selectedAudioTrackIds,
        setSelectedAudioTrackIds,
        graphicsEnabled,
        setGraphicsEnabled,
        isSavingRecordingSetup,
        sceneMusicEnabled,
        setSceneMusicEnabled,
        sceneMusicForm,
        setSceneMusicForm,
        musicError,
        videoTracks,
        audioTracks,
        graphicsTracks,
        toggleIdInList,
        openRecordingSetup,
        closeRecordingSetup,
        handleSaveRecordingSetup,
        handleClearRecordingSetup,
    } = useSceneRecordingSetup({ scenes, tracks, onUpdateScene });

    const {
        editingMoment,
        activeSceneForEdit,
        resizingMomentId,
        draggingMomentId,
        closeMomentEditor,
        handleResizeStart,
        handleMomentDragStart,
        handleMomentDragOver,
        handleMomentDrop,
        handleMomentClick,
        handleMomentSave,
        handleMomentRecordingSetupSave,
        handleClearMomentRecordingSetup,
    } = useSceneMomentInteractions({ zoomLevel, onUpdateScene });

    const {
        editingBeat,
        activeSceneForEdit: activeSceneForBeatEdit,
        closeBeatEditor,
        handleBeatClick,
        handleBeatSave,
        handleBeatDelete,
        handleAddBeat,
        draggingBeatId,
        handleBeatDragStart,
        handleBeatDragOver,
        handleBeatDrop,
    } = useSceneBeatInteractions({ onUpdateScene });

    const sceneGroups = useSceneHeaderGroups(scenes);
    const filmId = React.useMemo(() => (scenes[0] as SceneWithFilmId | undefined)?.film_id, [scenes]);
    const handleSceneLocationChange = React.useCallback((sceneId: number, locationAssignment: any | null) => {
        if (!onUpdateScene) return;
        const scene = scenes.find((candidate) => candidate.id === sceneId);
        if (!scene) return;
        onUpdateScene({ ...scene, location_assignment: locationAssignment } as TimelineScene);
    }, [onUpdateScene, scenes]);

    // ─── Package activities ───────────────────────────────────────────────
    const { packageId, trackDefaults } = useContentBuilder();
    const [packageActivities, setPackageActivities] = React.useState<Array<{
        id: number;
        name: string;
        color?: string | null;
        start_time?: string | null;
        end_time?: string | null;
        duration_minutes?: number | null;
        package_event_day_id: number;
        dayName?: string;
    }>>([]);
    const [packageSubjects, setPackageSubjects] = React.useState<any[]>([]);
    const [packageCrewSlots, setPackageCrewSlots] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (!packageId) return;
        let mounted = true;
        Promise.all([
            scheduleApi.packageActivities.getAll(packageId),
            scheduleApi.packageEventDays.getAll(packageId),
            scheduleApi.packageEventDaySubjects.getAll(packageId),
            crewSlotsApi.packageDay.getAll(packageId),
        ]).then(([acts, days, subjects, crewSlots]) => {
            if (!mounted) return;
            const dayNameMap = new Map<number, string>();
            const joinToTemplateMap = new Map<number, number>();
            days.forEach((d: any) => {
                const joinId = d._joinId ?? d.id;
                dayNameMap.set(joinId, d.name);
                // Map join-table ID → event_day_template_id so editors can compare with crewSlot.event_day_template_id
                if (d._joinId != null) joinToTemplateMap.set(d._joinId, d.id);
            });
            setPackageActivities((acts || []).map((a: any) => ({
                ...a,
                dayName: dayNameMap.get(a.package_event_day_id) ?? 'Day',
                event_day_template_id: joinToTemplateMap.get(a.package_event_day_id) ?? a.package_event_day_id,
            })));
            setPackageSubjects(subjects || []);
            setPackageCrewSlots(crewSlots || []);
        }).catch(() => {});
        return () => { mounted = false; };
    }, [packageId]);

    // ─── Schedule integration ────────────────────────────────────────────
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const {
        getSceneSchedule,
        updateSceneSchedule,
        saveSceneSchedule,
    } = useFilmSchedule(filmId ?? null, brandId ?? null, packageId ?? null);

    // Moment schedule
    const momentSceneId = activeSceneForEdit?.id;

    // Derive the activity linked to the moment's parent scene
    const momentSceneSchedule = React.useMemo(
        () => (momentSceneId ? getSceneSchedule(momentSceneId) : undefined),
        [momentSceneId, getSceneSchedule]
    );
    const momentActivity = React.useMemo(
        () => packageActivities.find(a => a.id === momentSceneSchedule?.package_activity_id) ?? null,
        [packageActivities, momentSceneSchedule]
    );

    const handleMomentSaveWithSchedule = React.useCallback(
        (moment: any) => {
            handleMomentSave(moment);
            if (momentSceneId) saveSceneSchedule(momentSceneId);
        },
        [handleMomentSave, momentSceneId, saveSceneSchedule]
    );

    // Beat schedule
    const beatSceneId = activeSceneForBeatEdit?.id;

    // Derive the activity linked to the beat's parent scene
    const beatSceneSchedule = React.useMemo(
        () => (beatSceneId ? getSceneSchedule(beatSceneId) : undefined),
        [beatSceneId, getSceneSchedule]
    );
    const beatActivity = React.useMemo(
        () => packageActivities.find(a => a.id === beatSceneSchedule?.package_activity_id) ?? null,
        [packageActivities, beatSceneSchedule]
    );

    const handleBeatSaveWithSchedule = React.useCallback(
        (beat: any) => {
            handleBeatSave(beat);
            if (beatSceneId) saveSceneSchedule(beatSceneId);
        },
        [handleBeatSave, beatSceneId, saveSceneSchedule]
    );

    // Scene-level schedule (for RecordingSetup modal)
    const sceneScheduleForSetup = React.useMemo(() => {
        if (!recordingSetupSceneIds.length) return null;
        return getSceneSchedule(recordingSetupSceneIds[0]) ?? null;
    }, [recordingSetupSceneIds, getSceneSchedule]);

    const handleSceneScheduleFieldChange = React.useCallback(
        (field: string, value: any) => {
            if (!recordingSetupSceneIds.length) return;
            updateSceneSchedule(recordingSetupSceneIds[0], { [field]: value });
        },
        [recordingSetupSceneIds, updateSceneSchedule]
    );

    const handleRecordingSetupSaveWithSchedule = React.useCallback(
        () => {
            handleSaveRecordingSetup();
            if (recordingSetupSceneIds.length) {
                saveSceneSchedule(recordingSetupSceneIds[0]);
            }
        },
        [handleSaveRecordingSetup, recordingSetupSceneIds, saveSceneSchedule]
    );

    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                height: "72px", // Increased height for Scene + Moment headers
                overflow: "hidden",
                display: "flex",
                alignItems: "stretch",
                backgroundColor: "#1E1E24",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                mb: 0,
            }}
        >
            <MomentEditor
                open={!!editingMoment}
                moment={editingMoment}
                allTracks={tracks}
                sceneRecordingSetup={activeSceneForEdit?.recording_setup || null}
                onClose={closeMomentEditor}
                onSave={handleMomentSaveWithSchedule}
                onUpsertRecordingSetup={handleMomentRecordingSetupSave as any}
                onClearRecordingSetup={handleClearMomentRecordingSetup}
                readOnly={false}
                mode="full"
                activity={momentActivity}
                activitySubjects={packageSubjects}
                activityCrewSlots={packageCrewSlots}
                trackDefaults={trackDefaults}
            />

            <BeatEditor
                open={!!editingBeat}
                beat={editingBeat}
                allTracks={tracks}
                sceneRecordingSetup={activeSceneForEdit?.recording_setup || null}
                onClose={closeBeatEditor}
                onSave={handleBeatSaveWithSchedule}
                onDelete={handleBeatDelete}
                activity={beatActivity}
                activitySubjects={packageSubjects}
                activityCrewSlots={packageCrewSlots}
            />

            <SceneRecordingSetupModal
                open={recordingSetupOpen}
                sceneName={recordingSetupSceneName}
                sceneLabel={recordingSetupSceneLabel}
                sceneIds={recordingSetupSceneIds}
                filmId={filmId}
                isSaving={isSavingRecordingSetup}
                videoTracks={videoTracks}
                audioTracks={audioTracks}
                graphicsTracks={graphicsTracks}
                selectedCameraTrackIds={selectedCameraTrackIds}
                selectedAudioTrackIds={selectedAudioTrackIds}
                graphicsEnabled={graphicsEnabled}
                sceneMusicEnabled={sceneMusicEnabled}
                sceneMusicForm={sceneMusicForm}
                musicError={musicError}
                onClose={closeRecordingSetup}
                onSave={handleRecordingSetupSaveWithSchedule}
                onClear={handleClearRecordingSetup}
                activities={packageActivities}
                activitySubjects={packageSubjects}
                activityCrewSlots={packageCrewSlots}
                sceneSchedule={sceneScheduleForSetup}
                onScheduleChange={handleSceneScheduleFieldChange}
                onToggleCameraTrack={(trackId) => setSelectedCameraTrackIds(prev => toggleIdInList(prev, trackId))}
                onToggleAudioTrack={(trackId) => setSelectedAudioTrackIds(prev => toggleIdInList(prev, trackId))}
                onGraphicsEnabledChange={setGraphicsEnabled}
                onSceneMusicEnabledChange={setSceneMusicEnabled}
                onSceneMusicFormChange={setSceneMusicForm}
            />

            {/* Scene group header labels */}
            <Box
                sx={{
                    position: "relative",
                    display: "flex",
                    width: "100%",
                    height: "100%",
                }}
            >
                {sceneGroups.length === 0 ? (
                    // Empty state
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 1 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>
                            No scenes yet
                        </Typography>
                        {onAddScene && (
                            <Tooltip title="Add First Scene">
                                <IconButton size="small" onClick={onAddScene} sx={{ color: "#7B61FF", bgcolor: "rgba(123,97,255,0.12)" }}>
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                ) : (
                    sceneGroups.map((group, idx) => {
                        const sceneSchedule = getSceneSchedule(group.primaryScene.id);
                        const scheduleStart = sceneSchedule?.scheduled_start_time ?? null;
                        const scheduleDuration = sceneSchedule?.scheduled_duration_minutes;
                        let scheduleEnd: string | null = null;
                        if (scheduleStart && scheduleDuration) {
                            const [h, m] = scheduleStart.split(":").map(Number);
                            if (!isNaN(h) && !isNaN(m)) {
                                const totalMins = h * 60 + m + scheduleDuration;
                                scheduleEnd = `${String(Math.floor(totalMins / 60) % 24).padStart(2, "0")}:${String(totalMins % 60).padStart(2, "0")}`;
                            }
                        }
                        // Show activity name on scene chip (prefer activity > event day fallback)
                        const activityName = sceneSchedule?.package_activity_id
                            ? packageActivities.find(a => a.id === sceneSchedule.package_activity_id)?.name ?? null
                            : null;

                        return (
                        <SceneGroupHeader
                            key={`${group.name}-${idx}`}
                            group={group}
                            index={idx}
                            sceneGroupsLength={sceneGroups.length}
                            scenes={scenes}
                            viewState={viewState}
                            zoomLevel={zoomLevel}
                            scheduleStartTime={scheduleStart}
                            scheduleEndTime={scheduleEnd}
                            scheduleEventDayName={activityName}
                            onReorderScene={onReorderScene}
                            onDeleteScene={onDeleteScene}
                            onUpdateScene={onUpdateScene}
                            onMomentHover={onMomentHover}
                            editingSceneName={editingSceneName}
                            sceneNameDraft={sceneNameDraft}
                            setSceneNameDraft={setSceneNameDraft}
                            startSceneNameEdit={startSceneNameEdit}
                            cancelSceneNameEdit={cancelSceneNameEdit}
                            saveSceneNameEdit={saveSceneNameEdit}
                            openRecordingSetup={openRecordingSetup}
                            resizingMomentId={resizingMomentId}
                            draggingMomentId={draggingMomentId}
                            onMomentDragStart={handleMomentDragStart}
                            onMomentDragOver={handleMomentDragOver}
                            onMomentDrop={handleMomentDrop}
                            onMomentClick={handleMomentClick}
                            onResizeStart={handleResizeStart}
                            onBeatClick={handleBeatClick}
                            onAddBeat={handleAddBeat}
                            draggingBeatId={draggingBeatId}
                            onBeatDragStart={handleBeatDragStart}
                            onBeatDragOver={handleBeatDragOver}
                            onBeatDrop={handleBeatDrop}
                        />
                        );
                    })
                )}
            </Box>
        </Box>
    );
};

export default ScenesHeader;
