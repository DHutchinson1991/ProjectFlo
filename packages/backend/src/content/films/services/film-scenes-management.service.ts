import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

/**
 * Service for managing film scenes (refactor v2)
 * Uses FilmScene and SceneMoment models
 * Note: Scene creation from templates is handled in scenes module
 */
@Injectable()
export class FilmScenesManagementService {
  private readonly logger = new Logger(FilmScenesManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all scenes for a film with their moments
   */
  async getScenesForFilm(filmId: number) {
    return this.prisma.filmScene.findMany({
      where: { film_id: filmId },
      include: {
        moments: {
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /**
   * Get a specific scene with moments
   */
  async getScene(sceneId: number) {
    const scene = await this.prisma.filmScene.findUnique({
      where: { id: sceneId },
      include: {
        moments: {
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!scene) {
      throw new NotFoundException(`Scene with ID ${sceneId} not found`);
    }

    return scene;
  }

  /**
   * Update scene
   */
  async updateScene(sceneId: number, data: { name?: string; order_index?: number }) {
    return this.prisma.filmScene.update({
      where: { id: sceneId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Delete scene (cascades to moments)
   */
  async deleteScene(sceneId: number) {
    return this.prisma.filmScene.delete({
      where: { id: sceneId },
    });
  }
}
