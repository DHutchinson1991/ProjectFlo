"use client";

import React from "react";
import {
  Box, Typography, IconButton, Chip, Tooltip, Collapse,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  Lock as LockIcon, LockOpen as LockOpenIcon,
  Info as InfoIcon, ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import type { SceneSchedule, EventDay, ActivityOption, ScheduleScene } from "../types/schedule-panel.types";
import { useSceneScheduleRow } from "@/features/content/scenes/hooks/useSceneScheduleRow";
import { SceneScheduleRowExpanded } from "./SceneScheduleRowExpanded";

interface SceneScheduleRowProps {
  scene: ScheduleScene;
  schedule: SceneSchedule | null;
  eventDays: EventDay[];
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (sceneId: number, updates: Partial<SceneSchedule>) => void;
  readOnly?: boolean;
  inheritedFrom?: "film" | "package" | null;
  suggestedStart?: string | null;
  locked?: boolean;
  hasConflict?: boolean;
  conflictLabel?: string | null;
  onToggleLock?: (sceneId: number) => void;
  activities?: ActivityOption[];
}

const SceneScheduleRow: React.FC<SceneScheduleRowProps> = ({
  scene, schedule, eventDays, expanded, onToggleExpand, onChange,
  readOnly = false, inheritedFrom = null, suggestedStart = null,
  locked = false, hasConflict = false, conflictLabel = null,
  onToggleLock, activities = [],
}) => {
  const {
    endTime, eventDayName, assignedActivity, availableActivities, status,
    handleTimeChange, handleDurationChange, handleEventDayChange,
    applyQuickShift, applySuggestedStart, autoDistributeChildren,
    handleChildScheduleChange, getChildSchedule,
  } = useSceneScheduleRow({ scene, schedule, eventDays, onChange, readOnly, suggestedStart, activities });

  return (
    <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Scene Row Header */}
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 0.5,
          py: 0.75, px: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" }, cursor: "pointer",
        }}
        onClick={onToggleExpand}
      >
        <Box sx={{ width: 16, flexShrink: 0 }}>
          <IconButton size="small" sx={{ p: 0, color: "rgba(255,255,255,0.4)" }}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Box>

        <Box
          sx={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            bgcolor: status === "scheduled" ? "#10b981" : status === "missing-time" ? "#f59e0b" : "rgba(255,255,255,0.2)",
          }}
        />

        <Typography
          sx={{
            fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.9)",
            minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {scene.name}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {eventDayName && (
          <Chip label={eventDayName} size="small"
            sx={{ height: 18, fontSize: "8px", fontWeight: 600, bgcolor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.25)", "& .MuiChip-label": { px: 0.75 }, maxWidth: 80 }}
          />
        )}

        {assignedActivity && (
          <Chip label={assignedActivity.name} size="small"
            sx={{ height: 18, fontSize: "8px", fontWeight: 600, bgcolor: `${assignedActivity.color || "#f59e0b"}18`, color: assignedActivity.color || "#f59e0b", border: `1px solid ${assignedActivity.color || "#f59e0b"}40`, "& .MuiChip-label": { px: 0.75 }, maxWidth: 90 }}
          />
        )}

        {schedule?.scheduled_start_time && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
            <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "rgba(245,158,11,0.8)", fontFamily: "monospace" }}>
              {schedule.scheduled_start_time}
            </Typography>
            {endTime && (
              <>
                <ArrowIcon sx={{ fontSize: 8, color: "rgba(59,130,246,0.5)" }} />
                <Typography sx={{ fontSize: "9px", fontWeight: 600, color: "rgba(59,130,246,0.7)", fontFamily: "monospace" }}>{endTime}</Typography>
              </>
            )}
          </Box>
        )}

        {inheritedFrom && (
          <Tooltip title={`Inherited from ${inheritedFrom}`}>
            <InfoIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }} />
          </Tooltip>
        )}

        <Chip size="small"
          label={status === "scheduled" ? "Scheduled" : status === "missing-time" ? "Missing time" : "No day"}
          sx={{
            height: 16, fontSize: "8px", fontWeight: 700,
            bgcolor: status === "scheduled" ? "rgba(16,185,129,0.16)" : status === "missing-time" ? "rgba(245,158,11,0.16)" : "rgba(255,255,255,0.08)",
            color: status === "scheduled" ? "rgba(16,185,129,0.95)" : status === "missing-time" ? "rgba(245,158,11,0.95)" : "rgba(255,255,255,0.6)",
            "& .MuiChip-label": { px: 0.6 },
          }}
        />

        {onToggleLock && (
          <Tooltip title={locked ? "Unlock ripple" : "Lock from ripple"}>
            <IconButton size="small"
              sx={{ p: 0.25, color: locked ? "#f59e0b" : "rgba(255,255,255,0.35)" }}
              onClick={(e) => { e.stopPropagation(); onToggleLock(scene.id); }}
            >
              {locked ? <LockIcon sx={{ fontSize: 12 }} /> : <LockOpenIcon sx={{ fontSize: 12 }} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Collapse in={expanded}>
        <SceneScheduleRowExpanded
          scene={scene} schedule={schedule} eventDays={eventDays}
          readOnly={readOnly} suggestedStart={suggestedStart}
          hasConflict={hasConflict} conflictLabel={conflictLabel}
          endTime={endTime} assignedActivity={assignedActivity}
          availableActivities={availableActivities}
          handleTimeChange={handleTimeChange}
          handleDurationChange={handleDurationChange}
          handleEventDayChange={handleEventDayChange}
          applyQuickShift={applyQuickShift}
          applySuggestedStart={applySuggestedStart}
          autoDistributeChildren={autoDistributeChildren}
          handleChildScheduleChange={handleChildScheduleChange}
          getChildSchedule={getChildSchedule}
          onChange={onChange}
        />
      </Collapse>
    </Box>
  );
};

export default SceneScheduleRow;
