'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  TextField,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Divider,
  IconButton,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Circle as CircleIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useBrand } from '@/features/platform/brand';
import {
  ServiceCardsGrid,
  type ServiceCardStat,
} from '@/features/catalog/packages/components/unified';
import {
  useDayBlueprints,
  useDayBlueprintVersion,
  useDeleteDayBlueprint,
  usePublishDayBlueprintVersion,
  useArchiveDayBlueprintVersion,
} from '../hooks';
import { useBranchDayBlueprintDraft } from '../hooks/useBranchDayBlueprintDraft';
import type {
  DayBlueprintSummary,
  DayBlueprintVersionStatus,
} from '../types';
import { CreateDayBlueprintDialog } from './CreateDayBlueprintDialog';

// ─── Service type metadata (mirrors UnifiedPackagesScreen) ───────────
const SERVICE_TYPE_OPTIONS: Array<{
  key: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  eventCategory: string;
}> = [
  { key: 'WEDDING', label: 'Weddings', icon: '💒', color: '#ec4899', description: 'Full wedding day coverage', eventCategory: 'Wedding' },
  { key: 'BIRTHDAY', label: 'Birthdays', icon: '🎂', color: '#f59e0b', description: 'Birthday celebrations', eventCategory: 'Birthday' },
  { key: 'ENGAGEMENT', label: 'Engagements', icon: '💍', color: '#8b5cf6', description: 'Engagement shoots and parties', eventCategory: 'Engagement' },
];

const SERVICE_KEYWORDS: Record<string, string> = {
  WEDDING: 'wedding',
  BIRTHDAY: 'birthday',
  ENGAGEMENT: 'engag',
};

function matchServiceType(eventCategory: string | null, serviceKey: string): boolean {
  if (!eventCategory) return false;
  const kw = SERVICE_KEYWORDS[serviceKey];
  if (kw) return eventCategory.toLowerCase().includes(kw);
  return eventCategory.toUpperCase().replace(/\s+/g, '_') === serviceKey;
}

