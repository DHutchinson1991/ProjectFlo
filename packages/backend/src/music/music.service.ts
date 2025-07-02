import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MusicType } from '@prisma/client';

interface CreateContentMusicDto {
  content_id: number;
  music_type: MusicType;
  track_name?: string;
  artist?: string;
  duration?: number;
  order_index?: number;
}

interface UpdateContentMusicDto {
  music_type?: MusicType;
  track_name?: string;
  artist?: string;
  duration?: number;
  order_index?: number;
}

interface CreateComponentMusicOptionDto {
  component_id: number;
  music_type: MusicType;
  weight?: number;
}

@Injectable()
export class MusicService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a music track for content
   */
  async createContentMusic(createDto: CreateContentMusicDto) {
    const musicTrack = await this.prisma.contentMusicTrack.create({
      data: {
        ...createDto,
        order_index: createDto.order_index ?? 0
      }
    });

    return this.getContentMusic(musicTrack.id);
  }

  /**
   * Get content music track by ID
   */
  async getContentMusic(id: number) {
    const track = await this.prisma.contentMusicTrack.findUnique({
      where: { id },
      include: {
        content: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!track) {
      throw new NotFoundException(`Content music track with ID ${id} not found`);
    }

    return track;
  }

  /**
   * Get all music tracks for content
   */
  async getContentMusicTracks(contentId: number) {
    return this.prisma.contentMusicTrack.findMany({
      where: { content_id: contentId },
      orderBy: { order_index: 'asc' }
    });
  }

  /**
   * Update content music track
   */
  async updateContentMusic(id: number, updateDto: UpdateContentMusicDto) {
    // Check if track exists
    await this.getContentMusic(id);

    const track = await this.prisma.contentMusicTrack.update({
      where: { id },
      data: updateDto
    });

    return this.getContentMusic(track.id);
  }

  /**
   * Delete content music track
   */
  async removeContentMusic(id: number) {
    // Check if track exists
    await this.getContentMusic(id);

    await this.prisma.contentMusicTrack.delete({
      where: { id }
    });

    return { message: 'Content music track deleted successfully' };
  }

  /**
   * Create a music option for a component
   */
  async createComponentMusicOption(createDto: CreateComponentMusicOptionDto) {
    const option = await this.prisma.componentMusicOption.create({
      data: {
        ...createDto,
        weight: createDto.weight ?? 5
      }
    });

    return this.getComponentMusicOption(option.id);
  }

  /**
   * Get component music option by ID
   */
  async getComponentMusicOption(id: number) {
    const option = await this.prisma.componentMusicOption.findUnique({
      where: { id },
      include: {
        component: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!option) {
      throw new NotFoundException(`Component music option with ID ${id} not found`);
    }

    return option;
  }

  /**
   * Get music options for a component
   */
  async getComponentMusicOptions(componentId: number) {
    return this.prisma.componentMusicOption.findMany({
      where: { component_id: componentId },
      orderBy: { weight: 'desc' }
    });
  }

  /**
   * Update component music option
   */
  async updateComponentMusicOption(id: number, updateData: {
    music_type?: MusicType;
    weight?: number;
  }) {
    // Check if option exists
    await this.getComponentMusicOption(id);

    const option = await this.prisma.componentMusicOption.update({
      where: { id },
      data: updateData
    });

    return this.getComponentMusicOption(option.id);
  }

  /**
   * Delete component music option
   */
  async removeComponentMusicOption(id: number) {
    // Check if option exists
    await this.getComponentMusicOption(id);

    await this.prisma.componentMusicOption.delete({
      where: { id }
    });

    return { message: 'Component music option deleted successfully' };
  }

  /**
   * Get music statistics
   */
  async getMusicStats() {
    const contentMusicCount = await this.prisma.contentMusicTrack.count();
    const componentMusicOptionsCount = await this.prisma.componentMusicOption.count();

    const musicTypeDistribution = await this.prisma.contentMusicTrack.groupBy({
      by: ['music_type'],
      _count: { id: true }
    });

    const averageDuration = await this.prisma.contentMusicTrack.aggregate({
      _avg: { duration: true }
    });

    return {
      totalContentTracks: contentMusicCount,
      totalComponentMusicOptions: componentMusicOptionsCount,
      averageDurationSeconds: averageDuration._avg?.duration || 0,
      musicTypeDistribution: musicTypeDistribution.map(group => ({
        type: group.music_type,
        count: group._count?.id || 0
      }))
    };
  }

  /**
   * Get suggested music types for a component
   */
  async getSuggestedMusicForComponent(componentId: number) {
    return this.prisma.componentMusicOption.findMany({
      where: { component_id: componentId },
      orderBy: { weight: 'desc' },
      take: 5 // Top 5 suggestions
    });
  }

  /**
   * Get all available music types
   */
  async getAvailableMusicTypes(): Promise<MusicType[]> {
    // Return all enum values - in a real implementation, 
    // you might want to get this dynamically
    return ['NONE', 'SCENE_MATCHED', 'ORCHESTRAL', 'PIANO', 'MODERN', 'VINTAGE'];
  }

  /**
   * Bulk assign music to content
   */
  async bulkAssignMusicToContent(
    contentId: number,
    musicAssignments: {
      music_type: MusicType;
      track_name?: string;
      artist?: string;
      duration?: number;
      order_index?: number;
    }[]
  ) {
    const results = await Promise.all(
      musicAssignments.map((assignment, index) =>
        this.prisma.contentMusicTrack.create({
          data: {
            content_id: contentId,
            ...assignment,
            order_index: assignment.order_index ?? index
          }
        })
      )
    );

    return {
      message: `Created ${results.length} music track assignments`,
      tracks: results
    };
  }
}
