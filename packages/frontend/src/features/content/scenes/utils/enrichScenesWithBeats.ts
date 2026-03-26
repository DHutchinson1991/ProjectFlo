import type { TimelineScene } from "@/lib/types/timeline";
import { loadSceneTemplate } from "./sceneTemplateLoader";
import { isLogEnabled } from "@/lib/debug/log-flags";
import { getSceneColorByType, sortAndNormalizeScenes } from "./scene-enrichment-utils";

/**
 * Enriches film scenes with moments or beats.
 * Moments scenes use moments/templates; montage scenes use beats.
 */
export async function enrichScenesWithBeats(filmScenes: any[]): Promise<TimelineScene[]> {
    const shouldLog = isLogEnabled("film");
    if (shouldLog) console.log(`📥 [ENRICH] Starting enrichment for ${filmScenes.length} scenes`);

    const timelineScenes: TimelineScene[] = [];

    for (const scene of filmScenes) {
        const sceneType = (scene.type || "VIDEO").toLowerCase() as any;
        let momentsList: any[] = [];
        const beatsList: any[] = Array.isArray(scene.beats) ? scene.beats : [];

        let templateType: string | undefined = scene?.template?.type
            || scene?.scene_template_type
            || scene?.scene_mode
            || (scene?.useMoments === true ? "MOMENTS" : undefined);

        let template: any = null;
        if (!templateType && scene.scene_template_id) {
            template = await loadSceneTemplate(scene.scene_template_id);
            templateType = template?.type;
        }

        const hasExplicitShotCount = scene.shot_count != null;
        const hasDurationSeconds = scene.duration_seconds != null;
        const hasTemplateId = Number.isFinite(scene.scene_template_id) && Number(scene.scene_template_id) > 0;
        const hasMoments = Array.isArray(scene.moments) && scene.moments.length > 0;

        const inferredTemplateType = templateType
            || (hasExplicitShotCount && !hasMoments ? "MONTAGE" : undefined)
            || (hasDurationSeconds && !hasMoments ? "MONTAGE" : undefined)
            || (!hasTemplateId && !hasMoments ? "MONTAGE" : undefined);
        const isMomentsScene = inferredTemplateType ? inferredTemplateType === "MOMENTS" : true;
        const isMontageScene = inferredTemplateType === "MONTAGE";

        if (shouldLog) {
            console.log(`🧭 [ENRICH-TYPE] Scene ${scene.id} "${scene.name}":`,
                { templateType, inferredTemplateType, isMomentsScene, isMontageScene, moments: scene.moments?.length || 0, beats: beatsList.length });
        }

        if ((isMomentsScene || isMontageScene) && scene.moments?.length > 0) {
            momentsList = scene.moments;
        } else if (isMomentsScene && scene.scene_template_id) {
            if (!template) {
                template = await loadSceneTemplate(scene.scene_template_id);
                templateType = templateType || template?.type;
            }
            if (template?.moments?.length > 0) momentsList = template.moments;
        }

        const sceneTemplateType = inferredTemplateType || scene?.scene_template_type;
        const databaseType = (isMomentsScene || isMontageScene)
            ? "MOMENTS_CONTAINER"
            : scene.database_type || "VIDEO";
        const colorType = sceneTemplateType || scene.type || "VIDEO";

        const useMomentsView = isMomentsScene || (isMontageScene && momentsList.length > 0);
        const momentsDuration = momentsList.reduce((sum: number, m: any) => sum + (m.duration || 10), 0);
        const beatsDuration = beatsList.reduce((sum: number, b: any) => sum + (b.duration_seconds || 0), 0);
        const resolvedDuration = scene.duration || scene.duration_seconds
            || (useMomentsView ? (momentsDuration || 60) : (beatsDuration || 60));

        timelineScenes.push({
            id: scene.id,
            film_id: scene.film_id,
            name: scene.name,
            start_time: scene.start_time || 0,
            duration: resolvedDuration,
            track_id: scene.track_id || 1,
            scene_type: sceneType,
            color: getSceneColorByType(colorType),
            description: scene.description,
            database_type: databaseType as TimelineScene['database_type'],
            original_scene_id: scene.id,
            order_index: scene.order_index,
            moments: useMomentsView ? momentsList : [],
            beats: !useMomentsView ? beatsList : [],
            montage_style: scene.montage_style || null,
            montage_bpm: scene.montage_bpm || null,
            media_components: scene.media_components || [],
            coverage_items: scene.coverage_items || [],
            music: scene.music || undefined,
            scene_music: scene.scene_music || undefined,
            location_assignment: scene.location_assignment || null,
            shot_count: scene.shot_count ?? null,
            duration_seconds: scene.duration_seconds ?? null,
            scene_template_type: sceneTemplateType,
        });
    }

    return sortAndNormalizeScenes(timelineScenes);
}
