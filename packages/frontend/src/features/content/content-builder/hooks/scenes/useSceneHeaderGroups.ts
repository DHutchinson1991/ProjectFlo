import { useMemo } from "react";
import type { TimelineScene } from "@/features/content/content-builder/types/timeline";
import type { TimelineSceneMoment } from "@/features/content/moments/types";
import type { SceneBeat } from "@/features/content/scenes/types/beats";

export interface SceneHeaderGroup {
    name: string;
    startTime: number;
    endTime: number;
    sceneCount: number;
    momentCount: number;
    moments: TimelineSceneMoment[];
    beatCount: number;
    beats: SceneBeat[];
    primaryScene: TimelineScene;
    order_index?: number;
}

type TimelineSceneWithMoments = TimelineScene & { moments?: TimelineSceneMoment[] };
type TimelineSceneWithBeats = TimelineScene & { beats?: SceneBeat[] };

export const useSceneHeaderGroups = (scenes: TimelineScene[]) => {
    return useMemo(() => {
        const groups = new Map<string, SceneHeaderGroup>();

        scenes.forEach((scene) => {
            const sceneName = scene.name || "Unknown";
            const sceneMoments = (scene as TimelineSceneWithMoments).moments || [];
            const sceneMomentsCount = sceneMoments.length;
            const sceneBeats = (scene as TimelineSceneWithBeats).beats || [];
            const sceneBeatsCount = sceneBeats.length;
            const existing = groups.get(sceneName);
            const sceneEnd = scene.start_time + (scene.duration || 0);

            if (existing) {
                existing.startTime = Math.min(existing.startTime, scene.start_time);
                existing.endTime = Math.max(existing.endTime, sceneEnd);
                existing.sceneCount += 1;
                existing.momentCount = Math.max(existing.momentCount, sceneMomentsCount);
                existing.beatCount = Math.max(existing.beatCount, sceneBeatsCount);
                if (typeof scene.order_index === "number") {
                    existing.order_index = typeof existing.order_index === "number"
                        ? Math.min(existing.order_index, scene.order_index)
                        : scene.order_index;
                }
                if (sceneMoments.length > existing.moments.length || sceneBeats.length > existing.beats.length) {
                    existing.moments = sceneMoments;
                    existing.beats = sceneBeats;
                    existing.primaryScene = scene;
                }
            } else {
                groups.set(sceneName, {
                    name: sceneName,
                    startTime: scene.start_time,
                    endTime: sceneEnd,
                    sceneCount: 1,
                    momentCount: sceneMomentsCount,
                    moments: sceneMoments,
                    beatCount: sceneBeatsCount,
                    beats: sceneBeats,
                    primaryScene: scene,
                    order_index: typeof scene.order_index === "number" ? scene.order_index : undefined,
                });
            }
        });

        const sorted = Array.from(groups.values()).sort((a, b) => {
            const aOrder = typeof a.order_index === "number" ? a.order_index : Number.POSITIVE_INFINITY;
            const bOrder = typeof b.order_index === "number" ? b.order_index : Number.POSITIVE_INFINITY;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.startTime - b.startTime;
        });

        return sorted.map((group, index) => ({
            ...group,
            order_index: typeof group.order_index === "number" ? group.order_index : index,
        }));
    }, [scenes]);
};
