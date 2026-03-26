/**
 * Recording Setup Domain Types (Refactor v2)
 * Recording configurations and camera assignments for moments
 */

import type { SceneMoment } from './moments';
import type { FilmTimelineTrack } from './equipment';
import type { FilmSubject } from './subjects';
import type { ShotType } from '@/features/content/coverage/types';

/**
 * CameraSubjectAssignment - Links a camera/track to subjects for a moment
 * Specifies which subjects should be filmed on which camera/track
 */
export interface CameraSubjectAssignment {
  id: number;
  recording_setup_id: number;
  track_id: number;
  subject_ids: number[];
  shot_type?: ShotType | null;
  created_at?: string;
  updated_at?: string;

  // Relationships
  recording_setup?: MomentRecordingSetup;
  track?: FilmTimelineTrack;
  subjects?: FilmSubject[];
}

/**
 * MomentRecordingSetup - Recording configuration for a specific moment
 * Defines which cameras record which subjects and audio track settings
 */
export interface MomentRecordingSetup {
  id: number;
  moment_id: number;
  audio_track_ids: number[];
  graphics_enabled: boolean;
  graphics_title?: string | null;
  created_at: string;
  updated_at: string;

  // Relationships
  moment?: SceneMoment;
  camera_assignments?: CameraSubjectAssignment[];
}

/**
 * CreateMomentRecordingSetupDto - Request payload for creating recording setup
 */
export interface CreateMomentRecordingSetupDto {
  moment_id: number;
  audio_track_ids?: number[];
  graphics_enabled?: boolean;
  graphics_title?: string | null;
}

/**
 * UpdateMomentRecordingSetupDto - Request payload for updating recording setup
 */
export interface UpdateMomentRecordingSetupDto {
  audio_track_ids?: number[];
  graphics_enabled?: boolean;
  graphics_title?: string | null;
}

/**
 * CreateCameraSubjectAssignmentDto - Request payload for assigning camera to subjects
 */
export interface CreateCameraSubjectAssignmentDto {
  recording_setup_id: number;
  track_id: number;
  subject_ids: number[];
}

/**
 * UpdateCameraSubjectAssignmentDto - Request payload for updating assignment
 */
export interface UpdateCameraSubjectAssignmentDto {
  subject_ids?: number[];
}

/**
 * MomentRecordingSetupWithAssignments - Recording setup with full camera assignments
 */
export interface MomentRecordingSetupWithAssignments extends MomentRecordingSetup {
  camera_assignments: CameraSubjectAssignment[];
}

/**
 * SceneCameraAssignment - Links a track to a scene recording setup
 */
export interface SceneCameraAssignment {
  track_id: number;
  track_name?: string;
  track_type?: string;
  subject_ids?: number[];
  shot_type?: ShotType | null;
}

/**
 * SceneRecordingSetup - Recording configuration for a scene
 * Used as default for moments unless overridden
 */
export interface SceneRecordingSetup {
  id: number;
  audio_track_ids: number[];
  graphics_enabled: boolean;
  camera_assignments: SceneCameraAssignment[];
}

/**
 * UpdateSceneRecordingSetupDto - Request payload for updating scene recording setup
 */
export interface UpdateSceneRecordingSetupDto {
  camera_track_ids?: number[];
  audio_track_ids?: number[];
  graphics_enabled?: boolean;
}

/**
 * RecordingPlan - Complete recording plan for a moment
 * Shows which cameras are recording which subjects
 */
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
