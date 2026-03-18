import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFloorPlanObjectDto, UpdateFloorPlanObjectDto } from '../../dto';

/**
 * Service for managing floor plan objects (furniture, equipment, etc.)
 */
@Injectable()
export class PlanObjectsService {
    constructor(private prisma: PrismaService) { }

    // ==================== FLOOR PLAN OBJECTS ====================

    async createFloorPlanObject(createFloorPlanObjectDto: CreateFloorPlanObjectDto) {
        // If brand_id is provided, verify it exists
        if (createFloorPlanObjectDto.brand_id) {
            const brand = await this.prisma.brands.findFirst({
                where: {
                    id: createFloorPlanObjectDto.brand_id,
                    is_active: true,
                },
            });

            if (!brand) {
                throw new NotFoundException(`Brand with ID ${createFloorPlanObjectDto.brand_id} not found`);
            }
        }

        return this.prisma.floorPlanObjects.create({
            data: createFloorPlanObjectDto,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findFloorPlanObjects(category?: string, brandId?: number) {
        const where = {
            is_active: true,
            ...(category && { category }),
            ...(brandId && { brand_id: brandId }),
        };

        return this.prisma.floorPlanObjects.findMany({
            where,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { category: 'asc' },
                { object_type: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async findFloorPlanObjectById(id: number) {
        const floorPlanObject = await this.prisma.floorPlanObjects.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!floorPlanObject) {
            throw new NotFoundException(`Floor plan object with ID ${id} not found`);
        }

        return floorPlanObject;
    }

    async updateFloorPlanObject(id: number, updateFloorPlanObjectDto: UpdateFloorPlanObjectDto) {
        const existingObject = await this.prisma.floorPlanObjects.findFirst({
            where: { id, is_active: true },
        });

        if (!existingObject) {
            throw new NotFoundException(`Floor plan object with ID ${id} not found`);
        }

        // If brand_id is provided, verify it exists
        if (updateFloorPlanObjectDto.brand_id) {
            const brand = await this.prisma.brands.findFirst({
                where: {
                    id: updateFloorPlanObjectDto.brand_id,
                    is_active: true,
                },
            });

            if (!brand) {
                throw new NotFoundException(`Brand with ID ${updateFloorPlanObjectDto.brand_id} not found`);
            }
        }

        return this.prisma.floorPlanObjects.update({
            where: { id },
            data: {
                ...updateFloorPlanObjectDto,
                updated_at: new Date(),
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async removeFloorPlanObject(id: number) {
        const existingObject = await this.prisma.floorPlanObjects.findFirst({
            where: { id, is_active: true },
        });

        if (!existingObject) {
            throw new NotFoundException(`Floor plan object with ID ${id} not found`);
        }

        // Soft delete
        return this.prisma.floorPlanObjects.update({
            where: { id },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        });
    }

    // ==================== UTILITY METHODS ====================

    async getObjectCategories() {
        const objects = await this.prisma.floorPlanObjects.findMany({
            where: { is_active: true },
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });

        return objects.map(obj => obj.category).filter(Boolean);
    }
}
