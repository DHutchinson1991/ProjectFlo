import { useState } from 'react';
import { Button, Chip, IconButton, MenuItem, Select, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useCreateMomentAction, useDeleteMomentAction, useUpdateMomentAction } from '../../../hooks';
import type { DayBlueprintMoment, DayBlueprintMomentAction, DayBlueprintSubjectRoleLink } from '../../../types';

export function MomentActionsEditor({
  moment,
  subjectRoles,
  blueprintId,
  versionId,
}: {
  moment: DayBlueprintMoment;
  subjectRoles: DayBlueprintSubjectRoleLink[];
  blueprintId: number;
  versionId: number;
}) {
  const create = useCreateMomentAction(blueprintId, versionId);
  const update = useUpdateMomentAction(blueprintId, versionId);
  const remove = useDeleteMomentAction(blueprintId, versionId);
  const [roleId, setRoleId] = useState<number | ''>('');
  const [actionText, setActionText] = useState('');

  const roleName = (id: number) =>
    subjectRoles.find((l) => l.subject_role_id === id)?.subject_role?.role_name ?? `role #${id}`;

  const add = async () => {
    if (!roleId || !actionText.trim()) return;
    await create.mutateAsync({ momentId: moment.id, data: { subject_role_id: Number(roleId), action_text: actionText.trim() } });
    setRoleId('');
    setActionText('');
  };

  return (
    <Stack spacing={0.75}>
      {(moment.actions ?? []).map((act: DayBlueprintMomentAction) => (
        <Stack
          key={act.id}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ p: 1, borderRadius: 1, bgcolor: 'rgba(15,23,42,0.4)' }}
        >
          <Chip
            label={roleName(act.subject_role_id)}
            size="small"
            sx={{ bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none', fontWeight: 700 }}
          />
          <TextField
            size="small"
            value={act.action_text}
            onChange={(e) => update.mutate({ actionId: act.id, data: { action_text: e.target.value } })}
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={() => remove.mutate(act.id)}>
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
        <TextField
          size="small"
          placeholder="What do they do? e.g. Walk down the aisle"
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          onClick={add}
          variant="contained"
          disabled={!roleId || !actionText.trim() || create.isPending}
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', bgcolor: '#60a5fa', '&:hover': { bgcolor: '#3b82f6' } }}
        >
          Add
        </Button>
      </Stack>
    </Stack>
  );
}

