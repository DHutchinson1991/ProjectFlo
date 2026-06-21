import { Box, Chip } from '@mui/material';
import { PackageSurfaceHeader } from '@/shared/ui/PackageSurfaceHeader';
import type { DayBlueprintSummary, DayBlueprintVersionDetail } from '../../types';

interface VersionEditorHeaderProps {
  blueprint?: DayBlueprintSummary;
  version: DayBlueprintVersionDetail;
  editableBlueprintName: string;
  isDraft: boolean;
  isSaving: boolean;
  onTitleChange: (next: string) => void;
  onVersionHistory: () => void;
}

export function VersionEditorHeader({
  blueprint,
  version,
  editableBlueprintName,
  isDraft,
  isSaving,
  onTitleChange,
  onVersionHistory,
}: VersionEditorHeaderProps) {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 },
        pb: 2,
        borderBottom: '1px solid rgba(52, 58, 68, 0.5)',
      }}
    >
      <PackageSurfaceHeader
          title={editableBlueprintName || (blueprint?.display_name ?? 'Blueprint')}
          titlePlaceholder="Blueprint"
          editableTitle={isDraft}
          isSaving={isSaving}
          savingLabel="Saving name..."
          onTitleChange={onTitleChange}
          onVersionHistory={onVersionHistory}
          chips={[
            {
              key: 'version',
              label: (
                <Chip
                  label={`v${version.version_number}`}
                  size="small"
                  sx={{ height: 20, bgcolor: 'rgba(96,165,250,0.14)', color: '#93c5fd', border: 'none' }}
                />
              ),
            },
            {
              key: 'status',
              label: (
                <Chip
                  label={version.status}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor:
                      version.status === 'DRAFT'
                        ? 'rgba(245,158,11,0.14)'
                        : version.status === 'PUBLISHED'
                          ? 'rgba(34,197,94,0.14)'
                          : 'rgba(148,163,184,0.14)',
                    color:
                      version.status === 'DRAFT'
                        ? '#fbbf24'
                        : version.status === 'PUBLISHED'
                          ? '#22c55e'
                          : '#94a3b8',
                    border: 'none',
                  }}
                />
              ),
            },
            {
              key: 'category',
              label: (
                <Chip
                  label={blueprint?.event_category ?? 'Uncategorized'}
                  size="small"
                  sx={{ height: 20, bgcolor: 'rgba(148,163,184,0.14)', color: '#cbd5e1', border: 'none' }}
                />
              ),
            },
          ]}
          readOnlyMessage={!isDraft ? 'Read-only - create a new draft to edit.' : undefined}
      />
    </Box>
  );
}
