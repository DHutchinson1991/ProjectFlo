/**
 * One-time cleanup: removes all `verify_event_type` subtask rows from the DB
 * and re-syncs parent inquiry task statuses.
 *
 * Usage: node scripts/remove-verify-event-type-subtask.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find all affected rows before deleting
    const subtasks = await prisma.inquiry_task_subtasks.findMany({
        where: { subtask_key: 'verify_event_type' },
        select: { id: true, inquiry_task_id: true },
    });

    console.log(`Found ${subtasks.length} verify_event_type subtask(s) to remove.`);

    if (subtasks.length === 0) {
        console.log('Nothing to do.');
        return;
    }

    const taskIds = [...new Set(subtasks.map((s) => s.inquiry_task_id))];

    // Delete the subtasks
    const deleted = await prisma.inquiry_task_subtasks.deleteMany({
        where: { subtask_key: 'verify_event_type' },
    });
    console.log(`Deleted ${deleted.count} subtask row(s).`);

    // Shift order_index down by 1 for any subtask with order_index >= 3
    // on the affected parent tasks (fills the gap left by the removal)
    await prisma.inquiry_task_subtasks.updateMany({
        where: {
            inquiry_task_id: { in: taskIds },
            order_index: { gte: 3 },
        },
        data: { order_index: { decrement: 1 } },
    });
    console.log(`Re-indexed remaining subtasks on ${taskIds.length} task(s).`);

    console.log('Done.');
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
