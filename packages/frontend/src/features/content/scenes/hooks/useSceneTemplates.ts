import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import { createScenesApi } from "../api";
import type { ScenesLibrary } from "../types";

const scenesApi = createScenesApi(apiClient as unknown as ApiClient);

export const sceneTemplateKeys = {
  all: ["scene-templates"] as const,
  byTemplate: (templateId: number) => ["scene-templates", "by-template", templateId] as const,
};

export const useSceneTemplates = () => {
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: sceneTemplateKeys.all,
    queryFn: () => scenesApi.templates.getAll(),
  });

  const getScenesByTemplate = async (templateId: number): Promise<ScenesLibrary[]> => {
    return scenesApi.templates.getScenesByTemplate(templateId);
  };

  return {
    templates,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    getScenesByTemplate,
  };
};
