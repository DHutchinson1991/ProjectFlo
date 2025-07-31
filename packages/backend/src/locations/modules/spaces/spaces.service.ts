import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLocationSpaceDto, UpdateLocationSpaceDto } from '../../dto';

/**
 * Service for managing location spaces within venues
 */
@Injectable()
export class SpacesService {
    constructor(private prisma: PrismaService) { }

    // ==================== LOCATION SPACES ====================

    async createLocationSpace(createLocationSpaceDto: CreateLocationSpaceDto) {
        // Verify the location exists
        const location = await this.prisma.locationsLibrary.findFirst({
            where: {
                id: createLocationSpaceDto.location_id,
                is_active: true,
            },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${createLocationSpaceDto.location_id} not found`);
        }

        return this.prisma.locationSpaces.create({
            data: createLocationSpaceDto,
            include: {
                location: true,
                floor_plans: {
                    where: { is_active: true },
                    orderBy: [
                        { is_default: 'desc' },
                        { version: 'desc' },
                    ],
                },
            },
        });
    }

    async findLocationSpaces(locationId: number) {
        // Verify the location exists
        const location = await this.prisma.locationsLibrary.findFirst({
            where: {
                id: locationId,
                is_active: true,
            },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${locationId} not found`);
        }

        return this.prisma.locationSpaces.findMany({
            where: {
                location_id: locationId,
                is_active: true,
            },
            include: {
                location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                floor_plans: {
                    where: { is_active: true },
                    orderBy: [
                        { is_default: 'desc' },
                        { version: 'desc' },
                    ],
                },
            },
            orderBy: [
                { name: 'asc' },
            ],
        });
    }

    async findLocationSpaceById(id: number) {
        const space = await this.prisma.locationSpaces.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                location: {
                    select: {
                        id: true,
                        name: true,
                        brand_id: true,
                    },
                },
                floor_plans: {
                    where: { is_active: true },
                    orderBy: [
                        { is_default: 'desc' },
                        { version: 'desc' },
                        { created_at: 'desc' },
                    ],
                },
            },
        });

        if (!space) {
            throw new NotFoundException(`Location space with ID ${id} not found`);
        }

        return space;
    }

    async updateLocationSpace(id: number, updateLocationSpaceDto: UpdateLocationSpaceDto) {
        const existingSpace = await this.prisma.locationSpaces.findFirst({
            where: { id, is_active: true },
        });

        if (!existingSpace) {
            throw new NotFoundException(`Location space with ID ${id} not found`);
        }

        return this.prisma.locationSpaces.update({
            where: { id },
            data: {
                ...updateLocationSpaceDto,
                updated_at: new Date(),
            },
            include: {
                location: true,
                floor_plans: {
                    where: { is_active: true },
                },
            },
        });
    }

    async removeLocationSpace(id: number) {
        const existingSpace = await this.prisma.locationSpaces.findFirst({
            where: { id, is_active: true },
        });

        if (!existingSpace) {
            throw new NotFoundException(`Location space with ID ${id} not found`);
        }

        // Soft delete - also deactivate related floor plans
        await this.prisma.floorPlans.updateMany({
            where: { space_id: id },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        });

        return this.prisma.locationSpaces.update({
            where: { id },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        });
    }

    // ==================== UTILITY METHODS ====================

    async getLocationCategories() {
        const spaces = await this.prisma.locationSpaces.findMany({
            where: { is_active: true },
            select: { space_type: true },
            distinct: ['space_type'],
            orderBy: { space_type: 'asc' },
        });

        return spaces.map(space => space.space_type).filter(Boolean);
    }
}
