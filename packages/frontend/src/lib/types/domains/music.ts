/**
 * Music Domain Types (Refactor v2)
 * Scene and moment music assignments
 */

/**
 * MusicType Enum - Types of music styles
 */
export enum MusicType {
  NONE = 'NONE',
  SCENE_MATCHED = 'SCENE_MATCHED',
  ORCHESTRAL = 'ORCHESTRAL',
  PIANO = 'PIANO',
  MODERN = 'MODERN',
  VINTAGE = 'VINTAGE',
  CLASSICAL = 'CLASSICAL',
  JAZZ = 'JAZZ',
  ACOUSTIC = 'ACOUSTIC',
  ELECTRONIC = 'ELECTRONIC',
  CUSTOM = 'CUSTOM',
}

/**
 * SceneMusic - Music assigned to a scene
 * Applies to all moments in the scene unless overridden by MomentMusic
 */
export interface SceneMusic {
  id: number;
  film_scene_id: number;
  music_name: string;
  artist?: string;
  duration?: number; // in seconds
  music_type: MusicType;
  created_at: string;
  updated_at: string;

  // Relationships
  film_scene?: {
    id: number;
    name: string;
  };
}

/**
 * MomentMusic - Music assigned to a specific moment
 * Can override scene music for a particular moment
 */
export interface MomentMusic {
  id: number;
  moment_id: number;
  music_name: string;
  artist?: string;
  duration?: number; // in seconds
  music_type: MusicType;
  overrides_scene_music: boolean;
  created_at: string;
  updated_at: string;

  // Relationships
  moment?: {
    id: number;
    name: string;
  };
}

/**
 * CreateSceneMusicDto - Request payload for creating scene music
 */
export interface CreateSceneMusicDto {
  film_scene_id: number;
  music_name: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
}

/**
 * UpdateSceneMusicDto - Request payload for updating scene music
 */
export interface UpdateSceneMusicDto {
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
}

/**
 * CreateMomentMusicDto - Request payload for creating moment music
 */
export interface CreateMomentMusicDto {
  moment_id: number;
  music_name: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
  overrides_scene_music?: boolean;
}

/**
 * UpdateMomentMusicDto - Request payload for updating moment music
 */
export interface UpdateMomentMusicDto {
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
  overrides_scene_music?: boolean;
}

/**
 * Music Type Display Names
 */
export const MUSIC_TYPE_LABELS: Record<MusicType, string> = {
  [MusicType.NONE]: 'None',
  [MusicType.SCENE_MATCHED]: 'Scene Matched',
  [MusicType.ORCHESTRAL]: 'Orchestral',
  [MusicType.PIANO]: 'Piano',
  [MusicType.MODERN]: 'Modern',
  [MusicType.VINTAGE]: 'Vintage',
  [MusicType.CLASSICAL]: 'Classical',
  [MusicType.JAZZ]: 'Jazz',
  [MusicType.ACOUSTIC]: 'Acoustic',
  [MusicType.ELECTRONIC]: 'Electronic',
  [MusicType.CUSTOM]: 'Custom',
};

/**
 * Get color for music type
 */
export const getMusicTypeColor = (type: MusicType): string => {
  const colors: Record<MusicType, string> = {
    [MusicType.NONE]: '#6B7280', // Gray
    [MusicType.SCENE_MATCHED]: '#8B5CF6', // Purple
    [MusicType.ORCHESTRAL]: '#DC2626', // Red
    [MusicType.PIANO]: '#F59E0B', // Amber
    [MusicType.MODERN]: '#3B82F6', // Blue
    [MusicType.VINTAGE]: '#10B981', // Green
    [MusicType.CLASSICAL]: '#7C3AED', // Violet
    [MusicType.JAZZ]: '#EC4899', // Pink
    [MusicType.ACOUSTIC]: '#84CC16', // Lime
    [MusicType.ELECTRONIC]: '#06B6D4', // Cyan
    [MusicType.CUSTOM]: '#D946EF', // Fuchsia
  };
  return colors[type];
};
