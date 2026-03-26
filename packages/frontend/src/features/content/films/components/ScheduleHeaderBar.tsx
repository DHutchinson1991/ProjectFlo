"use client";

import React from "react";
import { Box, Typography, IconButton, Chip, Tooltip, CircularProgress } from "@mui/material";
import {
  Schedule as ScheduleIcon, Save as SaveIcon,
  Undo as UndoIcon, Redo as RedoIcon,
} from "@mui/icons-material";

interface ScheduleHeaderBarProps {
  readOnly: boolean;
  dirty: boolean;
  saving: boolean;
  rippleEnabled: boolean;
  historyLength: number;
  futureLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onToggleRipple: () => void;
  onSave: () => void;
}

export const ScheduleHeaderBar: React.FC<ScheduleHeaderBarProps> = ({
  readOnly, dirty, saving, rippleEnabled, historyLength, futureLength,
  onUndo, onRedo, onToggleRipple, onSave,
}) => (
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
              <IconButton size="small" onClick={onUndo} disabled={historyLength === 0} sx={{ p: 0.25, color: "rgba(255,255,255,0.6)" }}>
                <UndoIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton size="small" onClick={onRedo} disabled={futureLength === 0} sx={{ p: 0.25, color: "rgba(255,255,255,0.6)" }}>
                <RedoIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Chip
            size="small"
            label={rippleEnabled ? "Ripple on" : "Ripple off"}
            onClick={onToggleRipple}
            sx={{
              height: 18, fontSize: "8px", fontWeight: 700,
              bgcolor: rippleEnabled ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
              color: rippleEnabled ? "#6ee7b7" : "rgba(255,255,255,0.6)",
            }}
          />
        </>
      )}
      {dirty && !readOnly && (
        <Tooltip title="Save schedule">
          <IconButton size="small" onClick={onSave} disabled={saving} sx={{ p: 0.25, color: "#f59e0b" }}>
            {saving ? <CircularProgress size={12} sx={{ color: "#f59e0b" }} /> : <SaveIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  </Box>
);
