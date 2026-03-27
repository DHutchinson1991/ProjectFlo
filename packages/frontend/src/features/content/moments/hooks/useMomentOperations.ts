"use client";

import { useCallback } from 'react';
import { momentsApi } from '../api';
import type { TimelineScene } from '@/features/content/content-builder/types/timeline';
import type { MomentFormData } from '../types';

export const useMomentOperations = (
  scene: TimelineScene,
  moments: MomentFormData[],
  onClosePopover: () => void,
  onMomentsUpdate?: (updatedMoments: MomentFormData[]) => void,
) => {
  const handleSaveMoment = useCallback(
    async (updatedMoment: MomentFormData) => {
      if (!updatedMoment.id) return;

      const oldMoment = moments.find((m) => m.id === updatedMoment.id);
      const updatedMoments = moments.map((m) => {
        if (m.id === updatedMoment.id) {
          const recordingSetup = updatedMoment.recording_setup ?? m.recording_setup;
          const hasRecordingSetup =
            typeof updatedMoment.has_recording_setup !== 'undefined'
              ? updatedMoment.has_recording_setup
              : typeof m.has_recording_setup !== 'undefined'
                ? m.has_recording_setup
                : !!recordingSetup;
          return { ...m, ...updatedMoment, recording_setup: recordingSetup, has_recording_setup: hasRecordingSetup };
        }
        return m;
      });

      if (onMomentsUpdate) {
        onMomentsUpdate(updatedMoments);
      } else {
        (scene as TimelineScene & { moments?: MomentFormData[] }).moments = updatedMoments;
      }

      onClosePopover();

      if (oldMoment && (updatedMoment.name !== oldMoment.name || updatedMoment.duration !== oldMoment.duration)) {
        try {
          if (!scene.id) {
            return;
          }
          await momentsApi.update(updatedMoment.id, {
            name: updatedMoment.name,
            duration: updatedMoment.duration,
          });
        } catch (error) {
          console.error('[useMomentOperations] Failed to update moment details', error);
        }
      }
    },
    [scene, moments, onClosePopover, onMomentsUpdate],
  );

  return { handleSaveMoment };
};
