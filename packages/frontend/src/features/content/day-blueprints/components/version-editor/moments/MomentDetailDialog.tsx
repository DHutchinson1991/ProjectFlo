import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography } from '@mui/material';
import { useDayBlueprintVersion } from '../../../hooks';
import type { DayBlueprintMoment, DayBlueprintSpaceSlot, DayBlueprintSubjectRoleLink, DayBlueprintVersionDetail } from '../../../types';
import { MomentActionsEditor } from './MomentActionsEditor';
import { MomentPlacementsEditor } from './MomentPlacementsEditor';

// ─── Moment detail dialog (actions + placements) ────────────────

export function MomentDetailDialog({
  open,
  onClose,
  moment,
  blueprintId,
  versionId,
}: {
  open: boolean;
  onClose: () => void;
  moment: DayBlueprintMoment;
  blueprintId: number;
  versionId: number;
}) {
  const versionQuery = useDayBlueprintVersion(blueprintId, versionId);
  const version = versionQuery.data as DayBlueprintVersionDetail | undefined;
  const subjectRoles: DayBlueprintSubjectRoleLink[] = version?.subject_roles ?? [];
  const spaceSlots: DayBlueprintSpaceSlot[] = version?.space_slots ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(9,12,18,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: '#f8fafc', fontWeight: 800 }}>
        {moment.name}
        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
          Subject actions & space placements
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.8rem', mb: 1 }}>
          Subject actions
        </Typography>
        {subjectRoles.length === 0 ? (
          <Typography sx={{ color: '#fb7185', fontSize: '0.78rem', mb: 2 }}>
            No subject roles linked to this version yet. Add roles in the top "Subject roles" tab first.
          </Typography>
        ) : (
          <MomentActionsEditor
            moment={moment}
            subjectRoles={subjectRoles}
            blueprintId={blueprintId}
            versionId={versionId}
          />
        )}
        <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.1)' }} />
        <Typography sx={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.8rem', mb: 1 }}>
          Placements
        </Typography>
        {subjectRoles.length === 0 || spaceSlots.length === 0 ? (
          <Typography sx={{ color: '#fb7185', fontSize: '0.78rem' }}>
            Need at least one subject role and one space slot. Set them up in the top panels first.
          </Typography>
        ) : (
          <MomentPlacementsEditor
            moment={moment}
            subjectRoles={subjectRoles}
            spaceSlots={spaceSlots}
            blueprintId={blueprintId}
            versionId={versionId}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#94a3b8' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

