'use client';

import { Alert, Box, Button, CircularProgress } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useBranchDayBlueprintDraft } from '../../hooks/useBranchDayBlueprintDraft';

interface Props {
  blueprintId: number;
  sourceVersionId: number;
  sourceVersionNumber: number;
  existingDraftVersionId?: number | null;
  existingDraftVersionNumber?: number | null;
}

export function PublishedVersionEditBanner({
  blueprintId,
  sourceVersionId,
  sourceVersionNumber,
  existingDraftVersionId,
  existingDraftVersionNumber,
}: Props) {
  const { branchToDraft, isBranching } = useBranchDayBlueprintDraft(blueprintId);

  const handleCreateDraft = () => {
    void branchToDraft({
      source_version_id: sourceVersionId,
      change_summary: `Draft from published v${sourceVersionNumber}`,
    });
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
      <Alert
        severity="info"
        sx={{
          alignItems: 'center',
          bgcolor: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(96,165,250,0.25)',
          color: '#cbd5e1',
          '& .MuiAlert-icon': { color: '#60a5fa' },
        }}
        action={
          <Button
            size="small"
            variant="contained"
            disabled={isBranching}
            startIcon={
              isBranching ? <CircularProgress size={14} color="inherit" /> : <EditOutlinedIcon />
            }
            onClick={handleCreateDraft}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            {existingDraftVersionId ? 'New draft from here' : 'Create draft to edit'}
          </Button>
        }
      >
        Published v{sourceVersionNumber} is read-only.
        {existingDraftVersionId
          ? ` Working draft v${existingDraftVersionNumber ?? '?'} exists — branch again to replace it, or open the draft from the blueprint list.`
          : ' Create a draft copy to make changes, then publish when ready.'}
      </Alert>
    </Box>
  );
}
