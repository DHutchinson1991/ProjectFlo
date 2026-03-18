import type { TimelineScene } from "@/lib/types/timeline";
import { loadSceneTemplate } from "./sceneTemplateLoader";
import { isLogEnabled } from "@/lib/debug/log-flags";

/**
 * Enriches film scenes with moments or beats
 * Moments scenes use moments/templates; montage scenes use beats.
 */
export async function enrichScenesWithBeats(filmScenes: any[]): Promise<TimelineScene[]> {
    const shouldLog = isLogEnabled("film");
    if (shouldLog) {
        console.log(`📥 [ENRICH] Starting scene enrichment for ${filmScenes.length} scenes`);
    }

    const timelineScenes: TimelineScene[] = [];

    for (const scene of filmScenes) {
        const sceneType = (scene.type || "VIDEO").toLowerCase() as any;
        let momentsList: any[] = [];
        let beatsList: any[] = Array.isArray(scene.beats) ? scene.beats : [];
        // Check explicit type sources: template object, scene_template_type field, scene_mode, useMoments flag
        let templateType: string | undefined = scene?.template?.type
            || scene?.scene_template_type
            || scene?.scene_mode
            || (scene?.useMoments === true ? "MOMENTS" : undefined);

        let template: any = null;
        if (!templateType && scene.scene_template_id) {
            template = await loadSceneTemplate(scene.scene_template_id);
            templateType = template?.type;
        }

        const hasExplicitShotCount = scene.shot_count !== null && typeof scene.shot_count !== "undefined";
        const hasDurationSeconds = scene.duration_seconds !== null && typeof scene.duration_seconds !== "undefined";
        const hasTemplateId = Number.isFinite(scene.scene_template_id) && Number(scene.scene_template_id) > 0;
        const hasMoments = Array.isArray(scene.moments) && scene.moments.length > 0;

        const inferredTemplateType = templateType
            // Only treat as MONTAGE from shot_count if the scene has NO moments
            || (hasExplicitShotCount && !hasMoments ? "MONTAGE" : undefined)
            || ((hasDurationSeconds && !hasMoments) ? "MONTAGE" : undefined)
            || ((!hasTemplateId && !hasMoments) ? "MONTAGE" : undefined);
        const isMomentsScene = inferredTemplateType ? inferredTemplateType === "MOMENTS" : true;
            const isMontageScene = inferredTemplateType === "MONTAGE";

        if (shouldLog) {
            console.log(`🧭 [ENRICH-TYPE] Scene ${scene.id}:`, {
                name: scene.name,
                scene_template_id: scene.scene_template_id,
                templateType,
                hasTemplateId,
                hasMoments,
                momentsCount: scene.moments?.length || 0,
                beatsCount: beatsList.length,
                beatNames: beatsList.map((beat) => beat.name),
                beatShotCounts: beatsList.map((beat) => beat.shot_count ?? null),
                beatDurations: beatsList.map((beat) => beat.duration_seconds ?? null),
                shot_count: scene.shot_count ?? null,
                duration_seconds: scene.duration_seconds ?? null,
                inferredTemplateType,
                isMomentsScene,
                    isMontageScene,
            });
        }

        if ((isMomentsScene || isMontageScene) && scene.moments && scene.moments.length > 0) {
            momentsList = scene.moments;
        } else if (isMomentsScene && scene.scene_template_id) {
            if (!template) {
                template = await loadSceneTemplate(scene.scene_template_id);
                templateType = templateType || template?.type;
            }
            if (template?.moments && template.moments.length > 0) {
                momentsList = template.moments;
            }
        }

        const sceneTemplateType = inferredTemplateType || (scene as any)?.scene_template_type;
            const databaseType = (isMomentsScene || isMontageScene)
                ? "MOMENTS_CONTAINER"
                : (scene as any).database_type || "VIDEO";
        const colorType = sceneTemplateType || scene.type || "VIDEO";

        const useMomentsView = isMomentsScene || (isMontageScene && momentsList.length > 0);
        const momentsDuration = momentsList.reduce((sum: number, m: any) => sum + (m.duration || 10), 0);
        const beatsDuration = beatsList.reduce((sum: number, b: any) => sum + (b.duration_seconds || 0), 0);
        const resolvedDuration = scene.duration
            || scene.duration_seconds
            || (useMomentsView ? (momentsDuration > 0 ? momentsDuration : 60) : (beatsDuration > 0 ? beatsDuration : 60));

        const timelineScene = {
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
        };

        if (shouldLog) {
            console.log(`✅ [ENRICH] Timeline scene ${scene.id} built:`, {
                id: timelineScene.id,
                name: timelineScene.name,
                isMomentsScene,
                    isMontageScene,
                beatsCount: (timelineScene as any).beats?.length || 0,
                momentsCount: (timelineScene as any).moments?.length || 0,
                duration: timelineScene.duration,
                duration_seconds: timelineScene.duration_seconds,
            });
        }

        timelineScenes.push(timelineScene);
    }

    const sortedScenes = [...timelineScenes].sort((a, b) => {
        const aOrder = (a as any).order_index ?? Infinity;
        const bOrder = (b as any).order_index ?? Infinity;
        return aOrder - bOrder;
    });

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
        return normalized;
    });

    return normalizedScenes;
}

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
