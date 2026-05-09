'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, CircularProgress, Alert, Tabs, Tab } from '@mui/material';

import { filmsApi } from '@/features/content/films/api';
import { useEventTypes } from '@/features/catalog/package-templates/hooks';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { scheduleApi, PackageTimelineCard, ActivitiesCard } from '@/features/workflow/scheduling/package-template';
import { FilmCreationWizard } from '@/features/workflow/scheduling/film-wizard';

import { usePackageData, usePackageActions } from '../hooks';
import { usePlanningProgress } from '../hooks/usePlanningProgress';
import type { PackageFilmRecord, PackageEventDaySubjectRecord, PackageLocationSlotRecord, PackageSpaceSlotRecord, PackageCrewSlotRecord } from '../types';
import {
    SummaryCard, ContextCard,
} from '../components/detail/cards';
import { AddItemDialog, VersionHistoryDialog } from '../components/detail/dialogs';
import PackageAiRunsPanel from '../components/detail/PackageAiRunsPanel';
import { PackageHeader } from '../components/detail/header';
import {
    PeopleTabPanel, LocationsTabPanel, CrewTabPanel,
    EquipmentTabPanel, TasksTabPanel, ContentTabPanel, DeliverablesTabPanel,
} from '../components/detail/tabs';

export function PackageDetailScreen({ packageIdParam }: { packageIdParam: string }) {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const safeBrandId = currentBrand?.id;
    const packageId = packageIdParam === 'new' ? null : Number(packageIdParam);
    const { data: eventTypes = [] } = useEventTypes({ enabled: !!safeBrandId });

    const {
        isLoading, error,
        formData, setFormData,
        films, setFilms,
        subjectTemplates,
        crew, jobRoles,
        allEquipment,
        unmannedEquipment, setUnmannedEquipment,
        setPackageFilms,
        packageEventDays, setPackageEventDays,
        packageActivities, setPackageActivities,
        PackageCrewSlots, setPackageCrewSlots,
        taskPreview,
        packageSubjects, setPackageSubjects,
        packageLocationSlots, setPackageLocationSlots,
        packageVersions, versionsLoading, loadVersions,
        reload,
    } = usePackageData({ packageId, brandId: safeBrandId });

    const peopleSubjectTemplates = useCallback(() => {
        const rawCategory =
            formData.category ??
            (formData as { event_category?: string | null }).event_category ??
            '';
        const categoryKey = rawCategory.trim().toLowerCase();
        if (!categoryKey) return subjectTemplates;

        const matchedEventType = eventTypes.find((eventType) => {
            const eventCategoryKey = (eventType.event_category ?? eventType.name ?? '').trim().toLowerCase();
            const eventNameKey = (eventType.name ?? '').trim().toLowerCase();
            return eventCategoryKey === categoryKey || eventNameKey === categoryKey;
        });

        // When the package's event_category matches a known template, scope the
        // suggested subject roles to that template so unrelated categories
        // (e.g. birthday roles on a wedding package) don't leak in. Fall back
        // to the brand-wide role list only when no template matched at all.
        if (matchedEventType) {
            const matchedRoles = matchedEventType.subject_roles
                ?.map((link) => link.subject_role)
                .filter((role): role is NonNullable<typeof role> => Boolean(role)) ?? [];
            return matchedRoles;
        }

        return subjectTemplates;
    }, [eventTypes, formData, subjectTemplates]);

    // ── AI Planning progress (SSE) ───────────────────────────────────
    const planningStatus = (formData as { planning_status?: string }).planning_status;
    const planning = usePlanningProgress(packageId, planningStatus);

    const {
        isSaving, handleSave, handleRestoreVersion,
        handleAddItem, handleRemoveItem, handleConfigureItem,
    } = usePackageActions({
        packageId, safeBrandId,
        formData, setFormData,
        router, films, setPackageFilms, loadVersions,
    });

    const [scheduleActiveDayId, setScheduleActiveDayId] = useState<number | null>(null);
    const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
    const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [selectedLocationSlotId, setSelectedLocationSlotId] = useState<number | null>(null);
    const [selectedSpaceSlotId, setSelectedSpaceSlotId] = useState<number | null>(null);
    const [selectedCrewSlotId, setSelectedCrewSlotId] = useState<number | null>(null);
    const [activityColorOverrides, setActivityColorOverrides] = useState<Record<number, string>>({});
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addDialogType, setAddDialogType] = useState<'film' | 'service'>('film');
    const [activityWizardOpen, setActivityWizardOpen] = useState(false);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    const [rightPanelTab, setRightPanelTab] = useState(0);
    const [buildingFilmIds, setBuildingFilmIds] = useState<Set<number>>(new Set());
    const [filmCreationProgress, setFilmCreationProgress] = useState<{ label: string; progress: number } | null>(null);

    // ── Debounced auto-save (existing packages only) ─────────────────
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadedOnceRef = useRef(false);
    useEffect(() => {
        if (isLoading) return;          // data not ready yet
        if (!loadedOnceRef.current) {    // skip the first post-load render
            loadedOnceRef.current = true;
            return;
        }
        if (!packageId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => { handleSave(); }, 2000);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [formData, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Clear all entity-level context selections (keeps activity/moment). */
    const clearEntitySelections = useCallback((except?: 'subject' | 'location' | 'space' | 'crew' | 'equipment') => {
        if (except !== 'subject') setSelectedSubjectId(null);
        if (except !== 'location') setSelectedLocationSlotId(null);
        if (except !== 'space') setSelectedSpaceSlotId(null);
        if (except !== 'crew') setSelectedCrewSlotId(null);
        if (except !== 'equipment') setSelectedEquipmentId(null);
    }, []);

    const openAddDialog = (type: 'film' | 'service') => {
        setAddDialogType(type);
        setAddDialogOpen(true);
    };

    const handleOpenVersionHistory = () => {
        loadVersions();
        setVersionHistoryOpen(true);
    };

    // ── Activity / moment update handlers for ContextCard ────────────
    const handleUpdateActivity = useCallback(async (id: number, updates: Record<string, unknown>) => {
        // Optimistic: update state immediately, then persist
        setPackageActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        try {
            await scheduleApi.packageActivities.update(id, updates);
        } catch (err) {
            console.warn('Failed to update activity:', err);
            // Revert on failure by reloading
            reload();
        }
    }, [setPackageActivities, reload]);

    const handleUpdateMoment = useCallback(async (activityId: number, momentId: number, updates: Record<string, unknown>) => {
        try {
            await scheduleApi.packageActivityMoments.update(momentId, updates);
            setPackageActivities(prev => prev.map(a =>
                a.id === activityId
                    ? { ...a, moments: (a.moments || []).map((m: any) => m.id === momentId ? { ...m, ...updates } : m) } // eslint-disable-line @typescript-eslint/no-explicit-any
                    : a
            ));
        } catch (err) { console.warn('Failed to update moment:', err); }
    }, [setPackageActivities]);

    if (isLoading) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

    const cardSx = {
        background: 'rgba(16, 18, 22, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(52, 58, 68, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    return (
        <Box sx={{ mx: -3, mt: -3 }}>
            {/* ── Top row: header + summary — darker bg ── */}
            <Box sx={{
                px: 3, pt: 3, pb: 2,
                borderBottom: '1px solid rgba(52, 58, 68, 0.5)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <PackageHeader
                            formData={formData} setFormData={setFormData}
                            isSaving={isSaving}
                            onBack={() => router.push('/packages')}
                            onVersionHistory={handleOpenVersionHistory}
                            onBlueprintResynced={reload}
                        />
                    </Box>
                    <SummaryCard
                        PackageCrewSlots={PackageCrewSlots}
                        taskPreview={taskPreview}
                        contents={formData.contents}
                        allEquipment={allEquipment}
                        currency={currentBrand?.currency || DEFAULT_CURRENCY}
                        taxRate={Number(currentBrand?.default_tax_rate ?? 0)}
                        cardSx={cardSx}
                    />
                </Box>
            </Box>
            {/* ── Timeline section — lighter bg ── */}
            <Box sx={{
                px: 3, pt: 1, pb: 1,
                background: 'linear-gradient(to right, rgba(255,255,255,0.025) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.12) 65%, rgba(255,255,255,0.025) 100%)',
                borderBottom: '1px solid rgba(52, 58, 68, 0.4)',
            }}>
                <PackageTimelineCard
                    packageId={packageId} brandId={safeBrandId ?? 0}
                    packageEventDays={packageEventDays} setPackageEventDays={setPackageEventDays}
                    PackageCrewSlots={PackageCrewSlots}
                    dayCoverage={formData.contents?.day_coverage}
                    onDayCoverageChange={(dayId, cov) => {
                        setFormData((prev: typeof formData) => ({
                            ...prev,
                            contents: {
                                ...prev.contents,
                                items: prev.contents?.items || [],
                                day_coverage: { ...(prev.contents?.day_coverage || {}), [dayId]: cov },
                            },
                        }));
                    }}
                    cardSx={cardSx}
                    activeDayId={scheduleActiveDayId}
                    onActiveDayChange={(dayId) => { setScheduleActiveDayId(dayId); setSelectedActivityId(null); }}
                    selectedActivityId={selectedActivityId}
                    onSelectedActivityChange={setSelectedActivityId}
                    onActivityTimeChange={async (activityId, startTime, endTime) => {
                        try {
                            await scheduleApi.packageActivities.update(activityId, { start_time: startTime, end_time: endTime });
                            setPackageActivities(prev => prev.map(a => a.id === activityId ? { ...a, start_time: startTime, end_time: endTime } : a));
                        } catch (err) { console.error('Failed to update activity time:', err); }
                    }}
                    colorOverrides={activityColorOverrides}
                />
            </Box>

            {/* ── Main content: activities (left) + right panel ── */}
            <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 280px)' }}>
                {/* Col 1: Activities — light bg, bleeds to sidebar, right border */}
                <Box sx={{
                    width: '28%', flexShrink: 0,
                    background: 'rgba(255, 255, 255, 0.018)',
                    borderRight: '1px solid rgba(52, 58, 68, 0.4)',
                }}>
                    <ActivitiesCard
                        packageId={packageId} packageEventDays={packageEventDays}
                        activities={packageActivities} setActivities={setPackageActivities}
                        activeDayId={scheduleActiveDayId} cardSx={cardSx}
                        packageSubjects={packageSubjects} setPackageSubjects={setPackageSubjects}
                        packageLocationSlots={packageLocationSlots} setPackageLocationSlots={setPackageLocationSlots}
                        PackageCrewSlots={PackageCrewSlots} setPackageCrewSlots={setPackageCrewSlots}
                        selectedActivityId={selectedActivityId} onSelectedActivityChange={(id) => { setSelectedActivityId(id); setSelectedMomentId(null); setSelectedEquipmentId(null); }}
                        selectedMomentId={selectedMomentId} onSelectedMomentChange={(id) => { setSelectedMomentId(id); setSelectedEquipmentId(null); }}
                        planning={planning} onPlanningComplete={reload}
                        onColorPreview={(activityId, color) => {
                            if (activityId == null || color == null) setActivityColorOverrides({});
                            else setActivityColorOverrides({ [activityId]: color });
                        }}
                    />
                </Box>

                {/* Col 2: Tabs + Content */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    background: 'linear-gradient(160deg, rgba(139,92,246,0.04) 0%, transparent 50%)',
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {/* ── Right-panel tabs ── */}
                        <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.09)', px: 2.5, pt: 2.5 }}>
                        <Tabs
                            value={rightPanelTab}
                            onChange={(_, v) => setRightPanelTab(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                minHeight: 32,
                                '& .MuiTab-root': {
                                    minHeight: 32, py: 0.5, px: 1.5,
                                    fontSize: '0.72rem', fontWeight: 600,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                    color: '#64748b',
                                    borderRadius: 1,
                                    '&.Mui-selected': { color: '#e2e8f0', bgcolor: 'rgba(168, 85, 247, 0.12)' },
                                },
                                '& .MuiTabs-indicator': { display: 'none' },
                            }}
                        >
                            <Tab label="People" />
                            <Tab label="Locations" />
                            <Tab label="Roles" />
                            <Tab label="Equipment" />
                            <Tab label="Tasks" />
                            <Tab label="Content" />
                            <Tab label="Deliverables" />
                        </Tabs>
                        </Box>

                        {/* ── Tab content ── */}
                        {rightPanelTab === 0 && (
                            <PeopleTabPanel
                                packageId={packageId} packageEventDays={packageEventDays}
                                packageActivities={packageActivities}
                                packageSubjects={packageSubjects} setPackageSubjects={setPackageSubjects}
                                subjectTemplates={peopleSubjectTemplates()}
                                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                                selectedMomentId={selectedMomentId}
                                selectedSubjectId={selectedSubjectId}
                                onSelectSubject={(id) => { setSelectedSubjectId(id); if (id) { clearEntitySelections('subject'); } }}
                                planning={planning}
                            />
                        )}
                        {rightPanelTab === 1 && (
                            <LocationsTabPanel
                                packageId={packageId} packageEventDays={packageEventDays}
                                packageActivities={packageActivities}
                                packageLocationSlots={packageLocationSlots} setPackageLocationSlots={setPackageLocationSlots}
                                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                                cardSx={cardSx}
                                selectedLocationSlotId={selectedLocationSlotId}
                                selectedSpaceSlotId={selectedSpaceSlotId}
                                onSelectLocation={(id) => { setSelectedLocationSlotId(id); setSelectedSpaceSlotId(null); if (id) { clearEntitySelections('location'); setSelectedMomentId(null); } }}
                                onSelectSpace={(id) => { setSelectedSpaceSlotId(id); setSelectedLocationSlotId(null); if (id) { clearEntitySelections('space'); setSelectedMomentId(null); } }}
                            />
                        )}
                        {rightPanelTab === 2 && (
                            <CrewTabPanel
                                packageId={packageId} PackageCrewSlots={PackageCrewSlots}
                                setPackageCrewSlots={setPackageCrewSlots}
                                packageEventDays={packageEventDays} packageActivities={packageActivities}
                                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                                crew={crew} jobRoles={jobRoles}
                                taskPreview={taskPreview} currency={currentBrand?.currency || DEFAULT_CURRENCY}
                                selectedCrewSlotId={selectedCrewSlotId}
                                onSelectCrewSlot={(id) => { setSelectedCrewSlotId(id); if (id) { clearEntitySelections('crew'); setSelectedMomentId(null); } }}
                            />
                        )}
                        {rightPanelTab === 3 && (
                            <EquipmentTabPanel
                                packageId={packageId} safeBrandId={safeBrandId}
                                formData={formData} setFormData={setFormData}
                                PackageCrewSlots={PackageCrewSlots} setPackageCrewSlots={setPackageCrewSlots}
                                packageEventDays={packageEventDays} packageActivities={packageActivities}
                                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                                allEquipment={allEquipment}
                                unmannedEquipment={unmannedEquipment} setUnmannedEquipment={setUnmannedEquipment}
                                currency={currentBrand?.currency || DEFAULT_CURRENCY} cardSx={cardSx}
                                selectedEquipmentId={selectedEquipmentId}
                                onSelectEquipment={(id) => { setSelectedEquipmentId(id); if (id) { clearEntitySelections('equipment'); setSelectedMomentId(null); } }}
                            />
                        )}
                        {rightPanelTab === 4 && (
                            <TasksTabPanel packageId={packageId} safeBrandId={safeBrandId} />
                        )}
                        {rightPanelTab === 5 && (
                            <ContentTabPanel
                                items={formData.contents?.items || []} films={films}
                                packageActivities={packageActivities}
                                onConfigureItem={handleConfigureItem} onRemoveItem={handleRemoveItem}
                                onAddFilm={() => openAddDialog('film')} onAddService={() => openAddDialog('service')}
                                cardSx={cardSx}
                                buildingFilmIds={buildingFilmIds}
                                planning={planning}
                                filmCreationProgress={filmCreationProgress}
                            />
                        )}
                        {rightPanelTab === 6 && (
                            <DeliverablesTabPanel />
                        )}
                    </Box>
                </Box>

                {/* Col 3: Context panel */}
                <Box sx={{
                    width: '22%', flexShrink: 0,
                    background: 'rgba(255, 255, 255, 0.018)',
                    borderLeft: '1px solid rgba(52, 58, 68, 0.4)',
                }}>
                    <ContextCard
                        activities={packageActivities}
                        selectedActivityId={selectedActivityId}
                        selectedMomentId={selectedMomentId}
                        selectedEquipmentId={selectedEquipmentId}
                        selectedSubjectId={selectedSubjectId}
                        selectedLocationSlotId={selectedLocationSlotId}
                        selectedSpaceSlotId={selectedSpaceSlotId}
                        selectedCrewSlotId={selectedCrewSlotId}
                        packageSubjects={packageSubjects}
                        packageLocationSlots={packageLocationSlots}
                        allEquipment={allEquipment}
                        unmannedEquipment={unmannedEquipment}
                        PackageCrewSlots={PackageCrewSlots}
                        formData={formData}
                        scheduleActiveDayId={scheduleActiveDayId}
                        packageEventDays={packageEventDays}
                        currency={currentBrand?.currency || DEFAULT_CURRENCY}
                        packageName={formData.name}
                        packageDescription={formData.description}
                        onUpdateActivity={handleUpdateActivity}
                        onUpdateMoment={handleUpdateMoment}
                        onColorPreview={(activityId, color) => {
                            if (activityId == null || color == null) setActivityColorOverrides({});
                            else setActivityColorOverrides({ [activityId]: color });
                        }}
                    />
                </Box>
            </Box>

            {/* ── Dialogs ── */}
            <AddItemDialog
                open={addDialogOpen} onClose={() => setAddDialogOpen(false)}
                initialType={addDialogType}
                onAddService={(description) => handleAddItem('service', undefined, description)}
                onOpenFilmWizard={() => setActivityWizardOpen(true)}
            />
            {packageId && (
                <FilmCreationWizard
                    open={activityWizardOpen} onClose={() => setActivityWizardOpen(false)}
                    packageId={packageId} activities={packageActivities}
                    packageName={formData.name || undefined}
                    onCreationProgress={(p) => setFilmCreationProgress({ label: p.label, progress: p.current / p.total })}
                    onFilmCreated={(result) => {
                        setFilmCreationProgress(null);
                        const items = [...(formData.contents?.items || [])];
                        const singleActivityId = result.activityIds?.length === 1 ? result.activityIds[0] : null;
                        items.push({
                            id: Math.random().toString(36).substr(2, 9),
                            type: 'film', referenceId: result.filmId,
                            description: result.filmName, price: 0,
                            config: {
                                linked_film_id: result.filmId,
                                subject_template_id: formData.contents?.subject_template_id ?? null,
                                package_film_id: result.packageFilmId,
                                activity_id: singleActivityId,
                            },
                        });
                        setFormData({ ...formData, contents: { ...formData.contents, items } });
                        setBuildingFilmIds(prev => new Set(prev).add(result.filmId));
                        const buildStart = Date.now();
                        filmsApi.films.getById(result.filmId).then(newFilm => {
                            setFilms(prev => [...prev, newFilm]);
                            const elapsed = Date.now() - buildStart;
                            const remaining = Math.max(0, 1800 - elapsed);
                            setTimeout(() => {
                                setBuildingFilmIds(prev => { const n = new Set(prev); n.delete(result.filmId); return n; });
                            }, remaining);
                        }).catch(() => {
                            setBuildingFilmIds(prev => { const n = new Set(prev); n.delete(result.filmId); return n; });
                        });
                        scheduleApi.packageFilms.getAll(packageId).then(pfs => setPackageFilms(pfs as PackageFilmRecord[])).catch(() => {});
                    }}
                />
            )}
            <VersionHistoryDialog open={versionHistoryOpen} onClose={() => setVersionHistoryOpen(false)} packageVersions={packageVersions} versionsLoading={versionsLoading} onRestore={handleRestoreVersion} />
            <PackageAiRunsPanel packageId={packageId} packageName={formData.name} planning={planning} />
        </Box>
    );
}
