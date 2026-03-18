import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoggerService } from '../../../common/logging/logger.service';

/**
 * Service for managing film timeline tracks
 * Works with refactor v2 FilmTimelineTrack model
 */
@Injectable()
export class FilmTimelineTracksService {
  private readonly logger = new LoggerService(FilmTimelineTracksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all tracks for a film, including crew assignment
   */
  async getTracks(filmId: number) {
    return this.prisma.filmTimelineTrack.findMany({
      where: { film_id: filmId },
      orderBy: { order_index: 'asc' },
      include: {
        contributor: {
          select: {
            id: true,
            crew_color: true,
            contact: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
  }

  /**
   * Get a specific track by ID, including crew assignment
   */
  async getTrack(trackId: number) {
    const track = await this.prisma.filmTimelineTrack.findUnique({
      where: { id: trackId },
      include: {
        contributor: {
          select: {
            id: true,
            crew_color: true,
            contact: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException(`Track with ID ${trackId} not found`);
    }

    return track;
  }

  /**
   * Update track (name, active status, crew assignment, etc.)
   */
  async updateTrack(
    trackId: number,
    data: { name?: string; is_active?: boolean; contributor_id?: number | null },
  ) {
    return this.prisma.filmTimelineTrack.update({
      where: { id: trackId },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        contributor: {
          select: {
            id: true,
            crew_color: true,
            contact: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
  }

  /**
   * Toggle track active status
   */
  async toggleTrackActive(trackId: number) {
    const track = await this.getTrack(trackId);
    return this.updateTrack(trackId, { is_active: !track.is_active });
  }
}
