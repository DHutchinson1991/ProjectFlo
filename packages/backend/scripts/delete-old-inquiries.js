/**
 * Delete Old Inquiries Script
 * 
 * Keeps only inquiry ID 13 and deletes all others (1-12) with their tasks.
 * 
 * Usage:
 *   node delete-old-inquiries.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Deleting old inquiries...\n');

    try {
        // IDs to delete: 1-12 (keeping 13)
        const inquiryIdsToDelete = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        // First, get count of tasks to be deleted
        const taskCount = await prisma.inquiry_tasks.count({
            where: { inquiry_id: { in: inquiryIdsToDelete } }
        });
        
        console.log(`📋 Tasks to be deleted: ${taskCount}`);
        console.log(`📋 Inquiries to be deleted: ${inquiryIdsToDelete.length}\n`);

        // Delete inquiry_task_events first (if they exist)
        const eventIds = await prisma.inquiry_tasks.findMany({
            where: { inquiry_id: { in: inquiryIdsToDelete } },
            select: { id: true }
        });

        if (eventIds.length > 0) {
            const deletedEvents = await prisma.inquiry_task_events.deleteMany({
                where: { task_id: { in: eventIds.map(e => e.id) } }
            });
            console.log(`✅ Deleted ${deletedEvents.count} inquiry_task_events`);
        }

        // Delete inquiry_tasks (cascade will handle this, but being explicit)
        const deletedTasks = await prisma.inquiry_tasks.deleteMany({
            where: { inquiry_id: { in: inquiryIdsToDelete } }
        });
        console.log(`✅ Deleted ${deletedTasks.count} inquiry_tasks\n`);

        // Delete the inquiries themselves
        const deletedInquiries = await prisma.inquiries.deleteMany({
            where: { id: { in: inquiryIdsToDelete } }
        });
        console.log(`✅ Deleted ${deletedInquiries.count} inquiries\n`);

        // Verify final state
        const remainingInquiries = await prisma.inquiries.count();
        const remainingTasks = await prisma.inquiry_tasks.count();

        console.log('📊 Final State:');
        console.log(`   Inquiries remaining: ${remainingInquiries}`);
        console.log(`   Tasks remaining: ${remainingTasks}\n`);

        console.log('✨ Cleanup complete! Only inquiry 13 with its tasks remain.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
