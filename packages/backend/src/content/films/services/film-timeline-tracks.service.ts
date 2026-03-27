import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

/**
 * Service for managing film timeline tracks
 * Works with refactor v2 FilmTimelineTrack model
 */
@Injectable()
export class FilmTimelineTracksService {
  private readonly logger = new Logger(FilmTimelineTracksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all tracks for a film, including crew assignment
   */
  async getTracks(filmId: number, activeOnly = false) {
    return this.prisma.filmTimelineTrack.findMany({
      where: { film_id: filmId, ...(activeOnly ? { is_active: true } : {}) },
      orderBy: { order_index: 'asc' },
      include: {
        crew_member: {
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
        crew_member: {
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
    filmId: number,
    trackId: number,
    data: { name?: string; is_active?: boolean; crew_member_id?: number | null; is_unmanned?: boolean },
  ) {
    const track = await this.prisma.filmTimelineTrack.findFirst({
      where: { id: trackId, film_id: filmId },
    });
    if (!track) {
      throw new NotFoundException(`Track ${trackId} not found for film ${filmId}`);
    }

    return this.prisma.filmTimelineTrack.update({
      where: { id: trackId },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        crew_member: {
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
    return this.updateTrack(track.film_id, trackId, { is_active: !track.is_active });
  }
}
