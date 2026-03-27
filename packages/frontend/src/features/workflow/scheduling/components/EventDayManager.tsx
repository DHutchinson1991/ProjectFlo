"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  Chip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIcon,
  Schedule as ScheduleIcon,
  Videocam as FilmIcon,
} from "@mui/icons-material";
import { scheduleApi } from '@/features/workflow/scheduling/api';

// ─── Types ──────────────────────────────────────────────────────────────

export interface EventDay {
  id: number;
  name: string;
  description?: string | null;
  order_index: number;
  is_active?: boolean;
  _joinId?: number; // PackageEventDay join table ID (set when loaded via package context)
}

export interface EventDayFilmScene {
  filmId: number;
  filmName: string;
  sceneId: number;
  sceneName: string;
  sceneMode: string;
  startTime?: string | null;
  durationMinutes?: number | null;
  endTime?: string | null;
}

interface EventDayManagerProps {
  brandId: number;
  eventDays: EventDay[];
  /** Map of event_day_id → scenes from all films assigned to that day */
  crossFilmScenes?: Map<number, EventDayFilmScene[]>;
  onEventDaysChange: (eventDays: EventDay[]) => void;
  /** Compact mode for embedding in side panels */
  compact?: boolean;
  readOnly?: boolean;
  /** When set, manager operates in "package mode": +adds from brand pool, delete removes assignment */
  packageId?: number;
}

// ─── Add/Edit Dialog ────────────────────────────────────────────────────

interface EventDayDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; order_index: number }) => Promise<void>;
  initial?: EventDay | null;
  saving: boolean;
}

