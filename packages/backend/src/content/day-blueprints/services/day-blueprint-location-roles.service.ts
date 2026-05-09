import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateDayBlueprintLocationRoleDto, UpdateDayBlueprintLocationRoleDto } from '../dto';

/**
 * Brand-scoped CRUD for the abstract location-role vocabulary used by
 * Day Blueprints. Not venue rows — these are roles like
 * `ceremony_room`, `altar_area`, `aisle`, reused across blueprints.
 */
@Injectable()
export class DayBlueprintLocationRolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(brandId: number) {
    return this.prisma.dayBlueprintLocationRole.findMany({
      where: { brand_id: brandId },
      orderBy: [{ order_index: 'asc' }, { display_name: 'asc' }],
    });
  }

  async create(brandId: number, dto: CreateDayBlueprintLocationRoleDto) {
    const key = dto.key?.trim();
    if (!key) throw new BadRequestException('Location role key is required');
    return this.prisma.dayBlueprintLocationRole.create({
      data: {
        brand_id: brandId,
        key,
        display_name: dto.display_name.trim(),
        description: dto.description,
        icon: dto.icon,
        order_index: dto.order_index ?? 0,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async update(brandId: number, id: number, dto: UpdateDayBlueprintLocationRoleDto) {
    const existing = await this.prisma.dayBlueprintLocationRole.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException('Location role not found');
    return this.prisma.dayBlueprintLocationRole.update({
      where: { id },
      data: {
        display_name: dto.display_name?.trim(),
        description: dto.description,
        icon: dto.icon,
        order_index: dto.order_index,
        is_active: dto.is_active,
      },
    });
  }

  async remove(brandId: number, id: number) {
    const existing = await this.prisma.dayBlueprintLocationRole.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException('Location role not found');
    return this.prisma.dayBlueprintLocationRole.delete({ where: { id } });
  }
}
