import { BadRequestException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { ContractsService } from '../../../../finance/contracts/contracts.service';
import { type InquiryTaskSubtaskKey } from '../constants/inquiry-task-subtasks.constants';

@Injectable()
export class InquiryTaskStatusService {
    private readonly logger = new Logger(InquiryTaskStatusService.name);
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => ContractsService))
        private contractsService: ContractsService,
    ) {}

    async syncTaskStatusFromSubtasks(taskId: number, completedById?: number) {
        const task = await this.prisma.inquiry_tasks.findUnique({
            where: { id: taskId },
            select: { id: true, status: true, parent_inquiry_task_id: true },
        });
        if (!task) return;

        const subtasks = await this.prisma.inquiry_task_subtasks.findMany({
            where: { inquiry_task_id: taskId },
            select: { status: true },
        });
        if (subtasks.length === 0) return;

        const allCompleted = subtasks.every((s) => s.status === 'Completed');
        const anyCompleted = subtasks.some((s) => s.status === 'Completed');
        const anyInProgress = subtasks.some((s) => s.status === 'In_Progress');
        const nextStatus = allCompleted ? 'Completed' : (anyInProgress || anyCompleted) ? 'In_Progress' : 'To_Do';

        if (task.status !== nextStatus) {
            await this.prisma.inquiry_tasks.update({
                where: { id: taskId },
                data: allCompleted
                    ? { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null }
                    : { status: nextStatus, completed_at: null, completed_by_id: null },
            });
        }

        await this.syncParentStageStatus(task.parent_inquiry_task_id, completedById);
    }

    async syncParentStageStatus(parentId: number | null, completedById?: number) {
        if (!parentId) return;

        const parent = await this.prisma.inquiry_tasks.findUnique({ where: { id: parentId } });
        if (!parent || !parent.is_task_group) return;

        const children = await this.prisma.inquiry_tasks.findMany({
            where: { parent_inquiry_task_id: parentId, is_active: true },
            select: { status: true },
        });
        if (children.length === 0) return;

        const allCompleted = children.every((c) => c.status === 'Completed');
        const anyCompleted = children.some((c) => c.status === 'Completed');
        const anyInProgress = children.some((c) => c.status === 'In_Progress');
        const nextStatus = allCompleted ? 'Completed' : (anyInProgress || anyCompleted) ? 'In_Progress' : 'To_Do';

        if (parent.status === nextStatus) return;

        await this.prisma.inquiry_tasks.update({
            where: { id: parentId },
            data: allCompleted
                ? { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null }
                : { status: nextStatus, completed_at: null, completed_by_id: null },
        });
    }

    async syncReviewInquiryAutoSubtasks(inquiryId: number) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: {
                id: true, wedding_date: true, event_type_id: true, selected_package_id: true,
                contact: { select: { email: true, phone_number: true } },
            },
        });
        if (!inquiry) return;

        await this.setAutoSubtaskStatus(inquiryId, 'verify_contact_details', Boolean(inquiry.contact?.email && inquiry.contact?.phone_number));
        await this.setAutoSubtaskStatus(inquiryId, 'verify_event_date', Boolean(inquiry.wedding_date));
        await this.setAutoSubtaskStatus(inquiryId, 'verify_event_type', Boolean(inquiry.event_type_id));
        await this.setAutoSubtaskStatus(inquiryId, 'confirm_package_selection', Boolean(inquiry.selected_package_id));
    }

    async setAutoSubtaskStatus(inquiryId: number, subtaskKey: InquiryTaskSubtaskKey, isComplete: boolean, completedById?: number) {
        const subtasks = await this.prisma.inquiry_task_subtasks.findMany({
            where: {
                subtask_key: subtaskKey,
                inquiry_task: { inquiry_id: inquiryId, is_active: true },
            },
            select: { id: true, inquiry_task_id: true, status: true },
        });

        if (subtasks.length === 0) return [];

        const nextStatus = isComplete ? 'Completed' : 'To_Do';
        const updatedTaskIds = new Set<number>();

        for (const subtask of subtasks) {
            if (subtask.status === nextStatus) {
                updatedTaskIds.add(subtask.inquiry_task_id);
                continue;
            }
            await this.prisma.inquiry_task_subtasks.update({
                where: { id: subtask.id },
                data: isComplete
                    ? { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null }
                    : { status: 'To_Do', completed_at: null, completed_by_id: null },
            });
            updatedTaskIds.add(subtask.inquiry_task_id);
        }

        for (const taskId of updatedTaskIds) {
            await this.syncTaskStatusFromSubtasks(taskId, completedById);
        }

        return [...updatedTaskIds];
    }

    async handleSubtaskCompletionSideEffects(inquiryId: number, subtaskKey: InquiryTaskSubtaskKey) {
        if (subtaskKey === 'mark_inquiry_qualified') {
            const inquiry = await this.prisma.inquiries.update({
                where: { id: inquiryId },
                data: { status: 'Qualified' },
                include: {
                    contact: { select: { first_name: true, last_name: true, brand_id: true } },
                    event_type: { select: { name: true } },
                },
            });

            try {
                const brandId = inquiry.contact?.brand_id;
                if (brandId) {
                    const templates = await this.prisma.contract_templates.findMany({
                        where: { brand_id: brandId },
                    });
                    const psaTemplate = templates.find((t) =>
                        /professional\s+services\s+agreement|\bpsa\b/i.test(t.name),
                    );
                    if (psaTemplate) {
                        const contactName = [inquiry.contact?.first_name, inquiry.contact?.last_name]
                            .filter(Boolean).join(' ').trim() || 'Client';
                        const eventType = inquiry.event_type?.name || 'Event';
                        const title = `${contactName} ${eventType} Professional Services Agreement`;
                        await this.contractsService.composeFromTemplate(inquiryId, brandId, {
                            template_id: psaTemplate.id, title,
                        });
                    }
                }
            } catch (err) {
                this.logger.warn(`Failed to auto-create PSA contract for inquiry ${inquiryId}: ${err}`);
            }
            return;
        }

        if (subtaskKey === 'send_welcome_response') {
            const inquiry = await this.prisma.inquiries.findUnique({
                where: { id: inquiryId },
                select: { id: true, contact_id: true },
            });
            if (!inquiry) return;

            await this.prisma.communications_log.create({
                data: {
                    contact_id: inquiry.contact_id,
                    type: 'welcome_outreach',
                    notes: 'Welcome response sent from Qualify & Respond card.',
                },
            });
        }
    }
}
