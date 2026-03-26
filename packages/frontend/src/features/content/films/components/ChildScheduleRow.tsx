"use client";

import React from "react";
import { Box, Typography, TextField } from "@mui/material";

interface ChildScheduleRowProps {
  name: string;
  startTime: string | null;
  durationMinutes: number | null;
  onStartTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  readOnly: boolean;
}

const inputSx = {
  fontSize: "9px", height: 22, color: "rgba(255,255,255,0.7)",
  bgcolor: "rgba(255,255,255,0.03)", "& input": { padding: "1px 4px" },
};

export const ChildScheduleRow: React.FC<ChildScheduleRowProps> = ({
  name, startTime, durationMinutes, onStartTimeChange, onDurationChange, readOnly,
}) => (
  <Box
    sx={{
      display: "flex", alignItems: "center", gap: 0.5,
      py: 0.5, pl: 2, pr: 0.5,
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}
  >
    <Typography
      sx={{
        fontSize: "10px", color: "rgba(255,255,255,0.6)", flex: 1,
        minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}
    >
      {name}
    </Typography>
    <TextField
      type="time" size="small" value={startTime ?? ""}
      onChange={(e) => onStartTimeChange(e.target.value)}
      disabled={readOnly}
      InputProps={{ sx: inputSx }}
      sx={{ width: 75 }}
    />
    <TextField
      type="number" size="small" value={durationMinutes ?? ""}
      onChange={(e) => onDurationChange(e.target.value)}
      disabled={readOnly} placeholder="m"
      InputProps={{ sx: inputSx, inputProps: { min: 0 } }}
      sx={{ width: 50 }}
    />
  </Box>
);
