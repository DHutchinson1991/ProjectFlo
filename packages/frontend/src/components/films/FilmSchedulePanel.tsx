"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Collapse,
  CircularProgress,
  Alert,
  FormControl,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  WarningAmber as WarningIcon,
  AccessTime as TimeIcon,
  Timer as DurationIcon,
  Info as InfoIcon,
  ArrowForward as ArrowIcon,
  Add as AddIcon,
  Movie as MovieIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { EventDayManager } from "@/components/schedule";
import type { EventDayFilmScene } from "@/components/schedule";
import VisualTimeline from "@/components/schedule/VisualTimeline";
import type { VisualTimelineScene } from "@/components/schedule/VisualTimeline";

// ─── Types ──────────────────────────────────────────────────────────────

interface EventDayTemplate {
  id: number;
  name: string;
  description?: string | null;
  order_index: number;
}

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

interface SceneSchedule {
  id?: number;
  scene_id: number;
  event_day_template_id?: number | null;
  package_activity_id?: number | null;
  scheduled_start_time?: string | null;
  scheduled_duration_minutes?: number | null;
  moment_schedules?: MomentScheduleItem[] | null;
  beat_schedules?: BeatScheduleItem[] | null;
  notes?: string | null;
  event_day?: EventDayTemplate | null;
}

/** Lightweight activity record for the scene→activity dropdown */
interface ActivityOption {
  id: number;
  name: string;
  color?: string | null;
  package_event_day_id: number;
  start_time?: string | null;
  end_time?: string | null;
}

interface Scene {
  id: number;
  name: string;
  mode: "MOMENTS" | "MONTAGE";
  order_index: number;
  duration_seconds?: number | null;
  moments?: Array<{ id: number; name: string; order_index: number; duration: number }>;
  beats?: Array<{ id: number; name: string; order_index: number; duration_seconds: number }>;
  schedule?: SceneSchedule | null;
}

interface SchedulePreset {
  id: number;
  name: string;
  schedule_data: SceneSchedule[];
}

interface FilmSchedulePanelProps {
  filmId: number;
  scenes: Scene[];
  brandId?: number;
  /** Film name for cross-film display in EventDayManager */
  filmName?: string;
  /** "film" = editing film defaults, "package" = package overrides, "project" = project schedule */
  mode?: "film" | "package" | "project";
  /** For package/project mode: the packageFilmId or projectFilmId */
  contextId?: number;
  /** Package ID — used in package mode to load package-specific event days */
  packageId?: number | null;
  readOnly?: boolean;
  onScheduleChange?: () => void;
  /** Whether to show the Event Day Manager section */
  showEventDayManager?: boolean;
}

// ─── Helper Functions ───────────────────────────────────────────────────

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Calculate end time from start_time (HH:MM) + duration_minutes.
 * Returns HH:MM string or null if either input is missing.
 */
