"use client";

import React from "react";
import { EquipmentSummary, EquipmentType, FilmEquipmentAssignmentsBySlot } from "@/features/content/films/types/film-equipment.types";
import {
  Card, CardContent, TextField, Button, Typography, Box,
  CircularProgress, Alert, AlertTitle, Divider,
} from "@mui/material";
import { Videocam, Mic, Construction } from "@mui/icons-material";
import { useFilmEquipmentPanel } from "../hooks/useFilmEquipmentPanel";
import { EquipmentSlotSection } from "./EquipmentSlotSection";
import { EquipmentConfirmDialog } from "./EquipmentConfirmDialog";

interface FilmEquipmentPanelProps {
  filmId: number;
  onEquipmentChange?: (summary: EquipmentSummary) => void;
  onEquipmentAssignmentsChange?: (assignments: FilmEquipmentAssignmentsBySlot) => void;
}

const EQUIPMENT_FEATURE_ENABLED = true;

function EquipmentInput({
  icon: Icon, label, value, onChange,
}: {
  type: EquipmentType; icon: typeof Videocam; label: string; value: number; onChange: (val: number) => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Icon sx={{ color: "rgba(255,255,255,0.6)", fontSize: 20 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{label}</Typography>
      </Box>
      <TextField
        type="number" size="small" variant="outlined"
        inputProps={{ min: 0, max: 10, style: { color: "#fff", padding: "8px 12px", fontSize: "14px", textAlign: "center" } }}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))
        }
        sx={{
          width: "80px",
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255,255,255,0.05)",
            "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
            "&.Mui-focused fieldset": { borderColor: "#3ea6ff" },
          },
        }}
      />
    </Box>
  );
}

export function FilmEquipmentPanel({ filmId, onEquipmentChange, onEquipmentAssignmentsChange }: FilmEquipmentPanelProps) {
  if (!EQUIPMENT_FEATURE_ENABLED) {
    return (
      <Card><CardContent>
        <Alert severity="info" icon={<Construction />}>
          <AlertTitle>Equipment Management - Coming Soon</AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            We&apos;re building a comprehensive equipment management system.
          </Typography>
        </Alert>
      </CardContent></Card>
    );
  }

  const {
    loading, saving, error, confirmOpen, setConfirmOpen,
    equipmentOptions, cameraSelections, setCameraSelections,
    audioSelections, setAudioSelections,
    cameraQty, setCameraQty, audioQty, setAudioQty,
    isComplete, hasChanges, handleSave, handleConfirmRemoval,
  } = useFilmEquipmentPanel(filmId, onEquipmentChange, onEquipmentAssignmentsChange);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "rgba(255,255,255,0.7)" }}>
        <CircularProgress size={24} sx={{ color: "#3ea6ff" }} />
        <Typography variant="body2" sx={{ mt: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  const changed = hasChanges();
  const complete = isComplete();

  return (
    <Box sx={{ color: "#fff", height: "100%", display: "flex", flexDirection: "column", p: 2.5 }}>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" sx={{ backgroundColor: "rgba(211,47,47,0.1)", color: "#ff6b6b", "& .MuiAlert-icon": { color: "#ff6b6b" } }}>
            {error}
          </Alert>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <EquipmentInput type="CAMERA" icon={Videocam} label="Cameras" value={cameraQty} onChange={setCameraQty} />
        <EquipmentInput type="AUDIO" icon={Mic} label="Audio Recorders" value={audioQty} onChange={setAudioQty} />
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

      <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <EquipmentSlotSection
          type="camera" label="Camera Assignments" emptyLabel="No camera tracks configured."
          selectPlaceholder="Select camera" quantity={cameraQty} options={equipmentOptions.cameras}
          selections={cameraSelections}
          onSelectionChange={(slot, val) => setCameraSelections((prev) => ({ ...prev, [slot]: val }))}
        />
        <EquipmentSlotSection
          type="audio" label="Audio Assignments" emptyLabel="No audio tracks configured."
          selectPlaceholder="Select recorder" quantity={audioQty} options={equipmentOptions.audio}
          selections={audioSelections}
          onSelectionChange={(slot, val) => setAudioSelections((prev) => ({ ...prev, [slot]: val }))}
        />
      </Box>

      <Box>
        <Button
          fullWidth variant="contained" onClick={handleSave}
          disabled={saving || !changed || !complete}
          sx={{
            backgroundColor: changed ? "#3ea6ff" : "rgba(255,255,255,0.08)",
            color: changed ? "#fff" : "rgba(255,255,255,0.4)",
            fontWeight: 600, py: 1.25, textTransform: "none", fontSize: "0.9rem",
            "&:hover": { backgroundColor: changed ? "#2d8fd9" : "rgba(255,255,255,0.12)" },
            "&:disabled": { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" },
          }}
        >
          {saving ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} sx={{ color: "inherit" }} /><span>Updating...</span>
            </Box>
          ) : changed ? "Save & Update Tracks" : "No changes"}
        </Button>
      </Box>

      <EquipmentConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRemoval}
      />
    </Box>
  );
}
