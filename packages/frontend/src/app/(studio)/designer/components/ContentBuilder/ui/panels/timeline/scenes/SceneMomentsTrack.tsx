import React, { useState } from 'react';
import { Box, Typography, Paper, Tooltip, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { TimelineSceneMoment, TimelineSceneWithMoments, TimelineLayer } from '../types/momentTypes';
import { getSceneColorByType, getDefaultTrackColor } from '../../../../utils/colorUtils';

const VIDEO_SCENE_COLOR = getSceneColorByType('VIDEO');
const VIDEO_TRACK_COLOR = getDefaultTrackColor('video');
const AUDIO_TRACK_COLOR = getDefaultTrackColor('audio');
const MUSIC_TRACK_COLOR = getDefaultTrackColor('music');

interface TimelineSceneMomentBlockProps {
  moment: TimelineSceneMoment;
  sceneStartTime: number;
  pixelsPerSecond: number;
  layers: TimelineLayer[];
  isHovered?: boolean;
  onHover?: (momentId: number | null) => void;
  onDragStart?: (e: React.DragEvent, momentId: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, momentId: number) => void;
}

/**
 * Renders a single moment block within a scene on the timeline
 * Shows coverage assignments and music
 */
export const TimelineSceneMomentBlock: React.FC<TimelineSceneMomentBlockProps> = ({
  moment,
  sceneStartTime,
  pixelsPerSecond,
  layers,
  isHovered,
  onHover,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [expanded, setExpanded] = useState(false);

  const leftPosition = ((moment.start_time || 0) - sceneStartTime) * pixelsPerSecond;
  const width = (moment.duration || 60) * pixelsPerSecond;

  // Get coverage assignments for this moment
  const videoCoverage = moment.coverage_items?.filter(
    (c) => c.coverage?.coverage_type === 'VIDEO'
  ) || [];
  const audioCoverage = moment.coverage_items?.filter(
    (c) => c.coverage?.coverage_type === 'AUDIO'
  ) || [];

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {moment.name}
          </Typography>
          {moment.description && (
            <Typography variant="caption">{moment.description}</Typography>
          )}
          <Typography variant="caption">
            Duration: {moment.duration}s
          </Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <Paper
        draggable
        onDragStart={(e) => onDragStart?.(e, moment.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, moment.id)}
        onMouseEnter={() => onHover?.(moment.id)}
        onMouseLeave={() => onHover?.(null)}
        sx={{
          position: 'absolute',
          left: `${leftPosition}px`,
          top: 0,
          width: `${width}px`,
          minHeight: '60px',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
          backgroundColor: isHovered ? alpha(VIDEO_SCENE_COLOR, 0.95) : alpha(VIDEO_SCENE_COLOR, 0.85),
          border: isHovered ? `2px solid ${VIDEO_TRACK_COLOR}` : `1px solid ${alpha(VIDEO_TRACK_COLOR, 0.9)}`,
          borderRadius: '4px',
          padding: '4px 8px',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          '&:hover': {
            backgroundColor: alpha(VIDEO_SCENE_COLOR, 0.95),
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Moment Name */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'ellipsis',
          }}
        >
          {moment.name}
        </Typography>

        {/* Coverage Indicators */}
        {expanded && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {videoCoverage.length > 0 && (
              <Chip
                size="small"
                label={`V${videoCoverage.length}`}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: VIDEO_TRACK_COLOR,
                  color: 'white',
                }}
              />
            )}
            {audioCoverage.length > 0 && (
              <Chip
                size="small"
                label={`A${audioCoverage.length}`}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: AUDIO_TRACK_COLOR,
                  color: 'white',
                }}
              />
            )}
            {moment.music && (
              <Chip
                size="small"
                label="🎵"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: MUSIC_TRACK_COLOR,
                  color: 'white',
                }}
              />
            )}
          </Box>
        )}

        {/* Duration */}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.7)',
            marginTop: 'auto',
          }}
        >
          {moment.duration}s
        </Typography>
      </Paper>
    </Tooltip>
  );
};

interface TimelineSceneLayerProps {
  sceneStartTime: number;
  sceneTotalDuration: number;
  pixelsPerSecond: number;
  layer: TimelineLayer;
  moments: TimelineSceneMoment[];
  hoveredMomentId?: number | null;
  onMomentHover?: (momentId: number | null) => void;
  onMomentDragStart?: (e: React.DragEvent, momentId: number) => void;
  onMomentDragOver?: (e: React.DragEvent) => void;
  onMomentDrop?: (e: React.DragEvent, momentId: number) => void;
}

/**
 * Renders a single layer (video, audio, or music) with moments for a scene
 */
