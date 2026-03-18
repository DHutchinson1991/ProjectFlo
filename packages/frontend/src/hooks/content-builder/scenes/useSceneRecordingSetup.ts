"use client";

import React from "react";
import { createScenesApi } from "@/lib/api/scenes.api";
import { apiClient } from "@/lib/api";
import { request } from "@/hooks/utils/api";
import { MusicType } from "@/lib/types/domains/music";
import type { TimelineScene, TimelineTrack } from "@/lib/types/timeline";

interface UseSceneRecordingSetupProps {
    scenes: TimelineScene[];
    tracks: TimelineTrack[];
    onUpdateScene?: (scene: TimelineScene) => void;
}

export const useSceneRecordingSetup = ({
    scenes,
    tracks,
    onUpdateScene,
}: UseSceneRecordingSetupProps) => {
    const scenesApi = React.useMemo(() => createScenesApi(apiClient), []);

    const [recordingSetupOpen, setRecordingSetupOpen] = React.useState(false);
    const [recordingSetupSceneName, setRecordingSetupSceneName] = React.useState<string | null>(null);
    const [recordingSetupSceneLabel, setRecordingSetupSceneLabel] = React.useState<string | null>(null);
    const [recordingSetupSceneIds, setRecordingSetupSceneIds] = React.useState<number[]>([]);
    const [selectedCameraTrackIds, setSelectedCameraTrackIds] = React.useState<number[]>([]);
    const [selectedAudioTrackIds, setSelectedAudioTrackIds] = React.useState<number[]>([]);
    const [graphicsEnabled, setGraphicsEnabled] = React.useState(false);
    const [isSavingRecordingSetup, setIsSavingRecordingSetup] = React.useState(false);
    const [sceneMusicEnabled, setSceneMusicEnabled] = React.useState(false);
    const [sceneMusicForm, setSceneMusicForm] = React.useState({
        music_name: "",
        artist: "",
        music_type: MusicType.MODERN,
    });
    const [musicError, setMusicError] = React.useState<string | null>(null);

    const normalizeTrackType = React.useCallback((value?: string | null) => (value || "").toLowerCase(), []);

    const videoTracks = React.useMemo(
        () => tracks.filter((track) => normalizeTrackType(track.track_type) === "video"),
        [tracks, normalizeTrackType]
    );
    const audioTracks = React.useMemo(
        () => tracks.filter((track) => normalizeTrackType(track.track_type) === "audio"),
        [tracks, normalizeTrackType]
    );
    const graphicsTracks = React.useMemo(
        () => tracks.filter((track) => normalizeTrackType(track.track_type) === "graphics"),
        [tracks, normalizeTrackType]
    );

    const toggleIdInList = React.useCallback((list: number[], id: number) => (
        list.includes(id) ? list.filter((value) => value !== id) : [...list, id]
    ), []);

    const openRecordingSetup = React.useCallback((sceneName: string, sceneLabel?: string) => {
        const groupScenes = scenes.filter((scene) => scene.name === sceneName && typeof scene.id === "number");
        const sceneIds = groupScenes.map((scene) => scene.id);
        const setupSource = groupScenes.find((scene) => (scene as any).recording_setup)?.recording_setup;
        const sceneMusicSource = groupScenes.find((scene) => (scene as any).scene_music)?.scene_music;

        setRecordingSetupSceneName(sceneName);
        setRecordingSetupSceneLabel(sceneLabel ?? null);
        setRecordingSetupSceneIds(sceneIds);

        const defaultCameraTrackIds = videoTracks.map((track) => track.id);
        const defaultAudioTrackIds = audioTracks.map((track) => track.id);
        const defaultGraphicsEnabled = false;

        setSelectedCameraTrackIds(
            setupSource?.camera_assignments?.map((a: any) => a.track_id) || defaultCameraTrackIds
        );
        setSelectedAudioTrackIds(setupSource?.audio_track_ids || defaultAudioTrackIds);
        setGraphicsEnabled(setupSource ? !!setupSource?.graphics_enabled : defaultGraphicsEnabled);
        setSceneMusicEnabled(!!sceneMusicSource);
        setSceneMusicForm({
            music_name: sceneMusicSource?.music_name || "",
            artist: sceneMusicSource?.artist || "",
            music_type: (sceneMusicSource?.music_type as MusicType) || MusicType.MODERN,
        });
        setMusicError(null);
        setRecordingSetupOpen(true);
    }, [scenes, videoTracks, audioTracks]);

    const closeRecordingSetup = React.useCallback(() => {
        setRecordingSetupOpen(false);
        setRecordingSetupSceneName(null);
        setRecordingSetupSceneLabel(null);
        setRecordingSetupSceneIds([]);
        setMusicError(null);
    }, []);

    const handleSaveRecordingSetup = React.useCallback(async () => {
        if (recordingSetupSceneIds.length === 0) {
            closeRecordingSetup();
            return;
        }

        if (sceneMusicEnabled && !sceneMusicForm.music_name.trim()) {
            setMusicError("Scene music name is required.");
            return;
        }

        setIsSavingRecordingSetup(true);

        try {
            const payload = {
                camera_track_ids: Array.from(new Set(selectedCameraTrackIds)),
                audio_track_ids: Array.from(new Set(selectedAudioTrackIds)),
                graphics_enabled: graphicsEnabled,
            };

            const results = await Promise.all(
                recordingSetupSceneIds.map((sceneId) => scenesApi.scenes.recordingSetup.upsert(sceneId, payload))
            );

            const setupId = results.find((result) => result?.id)?.id || 0;
            const trackLookup = new Map(tracks.map((track) => [track.id, track]));
            const nextSetup = {
                id: setupId,
                audio_track_ids: selectedAudioTrackIds,
                graphics_enabled: graphicsEnabled,
                camera_assignments: selectedCameraTrackIds.map((trackId) => {
                    const track = trackLookup.get(trackId);
                    return {
                        track_id: trackId,
                        track_name: track?.name,
                        track_type: track?.track_type?.toUpperCase(),
                        subject_ids: [],
                    };
                }),
            };

            recordingSetupSceneIds.forEach((sceneId) => {
                const scene = scenes.find((candidate) => candidate.id === sceneId);
                if (scene && onUpdateScene) {
                    onUpdateScene({ ...scene, recording_setup: nextSetup } as any);
                }
            });

            const musicPayload = {
                music_name: sceneMusicForm.music_name.trim(),
                artist: sceneMusicForm.artist.trim() || undefined,
                music_type: sceneMusicForm.music_type,
            };

            const sceneMusicResults = await Promise.all(
                recordingSetupSceneIds.map(async (sceneId) => {
                    if (sceneMusicEnabled) {
                        const response = await request(`/music/scenes/${sceneId}/music`, {
                            method: "POST",
                            body: JSON.stringify({ film_scene_id: sceneId, ...musicPayload }),
                        });
                        return { sceneId, sceneMusic: response };
                    }

                    try {
                        await request(`/music/scenes/${sceneId}/music`, { method: "DELETE" });
                    } catch {
                        // Ignore if there was no scene music to remove
                    }
                    return { sceneId, sceneMusic: null };
                })
            );

            sceneMusicResults.forEach(({ sceneId, sceneMusic }) => {
                const scene = scenes.find((candidate) => candidate.id === sceneId);
                if (scene && onUpdateScene) {
                    onUpdateScene({ ...scene, scene_music: sceneMusic } as any);
                }
            });
        } catch (error) {
            console.error("❌ [SCENE-RECORDING-SETUP] Failed to save recording setup:", error);
        } finally {
            setIsSavingRecordingSetup(false);
            closeRecordingSetup();
        }
    }, [
        recordingSetupSceneIds,
        closeRecordingSetup,
        sceneMusicEnabled,
        sceneMusicForm,
        selectedCameraTrackIds,
        selectedAudioTrackIds,
        graphicsEnabled,
        scenesApi,
        tracks,
        scenes,
        onUpdateScene,
    ]);

    const handleClearRecordingSetup = React.useCallback(async () => {
        if (recordingSetupSceneIds.length === 0) {
            closeRecordingSetup();
            return;
        }

        setIsSavingRecordingSetup(true);

        try {
            await Promise.all(
                recordingSetupSceneIds.map((sceneId) => scenesApi.scenes.recordingSetup.delete(sceneId))
            );

            recordingSetupSceneIds.forEach((sceneId) => {
                const scene = scenes.find((candidate) => candidate.id === sceneId);
                if (scene && onUpdateScene) {
                    onUpdateScene({ ...scene, recording_setup: null } as any);
                }
            });
        } catch (error) {
            console.error("❌ [SCENE-RECORDING-SETUP] Failed to clear recording setup:", error);
        } finally {
            setIsSavingRecordingSetup(false);
            closeRecordingSetup();
        }
    }, [recordingSetupSceneIds, closeRecordingSetup, scenesApi, scenes, onUpdateScene]);

    return {
        recordingSetupOpen,
        recordingSetupSceneName,
        recordingSetupSceneLabel,
        recordingSetupSceneIds,
        selectedCameraTrackIds,
        setSelectedCameraTrackIds,
        selectedAudioTrackIds,
        setSelectedAudioTrackIds,
        graphicsEnabled,
        setGraphicsEnabled,
        isSavingRecordingSetup,
        sceneMusicEnabled,
        setSceneMusicEnabled,
        sceneMusicForm,
        setSceneMusicForm,
        musicError,
        videoTracks,
        audioTracks,
        graphicsTracks,
        toggleIdInList,
        openRecordingSetup,
        closeRecordingSetup,
        handleSaveRecordingSetup,
        handleClearRecordingSetup,
    };
};
