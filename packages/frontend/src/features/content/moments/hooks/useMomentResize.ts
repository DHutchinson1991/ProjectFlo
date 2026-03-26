"use client";

import React from 'react';
import type { TimelineScene } from '@/lib/types/timeline';
import type { SceneMomentWithSetup, UpdateSceneMomentsFn } from './moment-hook.types';
import { getSceneMoments } from './moment-hook.types';

interface UseMomentResizeProps {
  zoomLevel: number;
  updateSceneMoments: UpdateSceneMomentsFn;
}

export const useMomentResize = ({ zoomLevel, updateSceneMoments }: UseMomentResizeProps) => {
  const [resizingMomentId, setResizingMomentId] = React.useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = React.useState(0);
  const [resizeStartDuration, setResizeStartDuration] = React.useState(0);
  const [resizeScene, setResizeScene] = React.useState<TimelineScene | null>(null);

  const handleResizeStart = React.useCallback(
    (e: React.MouseEvent, momentId: number, currentDuration: number, scene: TimelineScene) => {
      e.stopPropagation();
      setResizingMomentId(momentId);
      setResizeStartX(e.clientX);
      setResizeStartDuration(currentDuration);
      setResizeScene(scene);
    },
    [],
  );

  React.useEffect(() => {
    if (resizingMomentId === null || !resizeScene) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaPixels = e.clientX - resizeStartX;
      const deltaSeconds = deltaPixels / (zoomLevel || 5);
      const newDuration = Math.max(1, resizeStartDuration + deltaSeconds);

      const moments = getSceneMoments(resizeScene);
      const updatedMoments: SceneMomentWithSetup[] = moments.map((m) =>
        m.id === resizingMomentId ? { ...m, duration: newDuration } : m,
      );
      updateSceneMoments(resizeScene, updatedMoments);
    };

    const handleMouseUp = () => {
      setResizingMomentId(null);
      setResizeScene(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingMomentId, resizeStartX, resizeStartDuration, zoomLevel, resizeScene, updateSceneMoments]);

  return { resizingMomentId, handleResizeStart };
};
