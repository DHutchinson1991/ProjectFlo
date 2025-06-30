"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";

interface TaskTemplate {
  id: number;
  name: string;
  phase: string;
  pricing_type: "Hourly" | "Fixed";
  fixed_price?: number;
  effort_hours: string;
  description?: string;
}

interface BulkOperationsProps {
  entityType: "component" | "deliverable" | "coverage_scene";
  entityId: number;
  entityName: string;
}

const BulkTaskOperations: React.FC<BulkOperationsProps> = ({
  entityType,
  entityId,
  entityName,
}) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Dialog states
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [targetEntityType, setTargetEntityType] = useState<string>("component");
  const [targetEntityId, setTargetEntityId] = useState<string>("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:3002/task-templates");
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status}`);
      }

      const templatesData = await response.json();
      setTemplates(templatesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId],
    );
  };

  const handleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(templates.map((t) => t.id));
    }
  };

  const handleBulkAddToEntity = async () => {
    if (selectedTemplates.length === 0) return;

    setOperationLoading(true);
    try {
      const selectedTemplateData = templates.filter((t) =>
        selectedTemplates.includes(t.id),
      );

      const promises = selectedTemplateData.map((template) => {
        const taskData = {
          task_name: template.name,
          estimated_hours: parseFloat(template.effort_hours) || 1,
          task_template_id: template.id,
          order_index: templates.length,
        };

        return fetch(
          `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(taskData),
          },
        );
      });

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      if (successCount === selectedTemplates.length) {
        alert(`Successfully added ${successCount} tasks to ${entityName}`);
        setSelectedTemplates([]);
        // Refresh parent component
        window.location.reload();
      } else {
        alert(
          `Added ${successCount} out of ${selectedTemplates.length} tasks. Some failed.`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add tasks in bulk",
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleCopyToOtherEntity = async () => {
    if (!targetEntityId || selectedTemplates.length === 0) return;

    setOperationLoading(true);
    try {
      const selectedTemplateData = templates.filter((t) =>
        selectedTemplates.includes(t.id),
      );

      const promises = selectedTemplateData.map((template) => {
        const taskData = {
          task_name: template.name,
          estimated_hours: parseFloat(template.effort_hours) || 1,
          task_template_id: template.id,
          order_index: templates.length,
        };

        return fetch(
          `http://localhost:3002/api/entities/${targetEntityType}/${targetEntityId}/default-tasks`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(taskData),
          },
        );
      });

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      alert(`Successfully copied ${successCount} tasks to target entity`);
      setCopyDialogOpen(false);
      setSelectedTemplates([]);
      setTargetEntityId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy tasks");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleExportTemplates = () => {
    if (selectedTemplates.length === 0) return;

    const selectedTemplateData = templates.filter((t) =>
      selectedTemplates.includes(t.id),
    );
    const exportData = {
      exported_at: new Date().toISOString(),
      source_entity: { type: entityType, id: entityId, name: entityName },
      templates: selectedTemplateData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-templates-${entityName}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportDialogOpen(false);
    setSelectedTemplates([]);
  };

  const formatHours = (hours: string) => {
    const h = parseFloat(hours);
    return h === 1 ? "1 hour" : `${h} hours`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={handleBulkAddToEntity}
            disabled={selectedTemplates.length === 0 || operationLoading}
          >
            Add to {entityName}
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={() => setCopyDialogOpen(true)}
            disabled={selectedTemplates.length === 0}
          >
            Copy to Other Entity
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
            disabled={selectedTemplates.length === 0}
          >
            Export Templates
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<UploadIcon />}
            disabled
          >
            Import Templates
          </Button>
        </Grid>
      </Grid>

      {/* Selection Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Template Selection ({selectedTemplates.length} of{" "}
              {templates.length} selected)
            </Typography>
            <Button
              variant="outlined"
              onClick={handleSelectAll}
              startIcon={<CategoryIcon />}
            >
              {selectedTemplates.length === templates.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Template List with Checkboxes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Templates
          </Typography>
          <List>
            {templates.map((template, index) => (
              <React.Fragment key={template.id}>
                <ListItem
                  onClick={() => handleSelectTemplate(template.id)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => handleSelectTemplate(template.id)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Chip
                          label={template.phase}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                        <Chip
                          label={formatHours(template.effort_hours)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={template.pricing_type}
                          size="small"
                          variant="outlined"
                          color={
                            template.pricing_type === "Fixed"
                              ? "success"
                              : "info"
                          }
                        />
                      </Box>
                    }
                  />
                </ListItem>
                {index < templates.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Copy to Other Entity Dialog */}
      <Dialog
        open={copyDialogOpen}
        onClose={() => setCopyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Copy Templates to Other Entity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Entity Type</InputLabel>
                <Select
                  value={targetEntityType}
                  label="Target Entity Type"
                  onChange={(e) => setTargetEntityType(e.target.value)}
                >
                  <MenuItem value="component">Component</MenuItem>
                  <MenuItem value="deliverable">Deliverable</MenuItem>
                  <MenuItem value="coverage_scene">Coverage Scene</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Entity ID"
                value={targetEntityId}
                onChange={(e) => setTargetEntityId(e.target.value)}
                type="number"
                helperText="Enter the ID of the target entity to copy templates to"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCopyToOtherEntity}
            variant="contained"
            disabled={!targetEntityId || operationLoading}
          >
            {operationLoading ? (
              <CircularProgress size={24} />
            ) : (
              "Copy Templates"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Templates</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Export {selectedTemplates.length} selected templates as JSON file.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The exported file can be imported into other ProjectFlo instances or
            used for backup purposes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExportTemplates}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Export JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkTaskOperations;
