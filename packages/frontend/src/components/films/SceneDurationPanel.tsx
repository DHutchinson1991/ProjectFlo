"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FilmLocalScene, DurationMode, SceneDurationInfo } from "@/types/film-scenes.types";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
} from "@mui/material";
import { AccessTime as AccessTimeIcon } from "@mui/icons-material";

interface SceneDurationPanelProps {
  filmId: number;
  scene: FilmLocalScene;
  onDurationUpdate?: (scene: FilmLocalScene) => void;
}

export function SceneDurationPanel({ filmId, scene, onDurationUpdate }: SceneDurationPanelProps) {
  const [durationInfo, setDurationInfo] = useState<SceneDurationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newFixedDuration, setNewFixedDuration] = useState(scene.fixed_duration || 60);

  useEffect(() => {
    loadDurationInfo();
  }, [filmId, scene.id]);

  const loadDurationInfo = async () => {
    try {
      const info = await api.films.localScenes.getDuration(filmId, scene.id);
      setDurationInfo(info);
    } catch (error) {
      console.error("Failed to load duration info:", error);
    }
  };

  const handleToggleDurationMode = async () => {
    try {
      setLoading(true);
      const newMode: DurationMode = scene.duration_mode === "MOMENTS" ? "FIXED" : "MOMENTS";
      
      const updatedScene = await api.films.localScenes.updateDurationMode(filmId, scene.id, {
        duration_mode: newMode,
        fixed_duration: newMode === "FIXED" ? newFixedDuration : undefined,
      });

      if (onDurationUpdate) {
        onDurationUpdate(updatedScene);
      }
      
      await loadDurationInfo();
    } catch (error) {
      console.error("Failed to toggle duration mode:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFixedDuration = async () => {
    try {
      setLoading(true);
      const updatedScene = await api.films.localScenes.updateDurationMode(filmId, scene.id, {
        duration_mode: "FIXED",
        fixed_duration: newFixedDuration,
      });

      if (onDurationUpdate) {
        onDurationUpdate(updatedScene);
      }
      
      await loadDurationInfo();
      setEditing(false);
    } catch (error) {
      console.error("Failed to update fixed duration:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!durationInfo) {
    return (
      <Card>
        <CardContent sx={{ p: 2, textAlign: "center" }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading duration...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const isMomentsMode = durationInfo.duration_mode === "MOMENTS";

  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight={600}>
              Scene Duration
            </Typography>
          </Box>
          <Chip
            size="small"
            color={isMomentsMode ? "primary" : "default"}
            label={durationInfo.duration_mode}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isMomentsMode ? "Duration calculated from moments" : "Using fixed duration"}
        </Typography>

        <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" fontWeight={600}>Calculated Duration:</Typography>
            <Typography variant="body1" fontWeight={700}>
              {durationInfo.calculated_duration}s
            </Typography>
          </Box>

          {isMomentsMode && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Moments Count:</Typography>
              <Typography variant="caption" color="text.secondary">{durationInfo.moments_count}</Typography>
            </Box>
          )}

          {!isMomentsMode && durationInfo.fixed_duration && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Fixed Duration:</Typography>
              <Typography variant="caption" color="text.secondary">{durationInfo.fixed_duration}s</Typography>
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={!isMomentsMode}
              onChange={handleToggleDurationMode}
              disabled={loading}
            />
          }
          label="Use Fixed Duration"
        />

        {!isMomentsMode && (
          <Box sx={{ mt: 2 }}>
            {editing ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Fixed Duration (seconds)
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={newFixedDuration}
                    onChange={(e) => setNewFixedDuration(Math.max(1, parseInt(e.target.value) || 60))}
                    sx={{ width: 120 }}
                  />
                  <Button size="small" variant="contained" onClick={handleUpdateFixedDuration} disabled={loading}>
                    Save
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEditing(false);
                      setNewFixedDuration(scene.fixed_duration || 60);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button size="small" variant="outlined" fullWidth onClick={() => setEditing(true)}>
                Edit Fixed Duration
              </Button>
            )}
          </Box>
        )}

        {isMomentsMode && durationInfo.moments_count === 0 && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 2, display: "block" }}>
            No moments added yet. Add moments from the timeline to calculate duration.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
