import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MusicType, MediaType } from "@prisma/client";
import { CreateSceneDto } from "./dto/create-scene.dto";
import { UpdateSceneDto } from "./dto/update-scene.dto";

@Injectable()
export class ScenesService {
  constructor(private prisma: PrismaService) { }

  async create(createSceneDto: CreateSceneDto, brandId?: number | null) {
    const {
      name,
      type,
      description,
      complexity_score,
      estimated_duration,
      default_editing_style,
      base_task_hours,
      brand_id,
    } = createSceneDto;
    if (!name || typeof name !== "string") {
      throw new BadRequestException(
        "Scene 'name' is required and must be a string.",
      );
    }
    if (!type || !Object.values(MediaType).includes(type as MediaType)) {
      throw new BadRequestException(
        `Scene 'type' is required and must be one of: ${Object.values(MediaType).join(", ")}`,
      );
    }
    const data = {
      name,
      type: type as MediaType,
      brand_id: brandId !== undefined ? brandId : brand_id,
      ...(description && { description }),
      ...(complexity_score && { complexity_score }),
      ...(estimated_duration && { estimated_duration }),
      ...(default_editing_style && { default_editing_style }),
      ...(base_task_hours && { base_task_hours }),
    };
    return this.prisma.scenesLibrary.create({ data });
  }

  async findAll(brandId?: number | null) {
    const where = brandId !== null && brandId !== undefined
      ? { brand_id: brandId }
      : {}; // If brandId is null or undefined, return all scenes (for global admin)

    return this.prisma.scenesLibrary.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }

  async findOne(id: number) {
    const scene = await this.prisma.scenesLibrary.findUnique({
      where: { id },
    });

    if (!scene) {
      throw new NotFoundException(`Scene with ID ${id} not found`);
    }

    return scene;
  }

  async findOneWithRelations(id: number) {
    const scene = await this.prisma.scenesLibrary.findUnique({
      where: { id },
      include: {
        media_components: true,
      },
    });

    if (!scene) {
      throw new NotFoundException(`Scene with ID ${id} not found`);
    }

    return scene;
  }

