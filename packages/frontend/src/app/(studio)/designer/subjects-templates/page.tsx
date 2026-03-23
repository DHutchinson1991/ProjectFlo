"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useBrand } from "@/app/providers/BrandProvider";

interface SubjectRole {
  id: number;
  role_name: string;
  description?: string;
  is_core: boolean;
  is_group: boolean;
  order_index: number;
}

interface SubjectType {
  id: number;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  roles: SubjectRole[];
}

export default function SubjectsTemplatesPage() {
  const { currentBrand } = useBrand();
  const [templates, setTemplates] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SubjectType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "PEOPLE",
  });
  const [roles, setRoles] = useState<Partial<SubjectRole>[]>([
    { role_name: "", is_core: false, is_group: false, order_index: 0 },
  ]);

  useEffect(() => {
    if (currentBrand?.id) {
      loadTemplates();
    }
  }, [currentBrand?.id]);

  const loadTemplates = async () => {
    if (!currentBrand?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `http://localhost:3002/subjects/roles/brand/${currentBrand.id}`
      );
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: SubjectType) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || "",
        category: template.category,
      });
      setRoles(template.roles);
    } else {
      setEditingTemplate(null);
      setFormData({ name: "", description: "", category: "PEOPLE" });
      setRoles([{ role_name: "", is_core: false, is_group: false, order_index: 0 }]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
    setFormData({ name: "", description: "", category: "PEOPLE" });
    setRoles([{ role_name: "", is_core: false, is_group: false, order_index: 0 }]);
  };

  const handleAddRole = () => {
    setRoles([...roles, { role_name: "", is_core: false, is_group: false, order_index: roles.length }]);
  };

  const handleRemoveRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index: number, field: string, value: any) => {
    const newRoles = [...roles];
    newRoles[index] = { ...newRoles[index], [field]: value };
    setRoles(newRoles);
  };

  const handleSave = async () => {
    if (!currentBrand?.id || !formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    const validRoles = roles.filter((r) => r.role_name?.trim());
    if (validRoles.length === 0) {
      setError("At least one role is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingTemplate) {
        // Update template
        const res = await fetch(
          `http://localhost:3002/subjects/roles/${editingTemplate.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role_name: formData.name,
              description: formData.description,
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to update template");
      } else {
        // Create new template
        const res = await fetch(
          `http://localhost:3002/subjects/roles/brand/${currentBrand.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role_name: formData.name,
              description: formData.description,
              roles: validRoles.map((r, idx) => ({
                role_name: r.role_name,
                description: r.description,
                is_core: r.is_core,
                is_group: r.is_group,
                order_index: idx,
              })),
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to create template");
      }

      await loadTemplates();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3002/subjects/roles/${templateId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete template");
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title="Back to Manager">
          <IconButton component={Link} href="/manager" size="small">
            <BackIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Subject Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage role templates for your productions. These become defaults when adding subjects to films.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Create Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: "#9c27b0", "&:hover": { bgcolor: "#7b1fa2" } }}
        >
          Create Template
        </Button>
      </Box>

      {/* Templates Table */}
      {loading && !templates.length ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary" paragraph>
            No templates yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: "#9c27b0", "&:hover": { bgcolor: "#7b1fa2" } }}
          >
            Create Your First Template
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "rgba(156, 39, 176, 0.1)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Template Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Roles</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{template.name}</TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {template.description || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {template.roles.map((role) => (
                        <Chip
                          key={role.id}
                          label={role.role_name}
                          size="small"
                          variant={role.is_core ? "filled" : "outlined"}
                          color={role.is_core ? "primary" : "default"}
                          sx={{
                            fontSize: "0.75rem",
                            "& .MuiChip-label": {
                              px: 1,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(template)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(template.id)}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTemplate ? `Edit: ${editingTemplate.name}` : "Create New Template"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            {/* Template Name */}
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              placeholder="e.g., Wedding, Birthday, Corporate Event"
              autoFocus
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              placeholder="Describe this template..."
            />

            {/* Roles Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Default Roles
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Mark roles as "Default" to auto-select them when adding subjects to films.
              </Typography>
              <List sx={{ p: 0 }}>
                {roles.map((role, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem
                      sx={{
                        p: 1.5,
                        flexDirection: "column",
                        alignItems: "flex-start",
                        bgcolor: idx % 2 === 0 ? "rgba(0,0,0,0.02)" : "transparent",
                      }}
                    >
                      <Box sx={{ width: "100%", display: "flex", gap: 1, mb: 1 }}>
                        <TextField
                          label="Role Name"
                          value={role.role_name || ""}
                          onChange={(e) =>
                            handleRoleChange(idx, "role_name", e.target.value)
                          }
                          size="small"
                          fullWidth
                          placeholder="e.g., Bride, Groom, Best Man"
                        />
                        <Tooltip title="Remove role">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveRole(idx)}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={role.is_core || false}
                              onChange={(e) =>
                                handleRoleChange(idx, "is_core", e.target.checked)
                              }
                              size="small"
                            />
                          }
                          label="Default role (auto-selected in films)"
                          sx={{ fontSize: "0.85rem", m: 0 }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={(role as any).is_group || false}
                              onChange={(e) =>
                                handleRoleChange(idx, "is_group", e.target.checked)
                              }
                              size="small"
                            />
                          }
                          label="Group role (always shows headcount, e.g. Guests, Wedding Party)"
                          sx={{ fontSize: "0.85rem", m: 0 }}
                        />
                      </Box>
                    </ListItem>
                    {idx < roles.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRole}
                sx={{ mt: 2 }}
              >
                Add Another Role
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: "#9c27b0", "&:hover": { bgcolor: "#7b1fa2" } }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : editingTemplate ? (
              "Update Template"
            ) : (
              "Create Template"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
