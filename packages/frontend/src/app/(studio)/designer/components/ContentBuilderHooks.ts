import { useState, useEffect, useCallback, useRef } from "react";
import {
  ScenesLibrary,
  TimelineScene,
  TimelineTrack,
  DatabaseLayer,
  PlaybackState,
  DragState,
  ViewState,
  ScenesLibraryState,
} from "./ContentBuilderTypes";

export const useTimelineData = () => {
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    // Default tracks with correct database layer IDs
    {
      id: 4, // Database layer ID for Graphics
      name: "Graphics",
      track_type: "graphics",
      height: 60,
      visible: true,
      muted: false,
      color: "#ff9800",
      order_index: 0,
    },
    {
      id: 1, // Database layer ID for Video
      name: "Video",
      track_type: "video",
      height: 60,
      visible: true,
      muted: false,
      color: "#2196f3",
      order_index: 1,
    },
    {
      id: 2, // Database layer ID for Audio
      name: "Audio",
      track_type: "audio",
      height: 60,
      visible: true,
      muted: false,
      color: "#4caf50",
      order_index: 2,
    },
    {
      id: 3, // Database layer ID for Music
      name: "Music",
      track_type: "music",
      height: 60,
      visible: true,
      muted: false,
      color: "#9c27b0",
      order_index: 3,
    },
  ]);

  // Load timeline layers from database on component mount
  const loadTimelineLayers = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3002/timeline/layers");
      if (response.ok) {
        const layers: DatabaseLayer[] = await response.json();

        // Map database layers to frontend tracks
        const mappedTracks: TimelineTrack[] = layers
          .map((layer) => {
            // Ensure Graphics > Video > Audio > Music order
            const order = { Graphics: 0, Video: 1, Audio: 2, Music: 3 };
            return {
              id: layer.id,
              name: layer.name,
              track_type: layer.name.toLowerCase() as
                | "video"
                | "audio"
                | "graphics"
                | "music",
              height: 60,
              visible: layer.is_active,
              muted: false,
              color: layer.color_hex,
              order_index: order[layer.name as keyof typeof order] ?? 99,
            };
          })
          .sort((a, b) => a.order_index - b.order_index);

        if (mappedTracks.length > 0) {
          setTracks(mappedTracks);
          console.log("✅ Loaded timeline layers from database:", mappedTracks);
        } else {
          console.log("⚠️ No layers returned from database, keeping defaults");
        }
      } else {
        console.error(
          "❌ Failed to load timeline layers:",
          response.statusText,
        );
      }
    } catch (error) {
      console.error("❌ Error loading timeline layers:", error);
      // Keep default tracks if loading fails
    }
  }, []);

  const getDefaultTrackColor = (trackType: string) => {
    switch (trackType) {
      case "video":
        return "#2196f3";
      case "audio":
        return "#4caf50";
      case "graphics":
        return "#ff9800";
      case "music":
        return "#9c27b0";
      default:
        return "#757575";
    }
  };

  return {
    tracks,
    setTracks,
    loadTimelineLayers,
    getDefaultTrackColor,
  };
};

