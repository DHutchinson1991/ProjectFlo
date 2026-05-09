"use client";

import React from 'react';
import { Box } from '@mui/material';
import { TimelinePanel, PlaybackPanel, DetailsPanel, MomentPanel, ModalsContainer } from './';
import { useContentBuilder } from '../context/ContentBuilderContext';
import { FilmDetailHeader } from '@/features/content/films/components';
import type { Film } from '@/features/content/films/types';
import { SceneSettingsPanel } from './scene-settings/SceneSettingsPanel';

interface ContentBuilderContainerProps {
  timelineRef: React.RefObject<HTMLDivElement>;
  film?: Film;
  onSaveFilmName?: (name: string) => Promise<void>;
  /** When set, film is opened from a package — schedule filters event days to this package */
  packageId?: number | null;
}

/**
 * ContentBuilderContainer
 * 
 * Layout orchestrator for ContentBuilder features.
 * This component is wrapped by ContentBuilderProvider, so it has
 * access to shared state via useContentBuilder().
 * 
 * Responsibilities:
 * - Layout structure (top row, timeline row)
 * - Feature composition (which features to render)
 * - No business logic (that's in the provider/hooks)
 */
export const ContentBuilderContainer: React.FC<ContentBuilderContainerProps> = ({
  timelineRef,
  film,
  onSaveFilmName = async () => {},
  packageId,
}) => {
  const { saveState, handleSave, setShowCreateSceneDialog, readOnly, selectedSceneForSettings } = useContentBuilder();

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top Header - Always visible */}
      {film && (
        <FilmDetailHeader
          film={film}
          onSaveFilm={onSaveFilmName}          saveState={{ ...saveState, lastSavedAt: saveState.lastSaved, saveError: null }}
          onSaveContent={handleSave}
          onAddScenes={() => setShowCreateSceneDialog(true)}
          readOnly={readOnly}
          packageHref={packageId ? `/packages/${packageId}` : undefined}
        />
      )}

      {/* Main Layout */}
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(8,8,12,0.98) 22%, rgba(5,5,8,1) 100%)",
      }}>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden"
        }}>
          {/* Top workspace - playback + details + inspector */}
          <Box sx={{
            display: "flex",
            width: "100%",
            flex: 1,
            minHeight: 0,
            overflowX: "hidden",
            overflowY: { xs: "auto", lg: "hidden" },
            boxSizing: "border-box",
            px: { xs: 1, sm: 1.5, lg: 2 },
            pt: { xs: 1, lg: 1.25 },
            gap: 0,
            borderBottom: "1px solid rgba(52, 58, 68, 0.55)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%)",
            '@media (max-width: 1200px)': {
              flexDirection: 'column',
            }
          }}>
            {/* Details Panel – left side (placeholder) */}
            <DetailsPanel />

            {/* Playback Panel */}
            <PlaybackPanel />

            {/* Right Panel — Scene Settings or Moment */}
            {selectedSceneForSettings ? <SceneSettingsPanel /> : <MomentPanel />}
          </Box>

          {/* Bottom timeline band */}
          <Box sx={{
            position: "relative",
            flexShrink: 0,
            height: { xs: 300, lg: 'clamp(280px, 32vh, 360px)' },
            minHeight: 280,
            background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.18) 24%, rgba(0,0,0,0.36) 100%)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(123, 97, 255, 0.4), transparent)',
              pointerEvents: 'none',
            },
          }}>
            <TimelinePanel timelineRef={timelineRef} />
          </Box>
        </Box>
      </Box>

      {/* Modals Container */}
      <ModalsContainer />
    </Box>
  );
};
