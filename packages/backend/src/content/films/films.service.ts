import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFilmDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";
import { MusicType } from "@prisma/client";

@Injectable()
export class FilmsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a new film
   */
  async create(createDto: CreateFilmDto) {
    const film = await this.prisma.filmLibrary.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        brand_id: createDto.brand_id,
        type: createDto.type,
        default_music_type: createDto.default_music_type,
        delivery_timeline: createDto.delivery_timeline,
        includes_music: createDto.includes_music,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return this.findOne(film.id);
  }

  /**
   * Find all films, optionally filtered by brand
   */
  async findAll(brandId?: number) {
    return this.prisma.filmLibrary.findMany({
      where: brandId ? { brand_id: brandId } : {},
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find a specific film by ID
   */
  async findOne(id: number) {
    const film = await this.prisma.filmLibrary.findFirst({
      where: { id },
    });

    if (!film) {
      throw new NotFoundException(`Film with ID ${id} not found`);
    }

    return film;
  }

  /**
   * Update film
   */
  async update(id: number, updateData: UpdateFilmDto) {
    await this.prisma.filmLibrary.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    return this.findOne(id);
  }

  /**
   * Delete film
   */
  async delete(id: number) {
    await this.prisma.filmLibrary.delete({
      where: { id },
    });

    return { message: "Film deleted successfully" };
  }

  /**
   * Assign a scene to a film by creating a local copy
   * This ensures that edits to the film's scene don't affect the original scene library
   */
  async assignSceneToFilm(filmId: number, sceneId: number, orderIndex: number = 1, editingStyle?: string) {
    // Verify film exists
    await this.findOne(filmId);

    // Get the original scene with all its media components
    const originalScene = await this.prisma.scenesLibrary.findUnique({
      where: { id: sceneId },
      include: {
        media_components: true,
      },
    });

    if (!originalScene) {
      throw new NotFoundException(`Scene with ID ${sceneId} not found`);
    }

    // Check if this scene is already assigned to this film
    const existingAssignment = await this.prisma.filmLocalScenes.findFirst({
      where: {
        film_id: filmId,
        original_scene_id: sceneId,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(`Scene "${originalScene.name}" is already assigned to this film`);
    }

    // Create a local copy of the scene for this film
    const localScene = await this.prisma.filmLocalScenes.create({
      data: {
        film_id: filmId,
        original_scene_id: sceneId,
        name: originalScene.name,
        type: originalScene.type,
        description: originalScene.description,
        complexity_score: originalScene.complexity_score,
        estimated_duration: originalScene.estimated_duration,
        default_editing_style: originalScene.default_editing_style,
        base_task_hours: originalScene.base_task_hours,
        order_index: orderIndex,
        editing_style: editingStyle,
      },
    });

    // Create local copies of all media components
    await Promise.all(
      originalScene.media_components.map((component) =>
        this.prisma.filmLocalSceneMediaComponent.create({
          data: {
            film_local_scene_id: localScene.id,
            original_component_id: component.id,
            media_type: component.media_type,
            duration_seconds: component.duration_seconds,
            is_primary: component.is_primary,
            music_type: component.music_type as MusicType | null,
            notes: component.notes,
          },
        })
      )
    );

    // Return the complete local scene with its media components
    return this.prisma.filmLocalScenes.findUnique({
      where: { id: localScene.id },
      include: {
        media_components: true,
        original_scene: true,
      },
    });
  }

  /**
   * Get film with all its local scenes and media components
   */
  async getFilmWithLocalScenes(id: number) {
    const film = await this.prisma.filmLibrary.findUnique({
      where: { id },
      include: {
        local_scenes: {
          include: {
            media_components: {
              orderBy: [
                { is_primary: 'desc' },
                { media_type: 'asc' }
              ]
            },
            original_scene: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          },
          orderBy: {
            order_index: 'asc'
          }
        }
      }
    });

    if (!film) {
      throw new NotFoundException(`Film with ID ${id} not found`);
    }

    return film;
  }

  /**
   * Update a film's local scene (edits are isolated from the original scene)
   */
  async updateFilmLocalScene(filmId: number, localSceneId: number, updateData: {
    name?: string;
    description?: string;
    editing_style?: string;
    duration_override?: number;
    order_index?: number;
  }) {
    // Verify the local scene belongs to this film
    const localScene = await this.prisma.filmLocalScenes.findFirst({
      where: {
        id: localSceneId,
        film_id: filmId,
      },
    });

    if (!localScene) {
      throw new NotFoundException(`Local scene with ID ${localSceneId} not found for film ${filmId}`);
    }

    return this.prisma.filmLocalScenes.update({
      where: { id: localSceneId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      include: {
        media_components: true,
        original_scene: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });
  }

  /**
   * Update a film's local scene media component (edits are isolated from the original component)
   */
  async updateFilmLocalSceneMediaComponent(
    filmId: number,
    localSceneId: number,
    componentId: number,
    updateData: {
      duration_seconds?: number;
      is_primary?: boolean;
      music_type?: MusicType | null;
      notes?: string;
    }
  ) {
    // Verify the local scene belongs to this film
    const localScene = await this.prisma.filmLocalScenes.findFirst({
      where: {
        id: localSceneId,
        film_id: filmId,
      },
    });

    if (!localScene) {
      throw new NotFoundException(`Local scene with ID ${localSceneId} not found for film ${filmId}`);
    }

    // Verify the media component belongs to this local scene
    const component = await this.prisma.filmLocalSceneMediaComponent.findFirst({
      where: {
        id: componentId,
        film_local_scene_id: localSceneId,
      },
    });

    if (!component) {
      throw new NotFoundException(`Media component with ID ${componentId} not found for local scene ${localSceneId}`);
    }

    return this.prisma.filmLocalSceneMediaComponent.update({
      where: { id: componentId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Remove a scene from a film (deletes the local copy)
   */
  async removeSceneFromFilm(filmId: number, localSceneId: number) {
    // Verify the local scene belongs to this film
    const localScene = await this.prisma.filmLocalScenes.findFirst({
      where: {
        id: localSceneId,
        film_id: filmId,
      },
    });

    if (!localScene) {
      throw new NotFoundException(`Local scene with ID ${localSceneId} not found for film ${filmId}`);
    }

    // Delete the local scene (cascade will delete media components)
    await this.prisma.filmLocalScenes.delete({
      where: { id: localSceneId },
    });

    return { message: "Scene removed from film successfully" };
  }

  /**
   * Get available scenes from library that can be assigned to a film
   */
  async getAvailableScenesForFilm(filmId: number, brandId?: number) {
    // Get scenes that are either global or belong to the same brand
    const availableScenes = await this.prisma.scenesLibrary.findMany({
      where: {
        OR: [
          { brand_id: null }, // Global scenes
          { brand_id: brandId }, // Brand-specific scenes
        ],
      },
      include: {
        media_components: {
          orderBy: [
            { is_primary: 'desc' },
            { media_type: 'asc' }
          ]
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get already assigned scenes for this film
    const assignedSceneIds = await this.prisma.filmLocalScenes.findMany({
      where: { film_id: filmId },
      select: { original_scene_id: true },
    });

    const assignedIds = new Set(assignedSceneIds.map(s => s.original_scene_id));

    // Filter out already assigned scenes and add assignment status
    return availableScenes.map(scene => ({
      ...scene,
      is_assigned: assignedIds.has(scene.id),
    }));
  }
}
