"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { EquipmentSummary, EquipmentType, FilmEquipmentAssignmentsBySlot, EquipmentSlotKey } from "@/types/film-equipment.types";
import { Equipment, EquipmentAvailability, EquipmentCategory } from "@/lib/types";
import {
  buildAssignmentsBySlot,
  buildEquipmentSlotKey,
  buildEquipmentSlotNote,
  formatEquipmentLabel,
} from "@/lib/utils/equipmentAssignments";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
} from "@mui/material";
import { Videocam, Mic, Construction } from "@mui/icons-material";

interface FilmEquipmentPanelProps {
  filmId: number;
  onEquipmentChange?: (summary: EquipmentSummary) => void;
  onEquipmentAssignmentsChange?: (assignments: FilmEquipmentAssignmentsBySlot) => void;
}

// Feature flag - enable equipment panel
const EQUIPMENT_FEATURE_ENABLED = true;

export function FilmEquipmentPanel({ filmId, onEquipmentChange, onEquipmentAssignmentsChange }: FilmEquipmentPanelProps) {
  const [summary, setSummary] = useState<EquipmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<{ cameras: number; audio: number } | null>(null);

  const [equipmentOptions, setEquipmentOptions] = useState<{ cameras: Equipment[]; audio: Equipment[] }>({
    cameras: [],
    audio: [],
  });
  const [assignmentsBySlot, setAssignmentsBySlot] = useState<FilmEquipmentAssignmentsBySlot>({});
  const [cameraSelections, setCameraSelections] = useState<Record<number, number | "">>({});
  const [audioSelections, setAudioSelections] = useState<Record<number, number | "">>({});

  // Simplified state
  const [cameraQty, setCameraQty] = useState(0);
  const [audioQty, setAudioQty] = useState(0);

  // Show "Coming Soon" message if feature is disabled
  if (!EQUIPMENT_FEATURE_ENABLED) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info" icon={<Construction />}>
            <AlertTitle>Equipment Management - Coming Soon</AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We're building a comprehensive equipment management system that will allow you to:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Manage your equipment library (cameras, audio, lighting)</li>
              <li>Create reusable equipment package templates</li>
              <li>Assign specific equipment to each film</li>
              <li>Track equipment availability and usage</li>
              <li>Link equipment to recording setups</li>
            </Box>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    loadEquipment();
  }, [filmId]);

  const buildSelectionState = (
    quantity: number,
    type: "camera" | "audio",
    slotAssignments: FilmEquipmentAssignmentsBySlot,
    previous?: Record<number, number | "">
  ) => {
    const next: Record<number, number | ""> = {};
    for (let i = 1; i <= quantity; i += 1) {
      const slotKey = buildEquipmentSlotKey(type, i);
      next[i] = previous?.[i] ?? slotAssignments[slotKey]?.equipmentId ?? "";
    }
    return next;
  };

  const getSelectedIds = (selections: Record<number, number | "">) =>
    Object.values(selections).filter((value): value is number => typeof value === "number");

  const hasDuplicateSelections = (selections: Record<number, number | "">) => {
    const values = getSelectedIds(selections);
    return values.length !== new Set(values).size;
  };

  const formatOptionLabel = (item: Equipment) =>
    formatEquipmentLabel({ equipmentName: item.item_name, equipmentModel: item.model });

  const buildSlotSelectionMap = () => {
    const map: Record<string, number> = {};
    Object.entries(cameraSelections).forEach(([slotIndex, equipmentId]) => {
      if (typeof equipmentId === "number") {
        map[buildEquipmentSlotKey("camera", Number(slotIndex))] = equipmentId;
      }
    });
    Object.entries(audioSelections).forEach(([slotIndex, equipmentId]) => {
      if (typeof equipmentId === "number") {
        map[buildEquipmentSlotKey("audio", Number(slotIndex))] = equipmentId;
      }
    });
    return map;
  };

  const loadEquipment = async (notifyChange: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current equipment counts from tracks
      const [tracks, assignments, equipmentGrouped] = await Promise.all([
        api.films.tracks.getAll(filmId),
        api.films.equipmentAssignments.getAll(filmId),
        api.equipment.getGroupedByCategory(),
      ]);

      // Count cameras and audio from tracks
      const cameras = tracks.filter((t: any) => t.type === 'VIDEO').length;
      const audio = tracks.filter((t: any) => t.type === 'AUDIO').length;

      const camerasLibrary = (equipmentGrouped[EquipmentCategory.CAMERA]?.equipment || [])
        .filter((item) => item.is_active && item.availability_status === EquipmentAvailability.AVAILABLE);
      const audioLibrary = (equipmentGrouped[EquipmentCategory.AUDIO]?.equipment || [])
        .filter((item) => item.is_active && item.availability_status === EquipmentAvailability.AVAILABLE);

      setEquipmentOptions({ cameras: camerasLibrary, audio: audioLibrary });
      
      setCameraQty(cameras);
      setAudioQty(audio);

      const assignmentsBySlotMap = buildAssignmentsBySlot(assignments);
      setAssignmentsBySlot(assignmentsBySlotMap);
      onEquipmentAssignmentsChange?.(assignmentsBySlotMap);

      setCameraSelections((prev) => buildSelectionState(cameras, "camera", assignmentsBySlotMap, prev));
      setAudioSelections((prev) => buildSelectionState(audio, "audio", assignmentsBySlotMap, prev));

      const summaryData: EquipmentSummary = {
        cameras,
        audio,
        music: 0,
        totalTracks: cameras + audio,
        tracks,
      };
      setSummary(summaryData);

      // Notify parent of equipment changes
      if (notifyChange && onEquipmentChange) {
        onEquipmentChange(summaryData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load equipment";
      setError(errorMessage);
      console.error("Equipment load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCameraSelections((prev) => buildSelectionState(cameraQty, "camera", assignmentsBySlot, prev));
  }, [cameraQty, assignmentsBySlot]);

  useEffect(() => {
    setAudioSelections((prev) => buildSelectionState(audioQty, "audio", assignmentsBySlot, prev));
  }, [audioQty, assignmentsBySlot]);

  const isAssignmentsComplete = () => {
    const cameraSelected = getSelectedIds(cameraSelections).length === cameraQty;
    const audioSelected = getSelectedIds(audioSelections).length === audioQty;
    return cameraSelected && audioSelected && !hasDuplicateSelections(cameraSelections) && !hasDuplicateSelections(audioSelections);
  };

  const hasAssignmentChanges = () => {
    const nextSelections = buildSlotSelectionMap();
    const nextKeys = new Set(Object.keys(nextSelections));

    for (const [slotKey, assignment] of Object.entries(assignmentsBySlot)) {
      if (!nextKeys.has(slotKey)) return true;
      if (nextSelections[slotKey] !== assignment.equipmentId) return true;
    }

    for (const [slotKey, equipmentId] of Object.entries(nextSelections)) {
      const prev = assignmentsBySlot[slotKey as keyof FilmEquipmentAssignmentsBySlot];
      if (!prev || prev.equipmentId !== equipmentId) return true;
    }

    return false;
  };

  const saveEquipment = async (nextCameras: number, nextAudio: number, allowRemoval: boolean) => {
    try {
      setSaving(true);
      setError(null);
      
      // Update equipment via PATCH /films/:id/equipment
      await api.films.equipment.update(filmId, {
        num_cameras: nextCameras,
        num_audio: nextAudio,
        allow_removal: allowRemoval,
      });

      await syncAssignments();
      await loadEquipment(true); // Reload and notify parent
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save equipment";
      setError(errorMessage);
      console.error("Failed to save equipment:", error);
    } finally {
      setSaving(false);
    }
  };

  const syncAssignments = async () => {
    const nextSelections = buildSlotSelectionMap();
    const nextKeys = new Set(Object.keys(nextSelections));

    const removePromises: Promise<void>[] = [];
    const addPromises: Promise<void>[] = [];

    Object.entries(assignmentsBySlot).forEach(([slotKey, assignment]) => {
      const nextEquipmentId = nextSelections[slotKey];
      if (!nextEquipmentId || nextEquipmentId !== assignment.equipmentId) {
        removePromises.push(api.films.equipmentAssignments.remove(filmId, assignment.equipmentId));
      }
    });

    Object.entries(nextSelections).forEach(([slotKey, equipmentId]) => {
      const prev = assignmentsBySlot[slotKey as keyof FilmEquipmentAssignmentsBySlot];
      if (!prev || prev.equipmentId !== equipmentId) {
        addPromises.push(
          api.films.equipmentAssignments.assign(filmId, {
            equipment_id: equipmentId,
            quantity: 1,
            notes: buildEquipmentSlotNote(slotKey as EquipmentSlotKey),
          }).then(() => undefined)
        );
      } else if (prev && prev.slotKey !== slotKey) {
        addPromises.push(
          api.films.equipmentAssignments.update(filmId, equipmentId, {
            notes: buildEquipmentSlotNote(slotKey as EquipmentSlotKey),
          }).then(() => undefined)
        );
      }
    });

    if (removePromises.length || addPromises.length) {
      await Promise.all([...removePromises, ...addPromises]);
    }

    const updatedAssignments = await api.films.equipmentAssignments.getAll(filmId);
    const updatedBySlot = buildAssignmentsBySlot(updatedAssignments);
    setAssignmentsBySlot(updatedBySlot);
    onEquipmentAssignmentsChange?.(updatedBySlot);
  };

  const handleSaveEquipment = async () => {
    if (!summary) return;

    if (!isAssignmentsComplete()) {
      setError("Please assign equipment for each camera and audio slot before saving.");
      return;
    }

    const isReducing = cameraQty < summary.cameras || audioQty < summary.audio;
    if (isReducing) {
      setPendingCounts({ cameras: cameraQty, audio: audioQty });
      setConfirmOpen(true);
      return;
    }

    await saveEquipment(cameraQty, audioQty, false);
  };

  const handleConfirmRemoval = async () => {
    if (!pendingCounts) {
      setConfirmOpen(false);
      return;
    }

    setConfirmOpen(false);
    await saveEquipment(pendingCounts.cameras, pendingCounts.audio, true);
    setPendingCounts(null);
  };

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!summary) return false;
    return cameraQty !== summary.cameras || audioQty !== summary.audio || hasAssignmentChanges();
  };

  const EquipmentInput = ({
    type,
    icon: Icon,
    label,
    value,
    onChange,
  }: {
    type: EquipmentType;
    icon: typeof Videocam;
    label: string;
    value: number;
    onChange: (val: number) => void;
  }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
          {label}
        </Typography>
      </Box>
      
      <TextField
        type="number"
        size="small"
        variant="outlined"
        inputProps={{ min: 0, max: 10, style: { color: '#fff', padding: '8px 12px', fontSize: '14px', textAlign: 'center' } }}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          onChange(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))
        }
        sx={{ 
          width: '80px',
          '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.05)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
              '&.Mui-focused fieldset': { borderColor: '#3ea6ff' },
          }
        }}
      />
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: 'rgba(255,255,255,0.7)' }}>
        <CircularProgress size={24} sx={{ color: '#3ea6ff' }} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      color: '#fff', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: 2.5,
    }}>
      {/* Error Alert */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" sx={{ 
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            color: '#ff6b6b',
            '& .MuiAlert-icon': { color: '#ff6b6b' }
          }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Equipment Inputs */}
      <Box sx={{ mb: 3 }}>
        <EquipmentInput
          type="CAMERA"
          icon={Videocam}
          label="Cameras"
          value={cameraQty}
          onChange={setCameraQty}
        />
        <EquipmentInput
          type="AUDIO"
          icon={Mic}
          label="Audio Recorders"
          value={audioQty}
          onChange={setAudioQty}
        />
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

      {/* Equipment Assignments */}
      <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
            Camera Assignments
          </Typography>
          {cameraQty === 0 ? (
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, mt: 1 }}>
              No camera tracks configured.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
              {Array.from({ length: cameraQty }, (_, index) => {
                const slotIndex = index + 1;
                const slotSelection = cameraSelections[slotIndex] ?? "";
                const selectedIds = new Set(getSelectedIds(cameraSelections));
                return (
                  <FormControl key={`camera-slot-${slotIndex}`} fullWidth size="small">
                    <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>{`Camera ${slotIndex}`}</InputLabel>
                    <Select
                      value={slotSelection}
                      label={`Camera ${slotIndex}`}
                      onChange={(e) => {
                        const value = e.target.value as number | "";
                        setCameraSelections((prev) => ({ ...prev, [slotIndex]: value }));
                      }}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return "Select camera";
                        const item = equipmentOptions.cameras.find((option) => option.id === selected);
                        return item ? formatOptionLabel(item) : "Select camera";
                      }}
                      sx={{ color: "white" }}
                    >
                      <MenuItem value="">
                        <em>Select camera</em>
                      </MenuItem>
                      {equipmentOptions.cameras.map((item) => {
                        const isSelectedElsewhere = selectedIds.has(item.id) && slotSelection !== item.id;
                        return (
                          <MenuItem key={`camera-option-${item.id}`} value={item.id} disabled={isSelectedElsewhere}>
                            {formatOptionLabel(item)}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                );
              })}
              {equipmentOptions.cameras.length < cameraQty && (
                <FormHelperText sx={{ color: "rgba(255,255,255,0.6)" }}>
                  Not enough available cameras in your library.
                </FormHelperText>
              )}
            </Box>
          )}
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
            Audio Assignments
          </Typography>
          {audioQty === 0 ? (
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, mt: 1 }}>
              No audio tracks configured.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
              {Array.from({ length: audioQty }, (_, index) => {
                const slotIndex = index + 1;
                const slotSelection = audioSelections[slotIndex] ?? "";
                const selectedIds = new Set(getSelectedIds(audioSelections));
                return (
                  <FormControl key={`audio-slot-${slotIndex}`} fullWidth size="small">
                    <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>{`Audio ${slotIndex}`}</InputLabel>
                    <Select
                      value={slotSelection}
                      label={`Audio ${slotIndex}`}
                      onChange={(e) => {
                        const value = e.target.value as number | "";
                        setAudioSelections((prev) => ({ ...prev, [slotIndex]: value }));
                      }}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return "Select recorder";
                        const item = equipmentOptions.audio.find((option) => option.id === selected);
                        return item ? formatOptionLabel(item) : "Select recorder";
                      }}
                      sx={{ color: "white" }}
                    >
                      <MenuItem value="">
                        <em>Select recorder</em>
                      </MenuItem>
                      {equipmentOptions.audio.map((item) => {
                        const isSelectedElsewhere = selectedIds.has(item.id) && slotSelection !== item.id;
                        return (
                          <MenuItem key={`audio-option-${item.id}`} value={item.id} disabled={isSelectedElsewhere}>
                            {formatOptionLabel(item)}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                );
              })}
              {equipmentOptions.audio.length < audioQty && (
                <FormHelperText sx={{ color: "rgba(255,255,255,0.6)" }}>
                  Not enough available audio recorders in your library.
                </FormHelperText>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Save Button */}
      <Box>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSaveEquipment}
          disabled={saving || !hasChanges() || !isAssignmentsComplete()}
          sx={{
            backgroundColor: hasChanges() ? '#3ea6ff' : 'rgba(255,255,255,0.08)',
            color: hasChanges() ? '#fff' : 'rgba(255,255,255,0.4)',
            fontWeight: 600,
            py: 1.25,
            textTransform: 'none',
            fontSize: '0.9rem',
            '&:hover': {
              backgroundColor: hasChanges() ? '#2d8fd9' : 'rgba(255,255,255,0.12)',
            },
            '&:disabled': {
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          {saving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: 'inherit' }} />
              <span>Updating...</span>
            </Box>
          ) : hasChanges() ? (
            'Save & Update Tracks'
          ) : (
            'No changes'
          )}
        </Button>
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#141416",
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: 700 }}>
          Reduce equipment?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>
            Reducing cameras or audio will remove track assignments on those tracks. Continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: "rgba(255,255,255,0.7)" }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemoval}
            variant="contained"
            sx={{ bgcolor: "#FF6B6B", '&:hover': { bgcolor: '#e65a5a' } }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
