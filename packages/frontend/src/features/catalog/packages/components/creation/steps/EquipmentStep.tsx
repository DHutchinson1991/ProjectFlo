import React from 'react';
import { Box, Typography, Chip, Stack, CircularProgress, IconButton, Select, MenuItem, TextField, Tooltip } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardData } from '../hooks/useWizardData';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { EquipmentItem } from '../types/wizard.types';

interface EquipmentStepProps {
  state: WizardState;
  data: WizardData;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

export default function EquipmentStep({ state, data, derived, handlers }: EquipmentStepProps) {
  const { cameraSlots, audioSlots } = state;
  const { loadingEquipment, equipmentPresets, loadingEquipmentPresets } = data;
  const { cameraEquipment, audioEquipment, selectedCameraEquipmentIds, selectedAudioEquipmentIds, cameraCrewOptions, audioCrewOptions } = derived;

  const [selectedPresetId, setSelectedPresetId] = React.useState<number | ''>('');
  const [showSaveField, setShowSaveField] = React.useState(false);
  const [newPresetName, setNewPresetName] = React.useState('');
  const [savingPreset, setSavingPreset] = React.useState(false);

  const hasConfiguredSlots = cameraSlots.some((slot) => slot.equipmentId || slot.assignedCrewId || slot.assignedJobRoleId)
    || audioSlots.some((slot) => slot.equipmentId || slot.assignedCrewId || slot.assignedJobRoleId)
    || cameraSlots.length > 1
    || audioSlots.length > 0;

  const handleApplyPreset = (presetId: number) => {
    const preset = equipmentPresets.find((p) => p.id === presetId);
    if (!preset) return;
    handlers.applyEquipmentPreset(preset);
    setSelectedPresetId(presetId);
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    setSavingPreset(true);
    const created = await handlers.saveAsEquipmentPreset(newPresetName.trim());
    setSavingPreset(false);
    if (created) {
      setNewPresetName('');
      setShowSaveField(false);
      setSelectedPresetId(created.id);
    }
  };

  const handleDeletePreset = async (presetId: number) => {
    const ok = await handlers.deleteEquipmentPreset(presetId);
    if (ok && selectedPresetId === presetId) setSelectedPresetId('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Assign cameras and audio equipment</Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>
            Set up numbered slots, pick specific gear, or save a reusable preset
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <BookmarkBorderIcon sx={{ fontSize: '0.85rem', color: '#64748b' }} />
          <Select
            value={selectedPresetId}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') setSelectedPresetId('');
              else handleApplyPreset(Number(value));
            }}
            size="small"
            displayEmpty
            disabled={loadingEquipmentPresets || equipmentPresets.length === 0}
            renderValue={(value) => {
              if (!value) {
                return (
                  <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.7rem' }}>
                    {equipmentPresets.length === 0 ? 'No presets' : 'Preset…'}
                  </span>
                );
              }
              const preset = equipmentPresets.find((entry) => entry.id === value);
              return <span style={{ fontSize: '0.7rem' }}>{preset?.name ?? 'Preset'}</span>;
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
            {equipmentPresets.map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                {preset.name}{preset.is_default ? ' ★' : ''}
                <Typography component="span" sx={{ color: '#64748b', fontSize: '0.6rem', ml: 0.75 }}>
                  {preset.slots.length}
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
            <Tooltip title={hasConfiguredSlots ? 'Save current setup as a preset' : 'Add equipment or crew assignment first'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => setShowSaveField(true)}
                  disabled={!hasConfiguredSlots}
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
      </Box>

      {loadingEquipment && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
          <CircularProgress size={18} sx={{ color: '#fb923c' }} />
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>Loading equipment...</Typography>
        </Box>
      )}

      {!loadingEquipment && (
        <Stack spacing={3}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraAltIcon sx={{ fontSize: '1rem', color: '#fb923c' }} />
                <Typography sx={{ color: '#fb923c', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Cameras</Typography>
                <Chip label={`${cameraSlots.filter((s) => s.equipmentId).length}/${cameraSlots.length}`} size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(251,146,60,0.12)', color: '#fb923c', border: 'none' }} />
              </Box>
              <Box component="button" onClick={handlers.addCameraSlot}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, bgcolor: 'transparent',
                  border: '1px solid rgba(251,146,60,0.3)', borderRadius: 0.75, color: '#fb923c', cursor: 'pointer',
                  fontSize: '0.65rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(251,146,60,0.08)' } }}>
                <AddIcon sx={{ fontSize: '0.75rem' }} /> Add Camera
              </Box>
            </Box>
            <Stack spacing={0.75}>
              {cameraSlots.map((slot) => (
                <Box key={slot.slotNumber} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.75,
                  borderRadius: 1.5, bgcolor: slot.equipmentId ? 'rgba(251,146,60,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${slot.equipmentId ? 'rgba(251,146,60,0.2)' : 'rgba(148,163,184,0.1)'}`, flexWrap: 'wrap',
                }}>
                  <Typography sx={{ color: '#fb923c', fontSize: '0.75rem', fontWeight: 700, minWidth: 75 }}>Camera {slot.slotNumber}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => handlers.moveCameraSlot(slot.slotNumber, 'up')} disabled={slot.slotNumber === 1}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#fb923c' }, '&.Mui-disabled': { color: 'rgba(100,116,139,0.35)' } }}>
                      <ArrowUpwardIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handlers.moveCameraSlot(slot.slotNumber, 'down')} disabled={slot.slotNumber === cameraSlots.length}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#fb923c' }, '&.Mui-disabled': { color: 'rgba(100,116,139,0.35)' } }}>
                      <ArrowDownwardIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                  </Box>
                  <Select value={slot.equipmentId || 0} onChange={(e) => handlers.updateCameraSlot(slot.slotNumber, Number(e.target.value) || null)}
                    size="small" displayEmpty
                    sx={{ flex: 1, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)', height: 32,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fb923c' },
                      '& .MuiSelect-icon': { color: '#64748b' } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                      '& .MuiMenuItem-root': { color: '#cbd5e1', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(251,146,60,0.1)' }, '&.Mui-selected': { bgcolor: 'rgba(251,146,60,0.15)' } } } } }}>
                    <MenuItem value={0}><em style={{ color: '#64748b' }}>Select camera...</em></MenuItem>
                    {cameraEquipment.map((eq: EquipmentItem) => {
                      const alreadyUsedInOtherSlot = selectedCameraEquipmentIds.has(eq.id) && slot.equipmentId !== eq.id;
                      return (
                        <MenuItem key={eq.id} value={eq.id} disabled={alreadyUsedInOtherSlot}
                          sx={alreadyUsedInOtherSlot ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
                          {eq.item_name}{eq.brand_name ? ` (${eq.brand_name})` : ''}{eq.model ? ` ${eq.model}` : ''}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Select value={slot.assignedCrewId && slot.assignedJobRoleId ? `${slot.assignedCrewId}:${slot.assignedJobRoleId}` : ''}
                    onChange={(e) => handlers.updateSlotAssignment('CAMERA', slot.slotNumber, String(e.target.value))}
                    size="small" displayEmpty
                    sx={{ minWidth: 220, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)', height: 32,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fb923c' },
                      '& .MuiSelect-icon': { color: '#64748b' } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                      '& .MuiMenuItem-root': { color: '#cbd5e1', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(251,146,60,0.1)' }, '&.Mui-selected': { bgcolor: 'rgba(251,146,60,0.15)' } } } } }}>
                    <MenuItem value=""><em style={{ color: '#64748b' }}>No crew yet</em></MenuItem>
                    {cameraCrewOptions.map((option) => (
                      <MenuItem key={`cam-op-${option.crewId}-${option.jobRoleId}`} value={`${option.crewId}:${option.jobRoleId}`}>{option.label}</MenuItem>
                    ))}
                  </Select>
                  {cameraSlots.length > 1 && (
                    <IconButton size="small" onClick={() => handlers.removeCameraSlot(slot.slotNumber)}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                      <RemoveCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Stack>
            {cameraEquipment.length === 0 && (
              <Typography sx={{ color: '#475569', fontSize: '0.7rem', fontStyle: 'italic', mt: 0.5, pl: 1 }}>No cameras in your equipment inventory yet.</Typography>
            )}
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MicIcon sx={{ fontSize: '1rem', color: '#22d3ee' }} />
                <Typography sx={{ color: '#22d3ee', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Audio</Typography>
                <Chip label={`${audioSlots.filter((s) => s.equipmentId).length}/${audioSlots.length}`} size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: 'none' }} />
              </Box>
              <Box component="button" onClick={handlers.addAudioSlot}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, bgcolor: 'transparent',
                  border: '1px solid rgba(34,211,238,0.3)', borderRadius: 0.75, color: '#22d3ee', cursor: 'pointer',
                  fontSize: '0.65rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(34,211,238,0.08)' } }}>
                <AddIcon sx={{ fontSize: '0.75rem' }} /> Add Audio
              </Box>
            </Box>
            <Stack spacing={0.75}>
              {audioSlots.map((slot) => (
                <Box key={slot.slotNumber} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.75,
                  borderRadius: 1.5, bgcolor: slot.equipmentId ? 'rgba(34,211,238,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${slot.equipmentId ? 'rgba(34,211,238,0.2)' : 'rgba(148,163,184,0.1)'}`, flexWrap: 'wrap',
                }}>
                  <Typography sx={{ color: '#22d3ee', fontSize: '0.75rem', fontWeight: 700, minWidth: 75 }}>Audio {slot.slotNumber}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => handlers.moveAudioSlot(slot.slotNumber, 'up')} disabled={slot.slotNumber === 1}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#22d3ee' }, '&.Mui-disabled': { color: 'rgba(100,116,139,0.35)' } }}>
                      <ArrowUpwardIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handlers.moveAudioSlot(slot.slotNumber, 'down')} disabled={slot.slotNumber === audioSlots.length}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#22d3ee' }, '&.Mui-disabled': { color: 'rgba(100,116,139,0.35)' } }}>
                      <ArrowDownwardIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                  </Box>
                  <Select value={slot.equipmentId || 0} onChange={(e) => handlers.updateAudioSlot(slot.slotNumber, Number(e.target.value) || null)}
                    size="small" displayEmpty
                    sx={{ flex: 1, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)', height: 32,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#22d3ee' },
                      '& .MuiSelect-icon': { color: '#64748b' } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                      '& .MuiMenuItem-root': { color: '#cbd5e1', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(34,211,238,0.1)' }, '&.Mui-selected': { bgcolor: 'rgba(34,211,238,0.15)' } } } } }}>
                    <MenuItem value={0}><em style={{ color: '#64748b' }}>Select audio device...</em></MenuItem>
                    {audioEquipment.map((eq: EquipmentItem) => {
                      const alreadyUsedInOtherSlot = selectedAudioEquipmentIds.has(eq.id) && slot.equipmentId !== eq.id;
                      return (
                        <MenuItem key={eq.id} value={eq.id} disabled={alreadyUsedInOtherSlot}
                          sx={alreadyUsedInOtherSlot ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
                          {eq.item_name}{eq.brand_name ? ` (${eq.brand_name})` : ''}{eq.model ? ` ${eq.model}` : ''}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Select value={slot.assignedCrewId && slot.assignedJobRoleId ? `${slot.assignedCrewId}:${slot.assignedJobRoleId}` : ''}
                    onChange={(e) => handlers.updateSlotAssignment('AUDIO', slot.slotNumber, String(e.target.value))}
                    size="small" displayEmpty
                    sx={{ minWidth: 220, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)', height: 32,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#22d3ee' },
                      '& .MuiSelect-icon': { color: '#64748b' } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                      '& .MuiMenuItem-root': { color: '#cbd5e1', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(34,211,238,0.1)' }, '&.Mui-selected': { bgcolor: 'rgba(34,211,238,0.15)' } } } } }}>
                    <MenuItem value=""><em style={{ color: '#64748b' }}>No crew yet</em></MenuItem>
                    {audioCrewOptions.map((option) => (
                      <MenuItem key={`aud-op-${option.crewId}-${option.jobRoleId}`} value={`${option.crewId}:${option.jobRoleId}`}>{option.label}</MenuItem>
                    ))}
                  </Select>
                  {audioSlots.length > 1 && (
                    <IconButton size="small" onClick={() => handlers.removeAudioSlot(slot.slotNumber)}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                      <RemoveCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Stack>
            {audioEquipment.length === 0 && (
              <Typography sx={{ color: '#475569', fontSize: '0.7rem', fontStyle: 'italic', mt: 0.5, pl: 1 }}>No audio equipment in your inventory yet.</Typography>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
}
