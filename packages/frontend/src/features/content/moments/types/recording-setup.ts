/**
 * Recording Setup Domain Types
 * Recording configurations and camera assignments for moments
 */

import type { SceneMoment } from '@/features/content/moments/types';
import type { FilmTimelineTrack } from '@/features/content/films/types/tracks';
import type { FilmSubject } from '@/features/content/subjects/types';
import type { ShotType } from '@/features/content/coverage/types';

export interface CameraSubjectAssignment {
  id: number;
  recording_setup_id: number;
  track_id: number;
  subject_ids: number[];
  shot_type?: ShotType | null;
  created_at?: string;
  updated_at?: string;
  recording_setup?: MomentRecordingSetup;
  track?: FilmTimelineTrack;
  subjects?: FilmSubject[];
}

export interface MomentRecordingSetup {
  id: number;
  moment_id: number;
  audio_track_ids: number[];
  graphics_enabled: boolean;
  graphics_title?: string | null;
  created_at: string;
  updated_at: string;
  moment?: SceneMoment;
  camera_assignments?: CameraSubjectAssignment[];
}

export interface CreateMomentRecordingSetupDto {
  moment_id: number;
  audio_track_ids?: number[];
  graphics_enabled?: boolean;
  graphics_title?: string | null;
}

export interface UpdateMomentRecordingSetupDto {
  audio_track_ids?: number[];
  graphics_enabled?: boolean;
  graphics_title?: string | null;
}

export interface CreateCameraSubjectAssignmentDto {
  recording_setup_id: number;
  track_id: number;
  subject_ids: number[];
}

export interface UpdateCameraSubjectAssignmentDto {
  subject_ids?: number[];
}

export interface MomentRecordingSetupWithAssignments extends MomentRecordingSetup {
  camera_assignments: CameraSubjectAssignment[];
}

export interface SceneCameraAssignment {
  track_id: number;
  track_name?: string;
  track_type?: string;
  subject_ids?: number[];
  shot_type?: ShotType | null;
}

export interface SceneRecordingSetup {
  id: number;
  audio_track_ids: number[];
  graphics_enabled: boolean;
  camera_assignments: SceneCameraAssignment[];
}

export interface UpdateSceneRecordingSetupDto {
  camera_track_ids?: number[];
  audio_track_ids?: number[];
  graphics_enabled?: boolean;
}

export interface RecordingPlan {
  moment_id: number;
  moment_name: string;
  duration: number;
  setup: MomentRecordingSetup;
  cameras: {
    track_id: number;
    track_name: string;
    subjects: FilmSubject[];
  }[];
  audio_tracks: number[];
  graphics_enabled: boolean;
  graphics_title?: string | null;
}
