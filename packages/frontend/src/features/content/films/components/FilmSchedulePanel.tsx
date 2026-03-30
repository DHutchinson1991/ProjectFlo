"use client";

import React from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { EventDayManager } from "@/features/workflow/scheduling/package-template";
import { VisualTimeline } from "@/features/workflow/scheduling/shared";
import type { FilmSchedulePanelProps } from "../types/schedule-panel.types";
import type { VisualTimelineScene } from "../types/schedule-panel.types";
import { suggestNextStartTime } from "../utils/schedule-helpers";
import { ScheduleHeaderBar } from "./ScheduleHeaderBar";
import { ScheduleStatsBar } from "./ScheduleStatsBar";
import { useScheduleData } from "../hooks/useScheduleData";
import { useSchedulePresets } from "../hooks/useSchedulePresets";
import { useScheduleActions } from "../hooks/useScheduleActions";
import { useSchedulePresetActions } from "../hooks/useSchedulePresetActions";
import { useScheduleStats } from "../hooks/useScheduleStats";
import { ScheduleActivitiesBar } from "./ScheduleActivitiesBar";
import { SchedulePresetBar } from "./SchedulePresetBar";
import SceneScheduleRow from "./SceneScheduleRow";

export const FilmSchedulePanel: React.FC<FilmSchedulePanelProps> = ({
  filmId, scenes, brandId, filmName, mode = "film", contextId,
  packageId, readOnly = false, onScheduleChange, showEventDayManager = false,
}) => {
  const scheduleData = useScheduleData({ filmId, scenes, brandId, mode, contextId, packageId });
  const { eventDays, setEventDays, scheduleMap, setScheduleMap, filmScenes, setFilmScenes,
    loading, error, setError, dirty, setDirty, activities, history, future,
    resolvedScenes, orderedScenes, pushHistorySnapshot, handleUndo, handleRedo } = scheduleData;

  const presets = useSchedulePresets(brandId);
  const { presetList, selectedPresetId, setSelectedPresetId, presetNameDraft, setPresetNameDraft, loadPresets } = presets;

  const {
    expandedScenes, saving, rippleEnabled, setRippleEnabled, lockedScenes, creatingSceneForActivity,
    handleSceneScheduleChange, handleToggleLock, toggleExpand, handleSave, handleCreateSceneFromActivity,
  } = useScheduleActions({
    filmId, mode, contextId, orderedScenes, scheduleMap, setScheduleMap,
    filmScenes, setFilmScenes, setDirty, setError, pushHistorySnapshot, onScheduleChange,
  });

  const presetActions = useSchedulePresetActions({
    brandId, presetList, selectedPresetId, setSelectedPresetId,
    presetNameDraft, setPresetNameDraft, scheduleMap, setScheduleMap,
    setDirty, setError, pushHistorySnapshot, loadPresets,
  });

  const { totalMinutes, scheduledCount, conflictInfo, conflictCount, crossFilmScenes } =
    useScheduleStats(resolvedScenes, scheduleMap, filmId, filmName);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", p: 2 }}>
        <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.4)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ScheduleHeaderBar
        readOnly={readOnly}
        dirty={dirty}
        saving={saving}
        rippleEnabled={rippleEnabled}
        historyLength={history.length}
        futureLength={future.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleRipple={() => setRippleEnabled((v) => !v)}
        onSave={handleSave}
      />

      {!readOnly && (
        <SchedulePresetBar
          presetList={presetList}
          selectedPresetId={selectedPresetId}
          presetNameDraft={presetNameDraft}
          onPresetSelect={(id) => {
            setSelectedPresetId(id);
            const selected = presetList.find((p) => p.id === id);
            setPresetNameDraft(selected?.name ?? "");
          }}
          onNameChange={setPresetNameDraft}
          onSave={presetActions.handleSavePreset}
          onApply={presetActions.handleApplyPreset}
          onRename={presetActions.handleRenamePreset}
          onDelete={presetActions.handleDeletePreset}
        />
      )}

      <ScheduleStatsBar
        scheduledCount={scheduledCount}
        totalScenes={scenes.length}
        totalMinutes={totalMinutes}
        conflictCount={conflictCount}
      />

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mx: 1, mt: 0.5, fontSize: "10px", py: 0 }}>
          {error}
        </Alert>
      )}

      {/* Event Day Manager (compact, in panel header area) */}
      {showEventDayManager && brandId && (
        <Box
          sx={{
            px: 1,
            py: 0.75,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <EventDayManager
            brandId={brandId}
            eventDays={eventDays}
            crossFilmScenes={crossFilmScenes}
            onEventDaysChange={setEventDays}
            compact
            readOnly={readOnly || (mode === "film" && !!packageId)}
            packageId={packageId ?? undefined}
          />
        </Box>
      )}

      {/* Visual Timeline */}
      {resolvedScenes.some((s) => scheduleMap.get(s.id)?.scheduled_start_time) && (
        <Box
          sx={{
            px: 1,
            py: 0.75,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
            maxHeight: 200,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <VisualTimeline
            scenes={resolvedScenes.map((scene) => {
              const sched = scheduleMap.get(scene.id);
              return {
                scene_id: scene.id,
                scene_name: scene.name,
                scene_mode: scene.mode,
                event_day_name: sched?.event_day?.name ?? null,
                event_day_template_id: sched?.event_day_template_id ?? null,
                scheduled_start_time: sched?.scheduled_start_time ?? null,
                scheduled_duration_minutes: sched?.scheduled_duration_minutes ?? null,
                moment_schedules: sched?.moment_schedules as VisualTimelineScene["moment_schedules"],
                beat_schedules: sched?.beat_schedules as VisualTimelineScene["beat_schedules"],
                moments: scene.moments,
                beats: scene.beats,
              };
            })}
            eventDays={eventDays}
          />
        </Box>
      )}

      {/* Activities bar — package mode only */}
      {mode === "package" && activities.length > 0 && (
        <Box
          sx={{
            px: 1,
            py: 0.75,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <ScheduleActivitiesBar
            activities={activities}
            scheduleMap={scheduleMap}
            creatingSceneForActivity={creatingSceneForActivity}
            readOnly={readOnly}
            onCreateSceneFromActivity={handleCreateSceneFromActivity}
          />
        </Box>
      )}

      {/* Scene list */}
      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {resolvedScenes.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography sx={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
              No scenes yet.{mode === "package" && activities.length > 0 ? " Create scenes from activities above." : " Add scenes to set up scheduling."}
            </Typography>
          </Box>
        ) : (
          resolvedScenes
            .sort((a, b) => a.order_index - b.order_index)
            .map((scene) => {
              const sched = scheduleMap.get(scene.id);
              const suggested = suggestNextStartTime(
                sched?.event_day_template_id,
                resolvedScenes,
                scheduleMap,
                scene.id,
              );
              return (
                <SceneScheduleRow
                  key={scene.id}
                  scene={scene}
                  schedule={sched || null}
                  eventDays={eventDays}
                  expanded={expandedScenes.has(scene.id)}
                  onToggleExpand={() => toggleExpand(scene.id)}
                  onChange={handleSceneScheduleChange}
                  readOnly={readOnly}
                  suggestedStart={suggested}
                  locked={lockedScenes.has(scene.id)}
                  hasConflict={conflictInfo.get(scene.id)?.hasConflict ?? false}
                  conflictLabel={conflictInfo.get(scene.id)?.label ?? null}
                  onToggleLock={handleToggleLock}
                  activities={activities}
                />
              );
            })
        )}
      </Box>

      {/* Mode indicator */}
      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          {mode === "film" && "Film Defaults"}
          {mode === "package" && "Package Overrides"}
          {mode === "project" && "Project Schedule"}
        </Typography>
      </Box>
    </Box>
  );
};

export default FilmSchedulePanel;
