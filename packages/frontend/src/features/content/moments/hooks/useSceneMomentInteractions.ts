"use client";

import React from 'react';
import { scenesApi } from '@/features/content/scenes/api';
import type { TimelineScene } from '@/features/content/content-builder/types/timeline';
import type { MomentFormData } from '../types';
import type { SceneMomentWithSetup } from './moment-hook.types';
import { getSceneMoments } from './moment-hook.types';
import { useMomentResize } from './useMomentResize';
import { useMomentDragReorder } from './useMomentDragReorder';
import { useMomentRecordingSetup } from './useMomentRecordingSetup';

interface UseSceneMomentInteractionsProps {
  zoomLevel: number;
  onUpdateScene?: (scene: TimelineScene) => void;
}

export const useSceneMomentInteractions = ({
  zoomLevel,
  onUpdateScene,
}: UseSceneMomentInteractionsProps) => {
  const [editingMoment, setEditingMoment] = React.useState<MomentFormData | null>(null);
  const [activeSceneForEdit, setActiveSceneForEdit] = React.useState<TimelineScene | null>(null);

  const updateSceneMoments = React.useCallback(
    (scene: TimelineScene, nextMoments: SceneMomentWithSetup[]) => {
      (scene as TimelineScene & { moments?: SceneMomentWithSetup[] }).moments = nextMoments;
      if (onUpdateScene) {
        onUpdateScene({ ...scene, moments: nextMoments } as TimelineScene);
      }
    },
    [onUpdateScene],
  );

  const { resizingMomentId, handleResizeStart } = useMomentResize({ zoomLevel, updateSceneMoments });
  const { draggingMomentId, handleMomentDragStart, handleMomentDragOver, handleMomentDrop } =
    useMomentDragReorder(updateSceneMoments);
  const { handleMomentRecordingSetupSave, handleClearMomentRecordingSetup } = useMomentRecordingSetup({
    activeSceneForEdit,
    scenesApi,
    updateSceneMoments,
  });

  const handleMomentClick = React.useCallback(
    (e: React.MouseEvent, moment: SceneMomentWithSetup, scene: TimelineScene) => {
      e.stopPropagation();
      setEditingMoment(moment as unknown as MomentFormData);
      setActiveSceneForEdit(scene);
    },
    [],
  );

  const handleMomentSave = React.useCallback(
    (updatedMoment: MomentFormData) => {
      if (!activeSceneForEdit || !editingMoment) return;

      const moments = getSceneMoments(activeSceneForEdit);
      const updatedMoments = moments.map((moment) => {
        if (moment.id !== updatedMoment.id) return moment;
        const recordingSetup = moment.recording_setup ?? updatedMoment.recording_setup;
        const hasRecordingSetup =
          !!recordingSetup || !!moment.has_recording_setup || !!updatedMoment.has_recording_setup;
        return {
          ...moment,
          ...updatedMoment,
          recording_setup: recordingSetup,
          has_recording_setup: hasRecordingSetup,
        };
      });

      updateSceneMoments(activeSceneForEdit, updatedMoments as SceneMomentWithSetup[]);
      setEditingMoment(null);
      setActiveSceneForEdit(null);
    },
    [activeSceneForEdit, editingMoment, updateSceneMoments],
  );

  const closeMomentEditor = React.useCallback(() => {
    setEditingMoment(null);
  }, []);

  return {
    editingMoment,
    activeSceneForEdit,
    resizingMomentId,
    draggingMomentId,
    closeMomentEditor,
    handleResizeStart,
    handleMomentDragStart,
    handleMomentDragOver,
    handleMomentDrop,
    handleMomentClick,
    handleMomentSave,
    handleMomentRecordingSetupSave,
    handleClearMomentRecordingSetup,
  };
};
