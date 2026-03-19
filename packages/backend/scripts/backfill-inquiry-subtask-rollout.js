/**
 * Rebuild inquiry subtasks for the approved Review Inquiry / Qualify & Respond rollout.
 *
 * Usage:
 *   node scripts/backfill-inquiry-subtask-rollout.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REVIEW_SUBTASKS = [
    { subtask_key: 'verify_submission_data', name: 'Verify Submission Data', order_index: 1, is_auto_only: true },
    { subtask_key: 'confirm_package_selection', name: 'Confirm Package Selection', order_index: 2, is_auto_only: true },
    { subtask_key: 'check_crew_availability', name: 'Check Crew Availability', order_index: 3, is_auto_only: true },
    { subtask_key: 'check_equipment_availability', name: 'Check Equipment Availability', order_index: 4, is_auto_only: true },
    { subtask_key: 'resolve_availability_conflicts', name: 'Resolve Availability Conflicts', order_index: 5, is_auto_only: true },
    { subtask_key: 'send_crew_availability_requests', name: 'Send Availability Requests', order_index: 6, is_auto_only: true },
    { subtask_key: 'reserve_equipment', name: 'Reserve Equipment', order_index: 7, is_auto_only: true },
]

const QUALIFY_SUBTASKS = [
    { subtask_key: 'mark_inquiry_qualified', name: 'Qualify Inquiry', order_index: 1, is_auto_only: false },
    { subtask_key: 'send_welcome_response', name: 'Send Welcome Response', order_index: 2, is_auto_only: false },
]

function combineDateAndTime(date, time) {
    const [hours = '0', minutes = '0'] = String(time || '00:00').split(':');
    const result = new Date(date);
    result.setHours(Number(hours), Number(minutes), 0, 0);
    return result;
}

function getEventDayRange(eventDay) {
    const start = combineDateAndTime(eventDay.date, eventDay.start_time || '00:00');
    const end = combineDateAndTime(eventDay.date, eventDay.end_time || '23:59');
    return {
        start,
        end: end > start ? end : combineDateAndTime(eventDay.date, '23:59'),
    };
}

function rangesOverlap(left, right) {
    return left.start < right.end && left.end > right.start;
}

function sameDay(left, right) {
    return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

async function computeCrewAvailabilityComplete(inquiryId) {
    const slots = await prisma.projectDayOperator.findMany({
        where: { inquiry_id: inquiryId, contributor_id: { not: null } },
        include: {
            project_event_day: { select: { date: true, start_time: true, end_time: true } },
        },
    });

    if (slots.length === 0) {
        return false;
    }

    for (const slot of slots) {
        const currentRange = getEventDayRange(slot.project_event_day);
        const bookings = await prisma.projectDayOperator.findMany({
            where: {
                contributor_id: slot.contributor_id,
                NOT: { inquiry_id: inquiryId },
                OR: [
                    {
                        project_id: { not: null },
                        project: { archived_at: null },
                    },
                    {
                        inquiry_id: { not: null },
                        inquiry: {
                            archived_at: null,
                            status: 'Booked',
                        },
                    },
                ],
            },
            include: {
                project_event_day: { select: { date: true, start_time: true, end_time: true } },
            },
        });

        const hasConflict = bookings.some((booking) => {
            if (!sameDay(booking.project_event_day.date, currentRange.start)) {
                return false;
            }
            return rangesOverlap(getEventDayRange(booking.project_event_day), currentRange);
        });

        if (hasConflict) {
            return false;
        }
    }

    return true;
}

async function computeEquipmentAvailabilityComplete(inquiryId) {
    const assignments = await prisma.projectDayOperatorEquipment.findMany({
        where: {
            project_day_operator: {
                inquiry_id: inquiryId,
            },
        },
        include: {
            project_day_operator: {
                include: {
                    project_event_day: { select: { date: true, start_time: true, end_time: true } },
                },
            },
        },
    });

    if (assignments.length === 0) {
        return false;
    }

    for (const assignment of assignments) {
        const currentRange = getEventDayRange(assignment.project_day_operator.project_event_day);
        const bookings = await prisma.projectDayOperatorEquipment.findMany({
            where: {
                equipment_id: assignment.equipment_id,
                project_day_operator: {
                    NOT: { inquiry_id: inquiryId },
                    OR: [
                        {
                            project_id: { not: null },
                            project: { archived_at: null },
                        },
                        {
                            inquiry_id: { not: null },
                            inquiry: {
                                archived_at: null,
                                status: 'Booked',
                            },
                        },
                    ],
                },
            },
            include: {
                project_day_operator: {
                    include: {
                        project_event_day: { select: { date: true, start_time: true, end_time: true } },
                    },
                },
            },
        });

        const hasConflict = bookings.some((booking) => {
            if (!sameDay(booking.project_day_operator.project_event_day.date, currentRange.start)) {
                return false;
            }
            return rangesOverlap(getEventDayRange(booking.project_day_operator.project_event_day), currentRange);
        });

        if (hasConflict) {
            return false;
        }
    }

    return true;
}

async function applySubtaskStatus(taskId, subtaskKey, isComplete) {
    await prisma.inquiry_task_subtasks.updateMany({
        where: { inquiry_task_id: taskId, subtask_key: subtaskKey },
        data: isComplete
            ? { status: 'Completed', completed_at: new Date() }
            : { status: 'To_Do', completed_at: null, completed_by_id: null },
    });
}

async function syncTaskStatusFromSubtasks(taskId) {
    const subtasks = await prisma.inquiry_task_subtasks.findMany({
        where: { inquiry_task_id: taskId },
        select: { status: true },
    });

    if (subtasks.length === 0) {
        return;
    }

    const nextStatus = subtasks.every((subtask) => subtask.status === 'Completed') ? 'Completed' : 'To_Do';

    await prisma.inquiry_tasks.update({
        where: { id: taskId },
        data: nextStatus === 'Completed'
            ? { status: 'Completed', completed_at: new Date() }
            : { status: 'To_Do', completed_at: null, completed_by_id: null },
    });
}

async function rebuildTaskSubtasks(task, templates) {
    await prisma.inquiry_task_subtasks.deleteMany({
        where: { inquiry_task_id: task.id },
    });

    await prisma.inquiry_task_subtasks.createMany({
        data: templates.map((template) => ({
            inquiry_task_id: task.id,
            subtask_key: template.subtask_key,
            name: template.name,
            order_index: template.order_index,
            is_auto_only: template.is_auto_only,
            job_role_id: task.job_role_id ?? null,
        })),
    });
}

async function main() {
    const tasks = await prisma.inquiry_tasks.findMany({
        where: {
            name: { in: ['Review Inquiry', 'Qualify & Respond'] },
            is_active: true,
        },
        select: {
            id: true,
            inquiry_id: true,
            name: true,
            job_role_id: true,
            inquiry: {
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
            },
        },
        orderBy: [{ inquiry_id: 'asc' }, { order_index: 'asc' }],
    });

    if (tasks.length === 0) {
        console.log('No matching inquiry tasks found.');
        return;
    }

    let rebuilt = 0;

    for (const task of tasks) {
        const templates = task.name === 'Review Inquiry' ? REVIEW_SUBTASKS : QUALIFY_SUBTASKS;
        await rebuildTaskSubtasks(task, templates);

        if (task.name === 'Review Inquiry') {
            const hasSubmissionData = Boolean(
                task.inquiry.contact?.email &&
                task.inquiry.contact?.phone_number &&
                task.inquiry.wedding_date &&
                task.inquiry.event_type_id
            );

            const hasPackageSelection = Boolean(task.inquiry.selected_package_id);

            const crewAvailabilityComplete = await computeCrewAvailabilityComplete(task.inquiry_id);
            const equipmentAvailabilityComplete = await computeEquipmentAvailabilityComplete(task.inquiry_id);

            const assignedContributorIds = [
                ...new Set(
                    (await prisma.projectDayOperator.findMany({
                        where: { inquiry_id: task.inquiry_id, contributor_id: { not: null } },
                        select: { contributor_id: true },
                    })).map((row) => row.contributor_id)
                ),
            ].filter(Boolean);

            const requests = await prisma.inquiry_availability_requests.findMany({
                where: { inquiry_id: task.inquiry_id },
                select: { contributor_id: true, status: true },
            });

            const sentContributorIds = new Set(
                requests
                    .filter((request) => request.status !== 'cancelled')
                    .map((request) => request.contributor_id)
            );

            const requestsComplete =
                assignedContributorIds.length > 0 &&
                assignedContributorIds.every((contributorId) => sentContributorIds.has(contributorId));

            const assignmentIds = (await prisma.projectDayOperatorEquipment.findMany({
                where: { project_day_operator: { inquiry_id: task.inquiry_id } },
                select: { id: true },
            })).map((row) => row.id);

            const reservedAssignmentIds = new Set(
                (await prisma.inquiry_equipment_reservations.findMany({
                    where: { inquiry_id: task.inquiry_id, status: 'reserved' },
                    select: { project_day_operator_equipment_id: true },
                })).map((row) => row.project_day_operator_equipment_id)
            );

            const reservationsComplete =
                assignmentIds.length > 0 &&
                assignmentIds.every((assignmentId) => reservedAssignmentIds.has(assignmentId));

            await applySubtaskStatus(task.id, 'verify_submission_data', hasSubmissionData);
            await applySubtaskStatus(task.id, 'confirm_package_selection', hasPackageSelection);
            await applySubtaskStatus(task.id, 'check_crew_availability', crewAvailabilityComplete);
            await applySubtaskStatus(task.id, 'check_equipment_availability', equipmentAvailabilityComplete);
            await applySubtaskStatus(task.id, 'send_crew_availability_requests', requestsComplete);
            await applySubtaskStatus(task.id, 'reserve_equipment', reservationsComplete);
        }

        await syncTaskStatusFromSubtasks(task.id);
        rebuilt += 1;
        console.log(`Rebuilt subtasks for inquiry task ${task.id} (${task.name})`);
    }

    console.log(`Finished rebuilding subtasks for ${rebuilt} inquiry tasks.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });