'use client';

import React, { useCallback } from 'react';
import {
  Typography,
  Box,
  Stack,
  Chip,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import type { FilmStructureTemplateScene } from '@/lib/types/domains/film-structure-templates';
import type { PackageActivityRecord, SceneSourceAssignment } from '../FilmCreationWizard';

interface SceneAssignmentStepProps {
  templateScenes: FilmStructureTemplateScene[];
  activities: PackageActivityRecord[];
  assignments: SceneSourceAssignment[];
  onAssignmentsChange: (assignments: SceneSourceAssignment[]) => void;
  disabled: boolean;
}

export function SceneAssignmentStep({
  templateScenes,
  activities,
  assignments,
  onAssignmentsChange,
  disabled,
}: SceneAssignmentStepProps) {

  const getAssignment = (sceneIndex: number): SceneSourceAssignment => {
    return assignments.find(a => a.sceneIndex === sceneIndex) || {
      sceneIndex,
      activityIds: [],
      momentIdsByActivity: {},
    };
  };

  const updateAssignment = useCallback((sceneIndex: number, update: Partial<SceneSourceAssignment>) => {
    const existing = assignments.find(a => a.sceneIndex === sceneIndex);
    if (existing) {
      onAssignmentsChange(assignments.map(a => a.sceneIndex === sceneIndex ? { ...a, ...update } : a));
    } else {
      onAssignmentsChange([...assignments, { sceneIndex, activityIds: [], momentIdsByActivity: {}, ...update }]);
    }
  }, [assignments, onAssignmentsChange]);

  const toggleActivity = (sceneIndex: number, activityId: number) => {
    const current = getAssignment(sceneIndex);
    const activityIds = current.activityIds.includes(activityId)
      ? current.activityIds.filter(id => id !== activityId)
      : [...current.activityIds, activityId];
    const momentIdsByActivity = { ...current.momentIdsByActivity };
    if (!activityIds.includes(activityId)) {
      delete momentIdsByActivity[activityId];
    }
    updateAssignment(sceneIndex, { activityIds, momentIdsByActivity });
  };

  const toggleMoment = (sceneIndex: number, activityId: number, momentId: number) => {
    const current = getAssignment(sceneIndex);
    const currentMoments = current.momentIdsByActivity[activityId] || [];
    const newMoments = currentMoments.includes(momentId)
      ? currentMoments.filter(id => id !== momentId)
      : [...currentMoments, momentId];
    updateAssignment(sceneIndex, {
      momentIdsByActivity: { ...current.momentIdsByActivity, [activityId]: newMoments },
    });
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
        >
          Assign Sources to Scenes
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', display: 'block', mt: 0.25 }}>
          For each scene, choose which activities provide footage. Expand to cherry-pick specific moments.
        </Typography>
      </Box>

      <Stack spacing={1} sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5 }}>
        {templateScenes.map((scene, sceneIdx) => {
          const assignment = getAssignment(sceneIdx);
          return (
            <Box
              key={scene.id}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(52, 58, 68, 0.3)',
                bgcolor: 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
              }}
            >
              {/* Scene header */}
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={sceneIdx + 1}
                    size="small"
                    sx={{ height: 20, width: 20, fontSize: '0.65rem', bgcolor: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#f1f5f9' }}>
                    {scene.name}
                  </Typography>
                  <Chip
                    label={scene.mode}
                    size="small"
                    sx={{
                      height: 18, fontSize: '0.6rem',
                      bgcolor: scene.mode === 'MONTAGE' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(100, 140, 255, 0.1)',
                      color: scene.mode === 'MONTAGE' ? '#a78bfa' : '#648CFF',
                    }}
                  />
                  {assignment.activityIds.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem', ml: 'auto' }}>
                      {assignment.activityIds.length} source{assignment.activityIds.length !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Activity list for this scene */}
              <Box sx={{ p: 1 }}>
                {activities.map((activity) => {
                  const isActivitySelected = assignment.activityIds.includes(activity.id);
                  const selectedMoments = assignment.momentIdsByActivity[activity.id] || [];
                  const hasMoments = (activity.moments?.length || 0) > 0;

                  return (
                    <Box key={activity.id}>
                      {hasMoments ? (
                        <Accordion
                          disableGutters
                          elevation={0}
                          sx={{
                            bgcolor: 'transparent',
                            '&:before': { display: 'none' },
                            '& .MuiAccordionSummary-root': { minHeight: 32, px: 0.5 },
                            '& .MuiAccordionDetails-root': { px: 2, pb: 1 },
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16, color: '#475569' }} />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: '100%' }}>
                              <Checkbox
                                checked={isActivitySelected}
                                disabled={disabled}
                                size="small"
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleActivity(sceneIdx, activity.id)}
                                sx={{ p: 0.25, color: 'rgba(100, 116, 139, 0.5)', '&.Mui-checked': { color: '#648CFF' } }}
                              />
                              <Typography variant="caption" sx={{ color: isActivitySelected ? '#f1f5f9' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                                {activity.name}
                              </Typography>
                              {selectedMoments.length > 0 && (
                                <Chip
                                  label={`${selectedMoments.length} moment${selectedMoments.length !== 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{ height: 16, fontSize: '0.58rem', bgcolor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', ml: 'auto' }}
                                />
                              )}
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={0.25}>
                              {(activity.moments || []).map((moment) => {
                                const isMomentSelected = selectedMoments.includes(moment.id);
                                return (
                                  <Box
                                    key={moment.id}
                                    onClick={() => !disabled && toggleMoment(sceneIdx, activity.id, moment.id)}
                                    sx={{
                                      display: 'flex', alignItems: 'center', gap: 0.5, py: 0.25,
                                      cursor: disabled ? 'default' : 'pointer',
                                    }}
                                  >
                                    <Checkbox
                                      checked={isMomentSelected}
                                      disabled={disabled}
                                      size="small"
                                      sx={{ p: 0.15, transform: 'scale(0.8)', color: 'rgba(100, 116, 139, 0.4)', '&.Mui-checked': { color: '#a78bfa' } }}
                                    />
                                    <Typography variant="caption" sx={{ color: isMomentSelected ? '#e2e8f0' : '#64748b', fontSize: '0.7rem' }}>
                                      {moment.name}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ) : (
                        <Box
                          onClick={() => !disabled && toggleActivity(sceneIdx, activity.id)}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5, px: 0.5, cursor: disabled ? 'default' : 'pointer' }}
                        >
                          <Checkbox
                            checked={isActivitySelected}
                            disabled={disabled}
                            size="small"
                            sx={{ p: 0.25, color: 'rgba(100, 116, 139, 0.5)', '&.Mui-checked': { color: '#648CFF' } }}
                          />
                          <Typography variant="caption" sx={{ color: isActivitySelected ? '#f1f5f9' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                            {activity.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
