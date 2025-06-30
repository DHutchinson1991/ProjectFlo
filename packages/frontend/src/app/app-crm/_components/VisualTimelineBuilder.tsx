"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Slider,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Add as AddIcon,
  Save as SaveIcon,
  FileDownload as ExportIcon,
  Videocam as VideoIcon,
  VolumeUp as AudioIcon,
  Palette as GraphicsIcon,
  MusicNote as MusicIcon,
  Layers as LayersIcon,
  Search as SearchIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

interface ComponentLibrary {
  id: number;
  name: string;
  description?: string;
  type: "GRAPHICS" | "VIDEO" | "AUDIO" | "MUSIC" | "EDIT" | "COVERAGE_LINKED";
  complexity_score: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours: string;
  created_at: string;
  updated_at: string;
}

interface DefaultTask {
  id: number;
  task_name: string;
  estimated_hours: number;
  order_index: number;
  task_template_id?: number;
  task_template?: {
    id: number;
    name: string;
    phase?: string;
    pricing_type: "Hourly" | "Fixed";
    fixed_price?: number;
    effort_hours?: number;
  };
}

interface TimelineComponent {
  id: number;
  name: string;
  start_time: number; // in seconds
  duration: number; // in seconds
  track_id: number;
  component_type: "video" | "audio" | "graphics" | "music";
  color: string;
  description?: string;
  thumbnail?: string;
  locked?: boolean;
  database_type?:
    | "GRAPHICS"
    | "VIDEO"
    | "AUDIO"
    | "MUSIC"
    | "EDIT"
    | "COVERAGE_LINKED"; // Map to database ComponentType
}

interface TimelineTrack {
  id: number;
  name: string;
  track_type: "video" | "audio" | "graphics" | "music";
  height: number;
  visible: boolean;
  muted?: boolean;
  color: string;
  order_index: number;
}

