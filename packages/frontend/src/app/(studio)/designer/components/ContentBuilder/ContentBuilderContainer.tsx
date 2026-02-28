"use client";

import React from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { TimelinePanel, PlaybackPanel, DetailsPanel, ModalsContainer } from './ui';
import { useContentBuilder } from './context/ContentBuilderContext';
import { FilmDetailHeader } from '@/components/films';

interface ContentBuilderContainerProps {
  timelineRef: React.RefObject<HTMLDivElement>;
  rightPanel?: React.ReactNode;
  film?: any;
  subjectCount?: number;
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
  rightPanel,
  film,
  subjectCount = 0,
  onSaveFilmName = async () => {},
  packageId,
}) => {
  const { scenes, tracks, setShowCreateSceneDialog } = useContentBuilder();

  // Calculate total duration from scenes
  const totalDuration = React.useMemo(() => {
    if (scenes.length === 0) return 0;
    return Math.max(...scenes.map(s => (s.start_time || 0) + (s.duration || 0)));
  }, [scenes]);

  // Deduplicated scene count (handles legacy duplicate rows in DB)
  const uniqueSceneCount = React.useMemo(() => {
    const seen = new Set<string>();
    scenes.forEach(scene => {
      const templateId = (scene as any).original_scene_id || (scene as any).scene_template_id || 'unknown';
      const sceneName = scene.name || 'unknown';
      seen.add(`${templateId}|${sceneName}`);
    });
    return seen.size;
  }, [scenes]);

  const locationCount = React.useMemo(() => {
    const filmLocations = (film as any)?.locations;
    if (Array.isArray(filmLocations) && filmLocations.length > 0) {
      return filmLocations.length;
    }

    const locationKeys = new Set<string | number>();
    scenes.forEach((scene) => {
      const locationId =
        (scene as any)?.location_assignment?.location?.id ??
        (scene as any)?.location?.id ??
        (scene as any)?.location_id;
      const locationName =
        (scene as any)?.location_assignment?.location?.name ??
        (scene as any)?.location?.name ??
        (scene as any)?.location_name;
      const key = locationId ?? locationName;
      if (key) {
        locationKeys.add(key);
      }
    });

    return locationKeys.size;
  }, [film, scenes]);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Header - Always visible with live stats */}
      {film && (
        <FilmDetailHeader
          film={film}
          filmId={film.id}
          sceneCount={uniqueSceneCount}
          totalDuration={totalDuration}
          trackCount={tracks.length}
          subjectCount={subjectCount}
          locationCount={locationCount}
          onSceneCreated={() => {}} // Not needed here as it's handled by context
          onSaveFilm={onSaveFilmName}
        />
      )}

      {/* Main Layout */}
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        flex: 1,
        minWidth: 0,
        overflow: "hidden"
      }}>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "visible"
        }}>
          {/* Top Row - Playback + Film Details */}
          <Box sx={{
            display: "flex",
            width: "100%",
            minHeight: "400px",
            maxHeight: "53vh",
            overflow: "hidden",
            boxSizing: "border-box",
            gap: 0,
            '@media (max-width: 1200px)': {
              flexDirection: 'column',
              maxHeight: 'none'
            }
          }}>
            {/* Details Panel – left side */}
            <DetailsPanel rightPanel={rightPanel} />

            {/* Playback Panel */}
            <PlaybackPanel />

            {/* Add Scene Panel – right side */}
            <Box sx={{
              width: "25%",
              minWidth: "280px",
              maxWidth: "400px",
              flexShrink: 0,
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              background: "#0d0d0d",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}>
              {/* Panel Header */}
              <Box sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "#111",
                flexShrink: 0,
              }}>
                <Box sx={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Add Scene
                </Box>
              </Box>
              {/* Panel Content */}
              <Box sx={{
                flex: 1,
                overflow: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}>
                <Box sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", lineHeight: 1.5 }}>
                  Add a new scene to your film timeline from your scene library.
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setShowCreateSceneDialog(true)}
                  fullWidth
                  sx={{
                    bgcolor: "#7B61FF",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textTransform: "none",
                    py: 1,
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: "#6B50EF" },
                    boxShadow: "0 2px 8px rgba(123,97,255,0.3)",
                  }}
                >
                  Browse Scenes
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Timeline Panel */}
          <TimelinePanel timelineRef={timelineRef} />
        </Box>
      </Box>

      {/* Modals Container */}
      <ModalsContainer />
    </Box>
  );
};
