"use client";

import React from "react";
import { Box, Typography, Chip, Tooltip, CircularProgress } from "@mui/material";
import { Add as AddIcon, Movie as MovieIcon } from "@mui/icons-material";
import type { ActivityOption, SceneSchedule } from "../types/schedule-panel.types";

interface ScheduleActivitiesBarProps {
  activities: ActivityOption[];
  scheduleMap: Map<number, SceneSchedule>;
  creatingSceneForActivity: number | null;
  readOnly: boolean;
  onCreateSceneFromActivity: (activity: ActivityOption) => void;
}

export const ScheduleActivitiesBar: React.FC<ScheduleActivitiesBarProps> = ({
  activities, scheduleMap, creatingSceneForActivity, readOnly, onCreateSceneFromActivity,
}) => (
  <Box sx={{ px: 1, py: 0.75, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
      <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Activities
      </Typography>
      <Chip label={`${activities.length}`} size="small"
        sx={{ height: 14, fontSize: "0.45rem", fontWeight: 700, bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "none", "& .MuiChip-label": { px: 0.3 } }} />
    </Box>
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {activities.map((act) => {
        const color = act.color || "#f59e0b";
        const alreadyLinked = Array.from(scheduleMap.values()).some((s) => s.package_activity_id === act.id);
        const isCreating = creatingSceneForActivity === act.id;
        return (
          <Box key={act.id} sx={{
            display: "flex", alignItems: "center", gap: 0.5, py: 0.25, px: 0.75,
            borderRadius: 1, border: `1px solid ${color}35`, bgcolor: `${color}0A`, transition: "all 0.15s",
          }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{act.name}</Typography>
            {act.start_time && (
              <Typography sx={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{act.start_time}</Typography>
            )}
            {alreadyLinked ? (
              <Chip icon={<MovieIcon sx={{ fontSize: "9px !important", color: `${color} !important` }} />}
                label="Linked" size="small"
                sx={{ height: 16, fontSize: "7px", fontWeight: 700, bgcolor: `${color}15`, color, border: "none",
                  "& .MuiChip-icon": { ml: "3px" }, "& .MuiChip-label": { px: 0.4 } }} />
            ) : (
              <Tooltip title={`Create a new scene named "${act.name}" linked to this activity`} arrow>
                <Chip
                  icon={isCreating
                    ? <CircularProgress size={8} sx={{ color: `${color} !important` }} />
                    : <AddIcon sx={{ fontSize: "10px !important", color: `${color} !important` }} />}
                  label="Create Scene" size="small" disabled={isCreating || readOnly}
                  onClick={() => onCreateSceneFromActivity(act)}
                  sx={{ height: 16, fontSize: "7px", fontWeight: 700, bgcolor: `${color}12`, color,
                    border: `1px solid ${color}30`, cursor: "pointer",
                    "& .MuiChip-icon": { ml: "3px" }, "& .MuiChip-label": { px: 0.4 },
                    "&:hover": { bgcolor: `${color}20`, borderColor: `${color}50` } }} />
              </Tooltip>
            )}
          </Box>
        );
      })}
    </Box>
  </Box>
);
