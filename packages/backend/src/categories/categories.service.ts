import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface DeliverableCategory {
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
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<DeliverableCategory[]> {
    return this.prisma.deliverable_categories.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<DeliverableCategory | null> {
    return this.prisma.deliverable_categories.findUnique({
      where: { id },
    });
  }

  async create(data: CreateCategoryDto): Promise<DeliverableCategory> {
    // Ensure code is uppercase and formatted properly
    const formattedCode = data.code.toUpperCase().replace(/\s+/g, '_');
    
    return this.prisma.deliverable_categories.create({
      data: {
        ...data,
        code: formattedCode,
      },
    });
  }

  async update(id: number, data: UpdateCategoryDto): Promise<DeliverableCategory> {
    const updateData = { ...data };
    
    // Format code if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().replace(/\s+/g, '_');
    }

    return this.prisma.deliverable_categories.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number): Promise<void> {
    // Soft delete by setting is_active to false
    await this.prisma.deliverable_categories.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async hardDelete(id: number): Promise<void> {
    // Hard delete - only use if no deliverables reference this category
    await this.prisma.deliverable_categories.delete({
      where: { id },
    });
  }

  async initializeDefaults(): Promise<void> {
    // Initialize default categories if they don't exist
    const defaults = [
      { name: 'Standard', code: 'STANDARD', description: 'Standard deliverable templates' },
      { name: 'Raw Footage', code: 'RAW_FOOTAGE', description: 'Raw footage deliverables' },
    ];

    for (const category of defaults) {
      await this.prisma.deliverable_categories.upsert({
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
