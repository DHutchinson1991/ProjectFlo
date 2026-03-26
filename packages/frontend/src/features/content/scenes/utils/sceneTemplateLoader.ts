import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import { createScenesApi } from "../api";

const scenesApi = createScenesApi(apiClient as unknown as ApiClient);

const templateCache = new Map<number, unknown>();

export async function loadSceneTemplate(templateId: number) {
  try {
    if (templateCache.has(templateId)) {
      return templateCache.get(templateId);
    }

    const templates = await scenesApi.templates.getAll();
    templates.forEach((template) => {
      if (template?.id) {
        templateCache.set(template.id, template);
      }
    });

    const template = templateCache.get(templateId);

    if (template) {
      return template;
    }

    return null;
  } catch (error) {
    console.error(`[TEMPLATE] Failed to load template ${templateId}:`, error);
    return null;
  }
}

export function getTemplateFromCache(templateId: number) {
  return templateCache.get(templateId);
}

export function clearTemplateCache() {
  templateCache.clear();
}

export function getCacheStats() {
  return {
    size: templateCache.size,
    keys: Array.from(templateCache.keys()),
  };
}
