'use client';

/**
 * InstanceScheduleEditor — editable schedule view for project/inquiry instances.
 *
 * Uses REAL package card components (ActivitiesCard, SubjectsCard, LocationsCard,
 * CrewCard) with ScheduleApiContext providing the correct API adapter for
 * instance-mode (project/inquiry) operations.
 *
 * This component is SELF-CONTAINED — it fetches its own data via
 * useInstanceScheduleData and wraps itself in a ScheduleApiProvider.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, IconButton,
    Chip, Stack, Tooltip, CircularProgress,
    Alert, Grid, Collapse,
} from '@mui/material';
import {
    CalendarToday as DayIcon,
    Sync as SyncIcon,
    Refresh as RefreshIcon,
    CompareArrows as DiffIcon,
    Videocam as FilmIcon,
    AutoAwesome as TaskIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    VideoLibrary as VideoLibraryIcon,
    Assignment as AssignmentIcon,
    ContentCut as ContentCutIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    CalendarToday as CalendarTodayIcon,
    People as PeopleIcon,
    Place as PlaceIcon,
    Event as EventIcon,
    Groups as GroupsIcon,
    MusicNote as MusicNoteIcon,
    Brush as BrushIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    Movie as MovieIcon,
} from '@mui/icons-material';

// ─── Card components (shared with package designer) ───────────────────
import { ActivitiesCard } from './ActivitiesCard';
import { SubjectsCard } from '@/features/catalog/packages/components/detail/cards/SubjectsCard';
import { LocationsCard } from '@/features/catalog/packages/components/detail/cards/LocationsCard';
import { CrewCard } from '@/features/catalog/packages/components/detail/cards/CrewCard';
import { EquipmentCard } from '@/features/catalog/packages/components/detail/cards/EquipmentCard';
import { SummaryCard } from '@/features/catalog/packages/components/detail/cards/SummaryCard';
import { PackageScheduleCard } from './PackageScheduleCard';
import { FilmCreationWizard } from './film-wizard';

import {
    useInstanceScheduleData,
    type InstanceOwner,
} from '../hooks/useInstanceScheduleData';
import {
    ScheduleApiProvider,
    useScheduleApi,
    createProjectScheduleApi,
    createInquiryScheduleApi,
    type ScheduleApi,
} from './ScheduleApiContext';
import ScheduleDiffView from './ScheduleDiffView';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { equipmentApi } from '@/features/workflow/equipment/api';
import { scheduleApi as workflowScheduleApi } from '@/features/workflow/scheduling/api';
import { taskLibraryApi } from '@/features/catalog/task-library/api';
import { formatCurrency } from '@/shared/utils/formatUtils';
import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';
import {
    TaskAutoGenerationPreview,
    TaskAutoGenerationPreviewTask,
    PHASE_LABELS,
    ProjectPhase,
    TriggerType,
} from '@/features/catalog/task-library/types';

// ─── Types ────────────────────────────────────────────────────────────

interface InstanceScheduleEditorProps {
    owner: InstanceOwner;
    /** Optional: called when user requests "Sync from Package" */
    onSyncFromPackage?: () => void;
    /** Whether sync is in progress */
    syncing?: boolean;
    /** Source package ID (used for task auto-gen preview) */
    sourcePackageId?: number | null;
}

// ─── Inner Editor (assumes context is available) ──────────────────────

