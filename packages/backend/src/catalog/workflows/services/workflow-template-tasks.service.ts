import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { project_phase } from '@prisma/client';
import { WorkflowsService } from '../workflows.service';
import { AddTemplateTaskDto } from '../dto/add-template-task.dto';
import { SyncTemplateTasksDto } from '../dto/sync-template-tasks.dto';
import { UpdateTemplateTaskDto } from '../dto/update-template-task.dto';

@Injectable()
export class WorkflowTemplateTasksService {
    constructor(
        private prisma: PrismaService,
        private workflowsService: WorkflowsService,
    ) {}

    async getTemplateTasks(templateId: number, userId: number) {
        const template = await this.workflowsService.findOne(templateId, userId);

        const tasks = await this.prisma.workflow_template_tasks.findMany({
            where: { workflow_template_id: templateId, is_active: true },
            include: {
                task_library: {
                    include: { brand: { select: { id: true, name: true } } },
                },
            },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        });

        const groupedByPhase = tasks.reduce(
            (acc, task) => {
                const phase = task.phase;
                if (!acc[phase]) acc[phase] = [];
                acc[phase].push(task);
                return acc;
            },
            {} as Record<string, typeof tasks>,
        );

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

    async addTaskToTemplate(
        templateId: number,
        data: AddTemplateTaskDto,
        userId: number,
    ) {
        const template = await this.workflowsService.findOne(templateId, userId);
        if (template.brand_id) {
            await this.workflowsService.checkBrandAccess(template.brand_id, userId);
        }

        const taskEntry = await this.prisma.task_library.findUnique({
            where: { id: data.task_library_id },
        });
        if (!taskEntry) {
            throw new NotFoundException(`Task library entry ${data.task_library_id} not found`);
        }

        let orderIndex = data.order_index;
        if (orderIndex === undefined) {
            const phase = (data.phase || taskEntry.phase) as string;
            const maxOrder = await this.prisma.workflow_template_tasks.aggregate({
                where: { workflow_template_id: templateId, phase: phase as project_phase },
                _max: { order_index: true },
            });
            orderIndex = (maxOrder._max.order_index ?? 0) + 1;
        }

        return this.prisma.workflow_template_tasks.create({
            data: {
                workflow_template_id: templateId,
                task_library_id: data.task_library_id,
                phase: (data.phase || taskEntry.phase) as project_phase,
                override_hours: data.override_hours,
                override_assignee_role: data.override_assignee_role,
                order_index: orderIndex,
                is_required: data.is_required ?? true,
            },
            include: {
                task_library: {
                    include: { brand: { select: { id: true, name: true } } },
                },
            },
        });
    }

    async syncTemplateTasks(
        templateId: number,
        data: SyncTemplateTasksDto,
        userId: number,
    ) {
        const template = await this.workflowsService.findOne(templateId, userId);
        if (template.brand_id) {
            await this.workflowsService.checkBrandAccess(template.brand_id, userId);
        }

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
                    phase: (task.phase || libraryTask?.phase || 'Pre_Production') as project_phase,
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

    async removeTaskFromTemplate(templateTaskId: number, userId: number) {
        const templateTask = await this.prisma.workflow_template_tasks.findUnique({
            where: { id: templateTaskId },
            include: { workflow_template: true },
        });
        if (!templateTask) {
            throw new NotFoundException(`Template task ${templateTaskId} not found`);
        }
        if (templateTask.workflow_template.brand_id) {
            await this.workflowsService.checkBrandAccess(
                templateTask.workflow_template.brand_id, userId,
            );
        }

        return this.prisma.workflow_template_tasks.delete({
            where: { id: templateTaskId },
        });
    }

    async updateTemplateTask(
        templateTaskId: number,
        data: UpdateTemplateTaskDto,
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
            await this.workflowsService.checkBrandAccess(
                templateTask.workflow_template.brand_id, userId,
            );
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
                    include: { brand: { select: { id: true, name: true } } },
                },
            },
        });
    }

    async toggleTaskInTemplate(
        templateId: number,
        taskLibraryId: number,
        userId: number,
    ) {
        const template = await this.workflowsService.findOne(templateId, userId);
        if (template.brand_id) {
            await this.workflowsService.checkBrandAccess(template.brand_id, userId);
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
            await this.prisma.workflow_template_tasks.delete({ where: { id: existing.id } });
            return { action: 'removed', task_library_id: taskLibraryId };
        }

        const created = await this.addTaskToTemplate(
            templateId, { task_library_id: taskLibraryId }, userId,
        );
        return { action: 'added', task_library_id: taskLibraryId, template_task: created };
    }

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
}
