"use client";

import type { ReactNode } from "react";
import { DurationMode, SceneType } from "@/features/content/films/types/film-scenes.types";
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
import { useSceneCreation } from "@/features/content/scenes/hooks/useSceneCreation";

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
  const sc = useSceneCreation(filmId, onSceneCreated);

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
        <Box onClick={() => sc.setOpen(true)}>{triggerButton}</Box>
      ) : (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => sc.setOpen(true)}
        >
          Add Scene
        </Button>
      )}
      
      <Dialog open={sc.open} onClose={() => sc.setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Scene to Film</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a template scene or create a blank scene from scratch
          </Typography>

          <Tabs value={sc.selectedTab === "template" ? 0 : 1} onChange={(_, v) => sc.setSelectedTab(v === 0 ? "template" : "blank")}>
            <Tab label="From Template" />
            <Tab label="Blank Scene" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {sc.selectedTab === "template" && (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {sc.sceneTemplates.map((template) => (
                  <Card
                    key={template.id}
                    onClick={() => sc.setSelectedTemplate(template.id)}
                    sx={{
                      mb: 1,
                      cursor: 'pointer',
                      border: 2,
                      borderColor: sc.selectedTemplate === template.id ? 'primary.main' : 'divider',
                      bgcolor: sc.selectedTemplate === template.id ? 'action.selected' : 'background.paper',
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
                    value={sc.customName}
                    onChange={(e) => sc.setCustomName(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sc.copyMoments}
                        onChange={(e) => sc.setCopyMoments(e.target.checked)}
                      />
                    }
                    label="Copy moment templates from scene"
                  />
                </Box>
              </Box>
            )}

            {sc.selectedTab === "blank" && (
              <Box>
                <TextField
                  fullWidth
                  required
                  label="Scene Name"
                  value={sc.blankSceneName}
                  onChange={(e) => sc.setBlankSceneName(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Scene Type</InputLabel>
                  <Select
                    value={sc.blankSceneType}
                    label="Scene Type"
                    onChange={(e) => sc.setBlankSceneType(e.target.value as SceneType)}
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
                  value={sc.blankSceneDescription}
                  onChange={(e) => sc.setBlankSceneDescription(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Typography variant="subtitle2" gutterBottom>
                  Duration Mode
                </Typography>
                <RadioGroup
                  value={sc.durationMode}
                  onChange={(e) => sc.setDurationMode(e.target.value as DurationMode)}
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

                {sc.durationMode === "FIXED" && (
                  <TextField
                    type="number"
                    label="Duration (seconds)"
                    value={sc.fixedDuration}
                    onChange={(e) => sc.setFixedDuration(Math.max(1, parseInt(e.target.value) || 60))}
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
          <Button onClick={() => sc.setOpen(false)}>Cancel</Button>
          {sc.selectedTab === "template" ? (
            <Button
              variant="contained"
              onClick={sc.handleCreateFromTemplate}
              disabled={!sc.selectedTemplate || sc.loading}
            >
              {sc.loading ? <CircularProgress size={20} /> : "Create from Template"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={sc.handleCreateBlankScene}
              disabled={!sc.blankSceneName || sc.loading}
            >
              {sc.loading ? <CircularProgress size={20} /> : "Create Blank Scene"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