interface DatabaseLayer {
  id: number;
  name: string;
  order_index: number;
  color_hex: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VisualTimelineBuilderProps {
  deliverableId?: number;
  templateId?: number;
  initialComponents?: TimelineComponent[];
  onSave?: (components: TimelineComponent[]) => void | Promise<void>;
  onExport?: (format: string) => void | Promise<void>;
  onComponentAdded?: (
    componentId: number,
    defaultTasks: DefaultTask[],
  ) => void | Promise<void>;
  readOnly?: boolean;
}

const VisualTimelineBuilder: React.FC<VisualTimelineBuilderProps> = ({
  // deliverableId, // TODO: Will be used for loading deliverable-specific timeline data
  initialComponents = [],
  onSave,
  onExport,
  onComponentAdded,
  readOnly = false,
}) => {
  // Timeline state
  const [components, setComponents] =
    useState<TimelineComponent[]>(initialComponents);
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    // Default tracks with correct database layer IDs
    {
      id: 4, // Database layer ID for Graphics
      name: "Graphics",
      track_type: "graphics",
      height: 60,
      visible: true,
      color: "#f57c00",
      order_index: 0,
    },
    {
      id: 1, // Database layer ID for Video
      name: "Video",
      track_type: "video",
      height: 60,
      visible: true,
      color: "#1976d2",
      order_index: 1,
    },
    {
      id: 2, // Database layer ID for Audio
      name: "Audio",
      track_type: "audio",
      height: 60,
      visible: true,
      color: "#388e3c",
      order_index: 2,
    },
    {
      id: 3, // Database layer ID for Music
      name: "Music",
      track_type: "music",
      height: 60,
      visible: true,
      color: "#7b1fa2",
      order_index: 3,
    },
  ]);

  // Load timeline layers from database on component mount
  useEffect(() => {
    loadTimelineLayers();
  }, []);

  const loadTimelineLayers = async () => {
    try {
      const response = await fetch("http://localhost:3002/timeline/layers");
      if (response.ok) {
        const layers: DatabaseLayer[] = await response.json();

        // Map database layers to frontend tracks
        const mappedTracks: TimelineTrack[] = layers
          .filter((layer) =>
            ["Graphics", "Video", "Audio", "Music"].includes(layer.name),
          )
          .sort((a, b) => {
            // Ensure Graphics > Video > Audio > Music order
            const order = { Graphics: 0, Video: 1, Audio: 2, Music: 3 };
            return (
              order[a.name as keyof typeof order] -
              order[b.name as keyof typeof order]
            );
          })
          .map((layer, index: number) => ({
            id: layer.id,
            name: layer.name,
            track_type: layer.name.toLowerCase() as
              | "video"
              | "audio"
              | "graphics"
              | "music",
            height: 60,
            visible: layer.is_active,
            color:
              layer.color_hex || getDefaultTrackColor(layer.name.toLowerCase()),
            order_index: index,
          }));

        if (mappedTracks.length > 0) {
          setTracks(mappedTracks);
          console.log(
            "✅ Loaded timeline layers from database:",
            mappedTracks.map((t) => `${t.name} (ID: ${t.id})`),
          );
        }
      }
    } catch (error) {
      console.error("Failed to load timeline layers:", error);
      // Keep default tracks if loading fails
    }
  };

  const getDefaultTrackColor = (trackType: string) => {
    switch (trackType) {
      case "graphics":
        return "#f57c00";
      case "video":
        return "#1976d2";
      case "audio":
        return "#388e3c";
      case "music":
        return "#7b1fa2";
      default:
        return "#616161";
    }
  };

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(300); // 5 minutes default

  // Zoom and view state
  const [zoomLevel, setZoomLevel] = useState(10); // pixels per second
  const [snapToGrid] = useState(true);
  const [gridSize] = useState(5); // 5-second snap grid

  // Selection and editing state
  const [selectedComponent, setSelectedComponent] =
    useState<TimelineComponent | null>(null);
  const [draggedComponent, setDraggedComponent] =
    useState<TimelineComponent | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Dialog state
  const [addComponentDialogOpen, setAddComponentDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate timeline dimensions
  const timelineWidth = totalDuration * zoomLevel;
  const viewportWidth = 1200; // Fixed viewport width

  // Auto-correct component track assignments on load
  useEffect(() => {
    if (components.length > 0) {
      let correctedComponents = false;
      const corrected = components.map((component) => {
        const correctTrackId = getTrackIdForComponentType(
          component.component_type,
        );
        if (correctTrackId && component.track_id !== correctTrackId) {
          console.log(
            `🔧 Auto-correcting ${component.component_type} component "${component.name}" from track ${component.track_id} to track ${correctTrackId}`,
          );
          correctedComponents = true;
          return { ...component, track_id: correctTrackId };
        }
        return component;
      });

      if (correctedComponents) {
        setComponents(corrected);
      }
    }
  }, [initialComponents]); // Only run when initial components change

  useEffect(() => {
    // Update total duration based on components
    const maxEndTime = Math.max(
      ...components.map((c) => c.start_time + c.duration),
      totalDuration,
    );
    if (maxEndTime > totalDuration) {
      setTotalDuration(Math.ceil(maxEndTime / 60) * 60); // Round up to nearest minute
    }
  }, [components, totalDuration]);

  // Playback control
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playbackTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
  }, [isPlaying, totalDuration]);

  const handleStop = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Grid snapping function
  const snapToGridTime = (time: number) => {
    if (!snapToGrid) return time;
    return Math.round(time / gridSize) * gridSize;
  };

  // Convert time to pixels
  const timeToPixels = (time: number) => time * zoomLevel;

  // Convert pixels to time
  const pixelsToTime = (pixels: number) => pixels / zoomLevel;

  // Handle component drag
  const handleComponentMouseDown = (
    e: React.MouseEvent,
    component: TimelineComponent,
  ) => {
    if (readOnly) return;

    e.preventDefault();
    setSelectedComponent(component);
    setDraggedComponent(component);

    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - timeToPixels(component.start_time),
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedComponent || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newTime = snapToGridTime(pixelsToTime(Math.max(0, newX)));

      // Find which track the component is over
      const newY = e.clientY - rect.top;
      let targetTrackId = draggedComponent.track_id;

      tracks.forEach((track, index) => {
        const trackTop = 30 + index * (60 + 15); // 30px ruler + index × (60px height + 15px spacing)
        const trackBottom = trackTop + 60; // 60px fixed height
        if (newY >= trackTop && newY <= trackBottom) {
          // Only allow movement to tracks that match the component type
          if (track.track_type === draggedComponent.component_type) {
            targetTrackId = track.id;
          } else {
            // If trying to drag to incompatible track, keep on current track or snap to correct track
            const correctTrackId = getTrackIdForComponentType(
              draggedComponent.component_type,
            );
            targetTrackId = correctTrackId || draggedComponent.track_id;

            // Optional: Show visual feedback for invalid drop zones
            console.log(
              `⚠️ Cannot place ${draggedComponent.component_type} component on ${track.track_type} track`,
            );
          }
        }
      });

      setComponents((prev) =>
        prev.map((c) =>
          c.id === draggedComponent.id
            ? { ...c, start_time: newTime, track_id: targetTrackId }
            : c,
        ),
      );
    },
    [
      draggedComponent,
      dragOffset,
      tracks,
      snapToGridTime,
      pixelsToTime,
      timeToPixels,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setDraggedComponent(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (draggedComponent) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggedComponent, handleMouseMove, handleMouseUp]);

  // Add new component with auto-add tasks functionality
  const handleAddComponent = async (componentData: {
    name: string;
    duration: number;
    track_id: number;
    component_type: "video" | "audio" | "graphics" | "music";
    component_id?: number;
    database_type?:
      | "GRAPHICS"
      | "VIDEO"
      | "AUDIO"
      | "MUSIC"
      | "EDIT"
      | "COVERAGE_LINKED";
  }) => {
    // ALWAYS ensure component is placed on the correct track for its type
    const correctTrackId = getTrackIdForComponentType(
      componentData.component_type,
    );
    if (!correctTrackId) {
      console.error(
        `No track found for component type: ${componentData.component_type}`,
      );
      return;
    }

    // Map component type to database type
    let databaseType:
      | "GRAPHICS"
      | "VIDEO"
      | "AUDIO"
      | "MUSIC"
      | "EDIT"
      | "COVERAGE_LINKED";
    switch (componentData.component_type) {
      case "graphics":
        databaseType = "GRAPHICS";
        break;
      case "video":
        databaseType = "VIDEO";
        break;
      case "audio":
        databaseType = "AUDIO";
        break;
      case "music":
        databaseType = "MUSIC";
        break;
      default:
        databaseType = "EDIT";
        break;
    }

    const newComponent: TimelineComponent = {
      id: componentData.component_id || Date.now(),
      name: componentData.name,
      start_time: currentTime,
      duration: componentData.duration,
      track_id: correctTrackId, // Always use the correct track ID
      component_type: componentData.component_type,
      color: getComponentColor(componentData.component_type),
      description: componentData.component_id
        ? `Linked to component #${componentData.component_id}`
        : undefined,
      database_type: componentData.database_type || databaseType,
    };

    // Log the assignment for debugging
    const track = tracks.find((t) => t.id === correctTrackId);
    console.log(
      `✅ Placing ${componentData.component_type} component "${componentData.name}" on ${track?.name} track (ID: ${correctTrackId})`,
    );

    setComponents((prev) => [...prev, newComponent]);

    // Auto-add tasks if component has a linked component_id
    if (componentData.component_id && onComponentAdded) {
      try {
        const response = await fetch(
          `http://localhost:3002/api/entities/component/${componentData.component_id}/default-tasks`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.length > 0) {
            console.log(
              `🎯 Auto-adding ${result.data.length} default tasks for component "${componentData.name}"`,
            );
            await onComponentAdded(componentData.component_id, result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch and auto-add default tasks:", error);
      }
    }

    setAddComponentDialogOpen(false);
  };

  const getComponentColor = (type: string) => {
    switch (type) {
      case "graphics":
        return "#f57c00";
      case "video":
        return "#1976d2";
      case "audio":
        return "#388e3c";
      case "music":
        return "#7b1fa2";
      case "text":
        return "#9c27b0";
      default:
        return "#616161";
    }
  };

  // Helper function to get track icon
  const getTrackIcon = (trackType: string) => {
    switch (trackType) {
      case "video":
        return <VideoIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "audio":
        return <AudioIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "graphics":
        return <GraphicsIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "music":
        return <MusicIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      default:
        return null;
    }
  };

  // Helper function to get correct track ID for component type
  const getTrackIdForComponentType = (componentType: string) => {
    const track = tracks.find((t) => t.track_type === componentType);
    return track?.id || 1; // Default to first track if not found
  };

  // Helper function to validate component track assignment
  const validateComponentTrackAssignment = (component: TimelineComponent) => {
    const track = tracks.find((t) => t.id === component.track_id);
    if (!track) return false;

    // Check if component type matches track type
    return track.track_type === component.component_type;
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  // Render timeline ruler
  const renderRuler = () => {
    const markers = [];
    const step = zoomLevel >= 20 ? 1 : zoomLevel >= 10 ? 5 : 10; // Adaptive step based on zoom

    for (let time = 0; time <= totalDuration; time += step) {
      const x = timeToPixels(time);
      const isSecond = time % 1 === 0;
      const isMinute = time % 60 === 0;

      markers.push(
        <Box
          key={time}
          sx={{
            position: "absolute",
            left: x,
            top: 0,
            width: 1,
            height: isMinute ? 20 : isSecond ? 15 : 10,
            bgcolor: isMinute ? "primary.main" : "text.secondary",
            opacity: isMinute ? 1 : 0.6,
          }}
        />,
      );

      if (isMinute) {
        markers.push(
          <Typography
            key={`label-${time}`}
            variant="caption"
            sx={{
              position: "absolute",
              left: x + 4,
              top: 2,
              fontSize: "10px",
              color: "primary.main",
            }}
          >
            {formatTime(time)}
          </Typography>,
        );
      }
    }

    return markers;
  };

  // Render timeline components
  const renderComponents = () => {
    return components.map((component) => {
      const track = tracks.find((t) => t.id === component.track_id);
      if (!track || !track.visible) return null;

      const trackIndex = tracks.findIndex((t) => t.id === component.track_id);
      const x = timeToPixels(component.start_time);
      const width = timeToPixels(component.duration);
      const y = 30 + trackIndex * (60 + 15); // 30px ruler + trackIndex × (60px height + 15px spacing)

      return (
        <Tooltip
          key={component.id}
          title={
            <Box>
              <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                {component.name}
              </Typography>
              <br />
              <Typography variant="caption">
                Type: {component.component_type}
              </Typography>
              <br />
              <Typography variant="caption">
                Start: {formatTime(component.start_time)}
              </Typography>
              <br />
              <Typography variant="caption">
                Duration: {formatTime(component.duration)}
              </Typography>
              {component.description && (
                <>
                  <br />
                  <Typography variant="caption">
                    {component.description}
                  </Typography>
                </>
              )}
            </Box>
          }
          placement="top"
          arrow
        >
          <Box
            sx={{
              position: "absolute",
              left: x + 120, // Offset for track headers
              top: y,
              width: Math.max(width, 20), // Minimum width for visibility
              height: 56, // Fixed height (60px track - 4px margin)
              bgcolor: component.color,
              border: selectedComponent?.id === component.id ? 2 : 1,
              borderColor:
                selectedComponent?.id === component.id
                  ? "warning.main"
                  : "rgba(255,255,255,0.3)",
              borderRadius: 1,
              cursor: readOnly ? "default" : "move",
              display: "flex",
              alignItems: "center",
              px: 1,
              overflow: "hidden",
              zIndex: 50,
              "&:hover": readOnly
                ? {}
                : {
                    opacity: 0.8,
                    transform: "translateY(-1px)",
                    zIndex: 100,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  },
            }}
            onMouseDown={(e) => handleComponentMouseDown(e, component)}
          >
            <Typography
              variant="caption"
              sx={{
                color: "white",
                fontWeight: "bold",
                textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {component.name}
            </Typography>
            {/* Component type indicator */}
            <Box
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor:
                  component.component_type === "music"
                    ? "#e1bee7"
                    : "rgba(255,255,255,0.5)",
                border:
                  component.component_type === "music"
                    ? "1px solid #7b1fa2"
                    : "none",
              }}
            />
          </Box>
        </Tooltip>
      );
    });
  };

  // Render playhead
  const renderPlayhead = () => {
    const x = timeToPixels(currentTime);
    return (
      <Box
        sx={{
          position: "absolute",
          left: x + 120, // Offset for track headers
          top: 0,
          width: 2,
          height: "100%",
          bgcolor: "error.main",
          zIndex: 75, // Above components but below hover state
          pointerEvents: "none",
        }}
      />
    );
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {/* Timeline Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Box display="flex" gap={1}>
              <IconButton onClick={handlePlay} color="primary" size="large">
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
              <IconButton onClick={handleStop}>
                <StopIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ minWidth: 80 }}>
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </Typography>
              <Slider
                value={currentTime}
                max={totalDuration}
                step={0.1}
                onChange={(_, value) => setCurrentTime(value as number)}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>

          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                onClick={() => setZoomLevel(Math.max(5, zoomLevel - 5))}
              >
                <ZoomOutIcon />
              </IconButton>
              <Typography
                variant="body2"
                sx={{ minWidth: 60, textAlign: "center" }}
              >
                {zoomLevel}px/s
              </Typography>
              <IconButton
                onClick={() => setZoomLevel(Math.min(50, zoomLevel + 5))}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
          </Grid>

          {!readOnly && (
            <Grid item>
              <Box display="flex" gap={1}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setAddComponentDialogOpen(true)}
                  variant="outlined"
                >
                  Add Component
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => onSave?.(components)}
                  variant="contained"
                >
                  Save
                </Button>
                <Button
                  startIcon={<ExportIcon />}
                  onClick={() => setExportDialogOpen(true)}
                  variant="outlined"
                >
                  Export
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Timeline Container */}
      <Paper sx={{ height: 400, overflow: "auto", position: "relative" }}>
        {" "}
        {/* Reduced back to 400px for cleaner layout */}
        <Box
          ref={timelineRef}
          sx={{
            width: Math.max(timelineWidth, viewportWidth),
            height: 4 * 60 + 4 * 15 + 50, // 4 tracks × 60px height + 4 × 15px spacing + 50px ruler = 350px
            position: "relative",
            bgcolor: "#1a1a1a",
          }}
        >
          {/* Ruler */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: 30,
              bgcolor: "#2a2a2a",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {renderRuler()}
          </Box>

          {/* Track Headers */}
          {tracks
            .filter((track) => track.visible)
            .map((track, index) => (
              <Box
                key={track.id}
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 30 + index * (60 + 15), // 30px ruler + index × (60px height + 15px spacing)
                  width: 120,
                  height: 60, // Fixed height for all tracks
                  bgcolor:
                    track.name === "Music"
                      ? "#4a1a54"
                      : track.name === "Video"
                        ? "#1a4480"
                        : "#333",
                  border: 1,
                  borderColor:
                    track.name === "Music"
                      ? "#7b1fa2"
                      : track.name === "Video"
                        ? "#1976d2"
                        : "divider",
                  display: "flex",
                  alignItems: "center",
                  px: 1,
                  zIndex: 1,
                  boxShadow:
                    track.name === "Video"
                      ? "inset 0 0 8px rgba(25,118,210,0.3)"
                      : "none",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  {getTrackIcon(track.track_type)}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight:
                        track.name === "Music" || track.name === "Video"
                          ? "bold"
                          : "normal",
                      color:
                        track.name === "Music"
                          ? "#e1bee7"
                          : track.name === "Video"
                            ? "#90caf9"
                            : "white", // Light blue for Video
                      fontSize:
                        track.name === "Music" || track.name === "Video"
                          ? "0.75rem"
                          : "0.7rem",
                    }}
                  >
                    {track.name}
                  </Typography>
                </Box>
              </Box>
            ))}

          {/* Timeline Grid */}
          {tracks
            .filter((track) => track.visible)
            .map((track, index) => (
              <Box
                key={`grid-${track.id}`}
                sx={{
                  position: "absolute",
                  left: 120,
                  top: 30 + index * (60 + 15), // 30px ruler + index × (60px height + 15px spacing)
                  width: timelineWidth - 120,
                  height: 60, // Fixed height for all tracks
                  bgcolor:
                    track.name === "Music"
                      ? "rgba(123,31,162,0.1)"
                      : track.name === "Video"
                        ? "rgba(25,118,210,0.08)"
                        : "rgba(255,255,255,0.02)",
                  border: 1,
                  borderColor:
                    track.name === "Music"
                      ? "rgba(123,31,162,0.3)"
                      : track.name === "Video"
                        ? "rgba(25,118,210,0.3)"
                        : "rgba(255,255,255,0.1)",
                  backgroundImage: snapToGrid
                    ? `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent ${timeToPixels(gridSize) - 1}px,
                      ${
                        track.name === "Music"
                          ? "rgba(123,31,162,0.2)"
                          : track.name === "Video"
                            ? "rgba(25,118,210,0.2)"
                            : "rgba(255,255,255,0.1)"
                      } ${timeToPixels(gridSize)}px
                    )`
                    : "none",
                  zIndex: 2,
                  // Add visual feedback for valid/invalid drop zones during drag
                  ...(draggedComponent && {
                    border:
                      track.track_type === draggedComponent.component_type
                        ? `2px solid ${getComponentColor(draggedComponent.component_type)}`
                        : "2px solid rgba(255,0,0,0.3)",
                    bgcolor:
                      track.track_type === draggedComponent.component_type
                        ? `${getComponentColor(draggedComponent.component_type)}15`
                        : "rgba(255,0,0,0.05)",
                  }),
                }}
              />
            ))}

          {/* Timeline Components */}
          {renderComponents()}

          {/* Playhead */}
          {renderPlayhead()}
        </Box>
      </Paper>

      {/* Component Info Panel */}
      {selectedComponent && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Component Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedComponent.name}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">
                  <strong>Start:</strong>{" "}
                  {formatTime(selectedComponent.start_time)}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">
                  <strong>Duration:</strong>{" "}
                  {formatTime(selectedComponent.duration)}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedComponent.component_type}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Track:</strong>{" "}
                  {tracks.find((t) => t.id === selectedComponent.track_id)
                    ?.name || "Unknown"}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 1, color: "text.secondary" }}
                  >
                    (Track ID: {selectedComponent.track_id})
                  </Typography>
                </Typography>
              </Grid>
              {selectedComponent.description && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Description:</strong>{" "}
                    {selectedComponent.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Track Assignment Debug Panel (for development) */}
      {components.length > 0 && (
        <Card sx={{ mt: 2, bgcolor: "rgba(0,0,0,0.05)" }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center" }}
            >
              Component Track Assignments
              <Typography
                variant="caption"
                sx={{ ml: 1, color: "text.secondary" }}
              >
                ({components.length} components)
              </Typography>
            </Typography>
            <Grid container spacing={1}>
              {components.map((component) => {
                const track = tracks.find((t) => t.id === component.track_id);
                const isValidAssignment =
                  validateComponentTrackAssignment(component);
                const correctTrackId = getTrackIdForComponentType(
                  component.component_type,
                );
                const correctTrack = tracks.find(
                  (t) => t.id === correctTrackId,
                );

                return (
                  <Grid item xs={6} sm={4} md={3} key={component.id}>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: component.color,
                        borderRadius: 1,
                        color: "white",
                        cursor: "pointer",
                        border: isValidAssignment
                          ? "2px solid rgba(76,175,80,0.8)"
                          : "2px solid #ff9800",
                        "&:hover": { opacity: 0.8 },
                      }}
                      onClick={() => setSelectedComponent(component)}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: "bold", display: "block" }}
                      >
                        {component.name}
                        {isValidAssignment ? " ✅" : " ⚠️"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.9, display: "block" }}
                      >
                        → {track?.name || "Unknown Track"}
                      </Typography>
                      {!isValidAssignment && correctTrack && (
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.8,
                            display: "block",
                            fontSize: "0.6rem",
                            color: "#ffeb3b",
                          }}
                        >
                          Should be: {correctTrack.name}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          display: "block",
                          fontSize: "0.65rem",
                        }}
                      >
                        Type: {component.component_type}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Track Assignment Summary */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: "rgba(0,0,0,0.08)",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                Track Assignment Summary:
              </Typography>
              {["graphics", "video", "audio", "music"].map((type) => {
                const typeComponents = components.filter(
                  (c) => c.component_type === type,
                );
                const validComponents = typeComponents.filter((c) =>
                  validateComponentTrackAssignment(c),
                );
                const correctTrack = tracks.find((t) => t.track_type === type);
                return (
                  <Typography
                    key={type}
                    variant="caption"
                    sx={{ display: "block", ml: 1, mb: 0.5 }}
                  >
                    <strong>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </strong>
                    : {validComponents.length}/{typeComponents.length} on{" "}
                    {correctTrack?.name} track
                    {validComponents.length === typeComponents.length
                      ? " ✅"
                      : " ⚠️"}
                  </Typography>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Add Component Dialog */}
      <AddComponentDialog
        open={addComponentDialogOpen}
        onClose={() => setAddComponentDialogOpen(false)}
        onAdd={handleAddComponent}
        tracks={tracks}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={(format) => {
          onExport?.(format);
          setExportDialogOpen(false);
        }}
      />
    </Box>
  );
};

// Add Component Dialog Component
interface AddComponentDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (component: {
    name: string;
    duration: number;
    track_id: number;
    component_type: "video" | "audio" | "graphics" | "music";
    component_id?: number;
    database_type?:
      | "GRAPHICS"
      | "VIDEO"
      | "AUDIO"
      | "MUSIC"
      | "EDIT"
      | "COVERAGE_LINKED";
  }) => void;
  tracks: TimelineTrack[];
}

const AddComponentDialog: React.FC<AddComponentDialogProps> = ({
  open,
  onClose,
  onAdd,
  tracks,
}) => {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(10);
  const [trackId, setTrackId] = useState(1);
  const [componentType, setComponentType] = useState<
    "video" | "audio" | "graphics" | "music"
  >("video");
  const [availableComponents, setAvailableComponents] = useState<
    ComponentLibrary[]
  >([]);
  const [filteredComponents, setFilteredComponents] = useState<
    ComponentLibrary[]
  >([]);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(
    null,
  );
  const [useExistingComponent, setUseExistingComponent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Load available components when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableComponents();
    }
  }, [open]);

  // Auto-update track when component type changes
  useEffect(() => {
    const correctTrack = tracks.find((t) => t.track_type === componentType);
    if (correctTrack && trackId !== correctTrack.id) {
      setTrackId(correctTrack.id);
    }
  }, [componentType, tracks, trackId]);

  // Filter components based on search and type
  useEffect(() => {
    let filtered = availableComponents;

    // Filter by type
    if (filterType !== "ALL") {
      filtered = filtered.filter((c) => c.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description &&
            c.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    setFilteredComponents(filtered);
  }, [availableComponents, searchTerm, filterType]);

  const loadAvailableComponents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3002/components");
      if (response.ok) {
        const components = await response.json();
        setAvailableComponents(components);
        setFilteredComponents(components);
      }
    } catch (error) {
      console.error("Failed to load components:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComponentSelection = (component: ComponentLibrary) => {
    setSelectedComponentId(component.id);
    setName(component.name);
    setDuration(component.estimated_duration || 10);

    // Map database component types to timeline types
    let newComponentType: "video" | "audio" | "graphics" | "music" = "video";
    if (component.type === "GRAPHICS") {
      newComponentType = "graphics";
    } else if (component.type === "VIDEO" || component.type === "EDIT") {
      newComponentType = "video";
    } else if (component.type === "AUDIO") {
      newComponentType = "audio";
    } else if (component.type === "MUSIC") {
      newComponentType = "music";
    } else {
      newComponentType = "video"; // Default fallback
    }
    setComponentType(newComponentType);

    // Auto-assign correct track
    const correctTrack = tracks.find((t) => t.track_type === newComponentType);
    if (correctTrack) {
      setTrackId(correctTrack.id);
    }
  };

  const handleAdd = () => {
    if (name.trim()) {
      // Map timeline component type to database type
      let databaseType:
        | "GRAPHICS"
        | "VIDEO"
        | "AUDIO"
        | "MUSIC"
        | "EDIT"
        | "COVERAGE_LINKED";
      switch (componentType) {
        case "graphics":
          databaseType = "GRAPHICS";
          break;
        case "video":
          databaseType = "VIDEO";
          break;
        case "audio":
          databaseType = "AUDIO";
          break;
        case "music":
          databaseType = "MUSIC";
          break;
        default:
          databaseType = "EDIT";
          break;
      }

      onAdd({
        name: name.trim(),
        duration,
        track_id: trackId,
        component_type: componentType,
        component_id: useExistingComponent
          ? selectedComponentId || undefined
          : undefined,
        database_type: databaseType,
      });
      // Reset form
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setName("");
    setDuration(10);
    setTrackId(1);
    setComponentType("video");
    setSelectedComponentId(null);
    setUseExistingComponent(false);
    setSearchTerm("");
    setFilterType("ALL");
  };

  const getComponentTypeIcon = (type: string) => {
    switch (type) {
      case "GRAPHICS":
        return <GraphicsIcon sx={{ fontSize: 20, color: "#f57c00" }} />;
      case "VIDEO":
      case "EDIT":
        return <VideoIcon sx={{ fontSize: 20, color: "#1976d2" }} />;
      case "AUDIO":
        return <AudioIcon sx={{ fontSize: 20, color: "#388e3c" }} />;
      case "MUSIC":
        return <MusicIcon sx={{ fontSize: 20, color: "#7b1fa2" }} />;
      default:
        return <VideoIcon sx={{ fontSize: 20, color: "#616161" }} />;
    }
  };

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case "GRAPHICS":
        return "#f57c00";
      case "VIDEO":
      case "EDIT":
        return "#1976d2";
      case "AUDIO":
        return "#388e3c";
      case "MUSIC":
        return "#7b1fa2";
      default:
        return "#616161";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Add Timeline Component
          <Typography variant="body2" color="text.secondary">
            {useExistingComponent
              ? "Browse Component Library"
              : "Create Custom Component"}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {/* Component Source Selection */}
          <FormControl fullWidth>
            <InputLabel>Component Source</InputLabel>
            <Select
              value={useExistingComponent ? "existing" : "custom"}
              onChange={(e) => {
                const isExisting = e.target.value === "existing";
                setUseExistingComponent(isExisting);
                if (!isExisting) {
                  setSelectedComponentId(null);
                  setName("");
                  setDuration(10);
                }
              }}
            >
              <MenuItem value="custom">
                <Box display="flex" alignItems="center">
                  <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                  Create Custom Component
                </Box>
              </MenuItem>
              <MenuItem value="existing">
                <Box display="flex" alignItems="center">
                  <LayersIcon sx={{ mr: 1, fontSize: 18 }} />
                  Browse Component Library ({availableComponents.length}{" "}
                  available)
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Component Library Browser */}
          {useExistingComponent && (
            <Box>
              {/* Search and Filter Controls */}
              <Stack direction="row" spacing={2} mb={2}>
                <TextField
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Filter"
                  >
                    <MenuItem value="ALL">All Types</MenuItem>
                    <MenuItem value="GRAPHICS">Graphics</MenuItem>
                    <MenuItem value="VIDEO">Video</MenuItem>
                    <MenuItem value="AUDIO">Audio</MenuItem>
                    <MenuItem value="MUSIC">Music</MenuItem>
                    <MenuItem value="EDIT">Edit</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Component Grid */}
              <Box
                sx={{
                  maxHeight: 400,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {loading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : filteredComponents.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    p={4}
                  >
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No components found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || filterType !== "ALL"
                        ? "Try adjusting your search or filter criteria"
                        : "No components available in the library"}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1}>
                    {filteredComponents.map((component) => (
                      <Grid item xs={12} sm={6} md={4} key={component.id}>
                        <Card
                          sx={{
                            cursor: "pointer",
                            transition: "all 0.2s",
                            border:
                              selectedComponentId === component.id
                                ? "2px solid"
                                : "1px solid",
                            borderColor:
                              selectedComponentId === component.id
                                ? getComponentTypeColor(component.type)
                                : "divider",
                            "&:hover": {
                              boxShadow: 2,
                              transform: "translateY(-1px)",
                            },
                          }}
                          onClick={() => handleComponentSelection(component)}
                        >
                          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                            <Box display="flex" alignItems="center" mb={1}>
                              {getComponentTypeIcon(component.type)}
                              <Typography
                                variant="subtitle2"
                                sx={{ ml: 1, fontWeight: 600 }}
                              >
                                {component.name}
                              </Typography>
                            </Box>

                            {component.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1, fontSize: "0.875rem" }}
                              >
                                {component.description}
                              </Typography>
                            )}

                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Chip
                                label={component.type}
                                size="small"
                                sx={{
                                  bgcolor: `${getComponentTypeColor(component.type)}20`,
                                  color: getComponentTypeColor(component.type),
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />
                              <Box display="flex" alignItems="center" gap={1}>
                                {component.estimated_duration && (
                                  <Tooltip title="Estimated Duration">
                                    <Box display="flex" alignItems="center">
                                      <AccessTimeIcon
                                        sx={{
                                          fontSize: 14,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ ml: 0.5 }}
                                      >
                                        {component.estimated_duration}s
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                )}
                                <Tooltip title="Complexity Score">
                                  <Box display="flex" alignItems="center">
                                    <TrendingUpIcon
                                      sx={{
                                        fontSize: 14,
                                        color: "text.secondary",
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{ ml: 0.5 }}
                                    >
                                      {component.complexity_score}/10
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Box>
          )}

          {/* Component Details */}
          <TextField
            label="Component Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            disabled={useExistingComponent && selectedComponentId !== null}
          />
          <TextField
            label="Duration (seconds)"
            type="number"
            value={duration}
            onChange={(e) =>
              setDuration(Math.max(1, parseFloat(e.target.value) || 1))
            }
            fullWidth
            inputProps={{ min: 1, step: 0.1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Track</InputLabel>
            <Select
              value={trackId}
              onChange={(e) => setTrackId(e.target.value as number)}
            >
              {tracks.map((track) => (
                <MenuItem
                  key={track.id}
                  value={track.id}
                  sx={{
                    bgcolor:
                      track.track_type === componentType
                        ? "rgba(25, 118, 210, 0.1)"
                        : "transparent",
                  }}
                >
                  <Box display="flex" alignItems="center">
                    {(() => {
                      switch (track.track_type) {
                        case "video":
                          return <VideoIcon sx={{ fontSize: 16, mr: 0.5 }} />;
                        case "audio":
                          return <AudioIcon sx={{ fontSize: 16, mr: 0.5 }} />;
                        case "graphics":
                          return (
                            <GraphicsIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          );
                        case "music":
                          return <MusicIcon sx={{ fontSize: 16, mr: 0.5 }} />;
                        default:
                          return null;
                      }
                    })()}
                    {track.name} ({track.track_type})
                    {track.track_type === componentType && " ✓ Recommended"}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <Typography
              variant="caption"
              sx={{ mt: 0.5, color: "text.secondary" }}
            >
              Track automatically selected based on component type
            </Typography>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Component Type</InputLabel>
            <Select
              value={componentType}
              onChange={(e) =>
                setComponentType(
                  e.target.value as "video" | "audio" | "graphics" | "music",
                )
              }
            >
              <MenuItem value="graphics">
                <Box display="flex" alignItems="center">
                  <GraphicsIcon sx={{ mr: 1, fontSize: 18 }} />
                  Graphics
                </Box>
              </MenuItem>
              <MenuItem value="video">
                <Box display="flex" alignItems="center">
                  <VideoIcon sx={{ mr: 1, fontSize: 18 }} />
                  Video
                </Box>
              </MenuItem>
              <MenuItem value="audio">
                <Box display="flex" alignItems="center">
                  <AudioIcon sx={{ mr: 1, fontSize: 18 }} />
                  Audio
                </Box>
              </MenuItem>
              <MenuItem value="music">
                <Box display="flex" alignItems="center">
                  <MusicIcon sx={{ mr: 1, fontSize: 18 }} />
                  Music
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={!name.trim()}
          startIcon={
            useExistingComponent && selectedComponentId ? (
              <LayersIcon />
            ) : (
              <AddIcon />
            )
          }
        >
          {useExistingComponent && selectedComponentId
            ? "Add from Library"
            : "Create Component"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Export Dialog Component
interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: string) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] = useState("json");

  const formats = [
    { value: "json", label: "JSON (System Integration)" },
    { value: "pdf", label: "PDF (Client Presentation)" },
    { value: "csv", label: "CSV (Production Planning)" },
    { value: "xml", label: "XML (External Software)" },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Timeline</DialogTitle>
      <DialogContent>
        <Box mt={1}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              {formats.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  {format.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onExport(selectedFormat)} variant="contained">
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VisualTimelineBuilder;
