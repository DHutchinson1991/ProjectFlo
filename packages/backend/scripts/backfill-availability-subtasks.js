/**
 * Backfill script: Add 'send_crew_availability_requests' and
 * 'await_crew_availability_responses' subtasks to existing "Review Inquiry" tasks.
 *
 * Safe to run multiple times — uses findFirst to skip if already present.
 *
 * Usage: node scripts/backfill-availability-subtasks.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NEW_SUBTASKS = [
    { subtask_key: 'send_crew_availability_requests', name: 'Send Availability Requests', order_index: 4, is_auto_only: true },
    { subtask_key: 'await_crew_availability_responses', name: 'Await Availability Responses', order_index: 5, is_auto_only: true },
];

// Also update existing compare_* subtasks to their new order_index values
const ORDER_UPDATES = [
    { subtask_key: 'compare_package_to_requirements', new_order_index: 6 },
    { subtask_key: 'compare_estimate_to_budget', new_order_index: 7 },
];

async function main() {
    // Find all "Review Inquiry" tasks
    const reviewTasks = await prisma.inquiry_tasks.findMany({
        where: { name: 'Review Inquiry' },
        select: { id: true, inquiry_id: true },
    });

    console.log(`Found ${reviewTasks.length} "Review Inquiry" task(s).`);

    let created = 0;
    let skipped = 0;
    let reordered = 0;

    for (const task of reviewTasks) {
        // Get existing subtasks for this task
        const existingSubtasks = await prisma.inquiry_task_subtasks.findMany({
            where: { inquiry_task_id: task.id },
            select: { subtask_key: true, order_index: true },
        });
        const existingKeys = new Set(existingSubtasks.map((s) => s.subtask_key));

        // Add missing new subtasks
        for (const subtask of NEW_SUBTASKS) {
            if (existingKeys.has(subtask.subtask_key)) {
                skipped++;
                continue;
            }

            await prisma.inquiry_task_subtasks.create({
                data: {
                    inquiry_task_id: task.id,
                    subtask_key: subtask.subtask_key,
                    name: subtask.name,
                    order_index: subtask.order_index,
                    status: 'To_Do',
                    is_auto_only: subtask.is_auto_only,
                    job_role_id: null,
                },
            });
            created++;
            console.log(`  → Created '${subtask.subtask_key}' for task ${task.id} (inquiry ${task.inquiry_id})`);
        }

        // Update order_index for compare_* subtasks
        for (const update of ORDER_UPDATES) {
            const existing = existingSubtasks.find((s) => s.subtask_key === update.subtask_key);
            if (existing && existing.order_index !== update.new_order_index) {
                await prisma.inquiry_task_subtasks.updateMany({
                    where: { inquiry_task_id: task.id, subtask_key: update.subtask_key },
                    data: { order_index: update.new_order_index },
                });
                reordered++;
                console.log(`  → Updated order_index for '${update.subtask_key}' on task ${task.id} → ${update.new_order_index}`);
            }
        }
    }

    console.log(`\nDone. Created: ${created}, Skipped (already existed): ${skipped}, Reordered: ${reordered}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
