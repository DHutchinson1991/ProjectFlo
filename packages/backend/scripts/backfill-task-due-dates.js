#!/usr/bin/env node
/**
 * Backfill due dates on task_library (offsets) and existing inquiry_tasks.
 *
 * 1. Sets sensible due_date_offset_days on every task_library entry that lacks one.
 * 2. For each inquiry with tasks, recalculates due_date on inquiry_tasks using:
 *    - Inquiry phase tasks: offset from inquiry.created_at
 *    - Booking phase tasks: offset from inquiry.wedding_date (or created_at fallback)
 *    - Other phases: offset from wedding_date (or created_at fallback)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sensible offset days per task name (days from reference date)
// Inquiry phase: days from inquiry creation
// Booking phase: days from inquiry creation (since booking follows inquiry)
// Later phases: days before the wedding date (negative offsets from event)
const OFFSET_MAP = {
    // ── Inquiry phase (days after inquiry received) ──
    'Initial Inquiry Response': 1,
    'Date Availability Check': 1,
    'Send Needs Assessment': 2,
    'Review Needs Assessment': 4,
    'Portfolio Presentation': 5,
    'Estimate Preparation': 7,
    'Discovery Call Scheduling': 8,
    'Discovery Call': 10,
    'Budget Alignment': 14,

    // ── Booking phase (days after inquiry received) ──
    'Proposal Creation': 16,
    'Proposal Delivery': 18,
    'Consultation Scheduling': 20,
    'Consultation Meeting': 22,
    'Quote Generation': 25,
    'Contract Preparation': 28,
    'Contract Negotiation': 30,
    'Booking Confirmation': 35,

    // ── Lead phase ──
    'Lead Qualification': 0,

    // ── Creative Development (days before event) ──
    'Creative Brief Development': -90,
    'Style Guide Creation': -85,
    'Shot List Planning': -75,
    'Mood Board Creation': -70,
    'Creative Concept Approval': -60,

    // ── Pre-Production (days before event) ──
    'Location Scouting': -45,
    'Equipment Preparation': -30,
    'Timeline Coordination': -21,
    'Vendor Coordination': -14,
    'Client Pre-Production Meeting': -7,

    // ── Production (day of / around event) ──
    'Camera Rig Setup': 0,
    'Audio Rig Setup': 0,
    'Activity Coverage': 0,
    'Camera Packdown & Wrap': 0,
    'Audio Packdown & Wrap': 0,

    // ── Post-Production (days after event) ──
    'Footage Review and Selection': 7,
    'Audio Enhancement': 14,
    'Color Grading': 21,
    'Music Selection and Licensing': 28,
    'Title Cards and Graphics': 35,
    'Rough Cut': 42,
    'Client Review and Revisions': 49,

    // ── Delivery (days after event) ──
    'Final Export and Rendering': 56,
    'Quality Control Check': 58,
    'USB/Physical Media Preparation': 60,
    'Online Gallery Setup': 62,
    'Client Delivery Coordination': 63,
    'Final Invoice and Payment': 65,
    'Project Archive': 70,
};

async function main() {
    console.log('=== Backfilling task due dates ===\n');

    // ── Step 1: Update task_library offset days ──
    const libraryTasks = await prisma.task_library.findMany({
        where: { is_active: true },
        select: { id: true, name: true, phase: true, due_date_offset_days: true },
    });

    let libUpdated = 0;
    for (const lt of libraryTasks) {
        const offset = OFFSET_MAP[lt.name];
        if (offset !== undefined && lt.due_date_offset_days === null) {
            await prisma.task_library.update({
                where: { id: lt.id },
                data: { due_date_offset_days: offset },
            });
            libUpdated++;
            console.log(`  ✅ task_library "${lt.name}" → offset ${offset} days`);
        } else if (lt.due_date_offset_days !== null) {
            console.log(`  ⏭️  task_library "${lt.name}" already has offset ${lt.due_date_offset_days}`);
        } else {
            console.log(`  ⚠️  task_library "${lt.name}" — no mapping, skipping`);
        }
    }
    console.log(`\nUpdated ${libUpdated} task library entries.\n`);

    // ── Step 2: Backfill due_date on existing inquiry_tasks ──
    const inquiries = await prisma.inquiries.findMany({
        where: { archived_at: null },
        select: { id: true, wedding_date: true },
    });

    let taskUpdated = 0;
    for (const inq of inquiries) {
        const tasks = await prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inq.id, is_active: true },
            include: { task_library: { select: { due_date_offset_days: true } } },
            orderBy: { created_at: 'asc' },
        });

        // Use earliest task created_at as reference since inquiries has no created_at
        const inquiryRefDate = tasks.length > 0 ? new Date(tasks[0].created_at) : new Date();
        const eventDate = inq.wedding_date ? new Date(inq.wedding_date) : null;

        for (const t of tasks) {
            // Get offset from the linked task_library entry, or from our map
            let offset = t.task_library?.due_date_offset_days ?? OFFSET_MAP[t.name] ?? null;
            if (offset === null) continue;

            // Reference date depends on phase:
            // - Inquiry/Booking: offset from inquiry created_at
            // - Creative_Development, Pre_Production, Production: offset from event date (negative = before event)
            // - Post_Production, Delivery: offset from event date (positive = after event)
            let refDate;
            if (t.phase === 'Inquiry' || t.phase === 'Booking' || t.phase === 'Lead') {
                refDate = inquiryRefDate;
            } else {
                refDate = eventDate || inquiryRefDate;
            }

            const dueDate = new Date(refDate);
            dueDate.setDate(dueDate.getDate() + offset);

            await prisma.inquiry_tasks.update({
                where: { id: t.id },
                data: { due_date: dueDate },
            });
            taskUpdated++;
            console.log(`  ✅ inquiry_task #${t.id} "${t.name}" (inq ${inq.id}) → due ${dueDate.toISOString().slice(0, 10)}`);
        }
    }

    console.log(`\nUpdated ${taskUpdated} inquiry tasks with due dates.`);
    console.log('\n=== Done ===');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
