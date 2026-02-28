"use client";

import React from 'react';
import { useContentBuilder } from '../../../context/ContentBuilderContext';
import { FilmDetailsPanel } from './';

interface DetailsPanelProps {
  rightPanel?: React.ReactNode;
}

/**
 * Details Panel Container
 * 
 * Renders the film details panel on the right side.
 */
export const DetailsPanel: React.FC<DetailsPanelProps> = ({ rightPanel }) => {
  // ✅ USE SHARED CONTEXT
  const { scenes } = useContentBuilder();

  // Calculate total duration
  const totalDuration = React.useMemo(() => {
    if (scenes.length === 0) return 0;
    return Math.max(...scenes.map(s => (s.start_time || 0) + (s.duration || 0)));
  }, [scenes]);

  return (
    <FilmDetailsPanel
      scenes={scenes}
      totalDuration={totalDuration}
      rightPanel={rightPanel}
    />
  );
};
