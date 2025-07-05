"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Loading } from "../../../components";

import { scenesService } from "@/lib/api";
import type { ScenesLibrary } from "@/lib/types";
import { SceneAnalytics } from "./types";

export default function ScenesLibraryPage() {
  // State management
  const [scenes, setScenes] = useState<ScenesLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<
    "ALL" | "VIDEO" | "AUDIO" | "MUSIC"
  >("ALL");
  const [selectedScene, setSelectedScene] = useState<ScenesLibrary | null>(
    null,
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [sceneAnalytics, setSceneAnalytics] = useState<SceneAnalytics | null>(
    null,
  );
  const [editingScene, setEditingScene] = useState<Partial<ScenesLibrary>>({
    name: "",
    description: "",
    media_type: "VIDEO",
    complexity_score: 1,
    estimated_duration: 1,
    base_task_hours: "1",
    is_coverage_linked: true,
  });

  // Fetch scenes from backend API
  const fetchScenes = async () => {
    try {
      setLoading(true);
      const data = await scenesService.getAll();
      setScenes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scenes");
      console.error("Error fetching scenes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch scene analytics
  const fetchSceneAnalytics = async (sceneId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3002/analytics/scenes/${sceneId}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      const data = await response.json();
      setSceneAnalytics(data.metrics);
    } catch (err) {
      console.error("Error fetching scene analytics:", err);
      setSceneAnalytics(null);
    }
  };

  // Load scenes on mount
  useEffect(() => {
    fetchScenes();
  }, []);

  // Filter scenes based on search and filters
  const filteredScenes = scenes.filter((scene) => {
    const matchesSearch =
      scene.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scene.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMediaType =
      mediaTypeFilter === "ALL" || scene.media_type === mediaTypeFilter;
    return matchesSearch && matchesMediaType;
  });

  // Handle menu actions
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    scene: ScenesLibrary,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedScene(scene);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedScene(null);
  };

  const handleEditScene = () => {
    if (selectedScene) {
      setEditingScene(selectedScene);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleViewAnalytics = async () => {
    if (selectedScene) {
      await fetchSceneAnalytics(selectedScene.id);
      setAnalyticsDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleAddScene = () => {
    setEditingScene({
      name: "",
      description: "",
      media_type: "VIDEO",
      complexity_score: 1,
      estimated_duration: 1,
      base_task_hours: "1",
      is_coverage_linked: true,
    });
    setAddDialogOpen(true);
  };

  const handleSaveScene = async () => {
    try {
      const method = editingScene.id ? "PUT" : "POST";
      const url = editingScene.id
        ? `http://localhost:3002/scenes/${editingScene.id}`
        : "http://localhost:3002/scenes";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingScene.name,
          description: editingScene.description,
          media_type: editingScene.media_type,
          complexity_score: editingScene.complexity_score,
          estimated_duration: editingScene.estimated_duration,
          base_task_hours: editingScene.base_task_hours,
          is_coverage_linked: editingScene.is_coverage_linked,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save scene: ${response.status}`);
      }

      // Refresh the scene list
      await fetchScenes();
      setEditDialogOpen(false);
      setAddDialogOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scene");
    }
  };

  const handleDeleteScene = async (sceneId: number) => {
    if (!confirm("Are you sure you want to delete this scene?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/scenes/${sceneId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete scene: ${response.status}`);
      }

      await fetchScenes();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete scene");
    }
  };

  // Get media type color
  const getMediaTypeColor = (
    mediaType: string,
  ): "primary" | "secondary" | "success" => {
    switch (mediaType) {
      case "VIDEO":
        return "primary";
      case "AUDIO":
        return "secondary";
      case "MUSIC":
        return "success";
      default:
        return "primary";
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <Loading message="Loading scenes..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Scenes Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your video production scenes, track usage analytics, and
          optimize workflows.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search scenes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Media Type</InputLabel>
                <Select
                  value={mediaTypeFilter}
                  label="Media Type"
                  onChange={(e) =>
                    setMediaTypeFilter(
                      e.target.value as "ALL" | "VIDEO" | "AUDIO" | "MUSIC",
                    )
                  }
                >
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="VIDEO">Video</MenuItem>
                  <MenuItem value="AUDIO">Audio</MenuItem>
                  <MenuItem value="MUSIC">Music</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchScenes}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddScene}
                >
                  Add Scene
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Scenes Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scene</TableCell>
                <TableCell>Media Type</TableCell>
                <TableCell align="center">Coverage Linked</TableCell>
                <TableCell align="right">Complexity</TableCell>
                <TableCell align="right">Duration</TableCell>
                <TableCell align="right">Task Hours</TableCell>
                <TableCell align="right">Usage</TableCell>
                <TableCell align="right">Performance</TableCell>
                <TableCell align="right">Last Used</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredScenes.map((scene) => (
                <TableRow key={scene.id} hover>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        component="a"
                        href={`/scenes/${scene.id}`}
                        sx={{
                          textDecoration: "none",
                          color: "primary.main",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {scene.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {scene.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={scene.media_type}
                      color={getMediaTypeColor(scene.media_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={scene.is_coverage_linked ? "Yes" : "No"}
                      color={scene.is_coverage_linked ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={scene.complexity_score}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatDuration(scene.estimated_duration)}
                  </TableCell>
                  <TableCell align="right">{scene.base_task_hours}h</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{scene.usage_count}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={scene.performance_score}
                      color={
                        Number(scene.performance_score) >= 4
                          ? "success"
                          : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {scene.last_used_at
                        ? formatDate(scene.last_used_at)
                        : "Never"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, scene)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredScenes.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchTerm || mediaTypeFilter !== "ALL"
                ? "No scenes match your filters"
                : "No scenes found"}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditScene}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Scene
        </MenuItem>
        <MenuItem onClick={handleViewAnalytics}>
          <AnalyticsIcon sx={{ mr: 1 }} />
          View Analytics
        </MenuItem>
        <MenuItem>
          <TimelineIcon sx={{ mr: 1 }} />
          Add to Timeline
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedScene) {
              handleDeleteScene(selectedScene.id);
            }
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Scene
        </MenuItem>
      </Menu>

      {/* Analytics Dialog */}
      <Dialog
        open={analyticsDialogOpen}
        onClose={() => setAnalyticsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Scene Analytics: {selectedScene?.name}</DialogTitle>
        <DialogContent>
          {sceneAnalytics ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">
                      {sceneAnalytics.total_usage}
                    </Typography>
                    <Typography color="text.secondary">Total Usage</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">
                      {sceneAnalytics.recent_usage}
                    </Typography>
                    <Typography color="text.secondary">Recent Usage</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">
                      {sceneAnalytics.average_task_hours}h
                    </Typography>
                    <Typography color="text.secondary">
                      Avg Task Hours
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">
                      {sceneAnalytics.efficiency_score}
                    </Typography>
                    <Typography color="text.secondary">
                      Efficiency Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <Loading size="small" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Scene: {selectedScene?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scene Name"
                value={editingScene.name}
                onChange={(e) =>
                  setEditingScene({ ...editingScene, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingScene.description}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    description: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Media Type</InputLabel>
                <Select
                  value={editingScene.media_type}
                  label="Media Type"
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      media_type: e.target.value as "VIDEO" | "AUDIO" | "MUSIC",
                    })
                  }
                >
                  <MenuItem value="VIDEO">Video</MenuItem>
                  <MenuItem value="AUDIO">Audio</MenuItem>
                  <MenuItem value="MUSIC">Music</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Complexity Score"
                type="number"
                inputProps={{ min: 1, max: 10 }}
                value={editingScene.complexity_score}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    complexity_score: Number(e.target.value),
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
                inputProps={{ min: 1 }}
                value={editingScene.estimated_duration}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    estimated_duration: Number(e.target.value),
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Task Hours"
                type="number"
                inputProps={{ min: 0.5, step: 0.5 }}
                value={editingScene.base_task_hours}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    base_task_hours: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Coverage Linked</InputLabel>
                <Select
                  value={editingScene.is_coverage_linked ? "true" : "false"}
                  label="Coverage Linked"
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      is_coverage_linked: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Yes - Linked to Coverage</MenuItem>
                  <MenuItem value="false">No - Standalone Scene</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveScene}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Scene Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Scene</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scene Name"
                value={editingScene.name}
                onChange={(e) =>
                  setEditingScene({ ...editingScene, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingScene.description}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    description: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Media Type</InputLabel>
                <Select
                  value={editingScene.media_type}
                  label="Media Type"
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      media_type: e.target.value as "VIDEO" | "AUDIO" | "MUSIC",
                    })
                  }
                >
                  <MenuItem value="VIDEO">Video</MenuItem>
                  <MenuItem value="AUDIO">Audio</MenuItem>
                  <MenuItem value="MUSIC">Music</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Complexity Score"
                type="number"
                inputProps={{ min: 1, max: 10 }}
                value={editingScene.complexity_score}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    complexity_score: Number(e.target.value),
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
                inputProps={{ min: 1 }}
                value={editingScene.estimated_duration}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    estimated_duration: Number(e.target.value),
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Task Hours"
                type="number"
                inputProps={{ min: 0.5, step: 0.5 }}
                value={editingScene.base_task_hours}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    base_task_hours: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Coverage Linked</InputLabel>
                <Select
                  value={editingScene.is_coverage_linked ? "true" : "false"}
                  label="Coverage Linked"
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      is_coverage_linked: e.target.value === "true",
                    })
                  }
                >
                  <MenuItem value="true">Yes - Linked to Coverage</MenuItem>
                  <MenuItem value="false">No - Standalone Scene</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Workflow Note:</strong> Task recipes and workflow
                  management for this scene will be available on the individual
                  scene detail page (coming in Phase 2).
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveScene}>
            Add Scene
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
