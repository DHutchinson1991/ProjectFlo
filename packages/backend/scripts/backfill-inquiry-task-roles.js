/**
 * Backfill job_role_id on existing inquiry_tasks from their task_library.default_job_role_id.
 * Run: node scripts/backfill-inquiry-task-roles.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find all inquiry tasks that have a task_library entry with a default_job_role_id
    const tasks = await prisma.inquiry_tasks.findMany({
        where: {
            job_role_id: null,
            task_library_id: { not: null },
            is_stage: false,
        },
        include: {
            task_library: {
                select: { id: true, default_job_role_id: true },
            },
        },
    });

    let updated = 0;
    for (const task of tasks) {
        if (task.task_library?.default_job_role_id) {
            await prisma.inquiry_tasks.update({
                where: { id: task.id },
                data: { job_role_id: task.task_library.default_job_role_id },
            });
            updated++;
        }
    }

    console.log(`Backfilled job_role_id on ${updated} of ${tasks.length} inquiry tasks`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
