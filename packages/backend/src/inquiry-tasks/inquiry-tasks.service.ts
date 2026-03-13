import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInquiryTaskDto } from './dto/inquiry-tasks.dto';

@Injectable()
export class InquiryTasksService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get all tasks for an inquiry, ordered by phase then order_index.
     */
    async findAllForInquiry(inquiryId: number, brandId: number) {
        // Verify inquiry belongs to brand
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                archived_at: null,
                contact: { brand_id: brandId },
            },
            select: { id: true },
        });
        if (!inquiry) {
            throw new NotFoundException(`Inquiry ${inquiryId} not found`);
        }

        return this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true },
            orderBy: [{ order_index: 'asc' }],
            include: {
                task_library: {
                    select: { id: true, name: true, effort_hours: true, trigger_type: true },
                },
                completed_by: {
                    select: {
                        id: true,
                        contact: { select: { first_name: true, last_name: true } },
                    },
                },
            },
        });
    }

    /**
     * Update a specific inquiry task (status, due_date, order_index).
     */
    async update(inquiryId: number, taskId: number, dto: UpdateInquiryTaskDto, brandId: number) {
        await this.verifyOwnership(inquiryId, taskId, brandId);

        const data: Record<string, unknown> = {};
        if (dto.status !== undefined) data.status = dto.status;
        if (dto.due_date !== undefined) data.due_date = new Date(dto.due_date);
        if (dto.order_index !== undefined) data.order_index = dto.order_index;

        // If marking as completed, set completed_at
        if (dto.status === 'Completed') {
            data.completed_at = new Date();
        } else if (dto.status) {
            data.completed_at = null;
            data.completed_by_id = null;
        }

        return this.prisma.inquiry_tasks.update({
            where: { id: taskId },
            data,
        });
    }

    /**
     * Toggle a task between To_Do and Completed.
     */
    async toggle(inquiryId: number, taskId: number, brandId: number, completedById?: number) {
        const task = await this.verifyOwnership(inquiryId, taskId, brandId);

        const isCompleted = task.status === 'Completed';

        return this.prisma.inquiry_tasks.update({
            where: { id: taskId },
            data: isCompleted
                ? { status: 'To_Do', completed_at: null, completed_by_id: null }
                : { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
        });
    }

    /**
     * Auto-generate inquiry tasks from the task library.
     * Called when an inquiry is created or when tasks need to be regenerated.
     */
    async generateForInquiry(inquiryId: number, brandId: number) {
        // Get inquiry with wedding_date for date offset calculation
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                archived_at: null,
                contact: { brand_id: brandId },
            },
            select: { id: true, wedding_date: true },
        });
        if (!inquiry) {
            throw new NotFoundException(`Inquiry ${inquiryId} not found`);
        }

        // Get Inquiry + Booking phase tasks from the library for this brand
        const libraryTasks = await this.prisma.task_library.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
                phase: { in: ['Inquiry', 'Booking'] },
            },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        });

        if (libraryTasks.length === 0) return [];

        // Delete any existing inquiry tasks first (for regeneration)
        await this.prisma.inquiry_tasks.deleteMany({
            where: { inquiry_id: inquiryId },
        });

        // Reference date for offset calculation: inquiry creation = now,
        // or use wedding_date for Booking-phase tasks if available
        const inquiryRefDate = new Date();
        const eventDate = inquiry.wedding_date ? new Date(inquiry.wedding_date) : null;

        // Assign a global order_index: Inquiry tasks first, then Booking
        let globalOrder = 0;
        const taskData = libraryTasks.map((lt) => {
            // Calculate due_date from offset if set
            let due_date: Date | null = null;
            if (lt.due_date_offset_days != null) {
                // For Inquiry phase: offset from now (inquiry creation/generation time)
                // For Booking phase: offset from event date if available, otherwise from now
                const refDate = lt.phase === 'Booking' && eventDate ? eventDate : inquiryRefDate;
                due_date = new Date(refDate);
                due_date.setDate(due_date.getDate() + lt.due_date_offset_days);
            }

            const record = {
                inquiry_id: inquiryId,
                task_library_id: lt.id,
                name: lt.name,
                description: lt.description,
                phase: lt.phase,
                trigger_type: lt.trigger_type,
                estimated_hours: lt.effort_hours,
                order_index: globalOrder++,
                status: 'To_Do' as const,
                is_active: true,
                due_date,
            };
            return record;
        });

        await this.prisma.inquiry_tasks.createMany({ data: taskData });

        return this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true },
            orderBy: [{ order_index: 'asc' }],
        });
    }

    /**
     * Auto-complete a task by name for an inquiry (used by other services).
     * Returns the updated task or null if not found.
     */
    async autoCompleteByName(inquiryId: number, taskName: string, completedById?: number) {
        const task = await this.prisma.inquiry_tasks.findFirst({
            where: {
                inquiry_id: inquiryId,
                name: taskName,
                is_active: true,
                status: { not: 'Completed' },
            },
        });
        if (!task) return null;

        return this.prisma.inquiry_tasks.update({
            where: { id: task.id },
            data: {
                status: 'Completed',
                completed_at: new Date(),
                completed_by_id: completedById ?? null,
            },
        });
    }

    private async verifyOwnership(inquiryId: number, taskId: number, brandId: number) {
        const task = await this.prisma.inquiry_tasks.findFirst({
            where: {
                id: taskId,
                inquiry_id: inquiryId,
                inquiry: {
                    archived_at: null,
                    contact: { brand_id: brandId },
                },
            },
        });
        if (!task) {
            throw new NotFoundException(`Task ${taskId} not found for inquiry ${inquiryId}`);
        }
        return task;
    }
}
