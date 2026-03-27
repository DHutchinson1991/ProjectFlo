import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateLocationDto, UpdateLocationDto, UpdateVenueFloorPlanDto } from '../../dto';

/**
 * Service for managing venues/locations and their venue-specific floor plan data
 */
@Injectable()
export class VenuesService {
    constructor(private prisma: PrismaService) { }

    // ==================== VENUE/LOCATION MANAGEMENT ====================

    async createVenue(createLocationDto: CreateLocationDto) {
        return this.prisma.locationsLibrary.create({
            data: createLocationDto,
            include: {
                spaces: {
                    include: {
                        floor_plans: true,
                    },
                },
                brand: true,
            },
        });
    }

    async findAllVenues(brandId: number) {
        return this.prisma.locationsLibrary.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
            },
            include: {
                spaces: {
                    where: { is_active: true },
                    include: {
                        floor_plans: {
                            where: { is_active: true },
                        },
                    },
                },
                brand: true,
            },
            orderBy: [
                { name: 'asc' },
            ],
        });
    }

    async findVenueById(id: number) {
        const venue = await this.prisma.locationsLibrary.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                spaces: {
                    where: { is_active: true },
                    include: {
                        floor_plans: {
                            where: { is_active: true },
                            orderBy: [
                                { is_default: 'desc' },
                                { version: 'desc' },
                                { created_at: 'desc' },
                            ],
                        },
                    },
                    orderBy: [
                        { name: 'asc' },
                    ],
                },
                brand: true,
            },
        });

        if (!venue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        return venue;
    }

    async updateVenue(id: number, updateLocationDto: UpdateLocationDto) {
        const existingVenue = await this.prisma.locationsLibrary.findFirst({
            where: { id, is_active: true },
        });

        if (!existingVenue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        return this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                ...updateLocationDto,
                updated_at: new Date(),
            },
            include: {
                spaces: {
                    include: {
                        floor_plans: true,
                    },
                },
                brand: true,
            },
        });
    }

    async removeVenue(id: number) {
        const existingVenue = await this.prisma.locationsLibrary.findFirst({
            where: { id, is_active: true },
        });

        if (!existingVenue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        // Soft delete
        return this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        });
    }

    // ==================== VENUE FLOOR PLAN DATA ====================

    async getVenueFloorPlan(id: number) {
        const venue = await this.prisma.locationsLibrary.findFirst({
            where: {
                id,
                is_active: true,
            },
            select: {
                id: true,
                name: true,
                venue_floor_plan_data: true,
                venue_floor_plan_version: true,
            },
        });

        if (!venue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        return {
            id: venue.id,
            name: venue.name,
            venue_floor_plan_data: venue.venue_floor_plan_data,
            venue_floor_plan_version: venue.venue_floor_plan_version,
        };
    }

    async updateVenueFloorPlan(id: number, updateVenueFloorPlanDto: UpdateVenueFloorPlanDto) {
        const existingVenue = await this.prisma.locationsLibrary.findFirst({
            where: { id, is_active: true },
        });

        if (!existingVenue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        const currentVersion = typeof existingVenue.venue_floor_plan_version === 'number'
            ? existingVenue.venue_floor_plan_version
            : 0;

        const newVersion = updateVenueFloorPlanDto.venue_floor_plan_version || (currentVersion + 1);

        return this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                venue_floor_plan_data: updateVenueFloorPlanDto.venue_floor_plan_data as object,
                venue_floor_plan_version: newVersion,
                updated_at: new Date(),
            },
            select: {
                id: true,
                name: true,
                venue_floor_plan_data: true,
                venue_floor_plan_version: true,
                updated_at: true,
            },
        });
    }

    async resetVenueFloorPlan(id: number) {
        const existingVenue = await this.prisma.locationsLibrary.findFirst({
            where: { id, is_active: true },
        });

        if (!existingVenue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        return this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                venue_floor_plan_data: Prisma.DbNull,
                venue_floor_plan_version: undefined,
                updated_at: new Date(),
            },
            select: {
                id: true,
                name: true,
                venue_floor_plan_data: true,
                venue_floor_plan_version: true,
                updated_at: true,
            },
        });
    }
}
