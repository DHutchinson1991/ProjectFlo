'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid, Stack, CircularProgress, Alert } from '@mui/material';

import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { PackageScheduleCard } from '@/components/schedule/PackageScheduleCard';
import { ActivitiesCard } from '@/components/schedule/ActivitiesCard';
import { FilmCreationWizard } from '@/components/schedule/film-wizard';
import PackageCreationWizard from '../components/PackageCreationWizard';

// ─── Local submodules ─────────────────────────────────────────────────
import { usePackageData, usePackageActions } from './_hooks';
import {
    SummaryCard, CrewCard, EquipmentCard,
    PackageContentsCard, SubjectsCard, LocationsCard,
    TaskAutoGenCard,
} from './_cards';
import { AddItemDialog, PreviewDialog, VersionHistoryDialog } from './_dialogs';
import { PackageHeader } from './_header';

export default function PackageEditPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const safeBrandId = currentBrand?.id;
    const packageId = params.id === 'new' ? null : Number(params.id);

    // ─── Data layer (all fetching + data state) ─────────────────────
    const {
        isLoading,
        error,
        formData, setFormData,
        categories,
        films, setFilms,
        subjectTemplates,
        crewMembers,
        jobRoles,
        allEquipment,
        unmannedEquipment, setUnmannedEquipment,
        setPackageFilms,
        packageEventDays, setPackageEventDays,
        packageActivities, setPackageActivities,
        packageDayOperators, setPackageDayOperators,
        taskPreview,
        packageSubjects, setPackageSubjects,
        packageLocationSlots, setPackageLocationSlots,
        packageVersions,
        versionsLoading,
        loadVersions,
    } = usePackageData({ packageId, brandId: safeBrandId });

    // ─── Business-logic handlers ────────────────────────────────────
    const {
        isSaving,
        handleSave,
        handleRestoreVersion,
        handleAddItem,
        handleRemoveItem,
        handleConfigureItem,
    } = usePackageActions({
        packageId,
        safeBrandId,
        formData, setFormData,
        router,
        films,
        setPackageFilms,
        loadVersions,
    });

    // ─── Component-local UI state ───────────────────────────────────
    const [scheduleActiveDayId, setScheduleActiveDayId] = useState<number | null>(null);
    const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
    const [activityColorOverrides, setActivityColorOverrides] = useState<Record<number, string>>({});

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addDialogType, setAddDialogType] = useState<'film' | 'service'>('film');
    const [activityWizardOpen, setActivityWizardOpen] = useState(false);
    const [packageCreationWizardOpen, setPackageCreationWizardOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

    // ─── Thin UI triggers ───────────────────────────────────────────
    const openAddDialog = (type: 'film' | 'service') => {
        setAddDialogType(type);
        setAddDialogOpen(true);
    };

    const handleOpenVersionHistory = () => {
        loadVersions();
        setVersionHistoryOpen(true);
    };

    // ─── Loading / error guards ─────────────────────────────────────
    if (isLoading) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

    // ─── Dark-card base style ───────────────────────────────────────
    const cardSx = {
        background: 'rgba(16, 18, 22, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(52, 58, 68, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1920, mx: 'auto' }}>
            {/* ── Header ── */}
            <PackageHeader
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                subjectTemplates={subjectTemplates}
                isSaving={isSaving}
                onBack={() => router.push('/designer/packages')}
                onSave={handleSave}
                onPreview={() => setPreviewOpen(true)}
                onVersionHistory={handleOpenVersionHistory}
                onNewPackage={() => setPackageCreationWizardOpen(true)}
            />

            {/* ── Total Cost Summary Card ── */}
            <SummaryCard
                packageDayOperators={packageDayOperators}
                taskPreview={taskPreview}
                contents={formData.contents}
                allEquipment={allEquipment}
                currency={currentBrand?.currency || 'USD'}
                cardSx={cardSx}
            />

            {/* ── Schedule Card (full-width) ── */}
            <Box sx={{ mb: 2.5 }}>
                <PackageScheduleCard
                    packageId={packageId}
                    brandId={safeBrandId}
                    packageEventDays={packageEventDays}
                    setPackageEventDays={setPackageEventDays}
                    packageDayOperators={packageDayOperators}
                    dayCoverage={formData.contents?.day_coverage}
                    onDayCoverageChange={(dayId, cov) => {
                        setFormData((prev: typeof formData) => {
                            const items = prev.contents?.items || [];
                            return {
                                ...prev,
                                contents: {
                                    ...prev.contents,
                                    items,
                                    day_coverage: {
                                        ...(prev.contents?.day_coverage || {}),
                                        [dayId]: cov,
                                    },
                                },
                            };
                        });
                    }}
                    cardSx={cardSx}
                    activeDayId={scheduleActiveDayId}
                    onActiveDayChange={(dayId) => { setScheduleActiveDayId(dayId); setSelectedActivityId(null); }}
                    selectedActivityId={selectedActivityId}
                    onSelectedActivityChange={setSelectedActivityId}
                    onActivityTimeChange={async (activityId, startTime, endTime) => {
                        try {
                            await api.schedule.packageActivities.update(activityId, {
                                start_time: startTime,
                                end_time: endTime,
                            });
                            setPackageActivities(prev => prev.map(a =>
                                a.id === activityId
                                    ? { ...a, start_time: startTime, end_time: endTime }
                                    : a
                            ));
                        } catch (err) {
                            console.error('Failed to update activity time:', err);
                        }
                    }}
                    colorOverrides={activityColorOverrides}
                />
            </Box>

            {/* ── Grid with columns ── */}
            <Grid container spacing={2.5}>
                {/* ────── Column 1: Activities ────── */}
                <Grid item xs={12} md={5}>
                    <Box>
                        <ActivitiesCard
                            packageId={packageId}
                            packageEventDays={packageEventDays}
                            activities={packageActivities}
                            setActivities={setPackageActivities}
                            activeDayId={scheduleActiveDayId}
                            cardSx={cardSx}
                            packageSubjects={packageSubjects}
                            setPackageSubjects={setPackageSubjects}
                            packageLocationSlots={packageLocationSlots}
                            setPackageLocationSlots={setPackageLocationSlots}
                            packageDayOperators={packageDayOperators}
                            setPackageDayOperators={setPackageDayOperators}
                            selectedActivityId={selectedActivityId}
                            onSelectedActivityChange={setSelectedActivityId}
                            onColorPreview={(activityId, color) => {
                                if (activityId == null || color == null) {
                                    setActivityColorOverrides({});
                                } else {
                                    setActivityColorOverrides({ [activityId]: color });
                                }
                            }}
                        />
                    </Box>
                </Grid>

                {/* ─── Add Item Dialog ─── */}
                <AddItemDialog
                    open={addDialogOpen}
                    onClose={() => setAddDialogOpen(false)}
                    initialType={addDialogType}
                    onAddService={(description) => handleAddItem('service', undefined, description)}
                    onOpenFilmWizard={() => setActivityWizardOpen(true)}
                />

                {/* ─── Activity Film Wizard ─── */}
                {packageId && (
                    <FilmCreationWizard
                        open={activityWizardOpen}
                        onClose={() => setActivityWizardOpen(false)}
                        packageId={packageId}
                        activities={packageActivities}
                        packageName={formData.name || undefined}
                        onFilmCreated={(result) => {
                            const items = [...(formData.contents?.items || [])];
                            const singleActivityId = result.activityIds?.length === 1 ? result.activityIds[0] : null;
                            items.push({
                                id: Math.random().toString(36).substr(2, 9),
                                type: 'film',
                                referenceId: result.filmId,
                                description: result.filmName,
                                price: 0,
                                config: {
                                    linked_film_id: result.filmId,
                                    subject_template_id: formData.contents?.subject_template_id ?? null,
                                    package_film_id: result.packageFilmId,
                                    activity_id: singleActivityId,
                                },
                            });
                            setFormData({ ...formData, contents: { ...formData.contents, items } });

                            api.films.getById(result.filmId).then(newFilm => {
                                setFilms(prev => [...prev, newFilm]);
                            }).catch(() => {});

                            api.schedule.packageFilms.getAll(packageId).then(pfs => {
                                setPackageFilms(pfs);
                            }).catch(() => {});
                        }}
                    />
                )}

                {/* ────── Column 2: Subjects ────── */}
                <Grid item xs={12} md={3.5}>
                    <Stack spacing={2}>
                        <SubjectsCard
                            packageId={packageId}
                            packageEventDays={packageEventDays}
                            packageActivities={packageActivities}
                            packageSubjects={packageSubjects}
                            setPackageSubjects={setPackageSubjects}
                            subjectTemplates={subjectTemplates}
                            scheduleActiveDayId={scheduleActiveDayId}
                            selectedActivityId={selectedActivityId}
                            cardSx={cardSx}
                        />
                        <LocationsCard
                            packageId={packageId}
                            packageEventDays={packageEventDays}
                            packageActivities={packageActivities}
                            packageLocationSlots={packageLocationSlots}
                            setPackageLocationSlots={setPackageLocationSlots}
                            scheduleActiveDayId={scheduleActiveDayId}
                            selectedActivityId={selectedActivityId}
                            cardSx={cardSx}
                        />
                    </Stack>
                </Grid>

                {/* ────── Column 3: Crew, Equipment ────── */}
                <Grid item xs={12} md={3.5}>
                    <Stack spacing={2}>
                        <CrewCard
                            packageId={packageId}
                            packageDayOperators={packageDayOperators}
                            setPackageDayOperators={setPackageDayOperators}
                            packageEventDays={packageEventDays}
                            packageActivities={packageActivities}
                            scheduleActiveDayId={scheduleActiveDayId}
                            selectedActivityId={selectedActivityId}
                            crewMembers={crewMembers}
                            jobRoles={jobRoles}
                            taskPreview={taskPreview}
                            currency={currentBrand?.currency || 'USD'}
                            cardSx={cardSx}
                        />
                        <EquipmentCard
                            packageId={packageId}
                            safeBrandId={safeBrandId}
                            formData={formData}
                            setFormData={setFormData}
                            packageDayOperators={packageDayOperators}
                            setPackageDayOperators={setPackageDayOperators}
                            packageEventDays={packageEventDays}
                            packageActivities={packageActivities}
                            scheduleActiveDayId={scheduleActiveDayId}
                            selectedActivityId={selectedActivityId}
                            allEquipment={allEquipment}
                            unmannedEquipment={unmannedEquipment}
                            setUnmannedEquipment={setUnmannedEquipment}
                            currency={currentBrand?.currency || 'USD'}
                            cardSx={cardSx}
                        />
                    </Stack>
                </Grid>
            </Grid>

            {/* ── Row 2: Package Contents + Task Auto-Gen ── */}
            <Grid container spacing={2.5} sx={{ mt: 0 }}>
                <Grid item xs={12} md={6}>
                    <PackageContentsCard
                        items={formData.contents?.items || []}
                        films={films}
                        packageActivities={packageActivities}
                        onConfigureItem={handleConfigureItem}
                        onRemoveItem={handleRemoveItem}
                        onAddFilm={() => openAddDialog('film')}
                        onAddService={() => openAddDialog('service')}
                        cardSx={cardSx}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    {safeBrandId && packageId && (
                        <TaskAutoGenCard
                            packageId={packageId}
                            brandId={safeBrandId}
                            cardSx={cardSx}
                        />
                    )}
                </Grid>
            </Grid>

            {/* ── Dialogs ── */}
            <PreviewDialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                formData={formData}
                packageEventDays={packageEventDays}
            />

            <VersionHistoryDialog
                open={versionHistoryOpen}
                onClose={() => setVersionHistoryOpen(false)}
                packageVersions={packageVersions}
                versionsLoading={versionsLoading}
                onRestore={handleRestoreVersion}
            />

            <PackageCreationWizard
                open={packageCreationWizardOpen}
                onClose={() => setPackageCreationWizardOpen(false)}
                onPackageCreated={(newPackageId) => {
                    router.push(`/designer/packages/${newPackageId}`);
                }}
            />
        </Box>
    );
}
