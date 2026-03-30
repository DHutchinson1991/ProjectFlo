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
import { useBrand } from "@/features/platform/brand";
import { rolesApi } from "../api/roles.api";
import type { SubjectRole } from "../types";
import { useSubjectTemplateForm } from "../hooks/useSubjectTemplateForm";

interface SubjectType {
  id: number;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  roles: SubjectRole[];
}

export function SubjectTemplatesScreen() {
  const { currentBrand } = useBrand();
  const [templates, setTemplates] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    if (!currentBrand?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await rolesApi.getRoles(currentBrand.id);
      setTemplates(data as unknown as SubjectType[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const form = useSubjectTemplateForm(loadTemplates);

  useEffect(() => {
    if (currentBrand?.id) {
      loadTemplates();
    }
  }, [currentBrand?.id]);

  const handleDelete = async (templateId: number) => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    try {
      setLoading(true);
      await rolesApi.deleteRole(templateId);
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
          onClick={() => form.openCreate()}
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
            onClick={() => form.openCreate()}
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
                        onClick={() => form.openEdit(template)}
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
      <Dialog open={form.openDialog} onClose={form.close} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.editingTemplate ? `Edit: ${form.editingTemplate.name}` : "Create New Template"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {form.formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {form.formError}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Template Name"
              value={form.formData.name}
              onChange={(e) => form.setFormData({ ...form.formData, name: e.target.value })}
              fullWidth
              placeholder="e.g., Wedding, Birthday, Corporate Event"
              autoFocus
            />

            <TextField
              label="Description"
              value={form.formData.description}
              onChange={(e) =>
                form.setFormData({ ...form.formData, description: e.target.value })
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
                {form.roles.map((role, idx) => (
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
                            form.changeRole(idx, "role_name", e.target.value)
                          }
                          size="small"
                          fullWidth
                          placeholder="e.g., Bride, Groom, Best Man"
                        />
                        <Tooltip title="Remove role">
                          <IconButton
                            size="small"
                            onClick={() => form.removeRole(idx)}
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
                                form.changeRole(idx, "is_core", e.target.checked)
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
                              checked={role.is_group || false}
                              onChange={(e) =>
                                form.changeRole(idx, "is_group", e.target.checked)
                              }
                              size="small"
                            />
                          }
                          label="Group role (always shows headcount, e.g. Guests, Wedding Party)"
                          sx={{ fontSize: "0.85rem", m: 0 }}
                        />
                      </Box>
                    </ListItem>
                    {idx < form.roles.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={form.addRole}
                sx={{ mt: 2 }}
              >
                Add Another Role
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={form.close} disabled={form.saving}>
            Cancel
          </Button>
          <Button
            onClick={() => currentBrand?.id && form.save(currentBrand.id)}
            variant="contained"
            disabled={form.saving}
            sx={{ bgcolor: "#9c27b0", "&:hover": { bgcolor: "#7b1fa2" } }}
          >
            {form.saving ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : form.editingTemplate ? (
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