function humanizeServiceType(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickPrimaryVersion(versions: DayBlueprintSummary['versions']) {
  const allVersions = versions ?? [];
  const latestPublished = allVersions
    .filter((version) => version.status === 'PUBLISHED')
    .sort((a, b) => b.version_number - a.version_number)[0];
  const latestDraft = allVersions
    .filter((version) => version.status === 'DRAFT')
    .sort((a, b) => b.version_number - a.version_number)[0];
  const newest = [...allVersions].sort((a, b) => b.version_number - a.version_number)[0];
  return latestPublished ?? latestDraft ?? newest ?? null;
}

function normalizeBlueprintDisplayName(blueprint: Pick<DayBlueprintSummary, 'key' | 'display_name'>): string {
  if (blueprint.key === 'punjabi-3day-wedding') {
    return blueprint.display_name.replace(/^3\s*[- ]\s*day\s+/i, '').trim();
  }
  if (blueprint.key === 'catholic-ceremony' || blueprint.key === 'catholic-ceremony-17') {
    return blueprint.display_name.replace(/\s*\(\s*17\s+moments\s*\)\s*/i, '').trim();
  }
  return blueprint.display_name;
}

const statusColor: Record<DayBlueprintVersionStatus, string> = {
  DRAFT: '#f59e0b',
  PUBLISHED: '#10b981',
  ARCHIVED: '#64748b',
};

type StatusFilter = 'all' | 'published' | 'draft-only';

export function DayBlueprintsPanel() {
  const { currentBrand } = useBrand();
  const { data: blueprints = [], isLoading, error } = useDayBlueprints();
  const { data: blueprintsWithSeeded = [] } = useDayBlueprints({ includeSeeded: true });

  // ── Filter state ──
  const [activeServiceKey, setActiveServiceKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<number | null>(null);

  // ── Create dialog state ──
  const [createOpen, setCreateOpen] = useState(false);

  const serviceTypeOptions = useMemo(
    () =>
      (currentBrand?.service_types ?? []).map((key) => {
        const preset = SERVICE_TYPE_OPTIONS.find((o) => o.key === key);
        return {
          key,
          eventCategory: preset?.eventCategory ?? humanizeServiceType(key),
        };
      }),
    [currentBrand?.service_types],
  );

  // ── Service cards ──
  const serviceCards: ServiceCardStat[] = useMemo(() => {
    const enabledKeys = currentBrand?.service_types ?? [];
    return enabledKeys.map((key) => {
      const preset = SERVICE_TYPE_OPTIONS.find((o) => o.key === key);
      const matching = blueprints.filter((bp) => matchServiceType(bp.event_category, key));
      const publishedCount = matching.filter((bp) =>
        (bp.versions ?? []).some((v) => v.status === 'PUBLISHED'),
      ).length;
      const draftCount = matching.filter((bp) =>
        (bp.versions ?? []).some((v) => v.status === 'DRAFT'),
      ).length;
      return {
        key,
        label: preset?.label ?? humanizeServiceType(key),
        icon: preset?.icon ?? '📦',
        color: preset?.color ?? '#6366f1',
        description: preset?.description ?? '',
        activeCount: publishedCount,
        inactiveCount: draftCount,
      };
    });
  }, [currentBrand?.service_types, blueprints]);

  // ── Filtered blueprints ──
  const filteredBlueprints = useMemo(() => {
    let result = blueprints;
    if (activeServiceKey) {
      result = result.filter((bp) => matchServiceType(bp.event_category, activeServiceKey));
    }
    if (statusFilter === 'published') {
      result = result.filter((bp) => (bp.versions ?? []).some((v) => v.status === 'PUBLISHED'));
    } else if (statusFilter === 'draft-only') {
      result = result.filter((bp) => !(bp.versions ?? []).some((v) => v.status === 'PUBLISHED'));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (bp) =>
          bp.display_name.toLowerCase().includes(q) ||
          bp.event_category.toLowerCase().includes(q) ||
          (bp.description ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [blueprints, activeServiceKey, statusFilter, searchQuery]);

  const selectedBlueprint = useMemo(
    () => blueprints.find((bp) => bp.id === selectedBlueprintId) ?? null,
    [blueprints, selectedBlueprintId],
  );

  const activeCard = activeServiceKey ? serviceCards.find((c) => c.key === activeServiceKey) ?? null : null;

  const openCreateDialog = () => {
    setCreateOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateOpen(false);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 12 }}>
        <CircularProgress size={28} sx={{ color: '#648CFF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Page header ──────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.625rem', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Day Designer
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mt: 0.5, ml: 0.25 }}>
          Author reusable day blueprints. Published versions can be consumed into new packages.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to load day blueprints.</Alert>
      )}

      {/* ── Services empty state ─────────────────────────────────── */}
      {serviceTypeOptions.length === 0 ? (
        <Box
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            py: 8, px: 3, borderRadius: 3,
            border: '2px dashed rgba(52, 58, 68, 0.3)',
            bgcolor: 'rgba(16, 18, 22, 0.3)',
          }}
        >
          <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>📐</Typography>
          <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem', mb: 1 }}>
            No services enabled yet
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3, textAlign: 'center', maxWidth: 400 }}>
            Enable a service type from the Services page before creating day blueprints.
          </Typography>
          <Button
            component={Link}
            href="/packages"
            variant="contained"
            disableElevation
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            Open Services
          </Button>
        </Box>
      ) : (
        <>
          {/* ── Service cards grid ────────────────────────────── */}
          <ServiceCardsGrid
            cards={serviceCards}
            selectedKey={activeServiceKey}
            itemLabelSingular="blueprint"
            itemLabelPlural="blueprints"
            activeLabel="active"
            onCardClick={(key) => {
              setActiveServiceKey((prev) => (prev === key ? null : key));
              setSelectedBlueprintId(null);
            }}
            onAddService={() => { /* service types are managed from /packages */ }}
            showAddCard={false}
          />

          {/* ── 2-column layout: list + sticky detail ───────── */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ flex: '0 0 58%', minWidth: 0 }}>
              {/* Filter toolbar */}
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 0.875,
                  px: 1.25,
                  mb: 2,
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.02)',
                  flexWrap: 'wrap',
                }}
              >
                <Typography component="div" sx={{ fontWeight: 700, fontSize: '1rem', mr: 'auto' }}>
                  Blueprints ({filteredBlueprints.length})
                </Typography>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    sx={{
                      borderRadius: 1.5,
                      fontSize: '0.75rem',
                      height: 32,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    }}
                  >
                    <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>All Statuses</MenuItem>
                    <MenuItem value="published" sx={{ fontSize: '0.8125rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircleIcon sx={{ fontSize: 9, color: statusColor.PUBLISHED }} />
                        Published
                      </Box>
                    </MenuItem>
                    <MenuItem value="draft-only" sx={{ fontSize: '0.8125rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircleIcon sx={{ fontSize: 9, color: statusColor.DRAFT }} />
                        Draft only
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  placeholder="Search blueprints…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.3)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25 }}>
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    ml: 'auto',
                    minWidth: 220,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.8125rem',
                      height: 32,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    },
                  }}
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.375, borderColor: 'rgba(255,255,255,0.07)' }} />

                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disableElevation
                  onClick={openCreateDialog}
                  sx={{
                    borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem', textTransform: 'none',
                    px: 1.5, height: 32, flexShrink: 0,
                    ...(activeCard ? {
                      bgcolor: activeCard.color,
                      color: '#fff',
                      '&:hover': { bgcolor: activeCard.color, filter: 'brightness(1.15)' },
                    } : {}),
                  }}
                >
                  {activeCard ? `New ${activeCard.label.replace(/s$/, '')} Blueprint` : 'New Blueprint'}
                </Button>
              </Paper>

              {/* Blueprint list */}
              <BlueprintListPanel
                blueprints={filteredBlueprints}
                selectedBlueprintId={selectedBlueprintId}
                onRowClick={(bp) =>
                  setSelectedBlueprintId((prev) => (prev === bp.id ? null : bp.id))
                }
              />
            </Box>

            {/* Right — sticky detail panel */}
            <Box sx={{ flex: '1 1 0', minWidth: 0, position: 'sticky', top: 80 }}>
              {selectedBlueprint ? (
                <BlueprintDetailPanel
                  blueprint={selectedBlueprint}
                  onClose={() => setSelectedBlueprintId(null)}
                />
              ) : null}
            </Box>
          </Box>
        </>
      )}

      <CreateDayBlueprintDialog
        open={createOpen}
        onClose={closeCreateDialog}
        seededBlueprints={blueprintsWithSeeded}
        serviceTypeOptions={serviceTypeOptions}
        activeServiceKey={activeServiceKey}
      />
    </Box>
  );
}

