"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { ScenesLibrary } from "@/lib/types/domains/scenes";
import { DurationMode, SceneType, CreateSceneFromTemplateDto, CreateBlankSceneDto } from "@/types/film-scenes.types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon, Videocam, MusicNote, Image as ImageIcon, Mic, Movie, ViewList } from "@mui/icons-material";

interface SceneSelectionDialogProps {
  filmId: number;
  onSceneCreated?: () => void;
  triggerButton?: ReactNode;
}

export function SceneSelectionDialog({ 
  filmId, 
  onSceneCreated,
  triggerButton 
}: SceneSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sceneTemplates, setSceneTemplates] = useState<ScenesLibrary[]>([]);
  const [selectedTab, setSelectedTab] = useState<"template" | "blank">("template");
  
  // Template form state
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [copyMoments, setCopyMoments] = useState(true);
  
  // Blank scene form state
  const [blankSceneName, setBlankSceneName] = useState("");
  const [blankSceneType, setBlankSceneType] = useState<SceneType>("VIDEO");
  const [blankSceneDescription, setBlankSceneDescription] = useState("");
  const [durationMode, setDurationMode] = useState<DurationMode>("MOMENTS");
  const [fixedDuration, setFixedDuration] = useState(60);

  useEffect(() => {
    if (open) {
      loadSceneTemplates();
    }
  }, [open]);

  const loadSceneTemplates = async () => {
    try {
      const templates = await api.scenes.getAll();
      setSceneTemplates(templates);
    } catch (error) {
      console.error("Failed to load scene templates:", error);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      const data: CreateSceneFromTemplateDto = {
        template_scene_id: selectedTemplate,
        custom_name: customName || undefined,
        copy_moments: copyMoments,
      };

      await api.films.localScenes.createFromTemplate(filmId, data);
      
      // Reset form
      setSelectedTemplate(null);
      setCustomName("");
      setCopyMoments(true);
      setOpen(false);
      
      if (onSceneCreated) {
        onSceneCreated();
      }
    } catch (error) {
      console.error("Failed to create scene from template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlankScene = async () => {
    if (!blankSceneName) return;

    try {
      setLoading(true);
      const data: CreateBlankSceneDto = {
        name: blankSceneName,
        type: blankSceneType,
        description: blankSceneDescription || undefined,
        duration_mode: durationMode,
        fixed_duration: durationMode === "FIXED" ? fixedDuration : undefined,
      };

      await api.films.localScenes.createBlank(filmId, data);
      
      // Reset form
      setBlankSceneName("");
      setBlankSceneType("VIDEO");
      setBlankSceneDescription("");
      setDurationMode("MOMENTS");
      setFixedDuration(60);
      setOpen(false);
      
      if (onSceneCreated) {
        onSceneCreated();
      }
    } catch (error) {
      console.error("Failed to create blank scene:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSceneTypeIcon = (type: string) => {
    switch (type) {
      case "MOMENTS":
        return <ViewList fontSize="small" />;
      case "MONTAGE":
        return <Movie fontSize="small" />;
      case "VIDEO":
        return <Videocam fontSize="small" />;
      case "AUDIO":
        return <Mic fontSize="small" />;
      case "GRAPHICS":
        return <ImageIcon fontSize="small" />;
      case "MUSIC":
        return <MusicNote fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <>
      {triggerButton ? (
        <Box onClick={() => setOpen(true)}>{triggerButton}</Box>
      ) : (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Scene
        </Button>
      )}
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Scene to Film</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a template scene or create a blank scene from scratch
          </Typography>

          <Tabs value={selectedTab === "template" ? 0 : 1} onChange={(_, v) => setSelectedTab(v === 0 ? "template" : "blank")}>
            <Tab label="From Template" />
            <Tab label="Blank Scene" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {selectedTab === "template" && (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {sceneTemplates.map((template) => (
                  <Card
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    sx={{
                      mb: 1,
                      cursor: 'pointer',
                      border: 2,
                      borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
                      bgcolor: selectedTemplate === template.id ? 'action.selected' : 'background.paper',
                      '&:hover': { borderColor: 'primary.light' }
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getSceneTypeIcon(template.type ?? '')}
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {template.name}
                            </Typography>
                            {template.description && (
                              <Typography variant="body2" color="text.secondary">
                                {template.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Chip label={template.type} size="small" />
                      </Box>
                      {template.estimated_duration && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Est. Duration: {template.estimated_duration}s
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <TextField
                    fullWidth
                    label="Custom Name (Optional)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={copyMoments}
                        onChange={(e) => setCopyMoments(e.target.checked)}
                      />
                    }
                    label="Copy moment templates from scene"
                  />
                </Box>
              </Box>
            )}

            {selectedTab === "blank" && (
              <Box>
                <TextField
                  fullWidth
                  required
                  label="Scene Name"
                  value={blankSceneName}
                  onChange={(e) => setBlankSceneName(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Scene Type</InputLabel>
                  <Select
                    value={blankSceneType}
                    label="Scene Type"
                    onChange={(e) => setBlankSceneType(e.target.value as SceneType)}
                  >
                    <MenuItem value="VIDEO">Video</MenuItem>
                    <MenuItem value="AUDIO">Audio</MenuItem>
                    <MenuItem value="GRAPHICS">Graphics</MenuItem>
                    <MenuItem value="MUSIC">Music</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description (Optional)"
                  value={blankSceneDescription}
                  onChange={(e) => setBlankSceneDescription(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Typography variant="subtitle2" gutterBottom>
                  Duration Mode
                </Typography>
                <RadioGroup
                  value={durationMode}
                  onChange={(e) => setDurationMode(e.target.value as DurationMode)}
                >
                  <FormControlLabel
                    value="MOMENTS"
                    control={<Radio />}
                    label="Calculate from moments (add moments later from timeline)"
                  />
                  <FormControlLabel
                    value="FIXED"
                    control={<Radio />}
                    label="Use fixed duration"
                  />
                </RadioGroup>

                {durationMode === "FIXED" && (
                  <TextField
                    type="number"
                    label="Duration (seconds)"
                    value={fixedDuration}
                    onChange={(e) => setFixedDuration(Math.max(1, parseInt(e.target.value) || 60))}
                    inputProps={{ min: 1 }}
                    sx={{ mt: 2, ml: 4, width: 150 }}
                    size="small"
                  />
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          {selectedTab === "template" ? (
            <Button
              variant="contained"
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplate || loading}
            >
              {loading ? <CircularProgress size={20} /> : "Create from Template"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreateBlankScene}
              disabled={!blankSceneName || loading}
            >
              {loading ? <CircularProgress size={20} /> : "Create Blank Scene"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
