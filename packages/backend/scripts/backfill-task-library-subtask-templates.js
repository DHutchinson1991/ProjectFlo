/**
 * Backfill task_library_subtask_templates from TypeScript constants.
 *
 * This script reads the existing task_library rows by name and inserts
 * matching subtask templates into the new task_library_subtask_templates table.
 *
 * Run from packages/backend:
 *   node scripts/backfill-task-library-subtask-templates.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mirror of the constants from inquiry-task-subtasks.constants.ts
const TASK_SUBTASK_TEMPLATES = {
    'Review Inquiry': [
        { subtask_key: 'verify_submission_data', name: 'Verify Submission Data', order_index: 1, is_auto_only: true },
        { subtask_key: 'confirm_package_selection', name: 'Confirm Package Selection', order_index: 2, is_auto_only: true },
        { subtask_key: 'check_crew_availability', name: 'Check Crew Availability', order_index: 3, is_auto_only: true },
        { subtask_key: 'check_equipment_availability', name: 'Check Equipment Availability', order_index: 4, is_auto_only: true },
        { subtask_key: 'resolve_availability_conflicts', name: 'Resolve Availability Conflicts', order_index: 5, is_auto_only: true },
        { subtask_key: 'send_crew_availability_requests', name: 'Send Availability Requests', order_index: 6, is_auto_only: true },
        { subtask_key: 'reserve_equipment', name: 'Reserve Equipment', order_index: 7, is_auto_only: true },
    ],
    'Qualify & Respond': [
        { subtask_key: 'mark_inquiry_qualified', name: 'Qualify Inquiry', order_index: 1, is_auto_only: false },
        { subtask_key: 'send_welcome_response', name: 'Send Welcome Response', order_index: 2, is_auto_only: false },
    ],
};

async function main() {
    console.log('=== Backfilling task_library_subtask_templates ===\n');

    for (const [taskName, subtasks] of Object.entries(TASK_SUBTASK_TEMPLATES)) {
        // Find all task_library entries with this name (could be across brands)
        const tasks = await prisma.task_library.findMany({
            where: { name: taskName },
            select: { id: true, name: true, brand_id: true },
        });

        if (tasks.length === 0) {
            console.log(`⚠️  No task_library entries found for "${taskName}" — skipping`);
            continue;
        }

        for (const task of tasks) {
            console.log(`📝 Processing "${task.name}" (id=${task.id}, brand=${task.brand_id})`);

            for (const st of subtasks) {
                await prisma.task_library_subtask_templates.upsert({
                    where: {
                        task_library_id_subtask_key: {
                            task_library_id: task.id,
                            subtask_key: st.subtask_key,
                        },
                    },
                    update: {
                        name: st.name,
                        order_index: st.order_index,
                        is_auto_only: st.is_auto_only,
                    },
                    create: {
                        task_library_id: task.id,
                        subtask_key: st.subtask_key,
                        name: st.name,
                        order_index: st.order_index,
                        is_auto_only: st.is_auto_only,
                    },
                });
            }

            console.log(`   ✅ Upserted ${subtasks.length} subtask templates`);
        }
    }

    // Summary
    const total = await prisma.task_library_subtask_templates.count();
    console.log(`\n=== Done! Total subtask templates in DB: ${total} ===`);
}

main()
    .catch((e) => {
        console.error('❌ Backfill failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
