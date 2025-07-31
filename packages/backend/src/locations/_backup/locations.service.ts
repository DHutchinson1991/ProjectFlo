import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
    CreateLocationDto,
    UpdateLocationDto,
    CreateLocationSpaceDto,
    UpdateLocationSpaceDto,
    CreateFloorPlanDto,
    UpdateFloorPlanDto,
    CreateFloorPlanObjectDto,
    UpdateFloorPlanObjectDto,
    UpdateVenueFloorPlanDto
} from './dto';

@Injectable()
export class LocationsService {
    constructor(private prisma: PrismaService) { }

    // ==================== LOCATIONS ====================

    async createLocation(createLocationDto: CreateLocationDto) {
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

    async findAllLocations(brandId?: number) {
        const where = brandId ? { brand_id: brandId } : {};

        return this.prisma.locationsLibrary.findMany({
            where: {
                ...where,
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
                _count: {
                    select: {
                        spaces: true,
                        scene_locations: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async findLocationById(id: number) {
        const location = await this.prisma.locationsLibrary.findUnique({
            where: { id },
            include: {
                spaces: {
                    where: { is_active: true },
                    include: {
                        floor_plans: {
                            where: { is_active: true },
                            orderBy: [
                                { is_default: 'desc' },
                                { version: 'desc' },
                            ],
                        },
                    },
                    orderBy: { name: 'asc' },
                },
                brand: true,
                scene_locations: {
                    include: {
                        scene: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return location;
    }

    async updateLocation(id: number, updateLocationDto: UpdateLocationDto) {
        const location = await this.prisma.locationsLibrary.findUnique({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return this.prisma.locationsLibrary.update({
            where: { id },
            data: updateLocationDto,
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

    async removeLocation(id: number) {
        const location = await this.prisma.locationsLibrary.findUnique({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return this.prisma.locationsLibrary.update({
            where: { id },
            data: { is_active: false },
        });
    }

    // ==================== VENUE FLOOR PLANS ====================

    async getVenueFloorPlan(id: number) {
        const location = await this.prisma.locationsLibrary.findUnique({
            where: { id },
            select: {
                id: true,
                venue_floor_plan_data: true,
                venue_floor_plan_version: true,
                venue_floor_plan_updated_at: true,
                venue_floor_plan_updated_by: true,
                venue_floor_plan_updater: {
                    select: {
                        id: true,
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        return {
            venue_floor_plan_data: location.venue_floor_plan_data,
            venue_floor_plan_version: location.venue_floor_plan_version,
            venue_floor_plan_updated_at: location.venue_floor_plan_updated_at,
            venue_floor_plan_updated_by: location.venue_floor_plan_updated_by,
            venue_floor_plan_updater: location.venue_floor_plan_updater,
        };
    }

    async updateVenueFloorPlan(id: number, updateVenueFloorPlanDto: UpdateVenueFloorPlanDto) {
        const location = await this.prisma.locationsLibrary.findUnique({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        // TODO: Get current user ID from authentication context
        // For now, we'll use null, but this should be replaced with actual user ID
        const currentUserId = null; // This should come from JWT/auth context

        const updatedLocation = await this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                venue_floor_plan_data: updateVenueFloorPlanDto.venue_floor_plan_data as Prisma.JsonObject,
                venue_floor_plan_version: updateVenueFloorPlanDto.venue_floor_plan_version || location.venue_floor_plan_version + 1,
                venue_floor_plan_updated_at: new Date(),
                venue_floor_plan_updated_by: currentUserId,
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
                venue_floor_plan_updater: {
                    select: {
                        id: true,
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return updatedLocation;
    }

    async resetVenueFloorPlan(id: number) {
        const location = await this.prisma.locationsLibrary.findUnique({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException(`Location with ID ${id} not found`);
        }

        const updatedLocation = await this.prisma.locationsLibrary.update({
            where: { id },
            data: {
                venue_floor_plan_data: Prisma.JsonNull,
                venue_floor_plan_version: 1,
                venue_floor_plan_updated_at: new Date(),
                venue_floor_plan_updated_by: null,
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
        });

        return updatedLocation;
    }

    // ==================== LOCATION SPACES ====================

    async createLocationSpace(createLocationSpaceDto: CreateLocationSpaceDto) {
        // Verify location exists
        const location = await this.prisma.locationsLibrary.findUnique({
            where: { id: createLocationSpaceDto.location_id },
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
                },
            },
        });
    }

    async findLocationSpaces(locationId: number) {
        return this.prisma.locationSpaces.findMany({
            where: {
                location_id: locationId,
                is_active: true,
            },
            include: {
                floor_plans: {
                    where: { is_active: true },
                    orderBy: [
                        { is_default: 'desc' },
                        { version: 'desc' },
                    ],
                },
                _count: {
                    select: {
                        floor_plans: true,
                        scene_locations: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findLocationSpaceById(id: number) {
        const space = await this.prisma.locationSpaces.findUnique({
            where: { id },
            include: {
                location: true,
                floor_plans: {
                    where: { is_active: true },
                    orderBy: [
                        { is_default: 'desc' },
                        { version: 'desc' },
                    ],
                },
                scene_locations: {
                    include: {
                        scene: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!space) {
            throw new NotFoundException(`Location space with ID ${id} not found`);
        }

        return space;
    }

    async updateLocationSpace(id: number, updateLocationSpaceDto: UpdateLocationSpaceDto) {
        const space = await this.prisma.locationSpaces.findUnique({
            where: { id },
        });

        if (!space) {
            throw new NotFoundException(`Location space with ID ${id} not found`);
        }

        return this.prisma.locationSpaces.update({
            where: { id },
            data: updateLocationSpaceDto,
            include: {
                location: true,
                floor_plans: {
                    where: { is_active: true },
                },
            },
        });
    }

    async removeLocationSpace(id: number) {
        const space = await this.prisma.locationSpaces.findUnique({
            where: { id },
        });

        if (!space) {
            throw new NotFoundException(`Location space with ID ${id} not found`);
        }

        return this.prisma.locationSpaces.update({
            where: { id },
            data: { is_active: false },
        });
    }

    // ==================== FLOOR PLANS ====================

    async createFloorPlan(createFloorPlanDto: CreateFloorPlanDto) {
        // Verify space exists
        const space = await this.prisma.locationSpaces.findUnique({
            where: { id: createFloorPlanDto.space_id },
        });

        if (!space) {
            throw new NotFoundException(`Location space with ID ${createFloorPlanDto.space_id} not found`);
        }

        // If project_id is provided, verify project exists
        if (createFloorPlanDto.project_id) {
            const project = await this.prisma.projects.findUnique({
                where: { id: createFloorPlanDto.project_id },
            });

            if (!project) {
                throw new NotFoundException(`Project with ID ${createFloorPlanDto.project_id} not found`);
            }
        }

        // Auto-increment version for this space/project combination
        const existingPlans = await this.prisma.floorPlans.findMany({
            where: {
                space_id: createFloorPlanDto.space_id,
                project_id: createFloorPlanDto.project_id || null,
            },
            orderBy: { version: 'desc' },
            take: 1,
        });

        const nextVersion = existingPlans.length > 0 ? existingPlans[0].version + 1 : 1;

        return this.prisma.floorPlans.create({
            data: {
                ...createFloorPlanDto,
                version: nextVersion,
            },
            include: {
                space: {
                    include: {
                        location: true,
                    },
                },
                project: true,
                created_by: true,
            },
        });
    }

    async findFloorPlans(spaceId: number, projectId?: number) {
        return this.prisma.floorPlans.findMany({
            where: {
                space_id: spaceId,
                project_id: projectId || null,
                is_active: true,
            },
            include: {
                space: {
                    include: {
                        location: true,
                    },
                },
                project: true,
                created_by: true,
            },
            orderBy: [
                { is_default: 'desc' },
                { version: 'desc' },
            ],
        });
    }

    async findFloorPlanById(id: number) {
        const floorPlan = await this.prisma.floorPlans.findUnique({
            where: { id },
            include: {
                space: {
                    include: {
                        location: true,
                    },
                },
                project: true,
                created_by: true,
            },
        });

        if (!floorPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        return floorPlan;
    }

    async updateFloorPlan(id: number, updateFloorPlanDto: UpdateFloorPlanDto) {
        const floorPlan = await this.prisma.floorPlans.findUnique({
            where: { id },
        });

        if (!floorPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        return this.prisma.floorPlans.update({
            where: { id },
            data: updateFloorPlanDto,
            include: {
                space: {
                    include: {
                        location: true,
                    },
                },
                project: true,
                created_by: true,
            },
        });
    }

    async removeFloorPlan(id: number) {
        const floorPlan = await this.prisma.floorPlans.findUnique({
            where: { id },
        });

        if (!floorPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        return this.prisma.floorPlans.update({
            where: { id },
            data: { is_active: false },
        });
    }

    async duplicateFloorPlan(id: number, projectId?: number) {
        const originalPlan = await this.prisma.floorPlans.findUnique({
            where: { id },
        });

        if (!originalPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        // Get next version for the target project
        const existingPlans = await this.prisma.floorPlans.findMany({
            where: {
                space_id: originalPlan.space_id,
                project_id: projectId || null,
            },
            orderBy: { version: 'desc' },
            take: 1,
        });

        const nextVersion = existingPlans.length > 0 ? existingPlans[0].version + 1 : 1;

        return this.prisma.floorPlans.create({
            data: {
                space_id: originalPlan.space_id,
                project_id: projectId || null,
                name: `${originalPlan.name} (Copy)`,
                version: nextVersion,
                fabric_data: originalPlan.fabric_data as Prisma.InputJsonValue,
                layers_data: originalPlan.layers_data as Prisma.InputJsonValue,
                is_default: false,
                is_active: true,
                created_by_id: originalPlan.created_by_id,
            },
            include: {
                space: {
                    include: {
                        location: true,
                    },
                },
                project: true,
                created_by: true,
            },
        });
    }

    // ==================== FLOOR PLAN OBJECTS ====================

    async createFloorPlanObject(createFloorPlanObjectDto: CreateFloorPlanObjectDto) {
        return this.prisma.floorPlanObjects.create({
            data: createFloorPlanObjectDto,
            include: {
                brand: true,
            },
        });
    }

    async findFloorPlanObjects(category?: string, brandId?: number) {
        const where: Record<string, unknown> = { is_active: true };

        if (category) {
            where.category = category;
        }

        if (brandId) {
            where.brand_id = brandId;
        }

        return this.prisma.floorPlanObjects.findMany({
            where,
            include: {
                brand: true,
            },
            orderBy: [
                { category: 'asc' },
                { object_type: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async findFloorPlanObjectById(id: number) {
        const object = await this.prisma.floorPlanObjects.findUnique({
            where: { id },
            include: {
                brand: true,
            },
        });

        if (!object) {
            throw new NotFoundException(`Floor plan object with ID ${id} not found`);
        }

        return object;
    }

    async updateFloorPlanObject(id: number, updateFloorPlanObjectDto: UpdateFloorPlanObjectDto) {
        const object = await this.prisma.floorPlanObjects.findUnique({
            where: { id },
        });

        if (!object) {
            throw new NotFoundException(`Floor plan object with ID ${id} not found`);
        }

        return this.prisma.floorPlanObjects.update({
            where: { id },
            data: updateFloorPlanObjectDto,
            include: {
                brand: true,
            },
        });
    }

    async removeFloorPlanObject(id: number) {
        const object = await this.prisma.floorPlanObjects.findUnique({
            where: { id },
        });

        if (!object) {
            throw new NotFoundException(`Floor plan object with ID ${id} not found`);
        }

        return this.prisma.floorPlanObjects.update({
            where: { id },
            data: { is_active: false },
        });
    }

    // ==================== UTILITY METHODS ====================

    async getLocationCategories() {
        const results = await this.prisma.locationSpaces.groupBy({
            by: ['space_type'],
            where: { is_active: true },
            _count: {
                space_type: true,
            },
            orderBy: {
                _count: {
                    space_type: 'desc',
                },
            },
        });

        return results.map(result => ({
            space_type: result.space_type,
            count: result._count.space_type,
        }));
    }

    async getObjectCategories() {
        const results = await this.prisma.floorPlanObjects.groupBy({
            by: ['category'],
            where: { is_active: true },
            _count: {
                category: true,
            },
            orderBy: {
                _count: {
                    category: 'desc',
                },
            },
        });

        return results.map(result => ({
            category: result.category,
            count: result._count.category,
        }));
    }
}
