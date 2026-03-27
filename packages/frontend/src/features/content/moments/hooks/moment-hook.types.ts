import type { TimelineScene } from '@/features/content/content-builder/types/timeline';
import type { TimelineSceneMoment } from '../types';
import type { MomentRecordingSetupWithAssignments } from '@/features/content/moments/types/recording-setup';

export type SceneMomentWithSetup = TimelineSceneMoment & {
  duration_seconds?: number;
  recording_setup?: MomentRecordingSetupWithAssignments | null;
  has_recording_setup?: boolean;
};

export const getSceneMoments = (scene: TimelineScene | null): SceneMomentWithSetup[] => {
  if (!scene) return [];
  const moments = (scene as TimelineScene & { moments?: SceneMomentWithSetup[] }).moments;
  return Array.isArray(moments) ? moments : [];
};

export type UpdateSceneMomentsFn = (scene: TimelineScene, moments: SceneMomentWithSetup[]) => void;