function calculateEndTime(startTime: string | null | undefined, durationMinutes: number | null | undefined): string | null {
  if (!startTime || !durationMinutes) return null;
  const [hours, minutes] = startTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function addMinutesToTime(time: string | null | undefined, deltaMinutes: number): string | null {
  const mins = parseTimeToMinutes(time);
  if (mins === null) return null;
  const total = ((mins + deltaMinutes) % (24 * 60) + (24 * 60)) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function cloneScheduleMap(input: Map<number, SceneSchedule>): Map<number, SceneSchedule> {
  const cloned = new Map<number, SceneSchedule>();
  input.forEach((value, key) => {
    cloned.set(key, {
      ...value,
      moment_schedules: value.moment_schedules ? [...value.moment_schedules] : value.moment_schedules,
      beat_schedules: value.beat_schedules ? [...value.beat_schedules] : value.beat_schedules,
    });
  });
  return cloned;
}

/**
 * For a given event day, find the next available start time based on
 * the latest ending scene on that day.
 */
function suggestNextStartTime(
  eventDayId: number | null | undefined,
  scenes: Scene[],
  scheduleMap: Map<number, SceneSchedule>,
  excludeSceneId?: number,
): string | null {
  if (!eventDayId) return null;

  let latestEnd: string | null = null;
  for (const scene of scenes) {
    if (scene.id === excludeSceneId) continue;
    const sched = scheduleMap.get(scene.id);
    if (sched?.event_day_template_id === eventDayId && sched.scheduled_start_time && sched.scheduled_duration_minutes) {
      const end = calculateEndTime(sched.scheduled_start_time, sched.scheduled_duration_minutes);
      if (end && (!latestEnd || end > latestEnd)) {
        latestEnd = end;
      }
    }
  }
  return latestEnd;
}

function getTotalScheduledMinutes(scenes: Scene[], scheduleMap: Map<number, SceneSchedule>): number {
  let total = 0;
  for (const scene of scenes) {
    const sched = scheduleMap.get(scene.id);
    if (sched?.scheduled_duration_minutes) {
      total += sched.scheduled_duration_minutes;
    }
  }
  return total;
}

// ─── Scene Schedule Row ─────────────────────────────────────────────────

interface SceneScheduleRowProps {
  scene: Scene;
  schedule: SceneSchedule | null;
  eventDays: EventDayTemplate[];
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (sceneId: number, updates: Partial<SceneSchedule>) => void;
  readOnly?: boolean;
  inheritedFrom?: "film" | "package" | null;
  /** Suggested start time based on previous scene end */
  suggestedStart?: string | null;
  locked?: boolean;
  hasConflict?: boolean;
  conflictLabel?: string | null;
  onToggleLock?: (sceneId: number) => void;
  /** Activities for package mode — shown as dropdown */
  activities?: ActivityOption[];
}

const SceneScheduleRow: React.FC<SceneScheduleRowProps> = ({
  scene,
  schedule,
  eventDays,
  expanded,
  onToggleExpand,
  onChange,
  readOnly = false,
  inheritedFrom = null,
  suggestedStart = null,
  locked = false,
  hasConflict = false,
  conflictLabel = null,
  onToggleLock,
  activities = [],
}) => {
  const endTime = calculateEndTime(
    schedule?.scheduled_start_time,
    schedule?.scheduled_duration_minutes,
  );

  const eventDayName = eventDays.find(ed => ed.id === schedule?.event_day_template_id)?.name ?? null;

  // Activity info for this scene's schedule
  const assignedActivity = activities.find(a => a.id === schedule?.package_activity_id) ?? null;

  // Filter activities to those on the same event day (if an event day is selected)
  const availableActivities = useMemo(() => {
    if (!schedule?.event_day_template_id || activities.length === 0) return activities;
    return activities.filter(a => a.package_event_day_id === schedule.event_day_template_id ||
      // Also show the currently assigned activity even if on a different day (shouldn't happen but be safe)
      a.id === schedule?.package_activity_id
    );
  }, [activities, schedule?.event_day_template_id, schedule?.package_activity_id]);

  // Auto-assign event day when there's only one option and none is selected
  React.useEffect(() => {
    if (eventDays.length === 1 && !schedule?.event_day_template_id && !readOnly) {
      onChange(scene.id, { event_day_template_id: eventDays[0].id });
    }
  }, [eventDays, schedule?.event_day_template_id, readOnly, scene.id, onChange]);

  const handleTimeChange = (value: string) => {
    onChange(scene.id, { scheduled_start_time: value || null });
  };

  const handleDurationChange = (value: string) => {
    const mins = parseInt(value, 10);
    onChange(scene.id, { scheduled_duration_minutes: isNaN(mins) ? null : mins });
  };

  const handleEventDayChange = (value: string) => {
    onChange(scene.id, {
      event_day_template_id: value ? parseInt(value, 10) : null,
    });
  };

  const applyQuickShift = (delta: number) => {
    const next = addMinutesToTime(schedule?.scheduled_start_time, delta);
    if (next) {
      onChange(scene.id, { scheduled_start_time: next });
    }
  };

  const applySuggestedStart = () => {
    if (!suggestedStart) return;
    onChange(scene.id, { scheduled_start_time: suggestedStart });
  };

  const autoDistributeChildren = () => {
    const sceneStart = schedule?.scheduled_start_time;
    const totalDuration = schedule?.scheduled_duration_minutes;
    const startMins = parseTimeToMinutes(sceneStart);
    if (startMins === null || !totalDuration || totalDuration <= 0) return;

    if (scene.mode === "MOMENTS" && scene.moments && scene.moments.length > 0) {
      const items = [...scene.moments].sort((a, b) => a.order_index - b.order_index);
      const each = Math.floor(totalDuration / items.length);
      const remainder = totalDuration % items.length;
      let cursor = startMins;
      const schedules: MomentScheduleItem[] = items.map((moment, idx) => {
        const dur = each + (idx < remainder ? 1 : 0);
        const h = Math.floor(cursor / 60) % 24;
        const m = cursor % 60;
        const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        cursor += dur;
        return { moment_id: moment.id, start_time: start, duration_minutes: dur };
      });
      onChange(scene.id, { moment_schedules: schedules });
      return;
    }

    if (scene.mode === "MONTAGE" && scene.beats && scene.beats.length > 0) {
      const items = [...scene.beats].sort((a, b) => a.order_index - b.order_index);
      const each = Math.floor(totalDuration / items.length);
      const remainder = totalDuration % items.length;
      let cursor = startMins;
      const schedules: BeatScheduleItem[] = items.map((beat, idx) => {
        const dur = each + (idx < remainder ? 1 : 0);
        const h = Math.floor(cursor / 60) % 24;
        const m = cursor % 60;
        const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        cursor += dur;
        return { beat_id: beat.id, start_time: start, duration_minutes: dur };
      });
      onChange(scene.id, { beat_schedules: schedules });
    }
  };

  const status: "scheduled" | "missing-time" | "no-day" =
    schedule?.event_day_template_id && schedule?.scheduled_start_time
      ? "scheduled"
      : schedule?.event_day_template_id && !schedule?.scheduled_start_time
        ? "missing-time"
        : "no-day";

  const handleMomentScheduleChange = (
    momentId: number,
    field: "start_time" | "duration_minutes",
    value: string
  ) => {
    const current: MomentScheduleItem[] = Array.isArray(schedule?.moment_schedules)
      ? [...(schedule!.moment_schedules as MomentScheduleItem[])]
      : [];

    const idx = current.findIndex(m => m.moment_id === momentId);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        [field]: field === "duration_minutes" ? (parseInt(value, 10) || null) : (value || null),
      };
    } else {
      current.push({
        moment_id: momentId,
        start_time: field === "start_time" ? (value || null) : null,
        duration_minutes: field === "duration_minutes" ? (parseInt(value, 10) || null) : null,
      });
    }
    onChange(scene.id, { moment_schedules: current });
  };

  const handleBeatScheduleChange = (
    beatId: number,
    field: "start_time" | "duration_minutes",
    value: string
  ) => {
    const current: BeatScheduleItem[] = Array.isArray(schedule?.beat_schedules)
      ? [...(schedule!.beat_schedules as BeatScheduleItem[])]
      : [];

    const idx = current.findIndex(b => b.beat_id === beatId);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        [field]: field === "duration_minutes" ? (parseInt(value, 10) || null) : (value || null),
      };
    } else {
      current.push({
        beat_id: beatId,
        start_time: field === "start_time" ? (value || null) : null,
        duration_minutes: field === "duration_minutes" ? (parseInt(value, 10) || null) : null,
      });
    }
    onChange(scene.id, { beat_schedules: current });
  };

  const getMomentSchedule = (momentId: number): MomentScheduleItem | undefined => {
    if (!Array.isArray(schedule?.moment_schedules)) return undefined;
    return (schedule!.moment_schedules as MomentScheduleItem[]).find(m => m.moment_id === momentId);
  };

  const getBeatSchedule = (beatId: number): BeatScheduleItem | undefined => {
    if (!Array.isArray(schedule?.beat_schedules)) return undefined;
    return (schedule!.beat_schedules as BeatScheduleItem[]).find(b => b.beat_id === beatId);
  };

  return (
    <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Scene Row Header — compact, scannable */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          py: 0.75,
          px: 1,
          "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
          cursor: "pointer",
        }}
        onClick={onToggleExpand}
      >
        {/* Expand toggle */}
        <Box sx={{ width: 16, flexShrink: 0 }}>
          <IconButton size="small" sx={{ p: 0, color: "rgba(255,255,255,0.4)" }}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Box>

        {/* Scene name */}
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {scene.name}
        </Typography>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Event day chip (compact) */}
        {eventDayName && (
          <Chip
            label={eventDayName}
            size="small"
            sx={{
              height: 18,
              fontSize: "8px",
              fontWeight: 600,
              bgcolor: "rgba(168,85,247,0.15)",
              color: "#c084fc",
              border: "1px solid rgba(168,85,247,0.25)",
              "& .MuiChip-label": { px: 0.75 },
              maxWidth: 80,
            }}
          />
        )}

        {/* Activity chip (compact) */}
        {assignedActivity && (
          <Chip
            label={assignedActivity.name}
            size="small"
            sx={{
              height: 18,
              fontSize: "8px",
              fontWeight: 600,
              bgcolor: `${assignedActivity.color || "#f59e0b"}18`,
              color: assignedActivity.color || "#f59e0b",
              border: `1px solid ${assignedActivity.color || "#f59e0b"}40`,
              "& .MuiChip-label": { px: 0.75 },
              maxWidth: 90,
            }}
          />
        )}

        {/* Time range chip */}
        {schedule?.scheduled_start_time && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
            <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "rgba(245,158,11,0.8)", fontFamily: "monospace" }}>
              {schedule.scheduled_start_time}
            </Typography>
            {endTime && (
              <>
                <ArrowIcon sx={{ fontSize: 8, color: "rgba(59,130,246,0.5)" }} />
                <Typography sx={{ fontSize: "9px", fontWeight: 600, color: "rgba(59,130,246,0.7)", fontFamily: "monospace" }}>
                  {endTime}
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Inherited indicator */}
        {inheritedFrom && (
          <Tooltip title={`Inherited from ${inheritedFrom}`}>
            <InfoIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
          </Tooltip>
        )}

        <Chip
          size="small"
          label={status === "scheduled" ? "Scheduled" : status === "missing-time" ? "Missing time" : "No day"}
          sx={{
            height: 16,
            fontSize: "8px",
            fontWeight: 700,
            bgcolor:
              status === "scheduled"
                ? "rgba(16,185,129,0.16)"
                : status === "missing-time"
                  ? "rgba(245,158,11,0.16)"
                  : "rgba(255,255,255,0.08)",
            color:
              status === "scheduled"
                ? "rgba(16,185,129,0.95)"
                : status === "missing-time"
                  ? "rgba(245,158,11,0.95)"
                  : "rgba(255,255,255,0.6)",
            "& .MuiChip-label": { px: 0.6 },
          }}
        />

        {onToggleLock && (
          <Tooltip title={locked ? "Unlock ripple" : "Lock from ripple"}>
            <IconButton
              size="small"
              sx={{ p: 0.25, color: locked ? "#f59e0b" : "rgba(255,255,255,0.35)" }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(scene.id);
              }}
            >
              {locked ? <LockIcon sx={{ fontSize: 12 }} /> : <LockOpenIcon sx={{ fontSize: 12 }} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Expandable: schedule fields */}
      <Collapse in={expanded}>
        <Box sx={{ px: 1, pb: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {hasConflict && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.25 }}>
              <WarningIcon sx={{ fontSize: 12, color: "#ef4444" }} />
              <Typography sx={{ fontSize: "10px", color: "rgba(239,68,68,0.95)", fontWeight: 600 }}>
                Time conflict{conflictLabel ? ` with ${conflictLabel}` : ""}
              </Typography>
            </Box>
          )}

          {/* Event Day selector — only show if multiple event days */}
          {eventDays.length > 1 && (
            <FormControl size="small" fullWidth>
              <Select
                value={schedule?.event_day_template_id ?? ""}
                onChange={(e) => handleEventDayChange(e.target.value as string)}
                displayEmpty
                disabled={readOnly}
                sx={{
                  fontSize: "10px",
                  height: 26,
                  color: "rgba(255,255,255,0.8)",
                  bgcolor: "rgba(255,255,255,0.05)",
                  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.3)" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <MenuItem value="" sx={{ fontSize: "11px" }}>
                  <em>No event day</em>
                </MenuItem>
                {eventDays.map((ed) => (
                  <MenuItem key={ed.id} value={ed.id} sx={{ fontSize: "11px" }}>
                    {ed.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Activity selector — only show when activities exist */}
          {availableActivities.length > 0 && (
            <FormControl size="small" fullWidth>
              <Select
                value={schedule?.package_activity_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange(scene.id, {
                    package_activity_id: val ? Number(val) : null,
                  });
                }}
                displayEmpty
                disabled={readOnly}
                sx={{
                  fontSize: "10px",
                  height: 26,
                  color: "rgba(255,255,255,0.8)",
                  bgcolor: "rgba(255,255,255,0.05)",
                  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.3)" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: assignedActivity
                      ? `${assignedActivity.color || "#f59e0b"}40`
                      : "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <MenuItem value="" sx={{ fontSize: "11px" }}>
                  <em>No activity</em>
                </MenuItem>
                {availableActivities.map((act) => (
                  <MenuItem key={act.id} value={act.id} sx={{ fontSize: "11px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: "50%",
                        bgcolor: act.color || "#f59e0b", flexShrink: 0,
                      }} />
                      {act.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Time + Duration row */}
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Tooltip title={suggestedStart && !schedule?.scheduled_start_time ? `Suggested: ${suggestedStart}` : "Start time"} placement="top">
              <TimeIcon sx={{ fontSize: 12, color: suggestedStart && !schedule?.scheduled_start_time ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            </Tooltip>
            <TextField
              type="time"
              size="small"
              value={schedule?.scheduled_start_time ?? ""}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={readOnly}
              placeholder={suggestedStart ?? "HH:MM"}
            InputProps={{
              sx: {
                fontSize: "10px",
                height: 26,
                color: "rgba(255,255,255,0.8)",
                bgcolor: "rgba(255,255,255,0.05)",
                "& input": { padding: "2px 6px" },
              },
            }}
            sx={{ flex: 1 }}
          />
          <Tooltip title="Duration (minutes)" placement="top">
            <DurationIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          </Tooltip>
          <TextField
            type="number"
            size="small"
            value={schedule?.scheduled_duration_minutes ?? ""}
            onChange={(e) => handleDurationChange(e.target.value)}
            disabled={readOnly}
            placeholder="min"
            InputProps={{
              sx: {
                fontSize: "10px",
                height: 26,
                color: "rgba(255,255,255,0.8)",
                bgcolor: "rgba(255,255,255,0.05)",
                "& input": { padding: "2px 6px" },
              },
              inputProps: { min: 0 },
            }}
            sx={{ width: 65 }}
          />
          {/* End time indicator */}
          {endTime && (
            <Tooltip title={`Ends at ${endTime}`} placement="top">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                <ArrowIcon sx={{ fontSize: 10, color: "rgba(59,130,246,0.5)" }} />
                <Typography sx={{ fontSize: "9px", color: "rgba(59,130,246,0.7)", fontFamily: "monospace", fontWeight: 600 }}>
                  {endTime}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Moment/Beat children */}
        {(scene.mode === "MOMENTS" && scene.moments && scene.moments.length > 0 ||
          scene.mode === "MONTAGE" && scene.beats && scene.beats.length > 0) && (
          <Box sx={{ pl: 2, pr: 0, pt: 0.5, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <Typography sx={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
              {scene.mode === "MONTAGE" ? "Beats" : "Moments"}
            </Typography>
          </Box>
        )}

        {!readOnly && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", pl: 2, pr: 0.5 }}>
            <Chip
              size="small"
              label="+15m"
              onClick={() => applyQuickShift(15)}
              sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(59,130,246,0.16)", color: "#93c5fd" }}
            />
            <Chip
              size="small"
              label="+30m"
              onClick={() => applyQuickShift(30)}
              sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(59,130,246,0.16)", color: "#93c5fd" }}
            />
            {suggestedStart && !schedule?.scheduled_start_time && (
              <Chip
                size="small"
                label={`Use ${suggestedStart}`}
                onClick={applySuggestedStart}
                sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(245,158,11,0.18)", color: "#fbbf24" }}
              />
            )}
            {((scene.mode === "MOMENTS" && (scene.moments?.length ?? 0) > 0) || (scene.mode === "MONTAGE" && (scene.beats?.length ?? 0) > 0)) && (
              <Chip
                size="small"
                label="Auto split children"
                onClick={autoDistributeChildren}
                sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(16,185,129,0.18)", color: "#6ee7b7" }}
              />
            )}
          </Box>
        )}
        {scene.mode === "MOMENTS" &&
            scene.moments?.map((moment) => {
              const ms = getMomentSchedule(moment.id);
              return (
                <Box
                  key={moment.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    py: 0.5,
                    pl: 2,
                    pr: 0.5,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.6)",
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {moment.name}
                  </Typography>
                  <TextField
                    type="time"
                    size="small"
                    value={ms?.start_time ?? ""}
                    onChange={(e) =>
                      handleMomentScheduleChange(moment.id, "start_time", e.target.value)
                    }
                    disabled={readOnly}
                    InputProps={{
                      sx: {
                        fontSize: "9px",
                        height: 22,
                        color: "rgba(255,255,255,0.7)",
                        bgcolor: "rgba(255,255,255,0.03)",
                        "& input": { padding: "1px 4px" },
                      },
                    }}
                    sx={{ width: 75 }}
                  />
                  <TextField
                    type="number"
                    size="small"
                    value={ms?.duration_minutes ?? ""}
                    onChange={(e) =>
                      handleMomentScheduleChange(moment.id, "duration_minutes", e.target.value)
                    }
                    disabled={readOnly}
                    placeholder="m"
                    InputProps={{
                      sx: {
                        fontSize: "9px",
                        height: 22,
                        color: "rgba(255,255,255,0.7)",
                        bgcolor: "rgba(255,255,255,0.03)",
                        "& input": { padding: "1px 4px" },
                      },
                      inputProps: { min: 0 },
                    }}
                    sx={{ width: 50 }}
                  />
                </Box>
              );
            })}

          {scene.mode === "MONTAGE" &&
            scene.beats?.map((beat) => {
              const bs = getBeatSchedule(beat.id);
              return (
                <Box
                  key={beat.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    py: 0.5,
                    pl: 2,
                    pr: 0.5,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.6)",
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {beat.name}
                  </Typography>
                  <TextField
                    type="time"
                    size="small"
                    value={bs?.start_time ?? ""}
                    onChange={(e) =>
                      handleBeatScheduleChange(beat.id, "start_time", e.target.value)
                    }
                    disabled={readOnly}
                    InputProps={{
                      sx: {
                        fontSize: "9px",
                        height: 22,
                        color: "rgba(255,255,255,0.7)",
                        bgcolor: "rgba(255,255,255,0.03)",
                        "& input": { padding: "1px 4px" },
                      },
                    }}
                    sx={{ width: 75 }}
                  />
                  <TextField
                    type="number"
                    size="small"
                    value={bs?.duration_minutes ?? ""}
                    onChange={(e) =>
                      handleBeatScheduleChange(beat.id, "duration_minutes", e.target.value)
                    }
                    disabled={readOnly}
                    placeholder="m"
                    InputProps={{
                      sx: {
                        fontSize: "9px",
                        height: 22,
                        color: "rgba(255,255,255,0.7)",
                        bgcolor: "rgba(255,255,255,0.03)",
                        "& input": { padding: "1px 4px" },
                      },
                      inputProps: { min: 0 },
                    }}
                    sx={{ width: 50 }}
                  />
                </Box>
              );
            })}
        </Box>
      </Collapse>
    </Box>
  );
};

// ─── Main Panel Component ───────────────────────────────────────────────

export const FilmSchedulePanel: React.FC<FilmSchedulePanelProps> = ({
  filmId,
  scenes,
  brandId,
  filmName,
  mode = "film",
  contextId,
  packageId,
  readOnly = false,
  onScheduleChange,
  showEventDayManager = false,
}) => {
  const [eventDays, setEventDays] = useState<EventDayTemplate[]>([]);
  const [scheduleMap, setScheduleMap] = useState<Map<number, SceneSchedule>>(new Map());
  const [filmScenes, setFilmScenes] = useState<Scene[]>([]);
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [rippleEnabled, setRippleEnabled] = useState(true);
  const [lockedScenes, setLockedScenes] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<Map<number, SceneSchedule>[]>([]);
  const [future, setFuture] = useState<Map<number, SceneSchedule>[]>([]);
  const [presetList, setPresetList] = useState<SchedulePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [presetNameDraft, setPresetNameDraft] = useState("");
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [creatingSceneForActivity, setCreatingSceneForActivity] = useState<number | null>(null);

  // Load schedules and event day templates
  useEffect(() => {
    if (!filmId) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load event day templates
        // When packageId is present (package mode OR film opened from package), only show package event days
        if (packageId) {
          const days = await api.schedule.packageEventDays.getAll(packageId);
          if (isMounted) setEventDays(days);
        } else if (brandId) {
          const days = await api.schedule.eventDays.getAll(brandId);
          if (isMounted) setEventDays(days);
        }

        // Load package activities when in package mode
        if (mode === "package" && packageId) {
          try {
            const acts = await api.schedule.packageActivities.getAll(packageId);
            if (isMounted) setActivities(acts as ActivityOption[]);
          } catch {
            // Activities are optional — don't block loading
            if (isMounted) setActivities([]);
          }
        }

        // Load schedule data based on mode
        if (mode === "film") {
          const filmData = await api.schedule.film.get(filmId);
          if (isMounted && filmData?.scenes) {
            // Store the rich scene data (with moments, beats, mode) from the API
            setFilmScenes(filmData.scenes as Scene[]);
            const map = new Map<number, SceneSchedule>();
            for (const scene of filmData.scenes) {
              if (scene.schedule) {
                map.set(scene.id, scene.schedule);
              }
            }
            setScheduleMap(map);
            setHistory([]);
            setFuture([]);
          }
        } else if (mode === "package" && contextId) {
          // Load package-film schedule (overrides + film defaults)
          const pfData = await api.schedule.packageFilms.getSchedule(contextId);
          if (isMounted && pfData?.film?.scenes) {
            setFilmScenes(pfData.film.scenes as Scene[]);
            const map = new Map<number, SceneSchedule>();
            // Map package overrides first (they take priority)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const overrideMap = new Map<number, any>();
            for (const override of (pfData.scene_schedules ?? [])) {
              overrideMap.set(override.scene_id, override);
            }
            // For each scene, use package override if available, else film default
            for (const scene of pfData.film.scenes) {
              const override = overrideMap.get(scene.id);
              const filmDefault = scene.schedule;
              if (override) {
                map.set(scene.id, override);
              } else if (filmDefault) {
                map.set(scene.id, filmDefault);
              }
            }
            setScheduleMap(map);
            setHistory([]);
            setFuture([]);
          }
        }
        // Package/Project modes can be loaded similarly when contextId is provided
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load schedule");
          console.error("Failed to load schedule:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [filmId, brandId, mode, contextId, packageId]);

  const resolvedScenes = useMemo(
    () => (filmScenes.length > 0 ? filmScenes : scenes),
    [filmScenes, scenes]
  );

  const orderedScenes = useMemo(
    () => [...resolvedScenes].sort((a, b) => a.order_index - b.order_index),
    [resolvedScenes]
  );

  const pushHistorySnapshot = useCallback((snapshot: Map<number, SceneSchedule>) => {
    setHistory((prev) => {
      const next = [...prev, cloneScheduleMap(snapshot)];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
    setFuture([]);
  }, []);

  const loadPresets = useCallback(async () => {
    if (!brandId) {
      setPresetList([]);
      setSelectedPresetId(null);
      return;
    }
    const presets = await api.schedule.presets.getAll(brandId);
    const normalized = (presets as SchedulePreset[]) ?? [];
    setPresetList(normalized);

    if (normalized.length === 0) {
      setSelectedPresetId(null);
      setPresetNameDraft("");
      return;
    }

    setSelectedPresetId((prev) => {
      const keep = prev && normalized.some((p) => p.id === prev) ? prev : normalized[0].id;
      const selected = normalized.find((p) => p.id === keep);
      setPresetNameDraft(selected?.name ?? "");
      return keep;
    });
  }, [brandId]);

  useEffect(() => {
    loadPresets().catch((err) => {
      console.error("Failed to load schedule presets", err);
    });
  }, [loadPresets]);

  // Handle schedule field changes
  const handleSceneScheduleChange = useCallback(
    (sceneId: number, updates: Partial<SceneSchedule>) => {
      setScheduleMap((prev) => {
        pushHistorySnapshot(prev);
        const next = new Map(prev);
        const existing = next.get(sceneId) || { scene_id: sceneId };

        const before = { ...existing } as SceneSchedule;
        const after = { ...existing, ...updates } as SceneSchedule;
        next.set(sceneId, after);

        // Ripple edits forward within the same event day when duration/start changes.
        if (
          rippleEnabled
          && !lockedScenes.has(sceneId)
          && (Object.prototype.hasOwnProperty.call(updates, "scheduled_duration_minutes")
            || Object.prototype.hasOwnProperty.call(updates, "scheduled_start_time"))
        ) {
          const dayId = after.event_day_template_id ?? before.event_day_template_id;
          const oldEnd = calculateEndTime(before.scheduled_start_time, before.scheduled_duration_minutes);
          const newEnd = calculateEndTime(after.scheduled_start_time, after.scheduled_duration_minutes);
          const oldEndMins = parseTimeToMinutes(oldEnd);
          const newEndMins = parseTimeToMinutes(newEnd);
          if (dayId && oldEndMins !== null && newEndMins !== null && oldEndMins !== newEndMins) {
            const delta = newEndMins - oldEndMins;
            const sceneIdx = orderedScenes.findIndex((s) => s.id === sceneId);
            for (let i = sceneIdx + 1; i < orderedScenes.length; i++) {
              const candidate = orderedScenes[i];
              if (lockedScenes.has(candidate.id)) continue;
              const candidateSched = next.get(candidate.id);
              if (!candidateSched) continue;
              if (candidateSched.event_day_template_id !== dayId) continue;
              const shifted = addMinutesToTime(candidateSched.scheduled_start_time, delta);
              if (shifted) {
                next.set(candidate.id, { ...candidateSched, scheduled_start_time: shifted });
              }
            }
          }
        }

        return next;
      });
      setDirty(true);
    },
    [orderedScenes, lockedScenes, rippleEnabled, pushHistorySnapshot]
  );

  const handleToggleLock = useCallback((sceneId: number) => {
    setLockedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setFuture((f) => [...f, cloneScheduleMap(scheduleMap)]);
      setScheduleMap(cloneScheduleMap(last));
      setDirty(true);
      return prev.slice(0, -1);
    });
  }, [scheduleMap]);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setHistory((h) => [...h, cloneScheduleMap(scheduleMap)]);
      setScheduleMap(cloneScheduleMap(last));
      setDirty(true);
      return prev.slice(0, -1);
    });
  }, [scheduleMap]);

  const handleSavePreset = useCallback(() => {
    const run = async () => {
      const name = presetNameDraft.trim();
      if (!brandId) {
        setError("Brand is required to save shared presets.");
        return;
      }
      if (!name) {
        setError("Enter a preset name first.");
        return;
      }

      const saved = await api.schedule.presets.upsert(brandId, {
        name,
        schedule_data: Array.from(scheduleMap.values()),
      });
      await loadPresets();
      setSelectedPresetId(saved.id);
      setPresetNameDraft(saved.name);
      setError(null);
    };

    run().catch((err) => {
      console.error("Failed to save preset", err);
      setError("Failed to save preset");
    });
  }, [brandId, presetNameDraft, scheduleMap, loadPresets]);

  const handleApplyPreset = useCallback(() => {
    const selectedPreset = presetList.find((p) => p.id === selectedPresetId);
    if (!selectedPreset) {
      setError("Select a preset to apply.");
      return;
    }
    pushHistorySnapshot(scheduleMap);
    const next = new Map<number, SceneSchedule>();
    for (const schedule of selectedPreset.schedule_data ?? []) {
      next.set(schedule.scene_id, schedule);
    }
    setScheduleMap(next);
    setDirty(true);
    setError(null);
  }, [selectedPresetId, presetList, scheduleMap, pushHistorySnapshot]);

  const handleRenamePreset = useCallback(() => {
    const run = async () => {
      const newName = presetNameDraft.trim();
      if (!brandId) {
        setError("Brand is required to rename shared presets.");
        return;
      }
      if (!selectedPresetId) {
        setError("Select a preset to rename.");
        return;
      }
      if (!newName) {
        setError("Enter a new preset name.");
        return;
      }

      const renamed = await api.schedule.presets.rename(brandId, selectedPresetId, newName);
      await loadPresets();
      setSelectedPresetId(renamed.id);
      setPresetNameDraft(renamed.name);
      setError(null);
    };

    run().catch((err) => {
      console.error("Failed to rename preset", err);
      setError("Failed to rename preset");
    });
  }, [brandId, selectedPresetId, presetNameDraft, loadPresets]);

  const handleDeletePreset = useCallback(() => {
    const run = async () => {
      if (!brandId) {
        setError("Brand is required to delete shared presets.");
        return;
      }
      if (!selectedPresetId) {
        setError("Select a preset to delete.");
        return;
      }
      const selected = presetList.find((p) => p.id === selectedPresetId);
      if (typeof window !== "undefined" && !window.confirm(`Delete preset \"${selected?.name ?? "this preset"}\"?`)) {
        return;
      }

      await api.schedule.presets.delete(brandId, selectedPresetId);
      await loadPresets();
      setError(null);
    };

    run().catch((err) => {
      console.error("Failed to delete preset", err);
      setError("Failed to delete preset");
    });
  }, [brandId, selectedPresetId, presetList, loadPresets]);

  // Toggle scene expansion
  const toggleExpand = useCallback((sceneId: number) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);

  // Save all schedules
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const schedules = Array.from(scheduleMap.values()).map((s) => ({
        scene_id: s.scene_id,
        event_day_template_id: s.event_day_template_id ?? null,
        scheduled_start_time: s.scheduled_start_time ?? null,
        scheduled_duration_minutes: s.scheduled_duration_minutes ?? null,
        moment_schedules: s.moment_schedules ?? null,
        beat_schedules: s.beat_schedules ?? null,
        notes: s.notes ?? null,
        package_activity_id: s.package_activity_id ?? null,
      }));

      if (mode === "film") {
        await api.schedule.film.bulkUpsertScenes(filmId, schedules);
      } else if (mode === "package" && contextId) {
        await api.schedule.packageFilms.bulkUpsertSceneSchedules(contextId, schedules);
      } else if (mode === "project" && contextId) {
        await api.schedule.projectFilms.bulkUpsertSceneSchedules(contextId, schedules);
      }

      setDirty(false);
      onScheduleChange?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save schedule");
      console.error("Failed to save schedule:", err);
    } finally {
      setSaving(false);
    }
  }, [filmId, mode, contextId, scheduleMap, onScheduleChange]);

  // Create a new scene from an activity (package mode)
  const handleCreateSceneFromActivity = useCallback(async (activity: ActivityOption) => {
    if (!filmId || !contextId || mode !== "package") return;
    setCreatingSceneForActivity(activity.id);
    try {
      // 1. Create a blank scene in the film
      const newScene = await api.films.localScenes.create(filmId, {
        name: activity.name,
      });

      // 2. Build the schedule entry with activity link + timing from activity
      const startMin = activity.start_time ? parseTimeToMinutes(activity.start_time) : null;
      const endMin = activity.end_time ? parseTimeToMinutes(activity.end_time) : null;
      const durationFromActivity = startMin !== null && endMin !== null && endMin > startMin
        ? endMin - startMin
        : null;

      const schedulePayload = {
        scene_id: newScene.id,
        event_day_template_id: activity.package_event_day_id ?? null,
        package_activity_id: activity.id,
        scheduled_start_time: activity.start_time ?? null,
        scheduled_duration_minutes: durationFromActivity,
        moment_schedules: null,
        beat_schedules: null,
        notes: null,
      };

      // 3. Upsert the package scene schedule to link scene → activity
      await api.schedule.packageFilms.upsertSceneSchedule(contextId, schedulePayload);

      // 4. Add the new scene to local state
      const sceneEntry: Scene = {
        id: newScene.id,
        name: newScene.name,
        mode: (newScene as any).mode ?? "MOMENTS",
        order_index: newScene.order_index ?? filmScenes.length,
        duration_seconds: (newScene as any).duration_seconds ?? null,
        moments: [],
        beats: [],
      };
      setFilmScenes(prev => [...prev, sceneEntry]);

      // 5. Add schedule to local map
      setScheduleMap(prev => {
        const next = new Map(prev);
        next.set(newScene.id, {
          scene_id: newScene.id,
          event_day_template_id: schedulePayload.event_day_template_id,
          package_activity_id: activity.id,
          scheduled_start_time: schedulePayload.scheduled_start_time,
          scheduled_duration_minutes: schedulePayload.scheduled_duration_minutes,
        });
        return next;
      });

      onScheduleChange?.();
    } catch (err) {
      console.error("Failed to create scene from activity:", err);
      setError(err instanceof Error ? err.message : "Failed to create scene");
    } finally {
      setCreatingSceneForActivity(null);
    }
  }, [filmId, contextId, mode, filmScenes.length, onScheduleChange]);

  // Computed stats
  const totalMinutes = useMemo(
    () => getTotalScheduledMinutes(resolvedScenes, scheduleMap),
    [resolvedScenes, scheduleMap]
  );

  const scheduledCount = useMemo(
    () => Array.from(scheduleMap.values()).filter(s => s.scheduled_start_time).length,
    [scheduleMap]
  );

  const conflictInfo = useMemo(() => {
    const conflicts = new Map<number, { hasConflict: boolean; label?: string }>();
    const byDay = new Map<number, Array<{ sceneId: number; sceneName: string; start: number; end: number }>>();

    for (const scene of resolvedScenes) {
      const sched = scheduleMap.get(scene.id);
      if (!sched?.event_day_template_id || !sched?.scheduled_start_time || !sched?.scheduled_duration_minutes) continue;
      const start = parseTimeToMinutes(sched.scheduled_start_time);
      if (start === null) continue;
      const end = start + sched.scheduled_duration_minutes;
      if (!byDay.has(sched.event_day_template_id)) byDay.set(sched.event_day_template_id, []);
      byDay.get(sched.event_day_template_id)!.push({
        sceneId: scene.id,
        sceneName: scene.name,
        start,
        end,
      });
    }

    byDay.forEach((items) => {
      const sorted = [...items].sort((a, b) => a.start - b.start);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.start < prev.end) {
          conflicts.set(curr.sceneId, { hasConflict: true, label: prev.sceneName });
          conflicts.set(prev.sceneId, { hasConflict: true, label: curr.sceneName });
        }
      }
    });

    return conflicts;
  }, [resolvedScenes, scheduleMap]);

  const conflictCount = useMemo(
    () => Array.from(conflictInfo.values()).filter((v) => v.hasConflict).length,
    [conflictInfo]
  );

  // Build cross-film scene data for EventDayManager
  const crossFilmScenes = useMemo(() => {
    const map = new Map<number, EventDayFilmScene[]>();
    for (const scene of resolvedScenes) {
      const sched = scheduleMap.get(scene.id);
      const dayId = sched?.event_day_template_id;
      if (!dayId) continue;
      if (!map.has(dayId)) map.set(dayId, []);
      map.get(dayId)!.push({
        filmId,
        filmName: filmName ?? `Film #${filmId}`,
        sceneId: scene.id,
        sceneName: scene.name,
        sceneMode: scene.mode,
        startTime: sched?.scheduled_start_time ?? null,
        durationMinutes: sched?.scheduled_duration_minutes ?? null,
        endTime: calculateEndTime(sched?.scheduled_start_time, sched?.scheduled_duration_minutes),
      });
    }
    return map;
  }, [resolvedScenes, scheduleMap, filmId, filmName]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", p: 2 }}>
        <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.4)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 0.75,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <ScheduleIcon sx={{ fontSize: 14, color: "#f59e0b" }} />
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
            Film Schedule
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {!readOnly && (
            <>
              <Tooltip title="Undo">
                <span>
                  <IconButton size="small" onClick={handleUndo} disabled={history.length === 0} sx={{ p: 0.25, color: "rgba(255,255,255,0.6)" }}>
                    <UndoIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Redo">
                <span>
                  <IconButton size="small" onClick={handleRedo} disabled={future.length === 0} sx={{ p: 0.25, color: "rgba(255,255,255,0.6)" }}>
                    <RedoIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Chip
                size="small"
                label={rippleEnabled ? "Ripple on" : "Ripple off"}
                onClick={() => setRippleEnabled((v) => !v)}
                sx={{
                  height: 18,
                  fontSize: "8px",
                  fontWeight: 700,
                  bgcolor: rippleEnabled ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
                  color: rippleEnabled ? "#6ee7b7" : "rgba(255,255,255,0.6)",
                }}
              />
            </>
          )}
          {dirty && !readOnly && (
            <Tooltip title="Save schedule">
              <IconButton
                size="small"
                onClick={handleSave}
                disabled={saving}
                sx={{ p: 0.25, color: "#f59e0b" }}
              >
                {saving ? (
                  <CircularProgress size={12} sx={{ color: "#f59e0b" }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 14 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {!readOnly && (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            px: 1,
            py: 0.5,
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedPresetId ?? ""}
              displayEmpty
              onChange={(e) => {
                const value = e.target.value === "" ? null : Number(e.target.value);
                setSelectedPresetId(value);
                const selected = presetList.find((p) => p.id === value);
                setPresetNameDraft(selected?.name ?? "");
              }}
              sx={{
                fontSize: "10px",
                height: 24,
                color: "rgba(255,255,255,0.9)",
                bgcolor: "rgba(255,255,255,0.06)",
              }}
            >
              <MenuItem value="" sx={{ fontSize: "10px" }}>
                <em>No preset</em>
              </MenuItem>
              {presetList.map((preset) => (
                <MenuItem key={preset.id} value={preset.id} sx={{ fontSize: "10px" }}>
                  {preset.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Preset name"
            value={presetNameDraft}
            onChange={(e) => setPresetNameDraft(e.target.value)}
            sx={{
              width: 120,
              "& .MuiInputBase-root": {
                height: 24,
                fontSize: "10px",
                color: "rgba(255,255,255,0.9)",
                bgcolor: "rgba(255,255,255,0.06)",
              },
            }}
          />

          <Chip size="small" label="Save" onClick={handleSavePreset} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(123,97,255,0.15)", color: "#c4b5fd" }} />
          <Chip size="small" label="Apply" onClick={handleApplyPreset} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(59,130,246,0.15)", color: "#93c5fd" }} />
          <Chip size="small" label="Rename" onClick={handleRenamePreset} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(245,158,11,0.15)", color: "#fbbf24" }} />
          <Chip size="small" label="Delete" onClick={handleDeletePreset} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(239,68,68,0.15)", color: "#fca5a5" }} />
        </Box>
      )}

      {/* Stats bar */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          px: 1,
          py: 0.5,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <Chip
          icon={<TimeIcon sx={{ fontSize: "11px !important" }} />}
          label={`${scheduledCount}/${scenes.length} timed`}
          size="small"
          sx={{
            fontSize: "9px",
            height: 20,
            bgcolor: "rgba(245,158,11,0.1)",
            color: "#f59e0b",
            "& .MuiChip-icon": { color: "#f59e0b" },
          }}
        />
        {totalMinutes > 0 && (
          <Chip
            icon={<DurationIcon sx={{ fontSize: "11px !important" }} />}
            label={formatDuration(totalMinutes)}
            size="small"
            sx={{
              fontSize: "9px",
              height: 20,
              bgcolor: "rgba(59,130,246,0.1)",
              color: "#3b82f6",
              "& .MuiChip-icon": { color: "#3b82f6" },
            }}
          />
        )}
        {conflictCount > 0 && (
          <Chip
            icon={<WarningIcon sx={{ fontSize: "11px !important" }} />}
            label={`${conflictCount} conflict${conflictCount !== 1 ? "s" : ""}`}
            size="small"
            sx={{
              fontSize: "9px",
              height: 20,
              bgcolor: "rgba(239,68,68,0.12)",
              color: "#f87171",
              "& .MuiChip-icon": { color: "#f87171" },
            }}
          />
        )}
      </Box>

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Activities
            </Typography>
            <Chip
              label={`${activities.length}`}
              size="small"
              sx={{ height: 14, fontSize: "0.45rem", fontWeight: 700, bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "none", "& .MuiChip-label": { px: 0.3 } }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {activities.map((act) => {
              const color = act.color || "#f59e0b";
              // Check if a scene already exists for this activity
              const alreadyLinked = Array.from(scheduleMap.values()).some(
                (s) => s.package_activity_id === act.id
              );
              const isCreating = creatingSceneForActivity === act.id;
              return (
                <Box
                  key={act.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    py: 0.25,
                    px: 0.75,
                    borderRadius: 1,
                    border: `1px solid ${color}35`,
                    bgcolor: `${color}0A`,
                    transition: "all 0.15s",
                  }}
                >
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                    {act.name}
                  </Typography>
                  {act.start_time && (
                    <Typography sx={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                      {act.start_time}
                    </Typography>
                  )}
                  {alreadyLinked ? (
                    <Chip
                      icon={<MovieIcon sx={{ fontSize: "9px !important", color: `${color} !important` }} />}
                      label="Linked"
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: "7px",
                        fontWeight: 700,
                        bgcolor: `${color}15`,
                        color: color,
                        border: "none",
                        "& .MuiChip-icon": { ml: "3px" },
                        "& .MuiChip-label": { px: 0.4 },
                      }}
                    />
                  ) : (
                    <Tooltip title={`Create a new scene named "${act.name}" linked to this activity`} arrow>
                      <Chip
                        icon={
                          isCreating
                            ? <CircularProgress size={8} sx={{ color: `${color} !important` }} />
                            : <AddIcon sx={{ fontSize: "10px !important", color: `${color} !important` }} />
                        }
                        label="Create Scene"
                        size="small"
                        disabled={isCreating || readOnly}
                        onClick={() => handleCreateSceneFromActivity(act)}
                        sx={{
                          height: 16,
                          fontSize: "7px",
                          fontWeight: 700,
                          bgcolor: `${color}12`,
                          color: color,
                          border: `1px solid ${color}30`,
                          cursor: "pointer",
                          "& .MuiChip-icon": { ml: "3px" },
                          "& .MuiChip-label": { px: 0.4 },
                          "&:hover": { bgcolor: `${color}20`, borderColor: `${color}50` },
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Box>
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
