import React from 'react';
import { Box, Typography, Chip, Stack, TextField, Button, Collapse, Tooltip, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import { getPresetTime, getPresetDuration } from '../helpers/wizard-helpers';
import { listRowSx, checkboxSx, miniInputSx, sectionBtnSx } from '../helpers/wizard-styles';

interface ActivitiesStepProps {
  state: WizardState;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

export default function ActivitiesStep({ state, derived, handlers }: ActivitiesStepProps) {
  const {
    selectedEventType, selectedPresetIds, selectedDayIds,
    presetTimeOverrides, presetDurationOverrides,
    customActivities, addingActivityForDay, newActivityName, sourceDayBlueprintVersionId,
  } = state;
  const { selectedDays, totalPresetsInSelectedDays, accent } = derived;

  if (!selectedEventType) return null;

  if (sourceDayBlueprintVersionId !== null) {
    return (
      <Box>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 1.5 }}>
          Activities are sourced from your selected blueprint
        </Typography>
        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
          <Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
            Blueprint version #{sourceDayBlueprintVersionId} will define package days, activities, moments, and actions during create.
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.75 }}>
            This step stays for transparency, but manual template activity picks are disabled in blueprint mode.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select activities to include</Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>Set start times and durations for each activity</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={`${selectedPresetIds.size + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length}/${totalPresetsInSelectedDays + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length}`} size="small"
            sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'none' }} />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box component="button" onClick={handlers.selectAllActivities} sx={sectionBtnSx('#10b981')}>Select All</Box>
            <Box component="button" onClick={handlers.deselectAllActivities}
              sx={{ ...sectionBtnSx('#64748b'), borderColor: 'rgba(255,255,255,0.1)' }}>None</Box>
          </Box>
        </Box>
      </Box>

      {selectedDays.length === 0 && (
        <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>Go back and select at least one event day first.</Typography>
      )}

      <Stack spacing={2.5}>
        {selectedDays.map((link) => {
          const day = link.event_day_template;
          const dayCustom = customActivities.filter((ca) => ca.dayLinkId === link.id);
          if (!day.activity_presets?.length && dayCustom.length === 0) return null;
          return (
            <Box key={link.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {day.name}
                </Typography>
                <Box component="button" onClick={() => { state.setAddingActivityForDay(addingActivityForDay === link.id ? null : link.id); state.setNewActivityName(''); }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, bgcolor: 'transparent',
                    border: '1px solid rgba(148,163,184,0.2)', borderRadius: 0.75, color: '#94a3b8', cursor: 'pointer',
                    fontSize: '0.65rem', fontWeight: 500, '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', color: '#fff' } }}>
                  <AddIcon sx={{ fontSize: '0.75rem' }} /> Add Activity
                </Box>
              </Box>

              <Collapse in={addingActivityForDay === link.id}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, p: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.12)' }}>
                  <TextField value={newActivityName} onChange={(e) => state.setNewActivityName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlers.handleAddCustomActivity(link.id); if (e.key === 'Escape') state.setAddingActivityForDay(null); }}
                    placeholder="Activity name..." size="small" autoFocus fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { color: '#fff', fontSize: '0.8rem', bgcolor: 'transparent',
                      '& fieldset': { borderColor: 'rgba(148,163,184,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.4)' }, '&.Mui-focused fieldset': { borderColor: accent } } }} />
                  <Button onClick={() => handlers.handleAddCustomActivity(link.id)} disabled={!newActivityName.trim()} size="small"
                    sx={{ color: '#10b981', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto', px: 1.5 }}>Add</Button>
                </Box>
              </Collapse>

              <Stack spacing={0.5}>
                {day.activity_presets.map((preset) => {
                  const sel = selectedPresetIds.has(preset.id);
                  const pColor = preset.color || '#10b981';
                  const startTime = getPresetTime(preset, presetTimeOverrides);
                  const duration = getPresetDuration(preset, presetDurationOverrides);

                  return (
                    <Box key={preset.id} sx={listRowSx(sel, pColor)}>
                      <Box onClick={() => handlers.togglePreset(preset.id)} sx={checkboxSx(sel, pColor)}>
                        {sel && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                      </Box>
                      <Typography onClick={() => handlers.togglePreset(preset.id)}
                        sx={{ color: sel ? '#e2e8f0' : '#94a3b8', fontSize: '0.82rem', fontWeight: sel ? 600 : 400, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                        {preset.name}
                      </Typography>
                      {sel ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Start time" arrow>
                            <TextField type="time" size="small" value={startTime}
                              onChange={(e) => state.setPresetTimeOverrides((prev) => ({ ...prev, [preset.id]: e.target.value }))}
                              sx={{ ...miniInputSx(accent), width: 110 }}
                              InputProps={{ startAdornment: <AccessTimeIcon sx={{ fontSize: '0.7rem', color: '#475569', mr: 0.5 }} /> }} />
                          </Tooltip>
                          <Tooltip title="Duration (min)" arrow>
                            <TextField type="number" size="small" value={duration}
                              onChange={(e) => state.setPresetDurationOverrides((prev) => ({ ...prev, [preset.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                              sx={{ ...miniInputSx(accent), width: 68 }}
                              inputProps={{ min: 1, step: 5 }} />
                          </Tooltip>
                          <Typography sx={{ color: '#475569', fontSize: '0.6rem', width: 20 }}>min</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ width: 214, flexShrink: 0 }} />
                      )}
                    </Box>
                  );
                })}

                {dayCustom.map((ca) => (
                  <Box key={ca.tempId} sx={listRowSx(true, '#818cf8')}>
                    <Box sx={checkboxSx(true, '#818cf8')}><CheckCircleIcon sx={{ fontSize: '0.7rem' }} /></Box>
                    <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, flex: 1, minWidth: 0 }}>{ca.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <TextField type="time" size="small" value={ca.startTime}
                        onChange={(e) => handlers.updateCustomActivity(ca.tempId, { startTime: e.target.value })}
                        sx={{ ...miniInputSx(accent), width: 110 }}
                        InputProps={{ startAdornment: <AccessTimeIcon sx={{ fontSize: '0.7rem', color: '#475569', mr: 0.5 }} /> }} />
                      <TextField type="number" size="small" value={ca.durationMinutes}
                        onChange={(e) => handlers.updateCustomActivity(ca.tempId, { durationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                        sx={{ ...miniInputSx(accent), width: 68 }} inputProps={{ min: 1, step: 5 }} />
                      <Typography sx={{ color: '#475569', fontSize: '0.6rem', width: 20 }}>min</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handlers.handleRemoveCustomActivity(ca.tempId)}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' }, flexShrink: 0 }}>
                      <DeleteOutlineIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
