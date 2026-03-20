/**
 * Backfill the review_estimate subtask for all existing Qualify & Respond inquiry tasks.
 *
 * For each inquiry that has an active "Qualify & Respond" task:
 *   1. Inserts the review_estimate subtask if it doesn't already exist (order_index 1).
 *   2. Shifts existing subtask order_indices up by 1 to preserve ordering.
 *   3. Sets the initial status:
 *      - Completed if the primary estimate is NOT stale (updated_at >= latest data change).
 *      - To_Do     if the estimate IS stale or no estimate exists yet.
 *   4. Re-syncs the parent task status from its subtasks.
 *
 * Usage:
 *   cd packages/backend
 *   node scripts/backfill-review-estimate-subtask.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getLatestDataChange(inquiryId) {
    const [inquiry, latestOperator, latestFilm] = await Promise.all([
        prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: { updated_at: true },
        }),
        prisma.projectDayOperator.findFirst({
            where: { inquiry_id: inquiryId },
            orderBy: { updated_at: 'desc' },
            select: { updated_at: true },
        }),
        prisma.projectFilm.findFirst({
            where: { inquiry_id: inquiryId },
            orderBy: { updated_at: 'desc' },
            select: { updated_at: true },
        }),
    ]);

    const dates = [inquiry?.updated_at, latestOperator?.updated_at, latestFilm?.updated_at].filter(Boolean);
    return dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date(0);
}

async function syncTaskStatusFromSubtasks(taskId) {
    const subtasks = await prisma.inquiry_task_subtasks.findMany({
        where: { inquiry_task_id: taskId },
        select: { status: true },
    });
    if (subtasks.length === 0) return;

    const allCompleted = subtasks.every((s) => s.status === 'Completed');
    const anyInProgress = subtasks.some((s) => s.status === 'In_Progress');
    const anyCompleted = subtasks.some((s) => s.status === 'Completed');
    const nextStatus = allCompleted ? 'Completed' : anyInProgress || anyCompleted ? 'In_Progress' : 'To_Do';

    const task = await prisma.inquiry_tasks.findUnique({ where: { id: taskId }, select: { status: true } });
    if (task && task.status !== nextStatus) {
        await prisma.inquiry_tasks.update({
            where: { id: taskId },
            data: {
                status: nextStatus,
                completed_at: nextStatus === 'Completed' ? new Date() : null,
            },
        });
    }
}

async function main() {
    console.log('Backfilling review_estimate subtask for all Qualify & Respond tasks...\n');

    // Find all active Qualify & Respond inquiry tasks
    const qualifyTasks = await prisma.inquiry_tasks.findMany({
        where: {
            name: 'Qualify & Respond',
            is_active: true,
        },
        select: {
            id: true,
            inquiry_id: true,
        },
    });

    console.log(`Found ${qualifyTasks.length} "Qualify & Respond" tasks to process.\n`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const task of qualifyTasks) {
        try {
            // Check if the subtask already exists
            const existing = await prisma.inquiry_task_subtasks.findFirst({
                where: {
                    inquiry_task_id: task.id,
                    subtask_key: 'review_estimate',
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Shift existing subtasks' order_indices up by 1 (to make room for order_index 1)
            await prisma.inquiry_task_subtasks.updateMany({
                where: { inquiry_task_id: task.id },
                data: { order_index: { increment: 1 } },
            });

            // Determine initial status based on estimate staleness
            const primaryEstimate = await prisma.estimates.findFirst({
                where: { inquiry_id: task.inquiry_id, is_primary: true },
                select: { updated_at: true },
            });

            let isComplete = false;
            if (primaryEstimate) {
                const latestChange = await getLatestDataChange(task.inquiry_id);
                isComplete = primaryEstimate.updated_at >= latestChange;
            }

            // Insert the new subtask
            await prisma.inquiry_task_subtasks.create({
                data: {
                    inquiry_task_id: task.id,
                    subtask_key: 'review_estimate',
                    name: 'Review Estimate',
                    order_index: 1,
                    is_auto_only: true,
                    status: isComplete ? 'Completed' : 'To_Do',
                    completed_at: isComplete ? new Date() : null,
                },
            });

            // Re-sync the parent task's status
            await syncTaskStatusFromSubtasks(task.id);

            inserted++;
            console.log(
                `  ✓ Inquiry ${task.inquiry_id} — subtask inserted (status: ${isComplete ? 'Completed' : 'To_Do'})`,
            );
        } catch (err) {
            errors++;
            console.error(`  ✗ Inquiry ${task.inquiry_id} — ERROR: ${err.message}`);
        }
    }

    console.log(`\nDone.`);
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Skipped (already existed): ${skipped}`);
    console.log(`  Errors: ${errors}`);
}

main()
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
