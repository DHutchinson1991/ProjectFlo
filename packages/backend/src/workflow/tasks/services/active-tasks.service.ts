import { Injectable, NotFoundException } from '@nestjs/common';
import { tasks_status } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../inquiry/services/inquiry-tasks.service';
import { buildInquiryTaskRows, buildProjectTaskRows } from '../mappers/active-tasks-row.mapper';

@Injectable()
export class ActiveTasksService {
    constructor(
        private prisma: PrismaService,
        private inquiryTasksService: InquiryTasksService,
    ) { }

    async getTasksForDateRange(startDate: string, endDate: string) {
        const start = this.parseDate(startDate, 'start');
        const end = this.parseDate(endDate, 'end');
        const dueDateFilter = { gte: start, lte: end };

        const [inquiryTasks, projectTasks] = await Promise.all([
            this.prisma.inquiry_tasks.findMany({
                where: { is_active: true, due_date: dueDateFilter },
                include: {
                    inquiry: {
                        select: {
                            id: true,
                            contact: { select: { first_name: true, last_name: true } },
                        },
                    },
                },
                orderBy: { due_date: 'asc' },
            }),
            this.prisma.project_tasks.findMany({
                where: { is_active: true, due_date: dueDateFilter },
                include: {
                    project: { select: { id: true, project_name: true } },
                    assigned_to: {
                        include: {
                            contact: { select: { first_name: true, last_name: true, email: true } },
                        },
                    },
                },
                orderBy: { due_date: 'asc' },
            }),
        ]);

        const unified = [
            ...inquiryTasks.map(t => ({
                id: t.id,
                source: 'inquiry' as const,
                inquiry_id: t.inquiry_id,
                project_id: null as number | null,
                name: t.name,
                description: t.description,
                phase: t.phase,
                status: t.status,
                due_date: t.due_date,
                estimated_hours: t.estimated_hours ? Number(t.estimated_hours) : null,
                completed_at: t.completed_at,
                context_label: t.inquiry?.contact
                    ? `${t.inquiry.contact.first_name} ${t.inquiry.contact.last_name}`
                    : `Inquiry #${t.inquiry_id}`,
                project_name: null as string | null,
                assignee: null as { id: number; name: string; email: string } | null,
            })),
            ...projectTasks.map(t => ({
                id: t.id,
                source: 'project' as const,
                inquiry_id: null as number | null,
                project_id: t.project_id,
                name: t.name,
                description: t.description,
                phase: t.phase,
                status: t.status,
                due_date: t.due_date,
                estimated_hours: t.estimated_hours ? Number(t.estimated_hours) : null,
                completed_at: null as Date | null,
                context_label: t.project?.project_name ?? `Project #${t.project_id}`,
                project_name: t.project?.project_name ?? null,
                assignee: t.assigned_to?.contact
                    ? {
                        id: t.assigned_to.id,
                        name: `${t.assigned_to.contact.first_name} ${t.assigned_to.contact.last_name}`.trim(),
                        email: t.assigned_to.contact.email,
                    }
                    : null,
            })),
        ];

        unified.sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });

        return unified;
    }

    async getActiveTasks(status?: string) {
        const statusFilter = status
            ? { status: status as tasks_status }
            : { status: { not: tasks_status.Archived } };

        const [inquiryTasks, projectTasks] = await Promise.all([
            this.prisma.inquiry_tasks.findMany({
                where: { is_active: true, ...statusFilter },
                include: {
                    inquiry: {
                        select: {
                            id: true, wedding_date: true, status: true,
                            contact: { select: { first_name: true, last_name: true, email: true } },
                        },
                    },
                    completed_by: {
                        include: { contact: { select: { first_name: true, last_name: true, email: true } } },
                    },
                    assigned_to: {
                        include: { contact: { select: { first_name: true, last_name: true, email: true } } },
                    },
                    task_library: { select: { is_auto_only: true } },
                    children: { where: { is_active: true }, select: { id: true, status: true } },
                    subtasks: {
                        where: status ? { status: status as tasks_status } : { status: { not: tasks_status.Archived } },
                        orderBy: [{ order_index: 'asc' }],
                        include: {
                            completed_by: {
                                include: { contact: { select: { first_name: true, last_name: true, email: true } } },
                            },
                            job_role: { select: { id: true, name: true, display_name: true } },
                        },
                    },
                },
                orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
            }),
            this.prisma.project_tasks.findMany({
                where: { is_active: true, ...statusFilter },
                include: {
                    project: { select: { id: true, project_name: true, wedding_date: true } },
                    assigned_to: {
                        include: { contact: { select: { first_name: true, last_name: true, email: true } } },
                    },
                },
                orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
            }),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return [
            ...buildInquiryTaskRows(inquiryTasks, today),
            ...buildProjectTaskRows(projectTasks, today),
        ];
    }

    async assignActiveTask(
        taskId: number,
        source: 'inquiry' | 'project',
        assigneeId: number | null,
        taskKind: 'task' | 'subtask' = 'task',
    ) {
        if (source === 'inquiry') {
            if (taskKind === 'subtask') {
                throw new NotFoundException('Inquiry subtasks do not support direct assignee changes');
            }
            return this.prisma.inquiry_tasks.update({
                where: { id: taskId },
                data: { assigned_to_id: assigneeId },
            });
        }

        return this.prisma.project_tasks.update({
            where: { id: taskId },
            data: { assigned_to_id: assigneeId },
        });
    }

    async toggleActiveTask(
        taskId: number,
        source: 'inquiry' | 'project',
        taskKind: 'task' | 'subtask' = 'task',
        completedById?: number,
    ) {
        if (source === 'inquiry') {
            if (taskKind === 'subtask') {
                const subtask = await this.prisma.inquiry_task_subtasks.findUnique({
                    where: { id: taskId },
                    include: { inquiry_task: { select: { inquiry_id: true } } },
                });
                if (!subtask) throw new NotFoundException(`Inquiry subtask ${taskId} not found`);

                const updated = await this.inquiryTasksService.toggleSubtaskById(taskId, completedById);
                return {
                    id: updated.id,
                    status: updated.status,
                    source: 'inquiry',
                    task_kind: 'subtask',
                    inquiry_id: subtask.inquiry_task.inquiry_id,
                    parent_task_id: subtask.inquiry_task_id,
                };
            }

            const task = await this.prisma.inquiry_tasks.findUnique({ where: { id: taskId } });
            if (!task) throw new NotFoundException(`Inquiry task ${taskId} not found`);

            const updated = await this.inquiryTasksService.toggleTaskById(taskId, completedById);
            return { id: updated.id, status: updated.status, source: 'inquiry', task_kind: 'task' };
        }

        const task = await this.prisma.project_tasks.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException(`Project task ${taskId} not found`);

        const isCompleted = task.status === 'Completed';
        const updated = await this.prisma.project_tasks.update({
            where: { id: taskId },
            data: isCompleted ? { status: 'To_Do' } : { status: 'Completed' },
        });

        return { id: updated.id, status: updated.status, source: 'project', task_kind: 'task' };
    }

    private parseDate(dateStr: string, bound: 'start' | 'end'): Date {
        if (dateStr.includes('T') || dateStr.includes(' ')) {
            return new Date(dateStr);
        }
        const [y, m, d] = dateStr.split('-').map(Number);
        return bound === 'start'
            ? new Date(y, m - 1, d, 0, 0, 0, 0)
            : new Date(y, m - 1, d, 23, 59, 59, 999);
    }
}
