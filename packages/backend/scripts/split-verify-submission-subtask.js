/**
 * Backfill: Split "Verify Submission Data" into 3 granular subtasks
 * ─────────────────────────────────────────────────────────────────
 * Old:  verify_submission_data  (order 1) — checked email+phone+date+type all at once
 * New:  verify_contact_details  (order 1) — email + phone
 *       verify_event_date       (order 2) — wedding_date
 *       verify_event_type       (order 3) — event_type_id
 *
 * Also re-indexes confirm_package_selection (2→4) and all subsequent subtasks (+2).
 * Updates task_library_subtask_templates as well.
 *
 * ⚠️  Make sure the backend server is stopped before running this.
 * Run:  node scripts/split-verify-submission-subtask.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== Split verify_submission_data into 3 subtasks ===\n');

    // ── 1. Migrate task_library_subtask_templates ─────────────────────
    const oldTemplates = await prisma.task_library_subtask_templates.findMany({
        where: { subtask_key: 'verify_submission_data' },
    });
    console.log(`Found ${oldTemplates.length} task_library_subtask_templates to split`);

    for (const tpl of oldTemplates) {
        // Bump order_index of siblings that came after old subtask (+2 to make room for 2 extras)
        await prisma.task_library_subtask_templates.updateMany({
            where: {
                task_library_id: tpl.task_library_id,
                order_index: { gt: tpl.order_index },
            },
            data: { order_index: { increment: 2 } },
        });

        // Replace old template with verify_contact_details
        await prisma.task_library_subtask_templates.update({
            where: { id: tpl.id },
            data: {
                subtask_key: 'verify_contact_details',
                name: 'Verify Contact Details',
                order_index: tpl.order_index,
            },
        });

        // Create the two new templates
        await prisma.task_library_subtask_templates.createMany({
            data: [
                {
                    task_library_id: tpl.task_library_id,
                    subtask_key: 'verify_event_date',
                    name: 'Verify Event Date',
                    order_index: tpl.order_index + 1,
                    is_auto_only: true,
                },
                {
                    task_library_id: tpl.task_library_id,
                    subtask_key: 'verify_event_type',
                    name: 'Verify Event Type',
                    order_index: tpl.order_index + 2,
                    is_auto_only: true,
                },
            ],
        });
    }
    console.log(`✅ task_library_subtask_templates migrated\n`);

    // ── 2. Migrate live inquiry_task_subtasks ─────────────────────────
    const oldSubtasks = await prisma.inquiry_task_subtasks.findMany({
        where: { subtask_key: 'verify_submission_data' },
        include: {
            inquiry_task: {
                select: {
                    inquiry_id: true,
                    inquiry: {
                        select: {
                            wedding_date: true,
                            event_type_id: true,
                            contact: { select: { email: true, phone_number: true } },
                        },
                    },
                },
            },
        },
    });
    console.log(`Found ${oldSubtasks.length} live inquiry_task_subtasks to split`);

    let migrated = 0;
    for (const sub of oldSubtasks) {
        const inquiry = sub.inquiry_task.inquiry;

        // Bump order_index of siblings after the old subtask
        await prisma.inquiry_task_subtasks.updateMany({
            where: {
                inquiry_task_id: sub.inquiry_task_id,
                order_index: { gt: sub.order_index },
            },
            data: { order_index: { increment: 2 } },
        });

        // Compute individual auto-completion statuses
        const hasContact = Boolean(inquiry?.contact?.email && inquiry?.contact?.phone_number);
        const hasDate = Boolean(inquiry?.wedding_date);
        const hasType = Boolean(inquiry?.event_type_id);

        // Replace old subtask → verify_contact_details
        await prisma.inquiry_task_subtasks.update({
            where: { id: sub.id },
            data: {
                subtask_key: 'verify_contact_details',
                name: 'Verify Contact Details',
                status: hasContact ? 'Completed' : 'To_Do',
                completed_at: hasContact ? new Date() : null,
            },
        });

        // Create verify_event_date
        await prisma.inquiry_task_subtasks.create({
            data: {
                inquiry_task_id: sub.inquiry_task_id,
                subtask_key: 'verify_event_date',
                name: 'Verify Event Date',
                order_index: sub.order_index + 1,
                status: hasDate ? 'Completed' : 'To_Do',
                completed_at: hasDate ? new Date() : null,
                is_auto_only: true,
                job_role_id: sub.job_role_id,
            },
        });

        // Create verify_event_type
        await prisma.inquiry_task_subtasks.create({
            data: {
                inquiry_task_id: sub.inquiry_task_id,
                subtask_key: 'verify_event_type',
                name: 'Verify Event Type',
                order_index: sub.order_index + 2,
                status: hasType ? 'Completed' : 'To_Do',
                completed_at: hasType ? new Date() : null,
                is_auto_only: true,
                job_role_id: sub.job_role_id,
            },
        });

        migrated++;
    }
    console.log(`✅ Migrated ${migrated} live subtasks\n`);

    // ── 3. Sync parent task statuses ─────────────────────────────────
    const affectedTaskIds = [...new Set(oldSubtasks.map((s) => s.inquiry_task_id))];
    console.log(`Syncing parent task status for ${affectedTaskIds.length} tasks...`);

    for (const taskId of affectedTaskIds) {
        const all = await prisma.inquiry_task_subtasks.findMany({
            where: { inquiry_task_id: taskId },
            select: { status: true },
        });
        const allDone = all.length > 0 && all.every((s) => s.status === 'Completed');
        const anyWorking = all.some((s) => s.status === 'In_Progress' || s.status === 'Completed');
        const nextStatus = allDone ? 'Completed' : anyWorking ? 'In_Progress' : 'To_Do';

        await prisma.inquiry_tasks.update({
            where: { id: taskId },
            data: {
                status: nextStatus,
                completed_at: allDone ? new Date() : null,
            },
        });
    }
    console.log('✅ Parent task statuses synced\n');

    console.log('=== Migration complete ===');
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
