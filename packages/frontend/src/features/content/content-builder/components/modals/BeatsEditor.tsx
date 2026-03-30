"use client";

import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";

interface Beat {
  id?: string;
  name: string;
  duration_seconds: number;
  shot_count: number;
}

interface NewBeat {
  name: string;
  duration_seconds: number;
  shot_count: number;
}

interface BeatsEditorProps {
  beats: Beat[];
  newBeat: NewBeat;
  editingBeatId: string | null;
  totalDuration: number;
  onNewBeatChange: (beat: NewBeat) => void;
  onAddBeat: () => void;
  onRemoveBeat: (id?: string) => void;
  onUpdateBeat: (
    id: string | undefined,
    updates: { name?: string; duration_seconds?: number; shot_count?: number },
  ) => void;
  onEditingIdChange: (id: string | null) => void;
}

export function BeatsEditor({
  beats,
  newBeat,
  editingBeatId,
  totalDuration,
  onNewBeatChange,
  onAddBeat,
  onRemoveBeat,
  onUpdateBeat,
  onEditingIdChange,
}: BeatsEditorProps) {
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: "white",
      "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.15)" },
      "&.Mui-focused fieldset": { borderColor: "#7B61FF" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
  };

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: "rgba(255,255,255,0.02)",
        borderRadius: 1.5,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Typography
        sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, mb: 1.5, fontWeight: 500 }}
      >
        Beats ({beats.length}){beats.length > 0 ? ` · ${totalDuration}s` : ""}
      </Typography>

      {/* Add Beat Form */}
      <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <TextField
          placeholder="Beat name"
          value={newBeat.name}
          onChange={(e) => onNewBeatChange({ ...newBeat, name: e.target.value })}
          size="small"
          sx={{ flex: 1, minWidth: 160, ...inputSx }}
        />
        <TextField
          placeholder="Sec"
          type="number"
          value={newBeat.duration_seconds}
          onChange={(e) =>
            onNewBeatChange({ ...newBeat, duration_seconds: parseInt(e.target.value) || 1 })
          }
          inputProps={{ min: 1, step: 1 }}
          size="small"
          sx={{ width: 80, ...inputSx }}
        />
        <TextField
          placeholder="Shots"
          type="number"
          value={newBeat.shot_count}
          onChange={(e) =>
            onNewBeatChange({
              ...newBeat,
              shot_count: Math.max(0, parseInt(e.target.value) || 0),
            })
          }
          inputProps={{ min: 0, step: 1 }}
          size="small"
          sx={{ width: 70, ...inputSx }}
        />
        <Button
          onClick={onAddBeat}
          size="small"
          sx={{
            minWidth: 40,
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            textTransform: "none",
            "&:hover": { color: "#a78bfa", bgcolor: "rgba(123,97,255,0.08)" },
          }}
        >
          + Add
        </Button>
      </Box>

      {/* Beats List */}
      {beats.length > 0 && (
        <List
          sx={{
            maxHeight: 250,
            overflow: "auto",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              "&:hover": { background: "rgba(255,255,255,0.14)" },
            },
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          {beats.map((beat) => (
            <ListItem
              key={beat.id}
              secondaryAction={
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <IconButton
                    edge="end"
                    onClick={() =>
                      onEditingIdChange(editingBeatId === beat.id ? null : (beat.id ?? null))
                    }
                    size="small"
                    title="Edit beat"
                  >
                    {editingBeatId === beat.id ? (
                      <CheckIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.4)" }} />
                    ) : (
                      <EditIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.2)" }} />
                    )}
                  </IconButton>
                  <IconButton edge="end" onClick={() => onRemoveBeat(beat.id)} size="small">
                    <DeleteIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.15)" }} />
                  </IconButton>
                </Box>
              }
              sx={{
                bgcolor: "rgba(255,255,255,0.03)",
                borderRadius: 1,
                mb: 0.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              {editingBeatId === beat.id ? (
                <Box sx={{ display: "flex", gap: 1, width: "100%", pr: 8 }}>
                  <TextField
                    value={beat.name}
                    onChange={(e) => onUpdateBeat(beat.id, { name: e.target.value })}
                    placeholder="Beat name"
                    size="small"
                    sx={{ flex: 1, ...inputSx }}
                  />
                  <TextField
                    type="number"
                    value={beat.duration_seconds}
                    onChange={(e) =>
                      onUpdateBeat(beat.id, { duration_seconds: parseInt(e.target.value) || 1 })
                    }
                    inputProps={{ min: 1, step: 1 }}
                    size="small"
                    sx={{ width: 80, ...inputSx }}
                  />
                  <TextField
                    type="number"
                    value={beat.shot_count}
                    onChange={(e) =>
                      onUpdateBeat(beat.id, {
                        shot_count: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    inputProps={{ min: 0, step: 1 }}
                    size="small"
                    sx={{ width: 70, ...inputSx }}
                  />
                </Box>
              ) : (
                <ListItemText
                  primary={beat.name}
                  secondary={`${beat.duration_seconds}s · ${beat.shot_count} shots`}
                  sx={{
                    "& .MuiListItemText-primary": { color: "rgba(255,255,255,0.8)", fontSize: 13 },
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 11,
                    },
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