export const usePlaybackControls = (scenes: TimelineScene[] = []) => {
  // Calculate dynamic duration based on scenes, with a minimum of 60 seconds (1 minute)
  const calculateTimelineDuration = (
    timelineScenes: TimelineScene[],
  ): number => {
    if (timelineScenes.length === 0) {
      return 60; // Default 1 minute when no scenes
    }

    // Find the scene that ends latest
    const maxEndTime = Math.max(
      ...timelineScenes.map((scene) => scene.start_time + scene.duration),
    );

    // Timeline should be at least 1 minute, but expand to fit the longest scene
    return Math.max(60, maxEndTime);
  };

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    totalDuration: calculateTimelineDuration(scenes),
    playbackSpeed: 1,
  });

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timelineScrollRef = useRef<{ scrollLeft: number }>({ scrollLeft: 0 });

  // Update timeline duration when scenes change
  useEffect(() => {
    const newDuration = calculateTimelineDuration(scenes);
    setPlaybackState((prev) => ({
      ...prev,
      totalDuration: newDuration,
      // If current time is beyond new duration, reset to start
      currentTime: prev.currentTime > newDuration ? 0 : prev.currentTime,
    }));
  }, [scenes]);

  const handlePlay = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));

    if (!playbackState.isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackState((prev) => {
          const newTime = prev.currentTime + 0.1 * prev.playbackSpeed;
          if (newTime >= prev.totalDuration) {
            return {
              ...prev,
              isPlaying: false,
              currentTime: prev.totalDuration,
            };
          }
          return { ...prev, currentTime: newTime };
        });
      }, 100);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
  }, [playbackState.isPlaying]);

  const handleStop = () => {
    setPlaybackState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackState((prev) => ({ ...prev, playbackSpeed: newSpeed }));
  };

  const handleTimelineClick = (time: number) => {
    setPlaybackState((prev) => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.totalDuration)),
    }));
  };

  // Timeline viewport management for navigation without scroll bars
  const updateTimelineViewport = useCallback(
    (viewportWidth: number, zoomLevel: number) => {
      const playheadPosition = playbackState.currentTime * zoomLevel;
      const viewportCenter = viewportWidth / 2;

      // Calculate the optimal scroll position to center the playhead
      let targetScrollLeft = playheadPosition - viewportCenter;
      targetScrollLeft = Math.max(0, targetScrollLeft);

      timelineScrollRef.current.scrollLeft = targetScrollLeft;

      return targetScrollLeft;
    },
    [playbackState.currentTime],
  );

  const jumpToTime = useCallback(
    (time: number) => {
      const clampedTime = Math.max(
        0,
        Math.min(time, playbackState.totalDuration),
      );
      setPlaybackState((prev) => ({ ...prev, currentTime: clampedTime }));
    },
    [playbackState.totalDuration],
  );

  const jumpToPercentage = useCallback(
    (percentage: number) => {
      const time = (percentage / 100) * playbackState.totalDuration;
      jumpToTime(time);
    },
    [playbackState.totalDuration, jumpToTime],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, []);

  return {
    playbackState,
    setPlaybackState,
    handlePlay,
    handleStop,
    handleSpeedChange,
    handleTimelineClick,
    updateTimelineViewport,
    jumpToTime,
    jumpToPercentage,
    timelineScrollRef,
  };
};

