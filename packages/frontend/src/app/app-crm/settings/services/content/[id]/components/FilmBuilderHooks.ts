import { useState, useEffect, useCallback, useRef } from "react";
import {
    ComponentLibrary,
    TimelineComponent,
    TimelineTrack,
    DatabaseLayer,
    PlaybackState,
    DragState,
    ViewState,
    ComponentLibraryState,
} from "./FilmBuilderTypes";

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
                            track_type: layer.name.toLowerCase() as "video" | "audio" | "graphics" | "music",
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
                console.error("❌ Failed to load timeline layers:", response.statusText);
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

export const usePlaybackControls = (components: TimelineComponent[] = []) => {
    // Calculate dynamic duration based on components, with a minimum of 60 seconds (1 minute)
    const calculateTimelineDuration = (timelineComponents: TimelineComponent[]): number => {
        if (timelineComponents.length === 0) {
            return 60; // Default 1 minute when no components
        }

        // Find the component that ends latest
        const maxEndTime = Math.max(
            ...timelineComponents.map(component => component.start_time + component.duration)
        );

        // Timeline should be at least 1 minute, but expand to fit the longest component
        return Math.max(60, maxEndTime);
    };

    const [playbackState, setPlaybackState] = useState<PlaybackState>({
        isPlaying: false,
        currentTime: 0,
        totalDuration: calculateTimelineDuration(components),
        playbackSpeed: 1,
    });

    const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timelineScrollRef = useRef<{ scrollLeft: number }>({ scrollLeft: 0 });

    // Update timeline duration when components change
    useEffect(() => {
        const newDuration = calculateTimelineDuration(components);
        setPlaybackState(prev => ({
            ...prev,
            totalDuration: newDuration,
            // If current time is beyond new duration, reset to start
            currentTime: prev.currentTime > newDuration ? 0 : prev.currentTime
        }));
    }, [components]);

    const handlePlay = useCallback(() => {
        setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));

        if (!playbackState.isPlaying) {
            playbackTimerRef.current = setInterval(() => {
                setPlaybackState(prev => {
                    const newTime = prev.currentTime + (0.1 * prev.playbackSpeed);
                    if (newTime >= prev.totalDuration) {
                        return { ...prev, isPlaying: false, currentTime: prev.totalDuration };
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
        setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
        }
    };

    const handleSpeedChange = (newSpeed: number) => {
        setPlaybackState(prev => ({ ...prev, playbackSpeed: newSpeed }));
    };

    const handleTimelineClick = (time: number) => {
        setPlaybackState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.totalDuration)) }));
    };

    // Timeline viewport management for navigation without scroll bars
    const updateTimelineViewport = useCallback((viewportWidth: number, zoomLevel: number) => {
        const playheadPosition = playbackState.currentTime * zoomLevel;
        const viewportCenter = viewportWidth / 2;

        // Calculate the optimal scroll position to center the playhead
        let targetScrollLeft = playheadPosition - viewportCenter;
        targetScrollLeft = Math.max(0, targetScrollLeft);

        timelineScrollRef.current.scrollLeft = targetScrollLeft;

        return targetScrollLeft;
    }, [playbackState.currentTime]);

    const jumpToTime = useCallback((time: number) => {
        const clampedTime = Math.max(0, Math.min(time, playbackState.totalDuration));
        setPlaybackState(prev => ({ ...prev, currentTime: clampedTime }));
    }, [playbackState.totalDuration]);

    const jumpToPercentage = useCallback((percentage: number) => {
        const time = (percentage / 100) * playbackState.totalDuration;
        jumpToTime(time);
    }, [playbackState.totalDuration, jumpToTime]);

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

