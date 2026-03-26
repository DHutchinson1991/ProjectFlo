"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CenterFocusStrongRoundedIcon from '@mui/icons-material/CenterFocusStrongRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import { useContentBuilder } from '../../context/ContentBuilderContext';

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatShotLabel = (value?: string | null): string => {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/**
 * Moment Panel — Right side panel
 * Shows details for the moment at the current playback cursor.
 */
export const MomentPanel: React.FC = () => {
  const { currentMoment, currentScene, tracks, packageSubjects } = useContentBuilder();

  const moment = currentMoment;
  const recordingSetup = moment?.recording_setup || (currentScene as any)?.recording_setup || null;

  const cameraAssignments = (recordingSetup?.camera_assignments || []) as Array<{
    track_id: number;
    track_name?: string;
    subject_ids?: number[];
    shot_type?: string | null;
  }>;
  const audioTrackIds = (recordingSetup?.audio_track_ids || []) as number[];
  const graphicsEnabled = !!recordingSetup?.graphics_enabled;
  const graphicsTitle = recordingSetup?.graphics_title || '';

  const getTrackName = (trackId: number, fallback?: string) => {
    const track = tracks.find((t) => t.id === trackId);
    return track?.name || fallback || `Track ${trackId}`;
  };

  const getSubjectName = (subjectId: number): string => {
    const pkg = (packageSubjects || []).find((s: any) => s.id === subjectId);
    return (pkg as any)?.name || `Subject ${subjectId}`;
  };

  const momentMusic = moment?.moment_music || moment?.music || null;
  const sceneMusic = (currentScene as any)?.scene_music || null;
  const music = momentMusic || sceneMusic;

  return (
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
          Moment
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
        {!moment ? (
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
            <CenterFocusStrongRoundedIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center' }}>
              Scrub the playback cursor over a moment to view details
            </Typography>
          </Box>
        ) : (
          <>
            {/* Moment Name + Duration */}
            <Box>
              <Typography sx={{
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                lineHeight: 1.3,
              }}>
                {moment.name || 'Untitled Moment'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  {formatDuration(moment.duration || moment.duration_seconds || 0)}
                </Typography>
              </Box>
            </Box>

            {/* Camera Assignments */}
            {cameraAssignments.length > 0 && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  <SectionLabel icon={<VideocamRoundedIcon sx={{ fontSize: 14 }} />} label="Cameras" />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {cameraAssignments.map((assignment) => (
                      <Box key={assignment.track_id} sx={{
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 500 }}>
                            {getTrackName(assignment.track_id, assignment.track_name)}
                          </Typography>
                          {assignment.shot_type && (
                            <Chip
                              label={formatShotLabel(assignment.shot_type)}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.63rem',
                                fontWeight: 600,
                                bgcolor: alpha('#7B61FF', 0.12),
                                color: 'rgba(255,255,255,0.7)',
                              }}
                            />
                          )}
                        </Box>
                        {assignment.subject_ids && assignment.subject_ids.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {assignment.subject_ids.map((id) => (
                              <Chip
                                key={id}
                                label={getSubjectName(id)}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  bgcolor: 'rgba(255,255,255,0.06)',
                                  color: 'rgba(255,255,255,0.55)',
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* Audio Tracks */}
            {audioTrackIds.length > 0 && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  <SectionLabel icon={<MicRoundedIcon sx={{ fontSize: 14 }} />} label="Audio" />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {audioTrackIds.map((trackId) => (
                      <Chip
                        key={trackId}
                        label={getTrackName(trackId)}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          bgcolor: 'rgba(78,205,196,0.12)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* Graphics */}
            {graphicsEnabled && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  <SectionLabel icon={<PaletteRoundedIcon sx={{ fontSize: 14 }} />} label="Graphics" />
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>
                    {graphicsTitle || 'Enabled'}
                  </Typography>
                </Box>
              </>
            )}

            {/* Music */}
            {music && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  <SectionLabel icon={<MusicNoteRoundedIcon sx={{ fontSize: 14 }} />} label="Music" />
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 500 }}>
                    {music.music_name || 'Untitled'}
                  </Typography>
                  {music.artist && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                      {music.artist}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* Subjects (moment-level) */}
            {moment.subjects && moment.subjects.length > 0 && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  <SectionLabel icon={<PeopleRoundedIcon sx={{ fontSize: 14 }} />} label="Subjects" />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {moment.subjects.map((s: any) => (
                      <Chip
                        key={s.subject_id || s.id}
                        label={s.subject?.name || s.name || getSubjectName(s.subject_id || s.id)}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          bgcolor: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.65)',
                        }}
                      />
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

/* ─── Helper Component ─── */

const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
    <Box sx={{ color: 'rgba(255,255,255,0.3)', display: 'flex' }}>{icon}</Box>
    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
  </Box>
);
