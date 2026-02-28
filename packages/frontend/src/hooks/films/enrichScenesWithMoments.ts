import type { TimelineScene } from "@/lib/types/timeline";
import { loadSceneTemplate } from "./sceneTemplateLoader";
import { isLogEnabled } from "@/lib/debug/log-flags";

/**
 * Enriches film scenes with moments from their templates
 * Creates ONE TimelineScene per database scene with moments array populated
 * (not separate scenes for each moment - this was causing the overlap)
 */
export async function enrichScenesWithMoments(
    filmScenes: any[]
): Promise<TimelineScene[]> {
    const shouldLog = isLogEnabled("film");
    if (shouldLog) {
        console.log(`📥 [ENRICH] Starting scene enrichment for ${filmScenes.length} scenes`);
        console.log(`📥 [ENRICH] Input scenes:`, filmScenes.map(s => ({
            id: s.id,
            name: s.name,
            order_index: s.order_index,
            template_id: s.scene_template_id
        })));
    }

    const timelineScenes: TimelineScene[] = [];

    for (const scene of filmScenes) {
        if (shouldLog) {
            console.log(`📥 [ENRICH] Processing scene:`, { 
                id: scene.id, 
                name: scene.name, 
                templateId: scene.scene_template_id,
                order_index: scene.order_index,
                momentsCount: scene.moments?.length || 0 
            });
        }

        const sceneType = (scene.type || 'VIDEO').toLowerCase() as any;
        let momentsList: any[] = [];
        let templateType: string | undefined = scene?.template?.type;

        let template: any = null;
        if (!templateType && scene.scene_template_id) {
            if (shouldLog) {
                console.log(`🔄 [ENRICH] Scene ${scene.id} has template ${scene.scene_template_id} - fetching template...`);
            }
            template = await loadSceneTemplate(scene.scene_template_id);
            templateType = template?.type;
        }

        const hasExplicitShotCount = scene.shot_count !== null && typeof scene.shot_count !== "undefined";
        const hasDurationSeconds = scene.duration_seconds !== null && typeof scene.duration_seconds !== "undefined";
        const hasTemplateId = Number.isFinite(scene.scene_template_id) && Number(scene.scene_template_id) > 0;
        const hasMoments = Array.isArray(scene.moments) && scene.moments.length > 0;

        const inferredTemplateType = templateType
            // Only treat as MONTAGE from shot_count if the scene has NO moments
            || (hasExplicitShotCount && !hasMoments ? 'MONTAGE' : undefined)
            || ((hasDurationSeconds && !hasMoments) ? 'MONTAGE' : undefined)
            || ((!hasTemplateId && !hasMoments) ? 'MONTAGE' : undefined);
        const isMomentsScene = inferredTemplateType ? inferredTemplateType === 'MOMENTS' : true;

        if (shouldLog) {
            console.log(`🧭 [ENRICH-TYPE] Scene ${scene.id}:`, {
                name: scene.name,
                scene_template_id: scene.scene_template_id,
                templateType,
                hasTemplateId,
                hasMoments,
                momentsCount: scene.moments?.length || 0,
                shot_count: scene.shot_count ?? null,
                duration_seconds: scene.duration_seconds ?? null,
                inferredTemplateType,
                isMomentsScene,
            });
        }

        // If scene already has moments, use them (Moments scenes only)
        if (isMomentsScene && scene.moments && scene.moments.length > 0) {
            if (shouldLog) {
                console.log(`✅ [ENRICH] Scene ${scene.id} already has ${scene.moments.length} moments`);
            }
            momentsList = scene.moments;
        }
        // If scene has a template, try to fetch moments from it (Moments scenes only)
        else if (isMomentsScene && scene.scene_template_id) {
            if (shouldLog) {
                console.log(`🔄 [ENRICH] Scene ${scene.id} has template ${scene.scene_template_id} - fetching moments...`);
            }
            if (!template) {
                template = await loadSceneTemplate(scene.scene_template_id);
                templateType = templateType || template?.type;
            }
            if (template?.moments && template.moments.length > 0) {
                if (shouldLog) {
                    console.log(`🎬 [ENRICH] Scene ${scene.id} - loaded ${template.moments.length} moments from template`);
                }
                momentsList = template.moments;
            }
        }

        // Create ONE TimelineScene per database scene with moments array
        if (shouldLog) {
            console.log(`📌 [ENRICH] Creating timeline scene ${scene.id} with ${momentsList.length} moments`);
        }
        const sceneTemplateType = inferredTemplateType || (scene as any)?.scene_template_type;
        const databaseType = isMomentsScene ? 'MOMENTS_CONTAINER' : (scene as any).database_type || 'VIDEO';
        const colorType = sceneTemplateType || scene.type || 'VIDEO';
        const resolvedDuration = scene.duration
            || scene.duration_seconds
            || (momentsList.length > 0 ? momentsList.reduce((sum: number, m: any) => sum + (m.duration || 10), 0) : 60);

        if (shouldLog) {
            console.log(`⏱️ [ENRICH-DURATION] Scene ${scene.id}:`, {
                name: scene.name,
                duration: scene.duration ?? null,
                duration_seconds: scene.duration_seconds ?? null,
                momentsCount: momentsList.length,
                resolvedDuration,
                databaseType,
                sceneTemplateType,
            });
        }

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
            database_type: databaseType as const,
            original_scene_id: scene.id,
            order_index: scene.order_index, // 🔥 Preserve order_index from database
            moments: momentsList,
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

    if (shouldLog) {
        console.log(`✅ [ENRICH] Scene enrichment complete:`, {
            inputScenes: filmScenes.length,
            outputTimelineScenes: timelineScenes.length
        });
    }
    
    // 🔥 SORT BY order_index to maintain correct scene sequence
    const sortedScenes = [...timelineScenes].sort((a, b) => {
        const aOrder = (a as any).order_index ?? Infinity;
        const bOrder = (b as any).order_index ?? Infinity;
        if (shouldLog) {
            console.log(`📊 [ENRICH-SORT] Comparing ${a.name} (order: ${aOrder}) vs ${b.name} (order: ${bOrder})`);
        }
        return aOrder - bOrder;
    });
    
    if (shouldLog) {
        console.log(`✅ [ENRICH] Scenes sorted by order_index:`, sortedScenes.map(s => ({
            id: s.id,
            name: s.name,
            order_index: (s as any).order_index,
            moments: s.moments?.length || 0
        })));
    }

    // 🔥 Ensure sequential start_time after reload when backend doesn't persist start_time
    let runningStartTime = 0;
    const normalizedScenes = sortedScenes.map((scene, index) => {
        const hasStartTime = scene.start_time !== undefined && scene.start_time !== null;
        const shouldOverrideStartTime = !hasStartTime || (scene.start_time === 0 && index > 0);
        const nextStart = runningStartTime;
        const duration = scene.duration || 60;
        const normalized = {
            ...scene,
            start_time: shouldOverrideStartTime ? nextStart : scene.start_time,
        };

        runningStartTime = nextStart + duration;

        if (shouldLog) {
            console.log(`📍 [ENRICH-START] Scene ${index + 1}/${sortedScenes.length}:`, {
                id: scene.id,
                name: scene.name,
                order_index: (scene as any).order_index,
                start_time: normalized.start_time,
                duration,
            });
        }

        return normalized;
    });

    return normalizedScenes;
}

/**
 * Helper to get scene color based on type
 */
function getSceneColorByType(type: string): string {
    const colors: Record<string, string> = {
        VIDEO: '#3B82F6',
        AUDIO: '#8B5CF6',
        GRAPHICS: '#EC4899',
        MOMENTS: '#10B981',
        MONTAGE: '#F97316',
        CEREMONY: '#F59E0B',
        MOMENTS_CONTAINER: '#10B981',
    };
    return colors[type] || '#6B7280';
}
