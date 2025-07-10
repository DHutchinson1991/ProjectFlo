import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskLibraryDto, UpdateTaskLibraryDto, TaskLibraryQueryDto, ProjectPhase, BatchUpdateTaskOrderDto } from './dto/task-library.dto';

@Injectable()
export class TaskLibraryService {
    constructor(private prisma: PrismaService) { }

    async create(createTaskLibraryDto: CreateTaskLibraryDto, userId: number) {
        // Check if user has access to the brand
        await this.checkBrandAccess(createTaskLibraryDto.brand_id, userId);

        return this.prisma.task_library.create({
            data: {
                ...createTaskLibraryDto,
                skills_needed: createTaskLibraryDto.skills_needed || [],
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

    async findAll(query: TaskLibraryQueryDto, userId: number) {
        const { phase, brandId, is_active, search } = query;

        // Get user's accessible brands
        const userBrands = await this.getUserBrands(userId);
        const accessibleBrandIds = userBrands.map(ub => ub.brand_id);

        // Filter by brandId if provided and user has access
        let brandFilter: { id: number } | { id: { in: number[] } } = { id: { in: accessibleBrandIds } };
        if (brandId) {
            // Ensure brandId is a number (query params come as strings)
            const brandIdNum = typeof brandId === 'string' ? parseInt(brandId, 10) : brandId;

            if (!accessibleBrandIds.includes(brandIdNum)) {
                throw new ForbiddenException('Access denied to this brand');
            }
            brandFilter = { id: brandIdNum };
        }

        const where: {
            brand: typeof brandFilter;
            phase?: ProjectPhase;
            is_active?: boolean;
            OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
        } = {
            brand: brandFilter,
        };

        // Apply filters
        if (phase) {
            where.phase = phase;
        }

        if (is_active !== undefined) {
            where.is_active = is_active;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const tasks = await this.prisma.task_library.findMany({
            where,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                task_library_skill_rates: true,
            },
            orderBy: [
                { phase: 'asc' },
                { order_index: 'asc' },
                { name: 'asc' },
            ],
        });

        // Group by project phase
        const groupedTasks = tasks.reduce((acc, task) => {
            const phase = task.phase;
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(task);
            return acc;
        }, {} as Record<string, typeof tasks>);

        return {
            tasks,
            groupedByPhase: groupedTasks,
            phases: Object.values(ProjectPhase),
        };
    }

    async findOne(id: number, userId: number) {
        const task = await this.prisma.task_library.findUnique({
            where: { id },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                task_library_skill_rates: true,
            },
        });

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }

        // Check if user has access to this task's brand
        await this.checkBrandAccess(task.brand_id, userId);

        return task;
    }

    async update(id: number, updateTaskLibraryDto: UpdateTaskLibraryDto, userId: number) {
        // Verify user has access to this task
        await this.findOne(id, userId);

        return this.prisma.task_library.update({
            where: { id },
            data: updateTaskLibraryDto,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                task_library_skill_rates: true,
            },
        });
    }

    async remove(id: number, userId: number) {
        // Verify user has access to this task
        await this.findOne(id, userId);

        return this.prisma.task_library.delete({
            where: { id },
        });
    }

    async batchUpdateTaskOrder(batchUpdateDto: BatchUpdateTaskOrderDto, userId: number) {
        // Check if user has access to the brand
        await this.checkBrandAccess(batchUpdateDto.brand_id, userId);

        // Validate that all tasks belong to the specified phase and brand
        const taskIds = batchUpdateDto.tasks.map(t => t.id);
        const existingTasks = await this.prisma.task_library.findMany({
            where: {
                id: { in: taskIds },
                phase: batchUpdateDto.phase,
                brand_id: batchUpdateDto.brand_id,
            },
            select: { id: true },
        });

        if (existingTasks.length !== taskIds.length) {
            throw new ForbiddenException('Some tasks do not belong to the specified phase and brand');
        }

        // Perform batch update using transaction
        const updates = batchUpdateDto.tasks.map(task =>
            this.prisma.task_library.update({
                where: { id: task.id },
                data: { order_index: task.order_index },
            })
        );

        const updatedTasks = await this.prisma.$transaction(updates);

        return {
            message: 'Task order updated successfully',
            updatedCount: updatedTasks.length,
            tasks: updatedTasks,
        };
    }

    async getTasksByPhase(phase: ProjectPhase, brandId: number, userId: number) {
        // Check if user has access to the brand
        await this.checkBrandAccess(brandId, userId);

        return this.prisma.task_library.findMany({
            where: {
                phase,
                brand_id: brandId,
                is_active: true,
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                task_library_skill_rates: true,
            },
            orderBy: [
                { order_index: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async batchUpdateOrder(batchUpdateDto: BatchUpdateTaskOrderDto, userId: number) {
        console.log('🔍 BatchUpdateOrder Debug - Received DTO:', JSON.stringify(batchUpdateDto, null, 2));
        console.log('🔍 BatchUpdateOrder Debug - User ID:', userId);

        const { tasks, phase, brand_id } = batchUpdateDto;

        // Check if user has access to the brand
        await this.checkBrandAccess(brand_id, userId);

        // Validate that all tasks belong to the specified phase and brand
        const existingTasks = await this.prisma.task_library.findMany({
            where: {
                id: { in: tasks.map(t => t.id) },
                phase: phase,
                brand_id: brand_id,
            },
        });

        if (existingTasks.length !== tasks.length) {
            throw new NotFoundException('One or more tasks not found or do not belong to the specified phase and brand');
        }

        // Update the order_index for each task
        const updatePromises = tasks.map(task =>
            this.prisma.task_library.update({
                where: { id: task.id },
                data: { order_index: task.order_index },
            })
        );

        await Promise.all(updatePromises);

        return { success: true, message: 'Task order updated successfully' };
    }

    private async checkBrandAccess(brandId: number, userId: number) {
        // Check if user is a global admin first
        const contributor = await this.prisma.contributors.findUnique({
            where: { id: userId },
            include: {
                role: true,
            },
        });

        if (contributor?.role?.name === 'Global Admin') {
            return true; // Global admins have access to all brands
        }

        // For non-global admins, check user_brands table
        const userBrand = await this.prisma.user_brands.findFirst({
            where: {
                user_id: userId,
                brand_id: brandId,
                is_active: true,
            },
        });

        if (!userBrand) {
            throw new ForbiddenException('Access denied to this brand');
        }

        return userBrand;
    }

    private async getUserBrands(userId: number) {
        // Check if user is a global admin first
        const contributor = await this.prisma.contributors.findUnique({
            where: { id: userId },
            include: {
                role: true,
            },
        });

        if (contributor?.role?.name === 'Global Admin') {
            // Global admins have access to all brands
            const allBrands = await this.prisma.brands.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                },
            });
            return allBrands.map(brand => ({
                user_id: userId,
                brand_id: brand.id,
                brand: brand,
            }));
        }

        // For non-global admins, get from user_brands table
        return this.prisma.user_brands.findMany({
            where: {
                user_id: userId,
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
    }
}
