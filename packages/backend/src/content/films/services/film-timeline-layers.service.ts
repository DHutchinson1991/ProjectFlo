import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

/**
 * Manages global film timeline layers (shared across all films).
 * Extracted from FilmsService to respect the 250-line service limit.
 */
@Injectable()
export class FilmTimelineLayersService {
  private readonly logger = new Logger(FilmTimelineLayersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    this.logger.log('Fetching timeline layers');
    return this.prisma.timelineLayer.findMany({
      where: { is_active: true },
      orderBy: { order_index: 'asc' },
    });
  }

  async create(createDto: {
    name: string;
    order_index: number;
    color_hex: string;
    description?: string;
  }) {
    this.logger.log('Creating timeline layer', { name: createDto.name });
    return this.prisma.timelineLayer.create({
      data: {
        name: createDto.name,
        order_index: createDto.order_index,
        color_hex: createDto.color_hex,
        description: createDto.description,
        is_active: true,
      },
    });
  }

  async update(
    id: number,
    updateDto: {
      name?: string;
      order_index?: number;
      color_hex?: string;
      description?: string;
      is_active?: boolean;
    },
  ) {
    this.logger.log('Updating timeline layer', { layerId: id });
    const layer = await this.prisma.timelineLayer.findUnique({ where: { id } });
    if (!layer) {
      throw new NotFoundException(`Timeline layer with ID ${id} not found`);
    }
    return this.prisma.timelineLayer.update({ where: { id }, data: updateDto });
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.log('Deleting timeline layer', { layerId: id });
    const layer = await this.prisma.timelineLayer.findUnique({ where: { id } });
    if (!layer) {
      throw new NotFoundException(`Timeline layer with ID ${id} not found`);
    }
    await this.prisma.timelineLayer.delete({ where: { id } });
    this.logger.log('Timeline layer deleted successfully', { layerId: id });
    return { message: 'Timeline layer deleted successfully' };
  }
}
