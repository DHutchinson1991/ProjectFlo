"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Timeline as TimelineIcon,
  Save as SaveIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  Movie as VideoIcon,
  GraphicEq as AudioIcon,
  Image as GraphicsIcon,
} from "@mui/icons-material";
import FilmBuilder from "../settings/services/content/[id]/components/FilmBuilder";

interface TimelineTemplate {
  id: number;
  name: string;
  description?: string;
  duration: number; // total duration in seconds
  tracks_count: number;
  components_count: number;
  category: string;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  is_default?: boolean;
  usage_count?: number;
  components: TimelineComponent[];
}

interface TimelineComponent {
  id: number;
  name: string;
  start_time: number;
  duration: number;
  track_id: number;
  component_type: "video" | "audio" | "graphics" | "music";
  color: string;
  description?: string;
}

interface TimelineTemplateManagerProps {
  entityType?: "component" | "deliverable" | "coverage_scene";
  entityId?: number;
  onTemplateSelected?: (template: TimelineTemplate) => void;
}

const TimelineTemplateManager: React.FC<TimelineTemplateManagerProps> = ({
  onTemplateSelected,
}) => {
  const [templates, setTemplates] = useState<TimelineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TimelineTemplate | null>(null);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTemplate, setMenuTemplate] = useState<TimelineTemplate | null>(
    null,
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Standard",
  });

  // Mock data for demonstration
  const mockTemplates: TimelineTemplate[] = [
    {
      id: 1,
      name: "Wedding Ceremony Standard",
      description: "Standard timeline template for wedding ceremonies",
      duration: 1800, // 30 minutes
      tracks_count: 3,
      components_count: 12,
      category: "Wedding",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-03-10T14:30:00Z",
      is_default: true,
      usage_count: 156,
      components: [
        {
          id: 1,
          name: "Processional",
          start_time: 0,
          duration: 300,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 2,
          name: "Vows Exchange",
          start_time: 300,
          duration: 600,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 3,
          name: "Ring Exchange",
          start_time: 900,
          duration: 300,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 4,
          name: "First Kiss",
          start_time: 1200,
          duration: 120,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 5,
          name: "Recessional",
          start_time: 1320,
          duration: 480,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 6,
          name: "Ambient Audio",
          start_time: 0,
          duration: 1800,
          track_id: 2,
          component_type: "audio",
          color: "#388e3c",
        },
      ],
    },
    {
      id: 2,
      name: "Corporate Event Basic",
      description: "Basic timeline for corporate events and presentations",
      duration: 3600, // 1 hour
      tracks_count: 3,
      components_count: 8,
      category: "Corporate",
      created_at: "2024-02-01T09:00:00Z",
      updated_at: "2024-02-15T16:45:00Z",
      usage_count: 89,
      components: [
        {
          id: 7,
          name: "Opening",
          start_time: 0,
          duration: 600,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 8,
          name: "Main Presentation",
          start_time: 600,
          duration: 2400,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 9,
          name: "Q&A Session",
          start_time: 3000,
          duration: 600,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
      ],
    },
    {
      id: 3,
      name: "Social Media Short",
      description: "Quick template for social media video content",
      duration: 60, // 1 minute
      tracks_count: 2,
      components_count: 4,
      category: "Social Media",
      created_at: "2024-03-01T11:00:00Z",
      updated_at: "2024-03-20T12:15:00Z",
      usage_count: 234,
      components: [
        {
          id: 10,
          name: "Hook",
          start_time: 0,
          duration: 5,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 11,
          name: "Main Content",
          start_time: 5,
          duration: 45,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
        {
          id: 12,
          name: "Call to Action",
          start_time: 50,
          duration: 10,
          track_id: 1,
          component_type: "video",
          color: "#1976d2",
        },
      ],
    },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTemplates(mockTemplates);
    } catch {
      setError("Failed to fetch timeline templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const newTemplate: TimelineTemplate = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        duration: 300, // 5 minutes default
        tracks_count: 3,
        components_count: 0,
        category: formData.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        components: [],
      };

      setTemplates((prev) => [newTemplate, ...prev]);
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "", category: "Standard" });
    } catch {
      setError("Failed to create template");
    }
  };

  const handleCopyTemplate = async (template: TimelineTemplate) => {
    try {
      const copiedTemplate: TimelineTemplate = {
        ...template,
        id: Date.now(),
        name: `${template.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
      };

      setTemplates((prev) => [copiedTemplate, ...prev]);
    } catch {
      setError("Failed to copy template");
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch {
      setError("Failed to delete template");
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    template: TimelineTemplate,
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTemplate(null);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Wedding":
        return "#e91e63";
      case "Corporate":
        return "#1976d2";
      case "Social Media":
        return "#ff9800";
      case "Documentary":
        return "#4caf50";
      case "Commercial":
        return "#9c27b0";
      default:
        return "#757575";
    }
  };

  const getComponentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <VideoIcon fontSize="small" />;
      case "audio":
        return <AudioIcon fontSize="small" />;
      case "graphics":
        return <GraphicsIcon fontSize="small" />;
      default:
        return <TimelineIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={300}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          Timeline Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    {template.is_default && (
                      <Chip
                        label="Default"
                        size="small"
                        color="primary"
                        sx={{ mb: 1 }}
                      />
                    )}
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, template)}
                    size="small"
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                {template.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {template.description}
                  </Typography>
                )}

                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  <Chip
                    label={template.category}
                    size="small"
                    sx={{
                      bgcolor: getCategoryColor(template.category),
                      color: "white",
                    }}
                  />
                  <Chip
                    icon={<ScheduleIcon />}
                    label={formatDuration(template.duration)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TimelineIcon />}
                    label={`${template.components_count} components`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {/* Component Preview */}
                <Box mb={2}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Components:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {template.components.slice(0, 6).map((component) => (
                      <Chip
                        key={component.id}
                        icon={getComponentTypeIcon(component.component_type)}
                        label={component.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "10px", height: 20 }}
                      />
                    ))}
                    {template.components.length > 6 && (
                      <Chip
                        label={`+${template.components.length - 6} more`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "10px", height: 20 }}
                      />
                    )}
                  </Box>
                </Box>

                {template.usage_count !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    Used {template.usage_count} times
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setPreviewDialogOpen(true);
                  }}
                >
                  Preview
                </Button>
                <Button
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={() => onTemplateSelected?.(template)}
                >
                  Use Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (menuTemplate) {
              setSelectedTemplate(menuTemplate);
              setFormData({
                name: menuTemplate.name,
                description: menuTemplate.description || "",
                category: menuTemplate.category,
              });
              setEditDialogOpen(true);
            }
            handleMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuTemplate) {
              handleCopyTemplate(menuTemplate);
            }
            handleMenuClose();
          }}
        >
          <CopyIcon sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (menuTemplate && !menuTemplate.is_default) {
              handleDeleteTemplate(menuTemplate.id);
            }
            handleMenuClose();
          }}
          disabled={menuTemplate?.is_default}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Template Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Timeline Template</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              fullWidth
            >
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Wedding">Wedding</MenuItem>
              <MenuItem value="Corporate">Corporate</MenuItem>
              <MenuItem value="Social Media">Social Media</MenuItem>
              <MenuItem value="Documentary">Documentary</MenuItem>
              <MenuItem value="Commercial">Commercial</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Timeline Template</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              fullWidth
            >
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Wedding">Wedding</MenuItem>
              <MenuItem value="Corporate">Corporate</MenuItem>
              <MenuItem value="Social Media">Social Media</MenuItem>
              <MenuItem value="Documentary">Documentary</MenuItem>
              <MenuItem value="Commercial">Commercial</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedTemplate) {
                setTemplates((prev) =>
                  prev.map((t) =>
                    t.id === selectedTemplate.id
                      ? {
                        ...t,
                        ...formData,
                        updated_at: new Date().toISOString(),
                      }
                      : t,
                  ),
                );
                setEditDialogOpen(false);
              }
            }}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Timeline Preview: {selectedTemplate?.name}</DialogTitle>
        <DialogContent sx={{ height: 600 }}>
          {selectedTemplate && (
            <FilmBuilder
              initialComponents={selectedTemplate.components}
              readOnly={true}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button
            onClick={() => {
              if (selectedTemplate) {
                onTemplateSelected?.(selectedTemplate);
                setPreviewDialogOpen(false);
              }
            }}
            variant="contained"
          >
            Use This Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimelineTemplateManager;
