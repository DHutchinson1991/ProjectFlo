import { BadRequestException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInquiryTaskDto } from './dto/inquiry-tasks.dto';
import {
    getInquiryTaskSubtasksForName,
    type InquiryTaskSubtaskKey,
} from './inquiry-task-subtasks.constants';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class InquiryTasksService {
    private readonly logger = new Logger(InquiryTasksService.name);
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => ContractsService))
        private contractsService: ContractsService,
    ) {}

    async findAllForInquiry(inquiryId: number, brandId: number) {
        await this.verifyInquiryOwnership(inquiryId, brandId);

        return this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true },
            orderBy: [{ order_index: 'asc' }],
            include: this.taskInclude,
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

        const updated = await this.prisma.inquiry_tasks.update({
            where: { id: taskId },
            data,
        });

        if (dto.status) {
            await this.syncParentStageStatus(updated.parent_inquiry_task_id);
        }

        return updated;
    }

    async toggle(inquiryId: number, taskId: number, brandId: number, completedById?: number) {
        await this.verifyOwnership(inquiryId, taskId, brandId);
        return this.toggleTaskById(taskId, completedById);
    }

    async toggleTaskById(taskId: number, completedById?: number) {
        const task = await this.prisma.inquiry_tasks.findUnique({ where: { id: taskId } });
        if (!task) {
            throw new NotFoundException(`Inquiry task ${taskId} not found`);
        }

        await this.ensureDirectTaskMutationAllowed(task.id);

        const isCompleted = task.status === 'Completed';
        const updated = await this.prisma.inquiry_tasks.update({
            where: { id: taskId },
            data: isCompleted
                ? { status: 'To_Do', completed_at: null, completed_by_id: null }
                : { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
        });

        await this.syncParentStageStatus(updated.parent_inquiry_task_id, completedById);
        return updated;
    }

    async toggleSubtask(inquiryId: number, subtaskId: number, brandId: number, completedById?: number) {
        const subtask = await this.prisma.inquiry_task_subtasks.findFirst({
            where: {
                id: subtaskId,
                inquiry_task: {
                    inquiry_id: inquiryId,
                    inquiry: {
                        archived_at: null,
                        contact: { brand_id: brandId },
                    },
                },
            },
            include: {
                inquiry_task: { select: { id: true } },
            },
        });

        if (!subtask) {
            throw new NotFoundException(`Subtask ${subtaskId} not found for inquiry ${inquiryId}`);
        }

        if (subtask.is_auto_only) {
            throw new BadRequestException('Auto subtasks cannot be manually toggled');
        }

        return this.toggleSubtaskById(subtaskId, completedById);
    }

    async toggleSubtaskById(subtaskId: number, completedById?: number) {
        const subtask = await this.prisma.inquiry_task_subtasks.findUnique({
            where: { id: subtaskId },
            include: {
                inquiry_task: {
                    select: {
                        id: true,
                        inquiry_id: true,
                        parent_inquiry_task_id: true,
                    },
                },
            },
        });

        if (!subtask) {
            throw new NotFoundException(`Inquiry subtask ${subtaskId} not found`);
        }

        if (subtask.is_auto_only) {
            throw new BadRequestException('Auto subtasks cannot be manually toggled');
        }

        const isCompleted = subtask.status === 'Completed';
        const updated = await this.prisma.inquiry_task_subtasks.update({
            where: { id: subtaskId },
            data: isCompleted
                ? { status: 'To_Do', completed_at: null, completed_by_id: null }
                : { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null },
        });

        await this.syncTaskStatusFromSubtasks(subtask.inquiry_task_id, completedById);

        if (!isCompleted && updated.status === 'Completed') {
            await this.handleSubtaskCompletionSideEffects(
                subtask.inquiry_task.inquiry_id,
                subtask.subtask_key as InquiryTaskSubtaskKey,
            );
        }

        return updated;
    }

    async syncReviewInquiryAutoSubtasks(inquiryId: number) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: {
                id: true,
                wedding_date: true,
                event_type_id: true,
                selected_package_id: true,
                contact: {
                    select: {
                        email: true,
                        phone_number: true,
                    },
                },
            },
        });

        if (!inquiry) {
            return;
        }

        await this.setAutoSubtaskStatus(inquiryId, 'verify_contact_details', Boolean(inquiry.contact?.email && inquiry.contact?.phone_number));
        await this.setAutoSubtaskStatus(inquiryId, 'verify_event_date', Boolean(inquiry.wedding_date));
        await this.setAutoSubtaskStatus(inquiryId, 'verify_event_type', Boolean(inquiry.event_type_id));
        await this.setAutoSubtaskStatus(inquiryId, 'confirm_package_selection', Boolean(inquiry.selected_package_id));
    }

    async setAutoSubtaskStatus(inquiryId: number, subtaskKey: InquiryTaskSubtaskKey, isComplete: boolean, completedById?: number) {
        const subtasks = await this.prisma.inquiry_task_subtasks.findMany({
            where: {
                subtask_key: subtaskKey,
                inquiry_task: {
                    inquiry_id: inquiryId,
                    is_active: true,
                },
            },
            select: { id: true, inquiry_task_id: true, status: true },
        });

        if (subtasks.length === 0) {
            return [];
        }

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

    async generateForInquiry(inquiryId: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                archived_at: null,
                contact: { brand_id: brandId },
            },
            select: {
                id: true,
                wedding_date: true,
                event_type_id: true,
                selected_package_id: true,
                contact: {
                    select: {
                        email: true,
                        phone_number: true,
                    },
                },
            },
        });
        if (!inquiry) {
            throw new NotFoundException(`Inquiry ${inquiryId} not found`);
        }

        const libraryTasks = await this.prisma.task_library.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
                phase: { in: ['Inquiry', 'Booking'] },
            },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        });

        if (libraryTasks.length === 0) {
            return [];
        }

        const operators = await this.prisma.projectDayOperator.findMany({
            where: { inquiry_id: inquiryId },
            orderBy: [{ order_index: 'asc' }],
            select: { contributor_id: true, job_role_id: true, position_name: true },
        });

        const operatorContributorIds = operators
            .filter((operator) => operator.contributor_id)
            .map((operator) => operator.contributor_id as number);
        const contributorJobRoles = operatorContributorIds.length > 0
            ? await this.prisma.contributor_job_roles.findMany({
                where: { contributor_id: { in: operatorContributorIds } },
                select: { contributor_id: true, job_role_id: true },
            })
            : [];
        const contributorRoleAssignments = new Set(
            contributorJobRoles.map((assignment) => `${assignment.contributor_id}-${assignment.job_role_id}`),
        );

        const roleToContributors = new Map<number, { contributorId: number | null; positionName: string }[]>();
        for (const operator of operators) {
            if (!operator.job_role_id || !operator.contributor_id) {
                continue;
            }
            if (!contributorRoleAssignments.has(`${operator.contributor_id}-${operator.job_role_id}`)) {
                continue;
            }
            if (!roleToContributors.has(operator.job_role_id)) {
                roleToContributors.set(operator.job_role_id, []);
            }
            roleToContributors.get(operator.job_role_id)?.push({
                contributorId: operator.contributor_id,
                positionName: operator.position_name,
            });
        }

        await this.prisma.inquiry_tasks.deleteMany({ where: { inquiry_id: inquiryId } });

        const inquiryRefDate = new Date();
        const eventDate = inquiry.wedding_date ? new Date(inquiry.wedding_date) : null;
        const stageTasks = libraryTasks.filter((task) => task.is_stage);
        const childTasks = libraryTasks.filter((task) => !task.is_stage && task.parent_task_id != null);
        const flatTasks = libraryTasks.filter((task) => !task.is_stage && task.parent_task_id == null);
        let globalOrder = 0;

        const resolveAssignment = (jobRoleId: number | null, defaultContributorId: number | null) => {
            if (!jobRoleId) {
                return { assigned_to_id: defaultContributorId, job_role_id: null as number | null };
            }
            const matches = roleToContributors.get(jobRoleId);
            if (!matches || matches.length === 0) {
                if (defaultContributorId && contributorRoleAssignments.has(`${defaultContributorId}-${jobRoleId}`)) {
                    return { assigned_to_id: defaultContributorId, job_role_id: jobRoleId };
                }
                return { assigned_to_id: null, job_role_id: jobRoleId };
            }
            return { assigned_to_id: matches[0].contributorId, job_role_id: jobRoleId };
        };

        const isCrewTrigger = (trigger: string) => trigger === 'per_crew_member' || trigger === 'per_activity_crew';
        const getCrewForRole = (jobRoleId: number | null) => (jobRoleId ? roleToContributors.get(jobRoleId) ?? [] : []);
        const calcDueDate = (task: (typeof libraryTasks)[number]) => {
            if (task.due_date_offset_days == null) {
                return null;
            }
            const referenceDate = task.phase === 'Booking' && eventDate ? eventDate : inquiryRefDate;
            const dueDate = new Date(referenceDate);
            dueDate.setDate(dueDate.getDate() + task.due_date_offset_days);
            return dueDate;
        };

        const createDefaultSubtasks = async (inquiryTaskId: number, taskLibraryId: number | null, taskName: string, jobRoleId: number | null) => {
            // Primary: look up subtask templates from the task_library_subtask_templates table (ID-based)
            let subtasks: Array<{ subtask_key: string; name: string; order_index: number; is_auto_only: boolean }> = [];
            if (taskLibraryId) {
                subtasks = await this.prisma.task_library_subtask_templates.findMany({
                    where: { task_library_id: taskLibraryId },
                    orderBy: { order_index: 'asc' },
                    select: { subtask_key: true, name: true, order_index: true, is_auto_only: true },
                });
            }

            // Fallback: use constants file (for backwards compatibility during migration)
            if (subtasks.length === 0) {
                subtasks = getInquiryTaskSubtasksForName(taskName);
            }

            if (subtasks.length === 0) {
                return;
            }

            await this.prisma.inquiry_task_subtasks.createMany({
                data: subtasks.map((subtask) => ({
                    inquiry_task_id: inquiryTaskId,
                    subtask_key: subtask.subtask_key,
                    name: subtask.name,
                    order_index: subtask.order_index,
                    status: 'To_Do',
                    is_auto_only: subtask.is_auto_only,
                    job_role_id: jobRoleId,
                })),
            });
        };

        const createTask = async (
            task: (typeof libraryTasks)[number],
            parentInquiryTaskId: number | null,
            assignedToId: number | null,
            jobRoleId: number | null,
            nameSuffix?: string,
        ) => {
            const createdTask = await this.prisma.inquiry_tasks.create({
                data: {
                    inquiry_id: inquiryId,
                    task_library_id: task.id,
                    parent_inquiry_task_id: parentInquiryTaskId,
                    name: nameSuffix ? `${task.name} (${nameSuffix})` : task.name,
                    description: task.description,
                    phase: task.phase,
                    trigger_type: task.trigger_type,
                    estimated_hours: task.effort_hours,
                    order_index: globalOrder++,
                    status: 'To_Do',
                    is_active: true,
                    is_stage: task.is_stage,
                    stage_color: task.stage_color,
                    due_date: task.is_stage ? null : calcDueDate(task),
                    assigned_to_id: task.is_stage ? null : assignedToId,
                    job_role_id: task.is_stage ? null : jobRoleId,
                },
            });

            if (!task.is_stage) {
                await createDefaultSubtasks(createdTask.id, task.id, createdTask.name, jobRoleId);
                await this.syncTaskStatusFromSubtasks(createdTask.id);
            }

            return createdTask;
        };

        const createTasksForLibraryEntry = async (
            task: (typeof libraryTasks)[number],
            parentInquiryTaskId: number | null,
        ) => {
            if (isCrewTrigger(task.trigger_type) && task.default_job_role_id) {
                const crewMembers = getCrewForRole(task.default_job_role_id);
                if (crewMembers.length > 1) {
                    for (const crewMember of crewMembers) {
                        await createTask(
                            task,
                            parentInquiryTaskId,
                            crewMember.contributorId,
                            task.default_job_role_id,
                            crewMember.positionName,
                        );
                    }
                    return;
                }
            }

            const { assigned_to_id, job_role_id } = resolveAssignment(task.default_job_role_id, task.default_contributor_id);
            await createTask(task, parentInquiryTaskId, assigned_to_id, job_role_id);
        };

        for (const stage of stageTasks) {
            const stageRecord = await createTask(stage, null, null, null);
            const stageChildren = childTasks.filter((task) => task.parent_task_id === stage.id);
            for (const childTask of stageChildren) {
                await createTasksForLibraryEntry(childTask, stageRecord.id);
            }
        }

        for (const flatTask of flatTasks) {
            await createTasksForLibraryEntry(flatTask, null);
        }

        await this.syncReviewInquiryAutoSubtasks(inquiryId);

        return this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true },
            orderBy: [{ order_index: 'asc' }],
            include: this.taskInclude,
        });
    }

    async autoCompleteByName(inquiryId: number, taskName: string, completedById?: number, force = false) {
        const task = await this.prisma.inquiry_tasks.findFirst({
            where: {
                inquiry_id: inquiryId,
                name: taskName,
                is_active: true,
                status: { not: 'Completed' },
            },
        });
        if (!task) {
            this.logger.warn(`autoCompleteByName: task "${taskName}" not found for inquiry ${inquiryId} (active + non-completed)`);
            return null;
        }

        if (!force) {
            await this.ensureDirectTaskMutationAllowed(task.id);
        }

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

        await this.syncParentStageStatus(updated.parent_inquiry_task_id, completedById);
        return updated;
    }

    async getTaskEvents(taskId: number) {
        return this.prisma.inquiry_task_events.findMany({
            where: { task_id: taskId },
            orderBy: { occurred_at: 'desc' },
        });
    }

    async autoAssignByRole(inquiryId: number, jobRoleId: number, contributorId: number | null) {
        if (!contributorId || !jobRoleId) {
            return;
        }

        const matchingRole = await this.prisma.contributor_job_roles.findFirst({
            where: { contributor_id: contributorId, job_role_id: jobRoleId },
            select: { contributor_id: true },
        });
        if (!matchingRole) {
            return;
        }

        const unassigned = await this.prisma.inquiry_tasks.findMany({
            where: {
                inquiry_id: inquiryId,
                job_role_id: jobRoleId,
                assigned_to_id: null,
                is_active: true,
                is_stage: false,
            },
        });

        if (unassigned.length === 0) {
            return;
        }

        await this.prisma.inquiry_tasks.updateMany({
            where: { id: { in: unassigned.map((task) => task.id) } },
            data: { assigned_to_id: contributorId },
        });
    }

    private async ensureDirectTaskMutationAllowed(taskId: number) {
        const subtaskCount = await this.prisma.inquiry_task_subtasks.count({
            where: { inquiry_task_id: taskId },
        });
        if (subtaskCount > 0) {
            throw new BadRequestException('Tasks with subtasks must be completed from their subtasks');
        }
    }

    private async syncTaskStatusFromSubtasks(taskId: number, completedById?: number) {
        const task = await this.prisma.inquiry_tasks.findUnique({
            where: { id: taskId },
            select: { id: true, status: true, parent_inquiry_task_id: true },
        });
        if (!task) {
            return;
        }

        const subtasks = await this.prisma.inquiry_task_subtasks.findMany({
            where: { inquiry_task_id: taskId },
            select: { status: true },
        });
        if (subtasks.length === 0) {
            return;
        }

        const allCompleted = subtasks.every((subtask) => subtask.status === 'Completed');
        const anyCompleted = subtasks.some((subtask) => subtask.status === 'Completed');
        const anyInProgress = subtasks.some((subtask) => subtask.status === 'In_Progress');
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

    private async syncParentStageStatus(parentId: number | null, completedById?: number) {
        if (!parentId) {
            return;
        }

        const parent = await this.prisma.inquiry_tasks.findUnique({ where: { id: parentId } });
        if (!parent || !parent.is_stage) {
            return;
        }

        const children = await this.prisma.inquiry_tasks.findMany({
            where: { parent_inquiry_task_id: parentId, is_active: true },
            select: { status: true },
        });
        if (children.length === 0) {
            return;
        }

        const allCompleted = children.every((child) => child.status === 'Completed');
        const anyCompleted = children.some((child) => child.status === 'Completed');
        const anyInProgress = children.some((child) => child.status === 'In_Progress');
        const nextStatus = allCompleted ? 'Completed' : (anyInProgress || anyCompleted) ? 'In_Progress' : 'To_Do';

        if (parent.status === nextStatus) {
            return;
        }

        await this.prisma.inquiry_tasks.update({
            where: { id: parentId },
            data: allCompleted
                ? { status: 'Completed', completed_at: new Date(), completed_by_id: completedById ?? null }
                : { status: nextStatus, completed_at: null, completed_by_id: null },
        });
    }

    private async verifyInquiryOwnership(inquiryId: number, brandId: number) {
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
        return inquiry;
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

    private async handleSubtaskCompletionSideEffects(inquiryId: number, subtaskKey: InquiryTaskSubtaskKey) {
        if (subtaskKey === 'mark_inquiry_qualified') {
            const inquiry = await this.prisma.inquiries.update({
                where: { id: inquiryId },
                data: { status: 'Qualified' },
                include: {
                    contact: { select: { first_name: true, last_name: true, brand_id: true } },
                    event_type: { select: { name: true } },
                },
            });

            // Auto-create PSA contract on qualification
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
                            .filter(Boolean)
                            .join(' ')
                            .trim() || 'Client';
                        const eventType = inquiry.event_type?.name || 'Event';
                        const title = `${contactName} ${eventType} Professional Services Agreement`;
                        await this.contractsService.composeFromTemplate(inquiryId, brandId, {
                            template_id: psaTemplate.id,
                            title,
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

            if (!inquiry) {
                return;
            }

            await this.prisma.communications_log.create({
                data: {
                    contact_id: inquiry.contact_id,
                    type: 'welcome_outreach',
                    notes: 'Welcome response sent from Qualify & Respond card.',
                },
            });
        }
    }

    private readonly taskInclude = {
        task_library: {
            select: {
                id: true,
                name: true,
                effort_hours: true,
                trigger_type: true,
                is_stage: true,
                stage_color: true,
                parent_task_id: true,
                is_auto_only: true,
            },
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
            select: { id: true, name: true, display_name: true },
        },
        subtasks: {
            orderBy: [{ order_index: 'asc' as const }],
            include: {
                completed_by: {
                    select: {
                        id: true,
                        contact: { select: { first_name: true, last_name: true, email: true } },
                    },
                },
                job_role: {
                    select: { id: true, name: true, display_name: true },
                },
            },
        },
        children: {
            where: { is_active: true },
            orderBy: [{ order_index: 'asc' as const }],
            include: {
                task_library: {
                    select: { id: true, name: true, effort_hours: true, trigger_type: true, is_auto_only: true },
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
                    select: { id: true, name: true, display_name: true },
                },
                subtasks: {
                    orderBy: [{ order_index: 'asc' as const }],
                    include: {
                        completed_by: {
                            select: {
                                id: true,
                                contact: { select: { first_name: true, last_name: true, email: true } },
                            },
                        },
                        job_role: {
                            select: { id: true, name: true, display_name: true },
                        },
                    },
                },
            },
        },
    };
}
