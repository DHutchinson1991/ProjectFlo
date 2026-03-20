/**
 * One-time fix: Removes standalone "Review Estimate" inquiry_tasks and
 * task_library entries, then ensures the `review_estimate` subtask exists
 * under every active "Qualify & Respond" inquiry task.
 *
 * Usage:  node scripts/fix-review-estimate-placement.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // ── 1. Delete standalone "Review Estimate" inquiry_tasks ─────────
    // First remove any subtasks they might have
    const standaloneTasks = await prisma.inquiry_tasks.findMany({
        where: { name: 'Review Estimate', is_active: true },
        select: { id: true, inquiry_id: true },
    });
    console.log(`Found ${standaloneTasks.length} standalone "Review Estimate" task(s) to delete.`);

    if (standaloneTasks.length > 0) {
        const taskIds = standaloneTasks.map((t) => t.id);

        // Delete subtasks of these tasks first
        const deletedSubs = await prisma.inquiry_task_subtasks.deleteMany({
            where: { inquiry_task_id: { in: taskIds } },
        });
        console.log(`  Deleted ${deletedSubs.count} subtask(s) from standalone tasks.`);

        // Delete the standalone tasks themselves
        const deletedTasks = await prisma.inquiry_tasks.deleteMany({
            where: { id: { in: taskIds } },
        });
        console.log(`  Deleted ${deletedTasks.count} standalone "Review Estimate" task(s).`);
    }

    // ── 2. Deactivate "Review Estimate" in task_library ──────────────
    const libUpdated = await prisma.task_library.updateMany({
        where: { name: 'Review Estimate', is_active: true },
        data: { is_active: false },
    });
    console.log(`Deactivated ${libUpdated.count} "Review Estimate" task_library row(s).`);

    // ── 3. Ensure review_estimate subtask on every Qualify & Respond ─
    const qrTasks = await prisma.inquiry_tasks.findMany({
        where: { name: 'Qualify & Respond', is_active: true },
        select: {
            id: true,
            inquiry_id: true,
            subtasks: {
                select: { subtask_key: true },
            },
        },
    });
    console.log(`\nFound ${qrTasks.length} active "Qualify & Respond" task(s).`);

    let added = 0;
    for (const task of qrTasks) {
        const hasIt = task.subtasks.some((s) => s.subtask_key === 'review_estimate');
        if (hasIt) continue;

        // Shift existing subtasks up by 1 to make room at position 1
        await prisma.inquiry_task_subtasks.updateMany({
            where: { inquiry_task_id: task.id },
            data: { order_index: { increment: 1 } },
        });

        // Determine initial status: check if primary estimate exists and is current
        let initialStatus = 'To_Do';
        try {
            const estimate = await prisma.estimates.findFirst({
                where: { inquiry_id: task.inquiry_id, is_primary: true },
                select: { id: true, updated_at: true },
            });
            if (estimate) {
                // Check for staleness: compare estimate updated_at to latest data change
                const latestChange = await prisma.$queryRaw`
                    SELECT GREATEST(
                        COALESCE((SELECT MAX(pdo.updated_at) FROM project_day_operators pdo
                                  JOIN project_days pd ON pd.id = pdo.project_day_id
                                  WHERE pd.inquiry_id = ${task.inquiry_id}), '1970-01-01'),
                        COALESCE((SELECT MAX(pf.updated_at) FROM project_films pf
                                  WHERE pf.inquiry_id = ${task.inquiry_id}), '1970-01-01'),
                        COALESCE((SELECT MAX(i.updated_at) FROM inquiries i
                                  WHERE i.id = ${task.inquiry_id}), '1970-01-01')
                    ) AS latest`;
                const latestDate = latestChange[0]?.latest;
                if (latestDate && estimate.updated_at >= latestDate) {
                    initialStatus = 'Completed';
                }
            }
        } catch (e) {
            // Default to To_Do on any error
        }

        await prisma.inquiry_task_subtasks.create({
            data: {
                inquiry_task_id: task.id,
                subtask_key: 'review_estimate',
                name: 'Review Estimate',
                order_index: 1,
                status: initialStatus,
                is_auto_only: true,
            },
        });
        added++;
        console.log(`  Added review_estimate subtask to Q&R task ${task.id} (inquiry ${task.inquiry_id}) — ${initialStatus}`);
    }
    console.log(`\nAdded review_estimate subtask to ${added} task(s).`);
    console.log('Done.');
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
