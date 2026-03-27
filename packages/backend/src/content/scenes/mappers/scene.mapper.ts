import { FilmScene } from '@prisma/client';
import {
    SceneResponseDto,
    BeatSummary,
    RecordingSetupSummary,
    CameraAssignmentSummary,
    SceneMusicSummary,
} from '../types/scene.types';

type TrackRef = { name?: string; type?: unknown };

type CameraAssignmentInput = {
    track_id: number;
    subject_ids?: number[];
    shot_type?: string | null;
    track?: TrackRef | null;
};

type RecordingSetupInput = {
    id: number;
    audio_track_ids: number[];
    graphics_enabled: boolean;
    graphics_title?: string | null;
    camera_assignments?: CameraAssignmentInput[];
};

type BeatInput = {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    shot_count: number | null;
    duration_seconds: number;
    created_at: Date;
    updated_at: Date;
    recording_setup?: {
        id: number;
        camera_track_ids: number[];
        audio_track_ids: number[];
        graphics_enabled: boolean;
        created_at: Date;
        updated_at: Date;
    } | null;
};

type SubjectRoleTemplate = {
    id: number;
    role_name: string;
    description: string | null;
    is_core: boolean;
};

type MomentSubjectInput = {
    subject?: ({ role_template?: SubjectRoleTemplate | null } & Record<string, unknown>) | null;
} & Record<string, unknown>;

type MomentInput = {
    id: number;
    name: string;
    order_index: number;
    duration: number;
    created_at: Date;
    recording_setup?: RecordingSetupInput | null;
    moment_music?: MomentMusicInput | null;
    subjects?: MomentSubjectInput[];
} & Record<string, unknown>;

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

type SceneMusicInput = {
    id: number;
    film_scene_id: number;
    music_name: string;
    artist: string | null;
    duration: number | null;
    music_type: string;
    created_at: Date;
    updated_at: Date;
};

export class SceneMapper {
    static toBase(scene: FilmScene): SceneResponseDto {
        const sceneWithMetrics = scene as FilmScene & {
            shot_count?: number | null;
            duration_seconds?: number | null;
        };
        return {
            id: scene.id,
            film_id: scene.film_id,
            name: scene.name,
            mode: scene.mode,
            scene_template_id: scene.scene_template_id,
            shot_count: sceneWithMetrics.shot_count ?? null,
            duration_seconds: sceneWithMetrics.duration_seconds ?? null,
            montage_style: scene.montage_style ?? null,
            montage_bpm: scene.montage_bpm ?? null,
            order_index: scene.order_index,
            created_at: scene.created_at,
            updated_at: scene.updated_at,
        };
    }

    static toRecordingSetupWithAssignments(rs: RecordingSetupInput | null | undefined): RecordingSetupSummary | null {
        if (!rs) return null;
        const result: RecordingSetupSummary = {
            id: rs.id,
            audio_track_ids: rs.audio_track_ids,
            graphics_enabled: rs.graphics_enabled,
        };
        if (rs.graphics_title !== undefined) {
            result.graphics_title = rs.graphics_title ?? null;
        }
        if (rs.camera_assignments) {
            result.camera_assignments = rs.camera_assignments.map(
                (a: CameraAssignmentInput): CameraAssignmentSummary => ({
                    track_id: a.track_id,
                    track_name: a.track?.name || String(a.track_id),
                    track_type: a.track?.type ? String(a.track.type) : undefined,
                    subject_ids: a.subject_ids ?? [],
                    shot_type: a.shot_type ?? null,
                }),
            );
        }
        return result;
    }

    static toBeat(b: BeatInput): BeatSummary {
        return {
            id: b.id,
            film_scene_id: b.film_scene_id,
            name: b.name,
            order_index: b.order_index,
            shot_count: b.shot_count ?? null,
            duration_seconds: b.duration_seconds,
            recording_setup: b.recording_setup
                ? {
                      id: b.recording_setup.id,
                      camera_track_ids: b.recording_setup.camera_track_ids,
                      audio_track_ids: b.recording_setup.audio_track_ids,
                      graphics_enabled: b.recording_setup.graphics_enabled,
                      created_at: b.recording_setup.created_at,
                      updated_at: b.recording_setup.updated_at,
                  }
                : null,
            created_at: b.created_at,
            updated_at: b.updated_at,
        };
    }

    static toMomentSubject(ms: MomentSubjectInput) {
        return {
            ...ms,
            subject: ms.subject
                ? {
                      ...ms.subject,
                      role: ms.subject.role_template
                          ? {
                                id: ms.subject.role_template.id,
                                role_name: ms.subject.role_template.role_name,
                                description: ms.subject.role_template.description,
                                is_core: ms.subject.role_template.is_core,
                            }
                          : null,
                  }
                : null,
        };
    }

    /** Used in findAll — spreads all moment fields then overrides relational fields. */
    static toMomentSummary(m: MomentInput) {
        return {
            ...m,
            has_recording_setup: !!m.recording_setup,
            recording_setup: SceneMapper.toRecordingSetupWithAssignments(m.recording_setup),
            subjects: m.subjects?.map((ms) => SceneMapper.toMomentSubject(ms)),
        };
    }

    /** Used in findOne — explicitly picks moment fields for a stable response shape. */
    static toMomentDetail(m: MomentInput) {
        return {
            id: m.id,
            name: m.name,
            order_index: m.order_index,
            duration: m.duration,
            created_at: m.created_at,
            has_recording_setup: !!m.recording_setup,
            recording_setup: SceneMapper.toRecordingSetupWithAssignments(m.recording_setup),
            moment_music: SceneMapper.toMomentMusic(m.moment_music),
            subjects: m.subjects?.map((ms) => SceneMapper.toMomentSubject(ms)),
        };
    }

    static toMomentMusic(music: MomentMusicInput | null | undefined) {
        if (!music) return null;
        return {
            id: music.id,
            moment_id: music.moment_id,
            music_name: music.music_name,
            artist: music.artist,
            duration: music.duration,
            music_type: music.music_type,
            overrides_scene_music: music.overrides_scene_music,
            created_at: music.created_at,
            updated_at: music.updated_at,
        };
    }

    static toSceneMusic(music: SceneMusicInput | null | undefined): SceneMusicSummary | null {
        if (!music) return null;
        return {
            id: music.id,
            film_scene_id: music.film_scene_id,
            music_name: music.music_name,
            artist: music.artist ?? '',
            duration: music.duration ?? 0,
            music_type: music.music_type,
            created_at: music.created_at,
            updated_at: music.updated_at,
        };
    }
}
