import { useCallback, useState } from "react";
import { scenesApi } from "@/features/content/scenes/api";
import type {
  CreateMomentMusicDto,
  CreateSceneMusicDto,
  MomentMusic,
  SceneMusic,
  UpdateMomentMusicDto,
  UpdateSceneMusicDto,
} from "@/features/content/music/types";
import { momentsApi as musicMomentsApi } from "@/features/content/music/api/moments";

export const useMusic = () => {
  const [sceneMusic, setSceneMusic] = useState<SceneMusic | null>(null);
  const [momentMusic, setMomentMusic] = useState<MomentMusic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSceneMusic = useCallback(async (sceneId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scenesApi.scenes.music.get(sceneId);
      setSceneMusic(data);
      return data;
    } catch (err) {
      setSceneMusic(null);
      setError(err instanceof Error ? err.message : "Failed to load scene music");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMomentMusic = useCallback(async (momentId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await musicMomentsApi.getSceneMomentMusic(momentId);
      setMomentMusic(data as any);
      return data;
    } catch (err) {
      setMomentMusic(null);
      setError(err instanceof Error ? err.message : "Failed to load moment music");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSceneMusic = useCallback(async (sceneId: number, payload: CreateSceneMusicDto) => {
    const created = await scenesApi.scenes.music.create(sceneId, payload);
    setSceneMusic(created);
    return created;
  }, []);

  const updateSceneMusic = useCallback(async (sceneId: number, payload: UpdateSceneMusicDto) => {
    const updated = await scenesApi.scenes.music.update(sceneId, payload);
    setSceneMusic(updated);
    return updated;
  }, []);

  const removeSceneMusic = useCallback(async (sceneId: number) => {
    await scenesApi.scenes.music.delete(sceneId);
    setSceneMusic(null);
  }, []);

  const createMomentMusic = useCallback(async (momentId: number, payload: CreateMomentMusicDto) => {
    const created = await musicMomentsApi.createSceneMomentMusic(momentId, payload as any);
    setMomentMusic(created as any);
    return created;
  }, []);

  const updateMomentMusic = useCallback(async (momentId: number, payload: UpdateMomentMusicDto) => {
    const updated = await musicMomentsApi.updateSceneMomentMusic(momentId, payload as any);
    setMomentMusic(updated as any);
    return updated;
  }, []);

  const removeMomentMusic = useCallback(async (momentId: number) => {
    await musicMomentsApi.deleteSceneMomentMusic(momentId);
    setMomentMusic(null);
  }, []);

  return {
    sceneMusic,
    momentMusic,
    isLoading,
    error,
    loadSceneMusic,
    loadMomentMusic,
    createSceneMusic,
    updateSceneMusic,
    removeSceneMusic,
    createMomentMusic,
    updateMomentMusic,
    removeMomentMusic,
  };
};
