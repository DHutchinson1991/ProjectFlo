"use client";

import React from "react";
import { beatsApi } from "@/features/content/beats/api";
import type { TimelineScene } from "@/features/content/content-builder/types/timeline";
import type { SceneBeat } from "@/features/content/scenes/types/beats";

interface UseSceneBeatInteractionsProps {
    onUpdateScene?: (scene: TimelineScene) => void;
}

type BeatEditorBeat = {
    id?: number;
    name: string;
    duration_seconds: number;
    order_index?: number;
    shot_count?: number | null;
    recording_setup?: {
        camera_track_ids: number[];
        audio_track_ids: number[];
        graphics_enabled: boolean;
    } | null;
};

const getSceneBeats = (scene: TimelineScene | null): SceneBeat[] => {
    if (!scene) return [];
    const beats = (scene as TimelineScene & { beats?: SceneBeat[] }).beats;
    return Array.isArray(beats) ? beats : [];
};

export const useSceneBeatInteractions = ({ onUpdateScene }: UseSceneBeatInteractionsProps) => {
    const [editingBeat, setEditingBeat] = React.useState<BeatEditorBeat | null>(null);
    const [activeSceneForEdit, setActiveSceneForEdit] = React.useState<TimelineScene | null>(null);

    const [draggingBeatId, setDraggingBeatId] = React.useState<number | null>(null);
    const [dragStartIndex, setDragStartIndex] = React.useState(-1);
    const [dragScene, setDragScene] = React.useState<TimelineScene | null>(null);

    const updateSceneBeats = React.useCallback((scene: TimelineScene, nextBeats: SceneBeat[]) => {
        (scene as TimelineScene & { beats?: SceneBeat[] }).beats = nextBeats;
        const beatsDuration = nextBeats.reduce((sum, beat) => sum + (beat.duration_seconds || 0), 0);
        const nextDuration = beatsDuration > 0
            ? beatsDuration
            : ((scene.duration_seconds ?? scene.duration) || 60);
        if (onUpdateScene) {
            onUpdateScene({ ...scene, beats: nextBeats, duration: nextDuration, duration_seconds: nextDuration } as TimelineScene);
        }
    }, [onUpdateScene]);

    const syncBeatOrder = React.useCallback(async (sceneId: number, beats: SceneBeat[]) => {
        if (!sceneId || beats.length === 0) return;
        const ordering = beats.map((beat) => ({ id: beat.id, order_index: beat.order_index }));
        await beatsApi.reorder(sceneId, ordering);
    }, []);

    const handleBeatClick = React.useCallback((e: React.MouseEvent, beat: SceneBeat, scene: TimelineScene) => {
        e.stopPropagation();
        setEditingBeat({
            id: beat.id,
            name: beat.name,
            duration_seconds: beat.duration_seconds,
            order_index: beat.order_index,
            shot_count: beat.shot_count ?? null,
            recording_setup: (beat as any).recording_setup ?? null,
        });
        setActiveSceneForEdit(scene);
    }, []);

    const handleBeatDragStart = React.useCallback((e: React.DragEvent, beatId: number, index: number, scene: TimelineScene) => {
        e.stopPropagation();
        setDraggingBeatId(beatId);
        setDragStartIndex(index);
        setDragScene(scene);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleBeatDragOver = React.useCallback((e: React.DragEvent) => {
        if (draggingBeatId === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, [draggingBeatId]);

    const handleBeatDrop = React.useCallback(async (e: React.DragEvent, dropIndex: number, targetScene: TimelineScene) => {
        e.preventDefault();
        if (draggingBeatId === null || dragStartIndex === -1 || !dragScene) return;
        if (dragScene.name !== targetScene.name) return;

        const beats = [...getSceneBeats(dragScene)];
        const draggedBeat = beats[dragStartIndex];
        if (!draggedBeat) return;

        beats.splice(dragStartIndex, 1);
        beats.splice(dropIndex, 0, draggedBeat);

        beats.forEach((beat, idx) => {
            beat.order_index = idx;
        });

        updateSceneBeats(dragScene, beats);
        await syncBeatOrder(dragScene.id, beats);

        setDraggingBeatId(null);
        setDragStartIndex(-1);
        setDragScene(null);
    }, [dragScene, dragStartIndex, draggingBeatId, syncBeatOrder, updateSceneBeats]);

    const handleAddBeat = React.useCallback((scene: TimelineScene) => {
        const beats = getSceneBeats(scene);
        const nextIndex = beats.length;
        setEditingBeat({
            name: `Beat ${nextIndex + 1}`,
            duration_seconds: 10,
            order_index: nextIndex,
            shot_count: null,
            recording_setup: null,
        });
        setActiveSceneForEdit(scene);
    }, []);

    const closeBeatEditor = React.useCallback(() => {
        setEditingBeat(null);
        setActiveSceneForEdit(null);
    }, []);

    const handleBeatSave = React.useCallback(async (updatedBeat: BeatEditorBeat) => {
        if (!activeSceneForEdit) return;

        const sceneId = activeSceneForEdit.id;
        const beats = getSceneBeats(activeSceneForEdit);

        if (updatedBeat.id) {
            const response = await beatsApi.update(updatedBeat.id, {
                name: updatedBeat.name,
                duration_seconds: updatedBeat.duration_seconds,
                order_index: updatedBeat.order_index,
                shot_count: updatedBeat.shot_count ?? null,
            });

            if (updatedBeat.recording_setup) {
                const setup = await beatsApi.recordingSetup.upsert(updatedBeat.id, updatedBeat.recording_setup);
                (response as any).recording_setup = setup;
            }

            const updatedBeats = beats.map((beat) =>
                beat.id === updatedBeat.id
                    ? { ...beat, ...response }
                    : beat
            );
            updateSceneBeats(activeSceneForEdit, updatedBeats);
            await syncBeatOrder(sceneId, updatedBeats);
        } else {
            const response = await beatsApi.create(sceneId, {
                name: updatedBeat.name,
                duration_seconds: updatedBeat.duration_seconds,
                order_index: updatedBeat.order_index ?? beats.length,
                shot_count: updatedBeat.shot_count ?? null,
            });

            if (updatedBeat.recording_setup) {
                const setup = await beatsApi.recordingSetup.upsert(response.id, updatedBeat.recording_setup);
                (response as any).recording_setup = setup;
            }
            const updatedBeats = [...beats, response as SceneBeat].sort((a, b) => a.order_index - b.order_index);
            updateSceneBeats(activeSceneForEdit, updatedBeats);
            await syncBeatOrder(sceneId, updatedBeats);
        }

        closeBeatEditor();
    }, [activeSceneForEdit, closeBeatEditor, syncBeatOrder, updateSceneBeats]);

    const handleBeatDelete = React.useCallback(async (beatId?: number) => {
        if (!activeSceneForEdit || !beatId) return;
        await beatsApi.delete(beatId);
        const beats = getSceneBeats(activeSceneForEdit);
        const updatedBeats = beats.filter((beat) => beat.id !== beatId).map((beat, index) => ({
            ...beat,
            order_index: index,
        }));
        updateSceneBeats(activeSceneForEdit, updatedBeats);
        await syncBeatOrder(activeSceneForEdit.id, updatedBeats);
        closeBeatEditor();
    }, [activeSceneForEdit, closeBeatEditor, syncBeatOrder, updateSceneBeats]);

    return {
        editingBeat,
        activeSceneForEdit,
        closeBeatEditor,
        handleBeatClick,
        handleBeatSave,
        handleBeatDelete,
        handleAddBeat,
        draggingBeatId,
        handleBeatDragStart,
        handleBeatDragOver,
        handleBeatDrop,
    };
};
