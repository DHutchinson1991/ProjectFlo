"use client";

import React from 'react';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { CreateSceneDialog } from './';
import { scenesApi } from '@/features/content/scenes/api';
import { enrichScenesWithBeats } from '@/features/content/scenes/utils/enrichScenesWithBeats';

/**
 * Modals Container
 * 
 * Renders all global dialogs/modals.
 */
export const ModalsContainer: React.FC = () => {
  // ✅ USE SHARED CONTEXT
    const {
    showCreateSceneDialog,
    setShowCreateSceneDialog,
    getFilteredScenes,
    loadAvailableScenes,
    handleSceneFromLibrary,
    setScenes,
    scenes,
    filmId,
    scrollToTime,
    readOnly,
    packageId,
    linkedActivityId,
    instanceOwnerType,
    instanceOwnerId,
  } = useContentBuilder();

  const handleSceneCreated = React.useCallback(async (newScene: any) => {
    if (newScene?.film_id) {
      const lastEndTime = scenes.reduce((maxEnd, scene) => {
        const start = scene.start_time || 0;
        const duration = scene.duration || 0;
        return Math.max(maxEnd, start + duration);
      }, 0);
      const nextOrderIndex = scenes.reduce((maxOrder, scene) => {
        const order = (scene as any).order_index;
        return typeof order === 'number' ? Math.max(maxOrder, order) : maxOrder;
      }, -1) + 1;

      const timelineScenes = await enrichScenesWithBeats([
        {
          ...newScene,
          start_time: lastEndTime,
          order_index: nextOrderIndex,
        },
      ]);
      setScenes((prev) => [...prev, ...timelineScenes]);

      scrollToTime(lastEndTime);
    }
    loadAvailableScenes();
    setShowCreateSceneDialog(false);
  }, [loadAvailableScenes, scenes, setScenes, setShowCreateSceneDialog]);

  // Handler for when a scene is selected from the library browser
  // This should add the scene to the timeline AND close the dialog
  const handleSceneSelect = React.useCallback((selectedScene: any) => {
    handleSceneFromLibrary(selectedScene);
    setShowCreateSceneDialog(false);
  }, [handleSceneFromLibrary, setShowCreateSceneDialog]);

  const handleSceneDelete = React.useCallback(async (scene: any) => {
    if (!scene?.id) return;
    const confirmed = window.confirm(`Remove "${scene.name}" from the library?`);
    if (!confirmed) return;
    await scenesApi.templates.delete(scene.id);
    loadAvailableScenes();
  }, [loadAvailableScenes]);

  return (
    <CreateSceneDialog
      open={showCreateSceneDialog}
      onClose={() => setShowCreateSceneDialog(false)}
      onSceneCreated={handleSceneCreated}
      filmId={typeof filmId === 'string' ? parseInt(filmId, 10) : filmId}
      packageId={packageId}
      linkedActivityId={linkedActivityId}
      instanceOwnerType={instanceOwnerType}
      instanceOwnerId={instanceOwnerId}
      scenes={getFilteredScenes()}
      readOnly={readOnly}
      onSceneSelect={handleSceneSelect}
      onSceneDelete={handleSceneDelete}
    />
  );
};
