import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlaceIcon from '@mui/icons-material/Place';
import VideocamIcon from '@mui/icons-material/Videocam';
import GroupsIcon from '@mui/icons-material/Groups';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import WorkIcon from '@mui/icons-material/Work';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardData } from '../hooks/useWizardData';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { Crew, EquipmentItem } from '../types/wizard.types';
import { getCrewName, getEventTypeGuestRole } from '../helpers/wizard-helpers';

interface ReviewStepProps {
  state: WizardState;
  data: WizardData;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

export default function ReviewStep({ state, data, derived, handlers }: ReviewStepProps) {
  const {
    selectedEventType, selectedPresetIds,
    customActivities, packageName, roleSlots,
    selectedRoleIds, standardGuestCount,
    cameraSlots, audioSlots, locationCount,
  } = state;
  const { availableJobRoles, crew, equipmentItems } = data;
  const { selectedDays, stats, accent, equipmentCrewOptions } = derived;

  if (!selectedEventType) return null;

  const guestRole = getEventTypeGuestRole(selectedEventType);
  const includeGuests = !!guestRole && selectedRoleIds.has(guestRole.id);

  return (
    <Box>
      {/* Package Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, p: 2, borderRadius: 1.5, bgcolor: `${accent}0A`, border: `1px solid ${accent}25` }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25 }}>Package Name</Typography>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{packageName}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25 }}>Event Type</Typography>
          <Typography sx={{ color: accent, fontWeight: 600, fontSize: '0.85rem' }}>{selectedEventType.icon || ''} {selectedEventType.name}</Typography>
        </Box>
      </Box>

      {/* Stats Row */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
        {[
          { label: 'Days', value: stats.days, color: '#10b981' },
          { label: 'Activities', value: stats.activities, color: '#818cf8' },
          ...(includeGuests ? [{ label: 'Guests', value: standardGuestCount, color: '#22d3ee' }] : []),
          { label: 'Roles', value: stats.roles, color: '#818cf8' },
          { label: 'Crew', value: stats.crew, color: '#818cf8' },
          { label: 'Equipment', value: stats.equipment, color: '#fb923c' },
          { label: 'Locations', value: stats.locations, color: '#22d3ee' },
        ].map((stat) => (
          <Box key={stat.label} sx={{ flex: 1, minWidth: 60, p: 0.75, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
            <Typography sx={{ color: stat.color, fontWeight: 700, fontSize: '0.95rem' }}>{stat.value}</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Compact breakdown grid — 2 columns */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>

        {/* Days & Activities */}
        <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
          <Typography sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: '0.7rem' }} /> Days & Activities
          </Typography>
          <Stack spacing={0.5}>
            {selectedDays.map((link) => {
              const day = link.event_day_template;
              const presets = (day.activity_presets || []).filter((p) => selectedPresetIds.has(p.id));
              const dayCustom = customActivities.filter((ca) => ca.dayLinkId === link.id);
              const activityCount = presets.length + dayCustom.length;
              if (activityCount === 0) return null;
              return (
                <Box key={link.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {day.name}
                  </Typography>
                  <Chip label={`${activityCount}`} size="small" sx={{ height: 18, minWidth: 24, fontSize: '0.6rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'none' }} />
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Roles & Crew */}
        <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <Typography sx={{ color: '#818cf8', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupsIcon sx={{ fontSize: '0.7rem' }} /> Roles & Crew
          </Typography>
          {roleSlots.length > 0 ? (
            <Stack spacing={0.25}>
              {roleSlots.map((slot) => {
                const role = availableJobRoles.find((r) => r.id === slot.jobRoleId);
                if (!role) return null;
                const roleName = role.display_name || role.name;
                const filledCount = Array.from({ length: slot.quantity }, (_, i) =>
                  handlers.getPositionCrewId(slot.jobRoleId, i),
                ).filter(Boolean).length;
                return (
                  <Box key={slot.jobRoleId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WorkIcon sx={{ fontSize: '0.55rem', color: '#818cf8' }} />
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', flex: 1 }}>
                      {roleName} <Box component="span" sx={{ color: '#64748b' }}>×{slot.quantity}</Box>
                    </Typography>
                    <Chip
                      label={filledCount === slot.quantity ? `${filledCount} filled` : `${filledCount}/${slot.quantity}`}
                      size="small"
                      sx={{ height: 16, fontSize: '0.5rem', border: 'none',
                        bgcolor: filledCount === slot.quantity ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.1)',
                        color: filledCount === slot.quantity ? '#10b981' : '#64748b',
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography sx={{ color: '#475569', fontSize: '0.65rem', fontStyle: 'italic' }}>No roles added</Typography>
          )}
        </Box>

        {/* Equipment */}
        <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(251,146,60,0.04)', border: '1px solid rgba(251,146,60,0.1)' }}>
          <Typography sx={{ color: '#fb923c', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VideocamIcon sx={{ fontSize: '0.7rem' }} /> Equipment
          </Typography>
          {stats.equipment > 0 ? (
            <Stack spacing={0.25}>
              {cameraSlots.filter((s) => s.equipmentId).map((slot) => {
                const eq = equipmentItems.find((e: EquipmentItem) => e.id === slot.equipmentId);
                return (
                  <Box key={`cam-${slot.slotNumber}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CameraAltIcon sx={{ fontSize: '0.55rem', color: '#fb923c' }} />
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Cam {slot.slotNumber}: {eq?.item_name || 'Unknown'}
                    </Typography>
                  </Box>
                );
              })}
              {audioSlots.filter((s) => s.equipmentId).map((slot) => {
                const eq = equipmentItems.find((e: EquipmentItem) => e.id === slot.equipmentId);
                return (
                  <Box key={`aud-${slot.slotNumber}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MicIcon sx={{ fontSize: '0.55rem', color: '#22d3ee' }} />
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Audio {slot.slotNumber}: {eq?.item_name || 'Unknown'}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography sx={{ color: '#475569', fontSize: '0.65rem', fontStyle: 'italic' }}>No equipment assigned</Typography>
          )}
        </Box>

      </Box>

      {/* Locations — inline below grid */}
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
        <PlaceIcon sx={{ fontSize: '0.7rem', color: '#22d3ee' }} />
        <Typography sx={{ color: '#22d3ee', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Locations</Typography>
        <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
          {Array.from({ length: locationCount }, (_, i) => (
            <Box key={i} sx={{ px: 0.75, py: 0.25, borderRadius: 0.5, bgcolor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
              <Typography sx={{ color: '#22d3ee', fontSize: '0.6rem', fontWeight: 600 }}>Loc {i + 1}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
