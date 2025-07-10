import { TimelineScene } from './sceneTypes';

export interface TimelineTrack {
    id: number;
    name: string;
    track_type: "video" | "audio" | "graphics" | "music";
    height: number;
    visible: boolean;
    muted?: boolean;
    color: string;
    order_index: number;
}

export interface DatabaseLayer {
    id: number;
    name: string;
    order_index: number;
    color_hex: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    totalDuration: number;
    playbackSpeed: number;
}
