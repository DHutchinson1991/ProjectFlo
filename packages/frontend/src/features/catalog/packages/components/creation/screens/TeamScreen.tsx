'use client';

import React from 'react';
import {
  Box, Typography, Chip, Stack, CircularProgress, IconButton, Select, MenuItem,
  TextField, Tooltip, Collapse, Divider,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import WorkIcon from '@mui/icons-material/Work';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardData } from '../hooks/useWizardData';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { Crew, EquipmentItem, JobRole } from '../types/wizard.types';
import {
  matchesRoleKeywords, CAMERA_ROLE_KEYWORDS, AUDIO_ROLE_KEYWORDS, getCrewName,
} from '../helpers/wizard-helpers';
import { listRowSx } from '../helpers/wizard-styles';

interface TeamScreenProps {
  state: WizardState;
  data: WizardData;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

type RoleKind = 'CAMERA' | 'AUDIO' | 'OTHER';

const roleKind = (role: { display_name?: string; name?: string } | null | undefined): RoleKind => {
  if (matchesRoleKeywords(role, CAMERA_ROLE_KEYWORDS)) return 'CAMERA';
  if (matchesRoleKeywords(role, AUDIO_ROLE_KEYWORDS)) return 'AUDIO';
  return 'OTHER';
};

const roleColorFor = (kind: RoleKind) =>
  kind === 'CAMERA' ? '#fb923c' : kind === 'AUDIO' ? '#22d3ee' : '#818cf8';

/**
 * Screen 4 — Crew & equipment. Role-first: each position picks a crew member, and
 * camera/audio positions also pick their kit. A single "team preset" stores the
 * whole setup (positions + crew + equipment).
 */
export default function TeamScreen({ state, data, derived, handlers }: TeamScreenProps) {
  const { roleSlots, crewAssignments } = state;
  const { availableJobRoles, crew, loadingCrew, loadingRoles, crewPresets, loadingCrewPresets, equipmentItems } = data;
  const { cameraEquipment, audioEquipment } = derived;

  const [selectedPresetId, setSelectedPresetId] = React.useState<number | ''>('');
  const [showSaveField, setShowSaveField] = React.useState(false);
  const [newPresetName, setNewPresetName] = React.useState('');
  const [savingPreset, setSavingPreset] = React.useState(false);
  const [showAddRole, setShowAddRole] = React.useState(false);

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

  React.useEffect(() => {
    if (selectedPresetId !== '' || loadingCrewPresets || crewPresets.length === 0) return;
    const defaultPreset = crewPresets.find((preset) => preset.is_default);
    if (defaultPreset) setSelectedPresetId(defaultPreset.id);
  }, [selectedPresetId, loadingCrewPresets, crewPresets]);

  // Equipment already assigned elsewhere (so the same item can't be double-booked).
  const usedEquipment = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const slot of roleSlots) {
      for (let posIndex = 0; posIndex < slot.quantity; posIndex++) {
        const eqSlots = handlers.getPositionEquipmentSlots(slot.jobRoleId, posIndex);
        eqSlots.forEach((eqId, eqIndex) => {
          if (eqId) map.set(eqId, `${slot.jobRoleId}:${posIndex}:${eqIndex}`);
        });
      }
    }
    return map;
  }, [roleSlots, state.positionEquipment, handlers]);

  const filledPositions = crewAssignments.length;
  const totalPositions = roleSlots.reduce((s, r) => s + r.quantity, 0);

  const loading = loadingCrew || loadingRoles;

  return (
    <Box>
      {/* Header + unified team preset */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Build your delivery team</Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>
            Pick a position, who fills it, and the kit for camera &amp; sound roles — or load a saved team.
          </Typography>
        </Box>

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
                    {crewPresets.length === 0 ? 'No team presets' : 'Team preset…'}
                  </span>
                );
              }
              const p = crewPresets.find((cp) => cp.id === value);
              return <span style={{ fontSize: '0.7rem' }}>{p?.name ?? 'Team preset'}</span>;
            }}
            sx={{
              minWidth: 140, height: 24, color: '#cbd5e1',
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
            <Tooltip title="Delete this team preset">
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
            <Tooltip title={roleSlots.length === 0 ? 'Add a position first' : 'Save this team as a preset'}>
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
              <Tooltip title="Save team preset">
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

        {totalPositions > 0 && (
          <Chip label={`${filledPositions}/${totalPositions} filled`} size="small"
            sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'none', flexShrink: 0 }} />
        )}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
          <CircularProgress size={18} sx={{ color: '#818cf8' }} />
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>Loading team…</Typography>
        </Box>
      )}

      {!loading && roleSlots.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <GroupsIcon sx={{ fontSize: '2rem', color: '#334155', mb: 1 }} />
          <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>
            No positions yet. Add a role below or load a team preset.
          </Typography>
        </Box>
      )}

      {!loading && roleSlots.length > 0 && (
        <Stack spacing={2}>
          {roleSlots.map((slot) => {
            const role = availableJobRoles.find((r) => r.id === slot.jobRoleId);
            if (!role) return null;
            const roleName = role.display_name || role.name;
            const kind = roleKind(role);
            const color = roleColorFor(kind);
            const hasEquipment = kind !== 'OTHER';
            const equipmentList: EquipmentItem[] = kind === 'CAMERA' ? cameraEquipment : kind === 'AUDIO' ? audioEquipment : [];

            const eligibleCrew = crew.filter((cm: Crew) =>
              cm.job_role_assignments?.some((r: { job_role: { id: number } }) => r.job_role.id === slot.jobRoleId),
            );

            return (
              <Box key={slot.jobRoleId}>
                {/* Role header with quantity stepper + remove */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  {kind === 'CAMERA' ? <CameraAltIcon sx={{ fontSize: '0.85rem', color }} />
                    : kind === 'AUDIO' ? <MicIcon sx={{ fontSize: '0.85rem', color }} />
                    : <WorkIcon sx={{ fontSize: '0.85rem', color }} />}
                  <Typography sx={{ color, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    {roleName}
                  </Typography>
                  {role.category && <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>({role.category})</Typography>}
                  <Box sx={{ flex: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handlers.removeRoleSlot(slot.jobRoleId)}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                      <RemoveCircleOutlineIcon sx={{ fontSize: '0.95rem' }} />
                    </IconButton>
                    <Typography sx={{ color, fontWeight: 700, fontSize: '0.85rem', minWidth: 18, textAlign: 'center' }}>
                      {slot.quantity}
                    </Typography>
                    <IconButton size="small" onClick={() => handlers.addRoleSlot(slot.jobRoleId)}
                      sx={{ p: 0.25, color: '#64748b', '&:hover': { color } }}>
                      <AddIcon sx={{ fontSize: '0.95rem' }} />
                    </IconButton>
                  </Box>
                </Box>

                <Stack spacing={0.5}>
                  {Array.from({ length: slot.quantity }, (_, posIndex) => {
                    const assignedCrewId = handlers.getPositionCrewId(slot.jobRoleId, posIndex);
                    const assignedCrew = assignedCrewId ? crew.find((cm: Crew) => cm.id === assignedCrewId) : null;
                    const equipmentSlots = handlers.getPositionEquipmentSlots(slot.jobRoleId, posIndex);
                    const hasAssignedEquipment = equipmentSlots.some((id) => id != null);
                    const posKey = `${slot.jobRoleId}:${posIndex}`;

                    return (
                      <Box key={posKey} sx={{
                        display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 1.5, py: 0.75, flexWrap: 'wrap',
                        borderRadius: 1.5,
                        bgcolor: assignedCrew ? `${color}08` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${assignedCrew ? `${color}25` : 'rgba(148,163,184,0.1)'}`,
                      }}>
                        <Typography sx={{ color, fontSize: '0.7rem', fontWeight: 600, minWidth: 70, pt: 0.5 }}>
                          {roleName} {slot.quantity > 1 ? posIndex + 1 : ''}
                        </Typography>

                        {/* Crew member */}
                        <Select
                          value={assignedCrewId || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handlers.assignCrewToPosition(slot.jobRoleId, posIndex, val || null);
                          }}
                          size="small" displayEmpty
                          sx={{
                            flex: 1, minWidth: 160, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)', height: 34,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color },
                            '& .MuiSelect-icon': { color: '#64748b' },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                                '& .MuiMenuItem-root': {
                                  color: '#cbd5e1', fontSize: '0.75rem',
                                  '&:hover': { bgcolor: `${color}15` },
                                  '&.Mui-selected': { bgcolor: `${color}20` },
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

                        {/* Equipment — only for camera/audio roles; multiple items per position */}
                        {hasEquipment && (
                          <Box sx={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {equipmentSlots.map((assignedEquipmentId, eqIndex) => {
                              const slotKey = `${posKey}:${eqIndex}`;
                              return (
                                <Box key={slotKey} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Select
                                    value={assignedEquipmentId || 0}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      handlers.setPositionEquipmentAt(slot.jobRoleId, posIndex, eqIndex, val || null);
                                    }}
                                    size="small" displayEmpty
                                    sx={{
                                      flex: 1, minWidth: 0, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)', height: 34,
                                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: color },
                                      '& .MuiSelect-icon': { color: '#64748b' },
                                    }}
                                    MenuProps={{
                                      PaperProps: {
                                        sx: {
                                          bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                                          '& .MuiMenuItem-root': {
                                            color: '#cbd5e1', fontSize: '0.75rem',
                                            '&:hover': { bgcolor: `${color}15` },
                                            '&.Mui-selected': { bgcolor: `${color}20` },
                                          },
                                        },
                                      },
                                    }}
                                  >
                                    <MenuItem value={0}>
                                      <em style={{ color: '#64748b' }}>{kind === 'CAMERA' ? 'Select camera…' : 'Select audio…'}</em>
                                    </MenuItem>
                                    {equipmentList.map((eq: EquipmentItem) => {
                                      const owner = usedEquipment.get(eq.id);
                                      const usedElsewhere = owner != null && owner !== slotKey;
                                      return (
                                        <MenuItem key={eq.id} value={eq.id} disabled={usedElsewhere}
                                          sx={usedElsewhere ? { opacity: 0.4 } : undefined}>
                                          {eq.item_name}{eq.brand_name ? ` (${eq.brand_name})` : ''}{eq.model ? ` ${eq.model}` : ''}
                                        </MenuItem>
                                      );
                                    })}
                                    {equipmentList.length === 0 && (
                                      <MenuItem disabled>
                                        <em style={{ color: '#475569' }}>No {kind === 'CAMERA' ? 'cameras' : 'audio gear'} in inventory</em>
                                      </MenuItem>
                                    )}
                                  </Select>
                                  {(equipmentSlots.length > 1 || assignedEquipmentId != null) && (
                                    <Tooltip title={`Remove ${kind === 'CAMERA' ? 'camera' : 'audio'} slot`}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handlers.removePositionEquipmentSlot(slot.jobRoleId, posIndex, eqIndex)}
                                        sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}
                                      >
                                        <RemoveCircleOutlineIcon sx={{ fontSize: '0.85rem' }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              );
                            })}
                            <Box
                              component="button"
                              type="button"
                              onClick={() => handlers.addPositionEquipmentSlot(slot.jobRoleId, posIndex)}
                              disabled={equipmentSlots[equipmentSlots.length - 1] == null}
                              sx={{
                                alignSelf: 'flex-start',
                                display: 'inline-flex', alignItems: 'center', gap: 0.35,
                                px: 1, py: 0.35, borderRadius: 0.75, border: 'none',
                                bgcolor: 'transparent', color,
                                fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                                '&:hover': { bgcolor: `${color}12` },
                                '&:disabled': { color: '#475569', cursor: 'default' },
                              }}
                            >
                              <AddIcon sx={{ fontSize: '0.75rem' }} />
                              {kind === 'CAMERA' ? 'Add camera' : 'Add audio'}
                            </Box>
                          </Box>
                        )}

                        {(assignedCrew || hasAssignedEquipment) && (
                          <IconButton size="small"
                            onClick={() => {
                              handlers.assignCrewToPosition(slot.jobRoleId, posIndex, null);
                              handlers.clearPositionEquipment(slot.jobRoleId, posIndex);
                            }}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' }, mt: 0.25 }}>
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

      {/* Add a position */}
      {!loading && availableJobRoles.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Box
            component="button"
            type="button"
            onClick={() => setShowAddRole((o) => !o)}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              px: 1.5, py: 0.6, borderRadius: 1,
              border: '1px solid rgba(148,163,184,0.2)', bgcolor: 'rgba(148,163,184,0.06)',
              color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(148,163,184,0.12)', color: '#fff' },
            }}
          >
            <AddIcon sx={{ fontSize: '0.9rem' }} />
            Add a position
            <ExpandMoreIcon sx={{ fontSize: '1rem', transform: showAddRole ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </Box>

          <Collapse in={showAddRole}>
            <Box sx={{ mt: 1.5 }}>
              <Divider sx={{ mb: 1.5, borderColor: 'rgba(148,163,184,0.1)' }} />
              {(() => {
                const categories: Record<string, JobRole[]> = {};
                availableJobRoles
                  .filter((r) => !roleSlots.some((s) => s.jobRoleId === r.id))
                  .forEach((r) => {
                    const cat = r.category || 'Other';
                    if (!categories[cat]) categories[cat] = [];
                    categories[cat].push(r);
                  });
                const entries = Object.entries(categories);
                if (entries.length === 0) {
                  return (
                    <Typography sx={{ color: '#475569', fontSize: '0.72rem', fontStyle: 'italic' }}>
                      All available roles have been added.
                    </Typography>
                  );
                }
                return (
                  <Stack spacing={1.5}>
                    {entries.map(([category, roles]) => (
                      <Box key={category}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', mb: 0.5 }}>
                          {category}
                        </Typography>
                        <Stack spacing={0.25}>
                          {roles.map((role) => (
                            <Box key={role.id} onClick={() => handlers.addRoleSlot(role.id)} sx={{
                              ...listRowSx(false, '#818cf8'),
                              '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                            }}>
                              <AddIcon sx={{ fontSize: '0.85rem', color: '#64748b' }} />
                              <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 400, flex: 1 }}>
                                {role.display_name || role.name}
                              </Typography>
                              {role._count?.job_role_assignments != null && role._count.job_role_assignments > 0 && (
                                <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>
                                  {role._count.job_role_assignments} crew
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                );
              })()}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
