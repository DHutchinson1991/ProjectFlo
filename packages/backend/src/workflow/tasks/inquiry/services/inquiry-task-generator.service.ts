import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { InquiryTaskStatusService } from './inquiry-task-status.service';
import { getInquiryTaskSubtasksForName } from '../constants/inquiry-task-subtasks.constants';
import { TASK_INCLUDE } from '../constants/inquiry-task-includes';

@Injectable()
export class InquiryTaskGeneratorService {
    constructor(
        private prisma: PrismaService,
        private statusService: InquiryTaskStatusService,
    ) {}

    async generateForInquiry(inquiryId: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, archived_at: null, contact: { brand_id: brandId } },
            select: {
                id: true, wedding_date: true, event_type_id: true, selected_package_id: true,
                contact: { select: { email: true, phone_number: true } },
            },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);

        const libraryTasks = await this.prisma.task_library.findMany({
            where: { brand_id: brandId, is_active: true, phase: { in: ['Inquiry', 'Booking'] } },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        });
        if (libraryTasks.length === 0) return [];

        const operators = await this.prisma.projectCrewSlot.findMany({
            where: { inquiry_id: inquiryId },
            orderBy: [{ order_index: 'asc' }],
            select: { crew_member_id: true, job_role_id: true, label: true, job_role: { select: { display_name: true, name: true } } },
        });

        const roleToContributors = this.buildRoleToContributorsMap(operators);
        await this.prisma.inquiry_tasks.deleteMany({ where: { inquiry_id: inquiryId } });

        const inquiryRefDate = new Date();
        const eventDate = inquiry.wedding_date ? new Date(inquiry.wedding_date) : null;
        const stageTasks = libraryTasks.filter((t) => t.is_task_group);
        const childTasks = libraryTasks.filter((t) => !t.is_task_group && t.parent_task_id != null);
        const flatTasks = libraryTasks.filter((t) => !t.is_task_group && t.parent_task_id == null);
        let globalOrder = 0;

        const contributorRoleAssignments = await this.buildContributorRoleSet(operators);

        const resolveAssignment = (jobRoleId: number | null, defaultContributorId: number | null) => {
            if (!jobRoleId) return { assigned_to_id: defaultContributorId, job_role_id: null as number | null };
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
        const getCrewForRole = (jrId: number | null) => (jrId ? roleToContributors.get(jrId) ?? [] : []);
        const calcDueDate = (task: (typeof libraryTasks)[number]) => {
            if (task.due_date_offset_days == null) return null;
            const ref = task.phase === 'Booking' && eventDate ? eventDate : inquiryRefDate;
            const d = new Date(ref);
            d.setDate(d.getDate() + task.due_date_offset_days);
            return d;
        };

        const createDefaultSubtasks = async (inquiryTaskId: number, taskLibraryId: number | null, taskName: string, jobRoleId: number | null) => {
            let subtasks: Array<{ subtask_key: string; name: string; order_index: number; is_auto_only: boolean }> = [];
            if (taskLibraryId) {
                subtasks = await this.prisma.task_library_subtask_templates.findMany({
                    where: { task_library_id: taskLibraryId },
                    orderBy: { order_index: 'asc' },
                    select: { subtask_key: true, name: true, order_index: true, is_auto_only: true },
                });
            }
            if (subtasks.length === 0) subtasks = getInquiryTaskSubtasksForName(taskName);
            if (subtasks.length === 0) return;

            await this.prisma.inquiry_task_subtasks.createMany({
                data: subtasks.map((s) => ({
                    inquiry_task_id: inquiryTaskId, subtask_key: s.subtask_key,
                    name: s.name, order_index: s.order_index, status: 'To_Do',
                    is_auto_only: s.is_auto_only, job_role_id: jobRoleId,
                })),
            });
        };

        const createTask = async (
            task: (typeof libraryTasks)[number], parentInquiryTaskId: number | null,
            assignedToId: number | null, jobRoleId: number | null, nameSuffix?: string,
        ) => {
            const created = await this.prisma.inquiry_tasks.create({
                data: {
                    inquiry_id: inquiryId, task_library_id: task.id,
                    parent_inquiry_task_id: parentInquiryTaskId,
                    name: nameSuffix ? `${task.name} (${nameSuffix})` : task.name,
                    description: task.description, phase: task.phase, trigger_type: task.trigger_type,
                    estimated_hours: task.effort_hours, order_index: globalOrder++,
                    status: 'To_Do', is_active: true, is_task_group: task.is_task_group,
                    due_date: task.is_task_group ? null : calcDueDate(task),
                    assigned_to_id: task.is_task_group ? null : assignedToId,
                    job_role_id: task.is_task_group ? null : jobRoleId,
                },
            });
            if (!task.is_task_group) {
                await createDefaultSubtasks(created.id, task.id, created.name, jobRoleId);
                await this.statusService.syncTaskStatusFromSubtasks(created.id);
            }
            return created;
        };

        const createTasksForLibraryEntry = async (
            task: (typeof libraryTasks)[number], parentInquiryTaskId: number | null,
        ) => {
            if (isCrewTrigger(task.trigger_type) && task.default_job_role_id) {
                const crew = getCrewForRole(task.default_job_role_id);
                if (crew.length > 1) {
                    for (const member of crew) {
                        await createTask(task, parentInquiryTaskId, member.contributorId, task.default_job_role_id, member.label);
                    }
                    return;
                }
            }
            const { assigned_to_id, job_role_id } = resolveAssignment(task.default_job_role_id, task.default_contributor_id);
            await createTask(task, parentInquiryTaskId, assigned_to_id, job_role_id);
        };

        for (const stage of stageTasks) {
            const stageRecord = await createTask(stage, null, null, null);
            for (const child of childTasks.filter((t) => t.parent_task_id === stage.id)) {
                await createTasksForLibraryEntry(child, stageRecord.id);
            }
        }
        for (const flat of flatTasks) await createTasksForLibraryEntry(flat, null);

        await this.statusService.syncReviewInquiryAutoSubtasks(inquiryId);

        return this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true },
            orderBy: [{ order_index: 'asc' }],
            include: TASK_INCLUDE,
        });
    }

    private async buildContributorRoleSet(
        operators: { crew_member_id: number | null; job_role_id: number | null }[],
    ): Promise<Set<string>> {
        const ids = operators.filter((op) => op.crew_member_id).map((op) => op.crew_member_id as number);
        const roles = ids.length > 0
            ? await this.prisma.crewMemberJobRole.findMany({
                where: { crew_member_id: { in: ids } },
                select: { crew_member_id: true, job_role_id: true },
            })
            : [];
        return new Set(roles.map((a) => `${a.crew_member_id}-${a.job_role_id}`));
    }

    private buildRoleToContributorsMap(
        operators: { crew_member_id: number | null; job_role_id: number | null; label: string | null; job_role: { display_name: string | null; name: string } | null }[],
    ): Map<number, { contributorId: number | null; label: string | null }[]> {
        const map = new Map<number, { contributorId: number | null; label: string | null }[]>();
        for (const op of operators) {
            if (!op.job_role_id || !op.crew_member_id) continue;
            if (!map.has(op.job_role_id)) map.set(op.job_role_id, []);
            map.get(op.job_role_id)?.push({ contributorId: op.crew_member_id, label: op.label ?? op.job_role?.display_name ?? op.job_role?.name ?? null });
        }
        return map;
    }
}
