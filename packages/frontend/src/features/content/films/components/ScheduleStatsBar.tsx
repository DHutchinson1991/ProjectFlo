"use client";

import React from "react";
import { Box, Chip } from "@mui/material";
import {
  WarningAmber as WarningIcon, AccessTime as TimeIcon, Timer as DurationIcon,
} from "@mui/icons-material";
import { formatScheduleDuration } from "../utils/schedule-helpers";

interface ScheduleStatsBarProps {
  scheduledCount: number;
  totalScenes: number;
  totalMinutes: number;
  conflictCount: number;
}

export const ScheduleStatsBar: React.FC<ScheduleStatsBarProps> = ({
  scheduledCount, totalScenes, totalMinutes, conflictCount,
}) => (
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
      label={`${scheduledCount}/${totalScenes} timed`}
      size="small"
      sx={{ fontSize: "9px", height: 20, bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b", "& .MuiChip-icon": { color: "#f59e0b" } }}
    />
    {totalMinutes > 0 && (
      <Chip
        icon={<DurationIcon sx={{ fontSize: "11px !important" }} />}
        label={formatScheduleDuration(totalMinutes)}
        size="small"
        sx={{ fontSize: "9px", height: 20, bgcolor: "rgba(59,130,246,0.1)", color: "#3b82f6", "& .MuiChip-icon": { color: "#3b82f6" } }}
      />
    )}
    {conflictCount > 0 && (
      <Chip
        icon={<WarningIcon sx={{ fontSize: "11px !important" }} />}
        label={`${conflictCount} conflict${conflictCount !== 1 ? "s" : ""}`}
        size="small"
        sx={{ fontSize: "9px", height: 20, bgcolor: "rgba(239,68,68,0.12)", color: "#f87171", "& .MuiChip-icon": { color: "#f87171" } }}
      />
    )}
  </Box>
);
