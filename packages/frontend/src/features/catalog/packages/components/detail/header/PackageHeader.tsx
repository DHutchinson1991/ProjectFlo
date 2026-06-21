'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    IconButton,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { PackageSurfaceHeader } from '@/shared/ui/PackageSurfaceHeader';
import { servicePackagesApi } from '@/features/catalog/packages/api';
import type { PackageBlueprintResyncPreview } from '@/features/catalog/packages/types/api.types';
import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';

import { PackageTraceabilityLinkButton } from './PackageTraceabilityLinkButton';

export type PackageViewMode = 'overview' | 'edit';

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
    viewMode?: PackageViewMode;
    onViewModeChange?: (mode: PackageViewMode) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function PackageHeader({
    formData,
    setFormData,
    isSaving,
    onBack,
    onVersionHistory,
    onBlueprintResynced,
    viewMode,
    onViewModeChange,
}: PackageHeaderProps) {
    const queryClient = useQueryClient();
    const [resyncing, setResyncing] = useState(false);
    const [refreshingPlacements, setRefreshingPlacements] = useState(false);
    const [resyncMenuOpen, setResyncMenuOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [preview, setPreview] = useState<PackageBlueprintResyncPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const pkg = formData as Partial<ServicePackage>;
    const blueprint = pkg.source_day_blueprint;
    const blueprintVersion = pkg.source_day_blueprint_version;
    const updateAvailable = pkg.blueprint_update_available;
    const packageId = pkg.id;
    const blueprintBacked = Boolean(pkg.source_day_blueprint_version_id);

    const invalidateSpatialCache = () => {
        if (packageId != null) {
            void queryClient.invalidateQueries({ queryKey: ['package-blueprint-spatial', packageId] });
        }
    };

    const handleResyncSuccess = () => {
        invalidateSpatialCache();
        onBlueprintResynced?.();
    };

    const openResyncPreview = async () => {
        if (!pkg.id || resyncing || previewLoading) return;
        setPreviewLoading(true);
        try {
            const data = await servicePackagesApi.previewBlueprintResync(pkg.id);
            if (data.already_current) {
                window.alert('This package is already on the latest published blueprint version.');
                return;
            }
            setPreview(data);
            setResyncMenuOpen(false);
            setPreviewOpen(true);
        } catch (err) {
            console.error('Blueprint resync preview failed', err);
            window.alert('Could not load blueprint update preview.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleConfirmResync = async () => {
        if (!pkg.id || resyncing) return;
        setResyncing(true);
        try {
            await servicePackagesApi.resyncBlueprint(pkg.id, {
                strategy: 'structure_only',
                seat_layout: 'fluid',
            });
            setPreviewOpen(false);
            setPreview(null);
            handleResyncSuccess();
        } catch (err) {
            console.error('Blueprint resync failed', err);
            window.alert('Blueprint update failed. Try again or restore from package version history.');
        } finally {
            setResyncing(false);
        }
    };

    const handleRefreshPlacements = async () => {
        if (!pkg.id || refreshingPlacements) return;
        setRefreshingPlacements(true);
        try {
            await servicePackagesApi.refreshBlueprintPlacements(pkg.id);
            setResyncMenuOpen(false);
            handleResyncSuccess();
        } catch (err) {
            console.error('Blueprint placement refresh failed', err);
            window.alert('Could not refresh placements. Try again or restore from package version history.');
        } finally {
            setRefreshingPlacements(false);
        }
    };

    const chips = [
        ...(updateAvailable
            ? [
                  {
                      key: 'blueprint-update',
                      label: (
                          <Tooltip title="The source Day Blueprint has a newer published version. Preview changes, then update activities and moments.">
                              <Box
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                                  onClick={() => void openResyncPreview()}
                              >
                                  {resyncing || previewLoading ? (
                                      <CircularProgress size={12} sx={{ color: '#f59e0b' }} />
                                  ) : (
                                      <AutorenewIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                                  )}
                                  <Chip
                                      label="Blueprint updated"
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
    ];

    const showViewModeToggle = viewMode != null && onViewModeChange != null;
    const resyncBusy = resyncing || refreshingPlacements || previewLoading;

    const titleRowExtras =
        showViewModeToggle || packageId != null ? (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                    gap: 0.75,
                    minWidth: 0,
                    flexGrow: 0,
                    flexShrink: 1,
                    maxWidth: showViewModeToggle ? 'min(36rem, 62vw)' : 'min(26rem, 50vw)',
                }}
            >
                {blueprint && (
                    <Typography
                        component="span"
                        noWrap
                        sx={{
                            minWidth: 0,
                            flex: '0 1 auto',
                            maxWidth: 'min(19rem, 38vw)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.82rem',
                            lineHeight: 1.25,
                            '& .bp-muted': { color: '#94a3b8' },
                            '& .bp-name': { color: '#cbd5e1', fontWeight: 600 },
                            '& .bp-ver': { color: '#93c5fd', fontWeight: 700, ml: 0.25 },
                        }}
                    >
                        <Box component="span" className="bp-muted">
                            Blueprint ·{' '}
                        </Box>
                        <Box component="span" className="bp-name">
                            {blueprint.display_name}
                        </Box>
                        {blueprintVersion != null ? (
                            <Box component="span" className="bp-ver">
                                v{blueprintVersion.version_number}
                            </Box>
                        ) : null}
                    </Typography>
                )}
                {blueprintBacked && packageId != null ? (
                    <Tooltip title="Refresh blueprint placements or update from the latest published day design">
                        <IconButton
                            size="small"
                            aria-label="Blueprint resync"
                            aria-haspopup="dialog"
                            aria-expanded={resyncMenuOpen}
                            disabled={resyncBusy}
                            onClick={() => setResyncMenuOpen(true)}
                            sx={{
                                color: '#94a3b8',
                                p: 0.35,
                                flexShrink: 0,
                                '&:hover': { color: '#cbd5e1', background: 'rgba(148,163,184,0.12)' },
                            }}
                        >
                            {resyncBusy ? (
                                <CircularProgress size={16} sx={{ color: '#94a3b8' }} />
                            ) : (
                                <AutorenewIcon sx={{ fontSize: 17 }} />
                            )}
                        </IconButton>
                    </Tooltip>
                ) : null}
                {packageId != null ? <PackageTraceabilityLinkButton packageId={packageId} /> : null}
                {showViewModeToggle && (blueprint || packageId != null) ? (
                    <Box
                        aria-hidden
                        sx={{
                            width: '1px',
                            height: 18,
                            bgcolor: 'rgba(148,163,184,0.22)',
                            borderRadius: 1,
                            flexShrink: 0,
                        }}
                    />
                ) : null}
                {showViewModeToggle ? (
                    <Tabs
                        value={viewMode}
                        onChange={(_, value: PackageViewMode) => onViewModeChange(value)}
                        sx={{
                            minHeight: 30,
                            p: 0.3,
                            borderRadius: 1.5,
                            bgcolor: 'rgba(2,6,23,0.42)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            flexShrink: 0,
                            '& .MuiTab-root': {
                                minHeight: 24,
                                px: 1.35,
                                py: 0.2,
                                borderRadius: 1.25,
                                color: '#64748b',
                                fontSize: '0.64rem',
                                fontWeight: 850,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                '&.Mui-selected': {
                                    color: '#f8fafc',
                                    bgcolor: 'rgba(168,85,247,0.18)',
                                    boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
                                },
                            },
                            '& .MuiTabs-indicator': { display: 'none' },
                        }}
                    >
                        <Tab value="overview" label="Overview" />
                        <Tab value="edit" label="Edit" />
                    </Tabs>
                ) : null}
            </Box>
        ) : undefined;

    const summary = preview?.structural_summary;

    return (
        <>
            <PackageSurfaceHeader
                title={formData.name || ''}
                titlePlaceholder="Package Name"
                editableTitle
                hideTitle={viewMode === 'overview'}
                titleRowExtras={titleRowExtras}
                chips={chips}
                isSaving={isSaving}
                onTitleChange={(name) => setFormData({ ...formData, name })}
                onBack={onBack}
                onVersionHistory={onVersionHistory}
            />

            <Dialog
                open={resyncMenuOpen}
                onClose={() => !refreshingPlacements && setResyncMenuOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ color: '#f1f5f9', pb: 1 }}>Blueprint sync</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 2 }}>
                        Re-apply ceremony seating (fluid layout: party in front rows, guests in back rows) and
                        camera blocking from the current blueprint.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                            variant="contained"
                            onClick={() => void handleRefreshPlacements()}
                            disabled={refreshingPlacements}
                            startIcon={
                                refreshingPlacements ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    <AutorenewIcon />
                                )
                            }
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.1 }}
                        >
                            Refresh placements &amp; blocking
                        </Button>
                        {updateAvailable ? (
                            <Button
                                variant="outlined"
                                onClick={() => void openResyncPreview()}
                                disabled={previewLoading || resyncing}
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: 'none',
                                    py: 1.1,
                                    color: '#f59e0b',
                                    borderColor: 'rgba(245,158,11,0.45)',
                                }}
                            >
                                Update from latest blueprint version…
                            </Button>
                        ) : null}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setResyncMenuOpen(false)}
                        disabled={refreshingPlacements}
                        sx={{ color: '#94a3b8' }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={previewOpen} onClose={() => !resyncing && setPreviewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: '#f1f5f9' }}>Update from blueprint</DialogTitle>
                <DialogContent>
                    {preview && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                {preview.blueprint.display_name}: v
                                {preview.current_version?.version_number ?? '?'} → v
                                {preview.latest_version.version_number}
                            </Typography>
                            {summary && (
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: 1,
                                        p: 1.5,
                                        borderRadius: 1.5,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(148,163,184,0.12)',
                                    }}
                                >
                                    <Metric label="Days" from={summary.current_days} to={summary.latest_days} />
                                    <Metric
                                        label="Activities"
                                        from={summary.current_activities}
                                        to={summary.latest_activities}
                                    />
                                    <Metric label="Moments" from={summary.current_moments} to={summary.latest_moments} />
                                </Box>
                            )}
                            {preview.moment_changes_sample
                              && (preview.moment_changes_sample.added_moment_names.length > 0
                                || preview.moment_changes_sample.removed_moment_names.length > 0) && (
                              <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.1)' }}>
                                <Typography sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', mb: 0.75 }}>
                                  Moment changes (sample)
                                </Typography>
                                {preview.moment_changes_sample.added_moment_names.length > 0 && (
                                  <Typography sx={{ color: '#10b981', fontSize: '0.75rem', mb: 0.5 }}>
                                    + {preview.moment_changes_sample.added_moment_names.join(', ')}
                                  </Typography>
                                )}
                                {preview.moment_changes_sample.removed_moment_names.length > 0 && (
                                  <Typography sx={{ color: '#f87171', fontSize: '0.75rem' }}>
                                    − {preview.moment_changes_sample.removed_moment_names.join(', ')}
                                  </Typography>
                                )}
                              </Box>
                            )}
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{preview.warning}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setPreviewOpen(false)} disabled={resyncing} sx={{ color: '#94a3b8' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => void handleConfirmResync()}
                        disabled={resyncing}
                        startIcon={resyncing ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        Update package
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function Metric({ label, from, to }: { label: string; from: number; to: number }) {
    return (
        <Box>
            <Typography sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 700 }}>
                {from} → {to}
            </Typography>
        </Box>
    );
}