export const useComponentLibrary = () => {
    const [libraryState, setLibraryState] = useState<ComponentLibraryState>({
        availableComponents: [],
        loadingComponents: false,
        searchTerm: "",
        selectedCategory: "ALL",
    });

    const loadAvailableComponents = useCallback(async () => {
        try {
            setLibraryState(prev => ({ ...prev, loadingComponents: true }));
            const response = await fetch("http://localhost:3002/components");
            if (response.ok) {
                const components = await response.json();
                setLibraryState(prev => ({
                    ...prev,
                    availableComponents: components,
                    loadingComponents: false
                }));
            }
        } catch (error) {
            console.error("Failed to load components:", error);
            setLibraryState(prev => ({ ...prev, loadingComponents: false }));
        }
    }, []);

    const getFilteredComponents = useCallback(() => {
        return libraryState.availableComponents.filter((component) => {
            const matchesSearch = component.name.toLowerCase().includes(libraryState.searchTerm.toLowerCase()) ||
                (component.description?.toLowerCase().includes(libraryState.searchTerm.toLowerCase()) ?? false);
            const matchesCategory = libraryState.selectedCategory === "ALL" || component.type === libraryState.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [libraryState.availableComponents, libraryState.searchTerm, libraryState.selectedCategory]);

    const updateSearchTerm = useCallback((searchTerm: string) => {
        setLibraryState(prev => ({ ...prev, searchTerm }));
    }, []);

    const updateSelectedCategory = useCallback((selectedCategory: string) => {
        setLibraryState(prev => ({ ...prev, selectedCategory }));
    }, []);

    return {
        libraryState,
        loadAvailableComponents,
        getFilteredComponents,
        updateSearchTerm,
        updateSelectedCategory,
    };
};

export const useDragAndDrop = (
    components: TimelineComponent[],
    setComponents: React.Dispatch<React.SetStateAction<TimelineComponent[]>>,
    tracks: TimelineTrack[],
    timelineRef?: React.RefObject<HTMLDivElement>
) => {
    const [dragState, setDragState] = useState<DragState>({
        draggedComponent: null,
        draggedLibraryComponent: null,
        dragOffset: { x: 0, y: 0 },
        isDragActive: false,
    });

    const [viewState, setViewState] = useState<ViewState>({
        zoomLevel: 10, // pixels per second
        snapToGrid: true,
        gridSize: 5, // 5-second snap grid
        selectedComponent: null,
        viewportLeft: 0, // timeline scroll position
        viewportWidth: 800, // default viewport width
    });

    const handleComponentMouseDown = (
        e: React.MouseEvent,
        component: TimelineComponent
    ) => {
        if (e.button !== 0) return; // Only handle left mouse button

        e.preventDefault();
        e.stopPropagation();

        const timelineRect = timelineRef?.current?.getBoundingClientRect();
        if (!timelineRect) return;

        const offsetX = e.clientX - (timelineRect.left + component.start_time * viewState.zoomLevel);
        const offsetY = e.clientY - timelineRect.top;

        setDragState({
            draggedComponent: component,
            draggedLibraryComponent: null,
            dragOffset: { x: offsetX, y: offsetY },
            isDragActive: true,
        });
        setViewState(prev => ({ ...prev, selectedComponent: component }));
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragState.draggedComponent) return;

            const timelineRect = timelineRef?.current?.getBoundingClientRect();
            if (!timelineRect) return;

            const mouseX = e.clientX - timelineRect.left - dragState.dragOffset.x;
            const mouseY = e.clientY - timelineRect.top - dragState.dragOffset.y;

            let newStartTime = mouseX / viewState.zoomLevel;
            if (viewState.snapToGrid) {
                newStartTime = Math.round(newStartTime / viewState.gridSize) * viewState.gridSize;
            }
            newStartTime = Math.max(0, newStartTime);

            // Find target track based on mouse Y position
            let targetTrackId = dragState.draggedComponent.track_id;

            // Calculate track index based on mouse Y position
            // Account for track layout: video/graphics tracks first, then audio tracks with separator
            const videoTracks = tracks.filter(t => t.track_type === "video" || t.track_type === "graphics");
            const audioTracks = tracks.filter(t => t.track_type === "audio" || t.track_type === "music");

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
                const componentType = dragState.draggedComponent.database_type || dragState.draggedComponent.component_type.toUpperCase();
                // Only allow track change if component type is compatible with target track
                if (isComponentCompatibleWithTrack(componentType, targetTrack.track_type)) {
                    targetTrackId = targetTrack.id;
                }
                // If not compatible, keep the current track
            }

            // Check for collisions using current components state
            setComponents((prevComponents) => {
                const hasCollision = prevComponents.some((comp) => {
                    if (comp.id === dragState.draggedComponent!.id) return false;
                    if (comp.track_id !== targetTrackId) return false;

                    const compEnd = comp.start_time + comp.duration;
                    const draggedEnd = newStartTime + dragState.draggedComponent!.duration;

                    return !(newStartTime >= compEnd || draggedEnd <= comp.start_time);
                });

                if (!hasCollision) {
                    return prevComponents.map((comp) =>
                        comp.id === dragState.draggedComponent!.id
                            ? { ...comp, start_time: newStartTime, track_id: targetTrackId }
                            : comp
                    );
                }
                return prevComponents; // No change if collision detected
            });
        },
        [dragState.draggedComponent, dragState.dragOffset, viewState.zoomLevel, viewState.snapToGrid, viewState.gridSize, tracks, setComponents]
    );

    const handleMouseUp = useCallback(() => {
        setDragState(prev => ({ ...prev, draggedComponent: null, isDragActive: false }));
    }, []);

    // Helper function to check if a component type is compatible with a track type
    const isComponentCompatibleWithTrack = (componentType: string, trackType: string): boolean => {
        const compatibilityMap: Record<string, string[]> = {
            "GRAPHICS": ["graphics"],
            "VIDEO": ["video"],
            "AUDIO": ["audio"],
            "MUSIC": ["music"],
        };
        return compatibilityMap[componentType]?.includes(trackType) ?? false;
    };

    // Helper function to get valid track for a component type
    const getValidTracksForComponent = (componentType: string): TimelineTrack[] => {
        return tracks.filter(track => isComponentCompatibleWithTrack(componentType, track.track_type));
    };

    const handleLibraryComponentDragStart = (e: React.DragEvent, component: ComponentLibrary) => {
        e.dataTransfer.setData('application/json', JSON.stringify(component));
        setDragState(prev => ({ ...prev, draggedLibraryComponent: component }));
    };

    const handleTimelineDragOver = (e: React.DragEvent) => {
        e.preventDefault();

        if (!dragState.draggedLibraryComponent) return;

        // Calculate which track the mouse is over
        const timelineRect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - timelineRect.top;
        const trackHeight = 60; // 40px track + 20px gap for audio tracks
        let trackIndex = Math.floor(mouseY / trackHeight);

        // Adjust for audio track spacing
        const videoTracks = tracks.filter(t => t.track_type === "video" || t.track_type === "graphics");
        if (trackIndex >= videoTracks.length) {
            // Mouse is in the audio section - adjust for the separator gap
            const adjustedY = mouseY - (videoTracks.length * 40 + 24);
            const audioTrackIndex = Math.floor(adjustedY / 40);
            trackIndex = videoTracks.length + audioTrackIndex;
        }

        const targetTrack = tracks[trackIndex];
        const isValidDrop = targetTrack && isComponentCompatibleWithTrack(
            dragState.draggedLibraryComponent.type,
            targetTrack.track_type
        );

        e.dataTransfer.dropEffect = isValidDrop ? 'copy' : 'none';
    };

    const handleTimelineDragLeave = () => {
        // Remove any visual feedback when leaving the timeline
    };

    const handleTimelineDrop = async (e: React.DragEvent) => {
        e.preventDefault();

        try {
            const componentData = JSON.parse(e.dataTransfer.getData('application/json')) as ComponentLibrary;

            const timelineRect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - timelineRect.left;
            const mouseY = e.clientY - timelineRect.top;

            let dropTime = mouseX / viewState.zoomLevel;
            if (viewState.snapToGrid) {
                dropTime = Math.round(dropTime / viewState.gridSize) * viewState.gridSize;
            }
            dropTime = Math.max(0, dropTime);

            // Determine target track based on drop position with proper spacing calculation
            const trackHeight = 60; // 40px track + 20px gap for audio tracks
            let trackIndex = Math.floor(mouseY / trackHeight);

            // Adjust for audio track spacing
            const videoTracks = tracks.filter(t => t.track_type === "video" || t.track_type === "graphics");
            if (trackIndex >= videoTracks.length) {
                // Mouse is in the audio section - adjust for the separator gap
                const adjustedY = mouseY - (videoTracks.length * 40 + 24);
                const audioTrackIndex = Math.floor(adjustedY / 40);
                trackIndex = videoTracks.length + audioTrackIndex;
            }

            const targetTrack = tracks[trackIndex];

            // Validate track exists and component type is compatible
            if (!targetTrack) {
                console.warn("No valid track found at drop position");
                return;
            }

            if (!isComponentCompatibleWithTrack(componentData.type, targetTrack.track_type)) {
                console.warn(`Component type ${componentData.type} is not compatible with track type ${targetTrack.track_type}`);
                return;
            }

            // Get default duration from component or use 30 seconds
            const defaultDuration = componentData.estimated_duration || 30;

            // Map component type to track type for timeline component
            const componentTypeMapping: Record<string, "video" | "audio" | "graphics" | "music"> = {
                VIDEO: "video",
                AUDIO: "audio",
                GRAPHICS: "graphics",
                MUSIC: "music",
            };

            const componentType = componentTypeMapping[componentData.type];

            // Create new timeline component
            const newComponent: TimelineComponent = {
                id: Date.now() + Math.random(), // Temporary ID
                name: componentData.name,
                start_time: dropTime,
                duration: defaultDuration,
                track_id: targetTrack.id,
                component_type: componentType,
                color: targetTrack.color,
                description: componentData.description,
                database_type: componentData.type,
            };

            // Check for collisions before adding
            const hasCollision = components.some((comp) => {
                if (comp.track_id !== newComponent.track_id) return false;
                const compEnd = comp.start_time + comp.duration;
                const newEnd = newComponent.start_time + newComponent.duration;
                return !(newComponent.start_time >= compEnd || newEnd <= comp.start_time);
            });

            if (!hasCollision) {
                setComponents(prev => [...prev, newComponent]);

                // Component added successfully - no additional task handling needed for now
                console.log("Component added to timeline:", componentData.id);
            } else {
                console.warn("Cannot drop component: collision detected");
            }
        } catch (error) {
            console.error("Error handling drop:", error);
        }

        setDragState(prev => ({ ...prev, draggedLibraryComponent: null }));
    };

    const handleLibraryComponentDragEnd = () => {
        setDragState(prev => ({ ...prev, draggedLibraryComponent: null }));
    };

    // Viewport management functions for timeline navigation
    const updateViewportWidth = useCallback((width: number) => {
        setViewState(prev => ({ ...prev, viewportWidth: width }));
    }, []);

    const updateViewportLeft = useCallback((left: number) => {
        setViewState(prev => ({ ...prev, viewportLeft: left }));
    }, []);

    const scrollToTime = useCallback((time: number) => {
        const pixelPosition = time * viewState.zoomLevel;
        const centeredPosition = pixelPosition - (viewState.viewportWidth / 2);
        const clampedPosition = Math.max(0, centeredPosition);
        updateViewportLeft(clampedPosition);
    }, [viewState.zoomLevel, viewState.viewportWidth, updateViewportLeft]);

    const zoomToFit = useCallback((totalDuration: number) => {
        if (viewState.viewportWidth > 0) {
            const newZoomLevel = (viewState.viewportWidth * 0.9) / totalDuration;
            setViewState(prev => ({
                ...prev,
                zoomLevel: Math.max(1, Math.min(50, newZoomLevel)),
                viewportLeft: 0
            }));
        }
    }, [viewState.viewportWidth]);
    useEffect(() => {
        if (dragState.draggedComponent) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.draggedComponent, handleMouseMove, handleMouseUp]);

    return {
        dragState,
        viewState,
        setViewState,
        handleComponentMouseDown,
        handleLibraryComponentDragStart,
        handleTimelineDragOver,
        handleTimelineDragLeave,
        handleTimelineDrop,
        handleLibraryComponentDragEnd,
        updateViewportWidth,
        updateViewportLeft,
        scrollToTime,
        zoomToFit,
        isComponentCompatibleWithTrack,
        getValidTracksForComponent,
    };
};