export const useScenesLibrary = () => {
  const [libraryState, setLibraryState] = useState<ScenesLibraryState>({
    availableScenes: [],
    loadingScenes: false,
    searchTerm: "",
    selectedCategory: "ALL",
  });

  const loadAvailableScenes = useCallback(async () => {
    try {
      setLibraryState((prev) => ({ ...prev, loadingScenes: true }));
      const response = await fetch("http://localhost:3002/scenes");
      if (response.ok) {
        const scenes = await response.json();
        setLibraryState((prev) => ({
          ...prev,
          availableScenes: scenes,
          loadingScenes: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load scenes:", error);
      setLibraryState((prev) => ({ ...prev, loadingScenes: false }));
    }
  }, []);

  const getFilteredScenes = useCallback(() => {
    return libraryState.availableScenes.filter((scene) => {
      const matchesSearch =
        scene.name
          .toLowerCase()
          .includes(libraryState.searchTerm.toLowerCase()) ||
        (scene.description
          ?.toLowerCase()
          .includes(libraryState.searchTerm.toLowerCase()) ??
          false);
      const matchesCategory =
        libraryState.selectedCategory === "ALL" ||
        scene.type === libraryState.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [
    libraryState.availableScenes,
    libraryState.searchTerm,
    libraryState.selectedCategory,
  ]);

  const updateSearchTerm = useCallback((searchTerm: string) => {
    setLibraryState((prev) => ({ ...prev, searchTerm }));
  }, []);

  const updateSelectedCategory = useCallback((selectedCategory: string) => {
    setLibraryState((prev) => ({ ...prev, selectedCategory }));
  }, []);

  return {
    libraryState,
    loadAvailableScenes,
    getFilteredScenes,
    updateSearchTerm,
    updateSelectedCategory,
  };
};

export const useDragAndDrop = (
  scenes: TimelineScene[],
  setScenes: React.Dispatch<React.SetStateAction<TimelineScene[]>>,
  tracks: TimelineTrack[],
  timelineRef?: React.RefObject<HTMLDivElement>,
) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedScene: null,
    draggedLibraryScene: null,
    dragOffset: { x: 0, y: 0 },
    isDragActive: false,
  });

  const [viewState, setViewState] = useState<ViewState>({
    zoomLevel: 10, // pixels per second
    snapToGrid: true,
    gridSize: 5, // 5-second snap grid
    selectedScene: null,
    viewportLeft: 0, // timeline scroll position
    viewportWidth: 800, // default viewport width
  });

  const handleSceneMouseDown = (e: React.MouseEvent, scene: TimelineScene) => {
    if (e.button !== 0) return; // Only handle left mouse button

    e.preventDefault();
    e.stopPropagation();

    const timelineRect = timelineRef?.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const offsetX =
      e.clientX - (timelineRect.left + scene.start_time * viewState.zoomLevel);
    const offsetY = e.clientY - timelineRect.top;

    setDragState({
      draggedScene: scene,
      draggedLibraryScene: null,
      dragOffset: { x: offsetX, y: offsetY },
      isDragActive: true,
    });
    setViewState((prev) => ({ ...prev, selectedScene: scene }));
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.draggedScene) return;

      const timelineRect = timelineRef?.current?.getBoundingClientRect();
      if (!timelineRect) return;

      const mouseX = e.clientX - timelineRect.left - dragState.dragOffset.x;
      const mouseY = e.clientY - timelineRect.top - dragState.dragOffset.y;

      let newStartTime = mouseX / viewState.zoomLevel;
      if (viewState.snapToGrid) {
        newStartTime =
          Math.round(newStartTime / viewState.gridSize) * viewState.gridSize;
      }
      newStartTime = Math.max(0, newStartTime);

      // Find target track based on mouse Y position
      let targetTrackId = dragState.draggedScene.track_id;

      // Calculate track index based on mouse Y position
      // Account for track layout: video/graphics tracks first, then audio tracks with separator
      const videoTracks = tracks.filter(
        (t) => t.track_type === "video" || t.track_type === "graphics",
      );
      const audioTracks = tracks.filter(
        (t) => t.track_type === "audio" || t.track_type === "music",
      );

      let trackIndex = -1;
      if (mouseY < videoTracks.length * 40) {
        // In video/graphics section
        trackIndex = Math.floor(mouseY / 40);
      } else if (mouseY >= videoTracks.length * 40 + 24) {
        // In audio section (after separator gap)
        const audioY = mouseY - (videoTracks.length * 40 + 24);
        const audioIndex = Math.floor(audioY / 40);
        if (audioIndex >= 0 && audioIndex < audioTracks.length) {
          trackIndex = videoTracks.length + audioIndex;
        }
      }

      if (trackIndex >= 0 && trackIndex < tracks.length) {
        const targetTrack = tracks[trackIndex];
        const sceneType =
          dragState.draggedScene.database_type ||
          dragState.draggedScene.scene_type.toUpperCase();
        // Only allow track change if scene type is compatible with target track
        if (isSceneCompatibleWithTrack(sceneType, targetTrack.track_type)) {
          targetTrackId = targetTrack.id;
        }
        // If not compatible, keep the current track
      }

      // Check for collisions using current scenes state
      setScenes((prevScenes) => {
        const hasCollision = prevScenes.some((scene) => {
          if (scene.id === dragState.draggedScene!.id) return false;
          if (scene.track_id !== targetTrackId) return false;

          const sceneEnd = scene.start_time + scene.duration;
          const draggedEnd = newStartTime + dragState.draggedScene!.duration;

          return !(newStartTime >= sceneEnd || draggedEnd <= scene.start_time);
        });

        if (!hasCollision) {
          return prevScenes.map((scene) =>
            scene.id === dragState.draggedScene!.id
              ? { ...scene, start_time: newStartTime, track_id: targetTrackId }
              : scene,
          );
        }
        return prevScenes; // No change if collision detected
      });
    },
    [
      dragState.draggedScene,
      dragState.dragOffset,
      viewState.zoomLevel,
      viewState.snapToGrid,
      viewState.gridSize,
      tracks,
      setScenes,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      draggedScene: null,
      isDragActive: false,
    }));
  }, []);

  // Helper function to check if a scene type is compatible with a track type
  const isSceneCompatibleWithTrack = (
    sceneType: string,
    trackType: string,
  ): boolean => {
    const compatibilityMap: Record<string, string[]> = {
      GRAPHICS: ["graphics"],
      VIDEO: ["video"],
      AUDIO: ["audio"],
      MUSIC: ["music"],
    };
    return compatibilityMap[sceneType]?.includes(trackType) ?? false;
  };

  // Helper function to get valid track for a scene type
  const getValidTracksForScene = (sceneType: string): TimelineTrack[] => {
    return tracks.filter((track) =>
      isSceneCompatibleWithTrack(sceneType, track.track_type),
    );
  };

  const handleLibrarySceneDragStart = (
    e: React.DragEvent,
    scene: ScenesLibrary,
  ) => {
    e.dataTransfer.setData("application/json", JSON.stringify(scene));
    setDragState((prev) => ({ ...prev, draggedLibraryScene: scene }));
  };

  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    if (!dragState.draggedLibraryScene) return;

    // Calculate which track the mouse is over
    const timelineRect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - timelineRect.top;
    const trackHeight = 60; // 40px track + 20px gap for audio tracks
    let trackIndex = Math.floor(mouseY / trackHeight);

    // Adjust for audio track spacing
    const videoTracks = tracks.filter(
      (t) => t.track_type === "video" || t.track_type === "graphics",
    );
    if (trackIndex >= videoTracks.length) {
      // Mouse is in the audio section - adjust for the separator gap
      const adjustedY = mouseY - (videoTracks.length * 40 + 24);
      const audioTrackIndex = Math.floor(adjustedY / 40);
      trackIndex = videoTracks.length + audioTrackIndex;
    }

    const targetTrack = tracks[trackIndex];
    const isValidDrop =
      targetTrack &&
      isSceneCompatibleWithTrack(
        dragState.draggedLibraryScene.type,
        targetTrack.track_type,
      );

    e.dataTransfer.dropEffect = isValidDrop ? "copy" : "none";
  };

  const handleTimelineDragLeave = () => {
    // Remove any visual feedback when leaving the timeline
  };

  const handleTimelineDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    try {
      const sceneData = JSON.parse(
        e.dataTransfer.getData("application/json"),
      ) as ScenesLibrary;

      const timelineRect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - timelineRect.left;
      const mouseY = e.clientY - timelineRect.top;

      let dropTime = mouseX / viewState.zoomLevel;
      if (viewState.snapToGrid) {
        dropTime =
          Math.round(dropTime / viewState.gridSize) * viewState.gridSize;
      }
      dropTime = Math.max(0, dropTime);

      // Determine target track based on drop position with proper spacing calculation
      const trackHeight = 60; // 40px track + 20px gap for audio tracks
      let trackIndex = Math.floor(mouseY / trackHeight);

      // Adjust for audio track spacing
      const videoTracks = tracks.filter(
        (t) => t.track_type === "video" || t.track_type === "graphics",
      );
      if (trackIndex >= videoTracks.length) {
        // Mouse is in the audio section - adjust for the separator gap
        const adjustedY = mouseY - (videoTracks.length * 40 + 24);
        const audioTrackIndex = Math.floor(adjustedY / 40);
        trackIndex = videoTracks.length + audioTrackIndex;
      }

      const targetTrack = tracks[trackIndex];

      // Validate track exists and scene type is compatible
      if (!targetTrack) {
        console.warn("No valid track found at drop position");
        return;
      }

      if (!isSceneCompatibleWithTrack(sceneData.type, targetTrack.track_type)) {
        console.warn(
          `Scene type ${sceneData.type} is not compatible with track type ${targetTrack.track_type}`,
        );
        return;
      }

      // Get default duration from scene or use 30 seconds
      const defaultDuration = sceneData.estimated_duration || 30;

      // Map scene type to track type for timeline scene
      const sceneTypeMapping: Record<
        string,
        "video" | "audio" | "graphics" | "music"
      > = {
        VIDEO: "video",
        AUDIO: "audio",
        GRAPHICS: "graphics",
        MUSIC: "music",
      };

      const sceneType = sceneTypeMapping[sceneData.type];

      // Create new timeline scene
      const newScene: TimelineScene = {
        id: Date.now() + Math.random(), // Temporary ID
        name: sceneData.name,
        start_time: dropTime,
        duration: defaultDuration,
        track_id: targetTrack.id,
        scene_type: sceneType,
        color: targetTrack.color,
        description: sceneData.description,
        database_type: sceneData.type,
      };

      // Check for collisions before adding
      const hasCollision = scenes.some((scene) => {
        if (scene.track_id !== newScene.track_id) return false;
        const sceneEnd = scene.start_time + scene.duration;
        const newEnd = newScene.start_time + newScene.duration;
        return !(newScene.start_time >= sceneEnd || newEnd <= scene.start_time);
      });

      if (!hasCollision) {
        setScenes((prev) => [...prev, newScene]);

        // Scene added successfully - no additional task handling needed for now
        console.log("Scene added to timeline:", sceneData.id);
      } else {
        console.warn("Cannot drop scene: collision detected");
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }

    setDragState((prev) => ({ ...prev, draggedLibraryScene: null }));
  };

  const handleLibrarySceneDragEnd = () => {
    setDragState((prev) => ({ ...prev, draggedLibraryScene: null }));
  };

  // Viewport management functions for timeline navigation
  const updateViewportWidth = useCallback((width: number) => {
    setViewState((prev) => ({ ...prev, viewportWidth: width }));
  }, []);

  const updateViewportLeft = useCallback((left: number) => {
    setViewState((prev) => ({ ...prev, viewportLeft: left }));
  }, []);

  const scrollToTime = useCallback(
    (time: number) => {
      const pixelPosition = time * viewState.zoomLevel;
      const centeredPosition = pixelPosition - viewState.viewportWidth / 2;
      const clampedPosition = Math.max(0, centeredPosition);
      updateViewportLeft(clampedPosition);
    },
    [viewState.zoomLevel, viewState.viewportWidth, updateViewportLeft],
  );

  const zoomToFit = useCallback(
    (totalDuration: number) => {
      if (viewState.viewportWidth > 0) {
        const newZoomLevel = (viewState.viewportWidth * 0.9) / totalDuration;
        setViewState((prev) => ({
          ...prev,
          zoomLevel: Math.max(1, Math.min(50, newZoomLevel)),
          viewportLeft: 0,
        }));
      }
    },
    [viewState.viewportWidth],
  );

  useEffect(() => {
    if (dragState.draggedScene) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.draggedScene, handleMouseMove, handleMouseUp]);

  return {
    dragState,
    viewState,
    setViewState,
    handleSceneMouseDown,
    handleLibrarySceneDragStart,
    handleTimelineDragOver,
    handleTimelineDragLeave,
    handleTimelineDrop,
    handleLibrarySceneDragEnd,
    updateViewportWidth,
    updateViewportLeft,
    scrollToTime,
    zoomToFit,
    isSceneCompatibleWithTrack,
    getValidTracksForScene,
  };
};