  async findAllWithRelations(brandId?: number | null) {
    const where = brandId !== null && brandId !== undefined
      ? { brand_id: brandId }
      : {}; // If brandId is null or undefined, return all scenes (for global admin)

    return this.prisma.scenesLibrary.findMany({
      where,
      include: {
        media_components: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async update(id: number, updateSceneDto: UpdateSceneDto) {
    await this.findOne(id);

    return this.prisma.scenesLibrary.update({
      where: { id },
      data: updateSceneDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.scenesLibrary.delete({
      where: { id },
    });
  }

  async getSceneDependencies(id: number) {
    await this.findOne(id); // Validate scene exists

    const dependencies = await this.prisma.sceneDependency.findMany({
      where: {
        OR: [{ parent_scene_id: id }, { dependent_scene_id: id }],
      },
      include: {
        parent_scene: {
          select: {
            id: true,
            name: true,
            type: true,
            complexity_score: true,
          },
        },
        dependent_scene: {
          select: {
            id: true,
            name: true,
            type: true,
            complexity_score: true,
          },
        },
      },
    });

    return {
      depends_on: dependencies
        .filter((dep) => dep.dependent_scene_id === id)
        .map((dep) => dep.parent_scene),
      depended_by: dependencies
        .filter((dep) => dep.parent_scene_id === id)
        .map((dep) => dep.dependent_scene),
    };
  }

  // Music Component Methods - Using the unified SceneMediaComponent structure
  async getAvailableMusicOptions() {
    // Return available music types since music components are scene-specific
    return [
      { id: 1, name: "NONE", type: "NONE" },
      { id: 2, name: "SCENE_MATCHED", type: "SCENE_MATCHED" },
      { id: 3, name: "ORCHESTRAL", type: "ORCHESTRAL" },
      { id: 4, name: "PIANO", type: "PIANO" },
      { id: 5, name: "MODERN", type: "MODERN" },
      { id: 6, name: "VINTAGE", type: "VINTAGE" },
    ];
  }

  async addMusicOptions(
    sceneId: number,
    musicOptions: Array<{ music_type: MusicType; duration_seconds?: number }>,
  ) {
    await this.findOne(sceneId);

    // Remove existing music components
    await this.prisma.sceneMediaComponent.deleteMany({
      where: {
        scene_id: sceneId,
        media_type: 'MUSIC'
      },
    });

    // Add new music components
    const musicComponentData = musicOptions.map((option) => ({
      scene_id: sceneId,
      media_type: 'MUSIC' as const,
      music_type: option.music_type,
      duration_seconds: option.duration_seconds || 30, // Default 30 seconds
      is_primary: false, // Music is typically not primary
      notes: 'Added via music options API',
    }));

    await this.prisma.sceneMediaComponent.createMany({
      data: musicComponentData,
    });

    return this.findOneWithRelations(sceneId);
  }

  async removeMusicOption(sceneId: number, componentId: number) {
    await this.findOne(sceneId);

    await this.prisma.sceneMediaComponent.delete({
      where: {
        id: componentId,
        scene_id: sceneId,
        media_type: 'MUSIC',
      },
    });

    return this.findOneWithRelations(sceneId);
  }

  // Additional methods required by the controller
  async getSceneStats() {
    const totalScenes = await this.prisma.scenesLibrary.count();
    const videoCount = await this.prisma.scenesLibrary.count({
      where: { type: MediaType.VIDEO },
    });
    const audioCount = await this.prisma.scenesLibrary.count({
      where: { type: MediaType.AUDIO },
    });
    const musicCount = await this.prisma.scenesLibrary.count({
      where: { type: MediaType.MUSIC },
    });

    return {
      total: totalScenes,
      video: videoCount,
      byType: {
        [MediaType.VIDEO]: videoCount,
        [MediaType.AUDIO]: audioCount,
        [MediaType.MUSIC]: musicCount,
      },
    };
  }

  async findByType(type: string) {
    if (!type || !Object.values(MediaType).includes(type as MediaType)) {
      throw new BadRequestException(
        `Invalid scene type. Must be one of: ${Object.values(MediaType).join(", ")}`,
      );
    }
    return this.prisma.scenesLibrary.findMany({
      where: { type: type as MediaType },
      orderBy: { name: "asc" },
    });
  }

  async getProductionScenes() {
    // Use AUDIO as a fallback since GRAPHICS no longer exists in the enum
    return this.findByType(MediaType.AUDIO);
  }

  async bulkUpdateTaskHours(
    updates: Array<{ id: number; base_task_hours: number }>,
  ) {
    const updatePromises = updates.map((update) =>
      this.prisma.scenesLibrary.update({
        where: { id: update.id },
        data: { base_task_hours: update.base_task_hours },
      }),
    );

    await Promise.all(updatePromises);
    return { updated: updates.length };
  }

  async updateMusicComponent(componentId: number, updateData: { music_type?: string; duration_seconds?: number; notes?: string }) {
    return this.prisma.sceneMediaComponent.update({
      where: {
        id: componentId,
        media_type: 'MUSIC' // Ensure we're only updating music components
      },
      data: updateData,
    });
  }

  // New method to get music components for a scene
  async getMusicComponents(sceneId: number) {
    await this.findOne(sceneId); // Validate scene exists

    return this.prisma.sceneMediaComponent.findMany({
      where: {
        scene_id: sceneId,
        media_type: 'MUSIC'
      },
      orderBy: { music_type: 'asc' }
    });
  }

  // New method to add a single media component
  async addMediaComponent(
    sceneId: number,
    componentData: {
      media_type: 'VIDEO' | 'AUDIO' | 'MUSIC';
      duration_seconds: number;
      is_primary?: boolean;
      music_type?: string;
      notes?: string;
    }
  ) {
    await this.findOne(sceneId); // Validate scene exists

    return this.prisma.sceneMediaComponent.create({
      data: {
        scene_id: sceneId,
        ...componentData,
      },
    });
  }

  // Timeline Helper Methods

  /**
   * Get a scene with all its media components for timeline placement
   */
  async getSceneForTimeline(sceneId: number) {
    const scene = await this.prisma.scenesLibrary.findUnique({
      where: { id: sceneId },
      include: {
        media_components: {
          orderBy: [
            { is_primary: 'desc' },
            { media_type: 'asc' }
          ]
        }
      }
    });

    if (!scene) {
      throw new NotFoundException(`Scene with ID ${sceneId} not found`);
    }

    return {
      id: scene.id,
      name: scene.name,
      type: scene.type,
      description: scene.description,
      complexity_score: scene.complexity_score,
      estimated_duration: scene.estimated_duration,
      default_editing_style: scene.default_editing_style,
      base_task_hours: scene.base_task_hours,
      media_components: scene.media_components.map(component => ({
        id: component.id,
        media_type: component.media_type,
        duration_seconds: component.duration_seconds,
        is_primary: component.is_primary,
        music_type: component.music_type,
        notes: component.notes
      }))
    };
  }

  /**
   * Get scenes that are available for timeline placement (with their media components)
   */
  async getScenesForTimelineLibrary(brandId?: number | null) {
    const where = brandId !== null && brandId !== undefined
      ? { brand_id: brandId }
      : {};

    const scenes = await this.prisma.scenesLibrary.findMany({
      where,
      include: {
        media_components: {
          orderBy: [
            { is_primary: 'desc' },
            { media_type: 'asc' }
          ]
        }
      },
      orderBy: { name: "asc" }
    });

    return scenes.map(scene => ({
      id: scene.id,
      name: scene.name,
      type: scene.type,
      description: scene.description,
      complexity_score: scene.complexity_score,
      estimated_duration: scene.estimated_duration,
      default_editing_style: scene.default_editing_style,
      base_task_hours: scene.base_task_hours,
      component_count: scene.media_components.length,
      has_video: scene.media_components.some(c => c.media_type === 'VIDEO'),
      has_audio: scene.media_components.some(c => c.media_type === 'AUDIO'),
      has_music: scene.media_components.some(c => c.media_type === 'MUSIC'),
      media_components: scene.media_components.map(component => ({
        id: component.id,
        media_type: component.media_type,
        duration_seconds: component.duration_seconds,
        is_primary: component.is_primary,
        music_type: component.music_type,
        notes: component.notes
      }))
    }));
  }

  /**
   * Calculate total duration for a scene including all its media components
   */
  async getSceneTimelineDuration(sceneId: number): Promise<number> {
    const scene = await this.findOneWithRelations(sceneId);

    // Return the longest duration among all components, or the scene's estimated duration
    const componentDurations = scene.media_components.map(c => c.duration_seconds);
    const maxComponentDuration = Math.max(...componentDurations, 0);

    return Math.max(maxComponentDuration, scene.estimated_duration || 0);
  }

  /**
   * Preview what placing a scene on timeline will look like
   */
  async previewSceneOnTimeline(sceneId: number, startTimeSeconds: number) {
    const scene = await this.getSceneForTimeline(sceneId);
    const duration = await this.getSceneTimelineDuration(sceneId);

    return {
      scene_info: {
        id: scene.id,
        name: scene.name,
        type: scene.type,
        description: scene.description
      },
      timeline_placement: {
        start_time_seconds: startTimeSeconds,
        end_time_seconds: startTimeSeconds + duration,
        duration_seconds: duration,
        formatted_start_time: this.formatTimecode(startTimeSeconds),
        formatted_end_time: this.formatTimecode(startTimeSeconds + duration),
        formatted_duration: this.formatTimecode(duration)
      },
      media_components: scene.media_components.map(component => ({
        media_type: component.media_type,
        is_primary: component.is_primary,
        duration_seconds: component.duration_seconds,
        music_type: component.music_type,
        timeline_span: {
          start: startTimeSeconds,
          end: startTimeSeconds + component.duration_seconds,
          formatted_start: this.formatTimecode(startTimeSeconds),
          formatted_end: this.formatTimecode(startTimeSeconds + component.duration_seconds)
        }
      }))
    };
  }

  /**
   * Format seconds to MM:SS timecode
   */
  private formatTimecode(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Scene-Coverage Relationship Methods

  /**
   * Add coverage items to a scene
   */
  async addCoverageToScene(sceneId: number, coverageIds: number[]) {
    // Verify scene exists
    const scene = await this.findOne(sceneId);
    if (!scene) {
      throw new NotFoundException(`Scene with ID ${sceneId} not found`);
    }

    // Verify all coverage items exist
    const coverageItems = await this.prisma.coverage.findMany({
      where: { id: { in: coverageIds } }
    });

    if (coverageItems.length !== coverageIds.length) {
      const foundIds = coverageItems.map(c => c.id);
      const missingIds = coverageIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Coverage items not found: ${missingIds.join(', ')}`);
    }

    // Create scene-coverage relationships (ignore duplicates)
    const sceneCoverageData = coverageIds.map(coverageId => ({
      scene_id: sceneId,
      coverage_id: coverageId
    }));

    await this.prisma.sceneCoverage.createMany({
      data: sceneCoverageData,
      skipDuplicates: true
    });

    return {
      success: true,
      message: `Added ${coverageIds.length} coverage items to scene`,
      scene_id: sceneId,
      coverage_ids: coverageIds
    };
  }

  /**
   * Remove coverage from a scene
   */
  async removeCoverageFromScene(sceneId: number, coverageId: number) {
    const deleted = await this.prisma.sceneCoverage.deleteMany({
      where: {
        scene_id: sceneId,
        coverage_id: coverageId
      }
    });

    if (deleted.count === 0) {
      throw new NotFoundException(`Coverage ${coverageId} not found for scene ${sceneId}`);
    }

    return {
      success: true,
      message: `Removed coverage item from scene`,
      scene_id: sceneId,
      coverage_id: coverageId
    };
  }

  /**
   * Get all coverage items for a scene
   */
  async getSceneCoverage(sceneId: number) {
    // Verify scene exists
    const scene = await this.findOne(sceneId);
    if (!scene) {
      throw new NotFoundException(`Scene with ID ${sceneId} not found`);
    }

    const sceneCoverage = await this.prisma.sceneCoverage.findMany({
      where: { scene_id: sceneId },
      include: {
        coverage: {
          include: {
            workflow_template: true,
            task_generation_rules: true,
            // Include operator relationship to get contributor details
            operator: {
              include: {
                contact: true,
                role: true
              }
            }
          }
        }
      }
    });

    return {
      scene_id: sceneId,
      scene_name: scene.name,
      coverage_items: sceneCoverage.map(sc => sc.coverage)
    };
  }

  /**
   * Remove all coverage from a scene
   */
  async removeAllCoverageFromScene(sceneId: number) {
    const deleted = await this.prisma.sceneCoverage.deleteMany({
      where: { scene_id: sceneId }
    });

    return {
      success: true,
      message: `Removed ${deleted.count} coverage items from scene`,
      scene_id: sceneId,
      removed_count: deleted.count
    };
  }
}
