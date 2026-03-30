import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { InquiryTaskStatusService } from './inquiry-task-status.service';
import { UpdateInquiryTaskDto } from '../dto/update-inquiry-task.dto';
import { type InquiryTaskSubtaskKey } from '../constants/inquiry-task-subtasks.constants';
import { TASK_INCLUDE } from '../constants/inquiry-task-includes';

@Injectable()
export class InquiryTaskLifecycleService {
    private readonly logger = new Logger(InquiryTaskLifecycleService.name);
    constructor(
        private prisma: PrismaService,
        private statusService: InquiryTaskStatusService,
    ) {}

    readonly taskInclude = TASK_INCLUDE;

    async findAllForInquiry(inquiryId: number, brandId: number) {
        await this.verifyInquiryOwnership(inquiryId, brandId);
        return this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true },
            orderBy: [{ order_index: 'asc' }],
            include: TASK_INCLUDE,
        });
    }

    async update(inquiryId: number, taskId: number, dto: UpdateInquiryTaskDto, brandId: number) {
        const task = await this.verifyOwnership(inquiryId, taskId, brandId);
        await this.ensureDirectTaskMutationAllowed(task.id);

        const data: Record<string, unknown> = {};
        if (dto.status !== undefined) data.status = dto.status;
        if (dto.due_date !== undefined) data.due_date = new Date(dto.due_date);
        if (dto.order_index !== undefined) data.order_index = dto.order_index;
        if (dto.assigned_to_id !== undefined) data.assigned_to_id = dto.assigned_to_id;

        if (dto.status === 'Completed') {
            data.completed_at = new Date();
        } else if (dto.status) {
            data.completed_at = null;
            data.completed_by_id = null;
        }

        const updated = await this.prisma.inquiry_tasks.update({ where: { id: taskId }, data });

        if (dto.status) {
            await this.statusService.syncParentStageStatus(updated.parent_inquiry_task_id);
        }

        return updated;
    }

    async toggle(inquiryId: number, taskId: number, brandId: number, completedById?: number) {
        await this.verifyOwnership(inquiryId, taskId, brandId);
        return this.toggleTaskById(taskId, completedById);
    }

    async toggleTaskById(taskId: number, completedById?: number) {
        const task = await this.prisma.inquiry_tasks.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException(`Inquiry task ${taskId} not found`);

        await this.ensureDirectTaskMutationAllowed(task.id);

        const isCompleted = task.status === 'Completed';
        const updated = await this.prisma.inquiry_tasks.update({
            where: { id: taskId },
            data: isCompleted
                ? { status: 'To_Do', completed_at: null, completed_by_id: null }
                : { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
        });

        await this.statusService.syncParentStageStatus(updated.parent_inquiry_task_id, completedById);
        return updated;
    }

    async toggleSubtask(inquiryId: number, subtaskId: number, brandId: number, completedById?: number) {
        const subtask = await this.prisma.inquiry_task_subtasks.findFirst({
            where: {
                id: subtaskId,
                inquiry_task: {
                    inquiry_id: inquiryId,
                    inquiry: { archived_at: null, contact: { brand_id: brandId } },
                },
            },
            include: { inquiry_task: { select: { id: true } } },
        });

        if (!subtask) throw new NotFoundException(`Subtask ${subtaskId} not found for inquiry ${inquiryId}`);
        if (subtask.is_auto_only) throw new BadRequestException('Auto subtasks cannot be manually toggled');

        return this.toggleSubtaskById(subtaskId, completedById);
    }

    async toggleSubtaskById(subtaskId: number, completedById?: number) {
        const subtask = await this.prisma.inquiry_task_subtasks.findUnique({
            where: { id: subtaskId },
            include: {
                inquiry_task: { select: { id: true, inquiry_id: true, parent_inquiry_task_id: true } },
            },
        });

        if (!subtask) throw new NotFoundException(`Inquiry subtask ${subtaskId} not found`);
        if (subtask.is_auto_only) throw new BadRequestException('Auto subtasks cannot be manually toggled');

        const isCompleted = subtask.status === 'Completed';
        const updated = await this.prisma.inquiry_task_subtasks.update({
            where: { id: subtaskId },
            data: isCompleted
                ? { status: 'To_Do', completed_at: null, completed_by_id: null }
                : { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
        });

        await this.statusService.syncTaskStatusFromSubtasks(subtask.inquiry_task_id, completedById);

        if (!isCompleted && updated.status === 'Completed') {
            await this.statusService.handleSubtaskCompletionSideEffects(
                subtask.inquiry_task.inquiry_id,
                subtask.subtask_key as InquiryTaskSubtaskKey,
            );
        }

        return updated;
    }

    async getTaskEvents(taskId: number) {
        return this.prisma.inquiry_task_events.findMany({
            where: { task_id: taskId },
            orderBy: { occurred_at: 'desc' },
        });
    }

    async ensureDirectTaskMutationAllowed(taskId: number) {
        const subtaskCount = await this.prisma.inquiry_task_subtasks.count({ where: { inquiry_task_id: taskId } });
        if (subtaskCount > 0) throw new BadRequestException('Tasks with subtasks must be completed from their subtasks');
    }

    async autoCompleteByName(inquiryId: number, taskName: string, completedById?: number, force = false) {
        const task = await this.prisma.inquiry_tasks.findFirst({
            where: { inquiry_id: inquiryId, name: taskName, is_active: true, status: { not: 'Completed' } },
        });
        if (!task) {
            this.logger.warn(`autoCompleteByName: task "${taskName}" not found for inquiry ${inquiryId}`);
            return null;
        }

        if (!force) await this.ensureDirectTaskMutationAllowed(task.id);

        const [updated] = await this.prisma.$transaction([
            this.prisma.inquiry_tasks.update({
                where: { id: task.id },
                data: { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
            }),
            this.prisma.inquiry_task_events.create({
                data: {
                    task_id: task.id, event_type: 'AUTO_COMPLETE',
                    triggered_by: 'SYSTEM', description: 'Automatically completed',
                },
            }),
        ]);

        await this.statusService.syncParentStageStatus(updated.parent_inquiry_task_id, completedById);
        return updated;
    }

    async autoAssignByRole(inquiryId: number, jobRoleId: number, crewId: number | null) {
        if (!crewId || !jobRoleId) return;

        const matchingRole = await this.prisma.crewJobRole.findFirst({
            where: { crew_id: crewId, job_role_id: jobRoleId },
            select: { crew_id: true },
        });
        if (!matchingRole) return;

        const unassigned = await this.prisma.inquiry_tasks.findMany({
            where: {
                inquiry_id: inquiryId, job_role_id: jobRoleId,
                assigned_to_id: null, is_active: true, is_task_group: false,
            },
        });
        if (unassigned.length === 0) return;

        await this.prisma.inquiry_tasks.updateMany({
            where: { id: { in: unassigned.map((t) => t.id) } },
            data: { assigned_to_id: crewId },
        });
    }

    async verifyInquiryOwnership(inquiryId: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, archived_at: null, contact: { brand_id: brandId } },
            select: { id: true },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);
        return inquiry;
    }

    async verifyOwnership(inquiryId: number, taskId: number, brandId: number) {
        const task = await this.prisma.inquiry_tasks.findFirst({
            where: {
                id: taskId, inquiry_id: inquiryId,
                inquiry: { archived_at: null, contact: { brand_id: brandId } },
            },
        });
        if (!task) throw new NotFoundException(`Task ${taskId} not found for inquiry ${inquiryId}`);
        return task;
    }
}
