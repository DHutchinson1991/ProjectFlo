import { useState } from 'react';
import { Button, Chip, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useCreateMomentPlacement, useDeleteMomentPlacement, useUpdateMomentPlacement } from '../../../hooks';
import type { DayBlueprintMoment, DayBlueprintMomentPlacement, DayBlueprintSpaceSlot, DayBlueprintSubjectRoleLink } from '../../../types';

export function MomentPlacementsEditor({
  moment,
  subjectRoles,
  spaceSlots,
  blueprintId,
  versionId,
}: {
  moment: DayBlueprintMoment;
  subjectRoles: DayBlueprintSubjectRoleLink[];
  spaceSlots: DayBlueprintSpaceSlot[];
  blueprintId: number;
  versionId: number;
}) {
  const create = useCreateMomentPlacement(blueprintId, versionId);
  const update = useUpdateMomentPlacement(blueprintId, versionId);
  const remove = useDeleteMomentPlacement(blueprintId, versionId);
  const [roleId, setRoleId] = useState<number | ''>('');
  const [slotId, setSlotId] = useState<number | ''>('');
  const [positionHint, setPositionHint] = useState('');

  const roleName = (id: number) =>
    subjectRoles.find((l) => l.subject_role_id === id)?.subject_role?.role_name ?? `role #${id}`;
  const slotLabel = (id: number) =>
    spaceSlots.find((s) => s.id === id)?.label ?? `slot #${id}`;

  const add = async () => {
    if (!roleId || !slotId) return;
    await create.mutateAsync({
      momentId: moment.id,
      data: {
        subject_role_id: Number(roleId),
        day_blueprint_space_slot_id: Number(slotId),
        position_hint: positionHint.trim() || undefined,
      },
    });
    setRoleId('');
    setSlotId('');
    setPositionHint('');
  };

  return (
    <Stack spacing={0.75}>
      {(moment.placements ?? []).map((p: DayBlueprintMomentPlacement) => (
        <Stack
          key={p.id}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ p: 1, borderRadius: 1, bgcolor: 'rgba(15,23,42,0.4)' }}
        >
          <Chip
            label={roleName(p.subject_role_id)}
            size="small"
            sx={{ bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none', fontWeight: 700 }}
          />
          <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>→</Typography>
          <Chip
            label={slotLabel(p.day_blueprint_space_slot_id)}
            size="small"
            sx={{ bgcolor: 'rgba(34,197,94,0.14)', color: '#86efac', border: 'none', fontWeight: 700 }}
          />
          <TextField
            size="small"
            placeholder="Position hint"
            value={p.position_hint ?? ''}
            onChange={(e) => update.mutate({ placementId: p.id, data: { position_hint: e.target.value } })}
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => remove.mutate(p.id)}>
            <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#fb7185' }} />
          </IconButton>
        </Stack>
      ))}
      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          displayEmpty
          value={roleId}
          onChange={(e) => setRoleId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 160, fontSize: '0.8rem' }}
        >
          <MenuItem value=""><em>Role…</em></MenuItem>
          {subjectRoles.map((l) => (
            <MenuItem key={l.subject_role_id} value={l.subject_role_id}>
              {l.subject_role?.role_name ?? `#${l.subject_role_id}`}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={slotId}
          onChange={(e) => setSlotId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 180, fontSize: '0.8rem' }}
        >
          <MenuItem value=""><em>Slot…</em></MenuItem>
          {spaceSlots.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
          ))}
        </Select>
        <TextField
          size="small"
          placeholder="Position hint (e.g. centre, facing guests)"
          value={positionHint}
          onChange={(e) => setPositionHint(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          onClick={add}
          variant="contained"
          disabled={!roleId || !slotId || create.isPending}
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', bgcolor: '#60a5fa', '&:hover': { bgcolor: '#3b82f6' } }}
        >
          Add
        </Button>
      </Stack>
    </Stack>
  );
}