const EventDayDialog: React.FC<EventDayDialogProps> = ({
  open,
  onClose,
  onSave,
  initial,
  saving,
}) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [orderIndex, setOrderIndex] = useState(initial?.order_index ?? 0);

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setOrderIndex(initial?.order_index ?? 0);
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), description: description.trim(), order_index: orderIndex });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ fontSize: "1rem", fontWeight: 700 }}>
        {initial ? "Edit Event Day" : "Add Event Day"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. Wedding Day, Rehearsal Dinner"
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Brief description of this event day..."
          />
          <TextField
            label="Display Order"
            type="number"
            value={orderIndex}
            onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
            size="small"
            sx={{ width: 120 }}
            inputProps={{ min: 0 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={14} /> : undefined}
        >
          {initial ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Package Event Day Picker Dialog ────────────────────────────────────
// Shows brand-level event days as checkboxes; user picks which ones apply to this package

interface PackageEventDayPickerDialogProps {
  open: boolean;
  onClose: () => void;
  brandId: number;
  packageId: number;
  currentEventDayIds: Set<number>;
  onSave: (selectedIds: number[]) => Promise<void>;
  saving: boolean;
}

const PackageEventDayPickerDialog: React.FC<PackageEventDayPickerDialogProps> = ({
  open,
  onClose,
  brandId,
  currentEventDayIds,
  onSave,
  saving,
}) => {
  const [allBrandDays, setAllBrandDays] = useState<EventDay[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loadingDays, setLoadingDays] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(currentEventDayIds));
      setLoadingDays(true);
      scheduleApi.eventDays
        .getAll(brandId)
        .then((days: EventDay[]) => setAllBrandDays(days))
        .catch(console.error)
        .finally(() => setLoadingDays(false));
    }
  }, [open, brandId, currentEventDayIds]);

  const handleToggle = (dayId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const handleSubmit = async () => {
    await onSave(Array.from(selectedIds));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { bgcolor: "background.paper", backgroundImage: "none" } }}
    >
      <DialogTitle sx={{ fontSize: "1rem", fontWeight: 700 }}>
        Select Event Days for Package
      </DialogTitle>
      <DialogContent>
        {loadingDays ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : allBrandDays.length === 0 ? (
          <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", py: 2, textAlign: "center" }}>
            No event days defined for this brand. Create them first in the film schedule view.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pt: 1 }}>
            {allBrandDays.map((day) => (
              <FormControlLabel
                key={day.id}
                control={
                  <Checkbox
                    checked={selectedIds.has(day.id)}
                    onChange={() => handleToggle(day.id)}
                    size="small"
                    sx={{ color: "#f59e0b", "&.Mui-checked": { color: "#f59e0b" } }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                    <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.85)" }}>
                      {day.name}
                    </Typography>
                    {day.description && (
                      <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                        — {day.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  mx: 0,
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(245,158,11,0.06)" },
                }}
              />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : undefined}
          sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" } }}
        >
          Save Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Event Day Card ─────────────────────────────────────────────────────

interface EventDayCardProps {
  eventDay: EventDay;
  scenes?: EventDayFilmScene[];
  compact?: boolean;
  readOnly?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Drag reorder callbacks */
  onDragStart?: (e: React.DragEvent, dayId: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (dayId: number) => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent, dayId: number) => void;
  isDragTarget?: boolean;
}

const EventDayCard: React.FC<EventDayCardProps> = ({
  eventDay,
  scenes = [],
  compact,
  readOnly,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragEnd,
  onDrop,
  isDragTarget,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Group scenes by film
  const filmGroups = React.useMemo(() => {
    const groups = new Map<number, { filmName: string; scenes: EventDayFilmScene[] }>();
    for (const scene of scenes) {
      if (!groups.has(scene.filmId)) {
        groups.set(scene.filmId, { filmName: scene.filmName, scenes: [] });
      }
      groups.get(scene.filmId)!.scenes.push(scene);
    }
    return groups;
  }, [scenes]);

  const totalMinutes = scenes.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const filmCount = filmGroups.size;

  if (compact) {
    return (
      <Box
        draggable={!readOnly && !!onDragStart}
        onDragStart={(e) => onDragStart?.(e, eventDay.id)}
        onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
        onDragEnter={() => onDragEnter?.(eventDay.id)}
        onDragEnd={() => onDragEnd?.()}
        onDrop={(e) => onDrop?.(e, eventDay.id)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          py: 0.5,
          px: 0.75,
          borderRadius: 1,
          bgcolor: isDragTarget ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.06)",
          border: isDragTarget ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(245,158,11,0.12)",
          "&:hover": { bgcolor: "rgba(245,158,11,0.1)" },
          cursor: !readOnly && !!onDragStart ? "grab" : undefined,
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      >
        <CalendarIcon sx={{ fontSize: 13, color: "#f59e0b", flexShrink: 0 }} />
        <Typography
          sx={{
            fontSize: "10px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {eventDay.name}
        </Typography>
        {scenes.length > 0 && (
          <Chip
            label={`${scenes.length} scenes`}
            size="small"
            sx={{
              fontSize: "8px",
              height: 16,
              bgcolor: "rgba(245,158,11,0.12)",
              color: "#f59e0b",
            }}
          />
        )}
        {!readOnly && (
          <>
            <IconButton size="small" onClick={onEdit} sx={{ p: 0.25, color: "rgba(255,255,255,0.4)" }}>
              <EditIcon sx={{ fontSize: 11 }} />
            </IconButton>
            <IconButton size="small" onClick={onDelete} sx={{ p: 0.25, color: "rgba(244,67,54,0.5)" }}>
              <DeleteIcon sx={{ fontSize: 11 }} />
            </IconButton>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box
      draggable={!readOnly && !!onDragStart}
      onDragStart={(e) => onDragStart?.(e, eventDay.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDragEnter={() => onDragEnter?.(eventDay.id)}
      onDragEnd={() => onDragEnd?.()}
      onDrop={(e) => onDrop?.(e, eventDay.id)}
      sx={{
        borderRadius: 2,
        border: isDragTarget
          ? "2px solid rgba(245,158,11,0.6)"
          : "1px solid rgba(245,158,11,0.15)",
        bgcolor: isDragTarget
          ? "rgba(245,158,11,0.08)"
          : "rgba(245,158,11,0.04)",
        overflow: "hidden",
        transition: "all 0.2s ease",
        "&:hover": {
          border: "1px solid rgba(245,158,11,0.25)",
          bgcolor: "rgba(245,158,11,0.06)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: scenes.length > 0 ? "pointer" : "default",
        }}
        onClick={scenes.length > 0 ? () => setExpanded(!expanded) : undefined}
      >
        <DragIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.15)", cursor: "grab" }} />
        <CalendarIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {eventDay.name}
          </Typography>
          {eventDay.description && (
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", mt: 0.25 }}>
              {eventDay.description}
            </Typography>
          )}
        </Box>

        {/* Stats chips */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {filmCount > 0 && (
            <Tooltip title={`${filmCount} film${filmCount > 1 ? "s" : ""} on this day`}>
              <Chip
                icon={<FilmIcon sx={{ fontSize: "12px !important" }} />}
                label={filmCount}
                size="small"
                sx={{
                  fontSize: "10px",
                  height: 22,
                  bgcolor: "rgba(100,140,255,0.1)",
                  color: "#648CFF",
                  "& .MuiChip-icon": { color: "#648CFF" },
                }}
              />
            </Tooltip>
          )}
          {scenes.length > 0 && (
            <Chip
              icon={<ScheduleIcon sx={{ fontSize: "12px !important" }} />}
              label={`${scenes.length} scenes`}
              size="small"
              sx={{
                fontSize: "10px",
                height: 22,
                bgcolor: "rgba(245,158,11,0.1)",
                color: "#f59e0b",
                "& .MuiChip-icon": { color: "#f59e0b" },
              }}
            />
          )}
          {totalMinutes > 0 && (
            <Chip
              label={totalMinutes < 60 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
              size="small"
              sx={{
                fontSize: "10px",
                height: 22,
                bgcolor: "rgba(59,130,246,0.1)",
                color: "#3b82f6",
              }}
            />
          )}
        </Box>

        {/* Actions */}
        {!readOnly && (
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Edit event day">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#f59e0b" } }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete event day">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                sx={{ color: "rgba(255,255,255,0.25)", "&:hover": { color: "#f44336" } }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {scenes.length > 0 && (
          <IconButton size="small" sx={{ p: 0.25, color: "rgba(255,255,255,0.3)" }}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}
      </Box>

      {/* Expanded cross-film scene list */}
      <Collapse in={expanded}>
        <Box
          sx={{
            px: 2,
            pb: 1.5,
            borderTop: "1px solid rgba(245,158,11,0.1)",
          }}
        >
          {Array.from(filmGroups.entries()).map(([filmId, group]) => (
            <Box key={filmId} sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <FilmIcon sx={{ fontSize: 13, color: "#648CFF" }} />
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#648CFF" }}>
                  {group.filmName}
                </Typography>
              </Box>
              {group.scenes
                .sort((a, b) => (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"))
                .map((scene) => (
                  <Box
                    key={`${scene.filmId}-${scene.sceneId}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 0.5,
                      px: 1.5,
                      borderRadius: 1,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        color: "rgba(255,255,255,0.7)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {scene.sceneName}
                    </Typography>
                    {scene.startTime && (
                      <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                        {scene.startTime}
                      </Typography>
                    )}
                    {scene.durationMinutes && (
                      <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>
                        {scene.durationMinutes}m
                      </Typography>
                    )}
                    {scene.endTime && (
                      <Typography sx={{ fontSize: "0.68rem", color: "rgba(59,130,246,0.6)", fontFamily: "monospace" }}>
                        → {scene.endTime}
                      </Typography>
                    )}
                  </Box>
                ))}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

// ─── Main EventDayManager Component ─────────────────────────────────────

export const EventDayManager: React.FC<EventDayManagerProps> = ({
  brandId,
  eventDays,
  crossFilmScenes,
  onEventDaysChange,
  compact = false,
  readOnly = false,
  packageId,
}) => {
  const isPackageMode = !!packageId;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<EventDay | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenCreate = useCallback(() => {
    if (isPackageMode) {
      // In package mode, open the picker instead of the create dialog
      setPickerOpen(true);
    } else {
      setEditingDay(null);
      setDialogOpen(true);
    }
  }, [isPackageMode]);

  const handleOpenEdit = useCallback((day: EventDay) => {
    setEditingDay(day);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setEditingDay(null);
  }, []);

  const handleSave = useCallback(
    async (data: { name: string; description: string; order_index: number }) => {
      setSaving(true);
      setError(null);
      try {
        if (editingDay) {
          const updated = await scheduleApi.eventDays.update(brandId, editingDay.id, data);
          onEventDaysChange(
            eventDays.map((d) => (d.id === editingDay.id ? { ...d, ...updated } : d))
          );
        } else {
          const created = await scheduleApi.eventDays.create(brandId, data);
          onEventDaysChange([...eventDays, created]);
        }
        handleClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to save event day");
      } finally {
        setSaving(false);
      }
    },
    [brandId, editingDay, eventDays, onEventDaysChange, handleClose]
  );

  const handleDelete = useCallback(
    async (day: EventDay) => {
      setSaving(true);
      setError(null);
      try {
        if (isPackageMode && packageId) {
          // In package mode: remove assignment, don't delete the template
          await scheduleApi.packageEventDays.remove(packageId, day.id);
        } else {
          // In brand mode: soft-delete the template
          await scheduleApi.eventDays.delete(brandId, day.id);
        }
        onEventDaysChange(eventDays.filter((d) => d.id !== day.id));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to remove event day");
      } finally {
        setSaving(false);
      }
    },
    [brandId, eventDays, onEventDaysChange, isPackageMode, packageId]
  );

  // Package event day picker: bulk set which event days belong to this package
  const handlePickerSave = useCallback(
    async (selectedIds: number[]) => {
      if (!packageId) return;
      setSaving(true);
      setError(null);
      try {
        const updated = await scheduleApi.packageEventDays.set(packageId, selectedIds);
        onEventDaysChange(updated);
        setPickerOpen(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update package event days");
      } finally {
        setSaving(false);
      }
    },
    [packageId, onEventDaysChange]
  );

  // ─── Drag Reorder ─────────────────────────────────────────────────
  const [draggingDayId, setDraggingDayId] = useState<number | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<number | null>(null);

  const handleDragStart = useCallback((_e: React.DragEvent, dayId: number) => {
    setDraggingDayId(dayId);
  }, []);

  const handleDragOver = useCallback((_e: React.DragEvent) => {
    _e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (_e: React.DragEvent, targetDayId: number) => {
      if (draggingDayId === null || draggingDayId === targetDayId) {
        setDraggingDayId(null);
        setDragOverDayId(null);
        return;
      }

      const sorted = [...eventDays].sort((a, b) => a.order_index - b.order_index);
      const fromIdx = sorted.findIndex((d) => d.id === draggingDayId);
      const toIdx = sorted.findIndex((d) => d.id === targetDayId);

      if (fromIdx < 0 || toIdx < 0) {
        setDraggingDayId(null);
        setDragOverDayId(null);
        return;
      }

      // Reorder the array
      const [moved] = sorted.splice(fromIdx, 1);
      sorted.splice(toIdx, 0, moved);

      // Reassign order_index values
      const reordered = sorted.map((day, i) => ({ ...day, order_index: i }));
      onEventDaysChange(reordered);

      // Persist each updated order_index to the API
      try {
        await Promise.all(
          reordered.map((day) =>
            scheduleApi.eventDays.update(brandId, day.id, { order_index: day.order_index })
          )
        );
      } catch (err) {
        console.error("Failed to persist event day reorder:", err);
      }

      setDraggingDayId(null);
      setDragOverDayId(null);
    },
    [draggingDayId, eventDays, onEventDaysChange, brandId]
  );

  const handleDragEnter = useCallback((dayId: number) => {
    setDragOverDayId(dayId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingDayId(null);
    setDragOverDayId(null);
  }, []);

  // Compact mode for side panels
  if (compact) {
    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarIcon sx={{ fontSize: 12, color: "#f59e0b" }} />
            <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Event Days
            </Typography>
          </Box>
          {!readOnly && (
            <Tooltip title={isPackageMode ? "Select event days" : "Add event day"}>
              <IconButton size="small" onClick={handleOpenCreate} sx={{ p: 0.25, color: "rgba(255,255,255,0.4)" }}>
                <AddIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ fontSize: "9px", py: 0, mb: 0.5 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {eventDays.length === 0 ? (
            <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", py: 0.5, textAlign: "center" }}>
              {isPackageMode ? "No event days selected. Click + to choose." : "No event days. Click + to add."}
            </Typography>
          ) : (
            eventDays
              .sort((a, b) => a.order_index - b.order_index)
              .map((day) => (
                <EventDayCard
                  key={day.id}
                  eventDay={day}
                  scenes={crossFilmScenes?.get(day.id) ?? []}
                  compact
                  readOnly={readOnly}
                  onEdit={() => handleOpenEdit(day)}
                  onDelete={() => handleDelete(day)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  isDragTarget={dragOverDayId === day.id}
                />
              ))
          )}
        </Box>

        <EventDayDialog
          open={dialogOpen}
          onClose={handleClose}
          onSave={handleSave}
          initial={editingDay}
          saving={saving}
        />

        {isPackageMode && packageId && (
          <PackageEventDayPickerDialog
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            brandId={brandId}
            packageId={packageId}
            currentEventDayIds={new Set(eventDays.map((d) => d.id))}
            onSave={handlePickerSave}
            saving={saving}
          />
        )}
      </Box>
    );
  }

  // Full mode for standalone views
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarIcon sx={{ fontSize: 20, color: "#f59e0b" }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
            Event Days
          </Typography>
          <Chip
            label={`${eventDays.length} day${eventDays.length !== 1 ? "s" : ""}`}
            size="small"
            sx={{ fontSize: "10px", height: 20, bgcolor: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
          />
        </Box>
        {!readOnly && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              borderColor: "rgba(245,158,11,0.3)",
              color: "#f59e0b",
              "&:hover": { borderColor: "#f59e0b", bgcolor: "rgba(245,158,11,0.08)" },
            }}
          >
            {isPackageMode ? "Select Event Days" : "Add Event Day"}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: "0.8rem" }}>
          {error}
        </Alert>
      )}

      {/* Event Day Cards */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {eventDays.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              border: "2px dashed rgba(245,158,11,0.2)",
              bgcolor: "rgba(245,158,11,0.02)",
            }}
          >
            <CalendarIcon sx={{ fontSize: 32, color: "rgba(245,158,11,0.3)", mb: 1 }} />
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
              {isPackageMode ? "No event days selected for this package" : "No event days defined yet"}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", mt: 0.5 }}>
              {isPackageMode
                ? "Click \"Select Event Days\" to choose which event days apply to this package."
                : "Event days are shared across films \u2014 multiple films can have scenes on the same day."}
            </Typography>
          </Box>
        ) : (
          eventDays
            .sort((a, b) => a.order_index - b.order_index)
            .map((day) => (
              <EventDayCard
                key={day.id}
                eventDay={day}
                scenes={crossFilmScenes?.get(day.id) ?? []}
                readOnly={readOnly}
                onEdit={() => handleOpenEdit(day)}
                onDelete={() => handleDelete(day)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                isDragTarget={dragOverDayId === day.id}
              />
            ))
        )}
      </Box>

      <EventDayDialog
        open={dialogOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editingDay}
        saving={saving}
      />

      {isPackageMode && packageId && (
        <PackageEventDayPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          brandId={brandId}
          packageId={packageId}
          currentEventDayIds={new Set(eventDays.map((d) => d.id))}
          onSave={handlePickerSave}
          saving={saving}
        />
      )}
    </Box>
  );
};

export default EventDayManager;
