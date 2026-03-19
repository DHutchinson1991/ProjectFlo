/**
 * Backfill: add 'reserve_equipment' subtask to existing "Review Inquiry" tasks
 * and shift compare_* subtasks to new order indexes (7 and 8).
 *
 * Safe to run multiple times.
 * Usage: node scripts/backfill-reserve-equipment-subtask.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_SUBTASK = {
    subtask_key: 'reserve_equipment',
    name: 'Reserve Equipment',
    order_index: 6,
    is_auto_only: true,
};

const ORDER_UPDATES = [
    { subtask_key: 'compare_package_to_requirements', new_order_index: 7 },
    { subtask_key: 'compare_estimate_to_budget', new_order_index: 8 },
];

async function main() {
    const reviewTasks = await prisma.inquiry_tasks.findMany({
        where: { name: 'Review Inquiry' },
        select: { id: true, inquiry_id: true },
    });

    console.log(`Found ${reviewTasks.length} "Review Inquiry" task(s).`);
    let created = 0, skipped = 0, reordered = 0;

    for (const task of reviewTasks) {
        const existing = await prisma.inquiry_task_subtasks.findFirst({
            where: { inquiry_task_id: task.id, subtask_key: NEW_SUBTASK.subtask_key },
        });

        if (existing) {
            skipped++;
        } else {
            await prisma.inquiry_task_subtasks.create({
                data: {
                    inquiry_task_id: task.id,
                    subtask_key: NEW_SUBTASK.subtask_key,
                    name: NEW_SUBTASK.name,
                    order_index: NEW_SUBTASK.order_index,
                    status: 'To_Do',
                    is_auto_only: NEW_SUBTASK.is_auto_only,
                    job_role_id: null,
                },
            });
            created++;
            console.log(`  → Created '${NEW_SUBTASK.subtask_key}' for task ${task.id} (inquiry ${task.inquiry_id})`);
        }

        for (const update of ORDER_UPDATES) {
            const changed = await prisma.inquiry_task_subtasks.updateMany({
                where: { inquiry_task_id: task.id, subtask_key: update.subtask_key, NOT: { order_index: update.new_order_index } },
                data: { order_index: update.new_order_index },
            });
            if (changed.count > 0) {
                reordered++;
                console.log(`  → Reordered '${update.subtask_key}' → ${update.new_order_index} on task ${task.id}`);
            }
        }
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Reordered: ${reordered}`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
