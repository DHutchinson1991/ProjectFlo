"use client";

import React from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  Videocam as VideoIcon,
  VolumeUp as AudioIcon,
  Palette as GraphicsIcon,
  MusicNote as MusicIcon,
  Search as SearchIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  VideoFile as CoverageIcon,
} from "@mui/icons-material";
import { ScenesLibrary, ScenesLibraryState } from "./ContentBuilderTypes";

interface ContentBuilderScenesLibraryProps {
  libraryState: ScenesLibraryState;
  filteredScenes: ScenesLibrary[];
  onSearchTermChange: (searchTerm: string) => void;
  onCategoryChange: (category: string) => void;
  onSceneDragStart: (e: React.DragEvent, scene: ScenesLibrary) => void;
  onSceneDragEnd: () => void;
  readOnly?: boolean;
}

const ContentBuilderScenesLibrary: React.FC<
  ContentBuilderScenesLibraryProps
> = ({
  libraryState,
  filteredScenes,
  onSearchTermChange,
  onCategoryChange,
  onSceneDragStart,
  onSceneDragEnd,
  readOnly = false,
}) => {
  const getSceneIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <VideoIcon />;
      case "AUDIO":
        return <AudioIcon />;
      case "GRAPHICS":
        return <GraphicsIcon />;
      case "MUSIC":
        return <MusicIcon />;
      default:
        return <VideoIcon />;
    }
  };

  const getSceneColor = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "#2196f3";
      case "AUDIO":
        return "#4caf50";
      case "GRAPHICS":
        return "#ff9800";
      case "MUSIC":
        return "#9c27b0";
      default:
        return "#757575";
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const categories = [
    { value: "ALL", label: "All Scenes" },
    { value: "GRAPHICS", label: "Graphics" },
    { value: "VIDEO", label: "Video" },
    { value: "AUDIO", label: "Audio" },
    { value: "MUSIC", label: "Music" },
  ];

  return (
    <Box
      sx={{
        p: 1.5,
        height: "100%",
        display: "flex",
        flexDirection: "row",
        bgcolor: "background.default",
        gap: 1.5,
      }}
    >
      {/* LEFT COLUMN: Category Navigation */}
      <Box
        sx={{
          width: 160,
          minWidth: 160,
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
          pr: 1.5,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}
        >
          Categories
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {categories.map((category) => {
            const isSelected = libraryState.selectedCategory === category.value;
            const categoryScenes =
              category.value === "ALL"
                ? filteredScenes
                : filteredScenes.filter((s) => s.type === category.value);

            return (
              <Box
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                  bgcolor: isSelected ? "primary.main" : "transparent",
                  color: isSelected ? "primary.contrastText" : "text.primary",
                  "&:hover": {
                    bgcolor: isSelected ? "primary.dark" : "action.hover",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {category.value !== "ALL" && (
                    <Box
                      sx={{
                        p: 0.25,
                        borderRadius: 0.25,
                        bgcolor: isSelected
                          ? "rgba(255,255,255,0.2)"
                          : getSceneColor(category.value),
                        color: "white",
                        mr: 0.75,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 16,
                        height: 16,
                      }}
                    >
                      {React.cloneElement(getSceneIcon(category.value), {
                        sx: { fontSize: "0.75rem" },
                      })}
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: isSelected ? 600 : 500 }}
                  >
                    {category.label}
                  </Typography>
                </Box>
                <Chip
                  label={categoryScenes.length}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: "0.6rem",
                    bgcolor: isSelected
                      ? "rgba(255,255,255,0.2)"
                      : "action.hover",
                    color: isSelected ? "inherit" : "text.secondary",
                    "& .MuiChip-label": { px: 0.5 },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* CENTER COLUMN: Scenes Grid */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Center Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
            pb: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            Scenes Library
          </Typography>
          {!readOnly && (
            <Typography variant="caption" color="text.secondary">
              Drag to timeline
            </Typography>
          )}
        </Box>

        {/* Loading State */}
        {libraryState.loadingScenes && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Scenes Grid - No Vertical Scroll */}
        {!libraryState.loadingScenes && filteredScenes.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 1,
              alignContent: "start",
              overflow: "hidden",
              height: "100%",
            }}
          >
            {filteredScenes.map((scene) => (
              <Box
                key={scene.id}
                sx={{
                  p: 1,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  cursor: readOnly ? "default" : "grab",
                  transition: "all 0.15s ease-in-out",
                  bgcolor: "background.paper",
                  height: "fit-content",
                  "&:hover": readOnly
                    ? {}
                    : {
                        borderColor: getSceneColor(scene.type),
                        bgcolor: "action.hover",
                        transform: "translateY(-1px)",
                      },
                  "&:active": readOnly
                    ? {}
                    : {
                        cursor: "grabbing",
                        transform: "scale(0.98)",
                      },
                  opacity: readOnly ? 0.7 : 1,
                }}
                draggable={!readOnly}
                onDragStart={(e) => !readOnly && onSceneDragStart(e, scene)}
                onDragEnd={!readOnly ? onSceneDragEnd : undefined}
              >
                {/* Scene Header */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <Box
                    sx={{
                      p: 0.25,
                      borderRadius: 0.25,
                      bgcolor: getSceneColor(scene.type),
                      color: "white",
                      mr: 0.75,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 16,
                      height: 16,
                    }}
                  >
                    {React.cloneElement(getSceneIcon(scene.type), {
                      sx: { fontSize: "0.75rem" },
                    })}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      fontSize: "0.8rem",
                    }}
                  >
                    {scene.name}
                  </Typography>
                  {/* Coverage Indicator */}
                  {scene.is_coverage_linked && (
                    <Box
                      sx={{
                        ml: 0.5,
                        p: 0.25,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 14,
                        height: 14,
                      }}
                      title="Coverage Linked"
                    >
                      <CoverageIcon sx={{ fontSize: "0.6rem" }} />
                    </Box>
                  )}
                </Box>

                {/* Scene Details */}
                {scene.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {scene.description}
                  </Typography>
                )}

                {/* Compact Chips */}
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                  <Chip
                    icon={<AccessTimeIcon sx={{ fontSize: "0.625rem" }} />}
                    label={formatDuration(scene.estimated_duration)}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: "0.625rem",
                      height: 16,
                      "& .MuiChip-label": { px: 0.5 },
                      "& .MuiChip-icon": { ml: 0.25, mr: -0.25 },
                    }}
                  />
                  <Chip
                    icon={<TrendingUpIcon sx={{ fontSize: "0.625rem" }} />}
                    label={scene.complexity_score}
                    size="small"
                    variant="outlined"
                    color={
                      scene.complexity_score >= 7
                        ? "error"
                        : scene.complexity_score >= 4
                          ? "warning"
                          : "success"
                    }
                    sx={{
                      fontSize: "0.625rem",
                      height: 16,
                      "& .MuiChip-label": { px: 0.5 },
                      "& .MuiChip-icon": { ml: 0.25, mr: -0.25 },
                    }}
                  />
                </Stack>
              </Box>
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!libraryState.loadingScenes && filteredScenes.length === 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {libraryState.searchTerm ||
              libraryState.selectedCategory !== "ALL"
                ? "No scenes found matching your filters."
                : "No scenes available."}
            </Typography>
          </Box>
        )}
      </Box>

      {/* RIGHT COLUMN: Search & Filters */}
      <Box
        sx={{
          width: 200,
          minWidth: 200,
          display: "flex",
          flexDirection: "column",
          borderLeft: 1,
          borderColor: "divider",
          pl: 1.5,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}
        >
          Search & Filter
        </Typography>

        <Stack spacing={1.5}>
          <TextField
            size="small"
            placeholder="Search scenes..."
            value={libraryState.searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: "1rem" }} />
                </InputAdornment>
              ),
            }}
          />

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Quick Stats
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption">Total Scenes:</Typography>
                <Chip
                  label={filteredScenes.length}
                  size="small"
                  sx={{ height: 16, fontSize: "0.6rem" }}
                />
              </Box>
              {libraryState.selectedCategory !== "ALL" && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption">Current Category:</Typography>
                  <Chip
                    label={
                      categories.find(
                        (c) => c.value === libraryState.selectedCategory,
                      )?.label || "Unknown"
                    }
                    size="small"
                    sx={{ height: 16, fontSize: "0.6rem" }}
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default ContentBuilderScenesLibrary;