// ─── Blueprint list (left column) ────────────────────────────────────
function BlueprintListPanel({
  blueprints,
  selectedBlueprintId,
  onRowClick,
}: {
  blueprints: DayBlueprintSummary[];
  selectedBlueprintId: number | null;
  onRowClick: (bp: DayBlueprintSummary) => void;
}) {
  if (blueprints.length === 0) {
    return (
      <Box
        sx={{
          p: 6, borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(148,163,184,0.2)',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem', mb: 1 }}>
          No blueprints match this filter
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
          Create a blueprint to define a reusable day shape — days, activities, moments, and locking rules.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        bgcolor: 'rgba(255,255,255,0.02)',
        overflowX: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 1.9fr 0.8fr 0.9fr 0.8fr 0.8fr',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(255,255,255,0.03)',
        }}
      >
        {['Blueprint Type', 'Name', 'Days', 'Activities', 'Moments', 'Version'].map((label) => (
          <Typography
            key={label}
            sx={{
              color: '#94a3b8',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
      <Stack divider={<Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}>
        {blueprints.map((bp) => {
          const primaryVersion = pickPrimaryVersion(bp.versions);
          const rowSummary = bp.row_summary;
          const isSelected = selectedBlueprintId === bp.id;

          return (
            <Box
              key={bp.id}
              onClick={() => onRowClick(bp)}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.05fr 1.9fr 0.8fr 0.9fr 0.8fr 0.8fr',
                minWidth: 760,
                gap: 1,
                alignItems: 'center',
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                borderLeft: '3px solid',
                borderLeftColor: isSelected ? '#648CFF' : 'transparent',
                bgcolor: isSelected ? 'rgba(100,140,255,0.08)' : 'transparent',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: isSelected ? 'rgba(100,140,255,0.12)' : 'rgba(255,255,255,0.03)' },
              }}
            >
              <Typography sx={{ color: '#7dd3fc', fontSize: '0.78rem', fontWeight: 600 }}>
                {bp.event_category}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: '#e2e8f0',
                    fontWeight: 600,
                    fontSize: '0.87rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {normalizeBlueprintDisplayName(bp)}
                </Typography>
              </Box>
              <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 700 }}>
                {rowSummary?.day_count ?? 0}
              </Typography>
              <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 700 }}>
                {rowSummary?.activity_count ?? 0}
              </Typography>
              <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 700 }}>
                {rowSummary?.moment_count ?? 0}
              </Typography>
              {primaryVersion ? (
                <Chip
                  label={`v${primaryVersion.version_number} ${primaryVersion.status === 'DRAFT' ? 'draft' : primaryVersion.status.toLowerCase()}`}
                  size="small"
                  sx={{
                    height: 22,
                    width: 'fit-content',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: `${statusColor[primaryVersion.status]}1A`,
                    color: statusColor[primaryVersion.status],
                    border: 'none',
                  }}
                />
              ) : (
                <Typography sx={{ color: '#64748b', fontSize: '0.7rem', fontStyle: 'italic' }}>
                  No versions
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

// ─── Blueprint detail (right column) ─────────────────────────────────
function BlueprintDetailPanel({
  blueprint,
  onClose,
}: {
  blueprint: DayBlueprintSummary;
  onClose: () => void;
}) {
  const versions = blueprint.versions ?? [];
  const deleteMutation = useDeleteDayBlueprint();
  const publishMutation = usePublishDayBlueprintVersion();
  const archiveMutation = useArchiveDayBlueprintVersion();
  const { branchToDraft, isBranching } = useBranchDayBlueprintDraft(blueprint.id);

  const latestPublished = useMemo(
    () =>
      [...versions]
        .filter((v) => v.status === 'PUBLISHED')
        .sort((a, b) => b.version_number - a.version_number)[0] ?? null,
    [versions],
  );

  const latestDraft = useMemo(
    () =>
      [...versions]
        .filter((v) => v.status === 'DRAFT')
        .sort((a, b) => b.version_number - a.version_number)[0] ?? null,
    [versions],
  );

  const focusVersionId = latestDraft?.id ?? latestPublished?.id ?? versions[0]?.id ?? null;

  const handleEditVersion = (version: { id: number; version_number: number; status: string }) => {
    if (version.status === 'DRAFT') {
      return;
    }
    if (latestDraft) {
      const useDraft = window.confirm(
        `Open working draft v${latestDraft.version_number}, or create a new draft from v${version.version_number}?`,
      );
      if (useDraft) {
        return;
      }
    }
    void branchToDraft({
      source_version_id: version.id,
      change_summary: `Draft from v${version.version_number}`,
    });
  };
  const { data: focusedVersion, isLoading: focusedVersionLoading } = useDayBlueprintVersion(
    blueprint.id,
    focusVersionId,
  );

  const handleDeleteBlueprint = async () => {
    const shouldDelete = window.confirm(
      `Delete "${normalizeBlueprintDisplayName(blueprint)}" and all versions? This cannot be undone.`,
    );
    if (!shouldDelete) return;

    try {
      await deleteMutation.mutateAsync(blueprint.id);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete this blueprint right now.';
      window.alert(message);
    }
  };

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.version_number - a.version_number),
    [versions],
  );

  const footprint = useMemo(() => {
    const days = focusedVersion?.days ?? [];
    const activities = days.reduce(
      (sum, day) => sum + (day.activities?.length ?? 0),
      0,
    );
    const moments = days.reduce(
      (sum, day) =>
        sum +
        (day.activities?.reduce(
          (activitySum, activity) => activitySum + (activity.moments?.length ?? 0),
          0,
        ) ?? 0),
      0,
    );

    return {
      days: days.length,
      activities,
      moments,
      subjectRoles: focusedVersion?.subject_roles?.length ?? 0,
      spaceSlots: focusedVersion?.space_slots?.length ?? 0,
    };
  }, [focusedVersion]);

  const readiness = useMemo(() => {
    const checks = [
      { label: 'At least one day', ok: footprint.days > 0 },
      { label: 'At least one activity', ok: footprint.activities > 0 },
      { label: 'At least one moment', ok: footprint.moments > 0 },
      { label: 'Subject roles linked', ok: footprint.subjectRoles > 0 },
      { label: 'Space slots defined', ok: footprint.spaceSlots > 0 },
    ];
    const met = checks.filter((check) => check.ok).length;
    const score = Math.round((met / checks.length) * 100);
    return {
      score,
      missing: checks.filter((check) => !check.ok).map((check) => check.label),
    };
  }, [footprint]);

  const lastPublishedLabel = latestPublished?.published_at
    ? new Date(latestPublished.published_at).toLocaleDateString()
    : 'Never';

  const formatVersionMeta = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : 'Unknown';

  const usageImpact = {
    totalVersions: versions.length,
    publishedVersions: versions.filter((v) => v.status === 'PUBLISHED').length,
    draftVersions: versions.filter((v) => v.status === 'DRAFT').length,
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        bgcolor: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5, py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', gap: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
            {normalizeBlueprintDisplayName(blueprint)}
          </Typography>
          <Typography sx={{ color: '#7dd3fc', fontSize: '0.72rem', mt: 0.35 }}>
            {blueprint.event_category}
          </Typography>
          {blueprint.description && (
            <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mt: 0.75 }}>
              {blueprint.description}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Status summary */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
          Status Summary
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
          <InfoTile label="Live version" value={latestPublished ? `v${latestPublished.version_number}` : 'None'} />
          <InfoTile label="Draft" value={latestDraft ? `v${latestDraft.version_number}` : 'None'} />
          <InfoTile label="Last published" value={lastPublishedLabel} />
          <InfoTile label="Blueprint status" value={blueprint.is_active ? 'Active' : 'Inactive'} />
        </Box>
        {latestPublished && !latestDraft && (
          <Button
            size="small"
            variant="outlined"
            disabled={isBranching}
            onClick={() =>
              void branchToDraft({
                source_version_id: latestPublished.id,
                change_summary: `Draft from published v${latestPublished.version_number}`,
              })
            }
            sx={{ mt: 1.25, textTransform: 'none', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.35)' }}
          >
            {isBranching ? 'Creating draft…' : 'Edit blueprint (create draft)'}
          </Button>
        )}
        {latestDraft && (
          <Button
            size="small"
            component={Link}
            href="/packages"
            sx={{ mt: 1.25, textTransform: 'none', color: '#fbbf24' }}
          >
            Continue draft v{latestDraft.version_number}
          </Button>
        )}
      </Box>

      {/* Usage impact */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
          Usage Impact
        </Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${usageImpact.totalVersions} total versions`} sx={{ bgcolor: 'rgba(148,163,184,0.16)', color: '#cbd5e1', fontSize: '0.65rem' }} />
          <Chip size="small" label={`${usageImpact.publishedVersions} published`} sx={{ bgcolor: `${statusColor.PUBLISHED}1A`, color: statusColor.PUBLISHED, fontSize: '0.65rem' }} />
          <Chip size="small" label={`${usageImpact.draftVersions} drafts`} sx={{ bgcolor: `${statusColor.DRAFT}1A`, color: statusColor.DRAFT, fontSize: '0.65rem' }} />
        </Stack>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', mt: 1 }}>
          Deleting this blueprint removes all versions and prevents future package creation from its published drafts.
        </Typography>
      </Box>

      {/* Readiness score */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
          Readiness
        </Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 700 }}>
              Completeness
            </Typography>
            <Typography sx={{ color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700 }}>
              {readiness.score}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={readiness.score}
            sx={{
              height: 6,
              borderRadius: 999,
              bgcolor: 'rgba(148,163,184,0.18)',
              '& .MuiLinearProgress-bar': { borderRadius: 999, backgroundColor: '#60a5fa' },
            }}
          />
          {focusedVersionLoading ? (
            <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>Analyzing draft structure...</Typography>
          ) : readiness.missing.length > 0 ? (
            <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Missing: {readiness.missing.join(', ')}
            </Typography>
          ) : (
            <Typography sx={{ color: '#10b981', fontSize: '0.72rem' }}>
              Ready baseline met across structure, people, and spaces.
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Content footprint */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
          Content Footprint
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0.75 }}>
          <MetricPill label="Days" value={footprint.days} />
          <MetricPill label="Activities" value={footprint.activities} />
          <MetricPill label="Moments" value={footprint.moments} />
          <MetricPill label="Roles" value={footprint.subjectRoles} />
          <MetricPill label="Spaces" value={footprint.spaceSlots} />
        </Box>
      </Box>

      {/* Versions list */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
          Versions ({versions.length})
        </Typography>

        {sortedVersions.length === 0 ? (
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
            No versions yet. Create a draft to start.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {sortedVersions.map((v) => (
              <Box
                key={v.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(148,163,184,0.08)',
                }}
              >
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 700, minWidth: 40 }}>
                  v{v.version_number}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.68rem', minWidth: 74 }}>
                  {formatVersionMeta(v.created_at)}
                </Typography>
                <Chip
                  label={v.status}
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.62rem', fontWeight: 700,
                    bgcolor: `${statusColor[v.status]}1A`,
                    color: statusColor[v.status],
                    border: 'none',
                  }}
                />
                {'change_summary' in v && (v as { change_summary?: string | null }).change_summary ? (
                  <Typography
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.68rem',
                      maxWidth: 180,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {(v as { change_summary?: string | null }).change_summary}
                  </Typography>
                ) : null}
                <Box sx={{ flex: 1 }} />
                {v.status === 'DRAFT' ? (
                  <Button
                    size="small"
                    component={Link}
                    href="/packages"
                    sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#60a5fa', minWidth: 'auto' }}
                  >
                    Edit
                  </Button>
                ) : (
                  <Button
                    size="small"
                    disabled={isBranching}
                    onClick={() => handleEditVersion(v)}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#60a5fa', minWidth: 'auto' }}
                  >
                    {isBranching ? '…' : v.status === 'PUBLISHED' ? 'Edit' : 'Open'}
                  </Button>
                )}
                {v.status === 'PUBLISHED' && (
                  <Button
                    size="small"
                    component={Link}
                    href="/packages"
                    sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#94a3b8', minWidth: 'auto' }}
                  >
                    View
                  </Button>
                )}
                <IconButton
                  size="small"
                  onClick={handleDeleteBlueprint}
                  disabled={deleteMutation.isPending}
                  sx={{ color: 'error.main', p: 0.5 }}
                >
                  {deleteMutation.isPending ? (
                    <CircularProgress size={14} thickness={6} color="inherit" />
                  ) : (
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
                {v.status === 'DRAFT' && (
                  <Button
                    size="small"
                    onClick={() => publishMutation.mutate({ blueprintId: blueprint.id, versionId: v.id })}
                    disabled={publishMutation.isPending}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', color: statusColor.PUBLISHED, minWidth: 'auto' }}
                  >
                    Publish
                  </Button>
                )}
                {v.status === 'PUBLISHED' && (
                  <Button
                    size="small"
                    onClick={() => archiveMutation.mutate({ blueprintId: blueprint.id, versionId: v.id })}
                    disabled={archiveMutation.isPending}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#94a3b8', minWidth: 'auto' }}
                  >
                    Archive
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1.5,
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(148,163,184,0.14)',
      }}
    >
      <Typography sx={{ color: '#64748b', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 700, mt: 0.4 }}>
        {value}
      </Typography>
    </Box>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <Box
      sx={{
        p: 0.75,
        borderRadius: 1.5,
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(148,163,184,0.12)',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ color: '#f1f5f9', fontSize: '0.76rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
      <Typography sx={{ color: '#64748b', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.15 }}>{label}</Typography>
    </Box>
  );
}
