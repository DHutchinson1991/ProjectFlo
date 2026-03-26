"use client";

import React from "react";
import { Box, TextField, Select, MenuItem, Chip, FormControl } from "@mui/material";
import type { SchedulePreset } from "../types/schedule-panel.types";

interface SchedulePresetBarProps {
  presetList: SchedulePreset[];
  selectedPresetId: number | null;
  presetNameDraft: string;
  onPresetSelect: (id: number | null, name: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onApply: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const SchedulePresetBar: React.FC<SchedulePresetBarProps> = ({
  presetList, selectedPresetId, presetNameDraft,
  onPresetSelect, onNameChange, onSave, onApply, onRename, onDelete,
}) => (
  <Box sx={{ display: "flex", gap: 0.5, px: 1, py: 0.5, alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, flexWrap: "wrap" }}>
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select value={selectedPresetId ?? ""} displayEmpty
        onChange={(e) => {
          const value = e.target.value === "" ? null : Number(e.target.value);
          const selected = presetList.find((p) => p.id === value);
          onPresetSelect(value, selected?.name ?? "");
        }}
        sx={{ fontSize: "10px", height: 24, color: "rgba(255,255,255,0.9)", bgcolor: "rgba(255,255,255,0.06)" }}>
        <MenuItem value="" sx={{ fontSize: "10px" }}><em>No preset</em></MenuItem>
        {presetList.map((preset) => (
          <MenuItem key={preset.id} value={preset.id} sx={{ fontSize: "10px" }}>{preset.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
    <TextField size="small" placeholder="Preset name" value={presetNameDraft}
      onChange={(e) => onNameChange(e.target.value)}
      sx={{ width: 120, "& .MuiInputBase-root": { height: 24, fontSize: "10px", color: "rgba(255,255,255,0.9)", bgcolor: "rgba(255,255,255,0.06)" } }} />
    <Chip size="small" label="Save" onClick={onSave} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(123,97,255,0.15)", color: "#c4b5fd" }} />
    <Chip size="small" label="Apply" onClick={onApply} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(59,130,246,0.15)", color: "#93c5fd" }} />
    <Chip size="small" label="Rename" onClick={onRename} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(245,158,11,0.15)", color: "#fbbf24" }} />
    <Chip size="small" label="Delete" onClick={onDelete} sx={{ height: 18, fontSize: "8px", bgcolor: "rgba(239,68,68,0.15)", color: "#fca5a5" }} />
  </Box>
);
