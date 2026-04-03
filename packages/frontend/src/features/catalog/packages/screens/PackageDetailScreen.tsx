'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, CircularProgress, Alert } from '@mui/material';

import { filmsApi } from '@/features/content/films/api';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { scheduleApi, PackageScheduleCard, ActivitiesCard } from '@/features/workflow/scheduling/package-template';
import { ScheduleCardGrid } from '@/features/workflow/scheduling/components';
import { FilmCreationWizard } from '@/features/workflow/scheduling/film-wizard';

import { usePackageData, usePackageActions } from '../hooks';
import type { PackageFilmRecord } from '../types';
import {
    SummaryCard, CrewCard, EquipmentCard,
    DeliverablesCard, SubjectsCard, LocationsCard,
    TaskAutoGenCard,
} from '../components/detail/cards';
import { AddItemDialog, VersionHistoryDialog } from '../components/detail/dialogs';
import { PackageHeader } from '../components/detail/header';

export function PackageDetailScreen({ packageIdParam }: { packageIdParam: string }) {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const safeBrandId = currentBrand?.id;
    const packageId = packageIdParam === 'new' ? null : Number(packageIdParam);

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
    } = usePackageData({ packageId, brandId: safeBrandId });

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
    const [activityColorOverrides, setActivityColorOverrides] = useState<Record<number, string>>({});
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addDialogType, setAddDialogType] = useState<'film' | 'service'>('film');
    const [activityWizardOpen, setActivityWizardOpen] = useState(false);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

    // ── Debounced auto-save (existing packages only) ─────────────────
    const isFirstRender = useRef(true);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (!packageId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => { handleSave(); }, 2000);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

    const openAddDialog = (type: 'film' | 'service') => {
        setAddDialogType(type);
        setAddDialogOpen(true);
    };

    const handleOpenVersionHistory = () => {
        loadVersions();
        setVersionHistoryOpen(true);
    };

    if (isLoading) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

    const cardSx = {
        background: 'rgba(16, 18, 22, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(52, 58, 68, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <PackageHeader
                        formData={formData} setFormData={setFormData}
                        isSaving={isSaving}
                        onBack={() => router.push('/packages')}
                        onVersionHistory={handleOpenVersionHistory}
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
            <Box sx={{ mb: 2.5 }}>
                <PackageScheduleCard
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
            <ScheduleCardGrid
                col1={<>
                    <ActivitiesCard
                        packageId={packageId} packageEventDays={packageEventDays}
                        activities={packageActivities} setActivities={setPackageActivities}
                        activeDayId={scheduleActiveDayId} cardSx={cardSx}
                        packageSubjects={packageSubjects} setPackageSubjects={setPackageSubjects}
                        packageLocationSlots={packageLocationSlots} setPackageLocationSlots={setPackageLocationSlots}
                        PackageCrewSlots={PackageCrewSlots} setPackageCrewSlots={setPackageCrewSlots}
                        selectedActivityId={selectedActivityId} onSelectedActivityChange={setSelectedActivityId}
                        onColorPreview={(activityId, color) => {
                            if (activityId == null || color == null) setActivityColorOverrides({});
                            else setActivityColorOverrides({ [activityId]: color });
                        }}
                    />
                    <Box sx={{ mt: 2.5 }} />
                    <DeliverablesCard
                        items={formData.contents?.items || []} films={films}
                        packageActivities={packageActivities}
                        onConfigureItem={handleConfigureItem} onRemoveItem={handleRemoveItem}
                        onAddFilm={() => openAddDialog('film')} onAddService={() => openAddDialog('service')}
                        cardSx={cardSx}
                    />
                </>
            }
            col2={
                <Stack spacing={2}>
                    <SubjectsCard
                            packageId={packageId} packageEventDays={packageEventDays}
                            packageActivities={packageActivities}
                            packageSubjects={packageSubjects} setPackageSubjects={setPackageSubjects}
                            subjectTemplates={subjectTemplates}
                            scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                            cardSx={cardSx}
                        />
                        <LocationsCard
                            packageId={packageId} packageEventDays={packageEventDays}
                            packageActivities={packageActivities}
                            packageLocationSlots={packageLocationSlots} setPackageLocationSlots={setPackageLocationSlots}
                            scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                            cardSx={cardSx}
                        />
                </Stack>
            }
            col3={
                <Stack spacing={2}>
                    <CrewCard
                            packageId={packageId} PackageCrewSlots={PackageCrewSlots}
                            setPackageCrewSlots={setPackageCrewSlots}
                            packageEventDays={packageEventDays} packageActivities={packageActivities}
                            scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                            crew={crew} jobRoles={jobRoles}
                            taskPreview={taskPreview} currency={currentBrand?.currency || DEFAULT_CURRENCY}
                            cardSx={cardSx}
                        />
                        <EquipmentCard
                            packageId={packageId} safeBrandId={safeBrandId}
                            formData={formData} setFormData={setFormData}
                            PackageCrewSlots={PackageCrewSlots} setPackageCrewSlots={setPackageCrewSlots}
                            packageEventDays={packageEventDays} packageActivities={packageActivities}
                            scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                            allEquipment={allEquipment}
                            unmannedEquipment={unmannedEquipment} setUnmannedEquipment={setUnmannedEquipment}
                            currency={currentBrand?.currency || DEFAULT_CURRENCY} cardSx={cardSx}
                        />
                </Stack>
            }
            col4={
                safeBrandId && packageId
                    ? <TaskAutoGenCard packageId={packageId} brandId={safeBrandId} cardSx={cardSx} />
                    : null
            }
        >
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
                    onFilmCreated={(result) => {
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
                        filmsApi.films.getById(result.filmId).then(newFilm => setFilms(prev => [...prev, newFilm])).catch(() => {});
                        scheduleApi.packageFilms.getAll(packageId).then(pfs => setPackageFilms(pfs as PackageFilmRecord[])).catch(() => {});
                    }}
                />
            )}
        </ScheduleCardGrid>
            <VersionHistoryDialog open={versionHistoryOpen} onClose={() => setVersionHistoryOpen(false)} packageVersions={packageVersions} versionsLoading={versionsLoading} onRestore={handleRestoreVersion} />
        </Box>
    );
}
