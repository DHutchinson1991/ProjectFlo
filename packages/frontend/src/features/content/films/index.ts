/**
 * Films Feature Barrel
 * Re-exports all public API from the films feature module
 */

// Types
export type { Film, CreateFilmDto, UpdateFilmDto, FilmResponse, TimelineLayer, CreateTimelineLayerDto, UpdateTimelineLayerDto } from './types';
export { FilmType } from './types';

// API
export { createFilmsApi } from './api';
export type { FilmsApi } from './api';

// Hooks
export { useFilms } from './hooks/useFilms';
export { useFilmData } from './hooks/useFilmData';
export { useFilmEquipment } from './hooks/useFilmEquipment';
export { useFilmEquipmentPanel } from './hooks/useFilmEquipmentPanel';
export { useFilmScenes } from '@/features/content/scenes/hooks/useFilmScenes';
export { useMontagePresets } from './hooks/useMontagePresets';
export { useFilmStructureTemplates } from './hooks/useFilmStructureTemplates';
export { useSceneCreation } from '@/features/content/scenes/hooks/useSceneCreation';
export { useScheduleData } from './hooks/useScheduleData';
export { useSchedulePresets } from './hooks/useSchedulePresets';
export { enrichScenesWithBeats } from '@/features/content/scenes/utils/enrichScenesWithBeats';

// Components
export { FilmApiProvider, useFilmApi, useOptionalFilmApi, useFilmApiAdapter, createLibraryFilmApi, createProjectFilmApi, createInquiryFilmApi } from './components/FilmApiContext';
export type { FilmContentApi, FilmApiMode } from './components/FilmApiContext';
export { FilmDetailHeader } from './components/FilmDetailHeader';
export { FilmDetailStates } from './components/FilmDetailStates';
export { FilmEquipmentPanel } from './components/FilmEquipmentPanel';
export { FilmSchedulePanel } from './components/FilmSchedulePanel';
export { SceneSelectionDialog } from './components/SceneSelectionDialog';
export { SceneDurationPanel } from './components/SceneDurationPanel';
export { FilmRightPanel } from './components/tabs/FilmRightPanel';
