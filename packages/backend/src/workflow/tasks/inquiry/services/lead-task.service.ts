import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';

/** Role name → lead_type mapping (same as crew-slots service) */
const ROLE_TO_LEAD: Record<string, string> = {
    producer: 'producer',
    videographer: 'videographer',
    editor: 'editor',
    'video-editor': 'editor',
};

/**
 * Manages the lifecycle of lead-specific inquiry tasks.
 *
 * When a crew member is toggled as lead (producer/videographer/editor),
 * this service auto-generates tasks from matching task_library entries
 * (identified by default_job_role_id matching the lead role).
 *
 * On lead change: incomplete tasks are reassigned to the new lead.
 * On lead removal: incomplete tasks are unassigned.
 */
@Injectable()
export class LeadTaskService {
    private readonly logger = new Logger(LeadTaskService.name);

    constructor(private prisma: PrismaService) {}

    /**
     * Called after toggleLead() updates the crew slot.
     * Handles task creation, reassignment, or cleanup based on what changed.
     */
    async onLeadChanged(
        inquiryId: number,
        leadType: string,
        newCrewId: number | null,
        previousCrewId: number | null,
    ) {
        if (newCrewId && !previousCrewId) {
            await this.generateLeadTasks(inquiryId, leadType, newCrewId);
        } else if (newCrewId && previousCrewId && newCrewId !== previousCrewId) {
            await this.reassignLeadTasks(inquiryId, leadType, newCrewId);
        } else if (!newCrewId && previousCrewId) {
            await this.unassignLeadTasks(inquiryId, leadType);
        }
    }

    /**
     * Fetch task_library entries marked as lead tasks for the given lead type.
     * Uses is_lead_task flag + default_job_role_id matching the lead role.
     */
    private async getLibraryTasksForLeadType(leadType: string, brandId: number) {
        const roleNames = Object.entries(ROLE_TO_LEAD)
            .filter(([, lt]) => lt === leadType)
            .map(([name]) => name);

        const roles = await this.prisma.job_roles.findMany({
            where: { name: { in: roleNames } },
            select: { id: true },
        });
        if (roles.length === 0) return [];

        return this.prisma.task_library.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
                is_task_group: false,
                is_lead_task: true,
                default_job_role_id: { in: roles.map((r) => r.id) },
            },
            orderBy: [{ order_index: 'asc' }],
        });
    }

    /**
     * Generate lead tasks for a newly assigned lead.
     * Uses task_library entries — sets task_library_id on the created inquiry_tasks.
     */
    private async generateLeadTasks(inquiryId: number, leadType: string, crewId: number) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: { wedding_date: true, created_at: true, contact: { select: { brand_id: true } } },
        });
        if (!inquiry?.contact?.brand_id) return;

        const libraryTasks = await this.getLibraryTasksForLeadType(leadType, inquiry.contact.brand_id);
        if (libraryTasks.length === 0) return;

        // Check which tasks already exist (idempotent — e.g. re-assignment after unassign)
        const existing = await this.prisma.inquiry_tasks.findMany({
            where: {
                inquiry_id: inquiryId,
                task_library_id: { in: libraryTasks.map((t) => t.id) },
            },
            select: { id: true, task_library_id: true, status: true, assigned_to_id: true },
        });
        const existingByLibId = new Map(existing.map((t) => [t.task_library_id, t]));

        const maxOrder = await this.prisma.inquiry_tasks.aggregate({
            where: { inquiry_id: inquiryId },
            _max: { order_index: true },
        });
        let nextOrder = (maxOrder._max.order_index ?? 0) + 1;
        let created = 0;

        for (const lib of libraryTasks) {
            const existingTask = existingByLibId.get(lib.id);

            if (existingTask) {
                if (!existingTask.assigned_to_id && existingTask.status !== 'Completed') {
                    await this.prisma.inquiry_tasks.update({
                        where: { id: existingTask.id },
                        data: { assigned_to_id: crewId },
                    });
                }
                continue;
            }

            const dueDate = this.calcDueDate(lib.due_date_offset_days, lib.due_date_offset_reference, inquiry.wedding_date, inquiry.created_at);

            await this.prisma.inquiry_tasks.create({
                data: {
                    inquiry_id: inquiryId,
                    task_library_id: lib.id,
                    name: lib.name,
                    description: lib.description,
                    phase: lib.phase,
                    trigger_type: lib.trigger_type,
                    status: 'To_Do',
                    order_index: nextOrder++,
                    due_date: dueDate,
                    assigned_to_id: crewId,
                    job_role_id: lib.default_job_role_id,
                    is_active: true,
                    is_task_group: false,
                },
            });
            created++;
        }

        this.logger.log(`Generated ${created} lead ${leadType} tasks for inquiry ${inquiryId}, crew ${crewId}`);
    }

    /**
     * Reassign all incomplete lead tasks from old lead to new lead.
     */
    private async reassignLeadTasks(inquiryId: number, leadType: string, newCrewId: number) {
        const libraryIds = await this.getLeadLibraryIds(inquiryId, leadType);
        if (libraryIds.length === 0) return;

        const result = await this.prisma.inquiry_tasks.updateMany({
            where: {
                inquiry_id: inquiryId,
                task_library_id: { in: libraryIds },
                status: { not: 'Completed' },
                is_active: true,
            },
            data: { assigned_to_id: newCrewId },
        });

        this.logger.log(`Reassigned ${result.count} lead ${leadType} tasks to crew ${newCrewId} for inquiry ${inquiryId}`);
    }

    /**
     * Unassign all incomplete lead tasks when lead is removed.
     */
    private async unassignLeadTasks(inquiryId: number, leadType: string) {
        const libraryIds = await this.getLeadLibraryIds(inquiryId, leadType);
        if (libraryIds.length === 0) return;

        const result = await this.prisma.inquiry_tasks.updateMany({
            where: {
                inquiry_id: inquiryId,
                task_library_id: { in: libraryIds },
                status: { not: 'Completed' },
                is_active: true,
            },
            data: { assigned_to_id: null },
        });

        this.logger.log(`Unassigned ${result.count} lead ${leadType} tasks for inquiry ${inquiryId}`);
    }

    /** Get task_library IDs for a lead type on this inquiry's brand */
    private async getLeadLibraryIds(inquiryId: number, leadType: string): Promise<number[]> {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: { contact: { select: { brand_id: true } } },
        });
        if (!inquiry?.contact?.brand_id) return [];

        const tasks = await this.getLibraryTasksForLeadType(leadType, inquiry.contact.brand_id);
        return tasks.map((t) => t.id);
    }

    private calcDueDate(
        offsetDays: number | null,
        offsetRef: string | null,
        eventDate: Date | null,
        inquiryCreatedAt: Date,
    ): Date | null {
        if (offsetDays == null || !offsetRef) return null;

        let ref: Date;
        switch (offsetRef) {
            case 'event_date':
                ref = eventDate ?? inquiryCreatedAt;
                break;
            case 'inquiry_created':
            default:
                ref = inquiryCreatedAt;
                break;
        }

        const d = new Date(ref);
        d.setDate(d.getDate() + offsetDays);
        return d;
    }
}
