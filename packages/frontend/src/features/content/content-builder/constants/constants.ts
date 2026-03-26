/**
 * ContentBuilder Configuration Constants
 * 
 * Centralized configuration values used throughout the ContentBuilder module.
 * This ensures consistency and makes it easy to update values globally.
 */

// Timeline Configuration
export const TIMELINE_CONFIG = {
    // Zoom levels
    MIN_ZOOM_LEVEL: 0.05,
    MAX_ZOOM_LEVEL: 35,
    DEFAULT_ZOOM_LEVEL: 5,
    ZOOM_STEP: 0.5,

    // Grid and snapping
    DEFAULT_GRID_SIZE: 5, // seconds
    SNAP_GRID_ENABLED: true,

    // Viewport
    DEFAULT_VIEWPORT_WIDTH: 800,
    VIEWPORT_PADDING: 80, // padding for auto-fit calculations
    AUTO_FIT_DURATION: 600, // 10 minutes in seconds

    // Animation and interaction
    DRAG_ACTIVATION_DISTANCE: 8, // pixels
    SCROLL_SENSITIVITY: 1,

    // Visual
    TRACK_HEIGHT: 60,
    SCENE_MIN_WIDTH: 20,
    PLAYHEAD_WIDTH: 2,
} as const;

// Color Palette
export const COLORS = {
    // UI Background colors
    CONTROL_PANEL_BG: "rgba(8, 8, 12, 0.85)",
    CONTROL_PANEL_BORDER: "rgba(255, 255, 255, 0.1)",
    VIEW_CONTROL_BG: "rgba(8, 8, 12, 0.9)",

    // Text colors
    PRIMARY_TEXT: "rgba(255, 255, 255, 0.9)",
    SECONDARY_TEXT: "rgba(255, 255, 255, 0.7)",
    MUTED_TEXT: "rgba(255, 255, 255, 0.6)",

    // Interactive elements
    PRIMARY_ACCENT: "rgba(123, 97, 255, 0.9)",
    PRIMARY_ACCENT_BG: "rgba(123, 97, 255, 0.3)",
    PRIMARY_ACCENT_BORDER: "rgba(123, 97, 255, 0.5)",

    // States
    HOVER_BG: "rgba(255, 255, 255, 0.1)",
    BUTTON_BORDER: "rgba(255, 255, 255, 0.2)",

    // Scene type colors (for scene cards and timeline elements)
    SCENE_TYPES: {
        video: "#4A90E2",      // Blue
        audio: "#50C878",      // Green
        graphics: "#FF6B6B",   // Red/Pink
        music: "#FFD93D",      // Yellow
        transition: "#9B59B6", // Purple
        default: "#95A5A6",    // Gray
    },
} as const;

// Media Type Configuration
export const MEDIA_TYPES = {
    VIDEO: "video",
    AUDIO: "audio",
    GRAPHICS: "graphics",
    MUSIC: "music",
} as const;

// Track Configuration
export const TRACK_CONFIG = {
    TYPES: {
        VIDEO: "video",
        AUDIO: "audio",
        GRAPHICS: "graphics",
        MUSIC: "music",
    },

    // Track compatibility mapping
    COMPATIBILITY_MAP: {
        video: ["video", "graphics"],
        audio: ["audio", "video"],
        graphics: ["graphics", "video"],
        music: ["music", "audio"],
    },

    // Default track order
    DEFAULT_ORDER: ["video", "audio", "graphics", "music"],
} as const;

// Drag and Drop Configuration
export const DRAG_DROP_CONFIG = {
    // Drop zone sensitivity
    DROP_ZONE_THRESHOLD: 20, // pixels

    // Collision detection
    COLLISION_BUFFER: 0.1, // seconds

    // Visual feedback
    DRAG_OPACITY: 0.8,
    DROP_PREVIEW_OPACITY: 0.6,

    // Scene grouping
    GROUP_SPACING: 0.5, // seconds between grouped scenes
} as const;

// Animation Configuration
export const ANIMATION_CONFIG = {
    // Transition durations
    FAST: 150,    // ms
    MEDIUM: 250,  // ms
    SLOW: 400,    // ms

    // Easing functions
    EASE_OUT: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    EASE_IN_OUT: "cubic-bezier(0.645, 0.045, 0.355, 1)",
} as const;

// Playback Configuration
export const PLAYBACK_CONFIG = {
    // Speed options
    SPEED_OPTIONS: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    DEFAULT_SPEED: 1,

    // Update intervals
    TIME_UPDATE_INTERVAL: 100, // ms

    // Seek sensitivity
    SEEK_STEP: 1, // seconds
} as const;

// Save State Configuration
export const SAVE_CONFIG = {
    // Auto-save
    AUTO_SAVE_DELAY: 2000, // ms

    // Save indicators
    SAVE_SUCCESS_DISPLAY: 2000, // ms
    SAVE_ERROR_DISPLAY: 5000,   // ms

    // Debounce
    CHANGE_DEBOUNCE: 500, // ms
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
    // Debounce timing
    SEARCH_DEBOUNCE: 300, // ms

    // Minimum search length
    MIN_SEARCH_LENGTH: 2,

    // Results
    MAX_RESULTS: 100,
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
    // Virtual scrolling
    VIRTUAL_SCROLL_THRESHOLD: 100, // items
    VIRTUAL_ITEM_HEIGHT: 120,       // pixels

    // Throttling
    SCROLL_THROTTLE: 16,   // ms (60fps)
    RESIZE_THROTTLE: 100,  // ms

    // Memory management
    MAX_CACHED_THUMBNAILS: 50,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    SAVE_FAILED: "Failed to save timeline. Please try again.",
    LOAD_FAILED: "Failed to load scenes. Please refresh the page.",
    DRAG_FAILED: "Unable to place scene. Please try a different position.",
    PLAYBACK_FAILED: "Playback error. Please check your media files.",
    NETWORK_ERROR: "Network error. Please check your connection.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    SAVE_SUCCESS: "Timeline saved successfully!",
    LOAD_SUCCESS: "Scenes loaded successfully!",
    EXPORT_SUCCESS: "Timeline exported successfully!",
} as const;

// Type exports for the constants
export type SceneTypeColor = keyof typeof COLORS.SCENE_TYPES;
export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];
export type TrackType = typeof TRACK_CONFIG.TYPES[keyof typeof TRACK_CONFIG.TYPES];
export type PlaybackSpeed = typeof PLAYBACK_CONFIG.SPEED_OPTIONS[number];
