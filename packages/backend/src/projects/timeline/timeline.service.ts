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
  constructor(private prisma: PrismaService) {}

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
}
