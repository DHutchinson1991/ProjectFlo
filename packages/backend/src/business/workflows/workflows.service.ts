import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowsService {
    constructor(private prisma: PrismaService) { }

    // ========================
    // WORKFLOW TEMPLATES
    // ========================

    async findAll(query: { brandId?: number; is_active?: boolean; is_default?: boolean }, userId: number) {
        const userBrands = await this.getUserBrands(userId);
        const accessibleBrandIds = userBrands.map(ub => ub.brand_id);

        const where: Record<string, unknown> = {};

        if (query.brandId) {
            const brandIdNum = typeof query.brandId === 'string' ? parseInt(query.brandId as string, 10) : query.brandId;
            if (!accessibleBrandIds.includes(brandIdNum)) {
                throw new ForbiddenException('Access denied to this brand');
            }
            where.brand_id = brandIdNum;
        } else {
            where.brand_id = { in: accessibleBrandIds };
        }

        if (query.is_active !== undefined) {
            where.is_active = query.is_active;
        }

        if (query.is_default !== undefined) {
            where.is_default = query.is_default;
        }

        return this.prisma.workflow_templates.findMany({
            where,
            include: {
                brand: { select: { id: true, name: true } },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
            orderBy: [
                { is_default: 'desc' },
                { name: 'asc' },
            ],
        });
    }

    async findOne(id: number, userId: number) {
        const template = await this.prisma.workflow_templates.findUnique({
            where: { id },
            include: {
                brand: { select: { id: true, name: true } },
                workflow_template_tasks: {
                    where: { is_active: true },
                    orderBy: [
                        { phase: 'asc' },
                        { order_index: 'asc' },
                    ],
                    include: {
                        task_library: {
                            include: {
                                brand: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
        });

        if (!template) {
            throw new NotFoundException(`Workflow template ${id} not found`);
        }

        if (template.brand_id) {
            await this.checkBrandAccess(template.brand_id, userId);
        }

        return template;
    }

    async create(data: { brand_id: number; name: string; description?: string; is_default?: boolean }, userId: number) {
        await this.checkBrandAccess(data.brand_id, userId);

        return this.prisma.workflow_templates.create({
            data: {
                brand_id: data.brand_id,
                name: data.name,
                description: data.description,
                is_default: data.is_default ?? false,
            },
            include: {
                brand: { select: { id: true, name: true } },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
        });
    }

    async update(id: number, data: { name?: string; description?: string; is_default?: boolean; is_active?: boolean }, userId: number) {
        const template = await this.findOne(id, userId);
        if (template.brand_id) {
            await this.checkBrandAccess(template.brand_id, userId);
        }

        return this.prisma.workflow_templates.update({
            where: { id },
            data,
            include: {
                brand: { select: { id: true, name: true } },
                _count: {
                    select: {
                        projects: true,
                        service_packages: true,
                        workflow_template_tasks: true,
                    },
                },
            },
        });
    }

    async remove(id: number, userId: number) {
        await this.findOne(id, userId);
        return this.prisma.workflow_templates.delete({ where: { id } });
    }

    // ========================
    // WORKFLOW TEMPLATE TASKS
    // ========================

    /**
     * Get all tasks for a workflow template, grouped by phase
     */
    async getTemplateTasks(templateId: number, userId: number) {
        const template = await this.findOne(templateId, userId);

        const tasks = await this.prisma.workflow_template_tasks.findMany({
            where: {
                workflow_template_id: templateId,
                is_active: true,
            },
            include: {
                task_library: {
                    include: {
                        brand: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: [
                { phase: 'asc' },
                { order_index: 'asc' },
            ],
        });

        // Group by phase
        const groupedByPhase = tasks.reduce((acc, task) => {
            const phase = task.phase;
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(task);
            return acc;
        }, {} as Record<string, typeof tasks>);

        return {
            template: {
                id: template.id,
                name: template.name,
                description: template.description,
                is_default: template.is_default,
                is_active: template.is_active,
            },
            tasks,
            groupedByPhase,
            totalTasks: tasks.length,
        };
    }

    /**
     * Add a task from the task library to a workflow template
     */
    async addTaskToTemplate(
        templateId: number,
        data: {
            task_library_id: number;
            phase?: string;
            override_hours?: number;
            override_assignee_role?: string;
            order_index?: number;
            is_required?: boolean;
        },
        userId: number,
    ) {
        const template = await this.findOne(templateId, userId);
        if (template.brand_id) {
            await this.checkBrandAccess(template.brand_id, userId);
        }

        // Get the task library entry to default the phase
        const taskEntry = await this.prisma.task_library.findUnique({
            where: { id: data.task_library_id },
        });

        if (!taskEntry) {
            throw new NotFoundException(`Task library entry ${data.task_library_id} not found`);
        }

        // Calculate order_index if not provided
        let orderIndex = data.order_index;
        if (orderIndex === undefined) {
            const phase = (data.phase || taskEntry.phase) as string;
            const maxOrder = await this.prisma.workflow_template_tasks.aggregate({
                where: {
                    workflow_template_id: templateId,
                    phase: phase as any,
                },
                _max: { order_index: true },
            });
            orderIndex = (maxOrder._max.order_index ?? 0) + 1;
        }

        return this.prisma.workflow_template_tasks.create({
            data: {
                workflow_template_id: templateId,
                task_library_id: data.task_library_id,
                phase: (data.phase || taskEntry.phase) as any,
                override_hours: data.override_hours,
                override_assignee_role: data.override_assignee_role,
                order_index: orderIndex,
                is_required: data.is_required ?? true,
            },
            include: {
                task_library: {
                    include: {
                        brand: { select: { id: true, name: true } },
                    },
                },
            },
        });
    }

    /**
     * Bulk sync tasks - set the complete task list for a template
     */
    async syncTemplateTasks(
        templateId: number,
        data: {
            tasks: {
                task_library_id: number;
                phase?: string;
                override_hours?: number;
                override_assignee_role?: string;
                order_index?: number;
                is_required?: boolean;
            }[];
        },
        userId: number,
    ) {
        const template = await this.findOne(templateId, userId);
        if (template.brand_id) {
            await this.checkBrandAccess(template.brand_id, userId);
        }

        // Get task library entries to default phases
        const taskLibraryIds = data.tasks.map(t => t.task_library_id);
        const taskEntries = await this.prisma.task_library.findMany({
            where: { id: { in: taskLibraryIds } },
        });
        const taskMap = new Map(taskEntries.map(t => [t.id, t]));

        await this.prisma.$transaction(async (tx) => {
            await tx.workflow_template_tasks.deleteMany({
                where: { workflow_template_id: templateId },
            });

            const createData = data.tasks.map((task, index) => {
                const libraryTask = taskMap.get(task.task_library_id);
                return {
                    workflow_template_id: templateId,
                    task_library_id: task.task_library_id,
                    phase: (task.phase || libraryTask?.phase || 'Pre_Production') as any,
                    override_hours: task.override_hours ? task.override_hours : undefined,
                    override_assignee_role: task.override_assignee_role,
                    order_index: task.order_index ?? index + 1,
                    is_required: task.is_required ?? true,
                };
            });

            await tx.workflow_template_tasks.createMany({ data: createData });
        });

        return this.getTemplateTasks(templateId, userId);
    }

    /**
     * Remove a task from a workflow template
     */
    async removeTaskFromTemplate(templateTaskId: number, userId: number) {
        const templateTask = await this.prisma.workflow_template_tasks.findUnique({
            where: { id: templateTaskId },
            include: { workflow_template: true },
        });

        if (!templateTask) {
            throw new NotFoundException(`Template task ${templateTaskId} not found`);
        }

        if (templateTask.workflow_template.brand_id) {
            await this.checkBrandAccess(templateTask.workflow_template.brand_id, userId);
        }

        return this.prisma.workflow_template_tasks.delete({
            where: { id: templateTaskId },
        });
    }

    /**
     * Update a template task (override hours, role, order, etc.)
     */
    async updateTemplateTask(
        templateTaskId: number,
        data: {
            override_hours?: number | null;
            override_assignee_role?: string | null;
            order_index?: number;
            is_required?: boolean;
            phase?: string;
        },
        userId: number,
    ) {
        const templateTask = await this.prisma.workflow_template_tasks.findUnique({
            where: { id: templateTaskId },
            include: { workflow_template: true },
        });

        if (!templateTask) {
            throw new NotFoundException(`Template task ${templateTaskId} not found`);
        }

        if (templateTask.workflow_template.brand_id) {
            await this.checkBrandAccess(templateTask.workflow_template.brand_id, userId);
        }

        const updateData: Record<string, unknown> = {};
        if (data.override_hours !== undefined) updateData.override_hours = data.override_hours;
        if (data.override_assignee_role !== undefined) updateData.override_assignee_role = data.override_assignee_role;
        if (data.order_index !== undefined) updateData.order_index = data.order_index;
        if (data.is_required !== undefined) updateData.is_required = data.is_required;
        if (data.phase !== undefined) updateData.phase = data.phase;

        return this.prisma.workflow_template_tasks.update({
            where: { id: templateTaskId },
            data: updateData,
            include: {
                task_library: {
                    include: {
                        brand: { select: { id: true, name: true } },
                    },
                },
            },
        });
    }

    /**
     * Toggle a task library item in/out of a workflow template
     */
    async toggleTaskInTemplate(
        templateId: number,
        taskLibraryId: number,
        userId: number,
    ) {
        const template = await this.findOne(templateId, userId);
        if (template.brand_id) {
            await this.checkBrandAccess(template.brand_id, userId);
        }

        const existing = await this.prisma.workflow_template_tasks.findUnique({
            where: {
                workflow_template_id_task_library_id: {
                    workflow_template_id: templateId,
                    task_library_id: taskLibraryId,
                },
            },
        });

        if (existing) {
            await this.prisma.workflow_template_tasks.delete({
                where: { id: existing.id },
            });
            return { action: 'removed', task_library_id: taskLibraryId };
        } else {
            const taskEntry = await this.prisma.task_library.findUnique({
                where: { id: taskLibraryId },
            });

            if (!taskEntry) {
                throw new NotFoundException(`Task library entry ${taskLibraryId} not found`);
            }

            const maxOrder = await this.prisma.workflow_template_tasks.aggregate({
                where: {
                    workflow_template_id: templateId,
                    phase: taskEntry.phase,
                },
                _max: { order_index: true },
            });

            const created = await this.prisma.workflow_template_tasks.create({
                data: {
                    workflow_template_id: templateId,
                    task_library_id: taskLibraryId,
                    phase: taskEntry.phase,
                    order_index: (maxOrder._max.order_index ?? 0) + 1,
                    is_required: true,
                },
                include: {
                    task_library: {
                        include: {
                            brand: { select: { id: true, name: true } },
                        },
                    },
                },
            });
            return { action: 'added', task_library_id: taskLibraryId, template_task: created };
        }
    }

    /**
     * Preview what tasks would be generated for a project
     */
    async preview(templateId: number, userId: number) {
        const result = await this.getTemplateTasks(templateId, userId);

        const phaseGroups = Object.entries(result.groupedByPhase).map(([phase, tasks]) => ({
            phase,
            tasks: tasks.map(t => ({
                task_library_id: t.task_library_id,
                name: t.task_library.name,
                description: t.task_library.description,
                effort_hours: t.override_hours ?? t.task_library.effort_hours,
                pricing_type: t.task_library.pricing_type,
                hourly_rate: t.task_library.hourly_rate,
                is_required: t.is_required,
                override_assignee_role: t.override_assignee_role,
            })),
        }));

        return {
            template: result.template,
            phases: phaseGroups,
            totalTasks: result.totalTasks,
            totalHours: result.tasks.reduce((sum, t) => {
                const hours = t.override_hours ?? t.task_library.effort_hours;
                return sum + (hours ? Number(hours) : 0);
            }, 0),
        };
    }

    // ========================
    // HELPERS
    // ========================

    private async checkBrandAccess(brandId: number, userId: number) {
        const contributor = await this.prisma.contributors.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (contributor?.role?.name === 'Global Admin') return true;

        const userBrand = await this.prisma.user_brands.findFirst({
            where: { user_id: userId, brand_id: brandId, is_active: true },
        });

        if (!userBrand) {
            throw new ForbiddenException('Access denied to this brand');
        }
        return userBrand;
    }

    private async getUserBrands(userId: number) {
        const contributor = await this.prisma.contributors.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (contributor?.role?.name === 'Global Admin') {
            const allBrands = await this.prisma.brands.findMany({
                where: { is_active: true },
                select: { id: true, name: true },
            });
            return allBrands.map(brand => ({
                user_id: userId,
                brand_id: brand.id,
                brand,
            }));
        }

        return this.prisma.user_brands.findMany({
            where: { user_id: userId, is_active: true },
            include: {
                brand: { select: { id: true, name: true } },
            },
        });
    }
}