function ScheduleEditorContent({
    owner,
    onSyncFromPackage,
    syncing,
    sourcePackageId,
}: InstanceScheduleEditorProps) {
    const scheduleApi = useScheduleApi();
    const router = useRouter();
    const { currentBrand } = useBrand();
    const safeBrandId = currentBrand?.id;
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const {
        data,
        refData,
        setActivities,
        setSubjects,
        setLocationSlots,
        setOperators,
        setEventDays,
        setFilms,
        loading,
        error,
        refresh,
        hasData,
        activeDayId,
        setActiveDayId,
        selectedActivityId,
        setSelectedActivityId,
    } = useInstanceScheduleData(owner, safeBrandId);

    const { eventDays, activities, operators, subjects, locationSlots, films } = data;
    const { crewMembers, jobRoles, subjectTemplates, allEquipment } = refData;

    // ── Shared card style ──
    const cardSx = {
        background: 'rgba(16, 18, 22, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(52, 58, 68, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    // ── Activity color preview (live-preview unsaved palette changes on timeline) ──
    const [activityColorOverrides, setActivityColorOverrides] = useState<Record<number, string>>({});
    const handleColorPreview = useCallback((activityId: number | null, color: string | null) => {
        if (activityId == null) {
            setActivityColorOverrides({});
        } else if (color) {
            setActivityColorOverrides(prev => ({ ...prev, [activityId]: color }));
        }
    }, []);

    // ── Unmanned equipment state ──
    const [unmannedEquipment, setUnmannedEquipment] = useState<any[]>([]);

    // Load unmanned equipment on mount
    useEffect(() => {
        if (!safeBrandId) return;
        equipmentApi.findUnmanned(safeBrandId)
            .then(list => setUnmannedEquipment(list || []))
            .catch(() => {});
    }, [safeBrandId]);

    // ── Synthetic formData for EquipmentCard (instances don't have a ServicePackage) ──
    // EquipmentCard reads equipment from formData.contents.day_equipment / activity_equipment
    // but also has a relational fallback (from operator→equipment links).
    // We provide an empty shell so the component mounts, and actual equipment
    // is populated from the relational operator data.
    const [equipmentContents, setEquipmentContents] = useState<Record<string, any>>({});
    const syntheticFormData = useMemo<Partial<ServicePackage>>(
        () => ({ contents: equipmentContents } as Partial<ServicePackage>),
        [equipmentContents],
    );
    const setSyntheticFormData = useCallback((updater: React.SetStateAction<Partial<ServicePackage>>) => {
        const next = typeof updater === 'function' ? updater(syntheticFormData) : updater;
        setEquipmentContents((next as any).contents || {});
    }, [syntheticFormData]);

    // ── Diff dialog state ──
    const [diffOpen, setDiffOpen] = useState(false);

    // ── Film wizard state ──
    const [filmWizardOpen, setFilmWizardOpen] = useState(false);

    // ── Task auto-gen preview state ──
    const [taskPreview, setTaskPreview] = useState<TaskAutoGenerationPreview | null>(null);
    const [taskPreviewLoading, setTaskPreviewLoading] = useState(false);
    const [taskPreviewError, setTaskPreviewError] = useState<string | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

    const loadTaskPreview = useCallback(async () => {
        if (!sourcePackageId || !safeBrandId) return;
        setTaskPreviewLoading(true);
        setTaskPreviewError(null);
        try {
            const inquiryId = owner.type === 'inquiry' ? owner.id : undefined;
            const projectId = owner.type === 'project' ? owner.id : undefined;
            const previewData = await taskLibraryApi.previewAutoGeneration(
                sourcePackageId,
                safeBrandId,
                inquiryId,
                projectId,
            );
            setTaskPreview(previewData);
        } catch (err) {
            setTaskPreviewError(err instanceof Error ? err.message : 'Failed to load task preview');
        } finally {
            setTaskPreviewLoading(false);
        }
    }, [sourcePackageId, safeBrandId, owner]);

    useEffect(() => {
        loadTaskPreview();
    }, [loadTaskPreview]);

    const togglePhase = (phase: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phase)) next.delete(phase);
            else next.add(phase);
            return next;
        });
    };

    // ── Timeline activity time change handler ──
    const handleActivityTimeChange = useCallback(async (activityId: number, startTime: string, endTime: string) => {
        try {
            await scheduleApi.activities.update(activityId, { start_time: startTime, end_time: endTime });
            setActivities((prev: any[]) =>
                prev.map((a: any) => a.id === activityId ? { ...a, start_time: startTime, end_time: endTime } : a),
            );
        } catch (err) {
            console.warn('Failed to update activity time:', err);
        }
    }, [scheduleApi, setActivities]);

    // ── Film CRUD (instance-specific: kept inline) ──
    const handleDeleteFilm = async (filmRecordId: number) => {
        try {
            if (owner.type === 'project') {
                await workflowScheduleApi.projectFilms.delete(filmRecordId);
            } else {
                await workflowScheduleApi.inquiryFilms.delete(filmRecordId);
            }
            setFilms((prev: any[]) => prev.filter((f: any) => f.id !== filmRecordId));
        } catch (err) {
            console.warn('Failed to delete film:', err);
        }
    };

    // ── Loading / error / empty ──
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
    }

    if (!hasData) {
        return (
            <Box sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
                <DayIcon sx={{ fontSize: 48, color: '#4b5563', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
                    No Schedule Data
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                    {owner.type === 'inquiry'
                        ? 'Select a package to create a schedule snapshot.'
                        : 'A schedule is created when an inquiry with a package is converted to a project.'}
                </Typography>
                {onSyncFromPackage && (
                    <Button
                        startIcon={<SyncIcon />}
                        variant="outlined"
                        onClick={onSyncFromPackage}
                        disabled={syncing}
                        sx={{ borderColor: '#8b5cf640', color: '#8b5cf6' }}
                    >
                        {syncing ? 'Syncing…' : 'Sync from Package'}
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box>
            {/* ── Header row ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DayIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' }}>
                        Schedule
                    </Typography>
                    <Chip
                        size="small"
                        label={`${eventDays.length} days · ${activities.length} activities`}
                        sx={{ color: '#94a3b8', fontSize: '0.7rem', height: 22 }}
                        variant="outlined"
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View changes since clone">
                        <Button
                            size="small"
                            startIcon={<DiffIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setDiffOpen(true)}
                            sx={{ fontSize: '0.7rem', color: '#64b5f6', textTransform: 'none' }}
                        >
                            Changes
                        </Button>
                    </Tooltip>
                    {onSyncFromPackage && (
                        <Tooltip title="Re-clone from source package">
                            <Button
                                size="small"
                                startIcon={syncing ? <CircularProgress size={12} /> : <SyncIcon sx={{ fontSize: 14 }} />}
                                onClick={onSyncFromPackage}
                                disabled={syncing}
                                sx={{ fontSize: '0.7rem', color: '#8b5cf6', textTransform: 'none' }}
                            >
                                Sync
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip title="Refresh">
                        <IconButton size="small" onClick={refresh} sx={{ color: '#6b7280' }}>
                            <RefreshIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* ── Total Cost Summary ── */}
            <SummaryCard
                PackageCrewSlots={operators}
                taskPreview={taskPreview}
                contents={equipmentContents as any}
                allEquipment={allEquipment}
                currency={currency}
                taxRate={Number(currentBrand?.default_tax_rate ?? 0)}
                cardSx={cardSx}
            />

            {/* ── Timeline Schedule Bar ── */}
            <PackageScheduleCard
                packageId={null}
                brandId={safeBrandId ?? 0}
                packageEventDays={eventDays}
                setPackageEventDays={setEventDays}
                PackageCrewSlots={operators}
                cardSx={cardSx as Record<string, unknown>}
                activeDayId={activeDayId}
                onActiveDayChange={(dayId) => { setActiveDayId(dayId); setSelectedActivityId(null); }}
                selectedActivityId={selectedActivityId}
                onSelectedActivityChange={setSelectedActivityId}
                onActivityTimeChange={handleActivityTimeChange}
                externalActivities={activities}
                colorOverrides={activityColorOverrides}
            />

            {/* ── Main grid: Activities | Subjects+Locations | Crew+Equipment ── */}
            <Grid container spacing={2.5}>
                {/* ────── Column 1: Activities Card ────── */}
                <Grid item xs={12} md={5}>
                    <ActivitiesCard
                        packageId={null}
                        packageEventDays={eventDays}
                        activities={activities}
                        setActivities={setActivities}
                        activeDayId={activeDayId}
                        cardSx={cardSx}
                        packageSubjects={subjects}
                        setPackageSubjects={setSubjects}
                        packageLocationSlots={locationSlots}
                        setPackageLocationSlots={setLocationSlots}
                        PackageCrewSlots={operators}
                        setPackageCrewSlots={setOperators}
                        selectedActivityId={selectedActivityId}
                        onSelectedActivityChange={setSelectedActivityId}
                        onColorPreview={handleColorPreview}
                    />
                </Grid>

                {/* ────── Column 2: Subjects + Locations ────── */}
                <Grid item xs={12} md={3.5}>
                    <SubjectsCard
                        packageId={null}
                        packageEventDays={eventDays}
                        packageActivities={activities}
                        packageSubjects={subjects}
                        setPackageSubjects={setSubjects}
                        subjectTemplates={subjectTemplates}
                        scheduleActiveDayId={activeDayId}
                        selectedActivityId={selectedActivityId}
                        cardSx={cardSx}
                    />
                    <Box sx={{ mt: 2.5 }} />
                    <LocationsCard
                        packageId={null}
                        packageEventDays={eventDays}
                        packageActivities={activities}
                        packageLocationSlots={locationSlots}
                        setPackageLocationSlots={setLocationSlots}
                        scheduleActiveDayId={activeDayId}
                        selectedActivityId={selectedActivityId}
                        cardSx={cardSx}
                    />
                </Grid>

                {/* ────── Column 3: Crew + Equipment ────── */}
                <Grid item xs={12} md={3.5}>
                    <CrewCard
                        packageId={null}
                        PackageCrewSlots={operators}
                        setPackageCrewSlots={setOperators}
                        packageEventDays={eventDays}
                        packageActivities={activities}
                        scheduleActiveDayId={activeDayId}
                        selectedActivityId={selectedActivityId}
                        crewMembers={crewMembers}
                        jobRoles={jobRoles}
                        taskPreview={taskPreview}
                        currency={currency}
                        cardSx={cardSx}
                    />
                    <Box sx={{ mt: 2.5 }} />
                    <EquipmentCard
                        packageId={null}
                        safeBrandId={safeBrandId}
                        formData={syntheticFormData}
                        setFormData={setSyntheticFormData}
                        PackageCrewSlots={operators}
                        setPackageCrewSlots={setOperators}
                        packageEventDays={eventDays}
                        packageActivities={activities}
                        scheduleActiveDayId={activeDayId}
                        selectedActivityId={selectedActivityId}
                        allEquipment={allEquipment}
                        unmannedEquipment={unmannedEquipment}
                        setUnmannedEquipment={setUnmannedEquipment}
                        currency={currency}
                        cardSx={cardSx}
                    />
                </Grid>
            </Grid>

            {/* ── Row 2: Films + Task Auto-Gen ── */}
            <Grid container spacing={2.5} sx={{ mt: 0 }}>
                {/* ── Films panel ── */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ ...(cardSx as object), overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: films.length > 0 ? '1px solid rgba(52, 58, 68, 0.25)' : 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(100, 140, 255, 0.1)', border: '1px solid rgba(100, 140, 255, 0.2)' }}>
                                        <VideoLibraryIcon sx={{ fontSize: 14, color: '#648CFF' }} />
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Films</Typography>
                                </Box>
                                {films.length > 0 && (
                                    <Chip label={`${films.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', border: '1px solid rgba(100, 140, 255, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                                )}
                                <Button
                                    size="small"
                                    startIcon={<FilmIcon sx={{ fontSize: 12 }} />}
                                    onClick={() => setFilmWizardOpen(true)}
                                    disabled={activities.length === 0}
                                    sx={{ ml: 'auto', fontSize: '0.65rem', color: '#648CFF', textTransform: 'none', minWidth: 0, px: 1 }}
                                >
                                    Add Film
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={{ px: 2.5, py: 1.5 }}>
                            {films.length > 0 ? (
                                <Stack spacing={0.5}>
                                    {films.map((pf: any) => {
                                        const film = pf.film;
                                        const sceneCount = pf.scene_schedules?.length || film?.scenes?.length || 0;
                                        const linkedActivityIds = Array.from(
                                            new Set(
                                                (pf.scene_schedules || [])
                                                    .map((schedule: any) => schedule.project_activity_id)
                                                    .filter((activityId: number | null | undefined) => Number.isFinite(activityId)),
                                            ),
                                        ) as number[];
                                        const linkedActivityId = linkedActivityIds.length === 1 ? linkedActivityIds[0] : null;
                                        return (
                                            <Box
                                                key={pf.id}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1,
                                                    py: 0.75, px: 1.5, mx: -1, borderRadius: 1.5,
                                                    borderLeft: '3px solid rgba(100,140,255,0.4)',
                                                    bgcolor: 'rgba(100,140,255,0.025)',
                                                    transition: 'background 0.15s ease',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(100,140,255,0.07)',
                                                        '& .film-del': { opacity: 1 },
                                                    },
                                                }}
                                                onClick={() => {
                                                    const mode = owner.type === 'inquiry' ? 'inquiry' : 'project';
                                                    const params = new URLSearchParams({ mode });
                                                    if (owner.type === 'project') params.set('projectId', String(owner.id));
                                                    if (owner.type === 'inquiry') params.set('inquiryId', String(owner.id));
                                                    if (sourcePackageId) params.set('packageId', String(sourcePackageId));
                                                    if (pf.film_id) params.set('filmId', String(pf.film_id));
                                                    if (linkedActivityId) params.set('activityId', String(linkedActivityId));
                                                    router.push(`/designer/instance-films/${pf.id}?${params.toString()}`);
                                                }}
                                            >
                                                <FilmIcon sx={{ fontSize: 16, color: '#648CFF', flexShrink: 0 }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {film?.name || `Film #${pf.film_id}`}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.25 }}>
                                                        {sceneCount > 0 && (
                                                            <Chip
                                                                icon={<ContentCutIcon sx={{ fontSize: '10px !important', color: '#94a3b8 !important' }} />}
                                                                label={`${sceneCount} scene${sceneCount !== 1 ? 's' : ''}`}
                                                                size="small"
                                                                sx={{ height: 18, fontSize: '0.55rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none' }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                                <Box className="film-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteFilm(pf.id); }}
                                                        sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            ) : (
                                <Box sx={{ py: 2, textAlign: 'center' }}>
                                    <VideoLibraryIcon sx={{ fontSize: 32, color: '#475569', mb: 0.5, opacity: 0.3 }} />
                                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>No films linked</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Grid>

                {/* ── Task Auto-Gen panel ── */}
                <Grid item xs={12} md={6}>
                    <InstanceTaskPreviewCard
                        taskPreview={taskPreview}
                        taskPreviewLoading={taskPreviewLoading}
                        taskPreviewError={taskPreviewError}
                        expandedPhases={expandedPhases}
                        togglePhase={togglePhase}
                        onRefresh={loadTaskPreview}
                        currency={currency}
                        cardSx={cardSx}
                    />
                </Grid>
            </Grid>

            {/* ── Schedule Diff Dialog ── */}
            <ScheduleDiffView
                open={diffOpen}
                onClose={() => setDiffOpen(false)}
                owner={owner}
            />

            {/* ── Film Creation Wizard ── */}
            <FilmCreationWizard
                open={filmWizardOpen}
                onClose={() => setFilmWizardOpen(false)}
                packageId={null}
                instanceOwner={owner}
                externalOperators={operators}
                activities={activities}
                packageName={`${owner.type === 'project' ? 'Project' : 'Inquiry'} Schedule`}
                onFilmCreated={() => {
                    // Refresh films from API to get full nested data
                    const fetchFilms = owner.type === 'project'
                        ? workflowScheduleApi.projectFilms.getAll(owner.id)
                        : workflowScheduleApi.inquiryFilms.getAll(owner.id);
                    fetchFilms.then(fresh => setFilms(fresh)).catch(() => {});
                }}
            />
        </Box>
    );
}

// ─── Trigger type icon helper ──────────────────────────────────────

function triggerIcon(type: TriggerType) {
    switch (type) {
        case TriggerType.PER_PROJECT: return <FolderIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM: return <MovieIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM_WITH_MUSIC: return <MusicNoteIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM_WITH_GRAPHICS: return <BrushIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_EVENT_DAY: return <CalendarTodayIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_CREW_MEMBER: return <PeopleIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_LOCATION: return <PlaceIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_ACTIVITY: return <EventIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_ACTIVITY_CREW: return <GroupsIcon sx={{ fontSize: 12 }} />;
        case TriggerType.PER_FILM_SCENE: return <ContentCutIcon sx={{ fontSize: 12 }} />;
        default: return <AssignmentIcon sx={{ fontSize: 12 }} />;
    }
}

// ─── Phase color helper ──────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
    Lead: '#94a3b8',
    Inquiry: '#a78bfa',
    Booking: '#22d3ee',
    Creative_Development: '#f59e0b',
    Pre_Production: '#fb923c',
    Production: '#ef4444',
    Post_Production: '#8b5cf6',
    Delivery: '#10b981',
};

// ─── Task preview card (mirrors TaskAutoGenCard from package page) ──────

function InstanceTaskPreviewCard({
    taskPreview,
    taskPreviewLoading,
    taskPreviewError,
    expandedPhases,
    togglePhase,
    onRefresh,
    currency,
    cardSx,
}: {
    taskPreview: TaskAutoGenerationPreview | null;
    taskPreviewLoading: boolean;
    taskPreviewError: string | null;
    expandedPhases: Set<string>;
    togglePhase: (phase: string) => void;
    onRefresh: () => void;
    currency: string;
    cardSx: object;
}) {
    return (
        <Box sx={{ ...cardSx, overflow: 'hidden' }}>
            {/* Card Header */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 28, height: 28, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)',
                        }}>
                            <TaskIcon sx={{ fontSize: 14, color: '#a78bfa' }} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Task Auto-Generation
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Refresh preview">
                            <span>
                                <IconButton size="small" onClick={onRefresh} disabled={taskPreviewLoading} sx={{ color: '#64748b', '&:hover': { color: '#a78bfa' } }}>
                                    <RefreshIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        {taskPreview && taskPreview.summary.total_generated_tasks > 0 && (
                            <Chip
                                label={`${taskPreview.summary.total_generated_tasks} tasks`}
                                size="small"
                                sx={{
                                    height: 18, fontSize: '0.55rem', fontWeight: 700,
                                    bgcolor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa',
                                    border: '1px solid rgba(167, 139, 250, 0.2)',
                                    '& .MuiChip-label': { px: 0.6 },
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ px: 2.5, py: 2 }}>
                {taskPreviewLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: '#a78bfa' }} />
                    </Box>
                )}

                {taskPreviewError && (
                    <Alert severity="error" sx={{ mb: 1.5, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                        {taskPreviewError}
                    </Alert>
                )}

                {!taskPreviewLoading && !taskPreviewError && taskPreview && (() => {
                    // Exclude sales pipeline phases — these are overhead tracked separately
                    const EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);
                    const projectPhaseEntries = Object.entries(taskPreview.byPhase).filter(
                        ([phase]) => !EXCLUDED_PHASES.has(phase),
                    );
                    const projectPhaseTasks = projectPhaseEntries.flatMap(([, tasks]) => tasks as TaskAutoGenerationPreviewTask[]);
                    const projectTotalTasks = projectPhaseTasks.reduce((sum, t) => sum + t.total_instances, 0);
                    const projectTotalHours = projectPhaseTasks.reduce((sum, t) => sum + t.total_hours, 0);
                    const projectTotalCost = projectPhaseTasks.reduce((sum, t) => sum + (t.estimated_cost ?? 0), 0);

                    return (
                    <>
                        {/* Summary Stats */}
                        <Box sx={{
                            display: 'flex', gap: 1.5, mb: 2,
                            p: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(167, 139, 250, 0.04)',
                            border: '1px solid rgba(167, 139, 250, 0.12)',
                        }}>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>
                                    {projectTotalTasks}
                                </Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Tasks
                                </Typography>
                            </Box>
                            <Box sx={{ width: '1px', bgcolor: 'rgba(167, 139, 250, 0.15)' }} />
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#22d3ee' }}>
                                    {Math.round(projectTotalHours * 10) / 10}h
                                </Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Est. Hours
                                </Typography>
                            </Box>
                            <Box sx={{ width: '1px', bgcolor: 'rgba(167, 139, 250, 0.15)' }} />
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>
                                    {projectTotalCost > 0 ? formatCurrency(projectTotalCost, currency) : '—'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Est. Cost
                                </Typography>
                            </Box>
                        </Box>

                        {/* Phase breakdown */}
                        <Box>
                            {/* Column headers */}
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 60px 100px 120px 80px 55px 30px',
                                gap: 0.5, px: 1.5, py: 0.75, mb: 0.5,
                                borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
                            }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Task</Typography>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Count</Typography>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <WorkIcon sx={{ fontSize: 10 }} />Role
                                </Typography>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <PersonIcon sx={{ fontSize: 10 }} />Crew
                                </Typography>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.3 }}>
                                    Cost
                                </Typography>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Hours</Typography>
                                <Box />
                            </Box>

                            {/* Phase groups — Lead/Inquiry/Booking excluded (sales overhead) */}
                            <Stack spacing={0.5}>
                                {projectPhaseEntries.map(([phase, tasks]) => {
                                    const phaseLabel = PHASE_LABELS[phase as ProjectPhase] || phase;
                                    const phaseColor = PHASE_COLORS[phase] || '#94a3b8';
                                    const isExpanded = expandedPhases.has(phase);
                                    const phaseHours = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + t.total_hours, 0);
                                    const phaseTaskCount = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + t.total_instances, 0);
                                    const phaseCost = tasks.reduce((sum: number, t: TaskAutoGenerationPreviewTask) => sum + (t.estimated_cost ?? 0), 0);
                                    const uniqueRoles = new Set(tasks.map((t: TaskAutoGenerationPreviewTask) => t.role_name).filter(Boolean)).size;
                                    const uniqueCrew = new Set(tasks.map((t: TaskAutoGenerationPreviewTask) => t.assigned_to_name).filter(Boolean)).size;

                                    return (
                                        <Box key={phase}>
                                            {/* Phase header */}
                                            <Box
                                                onClick={() => togglePhase(phase)}
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 60px 100px 120px 80px 55px 30px',
                                                    gap: 0.5, alignItems: 'center',
                                                    p: 1, borderRadius: 1.5, cursor: 'pointer',
                                                    bgcolor: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(52, 58, 68, 0.2)',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: `${phaseColor}40` },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                    <Box sx={{ width: 4, height: 20, borderRadius: 1, bgcolor: phaseColor, flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', minWidth: 0 }} noWrap>
                                                        {phaseLabel}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={`${phaseTaskCount}`}
                                                    size="small"
                                                    sx={{
                                                        height: 18, fontSize: '0.55rem', fontWeight: 700,
                                                        bgcolor: `${phaseColor}12`, color: phaseColor,
                                                        border: `1px solid ${phaseColor}25`,
                                                        '& .MuiChip-label': { px: 0.6 },
                                                        justifySelf: 'center',
                                                    }}
                                                />
                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                    {uniqueRoles > 0 ? (
                                                        <><WorkIcon sx={{ fontSize: 10 }} />{uniqueRoles} role{uniqueRoles !== 1 ? 's' : ''}</>
                                                    ) : (
                                                        <Typography component="span" sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                    {uniqueCrew > 0 ? (
                                                        <><PersonIcon sx={{ fontSize: 10 }} />{uniqueCrew} crew</>
                                                    ) : (
                                                        <Typography component="span" sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>
                                                    )}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                    {phaseCost > 0 ? formatCurrency(phaseCost, currency) : '—'}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                    {phaseHours > 0 ? `${Math.round(phaseHours * 10) / 10}h` : '0h'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16, color: '#64748b' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#64748b' }} />}
                                                </Box>
                                            </Box>

                                            {/* Expanded task rows — grouped by film where applicable */}
                                            <Collapse in={isExpanded}>
                                                <Box sx={{ mt: 0.25 }}>
                                                    {(() => {
                                                        const filmGroups = new Map<string, TaskAutoGenerationPreviewTask[]>();
                                                        const generalTasks: TaskAutoGenerationPreviewTask[] = [];
                                                        (tasks as TaskAutoGenerationPreviewTask[]).forEach(t => {
                                                            if (t.film_name) {
                                                                if (!filmGroups.has(t.film_name)) filmGroups.set(t.film_name, []);
                                                                filmGroups.get(t.film_name)!.push(t);
                                                            } else {
                                                                generalTasks.push(t);
                                                            }
                                                        });

                                                        const renderRow = (task: TaskAutoGenerationPreviewTask, key: string, displayName?: string) => (
                                                            <Box
                                                                key={key}
                                                                sx={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '1fr 60px 100px 120px 80px 55px 30px',
                                                                    gap: 0.5, alignItems: 'center',
                                                                    py: 0.5, px: 1.5,
                                                                    borderLeft: `2px solid ${phaseColor}30`,
                                                                    borderBottom: '1px solid rgba(52, 58, 68, 0.08)',
                                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                                                }}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                                    {triggerIcon(task.trigger_type as TriggerType)}
                                                                    <Typography sx={{ fontSize: '0.68rem', color: '#cbd5e1', minWidth: 0 }} noWrap>
                                                                        {displayName ?? task.name}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {task.multiplier > 1 ? `×${task.multiplier}` : ''}
                                                                </Typography>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    {task.role_name ? (
                                                                        <Tooltip title={`Role: ${task.role_name}`} arrow placement="top">
                                                                            <Chip icon={<WorkIcon sx={{ fontSize: 10 }} />} label={task.role_name} size="small"
                                                                                sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.25)', '& .MuiChip-icon': { color: '#a78bfa' }, '& .MuiChip-label': { px: 0.5 }, maxWidth: '100%' }} />
                                                                        </Tooltip>
                                                                    ) : <Typography sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>}
                                                                </Box>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    {task.assigned_to_name ? (
                                                                        <Tooltip title={`Assigned to: ${task.assigned_to_name}`} arrow placement="top">
                                                                            <Chip icon={<PersonIcon sx={{ fontSize: 10 }} />} label={task.assigned_to_name} size="small"
                                                                                sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(34, 211, 238, 0.12)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.25)', '& .MuiChip-icon': { color: '#22d3ee' }, '& .MuiChip-label': { px: 0.5 }, maxWidth: '100%' }} />
                                                                        </Tooltip>
                                                                    ) : <Typography sx={{ fontSize: '0.6rem', color: '#334155' }}>—</Typography>}
                                                                </Box>
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {task.estimated_cost != null && task.estimated_cost > 0 ? formatCurrency(task.estimated_cost, currency) : '—'}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {task.total_hours > 0 ? `${Math.round(task.total_hours * 10) / 10}h` : '—'}
                                                                </Typography>
                                                                <Box />
                                                            </Box>
                                                        );

                                                        return (
                                                            <>
                                                                {generalTasks.map((task, idx) => renderRow(task, `${task.task_library_id}-${idx}`))}
                                                                {Array.from(filmGroups.entries()).map(([filmName, filmTasks], groupIdx) => {
                                                                    const filmHours = filmTasks.reduce((s, t) => s + t.total_hours, 0);
                                                                    const filmCost = filmTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);
                                                                    const stripFilm = (name: string) => {
                                                                        if (name.endsWith(` (${filmName})`)) return name.slice(0, -(` (${filmName})`).length);
                                                                        if (name.endsWith(` — ${filmName}`)) return name.slice(0, -(` — ${filmName}`).length);
                                                                        return name;
                                                                    };
                                                                    return (
                                                                        <Box key={`filmgroup-${filmName}`}>
                                                                            <Box sx={{
                                                                                display: 'grid',
                                                                                gridTemplateColumns: '1fr 60px 100px 120px 80px 55px 30px',
                                                                                gap: 0.5,
                                                                                alignItems: 'center',
                                                                                px: 1.5, py: 0.45,
                                                                                bgcolor: 'rgba(74, 222, 128, 0.05)',
                                                                                borderLeft: '2px solid rgba(74, 222, 128, 0.4)',
                                                                                borderBottom: '1px solid rgba(52, 58, 68, 0.15)',
                                                                                mt: (generalTasks.length > 0 || groupIdx > 0) ? 0.5 : 0,
                                                                            }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                                                    <MovieIcon sx={{ fontSize: 11, color: '#4ade80', flexShrink: 0 }} />
                                                                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#4ade80', minWidth: 0 }} noWrap>
                                                                                        {filmName}
                                                                                    </Typography>
                                                                                </Box>
                                                                                <Chip
                                                                                    label={`${filmTasks.length}`}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        height: 18, fontSize: '0.55rem', fontWeight: 700,
                                                                                        bgcolor: `${phaseColor}12`, color: phaseColor,
                                                                                        border: `1px solid ${phaseColor}25`,
                                                                                        '& .MuiChip-label': { px: 0.6 },
                                                                                        justifySelf: 'center',
                                                                                    }}
                                                                                />
                                                                                <Box /><Box />
                                                                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#f59e0b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                                                    {filmCost > 0 ? formatCurrency(filmCost, currency) : '—'}
                                                                                </Typography>
                                                                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#94a3b8', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                                                    {filmHours > 0 ? `${Math.round(filmHours * 10) / 10}h` : '—'}
                                                                                </Typography>
                                                                                <Box />
                                                                            </Box>
                                                                            {filmTasks.map((task, idx) => renderRow(task, `film-${filmName}-${task.task_library_id}-${idx}`, stripFilm(task.name)))}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </>
                                                        );
                                                    })()}
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>

                        {/* Empty state */}
                        {projectTotalTasks === 0 && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <AssignmentIcon sx={{ fontSize: 36, color: '#475569', mb: 1, opacity: 0.4 }} />
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    No tasks in your library yet.
                                </Typography>
                                <Typography sx={{ fontSize: '0.65rem', color: '#475569', mt: 0.5 }}>
                                    Add tasks to your Task Library to see auto-generation previews.
                                </Typography>
                            </Box>
                        )}
                    </>
                    );
                })()}

                {/* No preview / no source package */}
                {!taskPreviewLoading && !taskPreviewError && !taskPreview && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <TaskIcon sx={{ fontSize: 36, color: '#475569', mb: 1, opacity: 0.4 }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Task preview unavailable.
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#475569', mt: 0.5 }}>
                            Select a source package to see auto-generated task previews.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// ─── Time helpers ──────────────────────────────────────────────────────

function parseTime(t: string): number | null {
    const match = t.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function formatTime(t: string): string {
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return t;
    const h = parseInt(m[1], 10);
    const mins = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${mins} ${ampm}`;
}

// ─── Main Exported Component (wraps in ScheduleApiProvider) ────────────

export default function InstanceScheduleEditor(props: InstanceScheduleEditorProps) {
    const { owner } = props;

    const scheduleApi: ScheduleApi = useMemo(() => {
        return owner.type === 'project'
            ? createProjectScheduleApi(owner.id)
            : createInquiryScheduleApi(owner.id);
    }, [owner.type, owner.id]);

    return (
        <ScheduleApiProvider scheduleApi={scheduleApi}>
            <ScheduleEditorContent {...props} />
        </ScheduleApiProvider>
    );
}
