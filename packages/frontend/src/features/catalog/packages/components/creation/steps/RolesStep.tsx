import React from 'react';
import { Box, Typography, Chip, Stack, CircularProgress, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import WorkIcon from '@mui/icons-material/Work';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardData } from '../hooks/useWizardData';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { JobRole } from '../types/wizard.types';
import { listRowSx } from '../helpers/wizard-styles';

interface RolesStepProps {
  state: WizardState;
  data: WizardData;
  handlers: WizardHandlers;
}

export default function RolesStep({ state, data, handlers }: RolesStepProps) {
  const { roleSlots } = state;
  const { availableJobRoles, loadingRoles } = data;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>What roles does this package need?</Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>Add positions first, then assign crew in the next step</Typography>
        </Box>
        {roleSlots.length > 0 && (
          <Chip label={`${roleSlots.reduce((s, r) => s + r.quantity, 0)} position${roleSlots.reduce((s, r) => s + r.quantity, 0) !== 1 ? 's' : ''}`} size="small"
            sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'none' }} />
        )}
      </Box>

      {loadingRoles && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
          <CircularProgress size={18} sx={{ color: '#818cf8' }} />
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>Loading roles...</Typography>
        </Box>
      )}

      {!loadingRoles && availableJobRoles.length === 0 && (
        <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>No job roles configured yet. You can skip this step and add roles later.</Typography>
      )}

      {!loadingRoles && availableJobRoles.length > 0 && (
        <Stack spacing={1.5}>
          {roleSlots.length > 0 && (
            <Box>
              <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 1 }}>
                Selected Positions
              </Typography>
              <Stack spacing={0.5}>
                {roleSlots.map((slot) => {
                  const role = availableJobRoles.find((r) => r.id === slot.jobRoleId);
                  if (!role) return null;
                  return (
                    <Box key={slot.jobRoleId} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
                      borderRadius: 1.5, bgcolor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                    }}>
                      <WorkIcon sx={{ fontSize: '1rem', color: '#818cf8' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>
                          {role.display_name || role.name}
                        </Typography>
                        {role.category && <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>{role.category}</Typography>}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handlers.removeRoleSlot(slot.jobRoleId)}
                          sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                          <RemoveCircleOutlineIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                        <Typography sx={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', minWidth: 20, textAlign: 'center' }}>
                          {slot.quantity}
                        </Typography>
                        <IconButton size="small" onClick={() => handlers.addRoleSlot(slot.jobRoleId)}
                          sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#818cf8' } }}>
                          <AddIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {(() => {
            const categories: Record<string, JobRole[]> = {};
            availableJobRoles
              .filter((r) => !roleSlots.some((s) => s.jobRoleId === r.id))
              .forEach((r) => {
                const cat = r.category || 'Other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(r);
              });

            const remainingRoles = availableJobRoles.filter((r) => !roleSlots.some((s) => s.jobRoleId === r.id));
            if (remainingRoles.length === 0 && roleSlots.length > 0) return null;

            return (
              <Box>
                <Typography sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 1 }}>
                  {roleSlots.length > 0 ? 'Add More Roles' : 'Available Roles'}
                </Typography>
                <Stack spacing={1.5}>
                  {Object.entries(categories).map(([category, roles]) => (
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
              </Box>
            );
          })()}
        </Stack>
      )}
    </Box>
  );
}
