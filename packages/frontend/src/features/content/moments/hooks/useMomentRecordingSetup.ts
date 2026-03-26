"use client";

import React from 'react';
import type { TimelineScene } from '@/lib/types/timeline';
import type { MomentRecordingSetupWithAssignments } from '@/lib/types/domains/recording-setup';
import type { ShotType } from '@/features/content/coverage/types';
import type { ScenesApi } from '@/features/content/scenes/api';
import type { SceneMomentWithSetup, UpdateSceneMomentsFn } from './moment-hook.types';
import { getSceneMoments } from './moment-hook.types';

interface UseMomentRecordingSetupProps {
  activeSceneForEdit: TimelineScene | null;
  scenesApi: ScenesApi;
  updateSceneMoments: UpdateSceneMomentsFn;
}

export const useMomentRecordingSetup = ({
  activeSceneForEdit,
  scenesApi,
  updateSceneMoments,
}: UseMomentRecordingSetupProps) => {
  const handleSave = React.useCallback(
    async (
      momentId: number,
      data: {
        camera_track_ids?: number[];
        camera_assignments?: Array<{
          track_id: number;
          subject_ids?: number[];
          shot_type?: ShotType | null;
        }>;
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        graphics_title?: string | null;
      },
    ) => {
      if (!activeSceneForEdit) return;

      const setup = await scenesApi.moments.upsertRecordingSetup(momentId, data);

      const response = setup as Partial<MomentRecordingSetupWithAssignments> & {
        camera_track_ids?: number[];
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        graphics_title?: string | null;
      };

      const hasResponseBody =
        !!response &&
        ((response.camera_assignments && response.camera_assignments.length > 0) ||
          (response.camera_track_ids && response.camera_track_ids.length > 0) ||
          (response.audio_track_ids && response.audio_track_ids.length > 0) ||
          typeof response.graphics_enabled !== 'undefined' ||
          typeof response.graphics_title !== 'undefined');

      const setupSource = hasResponseBody
        ? response
        : {
            camera_track_ids: data.camera_track_ids || [],
            audio_track_ids: data.audio_track_ids || [],
            graphics_enabled: data.graphics_enabled || false,
            graphics_title: data.graphics_title ?? null,
          };

      const normalizedSetup: MomentRecordingSetupWithAssignments = {
        ...(setupSource as MomentRecordingSetupWithAssignments),
        camera_assignments: setupSource.camera_assignments?.length
          ? setupSource.camera_assignments
          : (setupSource.camera_track_ids || []).map((id) => {
              const source = data.camera_assignments?.find((a) => a.track_id === id);
              return {
                id: 0,
                recording_setup_id: 0,
                track_id: id,
                subject_ids: source?.subject_ids || [],
                shot_type: source?.shot_type ?? null,
              };
            }),
      };

      // Refetch scene to get updated subjects with role_template
      const refreshedScene = await scenesApi.scenes.getById(activeSceneForEdit.id);
      const refreshedMoments = (refreshedScene.moments || []) as unknown as SceneMomentWithSetup[];

      const existingMoments = getSceneMoments(activeSceneForEdit);
      const mergedMoments = refreshedMoments.map((moment) => {
        const existing = existingMoments.find((m) => m.id === moment.id);
        const isSavedMoment = moment.id === momentId;
        const resolvedSetup: MomentRecordingSetupWithAssignments | null = isSavedMoment
          ? normalizedSetup
          : (moment.recording_setup ?? existing?.recording_setup ?? null);

        return {
          ...existing,
          ...moment,
          recording_setup: resolvedSetup,
          has_recording_setup: isSavedMoment
            ? true
            : typeof moment.has_recording_setup !== 'undefined'
              ? moment.has_recording_setup
              : (existing?.has_recording_setup ?? !!resolvedSetup),
        };
      });

      updateSceneMoments(activeSceneForEdit, mergedMoments);
    },
    [activeSceneForEdit, scenesApi, updateSceneMoments],
  );

  const handleClear = React.useCallback(
    async (momentId?: number) => {
      if (!activeSceneForEdit || !momentId) return;
      try {
        await scenesApi.moments.clearRecordingSetup(momentId);
        const moments = getSceneMoments(activeSceneForEdit);
        const updatedMoments = moments.map((m) =>
          m.id === momentId ? { ...m, recording_setup: null, has_recording_setup: false } : m,
        );
        updateSceneMoments(activeSceneForEdit, updatedMoments);
      } catch (error) {
        console.error('[useMomentRecordingSetup] Failed to clear recording setup:', error);
      }
    },
    [activeSceneForEdit, scenesApi, updateSceneMoments],
  );

  return { handleMomentRecordingSetupSave: handleSave, handleClearMomentRecordingSetup: handleClear };
};
