/**
 * Domain Types Index
 * Central export point for all domain model types
 */

// Film & Timeline
export type { Film, CreateFilmDto, UpdateFilmDto, FilmResponse } from './film';
export type { TimelineLayer, CreateTimelineLayerDto, UpdateTimelineLayerDto } from './film';

// Equipment & Tracks
export type { FilmTimelineTrack, CreateFilmTimelineTrackDto, UpdateFilmTimelineTrackDto } from './equipment';
export { TrackType, TRACK_TYPE_LABELS, getTrackTypeColor } from './equipment';

// Subjects
export type { SubjectTemplate, FilmSubject, CreateFilmSubjectDto, UpdateFilmSubjectDto, SceneSubjectAssignment } from './subjects';
export { SubjectCategory, SUBJECT_CATEGORY_LABELS, getSubjectCategoryIcon, SubjectPriority } from './subjects';

// Scenes
export type { SceneTemplate, FilmScene, CreateFilmSceneDto, UpdateFilmSceneDto, FilmSceneWithMoments } from './scenes';
export { SceneType, SCENE_TYPE_LABELS, getSceneTypeEmoji } from './scenes';

// Moments
export type { SceneMoment, CreateSceneMomentDto, UpdateSceneMomentDto, SceneMomentTemplate, SceneMomentWithSetup, SceneMomentWithMusic } from './moments';

// Beats
export type { SceneBeat, CreateSceneBeatDto, UpdateSceneBeatDto } from './beats';

// Music
export type { SceneMusic, MomentMusic, CreateSceneMusicDto, UpdateSceneMusicDto, CreateMomentMusicDto, UpdateMomentMusicDto } from './music';
export { MusicType, MUSIC_TYPE_LABELS, getMusicTypeColor } from './music';

// Recording Setup
export type { CameraSubjectAssignment, MomentRecordingSetup, CreateMomentRecordingSetupDto, UpdateMomentRecordingSetupDto, CreateCameraSubjectAssignmentDto, UpdateCameraSubjectAssignmentDto, MomentRecordingSetupWithAssignments, RecordingPlan } from './recording-setup';

// Crew
export type { CrewMember, CrewWorkloadSummary, PackageCrewSlot, AddCrewSlotDto, UpdateCrewSlotDto, SetCrewStatusDto, UpdateCrewProfileDto } from './crew';
export { getCrewMemberName, getCrewInitials, getSlotColor, CREW_COLORS } from './crew';
