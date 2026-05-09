'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Chip, CircularProgress, Tooltip } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { PackageSurfaceHeader } from '@/shared/ui/PackageSurfaceHeader';
import { servicePackagesApi } from '@/features/catalog/packages/api';
import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';

// ─── Props ───────────────────────────────────────────────────────────

export interface PackageHeaderProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    isSaving: boolean;
    onBack: () => void;
    onVersionHistory: () => void;
    onBlueprintResynced?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function PackageHeader({
    formData,
    setFormData,
    isSaving,
    onBack,
    onVersionHistory,
    onBlueprintResynced,
}: PackageHeaderProps) {
    const router = useRouter();
    const [resyncing, setResyncing] = useState(false);

    const pkg = formData as Partial<ServicePackage>;
    const blueprint = pkg.source_day_blueprint;
    const blueprintVersion = pkg.source_day_blueprint_version;
    const updateAvailable = pkg.blueprint_update_available;

    const handleResync = async () => {
        if (!pkg.id || resyncing) return;
        setResyncing(true);
        try {
            await servicePackagesApi.resyncBlueprint(pkg.id);
            onBlueprintResynced?.();
        } catch (err) {
            console.error('Blueprint resync failed', err);
        } finally {
            setResyncing(false);
        }
    };

    const chips = blueprint
        ? [
              {
                  key: 'blueprint',
                  label: (
                      <Chip
                          label={`Blueprint: ${blueprint.display_name}${blueprintVersion ? ` v${blueprintVersion.version_number}` : ''}`}
                          size="small"
                          variant="outlined"
                          onClick={() =>
                              router.push(
                                  `/day-designer/${blueprint.id}${blueprintVersion ? `/${blueprintVersion.id}` : ''}`,
                              )
                          }
                          sx={{
                              fontSize: '0.68rem',
                              height: 22,
                              borderColor: 'rgba(100,140,255,0.35)',
                              color: '#8fa8ff',
                              cursor: 'pointer',
                              '&:hover': { borderColor: 'rgba(100,140,255,0.6)', background: 'rgba(100,140,255,0.06)' },
                          }}
                      />
                  ),
              },
              ...(updateAvailable
                  ? [
                        {
                            key: 'blueprint-update',
                            label: (
                                <Tooltip title="A newer version of this blueprint is available. Click to update this package's activities and moments.">
                                    <Box
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                                        onClick={handleResync}
                                    >
                                        {resyncing ? (
                                            <CircularProgress size={12} sx={{ color: '#f59e0b' }} />
                                        ) : (
                                            <AutorenewIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                                        )}
                                        <Chip
                                            label="Update available"
                                            size="small"
                                            sx={{
                                                fontSize: '0.66rem',
                                                height: 20,
                                                background: 'rgba(245,158,11,0.12)',
                                                color: '#f59e0b',
                                                border: '1px solid rgba(245,158,11,0.35)',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </Box>
                                </Tooltip>
                            ),
                        },
                    ]
                  : []),
          ]
        : [];

    return (
        <PackageSurfaceHeader
            title={formData.name || ''}
            titlePlaceholder="Package Name"
            editableTitle
            chips={chips}
            isSaving={isSaving}
            onTitleChange={(name) => setFormData({ ...formData, name })}
            onBack={onBack}
            onVersionHistory={onVersionHistory}
        />
    );
}
