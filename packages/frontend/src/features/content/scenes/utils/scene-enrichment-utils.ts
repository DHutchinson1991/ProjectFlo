import type { TimelineScene } from "@/lib/types/timeline";

const SCENE_COLORS: Record<string, string> = {
    VIDEO: '#3B82F6',
    AUDIO: '#8B5CF6',
    GRAPHICS: '#EC4899',
    MOMENTS: '#10B981',
    MONTAGE: '#F97316',
    CEREMONY: '#F59E0B',
    MOMENTS_CONTAINER: '#10B981',
};

export function getSceneColorByType(type: string): string {
    return SCENE_COLORS[type] || '#6B7280';
}

/**
 * Sort scenes by order_index, then normalize start_time so scenes
 * tile sequentially on the timeline when explicit start_time is missing.
 */
export function sortAndNormalizeScenes(scenes: TimelineScene[]): TimelineScene[] {
    const sorted = [...scenes].sort((a, b) => {
        const aOrder = a.order_index ?? Infinity;
        const bOrder = b.order_index ?? Infinity;
        return aOrder - bOrder;
    });

    let runningStart = 0;
    return sorted.map((scene, index) => {
        const hasStart = scene.start_time !== undefined && scene.start_time !== null;
        const shouldOverride = !hasStart || (scene.start_time === 0 && index > 0);
        const nextStart = runningStart;
        const duration = scene.duration || 60;
        runningStart = nextStart + duration;
        return { ...scene, start_time: shouldOverride ? nextStart : scene.start_time };
    });
}
