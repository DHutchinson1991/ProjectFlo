"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Alert, Link, Stack } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { ContentBuilder } from "@/features/content/content-builder";
import { FilmRightPanel, FilmEditorShell } from "../components";
import { useFilmData, useFilmEquipment } from "../hooks";
import { useTimelineStorage, useTimelineSave } from "@/features/content/content-builder/hooks/data";
import { useFilmSubjects } from "@/features/content/subjects/hooks/useFilmSubjects";
import { useBrand } from "@/features/platform/brand";
import type { FilmEquipmentAssignmentsBySlot } from "../types/film-equipment.types";
import { filmsApi } from "@/features/content/films/api";
import { buildAssignmentsBySlot } from "@/features/content/films/utils/equipmentAssignments";
import { useFilmTrackSync } from "../hooks";

interface FilmDetailScreenProps {
    filmId: number;
}

export function FilmDetailScreen({ filmId }: FilmDetailScreenProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasInitialized = useRef(false);
    const { currentBrand } = useBrand();
    const lastBrandId = useRef<number | null>(null);

    // Equipment state for ContentBuilder
    const [equipmentSummary, setEquipmentSummary] = useState<{
        cameras: number;
        audio: number;
        music: number;
    } | null>(null);
    const [equipmentAssignmentsBySlot, setEquipmentAssignmentsBySlot] = useState<FilmEquipmentAssignmentsBySlot>({});

    // Use custom hooks for data management
    const {
        film,
        scenes: filmScenes,
        tracks,
        layers: timelineLayers,
        loading,
        error,
        setFilm,
        setTracks,
        loadAll,
    } = useFilmData(filmId);

    const { saveTimeline, saveTracks } = useTimelineStorage(filmId);

    const {
        subjects,
        templates: subjectTemplates,
        createSubject,
        deleteSubject,
        loadTemplates,
    } = useFilmSubjects(filmId);

    // Equipment management hook
    const { handleEquipmentChange } = useFilmEquipment(
        filmId,
        setTracks,
        saveTracks
    );

    // Timeline save hook
    const { handleSave } = useTimelineSave(
        filmId,
        saveTimeline,
        saveTracks
    );

    // Handle film name save
    const handleSaveFilm = useCallback(async (newName: string) => {
        if (!film) return;
        try {
            const updated = await filmsApi.films.update(film.id, { name: newName });
            // Merge the updated data with existing film data to maintain all fields
            setFilm({ ...film, name: updated.name });
        } catch (err) {
            console.error("Failed to update film:", err);
            throw err;
        }
    }, [film, setFilm]);

    // Handle subject creation
    const handleAddSubject = useCallback(async (name: string, roleTemplateId?: number) => {
        try {
            await createSubject({
                film_id: filmId,
                name,
                role_template_id: roleTemplateId ?? 0,
            });
        } catch (err) {
            console.error("Failed to create subject:", err);
            throw err;
        }
    }, [filmId, createSubject]);

    const handleDeleteSubject = useCallback(async (subjectId: number) => {
        try {
            await deleteSubject(subjectId);
        } catch (err) {
            console.error("Failed to delete subject:", err);
            throw err;
        }
    }, [deleteSubject]);

    const linkedPackageId = searchParams.get("packageId");
    const linkedItemId = searchParams.get("itemId");
    const linkedActivityId = searchParams.get("activityId");
    const linkedPackageHref = linkedPackageId ? `/packages/${linkedPackageId}` : null;

    // Load all data on mount - only run once when brand is ready
    useEffect(() => {
        // Wait for brand to be available before loading
        if (!currentBrand) {
            return;
        }

        // Reset initialization flag if brand changed
        if (lastBrandId.current !== currentBrand.id) {
            hasInitialized.current = false;
            lastBrandId.current = currentBrand.id;
        }

        // Only initialize once per filmId/brand combination
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const init = async () => {
            await loadAll();
            await loadTemplates();
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filmId, currentBrand]);

    useEffect(() => {
        let isMounted = true;
        const loadAssignments = async () => {
            try {
                const assignments = await filmsApi.equipmentAssignments.getAll(filmId);
                if (isMounted) {
                    setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(assignments));
                }
            } catch (err) {
                console.error("Failed to load equipment assignments:", err);
            }
        };

        loadAssignments();
        return () => {
            isMounted = false;
        };
    }, [filmId]);

    // ─── Auto-sync tracks from package crew slot equipment ─────────────
    useFilmTrackSync({
        filmId,
        linkedPackageId,
        filmReady: !!film,
        setTracks,
        setEquipmentAssignmentsBySlot,
        createSubject,
        loadAll,
    });

    // Right panel with all tabs
    const rightPanel = film ? (
        <FilmRightPanel
            film={film}
            filmId={filmId}
            packageId={linkedPackageId ? Number(linkedPackageId) : null}
            subjects={subjects}
            subjectTemplates={subjectTemplates}
            layers={timelineLayers}
            scenes={filmScenes}
            onEquipmentChange={handleEquipmentChange}
            onEquipmentAssignmentsChange={setEquipmentAssignmentsBySlot}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
            onSaveFilm={handleSaveFilm}
        />
    ) : null;

    const packageAlert = linkedPackageId && linkedItemId ? (
        <Stack spacing={1} sx={{ px: 2, pt: 2 }}>
            <Alert severity="info">
                This film is linked to a package item.{' '}
                {linkedPackageHref && (
                    <Link href={linkedPackageHref} underline="hover">
                        View package
                    </Link>
                )}
            </Alert>
        </Stack>
    ) : null;

    return (
        <FilmEditorShell
            loading={loading}
            error={error}
            filmReady={!!film}
            onBack={() => router.push("/designer/films")}
            backLabel="Back to Films"
            packageAlert={packageAlert}
        >
            <ContentBuilder
                filmId={filmId}
                film={film!}
                initialScenes={filmScenes}
                initialTracks={tracks}
                onSave={handleSave}
                onSaveFilmName={handleSaveFilm}
                readOnly={false}
                rightPanel={rightPanel}
                subjectCount={subjects.length}
                packageId={linkedPackageId ? Number(linkedPackageId) : undefined}
                linkedActivityId={linkedActivityId ? Number(linkedActivityId) : undefined}
                equipmentConfig={equipmentSummary || undefined}
                equipmentAssignmentsBySlot={equipmentAssignmentsBySlot}
            />
        </FilmEditorShell>
    );
}
