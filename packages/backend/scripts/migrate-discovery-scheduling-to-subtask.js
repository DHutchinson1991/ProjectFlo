/**
 * migrate-discovery-scheduling-to-subtask.js
 *
 * Moves "Discovery Call Scheduling" from a standalone task in the Discovery
 * stage to a subtask ("Schedule Discovery Call") under "Qualify & Respond".
 *
 * What it does:
 * 1. Deactivates the "Discovery Call Scheduling" task_library entry
 * 2. For each active inquiry:
 *    a. Deletes the standalone "Discovery Call Scheduling" inquiry_task
 *    b. Ensures "Qualify & Respond" has the "schedule_discovery_call" subtask
 *    c. Preserves completion state if the old task was completed
 *
 * Safe to re-run — checks for existing subtasks before creating.
 *
 * Run from packages/backend:
 *   node scripts/migrate-discovery-scheduling-to-subtask.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== Migrate Discovery Call Scheduling → Subtask ===\n');

    // ─── 1. Deactivate "Discovery Call Scheduling" in task_library ───
    const deactivated = await prisma.task_library.updateMany({
        where: { name: 'Discovery Call Scheduling', is_active: true },
        data: { is_active: false },
    });
    console.log(`[1] Deactivated ${deactivated.count} task_library entries for "Discovery Call Scheduling"\n`);

    // ─── 2. Process each active inquiry ──────────────────────────────
    const inquiries = await prisma.inquiries.findMany({
        where: { archived_at: null },
        select: { id: true },
        orderBy: { id: 'asc' },
    });

    console.log(`Found ${inquiries.length} active inquiries to check.\n`);

    let removed = 0;
    let subtasksCreated = 0;
    let alreadyHadSubtask = 0;
    let noQualifyTask = 0;
    let noDiscoveryTask = 0;

    for (const inquiry of inquiries) {
        const inquiryId = inquiry.id;

        // Find the standalone "Discovery Call Scheduling" task
        const discoverySchedulingTask = await prisma.inquiry_tasks.findFirst({
            where: {
                inquiry_id: inquiryId,
                name: 'Discovery Call Scheduling',
                is_active: true,
            },
            select: {
                id: true,
                status: true,
                completed_at: true,
                completed_by_id: true,
                assigned_to_id: true,
                job_role_id: true,
            },
        });

        if (!discoverySchedulingTask) {
            noDiscoveryTask++;
            continue;
        }

        // Find the "Qualify & Respond" task
        const qualifyTask = await prisma.inquiry_tasks.findFirst({
            where: {
                inquiry_id: inquiryId,
                name: 'Qualify & Respond',
                is_active: true,
            },
            select: { id: true, job_role_id: true },
        });

        if (!qualifyTask) {
            console.warn(`  [WARN] Inquiry ${inquiryId}: has "Discovery Call Scheduling" but no "Qualify & Respond" task — skipping`);
            noQualifyTask++;
            continue;
        }

        // Check if subtask already exists
        const existingSubtask = await prisma.inquiry_task_subtasks.findFirst({
            where: {
                inquiry_task_id: qualifyTask.id,
                subtask_key: 'schedule_discovery_call',
            },
        });

        if (existingSubtask) {
            alreadyHadSubtask++;
        } else {
            // Determine completion status from the old standalone task
            const wasCompleted = discoverySchedulingTask.status === 'Completed';

            // Create the subtask under "Qualify & Respond"
            await prisma.inquiry_task_subtasks.create({
                data: {
                    inquiry_task_id: qualifyTask.id,
                    subtask_key: 'schedule_discovery_call',
                    name: 'Schedule Discovery Call',
                    order_index: 1,
                    status: wasCompleted ? 'Completed' : 'To_Do',
                    is_auto_only: false,
                    job_role_id: qualifyTask.job_role_id,
                    completed_at: wasCompleted ? discoverySchedulingTask.completed_at : null,
                    completed_by_id: wasCompleted ? discoverySchedulingTask.completed_by_id : null,
                },
            });
            subtasksCreated++;

            // Re-index existing subtasks to make room (push others after order 1)
            const otherSubtasks = await prisma.inquiry_task_subtasks.findMany({
                where: {
                    inquiry_task_id: qualifyTask.id,
                    subtask_key: { not: 'schedule_discovery_call' },
                },
                orderBy: { order_index: 'asc' },
            });

            for (let i = 0; i < otherSubtasks.length; i++) {
                await prisma.inquiry_task_subtasks.update({
                    where: { id: otherSubtasks[i].id },
                    data: { order_index: i + 2 }, // start at 2 since schedule_discovery_call is 1
                });
            }
        }

        // Delete subtasks of the standalone task first (FK constraint)
        await prisma.inquiry_task_subtasks.deleteMany({
            where: { inquiry_task_id: discoverySchedulingTask.id },
        });

        // Delete the standalone "Discovery Call Scheduling" task
        await prisma.inquiry_tasks.delete({
            where: { id: discoverySchedulingTask.id },
        });
        removed++;

        // Sync auto-subtask completion states (verify_submission_data, confirm_package_selection)
        await syncAutoSubtasks(inquiryId);

        console.log(
            `  [OK] Inquiry ${inquiryId}: removed standalone task` +
            (existingSubtask ? ' (subtask already existed)' : ` → created subtask (${discoverySchedulingTask.status === 'Completed' ? 'Completed' : 'To_Do'})`)
        );
    }

    console.log('\n=== Summary ===');
    console.log(`  Standalone tasks removed:    ${removed}`);
    console.log(`  Subtasks created:            ${subtasksCreated}`);
    console.log(`  Already had subtask:         ${alreadyHadSubtask}`);
    console.log(`  No "Qualify & Respond" task: ${noQualifyTask}`);
    console.log(`  No "Discovery Call Scheduling" found: ${noDiscoveryTask}`);
}

/**
 * Re-evaluates and auto-completes verify_submission_data and confirm_package_selection
 * for the given inquiry, mirroring InquiryTasksService.syncReviewInquiryAutoSubtasks.
 */
async function syncAutoSubtasks(inquiryId) {
    const inquiry = await prisma.inquiries.findUnique({
        where: { id: inquiryId },
        select: {
            id: true,
            wedding_date: true,
            event_type_id: true,
            selected_package_id: true,
            contact: { select: { email: true, phone_number: true } },
        },
    });
    if (!inquiry) return;

    const hasSubmissionData = Boolean(
        inquiry.contact?.email &&
        inquiry.contact?.phone_number &&
        inquiry.wedding_date &&
        inquiry.event_type_id,
    );

    await setAutoSubtaskStatus(inquiryId, 'verify_submission_data', hasSubmissionData);
    await setAutoSubtaskStatus(inquiryId, 'confirm_package_selection', Boolean(inquiry.selected_package_id));
}

async function setAutoSubtaskStatus(inquiryId, subtaskKey, isComplete) {
    const subtasks = await prisma.inquiry_task_subtasks.findMany({
        where: { subtask_key: subtaskKey, inquiry_task: { inquiry_id: inquiryId, is_active: true } },
        select: { id: true, status: true },
    });
    for (const subtask of subtasks) {
        const next = isComplete ? 'Completed' : 'To_Do';
        if (subtask.status !== next) {
            await prisma.inquiry_task_subtasks.update({
                where: { id: subtask.id },
                data: isComplete
                    ? { status: 'Completed', completed_at: new Date() }
                    : { status: 'To_Do', completed_at: null, completed_by_id: null },
            });
        }
    }
}

main()
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
