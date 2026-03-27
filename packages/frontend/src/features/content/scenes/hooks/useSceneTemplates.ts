import { useQuery } from "@tanstack/react-query";
import { scenesApi } from "../api";
import type { ScenesLibrary } from "../types";

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
