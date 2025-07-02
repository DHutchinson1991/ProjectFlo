import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a new content
   */
  async create(createDto: CreateContentDto) {
    const content = await this.prisma.contentLibrary.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return this.findOne(content.id);
  }

  /**
   * Find all content
   */
  async findAll() {
    return this.prisma.contentLibrary.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Find a specific content by ID
   */
  async findOne(id: number) {
    const content = await this.prisma.contentLibrary.findFirst({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  /**
   * Update content
   */
  async update(id: number, updateData: UpdateContentDto) {
    await this.prisma.contentLibrary.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    return this.findOne(id);
  }

  /**
   * Delete content
   */
  async delete(id: number) {
    await this.prisma.contentLibrary.delete({
      where: { id },
    });

    return { message: 'Content deleted successfully' };
  }
}