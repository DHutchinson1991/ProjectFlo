'use client';

import React from 'react';
import {
  Typography,
  Box,
  Stack,
  CircularProgress,
  Chip,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';

import { FilmType } from '@/lib/types/domains/film';
import type { FilmStructureTemplate } from '@/lib/types/domains/film-structure-templates';
import { useFilmStructureTemplates } from '@/hooks/films/useFilmStructureTemplates';

interface StructureTemplateStepProps {
  brandId?: number;
  filmType: FilmType;
  selectedTemplate: FilmStructureTemplate | null;
  onSelectTemplate: (template: FilmStructureTemplate) => void;
  disabled: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function StructureTemplateStep({
  brandId,
  filmType,
  selectedTemplate,
  onSelectTemplate,
  disabled,
}: StructureTemplateStepProps) {
  const { templates, isLoading } = useFilmStructureTemplates(brandId, filmType);
  const activeTemplates = templates.filter(t => t.is_active);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ color: '#648CFF' }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
        >
          Scene Structure
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', display: 'block', mt: 0.25 }}>
          Choose a template that defines the scenes for your film.
        </Typography>
      </Box>

      {activeTemplates.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px dashed rgba(52, 58, 68, 0.4)' }}>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>
            No structure templates available for {filmType} films.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {activeTemplates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id;
            const scenes = (template.scenes ?? []).sort((a, b) => a.order_index - b.order_index);
            const totalDuration = scenes.reduce((sum, s) => sum + (s.suggested_duration_seconds || 0), 0);

            return (
              <Box
                key={template.id}
                onClick={() => !disabled && onSelectTemplate(template)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: disabled ? 'default' : 'pointer',
                  bgcolor: isSelected ? 'rgba(100, 140, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(100, 140, 255, 0.3)' : 'rgba(52, 58, 68, 0.2)'}`,
                  transition: 'all 0.15s ease',
                  '&:hover': !disabled ? {
                    bgcolor: isSelected ? 'rgba(100, 140, 255, 0.12)' : 'rgba(255,255,255,0.04)',
                  } : undefined,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <ViewListIcon sx={{ fontSize: 16, color: isSelected ? '#648CFF' : '#475569' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#f1f5f9' : '#94a3b8', flex: 1 }}>
                    {template.name}
                  </Typography>
                  {template.is_system_seeded && (
                    <Chip label="System" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(52, 58, 68, 0.3)', color: '#64748b' }} />
                  )}
                  {isSelected && (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#648CFF', flexShrink: 0 }} />
                  )}
                </Box>

                {template.description && (
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block', mb: 0.75 }}>
                    {template.description}
                  </Typography>
                )}

                {/* Scene preview */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {scenes.map((scene, idx) => (
                    <Chip
                      key={scene.id}
                      label={`${idx + 1}. ${scene.name}${scene.suggested_duration_seconds ? ` (${formatDuration(scene.suggested_duration_seconds)})` : ''}`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        bgcolor: scene.mode === 'MONTAGE' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(100, 140, 255, 0.1)',
                        color: scene.mode === 'MONTAGE' ? '#a78bfa' : '#648CFF',
                        border: `1px solid ${scene.mode === 'MONTAGE' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(100, 140, 255, 0.2)'}`,
                      }}
                    />
                  ))}
                </Box>

                {totalDuration > 0 && (
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                    Total: ~{formatDuration(totalDuration)} · {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
