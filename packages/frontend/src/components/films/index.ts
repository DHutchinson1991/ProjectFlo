/**
 * Film Components - Phase 2 Equipment & Scene Management
 * Export barrel file for easy imports
 */

export { FilmEquipmentPanel } from './FilmEquipmentPanel';
export { SceneSelectionDialog } from './SceneSelectionDialog';
export { SceneDurationPanel } from './SceneDurationPanel';
export { FilmDetailHeader } from './FilmDetailHeader';
export { FilmDetailStates } from './FilmDetailStates';
export { FilmSchedulePanel } from './FilmSchedulePanel';
export * from './tabs';

// Film API Context (adapter pattern for library / project / inquiry modes)
export {
  FilmApiProvider,
  useFilmApi,
  useOptionalFilmApi,
  useFilmApiAdapter,
  createLibraryFilmApi,
  createProjectFilmApi,
  createInquiryFilmApi,
} from './FilmApiContext';
export type { FilmContentApi, FilmApiMode } from './FilmApiContext';
