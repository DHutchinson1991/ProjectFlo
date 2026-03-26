import type { TimelineScene } from "@/lib/types/timeline";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SceneRecord = any;

/**
 * Merge API-fetched scene data (moments, beats, music) into film-embedded scenes.
 * Preserves moment_music from film data when API data lacks it.
 */
export function mergeApiScenesIntoLocal(localScenes: SceneRecord[], apiScenes: SceneRecord[]): SceneRecord[] {
  const apiById = new Map(apiScenes.map((scene: SceneRecord) => [scene.id, scene]));

  return localScenes.map((scene: SceneRecord) => {
    const apiScene = apiById.get(scene.id);
    if (!apiScene) return scene;

    let mergedMoments: SceneRecord[];
    if (Array.isArray(apiScene.moments) && apiScene.moments.length > 0) {
      const filmMomentsById = new Map<number, SceneRecord>(
        (Array.isArray(scene.moments) ? scene.moments : []).map((m: SceneRecord) => [m.id, m])
      );
      mergedMoments = apiScene.moments.map((apiMoment: SceneRecord) => {
        const filmMoment = filmMomentsById.get(apiMoment.id);
        return {
          ...apiMoment,
          moment_music: apiMoment.moment_music ?? filmMoment?.moment_music ?? null,
        };
      });
    } else {
      mergedMoments = Array.isArray(scene.moments) && scene.moments.length > 0 ? scene.moments : [];
    }

    return {
      ...scene,
      shot_count: apiScene.shot_count ?? scene.shot_count ?? null,
      duration_seconds: apiScene.duration_seconds ?? scene.duration_seconds ?? null,
      beats: Array.isArray(apiScene.beats) ? apiScene.beats : (scene.beats ?? []),
      moments: mergedMoments,
      recording_setup: apiScene.recording_setup ?? scene.recording_setup ?? null,
      scene_music: apiScene.scene_music ?? scene.scene_music ?? null,
    };
  });
}

/**
 * Remove duplicate scenes sharing the same template + name.
 * Returns the unique list and a list of duplicate IDs to clean up.
 */
export function deduplicateScenes(scenes: SceneRecord[]): { unique: SceneRecord[]; duplicateIds: number[] } {
  const seenKeys = new Map<string, number>();
  const unique: SceneRecord[] = [];
  const duplicateIds: number[] = [];

  for (const scene of scenes) {
    const key = `${scene.scene_template_id ?? "na"}|${scene.name ?? "na"}`;
    if (!seenKeys.has(key)) {
      seenKeys.set(key, scene.id);
      unique.push(scene);
    } else {
      duplicateIds.push(scene.id);
    }
  }

  return { unique, duplicateIds };
}
