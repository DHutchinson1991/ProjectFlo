import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEditingStyleDto } from './dto/create-editing-style.dto';
import { UpdateEditingStyleDto } from './dto/update-editing-style.dto';
import { editing_styles } from '@prisma/client';

@Injectable()
export class EditingStylesService {
  constructor(private prisma: PrismaService) {}

  async create(createEditingStyleDto: CreateEditingStyleDto): Promise<editing_styles> {
    try {
      return await this.prisma.editing_styles.create({
        data: createEditingStyleDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Editing style with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<editing_styles[]> {
    return this.prisma.editing_styles.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number): Promise<editing_styles> {
    const editingStyle = await this.prisma.editing_styles.findUnique({
      where: { id },
    });

    if (!editingStyle) {
      throw new NotFoundException(`Editing style with ID ${id} not found`);
    }

    return editingStyle;
  }

  async update(id: number, updateEditingStyleDto: UpdateEditingStyleDto): Promise<editing_styles> {
    try {
      return await this.prisma.editing_styles.update({
        where: { id },
        data: updateEditingStyleDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Editing style with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Editing style with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.editing_styles.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Editing style with ID ${id} not found`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException('Cannot delete editing style as it is referenced by other records');
      }
      throw error;
    }
  }
}
