import React, { useEffect, useMemo } from 'react';
import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import { useShotPreview, useCompositionGuide, useSpatialOverlay } from '../hooks/useShotPreviews';
import { getApiBaseUrl } from '@/shared/api/client';

interface ShotPreviewOverlayProps {
  /** The CameraSubjectAssignment.id from the recording setup */
  assignmentId?: number;
  filmId?: number;
  sourceType?: 'package' | 'project';
  locationHint?: string;
  /** Called when the preview availability changes — lets the parent hide SVG silhouettes */
  onHasPreviewChange?: (hasPreview: boolean) => void;
  /** When true, fetch and display the ControlNet composition guide SVG */
  showControlnetGuide?: boolean;
  /** When true, fetch and display the spatial floorplan overlay SVG */
  showSpatialOverlay?: boolean;
  /** When true, the rule-of-thirds grid inside the spatial overlay is visible. */
  showSpatialGrid?: boolean;
}

/** Parse a BREAK-separated SD prompt into labelled sections. */
function parsePromptSections(prompt: string): { label: string; text: string }[] {
  const parts = prompt.split(/\s*BREAK\s*/);
  if (parts.length >= 3) {
    return [
      { label: 'Style', text: parts[0].trim() },
      { label: 'Scene', text: parts[1].trim() },
      { label: 'Quality', text: parts.slice(2).join(' ').trim() },
    ];
  }
  // Fallback: no BREAK structure — show as single block
  return [{ label: 'Prompt', text: prompt.trim() }];
}

