"use client";

import React from 'react';
import type { TimelineScene } from '@/lib/types/timeline';
import type { UpdateSceneMomentsFn } from './moment-hook.types';
import { getSceneMoments } from './moment-hook.types';

export const useMomentDragReorder = (updateSceneMoments: UpdateSceneMomentsFn) => {
  const [draggingMomentId, setDraggingMomentId] = React.useState<number | null>(null);
  const [dragStartIndex, setDragStartIndex] = React.useState(-1);
  const [dragScene, setDragScene] = React.useState<TimelineScene | null>(null);

  const handleMomentDragStart = React.useCallback(
    (e: React.DragEvent, momentId: number, index: number, scene: TimelineScene) => {
      e.stopPropagation();
      setDraggingMomentId(momentId);
      setDragStartIndex(index);
      setDragScene(scene);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  const handleMomentDragOver = React.useCallback(
    (e: React.DragEvent) => {
      if (draggingMomentId === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    [draggingMomentId],
  );

  const handleMomentDrop = React.useCallback(
    (e: React.DragEvent, dropIndex: number, targetScene: TimelineScene) => {
      e.preventDefault();
      if (draggingMomentId === null || dragStartIndex === -1 || !dragScene) return;
      if (dragScene.name !== targetScene.name) return;

      const moments = [...getSceneMoments(dragScene)];
      const draggedMoment = moments[dragStartIndex];
      if (!draggedMoment) return;

      moments.splice(dragStartIndex, 1);
      moments.splice(dropIndex, 0, draggedMoment);
      moments.forEach((m, idx) => {
        m.order_index = idx;
      });

      updateSceneMoments(dragScene, moments);
      setDraggingMomentId(null);
      setDragStartIndex(-1);
      setDragScene(null);
    },
    [draggingMomentId, dragStartIndex, dragScene, updateSceneMoments],
  );

  return { draggingMomentId, handleMomentDragStart, handleMomentDragOver, handleMomentDrop };
};
