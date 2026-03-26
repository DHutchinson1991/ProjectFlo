// Moments feature — canonical export barrel

// Types
export type {
  SceneMoment,
  CreateSceneMomentDto,
  UpdateSceneMomentDto,
  SceneMomentTemplate,
  SceneMomentWithSetup,
  SceneMomentWithMusic,
  MomentCoverage,
  MomentMusicInfo,
  MomentFormData,
  TimelineVideoLayer,
  TimelineAudioLayer,
  TimelineMusicLayer,
  TimelineLayerUnion,
  TimelineSceneMoment,
  TimelineSceneWithMoments,
} from './types';
export { formatDuration } from './types';

// API
export { createMomentsApi, type MomentsApi } from './api';

// Hooks
export {
  useMomentOperations,
  useMomentForm,
  useSceneMomentInteractions,
  useMomentResize,
  useMomentDragReorder,
  useMomentRecordingSetup,
} from './hooks';

// Components
export { default as MomentsManagement } from './components/MomentsManagement';
