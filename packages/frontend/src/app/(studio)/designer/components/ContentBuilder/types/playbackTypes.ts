import { TimelineScene, SceneMediaComponent } from "./sceneTypes";
import { TimelineTrack } from "./timelineTypes";

/**
 * Props for the PlaybackScreen component
 */
export interface PlaybackScreenProps {
    /** Current scene being displayed at the current time (contains multiple media components) */
    currentScene?: TimelineScene | null;
    /** Total duration of the timeline */
    totalDuration: number;
    /** Current playback time in seconds */
    currentTime: number;
    /** Whether the component is in read-only mode */
    readOnly?: boolean;
    /** Optional CSS class name */
    className?: string;
    /** Timeline tracks for track information */
    tracks?: TimelineTrack[];
}

/**
 * Data structure for current scene information
 */
export interface CurrentSceneInfo {
    /** The scene object */
    scene: TimelineScene | null;
    /** Media components associated with this scene */
    mediaComponents: SceneMediaComponent[];
    /** Scene position information */
    position: {
        startTime: number;
        endTime: number;
        duration: number;
        trackName?: string;
    };
    /** Scene metadata */
    metadata: {
        name: string;
        description?: string;
        category?: string;
        complexity?: number;
        tags?: string[];
    };
}

/**
 * Data structure for playback screen display
 */
export interface PlaybackScreenData {
    // Scene identity
    sceneName: string;
    sceneId: number;
    sceneDescription: string;

    // Media information
    mediaCount: number;
    mediaTypes: string[];
    mediaDetails: {
        id: number;
        mediaType?: string;
        fileName: string;
        duration: number;
        trackName?: string;
        trackType?: string;
        isPrimary?: boolean;
    }[];

    // Timing information
    sceneStartTime: number;
    sceneEndTime: number;
    sceneDuration: number;
    currentTime: number;
    progress: number;

    // Status
    isActive: boolean;
    isPlaying: boolean;

    // Formatted strings
    formattedStartTime: string;
    formattedEndTime: string;
    formattedDuration: string;
    formattedCurrentTime: string;
    formattedProgress: string;
}

/**
 * Playback screen view state
 */
export interface PlaybackScreenState {
    /** Current playback data */
    playbackData: PlaybackScreenData | null;
    /** Whether there's an active scene */
    hasActiveScene: boolean;
    /** Whether the screen is empty */
    isEmpty: boolean;
}