function humanizeShotType(value?: string | null): string {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Overlays an AI-generated sketch preview onto a camera viewfinder card.
 * Renders as an absolute-positioned layer so it sits behind the labels.
 * Generation is triggered centrally by the Moment Planner in MomentPanel.
 */
export const ShotPreviewOverlay: React.FC<ShotPreviewOverlayProps> = ({
  assignmentId,
  filmId,
  onHasPreviewChange,
  showControlnetGuide = false,
  showSpatialOverlay = false,
  showSpatialGrid = true,
}) => {
  const { data: preview, isLoading: isLoadingPreview } = useShotPreview(assignmentId);
  const { data: guide } = useCompositionGuide(assignmentId, filmId, showControlnetGuide);
  const { data: spatialOverlay } = useSpatialOverlay(assignmentId, filmId, showSpatialOverlay);

  const resolvedGuideShot = guide?.resolvedShotType ?? guide?.inferredShotType;
  const resolvedSpatialShot = spatialOverlay?.resolvedShotType ?? spatialOverlay?.inferredShotType;

  const hasPreview = preview?.status === 'COMPLETED' && preview.image_path;
  const imageUrl = hasPreview
    ? `${getApiBaseUrl()}/uploads/${preview.image_path}`
    : null;

  // Parse prompt into structured sections for the tooltip
  const promptSections = useMemo(
    () => (preview?.prompt ? parsePromptSections(preview.prompt) : []),
    [preview?.prompt],
  );

  // Notify parent when preview availability changes
  useEffect(() => {
    onHasPreviewChange?.(!!hasPreview);
  }, [hasPreview, onHasPreviewChange]);

  const tooltipContent = promptSections.length > 0 ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {promptSections.map((section, i) => (
        <Box key={i}>
          <Typography
            variant="caption"
            sx={{
              color: '#a78bfa',
              fontWeight: 600,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {section.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.68rem',
              lineHeight: 1.4,
            }}
          >
            {section.text}
          </Typography>
        </Box>
      ))}
      {preview?.seed != null && (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', mt: 0.25 }}>
          Seed: {preview.seed}
        </Typography>
      )}
    </Box>
  ) : '';

  return (
    <>
      {/* AI Preview Image Background — hidden when spatial overlay is active */}
      {imageUrl && !showSpatialOverlay && (
        <Tooltip
          title={tooltipContent}
          placement="top"
          enterDelay={400}
          slotProps={{
            tooltip: {
              sx: {
                maxWidth: 440,
                bgcolor: 'rgba(0, 0, 0, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(167, 139, 250, 0.15)',
                borderRadius: 1.5,
                p: 1.5,
              },
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.7,
              transition: 'opacity 0.3s ease',
            }}
          />
        </Tooltip>
      )}

      {/* Loading indicator (visible while fetching preview data) */}
      {isLoadingPreview && (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 35,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '50%',
            backdropFilter: 'blur(4px)',
          }}
        >
          <CircularProgress size={16} sx={{ color: '#a78bfa' }} />
        </Box>
      )}

      {/* ControlNet Composition Guide SVG Overlay — hidden when spatial overlay is active */}
      {showControlnetGuide && !showSpatialOverlay && guide?.available && guide.svg && (
        <Tooltip
          title={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                Composition Guide
              </Typography>
              {resolvedGuideShot && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem' }}>
                  Resolved shot: {humanizeShotType(resolvedGuideShot)}
                </Typography>
              )}
              {guide.rawSpatialShotType && guide.rawSpatialShotType !== resolvedGuideShot && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.62rem' }}>
                  Spatial guess: {humanizeShotType(guide.rawSpatialShotType)}
                </Typography>
              )}
              {guide.shotDecisionSource && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.6rem' }}>
                  Source: {guide.shotDecisionSource}
                </Typography>
              )}
              {guide.strength != null && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
                  Strength: {guide.strength}
                </Typography>
              )}
              {guide.subjects && guide.subjects.length > 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
                  Subjects: {guide.subjects.map(s => s.name).join(', ')}
                </Typography>
              )}
            </Box>
          }
          placement="top"
          enterDelay={300}
          slotProps={{
            tooltip: {
              sx: {
                maxWidth: 320,
                bgcolor: 'rgba(0, 0, 0, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(167, 139, 250, 0.15)',
                borderRadius: 1.5,
                p: 1.5,
              },
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              opacity: 0.55,
              pointerEvents: 'auto',
              transition: 'opacity 0.3s ease',
              '& svg': {
                width: '100%',
                height: '100%',
                display: 'block',
              },
            }}
            dangerouslySetInnerHTML={{ __html: guide.svg }}
          />
        </Tooltip>
      )}

      {/* Spatial Floorplan Overlay SVG */}
      {showSpatialOverlay && spatialOverlay?.available && spatialOverlay.svg && (
        <Tooltip
          title={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                Spatial Overlay
              </Typography>
              {resolvedSpatialShot && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem' }}>
                  Resolved shot: {humanizeShotType(resolvedSpatialShot)}
                </Typography>
              )}
              {spatialOverlay.rawSpatialShotType && spatialOverlay.rawSpatialShotType !== resolvedSpatialShot && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.62rem' }}>
                  Spatial guess: {humanizeShotType(spatialOverlay.rawSpatialShotType)}
                </Typography>
              )}
              {spatialOverlay.shotDecisionSource && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.6rem' }}>
                  Source: {spatialOverlay.shotDecisionSource}
                </Typography>
              )}
              {spatialOverlay.subjects && spatialOverlay.subjects.length > 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
                  {spatialOverlay.subjects.map(s => `${s.name} (${s.depth})`).join(', ')}
                </Typography>
              )}
            </Box>
          }
          placement="top"
          enterDelay={300}
          slotProps={{
            tooltip: {
              sx: {
                maxWidth: 360,
                bgcolor: 'rgba(0, 0, 0, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(52, 211, 153, 0.15)',
                borderRadius: 1.5,
                p: 1.5,
              },
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              opacity: 0.85,
              pointerEvents: 'auto',
              transition: 'opacity 0.3s ease',
              '& svg': {
                width: '100%',
                height: '100%',
                display: 'block',
              },
              // Toggle the rule-of-thirds grid baked into the overlay SVG.
              ...(showSpatialGrid
                ? {}
                : { '& svg .sp-grid': { display: 'none' } }),
            }}
            dangerouslySetInnerHTML={{ __html: spatialOverlay.svg }}
          />
        </Tooltip>
      )}
    </>
  );
};
