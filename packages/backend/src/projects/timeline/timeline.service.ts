import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateTimelineSceneDto,
  UpdateTimelineSceneDto,
  CreateTimelineLayerDto,
} from "./timeline.controller";

// Define a type for timeline scenes used in analytics/validation
export interface TimelineScene {
  id: number;
  film_id: number;
  layer_id: number;
  start_time_seconds: number;
  duration_seconds: number;
  scene: { name: string };
  layer: { name: string; order_index: number };
  // Add other properties as needed
}

// Define return type for timeline analytics
export interface TimelineAnalytics {
  totalDuration: number;
  totalScenes: number;
  layerStats: Record<string, { count: number; totalDuration: number }>;
  sceneStats: Record<string, { count: number; totalDuration: number }>;
  timelineHealth: {
    hasGaps: { start: number; end: number; duration: number }[];
    hasOverlaps: {
      scene1: TimelineScene;
      scene2: TimelineScene;
      overlapDuration: number;
    }[];
  };
}

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) { }

  // Timeline Scenes
  async createTimelineScene(createDto: CreateTimelineSceneDto) {
    // Validate that the timecode aligns to 5-second snapping
    if (createDto.start_time_seconds % 5 !== 0) {
      throw new ConflictException(
        "Start time must be aligned to 5-second intervals",
      );
    }

    // Check for overlaps on the same layer
    const existingScene = await this.prisma.timelineScene.findFirst({
      where: {
        film_id: createDto.film_id,
        layer_id: createDto.layer_id,
        start_time_seconds: createDto.start_time_seconds,
      },
    });

    if (existingScene) {
      throw new ConflictException(
        "Another scene already exists at this position",
      );
    }

    return this.prisma.timelineScene.create({
      data: createDto,
      include: {
        scene: true,
        layer: true,
        film: true,
      },
    });
  }

  async getTimelineScenesForContent(contentId: number) {
    return this.prisma.timelineScene.findMany({
      where: { film_id: contentId },
      include: {
        scene: true,
        layer: true,
      },
      orderBy: [
        { layer: { order_index: "asc" } },
        { start_time_seconds: "asc" },
      ],
    });
  }

  async getTimelineScene(id: number) {
    const scene = await this.prisma.timelineScene.findUnique({
      where: { id },
      include: {
        scene: true,
        layer: true,
        film: true,
      },
    });

    if (!scene) {
      throw new NotFoundException("Timeline scene not found");
    }

    return scene;
  }

  async updateTimelineScene(id: number, updateDto: UpdateTimelineSceneDto) {
    // Validate 5-second snapping if start_time is being updated
    if (
      updateDto.start_time_seconds &&
      updateDto.start_time_seconds % 5 !== 0
    ) {
      throw new ConflictException(
        "Start time must be aligned to 5-second intervals",
      );
    }

    // Check for overlaps if position is changing
    if (updateDto.start_time_seconds || updateDto.layer_id) {
      const current = await this.getTimelineScene(id);
      const newStartTime =
        updateDto.start_time_seconds ?? current.start_time_seconds;
      const newLayerId = updateDto.layer_id ?? current.layer_id;

      const existingScene = await this.prisma.timelineScene.findFirst({
        where: {
          film_id: current.film_id,
          layer_id: newLayerId,
          start_time_seconds: newStartTime,
          NOT: { id },
        },
      });

      if (existingScene) {
        throw new ConflictException(
          "Another scene already exists at this position",
        );
      }
    }

    return this.prisma.timelineScene.update({
      where: { id },
      data: updateDto,
      include: {
        scene: true,
        layer: true,
        film: true,
      },
    });
  }

  async removeTimelineScene(id: number) {
    try {
      return await this.prisma.timelineScene.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException("Timeline scene not found");
    }
  }

  // Timeline Layers
  async getTimelineLayers() {
    return this.prisma.timelineLayer.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
    });
  }

  async createTimelineLayer(createDto: CreateTimelineLayerDto) {
    return this.prisma.timelineLayer.create({
      data: createDto,
    });
  }

  async updateTimelineLayer(
    id: number,
    updateDto: Partial<CreateTimelineLayerDto>,
  ) {
    try {
      return await this.prisma.timelineLayer.update({
        where: { id },
        data: updateDto,
      });
    } catch {
      throw new NotFoundException("Timeline layer not found");
    }
  }

  async removeTimelineLayer(id: number) {
    // Check if layer is in use
    const sceneCount = await this.prisma.timelineScene.count({
      where: { layer_id: id },
    });

    if (sceneCount > 0) {
      throw new ConflictException("Cannot delete layer that contains scenes");
    }

    try {
      return await this.prisma.timelineLayer.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException("Timeline layer not found");
    }
  }

  // Timeline Analytics
  async getTimelineAnalytics(contentId: number): Promise<TimelineAnalytics> {
    const scenes = await this.getTimelineScenesForContent(contentId);

    // Calculate timeline statistics
    const totalDuration = Math.max(
      ...scenes.map((c) => c.start_time_seconds + c.duration_seconds),
      0,
    );

    const layerStats = scenes.reduce(
      (acc, scene) => {
        const layerName = scene.layer.name;
        if (!acc[layerName]) {
          acc[layerName] = { count: 0, totalDuration: 0 };
        }
        acc[layerName].count++;
        acc[layerName].totalDuration += scene.duration_seconds;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number }>,
    );

    const sceneStats = scenes.reduce(
      (acc, scene) => {
        const sceneName = scene.scene.name;
        if (!acc[sceneName]) {
          acc[sceneName] = { count: 0, totalDuration: 0 };
        }
        acc[sceneName].count++;
        acc[sceneName].totalDuration += scene.duration_seconds;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number }>,
    );

    return {
      totalDuration,
      totalScenes: scenes.length,
      layerStats,
      sceneStats,
      timelineHealth: {
        hasGaps: this.detectTimelineGaps(scenes),
        hasOverlaps: this.detectTimelineOverlaps(scenes),
      },
    };
  }

  // Timeline Validation
  async validateTimeline(contentId: number) {
    const scenes = await this.getTimelineScenesForContent(contentId);

    const issues: string[] = [];

    // Check for gaps
    const gaps = this.detectTimelineGaps(scenes);
    if (gaps.length > 0) {
      issues.push(`Found ${gaps.length} gaps in timeline`);
    }

    // Check for overlaps
    const overlaps = this.detectTimelineOverlaps(scenes);
    if (overlaps.length > 0) {
      issues.push(`Found ${overlaps.length} overlapping scenes`);
    }

    // Scenes without workflow tasks will now be managed by UniversalWorkflowManager
    // This validation is less relevant since task management is handled by workflows
    const scenesWithoutWorkflow = []; // Could be enhanced to check workflow assignments
    if (scenesWithoutWorkflow.length > 0) {
      issues.push(
        `${scenesWithoutWorkflow.length} scenes may need workflow assignment`,
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      totalScenes: scenes.length,
    };
  }

  private detectTimelineGaps(
    scenes: TimelineScene[],
  ): { start: number; end: number; duration: number }[] {
    // Sort scenes by layer and start time
    const sortedScenes = scenes.sort((a, b) => {
      if (a.layer_id !== b.layer_id) return a.layer_id - b.layer_id;
      return a.start_time_seconds - b.start_time_seconds;
    });

    const gaps: { start: number; end: number; duration: number }[] = [];
    let lastEndTime = 0;

    for (const scene of sortedScenes) {
      if (scene.start_time_seconds > lastEndTime) {
        gaps.push({
          start: lastEndTime,
          end: scene.start_time_seconds,
          duration: scene.start_time_seconds - lastEndTime,
        });
      }
      lastEndTime = Math.max(
        lastEndTime,
        scene.start_time_seconds + scene.duration_seconds,
      );
    }

    return gaps;
  }

  private detectTimelineOverlaps(scenes: TimelineScene[]): {
    scene1: TimelineScene;
    scene2: TimelineScene;
    overlapDuration: number;
  }[] {
    const overlaps: {
      scene1: TimelineScene;
      scene2: TimelineScene;
      overlapDuration: number;
    }[] = [];

    // Group by layer
    const layerGroups = scenes.reduce(
      (acc, scene) => {
        if (!acc[scene.layer_id]) acc[scene.layer_id] = [];
        acc[scene.layer_id].push(scene);
        return acc;
      },
      {} as Record<number, TimelineScene[]>,
    );

    // Check for overlaps within each layer
    Object.values(layerGroups).forEach((layerScenes: TimelineScene[]) => {
      layerScenes.sort((a, b) => a.start_time_seconds - b.start_time_seconds);

      for (let i = 0; i < layerScenes.length - 1; i++) {
        const current = layerScenes[i];
        const next = layerScenes[i + 1];

        const currentEnd =
          current.start_time_seconds + current.duration_seconds;
        if (currentEnd > next.start_time_seconds) {
          overlaps.push({
            scene1: current,
            scene2: next,
            overlapDuration: currentEnd - next.start_time_seconds,
          });
        }
      }
    });

    return overlaps;
  }

  // Scene + Media Component Timeline Methods

  /**
   * Place a scene on the timeline with all its media components
   */
  async placeSceneOnTimeline(
    filmId: number,
    sceneId: number,
    layerId: number,
    startTimeSeconds: number,
    durationOverride?: number
  ) {
    // Validate 5-second snapping
    if (startTimeSeconds % 5 !== 0) {
      throw new ConflictException(
        "Start time must be aligned to 5-second intervals",
      );
    }

    // Get the scene with its media components
    const scene = await this.prisma.scenesLibrary.findUnique({
      where: { id: sceneId },
      include: {
        media_components: true
      }
    });

    if (!scene) {
      throw new NotFoundException(`Scene with ID ${sceneId} not found`);
    }

    // Calculate duration (use override or scene's estimated duration)
    const duration = durationOverride || scene.estimated_duration || 60;

    // Check for overlaps on the same layer
    const endTime = startTimeSeconds + duration;
    const overlappingScenes = await this.prisma.timelineScene.findMany({
      where: {
        film_id: filmId,
        layer_id: layerId,
      }
    });

    // Check for overlaps manually since we need to calculate end times
    const hasOverlap = overlappingScenes.some(existing => {
      const existingEnd = existing.start_time_seconds + existing.duration_seconds;

      // Check if new scene overlaps with existing scene
      return (
        // New scene starts before existing ends and ends after existing starts
        (startTimeSeconds < existingEnd && endTime > existing.start_time_seconds)
      );
    });

    if (hasOverlap) {
      throw new ConflictException(
        "Scene placement would overlap with existing scene on this layer",
      );
    }

    // Create the timeline scene entry
    const timelineScene = await this.prisma.timelineScene.create({
      data: {
        film_id: filmId,
        scene_id: sceneId,
        layer_id: layerId,
        start_time_seconds: startTimeSeconds,
        duration_seconds: duration,
        order_index: await this.getNextOrderIndex(filmId, layerId),
      },
      include: {
        scene: {
          include: {
            media_components: true
          }
        },
        layer: true,
        film: true,
      },
    });

    return {
      timeline_scene: timelineScene,
      placement_info: {
        start_time: startTimeSeconds,
        end_time: endTime,
        duration: duration,
        formatted_start: this.formatTimecode(startTimeSeconds),
        formatted_end: this.formatTimecode(endTime),
        formatted_duration: this.formatTimecode(duration),
      },
      media_components: scene.media_components.map(component => ({
        id: component.id,
        media_type: component.media_type,
        is_primary: component.is_primary,
        duration_seconds: component.duration_seconds,
        music_type: component.music_type,
        notes: component.notes,
        timeline_span: {
          start: startTimeSeconds,
          end: startTimeSeconds + Math.min(component.duration_seconds, duration),
          formatted_start: this.formatTimecode(startTimeSeconds),
          formatted_end: this.formatTimecode(startTimeSeconds + Math.min(component.duration_seconds, duration))
        }
      }))
    };
  }

  /**
   * Get timeline view with scenes and their media components
   */
  async getTimelineWithMediaComponents(filmId: number) {
    const timelineScenes = await this.prisma.timelineScene.findMany({
      where: { film_id: filmId },
      include: {
        scene: {
          include: {
            media_components: {
              orderBy: [
                { is_primary: 'desc' },
                { media_type: 'asc' }
              ]
            }
          }
        },
        layer: true,
      },
      orderBy: [
        { layer: { order_index: "asc" } },
        { start_time_seconds: "asc" },
      ],
    });

    // Group by layers for easier frontend rendering
    const layers = await this.prisma.timelineLayer.findMany({
      orderBy: { order_index: 'asc' }
    });

    const timelineData = layers.map(layer => ({
      layer: {
        id: layer.id,
        name: layer.name,
        order_index: layer.order_index,
        color_hex: layer.color_hex,
        is_active: layer.is_active
      },
      scenes: timelineScenes
        .filter(ts => ts.layer_id === layer.id)
        .map(ts => ({
          id: ts.id,
          start_time_seconds: ts.start_time_seconds,
          duration_seconds: ts.duration_seconds,
          end_time_seconds: ts.start_time_seconds + ts.duration_seconds,
          order_index: ts.order_index,
          notes: ts.notes,
          formatted_start: this.formatTimecode(ts.start_time_seconds),
          formatted_end: this.formatTimecode(ts.start_time_seconds + ts.duration_seconds),
          formatted_duration: this.formatTimecode(ts.duration_seconds),
          scene: {
            id: ts.scene.id,
            name: ts.scene.name,
            type: ts.scene.type,
            description: ts.scene.description,
            complexity_score: ts.scene.complexity_score,
            media_components: ts.scene.media_components.map(component => ({
              id: component.id,
              media_type: component.media_type,
              duration_seconds: component.duration_seconds,
              is_primary: component.is_primary,
              music_type: component.music_type,
              notes: component.notes,
              timeline_position: {
                start: ts.start_time_seconds,
                end: ts.start_time_seconds + Math.min(component.duration_seconds, ts.duration_seconds),
                relative_start: 0, // Always starts with the scene
                relative_end: Math.min(component.duration_seconds, ts.duration_seconds)
              }
            }))
          }
        }))
    }));

    return {
      film_id: filmId,
      total_scenes: timelineScenes.length,
      total_duration: Math.max(...timelineScenes.map(ts => ts.start_time_seconds + ts.duration_seconds), 0),
      layers: timelineData
    };
  }

  /**
   * Move a scene to a new position on the timeline
   */
  async moveSceneOnTimeline(
    timelineSceneId: number,
    newStartTime: number,
    newLayerId?: number
  ) {
    // Validate 5-second snapping
    if (newStartTime % 5 !== 0) {
      throw new ConflictException(
        "Start time must be aligned to 5-second intervals",
      );
    }

    const timelineScene = await this.getTimelineScene(timelineSceneId);
    const layerId = newLayerId || timelineScene.layer_id;

    // Check for conflicts at new position
    const endTime = newStartTime + timelineScene.duration_seconds;
    const conflictingScene = await this.prisma.timelineScene.findFirst({
      where: {
        film_id: timelineScene.film_id,
        layer_id: layerId,
        id: { not: timelineSceneId },
        OR: [
          {
            AND: [
              { start_time_seconds: { lt: endTime } },
              { start_time_seconds: { gte: newStartTime } }
            ]
          },
          {
            start_time_seconds: { lte: newStartTime },
            // Check if the existing scene extends past our start time
          }
        ]
      },
      include: {
        scene: true
      }
    });

    if (conflictingScene) {
      const conflictEnd = conflictingScene.start_time_seconds + conflictingScene.duration_seconds;
      if (conflictEnd > newStartTime) {
        throw new ConflictException(
          `Cannot move scene: would conflict with "${conflictingScene.scene.name}" at ${this.formatTimecode(conflictingScene.start_time_seconds)}`
        );
      }
    }

    // Update the timeline scene
    const updatedScene = await this.prisma.timelineScene.update({
      where: { id: timelineSceneId },
      data: {
        start_time_seconds: newStartTime,
        layer_id: layerId,
        order_index: newLayerId ? await this.getNextOrderIndex(timelineScene.film_id, layerId) : timelineScene.order_index
      },
      include: {
        scene: {
          include: {
            media_components: true
          }
        },
        layer: true,
        film: true,
      },
    });

    return {
      timeline_scene: updatedScene,
      new_position: {
        start_time: newStartTime,
        end_time: newStartTime + updatedScene.duration_seconds,
        formatted_start: this.formatTimecode(newStartTime),
        formatted_end: this.formatTimecode(newStartTime + updatedScene.duration_seconds),
      },
      media_components: updatedScene.scene.media_components.map(component => ({
        id: component.id,
        media_type: component.media_type,
        new_timeline_span: {
          start: newStartTime,
          end: newStartTime + Math.min(component.duration_seconds, updatedScene.duration_seconds)
        }
      }))
    };
  }

  /**
   * Get next order index for a layer
   */
  private async getNextOrderIndex(filmId: number, layerId: number): Promise<number> {
    const lastScene = await this.prisma.timelineScene.findFirst({
      where: { film_id: filmId, layer_id: layerId },
      orderBy: { order_index: 'desc' }
    });

    return (lastScene?.order_index || 0) + 1;
  }

  /**
   * Format seconds to MM:SS timecode
   */
  private formatTimecode(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
