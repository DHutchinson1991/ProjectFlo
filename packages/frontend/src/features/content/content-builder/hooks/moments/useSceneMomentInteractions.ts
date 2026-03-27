"use client";

import React from "react";
import { scenesApi } from "@/features/content/scenes/api";
import type { TimelineScene } from "@/features/content/content-builder/types/timeline";
import type { TimelineSceneMoment } from "@/features/content/moments/types";
import type { MomentRecordingSetupWithAssignments } from "@/features/content/moments/types/recording-setup";
import type { ShotType } from "@/features/content/coverage/types";

interface UseSceneMomentInteractionsProps {
    zoomLevel: number;
    onUpdateScene?: (scene: TimelineScene) => void;
}

type SceneMomentWithSetup = TimelineSceneMoment & {
    duration_seconds?: number;
    recording_setup?: MomentRecordingSetupWithAssignments | null;
    has_recording_setup?: boolean;
};

type MomentEditorMoment = {
    id?: number;
    name: string;
    duration: number;
    duration_seconds?: number;
    recording_setup?: MomentRecordingSetupWithAssignments | null;
    has_recording_setup?: boolean;
    [key: string]: unknown;
};

const getSceneMoments = (scene: TimelineScene | null): SceneMomentWithSetup[] => {
    if (!scene) return [];
    const moments = (scene as TimelineScene & { moments?: SceneMomentWithSetup[] }).moments;
    return Array.isArray(moments) ? moments : [];
};

