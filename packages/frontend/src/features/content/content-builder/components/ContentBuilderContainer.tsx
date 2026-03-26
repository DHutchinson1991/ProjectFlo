"use client";

import React from 'react';
import { api } from '@/lib/api';
import { Box } from '@mui/material';
import { TimelinePanel, PlaybackPanel, DetailsPanel, MomentPanel, ModalsContainer } from './';
import { useContentBuilder } from '../context/ContentBuilderContext';
import { FilmDetailHeader } from '@/features/content/films/components';

interface ContentBuilderContainerProps {
  timelineRef: React.RefObject<HTMLDivElement>;
  rightPanel?: React.ReactNode;
  film?: any;
  subjectCount?: number;
  onSaveFilmName?: (name: string) => Promise<void>;
  /** When set, film is opened from a package — schedule filters event days to this package */
  packageId?: number | null;
  /** When set, location count in the header is filtered to slots assigned to this activity */
  linkedActivityId?: number | null;
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
  linkedActivityId,
}) => {
  const { scenes, tracks, saveState, handleSave, setShowCreateSceneDialog, readOnly } = useContentBuilder();

  // Count location slots assigned to this film's activity (for the header badge)
  const [activityLocationCount, setActivityLocationCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!packageId || !linkedActivityId) {
      setActivityLocationCount(null);
      return;
    }
    api.schedule.packageLocationSlots
      .getAll(packageId)
      .then((slots: any[]) => {
        const count = (slots || []).filter((s: any) =>
          (s.activity_assignments || []).some(
            (a: any) => a.package_activity_id === linkedActivityId
          )
        ).length;
        setActivityLocationCount(count);
      })
      .catch(() => setActivityLocationCount(null));
  }, [packageId, linkedActivityId]);

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
    // Use activity-filtered slot count when we have a linked activity
    if (activityLocationCount !== null) return activityLocationCount;

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
  }, [film, scenes, activityLocationCount]);

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
          onSaveFilm={onSaveFilmName}          saveState={{ ...saveState, lastSavedAt: saveState.lastSaved, saveError: null }}
          onSaveContent={handleSave}
          onAddScenes={() => setShowCreateSceneDialog(true)}
          readOnly={readOnly}        />
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
            {/* Details Panel – left side (placeholder) */}
            <DetailsPanel />

            {/* Playback Panel */}
            <PlaybackPanel />

            {/* Moment Panel – right side */}
            <MomentPanel />
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