export const TimelineSceneLayer: React.FC<TimelineSceneLayerProps> = ({
  sceneStartTime,
  sceneTotalDuration,
  pixelsPerSecond,
  layer,
  moments,
  hoveredMomentId,
  onMomentHover,
  onMomentDragStart,
  onMomentDragOver,
  onMomentDrop,
}) => {
  // Filter moments that belong on this layer
  const momentsForLayer = moments.filter((moment) => {
    if (layer.type === 'VIDEO') {
      return moment.coverage_items?.some(
        (c) =>
          c.coverage?.coverage_type === 'VIDEO' &&
          (c.assignment?.includes(layer.assignment) ||
            c.coverage?.assignment?.includes(layer.assignment))
      );
    } else if (layer.type === 'AUDIO') {
      return moment.coverage_items?.some(
        (c) =>
          c.coverage?.coverage_type === 'AUDIO' &&
          (c.assignment?.includes(layer.assignment) ||
            c.coverage?.assignment?.includes(layer.assignment))
      );
    } else if (layer.type === 'MUSIC') {
      return !!moment.music;
    }
    return false;
  });

  if (momentsForLayer.length === 0) {
    return null; // Don't render empty layers
  }

  return (
    <Box
      key={layer.id}
      sx={{
        position: 'relative',
        width: '100%',
        height: '60px',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        marginBottom: '2px',
      }}
    >
      {/* Layer Label */}
      <Box
        sx={{
          position: 'absolute',
          left: '-100px',
          top: 0,
          width: '95px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '4px',
          borderRight: `3px solid ${layer.color}`,
          backgroundColor: 'rgba(0,0,0,0.02)',
          zIndex: 10,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
          }}
        >
          {layer.name}
        </Typography>
      </Box>

      {/* Moments Container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        {momentsForLayer.map((moment) => (
          <TimelineSceneMomentBlock
            key={moment.id}
            moment={moment}
            sceneStartTime={sceneStartTime}
            pixelsPerSecond={pixelsPerSecond}
            layers={[layer]}
            isHovered={hoveredMomentId === moment.id}
            onHover={onMomentHover}
            onDragStart={onMomentDragStart}
            onDragOver={onMomentDragOver}
            onDrop={onMomentDrop}
          />
        ))}
      </Box>
    </Box>
  );
};

interface TimelineSceneWithMomentsBlockProps {
  scene: TimelineSceneWithMoments;
  sceneStartTime: number;
  pixelsPerSecond: number;
  isHovered?: boolean;
  onHover?: (sceneId: number | null) => void;
  onToggleExpand?: (sceneId: number) => void;
  onMomentReorder?: (sceneId: number, momentId: number, newOrderIndex: number) => void;
}

/**
 * Renders a scene block with nested moment layers
 * Shows as an expandable container with sub-layers for video, audio, and music
 */
export const TimelineSceneWithMomentsBlock: React.FC<TimelineSceneWithMomentsBlockProps> = ({
  scene,
  sceneStartTime,
  pixelsPerSecond,
  isHovered,
  onHover,
  onToggleExpand,
  onMomentReorder,
}) => {
  const [hoveredMomentId, setHoveredMomentId] = useState<number | null>(null);
  const [draggedMomentId, setDraggedMomentId] = useState<number | null>(null);

  const moments = scene.original_scene?.moments || [];
  const layers = scene.layers || [];

  const width = (scene.total_duration || 120) * pixelsPerSecond;

  const handleMomentDragStart = (e: React.DragEvent, momentId: number) => {
    setDraggedMomentId(momentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMomentDrop = (e: React.DragEvent, targetMomentId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedMomentId && draggedMomentId !== targetMomentId) {
      // Reorder moments
      const draggedMoment = moments.find((m) => m.id === draggedMomentId);
      const targetMoment = moments.find((m) => m.id === targetMomentId);

      if (draggedMoment && targetMoment) {
        const newOrderIndex = targetMoment.order_index;
        onMomentReorder?.(scene.id, draggedMomentId, newOrderIndex);
      }
    }

    setDraggedMomentId(null);
  };

  return (
    <Paper
      onMouseEnter={() => onHover?.(scene.id)}
      onMouseLeave={() => onHover?.(null)}
      sx={{
        position: 'relative',
        width: `${width}px`,
        backgroundColor: isHovered ? alpha(VIDEO_SCENE_COLOR, 0.12) : alpha(VIDEO_SCENE_COLOR, 0.08),
        border: isHovered ? `2px solid ${VIDEO_SCENE_COLOR}` : `1px solid ${alpha(VIDEO_SCENE_COLOR, 0.3)}`,
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha(VIDEO_SCENE_COLOR, 0.12),
          boxShadow: `0 2px 8px ${alpha(VIDEO_SCENE_COLOR, 0.2)}`,
        },
      }}
    >
      {/* Scene Header */}
      <Box
        onClick={() => onToggleExpand?.(scene.id)}
        sx={{
          padding: '8px 12px',
          backgroundColor: VIDEO_SCENE_COLOR,
          color: 'white',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '&:hover': {
            backgroundColor: alpha(VIDEO_SCENE_COLOR, 0.9),
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {scene.name}
        </Typography>
        <Typography variant="caption">
          {scene.total_duration}s
        </Typography>
      </Box>

      {/* Expanded Moments Layers */}
      {scene.isExpanded && (
        <Box sx={{ position: 'relative', marginLeft: '100px' }}>
          {layers.map((layer) => (
            <TimelineSceneLayer
              key={layer.id}
              sceneStartTime={sceneStartTime}
              sceneTotalDuration={scene.total_duration || 120}
              pixelsPerSecond={pixelsPerSecond}
              layer={layer}
              moments={moments}
              hoveredMomentId={hoveredMomentId}
              onMomentHover={setHoveredMomentId}
              onMomentDragStart={handleMomentDragStart}
              onMomentDragOver={(e) => e.preventDefault()}
              onMomentDrop={handleMomentDrop}
            />
          ))}
        </Box>
      )}

      {/* Duration Bar */}
      {!scene.isExpanded && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(33, 150, 243, 0.4)',
          }}
        />
      )}
    </Paper>
  );
};

export default {
  TimelineSceneMomentBlock,
  TimelineSceneLayer,
  TimelineSceneWithMomentsBlock,
};