export const useSceneMomentInteractions = ({
    zoomLevel,
    onUpdateScene,
}: UseSceneMomentInteractionsProps) => {
    const [editingMoment, setEditingMoment] = React.useState<MomentEditorMoment | null>(null);
    const [activeSceneForEdit, setActiveSceneForEdit] = React.useState<TimelineScene | null>(null);

    const [resizingMomentId, setResizingMomentId] = React.useState<number | null>(null);
    const [resizeStartX, setResizeStartX] = React.useState(0);
    const [resizeStartDuration, setResizeStartDuration] = React.useState(0);
    const [resizeScene, setResizeScene] = React.useState<TimelineScene | null>(null);

    const [draggingMomentId, setDraggingMomentId] = React.useState<number | null>(null);
    const [dragStartIndex, setDragStartIndex] = React.useState(-1);
    const [dragScene, setDragScene] = React.useState<TimelineScene | null>(null);

    const updateSceneMoments = React.useCallback((scene: TimelineScene, nextMoments: SceneMomentWithSetup[]) => {
        console.log('[useSceneMomentInteractions] updateSceneMoments called', {
            sceneId: scene.id,
            sceneName: scene.name,
            momentsCount: nextMoments.length,
            momentsWithSetup: nextMoments.filter(m => !!m.recording_setup).map(m => ({
                id: m.id,
                name: m.name,
                recording_setup_keys: m.recording_setup ? Object.keys(m.recording_setup) : null,
                camera_assignments_count: (m.recording_setup?.camera_assignments || []).length,
            })),
            hasOnUpdateScene: !!onUpdateScene,
        });
        (scene as TimelineScene & { moments?: SceneMomentWithSetup[] }).moments = nextMoments;
        if (onUpdateScene) {
            onUpdateScene({ ...scene, moments: nextMoments } as TimelineScene);
        }
    }, [onUpdateScene]);

    const handleResizeStart = React.useCallback((e: React.MouseEvent, momentId: number, currentDuration: number, scene: TimelineScene) => {
        e.stopPropagation();
        setResizingMomentId(momentId);
        setResizeStartX(e.clientX);
        setResizeStartDuration(currentDuration);
        setResizeScene(scene);
    }, []);

    React.useEffect(() => {
        if (resizingMomentId === null || !resizeScene) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaPixels = e.clientX - resizeStartX;
            const deltaSeconds = deltaPixels / (zoomLevel || 5);
            const newDuration = Math.max(1, resizeStartDuration + deltaSeconds);

            const moments = getSceneMoments(resizeScene);
            const updatedMoments = moments.map((moment) =>
                moment.id === resizingMomentId ? { ...moment, duration: newDuration } : moment
            );

            updateSceneMoments(resizeScene, updatedMoments);
        };

        const handleMouseUp = () => {
            setResizingMomentId(null);
            setResizeScene(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingMomentId, resizeStartX, resizeStartDuration, zoomLevel, resizeScene, updateSceneMoments]);

    const handleMomentDragStart = React.useCallback((e: React.DragEvent, momentId: number, index: number, scene: TimelineScene) => {
        e.stopPropagation();
        setDraggingMomentId(momentId);
        setDragStartIndex(index);
        setDragScene(scene);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleMomentDragOver = React.useCallback((e: React.DragEvent) => {
        if (draggingMomentId === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, [draggingMomentId]);

    const handleMomentDrop = React.useCallback((e: React.DragEvent, dropIndex: number, targetScene: TimelineScene) => {
        e.preventDefault();
        if (draggingMomentId === null || dragStartIndex === -1 || !dragScene) return;

        if (dragScene.name !== targetScene.name) return;

        const moments = [...getSceneMoments(dragScene)];
        const draggedMoment = moments[dragStartIndex];
        if (!draggedMoment) return;

        moments.splice(dragStartIndex, 1);
        moments.splice(dropIndex, 0, draggedMoment);

        moments.forEach((moment, idx) => {
            moment.order_index = idx;
        });

        updateSceneMoments(dragScene, moments);

        setDraggingMomentId(null);
        setDragStartIndex(-1);
        setDragScene(null);
    }, [draggingMomentId, dragStartIndex, dragScene, updateSceneMoments]);

    const handleMomentClick = React.useCallback((e: React.MouseEvent, moment: SceneMomentWithSetup, scene: TimelineScene) => {
        e.stopPropagation();
        setEditingMoment(moment as unknown as MomentEditorMoment);
        setActiveSceneForEdit(scene);
    }, []);

    const handleMomentSave = React.useCallback((updatedMoment: MomentEditorMoment) => {
        if (!activeSceneForEdit || !editingMoment) return;

        console.group('[handleMomentSave] SAVE CALLED');
        console.log('[handleMomentSave] updatedMoment from editor:', {
            id: updatedMoment.id,
            name: updatedMoment.name,
            has_recording_setup: updatedMoment.has_recording_setup,
            recording_setup: updatedMoment.recording_setup ? {
                keys: Object.keys(updatedMoment.recording_setup),
                camera_assignments_count: (updatedMoment.recording_setup.camera_assignments || []).length,
            } : 'null/undefined',
        });

        const moments = getSceneMoments(activeSceneForEdit);
        console.log('[handleMomentSave] moments from activeSceneForEdit:', moments.map(m => ({
            id: m.id,
            name: m.name,
            has_recording_setup: m.has_recording_setup,
            recording_setup: m.recording_setup ? {
                camera_assignments_count: (m.recording_setup.camera_assignments || []).length,
                audio_track_ids: m.recording_setup.audio_track_ids,
            } : 'null/undefined',
        })));

        const updatedMoments = moments.map((moment) => {
            if (moment.id !== updatedMoment.id) return moment;
            // Prefer fresh scene data (already refreshed by handleMomentRecordingSetupSave)
            // over stale editor state. updatedMoment only carries name + duration changes.
            const recordingSetup = moment.recording_setup ?? updatedMoment.recording_setup;
            // has_recording_setup: true if fresh data has a setup, OR if it was already set
            const hasRecordingSetup = !!recordingSetup
                || !!moment.has_recording_setup
                || !!updatedMoment.has_recording_setup;

            console.log('[handleMomentSave] merging moment id=' + moment.id, {
                freshSetup: !!moment.recording_setup,
                staleSetup: !!updatedMoment.recording_setup,
                resolvedSetup: !!recordingSetup,
                hasRecordingSetup,
                resolvedCameraAssignments: (recordingSetup?.camera_assignments || []).length,
            });

            return {
                ...moment,
                ...updatedMoment,
                recording_setup: recordingSetup,
                has_recording_setup: hasRecordingSetup,
            };
        });
        console.groupEnd();

        updateSceneMoments(activeSceneForEdit, updatedMoments);
        setEditingMoment(null);
        setActiveSceneForEdit(null);
    }, [activeSceneForEdit, editingMoment, updateSceneMoments]);

    const handleMomentRecordingSetupSave = React.useCallback(async (
        momentId: number, 
        data: { camera_track_ids?: number[]; camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: ShotType | null }>; audio_track_ids?: number[]; graphics_enabled?: boolean; graphics_title?: string | null }
    ) => {
        if (!activeSceneForEdit) return;

        console.info("[MOMENT] Upsert recording setup request", {
            momentId,
            data,
        });
        const setup = await scenesApi.moments.upsertRecordingSetup(momentId, data);

        const response = setup as Partial<MomentRecordingSetupWithAssignments> & {
            camera_track_ids?: number[];
            audio_track_ids?: number[];
            graphics_enabled?: boolean;
            graphics_title?: string | null;
        };

        const hasResponseBody = !!response && (
            (response.camera_assignments && response.camera_assignments.length > 0) ||
            (response.camera_track_ids && response.camera_track_ids.length > 0) ||
            (response.audio_track_ids && response.audio_track_ids.length > 0) ||
            typeof response.graphics_enabled !== "undefined" ||
            typeof response.graphics_title !== "undefined"
        );

        const setupSource = hasResponseBody
            ? response
            : {
                camera_track_ids: data.camera_track_ids || [],
                audio_track_ids: data.audio_track_ids || [],
                graphics_enabled: data.graphics_enabled || false,
                graphics_title: data.graphics_title ?? null,
            };

        const normalizedSetup: MomentRecordingSetupWithAssignments = {
            ...(setupSource as MomentRecordingSetupWithAssignments),
            camera_assignments: setupSource.camera_assignments?.length
                ? setupSource.camera_assignments
                : (setupSource.camera_track_ids || []).map((id) => {
                    const source = data.camera_assignments?.find((assignment) => assignment.track_id === id);
                    return {
                        id: 0,
                        recording_setup_id: 0,
                        track_id: id,
                        subject_ids: source?.subject_ids || [],
                        shot_type: source?.shot_type ?? null,
                    };
                }),
        };

        console.info("[MOMENT] Recording setup response", {
            momentId,
            responseBodyPresent: hasResponseBody,
            camera_assignments: normalizedSetup?.camera_assignments?.map((assignment) => assignment.track_id),
            audio_track_ids: normalizedSetup?.audio_track_ids,
            graphics_enabled: normalizedSetup?.graphics_enabled,
            graphics_title: normalizedSetup?.graphics_title,
        });

        // CRITICAL: Refetch the complete scene data to get updated subjects with role_template
        console.log('[handleMomentRecordingSetupSave] About to refetch scene', activeSceneForEdit.id);
        const refreshedScene = await scenesApi.scenes.getById(activeSceneForEdit.id);
        const refreshedMoments = (refreshedScene.moments || []) as unknown as SceneMomentWithSetup[];
        console.log('[handleMomentRecordingSetupSave] Refreshed scene moments:', refreshedMoments.map((m) => ({
            id: m.id,
            name: m.name,
            has_recording_setup: m.has_recording_setup,
            recording_setup: m.recording_setup ? {
                keys: Object.keys(m.recording_setup),
                camera_assignments: m.recording_setup.camera_assignments,
                audio_track_ids: m.recording_setup.audio_track_ids,
            } : 'null',
        })));

        const existingMoments = getSceneMoments(activeSceneForEdit);
        const mergedMoments = refreshedMoments.map((moment) => {
            const existing = existingMoments.find((m) => m.id === moment.id);

            // The scene getById endpoint does NOT return recording_setup on moments.
            // For the moment we just saved, inject normalizedSetup directly from the upsert response.
            // For all other moments, keep whichever data we already have locally.
            const isSavedMoment = moment.id === momentId;
            const resolvedSetup: MomentRecordingSetupWithAssignments | null = isSavedMoment
                ? normalizedSetup
                : (moment.recording_setup ?? existing?.recording_setup ?? null);

            return {
                ...existing,
                ...moment,
                recording_setup: resolvedSetup,
                has_recording_setup: isSavedMoment ? true : (
                    typeof moment.has_recording_setup !== "undefined"
                        ? moment.has_recording_setup
                        : (existing?.has_recording_setup ?? !!resolvedSetup)
                ),
            };
        });

        console.log('[handleMomentRecordingSetupSave] mergedMoments before updateSceneMoments:', mergedMoments.map((m) => ({
            id: m.id,
            name: m.name,
            has_recording_setup: m.has_recording_setup,
            recording_setup: m.recording_setup ? {
                camera_assignments_count: (m.recording_setup.camera_assignments || []).length,
                audio_track_ids: m.recording_setup.audio_track_ids,
            } : 'null',
        })));
        updateSceneMoments(activeSceneForEdit, mergedMoments);
        const updated = mergedMoments.find((moment) => moment.id === momentId);
        const updatedWithSubjects = updated as (SceneMomentWithSetup & { subjects?: unknown[] }) | undefined;
        console.info("[MOMENT] Local moment setup updated with fresh data", {
            momentId,
            has_recording_setup: updated?.has_recording_setup,
            subjects_count: updatedWithSubjects?.subjects?.length || 0,
            camera_assignments: updated?.recording_setup?.camera_assignments?.map((assignment) => assignment.track_id),
            audio_track_ids: updated?.recording_setup?.audio_track_ids,
            graphics_enabled: updated?.recording_setup?.graphics_enabled,
            graphics_title: updated?.recording_setup?.graphics_title,
        });
    }, [activeSceneForEdit, scenesApi, updateSceneMoments]);

    const handleClearMomentRecordingSetup = React.useCallback(async (momentId?: number) => {
        if (!activeSceneForEdit || !momentId) return;

        try {
            await scenesApi.moments.clearRecordingSetup(momentId);

            const moments = getSceneMoments(activeSceneForEdit);
            const updatedMoments = moments.map((moment) =>
                moment.id === momentId
                    ? { ...moment, recording_setup: null, has_recording_setup: false }
                    : moment
            );

            updateSceneMoments(activeSceneForEdit, updatedMoments);
        } catch (error) {
            console.error("❌ [MOMENT] Failed to clear recording setup:", error);
        } finally {
            setEditingMoment(null);
            setActiveSceneForEdit(null);
        }
    }, [activeSceneForEdit, scenesApi, updateSceneMoments]);

    const closeMomentEditor = React.useCallback(() => {
        setEditingMoment(null);
    }, []);

    return {
        editingMoment,
        activeSceneForEdit,
        resizingMomentId,
        draggingMomentId,
        closeMomentEditor,
        handleResizeStart,
        handleMomentDragStart,
        handleMomentDragOver,
        handleMomentDrop,
        handleMomentClick,
        handleMomentSave,
        handleMomentRecordingSetupSave,
        handleClearMomentRecordingSetup,
    };
};
