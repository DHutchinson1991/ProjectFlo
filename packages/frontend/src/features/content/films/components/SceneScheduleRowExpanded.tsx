"use client";

import React from "react";
import {
  Box, Typography, TextField, Select, MenuItem, Chip, Tooltip, FormControl,
} from "@mui/material";
import {
  WarningAmber as WarningIcon, AccessTime as TimeIcon, Timer as DurationIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import type { SceneSchedule, ScheduleScene, EventDay, ActivityOption } from "../types/schedule-panel.types";
import { ChildScheduleRow } from "./ChildScheduleRow";

interface SceneScheduleRowExpandedProps {
  scene: ScheduleScene;
  schedule: SceneSchedule | null;
  eventDays: EventDay[];
  readOnly: boolean;
  suggestedStart?: string | null;
  hasConflict: boolean;
  conflictLabel: string | null;
  endTime: string | null;
  assignedActivity: ActivityOption | null;
  availableActivities: ActivityOption[];
  handleTimeChange: (value: string) => void;
  handleDurationChange: (value: string) => void;
  handleEventDayChange: (value: string) => void;
  applyQuickShift: (delta: number) => void;
  applySuggestedStart: () => void;
  autoDistributeChildren: () => void;
  handleChildScheduleChange: (childId: number, kind: "moment" | "beat", field: "start_time" | "duration_minutes", value: string) => void;
  getChildSchedule: (childId: number, kind: "moment" | "beat") => Record<string, unknown> | undefined;
  onChange: (sceneId: number, updates: Partial<SceneSchedule>) => void;
}

const selectSx = {
  fontSize: "10px", height: 26, color: "rgba(255,255,255,0.8)",
  bgcolor: "rgba(255,255,255,0.05)",
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.3)" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
};

