import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MusicType } from '@prisma/client';

interface CreateDeliverableMusicDto {
  deliverable_id: number;
  music_type: MusicType;
  track_name?: string;
  artist?: string;
  duration?: number;
  order_index?: number;
}

interface UpdateDeliverableMusicDto {
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
  constructor(private prisma: PrismaService) {}

  /**
   * Create a music track for a deliverable
   */
  async createDeliverableMusic(createDto: CreateDeliverableMusicDto) {
    const musicTrack = await this.prisma.deliverableMusicTrack.create({
      data: {
        ...createDto,
        order_index: createDto.order_index ?? 0
      }
    });

    return this.getDeliverableMusic(musicTrack.id);
  }

  /**
   * Get deliverable music track by ID
   */
  async getDeliverableMusic(id: number) {
    const track = await this.prisma.deliverableMusicTrack.findUnique({
      where: { id },
      include: {
        deliverable: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!track) {
      throw new NotFoundException(`Deliverable music track with ID ${id} not found`);
    }

    return track;
  }

  /**
   * Get all music tracks for a deliverable
   */
  async getDeliverableMusicTracks(deliverableId: number) {
    return this.prisma.deliverableMusicTrack.findMany({
      where: { deliverable_id: deliverableId },
      orderBy: { order_index: 'asc' }
    });
  }

  /**
   * Update deliverable music track
   */
  async updateDeliverableMusic(id: number, updateDto: UpdateDeliverableMusicDto) {
    // Check if track exists
    await this.getDeliverableMusic(id);

    const track = await this.prisma.deliverableMusicTrack.update({
      where: { id },
      data: updateDto
    });

    return this.getDeliverableMusic(track.id);
  }

  /**
   * Delete deliverable music track
   */
  async removeDeliverableMusic(id: number) {
    // Check if track exists
    await this.getDeliverableMusic(id);

    await this.prisma.deliverableMusicTrack.delete({
      where: { id }
    });

    return { message: 'Deliverable music track deleted successfully' };
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
    const deliverableMusicCount = await this.prisma.deliverableMusicTrack.count();
    const componentMusicOptionsCount = await this.prisma.componentMusicOption.count();

    const musicTypeDistribution = await this.prisma.deliverableMusicTrack.groupBy({
      by: ['music_type'],
      _count: { id: true }
    });

    const averageDuration = await this.prisma.deliverableMusicTrack.aggregate({
      _avg: { duration: true }
    });

    return {
      totalDeliverableTracks: deliverableMusicCount,
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
   * Bulk assign music to deliverable
   */
  async bulkAssignMusicToDeliverable(
    deliverableId: number, 
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
        this.prisma.deliverableMusicTrack.create({
          data: {
            deliverable_id: deliverableId,
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
