/**
 * Migration: Rename old pipeline task names to new names on existing inquiry_tasks rows.
 *   "Send Needs Assessment"   → "Inquiry Received"
 *   "Review Needs Assessment" → "Review Inquiry"
 *
 * Also re-links task_library_id to the new library entries so is_auto_only
 * and other template fields resolve correctly.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Resolve new library IDs so we can re-link the FK
    const [inquiryReceived, reviewInquiry] = await Promise.all([
        prisma.task_library.findFirst({ where: { name: 'Inquiry Received' } }),
        prisma.task_library.findFirst({ where: { name: 'Review Inquiry' } }),
    ]);

    console.log('Library entries found:');
    console.log('  Inquiry Received →', inquiryReceived?.id ?? 'NOT FOUND');
    console.log('  Review Inquiry   →', reviewInquiry?.id ?? 'NOT FOUND');

    // --- Rename "Send Needs Assessment" → "Inquiry Received" ---
    const renamedSNA = await prisma.inquiry_tasks.updateMany({
        where: { name: 'Send Needs Assessment' },
        data: {
            name: 'Inquiry Received',
            ...(inquiryReceived ? { task_library_id: inquiryReceived.id } : {}),
        },
    });
    console.log(`\nRenamed "Send Needs Assessment" → "Inquiry Received": ${renamedSNA.count} row(s)`);

    // --- Rename "Review Needs Assessment" → "Review Inquiry" ---
    const renamedRNA = await prisma.inquiry_tasks.updateMany({
        where: { name: 'Review Needs Assessment' },
        data: {
            name: 'Review Inquiry',
            ...(reviewInquiry ? { task_library_id: reviewInquiry.id } : {}),
        },
    });
    console.log(`Renamed "Review Needs Assessment" → "Review Inquiry": ${renamedRNA.count} row(s)`);

    console.log('\nDone.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
