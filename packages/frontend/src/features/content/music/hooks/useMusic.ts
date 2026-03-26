import { useCallback, useState } from "react";
import type {
  CreateMomentMusicDto,
  CreateSceneMusicDto,
  MomentMusic,
  SceneMusic,
  UpdateMomentMusicDto,
  UpdateSceneMusicDto,
} from "../../lib/types/domains/music";
import { request } from "../utils/api";

export const useMusic = () => {
  const [sceneMusic, setSceneMusic] = useState<SceneMusic | null>(null);
  const [momentMusic, setMomentMusic] = useState<MomentMusic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSceneMusic = useCallback(async (sceneId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<SceneMusic>(`/api/music/scenes/${sceneId}/music`);
      setSceneMusic(data);
      return data;
    } catch (err) {
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
      const data = await request<MomentMusic>(`/api/music/moments/${momentId}/music`);
      setMomentMusic(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load moment music");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSceneMusic = useCallback(async (sceneId: number, payload: CreateSceneMusicDto) => {
    const created = await request<SceneMusic>(`/api/music/scenes/${sceneId}/music`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setSceneMusic(created);
    return created;
  }, []);

  const updateSceneMusic = useCallback(async (sceneId: number, payload: UpdateSceneMusicDto) => {
    const updated = await request<SceneMusic>(`/api/music/scenes/${sceneId}/music`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setSceneMusic(updated);
    return updated;
  }, []);

  const removeSceneMusic = useCallback(async (sceneId: number) => {
    await request<void>(`/api/music/scenes/${sceneId}/music`, { method: "DELETE" });
    setSceneMusic(null);
  }, []);

  const createMomentMusic = useCallback(async (momentId: number, payload: CreateMomentMusicDto) => {
    const created = await request<MomentMusic>(`/api/music/moments/${momentId}/music`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setMomentMusic(created);
    return created;
  }, []);

  const updateMomentMusic = useCallback(async (momentId: number, payload: UpdateMomentMusicDto) => {
    const updated = await request<MomentMusic>(`/api/music/moments/${momentId}/music`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setMomentMusic(updated);
    return updated;
  }, []);

  const removeMomentMusic = useCallback(async (momentId: number) => {
    await request<void>(`/api/music/moments/${momentId}/music`, { method: "DELETE" });
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
