"use client";

import React from "react";
import { createScenesApi } from "@/lib/api/scenes.api";
import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import type { TimelineScene } from "@/lib/types/timeline";
import type { TimelineSceneMoment } from "@/lib/types/domains/moments";
import type { MomentRecordingSetupWithAssignments } from "@/lib/types/domains/recording-setup";

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
    const scenesApi = React.useMemo(() => createScenesApi(apiClient as unknown as ApiClient), []);

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

        const moments = getSceneMoments(activeSceneForEdit);
        const updatedMoments = moments.map((moment) => {
            if (moment.id !== updatedMoment.id) return moment;
            // Prefer updatedMoment's recording_setup (latest values) over stale local
            const recordingSetup = updatedMoment.recording_setup ?? moment.recording_setup;
            const hasRecordingSetup = typeof updatedMoment.has_recording_setup !== "undefined"
                ? updatedMoment.has_recording_setup
                : (typeof moment.has_recording_setup !== "undefined"
                    ? moment.has_recording_setup
                    : !!recordingSetup);
            return {
                ...moment,
                ...updatedMoment,
                recording_setup: recordingSetup,
                has_recording_setup: hasRecordingSetup,
            };
        });

        updateSceneMoments(activeSceneForEdit, updatedMoments);
        setEditingMoment(null);
        setActiveSceneForEdit(null);
    }, [activeSceneForEdit, editingMoment, updateSceneMoments]);

    const handleMomentRecordingSetupSave = React.useCallback(async (
        momentId: number, 
        data: { camera_track_ids?: number[]; camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>; audio_track_ids?: number[]; graphics_enabled?: boolean; graphics_title?: string | null }
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
        const refreshedScene = await scenesApi.scenes.getById(activeSceneForEdit.id);
        const refreshedMoments = refreshedScene.moments || [];

        const existingMoments = getSceneMoments(activeSceneForEdit);
        const mergedMoments = refreshedMoments.map((moment: any) => {
            const existing = existingMoments.find((m) => m.id === moment.id);
            return {
                ...existing,
                ...moment,
                // Prefer fresh server data over stale local data
                recording_setup: (moment as any).recording_setup ?? existing?.recording_setup ?? null,
                has_recording_setup: typeof moment.has_recording_setup !== "undefined"
                    ? moment.has_recording_setup
                    : (existing?.has_recording_setup ?? !!(moment as any).recording_setup ?? !!existing?.recording_setup),
            };
        });

        if (typeof window !== "undefined" && (window as any).__debugMomentRoles) {
            console.info("[MOMENT][DEBUG] Refreshed scene data", {
                sceneId: activeSceneForEdit.id,
                refreshedMomentCount: refreshedMoments.length,
                mergedMomentCount: mergedMoments.length,
            });
            const focus = mergedMoments.find((m: any) => m.id === momentId);
            console.info("[MOMENT][DEBUG] Focus moment after refresh", {
                momentId,
                subjects: focus?.subjects || [],
                firstSubject: focus?.subjects?.[0],
                firstSubjectRole: focus?.subjects?.[0]?.subject?.role,
                firstSubjectRoleName: focus?.subjects?.[0]?.subject?.role?.role_name,
            });
        }

        updateSceneMoments(activeSceneForEdit, mergedMoments);
        const updated = mergedMoments.find((moment: any) => moment.id === momentId);
        console.info("[MOMENT] Local moment setup updated with fresh data", {
            momentId,
            has_recording_setup: updated?.has_recording_setup,
            subjects_count: updated?.subjects?.length || 0,
            camera_assignments: updated?.recording_setup?.camera_assignments?.map((assignment: any) => assignment.track_id),
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