export const SceneScheduleRowExpanded: React.FC<SceneScheduleRowExpandedProps> = ({
  scene, schedule, eventDays, readOnly, suggestedStart, hasConflict, conflictLabel,
  endTime, assignedActivity, availableActivities,
  handleTimeChange, handleDurationChange, handleEventDayChange,
  applyQuickShift, applySuggestedStart, autoDistributeChildren,
  handleChildScheduleChange, getChildSchedule, onChange,
}) => (
  <Box sx={{ px: 1, pb: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
    {hasConflict && (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.25 }}>
        <WarningIcon sx={{ fontSize: 12, color: "#ef4444" }} />
        <Typography sx={{ fontSize: "10px", color: "rgba(239,68,68,0.95)", fontWeight: 600 }}>
          Time conflict{conflictLabel ? ` with ${conflictLabel}` : ""}
        </Typography>
      </Box>
    )}

    {eventDays.length > 1 && (
      <FormControl size="small" fullWidth>
        <Select
          value={schedule?.event_day_template_id ?? ""} displayEmpty
          onChange={(e) => handleEventDayChange(e.target.value as string)}
          disabled={readOnly} sx={selectSx}
        >
          <MenuItem value="" sx={{ fontSize: "11px" }}><em>No event day</em></MenuItem>
          {eventDays.map((ed) => (
            <MenuItem key={ed.id} value={ed.id} sx={{ fontSize: "11px" }}>{ed.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    )}

    {availableActivities.length > 0 && (
      <FormControl size="small" fullWidth>
        <Select
          value={schedule?.package_activity_id ?? ""} displayEmpty
          onChange={(e) => { const val = e.target.value; onChange(scene.id, { package_activity_id: val ? Number(val) : null }); }}
          disabled={readOnly}
          sx={{ ...selectSx, "& .MuiOutlinedInput-notchedOutline": { borderColor: assignedActivity ? `${assignedActivity.color || "#f59e0b"}40` : "rgba(255,255,255,0.1)" } }}
        >
          <MenuItem value="" sx={{ fontSize: "11px" }}><em>No activity</em></MenuItem>
          {availableActivities.map((act) => (
            <MenuItem key={act.id} value={act.id} sx={{ fontSize: "11px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: act.color || "#f59e0b", flexShrink: 0 }} />
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
        type="time" size="small" value={schedule?.scheduled_start_time ?? ""}
        onChange={(e) => handleTimeChange(e.target.value)}
        disabled={readOnly} placeholder={suggestedStart ?? "HH:MM"}
        InputProps={{ sx: { fontSize: "10px", height: 26, color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.05)", "& input": { padding: "2px 6px" } } }}
        sx={{ flex: 1 }}
      />
      <Tooltip title="Duration (minutes)" placement="top">
        <DurationIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
      </Tooltip>
      <TextField
        type="number" size="small" value={schedule?.scheduled_duration_minutes ?? ""}
        onChange={(e) => handleDurationChange(e.target.value)}
        disabled={readOnly} placeholder="min"
        InputProps={{ sx: { fontSize: "10px", height: 26, color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.05)", "& input": { padding: "2px 6px" } }, inputProps: { min: 0 } }}
        sx={{ width: 65 }}
      />
      {endTime && (
        <Tooltip title={`Ends at ${endTime}`} placement="top">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
            <ArrowIcon sx={{ fontSize: 10, color: "rgba(59,130,246,0.5)" }} />
            <Typography sx={{ fontSize: "9px", color: "rgba(59,130,246,0.7)", fontFamily: "monospace", fontWeight: 600 }}>{endTime}</Typography>
          </Box>
        </Tooltip>
      )}
    </Box>

    {/* Children header */}
    {((scene.mode === "MOMENTS" && scene.moments && scene.moments.length > 0) ||
      (scene.mode === "MONTAGE" && scene.beats && scene.beats.length > 0)) && (
      <Box sx={{ pl: 2, pr: 0, pt: 0.5, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <Typography sx={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>
          {scene.mode === "MONTAGE" ? "Beats" : "Moments"}
        </Typography>
      </Box>
    )}

    {/* Quick actions */}
    {!readOnly && (
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", pl: 2, pr: 0.5 }}>
        <Chip size="small" label="+15m" onClick={() => applyQuickShift(15)} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(59,130,246,0.16)", color: "#93c5fd" }} />
        <Chip size="small" label="+30m" onClick={() => applyQuickShift(30)} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(59,130,246,0.16)", color: "#93c5fd" }} />
        {suggestedStart && !schedule?.scheduled_start_time && (
          <Chip size="small" label={`Use ${suggestedStart}`} onClick={applySuggestedStart} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(245,158,11,0.18)", color: "#fbbf24" }} />
        )}
        {((scene.mode === "MOMENTS" && (scene.moments?.length ?? 0) > 0) || (scene.mode === "MONTAGE" && (scene.beats?.length ?? 0) > 0)) && (
          <Chip size="small" label="Auto split children" onClick={autoDistributeChildren} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(16,185,129,0.18)", color: "#6ee7b7" }} />
        )}
      </Box>
    )}

    {/* Moment rows */}
    {scene.mode === "MOMENTS" && scene.moments?.map((moment) => {
      const ms = getChildSchedule(moment.id, "moment");
      return (
        <ChildScheduleRow
          key={moment.id} name={moment.name} readOnly={readOnly}
          startTime={(ms?.start_time as string) ?? null}
          durationMinutes={(ms?.duration_minutes as number) ?? null}
          onStartTimeChange={(v) => handleChildScheduleChange(moment.id, "moment", "start_time", v)}
          onDurationChange={(v) => handleChildScheduleChange(moment.id, "moment", "duration_minutes", v)}
        />
      );
    })}

    {/* Beat rows */}
    {scene.mode === "MONTAGE" && scene.beats?.map((beat) => {
      const bs = getChildSchedule(beat.id, "beat");
      return (
        <ChildScheduleRow
          key={beat.id} name={beat.name} readOnly={readOnly}
          startTime={(bs?.start_time as string) ?? null}
          durationMinutes={(bs?.duration_minutes as number) ?? null}
          onStartTimeChange={(v) => handleChildScheduleChange(beat.id, "beat", "start_time", v)}
          onDurationChange={(v) => handleChildScheduleChange(beat.id, "beat", "duration_minutes", v)}
        />
      );
    })}
  </Box>
);
