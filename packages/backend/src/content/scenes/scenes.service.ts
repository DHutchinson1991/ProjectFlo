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
  constructor(private prisma: PrismaService) {}

  async create(createSceneDto: CreateSceneDto) {
    const {
      name,
      type,
      description,
      complexity_score,
      estimated_duration,
      default_editing_style,
      base_task_hours,
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
      ...(description && { description }),
      ...(complexity_score && { complexity_score }),
      ...(estimated_duration && { estimated_duration }),
      ...(default_editing_style && { default_editing_style }),
      ...(base_task_hours && { base_task_hours }),
    };
    return this.prisma.scenesLibrary.create({ data });
  }

  async findAll() {
    return this.prisma.scenesLibrary.findMany({
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
        music_options: true,
      },
    });

    if (!scene) {
      throw new NotFoundException(`Scene with ID ${id} not found`);
    }

    return scene;
  }

  async findAllWithRelations() {
    return this.prisma.scenesLibrary.findMany({
      include: {
        music_options: true,
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

  // Music Option Methods - Using the existing SceneMusicOption structure
  async getAvailableMusicOptions() {
    // Return available music types since music_options are scene-specific
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
    musicOptions: Array<{ music_type: MusicType; weight?: number }>,
  ) {
    await this.findOne(sceneId);

    // Remove existing music options
    await this.prisma.sceneMusicOption.deleteMany({
      where: { scene_id: sceneId },
    });

    // Add new music options
    const musicOptionData = musicOptions.map((option) => ({
      scene_id: sceneId,
      music_type: option.music_type,
      weight: option.weight || 5,
    }));

    await this.prisma.sceneMusicOption.createMany({
      data: musicOptionData,
    });

    return this.findOneWithRelations(sceneId);
  }

  async removeMusicOption(sceneId: number, optionId: number) {
    await this.findOne(sceneId);

    await this.prisma.sceneMusicOption.delete({
      where: {
        id: optionId,
        scene_id: sceneId,
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

  async updateMusicOptionWeight(optionId: number, weight: number) {
    return this.prisma.sceneMusicOption.update({
      where: { id: optionId },
      data: { weight },
    });
  }
}
