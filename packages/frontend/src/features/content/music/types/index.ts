/**
 * Music Domain Types
 * Scene and moment music assignments
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

export interface SceneMusic {
  id: number;
  film_scene_id: number;
  music_name: string;
  artist?: string;
  duration?: number;
  music_type: MusicType;
  created_at: string;
  updated_at: string;
  film_scene?: {
    id: number;
    name: string;
  };
}

export interface MomentMusic {
  id: number;
  moment_id: number;
  music_name: string;
  artist?: string;
  duration?: number;
  music_type: MusicType;
  overrides_scene_music: boolean;
  created_at: string;
  updated_at: string;
  moment?: {
    id: number;
    name: string;
  };
}

export interface CreateSceneMusicDto {
  film_scene_id: number;
  music_name: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
}

export interface UpdateSceneMusicDto {
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
}

export interface CreateMomentMusicDto {
  moment_id: number;
  music_name: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
  overrides_scene_music?: boolean;
}

export interface UpdateMomentMusicDto {
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
  overrides_scene_music?: boolean;
}

export interface MusicLibraryItem {
  id: number;
  assignment_number?: string;
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type: MusicType;
  file_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  project_id?: number;
  brand_id?: number;
  scene_id?: number;
  moment_id?: number;
  moment_name?: string;
  scene_name?: string;
}

export interface CreateMusicLibraryItemDto {
  assignment_number?: string;
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type: MusicType;
  file_path?: string;
  notes?: string;
  project_id?: number;
  brand_id?: number;
  scene_id?: number;
}

export interface UpdateMusicLibraryItemDto {
  assignment_number?: string;
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type?: MusicType;
  file_path?: string;
  notes?: string;
  project_id?: number;
  brand_id?: number;
  scene_id?: number;
}

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

export const getMusicTypeColor = (type: MusicType): string => {
  const colors: Record<MusicType, string> = {
    [MusicType.NONE]: '#6B7280',
    [MusicType.SCENE_MATCHED]: '#8B5CF6',
    [MusicType.ORCHESTRAL]: '#DC2626',
    [MusicType.PIANO]: '#F59E0B',
    [MusicType.MODERN]: '#3B82F6',
    [MusicType.VINTAGE]: '#10B981',
    [MusicType.CLASSICAL]: '#7C3AED',
    [MusicType.JAZZ]: '#EC4899',
    [MusicType.ACOUSTIC]: '#84CC16',
    [MusicType.ELECTRONIC]: '#06B6D4',
    [MusicType.CUSTOM]: '#D946EF',
  };
  return colors[type];
};
