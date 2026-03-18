/**
 * migrate-pipeline-tasks.js
 *
 * Rebuilds inquiry_tasks for all existing active inquiries to match the new
 * 4-stage pipeline structure (Inquiry → Discovery → Proposal → Booking).
 *
 * Safe to re-run. Preserves completion state for tasks whose names are
 * unchanged between the old and new structures.
 *
 * Run from packages/backend:
 *   node scripts/migrate-pipeline-tasks.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Task names that survive unchanged — completion state will be preserved
const PRESERVED_TASK_NAMES = new Set([
    'Send Needs Assessment',
    'Review Needs Assessment',
    'Estimate Preparation',
    'Discovery Call Scheduling',
    'Discovery Call',
]);

async function main() {
    console.log('=== Pipeline Task Migration ===\n');

    // Get all active inquiries with brand info
    const inquiries = await prisma.inquiries.findMany({
        where: { archived_at: null },
        select: {
            id: true,
            contact: { select: { brand_id: true } },
        },
        orderBy: { id: 'asc' },
    });

    console.log(`Found ${inquiries.length} active inquiries to migrate.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const inquiry of inquiries) {
        const inquiryId = inquiry.id;
        const brandId = inquiry.contact?.brand_id;

        if (!brandId) {
            console.warn(`  [SKIP] Inquiry ${inquiryId} — no brand_id found`);
            skipped++;
            continue;
        }

        try {
            // 1. Snapshot completion state for preserved task names
            const existingTasks = await prisma.inquiry_tasks.findMany({
                where: { inquiry_id: inquiryId, is_active: true },
                select: {
                    name: true,
                    status: true,
                    completed_at: true,
                    completed_by_id: true,
                    assigned_to_id: true,
                    job_role_id: true,
                },
            });

            // Map: task name → completion snapshot (only for names we want to preserve)
            const completionSnapshot = new Map();
            for (const t of existingTasks) {
                const baseName = t.name.replace(/ \(.*\)$/, ''); // strip crew suffix if any
                if (PRESERVED_TASK_NAMES.has(baseName) && t.status === 'Completed') {
                    completionSnapshot.set(baseName, {
                        completed_at: t.completed_at,
                        completed_by_id: t.completed_by_id,
                    });
                }
            }

            // 2. Load new pipeline task library entries for this brand
            const libraryTasks = await prisma.task_library.findMany({
                where: {
                    brand_id: brandId,
                    is_active: true,
                    phase: { in: ['Inquiry', 'Booking'] },
                },
                orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
            });

            if (libraryTasks.length === 0) {
                console.warn(`  [SKIP] Inquiry ${inquiryId} — no pipeline library tasks for brand ${brandId}`);
                skipped++;
                continue;
            }

            // 3. Delete all existing pipeline inquiry_tasks
            await prisma.inquiry_tasks.deleteMany({
                where: { inquiry_id: inquiryId },
            });

            // 4. Load inquiry for date-offset calculation
            const inquiryData = await prisma.inquiries.findUnique({
                where: { id: inquiryId },
                select: { wedding_date: true, created_at: true },
            });

            const inquiryRefDate = inquiryData?.created_at ? new Date(inquiryData.created_at) : new Date();
            const eventDate = inquiryData?.wedding_date ? new Date(inquiryData.wedding_date) : null;

            const calcDueDate = (lt) => {
                if (lt.due_date_offset_days == null) return null;
                const refDate = lt.phase === 'Booking' && eventDate ? eventDate : inquiryRefDate;
                const d = new Date(refDate);
                d.setDate(d.getDate() + lt.due_date_offset_days);
                return d;
            };

            // 5. Re-create from new library (same logic as InquiryTasksService.generateForInquiry)
            const stageTasks = libraryTasks.filter(t => t.is_stage);
            const childTasks = libraryTasks.filter(t => !t.is_stage && t.parent_task_id != null);
            const flatTasks = libraryTasks.filter(t => !t.is_stage && t.parent_task_id == null);

            const libraryToInquiryTask = new Map();
            let globalOrder = 0;

            const createTask = async (lt, parentInquiryTaskId) => {
                // Restore completion if this task name was previously completed
                const snap = completionSnapshot.get(lt.name);
                const status = snap ? 'Completed' : 'To_Do';

                const record = await prisma.inquiry_tasks.create({
                    data: {
                        inquiry_id: inquiryId,
                        task_library_id: lt.id,
                        parent_inquiry_task_id: parentInquiryTaskId,
                        name: lt.name,
                        description: lt.description,
                        phase: lt.phase,
                        trigger_type: lt.trigger_type,
                        estimated_hours: lt.effort_hours,
                        order_index: globalOrder++,
                        status,
                        is_active: true,
                        is_stage: lt.is_stage,
                        stage_color: lt.stage_color,
                        due_date: lt.is_stage ? null : calcDueDate(lt),
                        assigned_to_id: null,
                        job_role_id: lt.is_stage ? null : lt.default_job_role_id,
                        completed_at: snap?.completed_at ?? null,
                        completed_by_id: snap?.completed_by_id ?? null,
                    },
                });
                return record;
            };

            for (const stage of stageTasks) {
                const stageRecord = await createTask(stage, null);
                libraryToInquiryTask.set(stage.id, stageRecord.id);

                const stageChildren = childTasks.filter(c => c.parent_task_id === stage.id);
                for (const lt of stageChildren) {
                    const rec = await createTask(lt, stageRecord.id);
                    libraryToInquiryTask.set(lt.id, rec.id);
                }
            }

            for (const lt of flatTasks) {
                const rec = await createTask(lt, null);
                libraryToInquiryTask.set(lt.id, rec.id);
            }

            const preserved = completionSnapshot.size;
            console.log(
                `  [OK] Inquiry ${inquiryId} — ${libraryTasks.length} library tasks → ${globalOrder} inquiry tasks` +
                (preserved > 0 ? ` (${preserved} completion(s) restored)` : ''),
            );
            migrated++;

        } catch (err) {
            console.error(`  [ERROR] Inquiry ${inquiryId}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\n=== Done ===`);
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log(`  Errors:   ${errors}`);
}

main()
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
