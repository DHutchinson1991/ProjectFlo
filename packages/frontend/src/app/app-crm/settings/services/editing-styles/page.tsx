"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Palette as PaletteIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";

interface EditingStyle {
  id: number;
  name: string;
  description?: string;
  style_settings?: Record<string, string | number | boolean>;
  created_at: string;
  updated_at: string;
}

export default function EditingStylesPage() {
  const [styles, setStyles] = useState<EditingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<EditingStyle | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    try {
      // TODO: Replace with actual API call
      setStyles([
        {
          id: 1,
          name: "Cinematic",
          description:
            "Cinematic style with smooth transitions and warm colors",
          style_settings: { transition: "smooth", color_grade: "warm" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Documentary",
          description: "Natural documentary style with minimal effects",
          style_settings: { transition: "cut", color_grade: "natural" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: "Music Video",
          description: "High energy style with quick cuts and dynamic effects",
          style_settings: { transition: "quick", color_grade: "vibrant" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error loading editing styles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    style: EditingStyle,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedStyle(style);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStyle(null);
  };

  const handleAdd = () => {
    setDialogMode("add");
    setFormData({ name: "", description: "" });
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedStyle) {
      setDialogMode("edit");
      setFormData({
        name: selectedStyle.name,
        description: selectedStyle.description || "",
      });
      setOpenDialog(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedStyle) {
      // TODO: Implement delete functionality
      console.log("Delete style:", selectedStyle.id);
    }
    handleMenuClose();
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Save style:", formData);
    setOpenDialog(false);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({ name: "", description: "" });
  };

  const getStyleColor = (styleName: string) => {
    const colors = {
      Cinematic: "primary",
      Documentary: "secondary",
      "Music Video": "error",
    } as const;
    return colors[styleName as keyof typeof colors] || "default";
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton
          component={Link}
          href="/app-crm/settings/services"
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            Editing Styles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage editing styles and visual treatments
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Style
        </Button>
      </Box>

      {/* Styles Grid */}
      <Grid container spacing={3}>
        {styles.map((style) => (
          <Grid item xs={12} sm={6} md={4} key={style.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexGrow: 1,
                    }}
                  >
                    <PaletteIcon fontSize="small" color="primary" />
                    <Link
                      href={`/app-crm/settings/services/editing-styles/${style.id}`}
                      passHref
                      legacyBehavior
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          cursor: "pointer",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        {style.name}
                      </Typography>
                    </Link>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, style)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Chip
                  label={style.name}
                  color={getStyleColor(style.name)}
                  size="small"
                  sx={{ mb: 2 }}
                />

                {style.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {style.description}
                  </Typography>
                )}

                {style.style_settings && (
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}
                  >
                    {Object.entries(style.style_settings).map(
                      ([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          variant="outlined"
                          size="small"
                        />
                      ),
                    )}
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary">
                  Created {new Date(style.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {styles.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No editing styles yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Create your first editing style to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Editing Style
          </Button>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add" ? "Add Editing Style" : "Edit Editing Style"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Style Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {dialogMode === "add" ? "Add" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
