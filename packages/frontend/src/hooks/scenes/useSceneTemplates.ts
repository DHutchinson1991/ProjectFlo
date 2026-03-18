import { useCallback, useState } from "react";
import type { FilmScene, SceneTemplate } from "../../lib/types/domains/scenes";
import { request } from "../utils/api";

export const useSceneTemplates = () => {
  const [templates, setTemplates] = useState<SceneTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<SceneTemplate[]>("/scenes/templates", {}, { includeBrandQuery: false });
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scene templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getScenesByTemplate = useCallback(async (templateId: number) => {
    return request<FilmScene[]>(`/scenes/template/${templateId}/scenes`);
  }, []);

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    getScenesByTemplate,
  };
};
