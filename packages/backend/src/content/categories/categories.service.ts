import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CategoryEntity {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) { }

  async findAll(): Promise<CategoryEntity[]> {
    return this.prisma.content_categories.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<CategoryEntity | null> {
    return this.prisma.content_categories.findUnique({
      where: { id },
    });
  }

  async create(data: CreateCategoryDto): Promise<CategoryEntity> {
    // Ensure code is uppercase and formatted properly
    const formattedCode = data.code.toUpperCase().replace(/\s+/g, '_');

    return this.prisma.content_categories.create({
      data: {
        ...data,
        code: formattedCode,
      },
    });
  }

  async update(id: number, data: UpdateCategoryDto): Promise<CategoryEntity> {
    const updateData = { ...data };

    // Format code if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().replace(/\s+/g, '_');
    }

    return this.prisma.content_categories.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number): Promise<void> {
    // Soft delete by setting is_active to false
    await this.prisma.content_categories.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async hardDelete(id: number): Promise<void> {
    // Hard delete - only use if no content reference this category
    await this.prisma.content_categories.delete({
      where: { id },
    });
  }

  async initializeDefaults(): Promise<void> {
    // Initialize default categories if they don't exist
    const defaults = [
      { name: 'Standard', code: 'STANDARD', description: 'Standard content templates' },
      { name: 'Raw Footage', code: 'RAW_FOOTAGE', description: 'Raw footage content' },
    ];

    for (const category of defaults) {
      await this.prisma.content_categories.upsert({
        where: { code: category.code },
        update: {}, // Don't update if exists
        create: category,
      });
    }
  }

  async getCategoryCodes(): Promise<string[]> {
    const categories = await this.findAll();
    return categories.map(category => category.code);
  }
}
