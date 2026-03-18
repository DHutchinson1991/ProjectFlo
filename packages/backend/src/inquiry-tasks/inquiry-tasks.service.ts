import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInquiryTaskDto } from './dto/inquiry-tasks.dto';

@Injectable()
export class InquiryTasksService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get all tasks for an inquiry, ordered by phase then order_index.
     * Includes parent/child hierarchy.
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
                    select: { id: true, name: true, effort_hours: true, trigger_type: true, is_stage: true, stage_color: true, parent_task_id: true },
                },
                completed_by: {
                    select: {
                        id: true,
                        contact: { select: { first_name: true, last_name: true } },
                    },
                },
                assigned_to: {
                    select: {
                        id: true,
                        contact: { select: { first_name: true, last_name: true, email: true } },
                    },
                },
                job_role: {
                    select: { id: true, name: true },
                },
                children: {
                    where: { is_active: true },
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
                        assigned_to: {
                            select: {
                                id: true,
                                contact: { select: { first_name: true, last_name: true, email: true } },
                            },
                        },
                        job_role: {
                            select: { id: true, name: true },
                        },
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
        if (dto.assigned_to_id !== undefined) data.assigned_to_id = dto.assigned_to_id;

        // If marking as completed, set completed_at
        if (dto.status === 'Completed') {
            data.completed_at = new Date();
        } else if (dto.status) {
            data.completed_at = null;
            data.completed_by_id = null;
        }

        const updated = await this.prisma.inquiry_tasks.update({
            where: { id: taskId },
            data,
        });

        // Auto-complete/revert parent stage based on children status
        if (dto.status) {
            await this.syncParentStageStatus(updated.parent_inquiry_task_id);
        }

        return updated;
    }

    /**
     * Toggle a task between To_Do and Completed.
     * After toggling, auto-complete/revert the parent stage if all children are done.
     */
    async toggle(inquiryId: number, taskId: number, brandId: number, completedById?: number) {
        const task = await this.verifyOwnership(inquiryId, taskId, brandId);

        const isCompleted = task.status === 'Completed';

        const updated = await this.prisma.inquiry_tasks.update({
            where: { id: taskId },
            data: isCompleted
                ? { status: 'To_Do', completed_at: null, completed_by_id: null }
                : { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
        });

        // Auto-complete/revert parent stage based on children status
        await this.syncParentStageStatus(updated.parent_inquiry_task_id, completedById);

        return updated;
    }

    /**
     * Check all children of a parent stage task. If ALL are Completed, auto-complete the parent.
     * If any child is not Completed, revert the parent back to In_Progress (or To_Do).
     */
    private async syncParentStageStatus(parentId: number | null, completedById?: number) {
        if (!parentId) return;

        const parent = await this.prisma.inquiry_tasks.findUnique({ where: { id: parentId } });
        if (!parent || !parent.is_stage) return;

        const children = await this.prisma.inquiry_tasks.findMany({
            where: { parent_inquiry_task_id: parentId, is_active: true },
            select: { id: true, status: true },
        });

        if (children.length === 0) return;

        const allCompleted = children.every(c => c.status === 'Completed');

        if (allCompleted && parent.status !== 'Completed') {
            await this.prisma.inquiry_tasks.update({
                where: { id: parentId },
                data: { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
            });
        } else if (!allCompleted && parent.status === 'Completed') {
            // Revert parent if a child was un-completed
            const anyInProgress = children.some(c => c.status === 'In_Progress');
            await this.prisma.inquiry_tasks.update({
                where: { id: parentId },
                data: { status: anyInProgress ? 'In_Progress' : 'To_Do', completed_at: null, completed_by_id: null },
            });
        }
    }

    /**
     * Auto-generate inquiry tasks from the task library.
     * Creates parent stage tasks first, then child sub-tasks linked to them.
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

        // Get Inquiry + Booking phase tasks from the library, including hierarchy info
        const libraryTasks = await this.prisma.task_library.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
                phase: { in: ['Inquiry', 'Booking'] },
            },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        });

        if (libraryTasks.length === 0) return [];

        // Build role→contributor(s) map from ProjectDayOperator for this inquiry
        const operators = await this.prisma.projectDayOperator.findMany({
            where: { inquiry_id: inquiryId },
            orderBy: [{ order_index: 'asc' }],
            select: { id: true, contributor_id: true, job_role_id: true, position_name: true },
        });

        // Map: job_role_id → contributor IDs (ordered)
        const operatorContributorIds = operators
            .filter(op => op.contributor_id)
            .map(op => op.contributor_id!);
        const contributorJobRoles = operatorContributorIds.length > 0
            ? await this.prisma.contributor_job_roles.findMany({
                where: { contributor_id: { in: operatorContributorIds } },
                select: { contributor_id: true, job_role_id: true },
            })
            : [];
        const contributorRoleAssignments = new Set(
            contributorJobRoles.map(cjr => `${cjr.contributor_id}-${cjr.job_role_id}`),
        );

        // Map: job_role_id → contributor IDs (ordered)
        const roleToContributors = new Map<number, { contributorId: number | null; positionName: string }[]>();
        for (const op of operators) {
            if (op.job_role_id && op.contributor_id && contributorRoleAssignments.has(`${op.contributor_id}-${op.job_role_id}`)) {
                if (!roleToContributors.has(op.job_role_id)) {
                    roleToContributors.set(op.job_role_id, []);
                }
                roleToContributors.get(op.job_role_id)!.push({
                    contributorId: op.contributor_id,
                    positionName: op.position_name,
                });
            }
        }

        // Delete any existing inquiry tasks first (for regeneration)
        await this.prisma.inquiry_tasks.deleteMany({
            where: { inquiry_id: inquiryId },
        });

        // Reference date for offset calculation
        const inquiryRefDate = new Date();
        const eventDate = inquiry.wedding_date ? new Date(inquiry.wedding_date) : null;

        // Separate stage tasks (parents) from sub-tasks (children)
        const stageTasks = libraryTasks.filter(t => t.is_stage);
        const childTasks = libraryTasks.filter(t => !t.is_stage && t.parent_task_id != null);
        // Flat tasks that have no parent (legacy or orphaned) still get created
        const flatTasks = libraryTasks.filter(t => !t.is_stage && t.parent_task_id == null);

        // Map: task_library.id → created inquiry_tasks.id (for linking children)
        const libraryToInquiryTask = new Map<number, number>();
        let globalOrder = 0;

        // Helper: resolve assignment for a task given its role and optional library default
        const resolveAssignment = (jobRoleId: number | null, defaultContributorId: number | null): { assigned_to_id: number | null; job_role_id: number | null } => {
            if (!jobRoleId) return { assigned_to_id: defaultContributorId, job_role_id: null };
            const matches = roleToContributors.get(jobRoleId);
            if (!matches || matches.length === 0) {
                // Fall back to task library's default contributor only if they actually hold the required role.
                if (defaultContributorId && contributorRoleAssignments.has(`${defaultContributorId}-${jobRoleId}`)) {
                    return { assigned_to_id: defaultContributorId, job_role_id: jobRoleId };
                }
                return { assigned_to_id: null, job_role_id: jobRoleId };
            }
            // Pick the first contributor (lowest order_index)
            return { assigned_to_id: matches[0].contributorId, job_role_id: jobRoleId };
        };

        // Helper: check if a trigger type requires per-crew multiplication
        const isCrewTrigger = (trigger: string): boolean =>
            trigger === 'per_crew_member' || trigger === 'per_activity_crew';

        // Helper: get crew members for a role (for per-crew triggers)
        const getCrewForRole = (jobRoleId: number | null): { contributorId: number | null; positionName: string }[] => {
            if (!jobRoleId) return [];
            return roleToContributors.get(jobRoleId) ?? [];
        };

        // Helper: calculate due date
        const calcDueDate = (lt: typeof libraryTasks[0]): Date | null => {
            if (lt.due_date_offset_days == null) return null;
            const refDate = lt.phase === 'Booking' && eventDate ? eventDate : inquiryRefDate;
            const d = new Date(refDate);
            d.setDate(d.getDate() + lt.due_date_offset_days);
            return d;
        };

        // Helper: create a single inquiry task record
        const createTask = async (
            lt: typeof libraryTasks[0],
            parentInquiryTaskId: number | null,
            assignedToId: number | null,
            jobRoleId: number | null,
            nameSuffix?: string,
        ) => {
            const record = await this.prisma.inquiry_tasks.create({
                data: {
                    inquiry_id: inquiryId,
                    task_library_id: lt.id,
                    parent_inquiry_task_id: parentInquiryTaskId,
                    name: nameSuffix ? `${lt.name} (${nameSuffix})` : lt.name,
                    description: lt.description,
                    phase: lt.phase,
                    trigger_type: lt.trigger_type,
                    estimated_hours: lt.effort_hours,
                    order_index: globalOrder++,
                    status: 'To_Do',
                    is_active: true,
                    is_stage: lt.is_stage,
                    stage_color: lt.stage_color,
                    due_date: lt.is_stage ? null : calcDueDate(lt),
                    assigned_to_id: lt.is_stage ? null : assignedToId,
                    job_role_id: lt.is_stage ? null : jobRoleId,
                },
            });
            return record;
        };

        // Helper: create task(s) for a library task, handling crew multiplication
        const createTasksForLibraryEntry = async (
            lt: typeof libraryTasks[0],
            parentInquiryTaskId: number | null,
        ) => {
            if (isCrewTrigger(lt.trigger_type) && lt.default_job_role_id) {
                const crewMembers = getCrewForRole(lt.default_job_role_id);
                if (crewMembers.length > 1) {
                    // Create one task per crew member
                    const records: { id: number }[] = [];
                    for (const crew of crewMembers) {
                        const record = await createTask(
                            lt,
                            parentInquiryTaskId,
                            crew.contributorId,
                            lt.default_job_role_id,
                            crew.positionName,
                        );
                        records.push(record);
                    }
                    // Map library task to first created task (for child linking)
                    if (records.length > 0) libraryToInquiryTask.set(lt.id, records[0].id);
                    return;
                }
                // Single crew or no crew — fall through to normal assignment
            }

            const { assigned_to_id, job_role_id } = resolveAssignment(lt.default_job_role_id, lt.default_contributor_id);
            const record = await createTask(lt, parentInquiryTaskId, assigned_to_id, job_role_id);
            libraryToInquiryTask.set(lt.id, record.id);
        };

        // 1. Create parent stage inquiry tasks
        for (const stage of stageTasks) {
            const stageRecord = await createTask(stage, null, null, null);
            libraryToInquiryTask.set(stage.id, stageRecord.id);

            // 2. Create child tasks under this stage
            const stageChildren = childTasks.filter(c => c.parent_task_id === stage.id);
            for (const lt of stageChildren) {
                await createTasksForLibraryEntry(lt, stageRecord.id);
            }
        }

        // 3. Create flat (non-hierarchical) tasks if any
        for (const lt of flatTasks) {
            await createTasksForLibraryEntry(lt, null);
        }

        return this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true },
            orderBy: [{ order_index: 'asc' }],
            include: {
                children: {
                    where: { is_active: true },
                    orderBy: [{ order_index: 'asc' }],
                },
            },
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

        const [updated] = await this.prisma.$transaction([
            this.prisma.inquiry_tasks.update({
                where: { id: task.id },
                data: {
                    status: 'Completed',
                    completed_at: new Date(),
                    completed_by_id: completedById ?? null,
                },
            }),
            this.prisma.inquiry_task_events.create({
                data: {
                    task_id: task.id,
                    event_type: 'AUTO_COMPLETE',
                    triggered_by: 'SYSTEM',
                    description: 'Automatically completed',
                },
            }),
        ]);

        // Auto-complete parent stage if all children done
        await this.syncParentStageStatus(updated.parent_inquiry_task_id, completedById);

        return updated;
    }

    /**
     * Get event history for a specific task.
     */
    async getTaskEvents(taskId: number) {
        return this.prisma.inquiry_task_events.findMany({
            where: { task_id: taskId },
            orderBy: { occurred_at: 'desc' },
        });
    }

    /**
     * Auto-assign unassigned inquiry tasks when a crew member is assigned to an operator slot.
     * Called by schedule service when ProjectDayOperator.contributor_id changes.
     */
    async autoAssignByRole(inquiryId: number, jobRoleId: number, contributorId: number | null) {
        if (!contributorId || !jobRoleId) return;

        const matchingRole = await this.prisma.contributor_job_roles.findFirst({
            where: { contributor_id: contributorId, job_role_id: jobRoleId },
            select: { contributor_id: true },
        });
        if (!matchingRole) return;

        // Find unassigned tasks for this inquiry that match the job role
        const unassigned = await this.prisma.inquiry_tasks.findMany({
            where: {
                inquiry_id: inquiryId,
                job_role_id: jobRoleId,
                assigned_to_id: null,
                is_active: true,
                is_stage: false,
            },
        });

        if (unassigned.length === 0) return;

        await this.prisma.inquiry_tasks.updateMany({
            where: {
                id: { in: unassigned.map(t => t.id) },
            },
            data: { assigned_to_id: contributorId },
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
