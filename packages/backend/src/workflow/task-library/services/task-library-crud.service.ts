import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateTaskLibraryDto, UpdateTaskLibraryDto, TaskLibraryQueryDto, ProjectPhase, BatchUpdateTaskOrderDto } from '../dto/task-library.dto';
import { TaskLibraryAccessService } from './task-library-access.service';

const BASE_INCLUDE = {
    brand: { select: { id: true, name: true } },
    default_job_role: { select: { id: true, name: true, display_name: true, category: true } },
    default_contributor: { select: { id: true, contact: { select: { first_name: true, last_name: true } } } },
} as const;

const BENCH_INCLUDE = {
    ...BASE_INCLUDE,
    task_library_benchmarks: { include: { crew_member: { include: { contact: { select: { first_name: true, last_name: true } } } } } },
    task_library_skill_rates: true,
} as const;

const FULL_INCLUDE = {
    ...BENCH_INCLUDE,
    task_library_subtask_templates: { orderBy: { order_index: 'asc' as const } },
} as const;

@Injectable()
export class TaskLibraryCrudService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly access: TaskLibraryAccessService,
    ) {}

    async create(dto: CreateTaskLibraryDto, userId: number) {
        await this.access.checkBrandAccess(dto.brand_id, userId);
        if (dto.default_job_role_id && dto.default_contributor_id == null) {
            const bracketId = await this.access.resolveBracketForRoleSkills(dto.default_job_role_id, dto.skills_needed ?? []);
            dto.default_contributor_id = (await this.access.resolveContributorForRole(dto.default_job_role_id, bracketId, dto.brand_id)) ?? undefined;
        }
        return this.prisma.task_library.create({ data: { ...dto, skills_needed: dto.skills_needed || [] }, include: BASE_INCLUDE });
    }

    async findAll(query: TaskLibraryQueryDto, userId: number) {
        const { phase, brandId, is_active, search } = query;
        const userBrands = await this.access.getUserBrands(userId);
        const accessibleBrandIds = userBrands.map(ub => ub.brand_id);
        let brandFilter: { id: number } | { id: { in: number[] } } = { id: { in: accessibleBrandIds } };
        if (brandId) {
            const brandIdNum = typeof brandId === 'string' ? parseInt(brandId, 10) : brandId;
            if (!accessibleBrandIds.includes(brandIdNum)) throw new ForbiddenException('Access denied to this brand');
            brandFilter = { id: brandIdNum };
        }
        const where: Record<string, unknown> = { brand: brandFilter };
        if (phase) where.phase = phase;
        if (is_active !== undefined) where.is_active = is_active;
        if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
        const tasks = await this.prisma.task_library.findMany({
            where, include: { ...FULL_INCLUDE, children: { include: { ...BASE_INCLUDE, task_library_skill_rates: true, task_library_subtask_templates: { orderBy: { order_index: 'asc' } } }, orderBy: { order_index: 'asc' } } },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }, { name: 'asc' }],
        });
        const groupedByPhase = tasks.reduce((acc, task) => { if (!acc[task.phase]) acc[task.phase] = []; acc[task.phase].push(task); return acc; }, {} as Record<string, typeof tasks>);
        return { tasks, groupedByPhase, phases: Object.values(ProjectPhase) };
    }

    async findOne(id: number, userId: number) {
        const task = await this.prisma.task_library.findUnique({ where: { id }, include: FULL_INCLUDE });
        if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
        await this.access.checkBrandAccess(task.brand_id, userId);
        return task;
    }

    async update(id: number, dto: UpdateTaskLibraryDto, userId: number) {
        const existing = await this.findOne(id, userId);
        if (dto.default_job_role_id !== undefined) {
            const newRoleId = dto.default_job_role_id;
            if (newRoleId) {
                if (dto.default_contributor_id === undefined) {
                    const skills = dto.skills_needed ?? existing.skills_needed ?? [];
                    const bracketId = await this.access.resolveBracketForRoleSkills(newRoleId, skills);
                    dto.default_contributor_id = await this.access.resolveContributorForRole(newRoleId, bracketId, existing.brand_id);
                }
            } else {
                dto.default_contributor_id = null;
            }
        }
        const updated = await this.prisma.task_library.update({ where: { id }, data: dto, include: BENCH_INCLUDE });
        if (dto.default_contributor_id !== undefined) {
            await this.prisma.inquiry_tasks.updateMany({ where: { task_library_id: id, is_active: true, is_task_group: false }, data: { assigned_to_id: dto.default_contributor_id } });
        }
        return updated;
    }

    async syncContributorsToInquiryTasks(brandId: number): Promise<{ updated: number }> {
        const libraryTasks = await this.prisma.task_library.findMany({ where: { brand_id: brandId, is_active: true, default_contributor_id: { not: null } }, select: { id: true, default_contributor_id: true } });
        let updated = 0;
        for (const lt of libraryTasks) {
            const result = await this.prisma.inquiry_tasks.updateMany({ where: { task_library_id: lt.id, is_active: true, is_task_group: false }, data: { assigned_to_id: lt.default_contributor_id } });
            updated += result.count;
        }
        return { updated };
    }

    async remove(id: number, userId: number) {
        await this.findOne(id, userId);
        return this.prisma.task_library.delete({ where: { id } });
    }

    async batchUpdateOrder(dto: BatchUpdateTaskOrderDto, userId: number) {
        const { tasks, phase, brand_id } = dto;
        await this.access.checkBrandAccess(brand_id, userId);
        const existingTasks = await this.prisma.task_library.findMany({ where: { id: { in: tasks.map(t => t.id) }, phase, brand_id } });
        if (existingTasks.length !== tasks.length) throw new NotFoundException('One or more tasks not found or do not belong to the specified phase and brand');
        await Promise.all(tasks.map(task => this.prisma.task_library.update({ where: { id: task.id }, data: { order_index: task.order_index } })));
        return { success: true, message: 'Task order updated successfully' };
    }

    async getTasksByPhase(phase: ProjectPhase, brandId: number, userId: number) {
        await this.access.checkBrandAccess(brandId, userId);
        return this.prisma.task_library.findMany({
            where: { phase, brand_id: brandId, is_active: true },
            include: BENCH_INCLUDE,
            orderBy: [{ order_index: 'asc' }, { name: 'asc' }],
        });
    }
}
