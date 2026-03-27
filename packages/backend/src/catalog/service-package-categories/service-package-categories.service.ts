import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class ServicePackageCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(brandId: number, createCategoryDto: CreateCategoryDto) {
    return this.prisma.service_package_categories.create({
      data: {
        ...createCategoryDto,
        brand_id: brandId,
      },
    });
  }

  async findAll(brandId: number) {
    return this.prisma.service_package_categories.findMany({
      where: { brand_id: brandId },
      orderBy: { order_index: 'asc' },
    });
  }

  async update(id: number, brandId: number, updateCategoryDto: UpdateCategoryDto) {
    const existing = await this.prisma.service_package_categories.findFirst({
      where: { id, brand_id: brandId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Service package category not found');
    }

    return this.prisma.service_package_categories.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number, brandId: number) {
    const existing = await this.prisma.service_package_categories.findFirst({
      where: { id, brand_id: brandId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Service package category not found');
    }

    return this.prisma.service_package_categories.delete({
      where: { id },
    });
  }
}
