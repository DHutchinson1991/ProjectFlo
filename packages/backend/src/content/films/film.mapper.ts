import { Injectable } from '@nestjs/common';
import { SceneType } from '@prisma/client';
import { FilmResponseDto } from './dto/film-response.dto';

type LocationShape = {
  id: number;
  name: string;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

type MontagePresetInput = {
  id: number;
  name: string;
  min_duration_seconds: number;
  max_duration_seconds: number;
};

type LocationAssignmentInput = {
  id: number;
  film_id: number;
  location_id: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  location: LocationShape;
};

type FilmTrackInput = {
  id: number;
  film_id: number;
  name: string;
  type: FilmResponseDto['tracks'][number]['type'];
  order_index: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

type FilmSubjectInput = {
  id: number;
  film_id: number;
  name: string;
  role_template_id?: number | null;
  created_at: Date;
  updated_at: Date;
};

type TrackRef = { name?: string; type?: unknown };

type CameraAssignmentInput = {
  track_id: number;
  track?: TrackRef | null;
  subject_ids?: number[];
  shot_type?: string | null;
};

type RecordingSetupInput = {
  id: number;
  audio_track_ids: number[];
  graphics_enabled: boolean;
  graphics_title?: string | null;
  camera_assignments: CameraAssignmentInput[];
};

type SceneAudioSourceInput = {
  id: number;
  scene_id: number;
  source_type: string;
  source_activity_id: number | null;
  source_moment_id: number | null;
  source_scene_id: number | null;
  track_type: string;
  start_offset_seconds: number | null;
  duration_seconds: number | null;
  order_index: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

type SubjectRoleTemplateInput = {
  id: number;
  role_name: string;
  description: string | null;
  is_core: boolean;
};

type MomentSubjectAssignmentInput = {
  id: number;
  moment_id: number;
  subject_id: number;
  priority: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  subject?: ({ role_template?: SubjectRoleTemplateInput | null } & Record<string, unknown>) | null;
};

type MomentMusicInput = {
  id: number;
  moment_id: number;
  music_name: string;
  artist: string | null;
  duration: number | null;
  music_type: string;
  overrides_scene_music: boolean;
  created_at: Date;
  updated_at: Date;
};

type MomentInput = {
  id: number;
  film_scene_id: number;
  name: string;
  order_index: number;
  duration: number;
  created_at: Date;
  updated_at: Date;
  subjects?: MomentSubjectAssignmentInput[];
  recording_setup?: RecordingSetupInput | null;
  moment_music?: MomentMusicInput | null;
};

type BeatInput = {
  id: number;
  film_scene_id: number;
  name: string;
  order_index: number;
  shot_count: number | null;
  duration_seconds: number;
  source_activity_id: number | null;
  source_moment_id: number | null;
  source_scene_id: number | null;
  recording_setup?: {
    id: number;
    camera_track_ids: number[];
    audio_track_ids: number[];
    graphics_enabled: boolean;
    created_at: Date;
    updated_at: Date;
  } | null;
  created_at: Date;
  updated_at: Date;
};

type SceneInput = {
  id: number;
  film_id: number;
  scene_template_id: number | null;
  name: string;
  mode: SceneType;
  shot_count: number | null;
  duration_seconds: number | null;
  order_index: number;
  created_at: Date;
  updated_at: Date;
  location_assignment?: {
    id: number;
    scene_id: number;
    location_id: number;
    created_at: Date;
    updated_at: Date;
    location: LocationShape;
  } | null;
  moments?: MomentInput[];
  beats?: BeatInput[];
  recording_setup?: RecordingSetupInput | null;
  scene_music?: {
    id: number;
    film_scene_id: number;
    music_name: string;
    artist: string | null;
    duration: number | null;
    music_type: string;
    created_at: Date;
    updated_at: Date;
  } | null;
  audio_sources?: SceneAudioSourceInput[];
};

type FilmInput = {
  id: number;
  name: string;
  brand_id: number;
  film_type?: string | null;
  montage_preset_id?: number | null;
  target_duration_min?: number | null;
  target_duration_max?: number | null;
  created_at: Date;
  updated_at: Date;
  montage_preset?: MontagePresetInput | null;
  tracks?: FilmTrackInput[];
  subjects?: FilmSubjectInput[];
  locations?: LocationAssignmentInput[];
  scenes?: SceneInput[];
};

/**
 * Maps Prisma film query results to FilmResponseDto.
 * Extracted from FilmsService to keep the service within size limits.
 */
@Injectable()
export class FilmMapper {
  toResponseDto(film: FilmInput): FilmResponseDto {
    return {
      id: film.id,
      name: film.name,
      brand_id: film.brand_id,
      film_type: film.film_type ?? 'FEATURE',
      montage_preset_id: film.montage_preset_id ?? null,
      target_duration_min: film.target_duration_min ?? null,
      target_duration_max: film.target_duration_max ?? null,
      created_at: film.created_at,
      updated_at: film.updated_at,
      montage_preset: film.montage_preset
        ? {
            id: film.montage_preset.id,
            name: film.montage_preset.name,
            min_duration_seconds: film.montage_preset.min_duration_seconds,
            max_duration_seconds: film.montage_preset.max_duration_seconds,
          }
        : null,
      tracks: (film.tracks || []).map((track) => ({
        id: track.id,
        film_id: track.film_id,
        name: track.name,
        type: track.type,
        order_index: track.order_index,
        is_active: track.is_active,
        created_at: track.created_at,
        updated_at: track.updated_at,
      })),
      subjects: (film.subjects || []).map((subject) => ({
        id: subject.id,
        film_id: subject.film_id,
        name: subject.name,
        role_template_id: subject.role_template_id ?? null,
        created_at: subject.created_at,
        updated_at: subject.updated_at,
      })),
      locations: (film.locations || []).map((assignment) => ({
        id: assignment.id,
        film_id: assignment.film_id,
        location_id: assignment.location_id,
        notes: assignment.notes ?? null,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        location: assignment.location,
      })),
      scenes: (film.scenes || []).map((scene) => this.mapScene(scene)),
    };
  }

  private mapScene(scene: SceneInput) {
    return {
      id: scene.id,
      film_id: scene.film_id,
      scene_template_id: scene.scene_template_id,
      name: scene.name,
      mode: scene.mode,
      shot_count: scene.shot_count ?? null,
      duration_seconds: scene.duration_seconds ?? null,
      order_index: scene.order_index,
      created_at: scene.created_at,
      updated_at: scene.updated_at,
      location_assignment: scene.location_assignment
        ? {
            id: scene.location_assignment.id,
            scene_id: scene.location_assignment.scene_id,
            location_id: scene.location_assignment.location_id,
            created_at: scene.location_assignment.created_at,
            updated_at: scene.location_assignment.updated_at,
            location: scene.location_assignment.location,
          }
        : null,
      moments: (scene.moments || []).map((moment) => this.mapMoment(moment)),
      beats: (scene.beats || []).map((beat) => this.mapBeat(beat)),
      recording_setup: scene.recording_setup
        ? {
            id: scene.recording_setup.id,
            audio_track_ids: scene.recording_setup.audio_track_ids,
            graphics_enabled: scene.recording_setup.graphics_enabled,
            camera_assignments: scene.recording_setup.camera_assignments.map((a) => ({
              track_id: a.track_id,
              track_name: a.track?.name || String(a.track_id),
              track_type: a.track?.type ? String(a.track.type) : undefined,
              subject_ids: a.subject_ids ?? [],
            })),
          }
        : null,
      scene_music: scene.scene_music
        ? {
            id: scene.scene_music.id,
            film_scene_id: scene.scene_music.film_scene_id,
            music_name: scene.scene_music.music_name,
            artist: scene.scene_music.artist,
            duration: scene.scene_music.duration,
            music_type: scene.scene_music.music_type,
            created_at: scene.scene_music.created_at,
            updated_at: scene.scene_music.updated_at,
          }
        : null,
      audio_sources: (scene.audio_sources || []).map((src) => ({
        id: src.id,
        scene_id: src.scene_id,
        source_type: src.source_type,
        source_activity_id: src.source_activity_id,
        source_moment_id: src.source_moment_id,
        source_scene_id: src.source_scene_id,
        track_type: src.track_type,
        start_offset_seconds: src.start_offset_seconds,
        duration_seconds: src.duration_seconds,
        order_index: src.order_index,
        notes: src.notes,
        created_at: src.created_at,
        updated_at: src.updated_at,
      })),
    };
  }

  private mapMoment(moment: MomentInput) {
    return {
      id: moment.id,
      film_scene_id: moment.film_scene_id,
      name: moment.name,
      order_index: moment.order_index,
      duration: moment.duration,
      created_at: moment.created_at,
      updated_at: moment.updated_at,
      subjects: moment.subjects
        ? moment.subjects.map((assignment) => ({
            id: assignment.id,
            moment_id: assignment.moment_id,
            subject_id: assignment.subject_id,
            priority: assignment.priority,
            notes: assignment.notes ?? null,
            created_at: assignment.created_at,
            updated_at: assignment.updated_at,
            subject: assignment.subject
              ? {
                  ...assignment.subject,
                  role: assignment.subject.role_template
                    ? {
                        id: assignment.subject.role_template.id,
                        role_name: assignment.subject.role_template.role_name,
                        description: assignment.subject.role_template.description,
                        is_core: assignment.subject.role_template.is_core,
                      }
                    : null,
                }
              : null,
          }))
        : [],
      has_recording_setup: !!moment.recording_setup,
      recording_setup: moment.recording_setup
        ? {
            id: moment.recording_setup.id,
            audio_track_ids: moment.recording_setup.audio_track_ids,
            graphics_enabled: moment.recording_setup.graphics_enabled,
            graphics_title: moment.recording_setup.graphics_title ?? null,
            camera_assignments: moment.recording_setup.camera_assignments.map((a) => ({
              track_id: a.track_id,
              track_name: a.track?.name || String(a.track_id),
              track_type: a.track?.type ? String(a.track.type) : undefined,
              subject_ids: a.subject_ids ?? [],
              shot_type: a.shot_type ?? undefined,
            })),
          }
        : null,
      moment_music: moment.moment_music
        ? {
            id: moment.moment_music.id,
            moment_id: moment.moment_music.moment_id,
            music_name: moment.moment_music.music_name,
            artist: moment.moment_music.artist,
            duration: moment.moment_music.duration,
            music_type: moment.moment_music.music_type,
            overrides_scene_music: moment.moment_music.overrides_scene_music,
            created_at: moment.moment_music.created_at,
            updated_at: moment.moment_music.updated_at,
          }
        : null,
    };
  }

  private mapBeat(beat: BeatInput) {
    return {
      id: beat.id,
      film_scene_id: beat.film_scene_id,
      name: beat.name,
      order_index: beat.order_index,
      shot_count: beat.shot_count ?? null,
      duration_seconds: beat.duration_seconds,
      source_activity_id: beat.source_activity_id ?? null,
      source_moment_id: beat.source_moment_id ?? null,
      source_scene_id: beat.source_scene_id ?? null,
      recording_setup: beat.recording_setup
        ? {
            id: beat.recording_setup.id,
            camera_track_ids: beat.recording_setup.camera_track_ids,
            audio_track_ids: beat.recording_setup.audio_track_ids,
            graphics_enabled: beat.recording_setup.graphics_enabled,
            created_at: beat.recording_setup.created_at,
            updated_at: beat.recording_setup.updated_at,
          }
        : null,
      created_at: beat.created_at,
      updated_at: beat.updated_at,
    };
  }
}
