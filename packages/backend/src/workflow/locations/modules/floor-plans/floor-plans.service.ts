import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateFloorPlanDto, UpdateFloorPlanDto } from '../../dto';

/**
 * Service for managing floor plans within location spaces
 */
@Injectable()
export class FloorPlansService {
    constructor(private prisma: PrismaService) { }

    // ==================== FLOOR PLANS ====================

    async createFloorPlan(createFloorPlanDto: CreateFloorPlanDto) {
        // Verify the space exists
        const space = await this.prisma.locationSpaces.findFirst({
            where: {
                id: createFloorPlanDto.space_id,
                is_active: true,
            },
        });

        if (!space) {
            throw new NotFoundException(`Location space with ID ${createFloorPlanDto.space_id} not found`);
        }

        // If project_id is provided, verify it exists
        if (createFloorPlanDto.project_id) {
            await this.verifyProjectExists(createFloorPlanDto.project_id);
        }

        return this.prisma.floorPlans.create({
            data: createFloorPlanDto,
            include: {
                space: {
                    include: {
                        location: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });
    }

    async findFloorPlans(spaceId: number, projectId?: number) {
        // Verify the space exists
        const space = await this.prisma.locationSpaces.findFirst({
            where: {
                id: spaceId,
                is_active: true,
            },
        });

        if (!space) {
            throw new NotFoundException(`Location space with ID ${spaceId} not found`);
        }

        const where = {
            space_id: spaceId,
            is_active: true,
            ...(projectId !== undefined && { project_id: projectId }),
        };

        return this.prisma.floorPlans.findMany({
            where,
            include: {
                space: {
                    include: {
                        location: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
            orderBy: [
                { is_default: 'desc' },
                { version: 'desc' },
                { created_at: 'desc' },
            ],
        });
    }

    async findFloorPlanById(id: number) {
        const floorPlan = await this.prisma.floorPlans.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                space: {
                    include: {
                        location: {
                            select: {
                                id: true,
                                name: true,
                                brand_id: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });

        if (!floorPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        return floorPlan;
    }

    async updateFloorPlan(id: number, updateFloorPlanDto: UpdateFloorPlanDto) {
        const existingFloorPlan = await this.prisma.floorPlans.findFirst({
            where: { id, is_active: true },
        });

        if (!existingFloorPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        return this.prisma.floorPlans.update({
            where: { id },
            data: {
                ...updateFloorPlanDto,
                updated_at: new Date(),
            },
            include: {
                space: {
                    include: {
                        location: true,
                    },
                },
                project: true,
            },
        });
    }

    async removeFloorPlan(id: number) {
        const existingFloorPlan = await this.prisma.floorPlans.findFirst({
            where: { id, is_active: true },
        });

        if (!existingFloorPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        // Soft delete
        return this.prisma.floorPlans.update({
            where: { id },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        });
    }

    async duplicateFloorPlan(id: number, projectId?: number) {
        const originalFloorPlan = await this.prisma.floorPlans.findFirst({
            where: { id, is_active: true },
        });

        if (!originalFloorPlan) {
            throw new NotFoundException(`Floor plan with ID ${id} not found`);
        }

        // If projectId is provided, verify it exists
        if (projectId) {
            await this.verifyProjectExists(projectId);
        }

        // Get the next version number for this space
        const latestVersion = await this.prisma.floorPlans.findFirst({
            where: {
                space_id: originalFloorPlan.space_id,
                project_id: projectId || null,
                is_active: true,
            },
            orderBy: { version: 'desc' },
            select: { version: true },
        });

        const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

        // Create the duplicate
        const duplicateData = {
            space_id: originalFloorPlan.space_id,
            project_id: projectId || originalFloorPlan.project_id,
            name: `${originalFloorPlan.name} (Copy)`,
            version: nextVersion,
            // Ensure JSON input types are correct for Prisma writes
            fabric_data: originalFloorPlan.fabric_data as Prisma.InputJsonValue,
            layers_data:
                originalFloorPlan.layers_data === null
                    ? Prisma.JsonNull
                    : (originalFloorPlan.layers_data as Prisma.InputJsonValue),
            is_default: false,
            is_active: true,
            created_by_id: originalFloorPlan.created_by_id,
        };

        return this.prisma.floorPlans.create({
            data: duplicateData,
            include: {
                space: {
                    include: {
                        location: true,
                    },
                },
                project: true,
            },
        });
    }

    private async verifyProjectExists(projectId: number): Promise<void> {
        const project = await this.prisma.projects.findFirst({
            where: { id: projectId },
        });
        if (!project) {
            throw new NotFoundException(`Project with ID ${projectId} not found`);
        }
    }
}
