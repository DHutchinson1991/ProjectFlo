"use client";

import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import MovieFilterRoundedIcon from '@mui/icons-material/MovieFilterRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import { useContentBuilder } from '../../context/ContentBuilderContext';

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const sceneTypeLabel = (type?: string | null): string => {
  if (!type) return 'Scene';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const sceneTypeColor = (type?: string | null): string => {
  switch (type?.toLowerCase()) {
    case 'video': return '#7B61FF';
    case 'audio': return '#4ECDC4';
    case 'music': return '#FF6B9D';
    case 'graphics': return '#FFB347';
    default: return '#7B61FF';
  }
};

/**
 * Details Panel — Scene Editor
 * Shows and allows editing the scene at the current playback cursor.
 */
export const DetailsPanel: React.FC = () => {
  const { currentScene } = useContentBuilder();

  const scene = currentScene;
  const moments = (scene as any)?.moments || (scene as any)?.original_scene?.moments || [];
  const orderIndex = typeof (scene as any)?.order_index === 'number' ? (scene as any).order_index : undefined;
  const typeColor = sceneTypeColor(scene?.scene_type);

  return (
    <Box sx={{
      width: "25%",
      minWidth: "280px",
      maxWidth: "400px",
      flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.08)",
      background: "#0d0d0d",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      '@media (max-width: 1200px)': {
        width: '100%',
        maxWidth: '100%',
        borderRight: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }
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
          Scene
        </Box>
      </Box>

      {/* Panel Content */}
      <Box sx={{
        flex: 1,
        overflow: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}>
        {!scene ? (
          /* Empty state */
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: 4,
          }}>
            <MovieFilterRoundedIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center' }}>
              Scrub the playback cursor over a scene to view details
            </Typography>
          </Box>
        ) : (
          <>
            {/* Scene Title + Type */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {typeof orderIndex === 'number' && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 600 }}>
                    #{orderIndex + 1}
                  </Typography>
                )}
                <Chip
                  label={sceneTypeLabel(scene.scene_type)}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: alpha(typeColor, 0.15),
                    color: typeColor,
                    border: `1px solid ${alpha(typeColor, 0.3)}`,
                  }}
                />
              </Box>
              <Typography sx={{
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                lineHeight: 1.3,
              }}>
                {scene.name || 'Untitled Scene'}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* Duration */}
            <InfoRow
              icon={<AccessTimeRoundedIcon sx={{ fontSize: 15 }} />}
              label="Duration"
              value={formatDuration(scene.duration || 0)}
            />

            {/* Moments count */}
            <InfoRow
              icon={<LayersRoundedIcon sx={{ fontSize: 15 }} />}
              label="Moments"
              value={moments.length > 0 ? `${moments.length} moment${moments.length !== 1 ? 's' : ''}` : 'No moments'}
            />

            {/* Description */}
            {(scene as any).description && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <InfoRow
                  icon={<NotesRoundedIcon sx={{ fontSize: 15 }} />}
                  label="Description"
                  value={(scene as any).description}
                  multiline
                />
              </>
            )}

            {/* Recording Setup Summary */}
            {(scene as any).recording_setup && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
                    Recording Setup
                  </Typography>
                  <SetupSummary setup={(scene as any).recording_setup} />
                </Box>
              </>
            )}

            {/* Moments List */}
            {moments.length > 0 && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
                    Moments
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {moments.map((m: any, i: number) => (
                      <Box key={m.id || i} sx={{
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 500 }}>
                          {m.name || `Moment ${i + 1}`}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>
                          {formatDuration(m.duration || m.duration_seconds || 0)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

/* ─── Helper Components ─── */

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}> = ({ icon, label, value, multiline }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: multiline ? 'flex-start' : 'center' }}>
    <Box sx={{ color: 'rgba(255,255,255,0.3)', mt: multiline ? 0.25 : 0, flexShrink: 0 }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', lineHeight: 1.5 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const SetupSummary: React.FC<{ setup: any }> = ({ setup }) => {
  const cameras = setup.camera_assignments?.length || 0;
  const audio = setup.audio_track_ids?.length || 0;
  const graphics = setup.graphics_enabled;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {cameras > 0 && (
        <Chip label={`${cameras} camera${cameras !== 1 ? 's' : ''}`} size="small" sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(123,97,255,0.12)', color: 'rgba(255,255,255,0.7)' }} />
      )}
      {audio > 0 && (
        <Chip label={`${audio} audio`} size="small" sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(78,205,196,0.12)', color: 'rgba(255,255,255,0.7)' }} />
      )}
      {graphics && (
        <Chip label="Graphics" size="small" sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(255,179,71,0.12)', color: 'rgba(255,255,255,0.7)' }} />
      )}
      {cameras === 0 && audio === 0 && !graphics && (
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>No setup configured</Typography>
      )}
    </Box>
  );
};
