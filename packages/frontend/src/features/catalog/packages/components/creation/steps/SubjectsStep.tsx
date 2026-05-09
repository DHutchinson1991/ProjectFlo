import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import { getEventTypeSubjects, getAllRoleIds } from '../helpers/wizard-helpers';
import { listRowSx, checkboxSx, sectionBtnSx } from '../helpers/wizard-styles';

interface SubjectsStepProps {
  state: WizardState;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

export default function SubjectsStep({ state, derived, handlers }: SubjectsStepProps) {
  const { selectedEventType, selectedRoleIds } = state;
  const { totalRoles } = derived;

  if (!selectedEventType) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Who will be involved in this event?</Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>Select the subjects that apply to your package</Typography>
        </Box>
        {totalRoles > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`${selectedRoleIds.size}/${totalRoles}`} size="small"
              sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(244,114,182,0.12)', color: '#f472b6', border: 'none' }} />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box component="button" onClick={() => state.setSelectedRoleIds(getAllRoleIds(selectedEventType))} sx={sectionBtnSx('#f472b6')}>All</Box>
              <Box component="button" onClick={() => state.setSelectedRoleIds(new Set())}
                sx={{ ...sectionBtnSx('#64748b'), borderColor: 'rgba(255,255,255,0.1)' }}>None</Box>
            </Box>
          </Box>
        )}
      </Box>

      {totalRoles === 0 && <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>No subject types configured for this event type yet.</Typography>}

      <Stack spacing={2}>
        {[...getEventTypeSubjects(selectedEventType)].sort((a, b) => a.order_index - b.order_index).map((link) => {
          const role = link.subject_role;
          if (!role) return null;
          const sel = selectedRoleIds.has(role.id);
          return (
            <Box key={link.id} onClick={() => handlers.toggleRole(role.id)} sx={listRowSx(sel, '#f472b6')}>
              <Box sx={checkboxSx(sel, '#f472b6')}>{sel && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}</Box>
              <Typography sx={{ color: sel ? '#e2e8f0' : '#94a3b8', fontSize: '0.82rem', fontWeight: sel ? 600 : 400, flex: 1 }}>{role.role_name}</Typography>
              {role.is_group && <Chip label="Group" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'none' }} />}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
