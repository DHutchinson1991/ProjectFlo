import React from 'react';
import { Box, Typography, Chip, Stack, CircularProgress, IconButton, Select, MenuItem, TextField, Tooltip } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import WorkIcon from '@mui/icons-material/Work';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardData } from '../hooks/useWizardData';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { Crew } from '../types/wizard.types';
import { matchesRoleKeywords, CAMERA_ROLE_KEYWORDS, AUDIO_ROLE_KEYWORDS, getCrewName } from '../helpers/wizard-helpers';

interface CrewStepProps {
  state: WizardState;
  data: WizardData;
  handlers: WizardHandlers;
}

export default function CrewStep({ state, data, handlers }: CrewStepProps) {
  const { roleSlots, crewAssignments } = state;
  const { availableJobRoles, crew, loadingCrew, crewPresets, loadingCrewPresets } = data;

  const [selectedPresetId, setSelectedPresetId] = React.useState<number | ''>('');
  const [showSaveField, setShowSaveField] = React.useState(false);
  const [newPresetName, setNewPresetName] = React.useState('');
  const [savingPreset, setSavingPreset] = React.useState(false);

  const handleApplyPreset = (presetId: number) => {
    const preset = crewPresets.find((p) => p.id === presetId);
    if (!preset) return;
    handlers.applyCrewPreset(preset);
    setSelectedPresetId(presetId);
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    setSavingPreset(true);
    const created = await handlers.saveAsCrewPreset(newPresetName.trim());
    setSavingPreset(false);
    if (created) {
      setNewPresetName('');
      setShowSaveField(false);
      setSelectedPresetId(created.id);
    }
  };

  const handleDeletePreset = async (presetId: number) => {
    const ok = await handlers.deleteCrewPreset(presetId);
    if (ok && selectedPresetId === presetId) setSelectedPresetId('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Assign crew to positions</Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>
            {roleSlots.length > 0
              ? 'Pick who fills each role — or leave unassigned for now'
              : 'No roles defined. Pick a preset, go back to add roles, or skip.'}
          </Typography>
        </Box>

        {/* ── Preset picker (compact, top-right) ───────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <BookmarkBorderIcon sx={{ fontSize: '0.85rem', color: '#64748b' }} />
          <Select
            value={selectedPresetId}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setSelectedPresetId('');
              else handleApplyPreset(Number(v));
            }}
            size="small"
            displayEmpty
            disabled={loadingCrewPresets || crewPresets.length === 0}
            renderValue={(value) => {
              if (!value) {
                return (
                  <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.7rem' }}>
                    {crewPresets.length === 0 ? 'No presets' : 'Preset…'}
                  </span>
                );
              }
              const p = crewPresets.find((cp) => cp.id === value);
              return <span style={{ fontSize: '0.7rem' }}>{p?.name ?? 'Preset'}</span>;
            }}
            sx={{
              minWidth: 120, height: 24, color: '#cbd5e1',
              fontSize: '0.7rem', bgcolor: 'transparent',
              '& .MuiSelect-select': { py: 0, pl: 1, pr: '22px !important' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
              '& .MuiSelect-icon': { color: '#64748b', fontSize: '1rem', right: 2 },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                  '& .MuiMenuItem-root': {
                    color: '#cbd5e1', fontSize: '0.7rem',
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' },
                  },
                },
              },
            }}
          >
            <MenuItem value=""><em style={{ color: '#64748b' }}>Clear</em></MenuItem>
            {crewPresets.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}{p.is_default ? ' ★' : ''}
                <Typography component="span" sx={{ color: '#64748b', fontSize: '0.6rem', ml: 0.75 }}>
                  {p.slots.length}
                </Typography>
              </MenuItem>
            ))}
          </Select>
          {selectedPresetId !== '' && (
            <Tooltip title="Delete this preset">
              <IconButton
                size="small"
                onClick={() => handleDeletePreset(Number(selectedPresetId))}
                sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: '0.85rem' }} />
              </IconButton>
            </Tooltip>
          )}
          {!showSaveField ? (
            <Tooltip title={roleSlots.length === 0 ? 'Add roles first' : 'Save current setup as a preset'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => setShowSaveField(true)}
                  disabled={roleSlots.length === 0}
                  sx={{
                    p: 0.25, color: '#818cf8',
                    '&:hover': { color: '#a5b4fc' },
                    '&.Mui-disabled': { color: '#334155' },
                  }}
                >
                  <SaveOutlinedIcon sx={{ fontSize: '0.85rem' }} />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <TextField
                size="small"
                placeholder="Name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset();
                  if (e.key === 'Escape') { setShowSaveField(false); setNewPresetName(''); }
                }}
                autoFocus
                sx={{
                  width: 110,
                  '& .MuiInputBase-root': { color: '#cbd5e1', fontSize: '0.7rem', height: 24, bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiInputBase-input': { py: 0, px: 1 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' },
                }}
              />
              <Tooltip title="Save preset">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim() || savingPreset}
                    sx={{ p: 0.25, color: '#22d3ee', '&.Mui-disabled': { color: '#334155' } }}
                  >
                    <SaveOutlinedIcon sx={{ fontSize: '0.85rem' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>

        {crewAssignments.length > 0 && (
          <Chip label={`${crewAssignments.length}/${roleSlots.reduce((s, r) => s + r.quantity, 0)} filled`} size="small"
            sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'none', flexShrink: 0 }} />
        )}
      </Box>

      {loadingCrew && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
          <CircularProgress size={18} sx={{ color: '#818cf8' }} />
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>Loading crew...</Typography>
        </Box>
      )}

      {!loadingCrew && roleSlots.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <GroupsIcon sx={{ fontSize: '2rem', color: '#334155', mb: 1 }} />
          <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>No positions defined yet. You can go back and add roles, or skip this step.</Typography>
        </Box>
      )}

      {!loadingCrew && roleSlots.length > 0 && (
        <Stack spacing={2}>
          {roleSlots.map((slot) => {
            const role = availableJobRoles.find((r) => r.id === slot.jobRoleId);
            if (!role) return null;
            const roleName = role.display_name || role.name;
            const roleColor = matchesRoleKeywords(role, CAMERA_ROLE_KEYWORDS) ? '#fb923c'
              : matchesRoleKeywords(role, AUDIO_ROLE_KEYWORDS) ? '#22d3ee'
              : '#818cf8';

            const eligibleCrew = crew.filter((cm: Crew) =>
              cm.job_role_assignments?.some((r: { job_role: { id: number } }) => r.job_role.id === slot.jobRoleId),
            );

            return (
              <Box key={slot.jobRoleId}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <WorkIcon sx={{ fontSize: '0.85rem', color: roleColor }} />
                  <Typography sx={{ color: roleColor, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    {roleName}
                  </Typography>
                  {role.category && <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>({role.category})</Typography>}
                </Box>
                <Stack spacing={0.5}>
                  {Array.from({ length: slot.quantity }, (_, posIndex) => {
                    const assignedCrewId = handlers.getPositionCrewId(slot.jobRoleId, posIndex);
                    const assignedCrew = assignedCrewId ? crew.find((cm: Crew) => cm.id === assignedCrewId) : null;

                    return (
                      <Box key={`${slot.jobRoleId}-${posIndex}`} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.75,
                        borderRadius: 1.5,
                        bgcolor: assignedCrew ? `${roleColor}08` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${assignedCrew ? `${roleColor}25` : 'rgba(148,163,184,0.1)'}`,
                      }}>
                        <Typography sx={{ color: roleColor, fontSize: '0.7rem', fontWeight: 600, minWidth: 70 }}>
                          {roleName} {slot.quantity > 1 ? posIndex + 1 : ''}
                        </Typography>
                        <Select
                          value={assignedCrewId || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handlers.assignCrewToPosition(slot.jobRoleId, posIndex, val || null);
                          }}
                          size="small" displayEmpty
                          sx={{
                            flex: 1, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)', height: 34,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: roleColor },
                            '& .MuiSelect-icon': { color: '#64748b' },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                                '& .MuiMenuItem-root': {
                                  color: '#cbd5e1', fontSize: '0.75rem',
                                  '&:hover': { bgcolor: `${roleColor}15` },
                                  '&.Mui-selected': { bgcolor: `${roleColor}20` },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value={0}><em style={{ color: '#64748b' }}>Unassigned</em></MenuItem>
                          {eligibleCrew.map((cm: Crew) => {
                            const assignedCount = crewAssignments.filter((a) => a.crewId === cm.id).length;
                            const isCurrentPos = cm.id === assignedCrewId;
                            return (
                              <MenuItem key={cm.id} value={cm.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 20, height: 20, borderRadius: '50%', bgcolor: `${cm.crew_color || '#818cf8'}20`,
                                    border: `1.5px solid ${cm.crew_color || '#818cf8'}50`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  }}>
                                    <Typography sx={{ color: cm.crew_color || '#818cf8', fontSize: '0.55rem', fontWeight: 700 }}>
                                      {getCrewName(cm).charAt(0).toUpperCase()}
                                    </Typography>
                                  </Box>
                                  {getCrewName(cm)}
                                  {assignedCount > 0 && !isCurrentPos && (
                                    <Typography component="span" sx={{ fontSize: '0.6rem', color: '#64748b', ml: 0.5 }}>
                                      ({assignedCount} role{assignedCount > 1 ? 's' : ''})
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            );
                          })}
                          {eligibleCrew.length === 0 && (
                            <MenuItem disabled><em style={{ color: '#475569' }}>No crew with this role</em></MenuItem>
                          )}
                        </Select>
                        {assignedCrew && (
                          <IconButton size="small" onClick={() => handlers.assignCrewToPosition(slot.jobRoleId, posIndex, null)}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                            <RemoveCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
