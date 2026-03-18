import { api } from "@/lib/api";

/**
 * Scene Template Loader
 * Fetches and caches scene templates with error handling
 * Uses domain API: createScenesApi from @/lib/api/scenes.api
 */

const templateCache = new Map<number, any>();

export async function loadSceneTemplate(templateId: number) {
  try {
    // Check cache first
    if (templateCache.has(templateId)) {
      return templateCache.get(templateId);
    }

    // Fetch all templates (cached afterward) since there is no template-by-id endpoint
    const templates = await api.scenes.getTemplates();
    templates.forEach((template) => {
      if (template?.id) {
        templateCache.set(template.id, template);
      }
    });

    const template = templateCache.get(templateId);
    
    if (template) {
      templateCache.set(templateId, template);
      console.log(`✅ [TEMPLATE] Loaded template ${templateId}: ${template.name}`);
      return template;
    }

    console.warn(`⚠️ [TEMPLATE] Template ${templateId} not found`);
    return null;
  } catch (error) {
    console.error(`❌ [TEMPLATE] Failed to load template ${templateId}:`, error);
    return null;
  }
}

export function getTemplateFromCache(templateId: number) {
  return templateCache.get(templateId);
}

export function clearTemplateCache() {
  templateCache.clear();
  console.log("🗑️ [TEMPLATE] Cache cleared");
}

export function getCacheStats() {
  return {
    size: templateCache.size,
    keys: Array.from(templateCache.keys()),
  };
}
