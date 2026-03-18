/**
 * Cleanup Orphaned Tasks Script
 * 
 * Removes orphaned inquiry_tasks and project_tasks where their parent
 * inquiry or project has been deleted without cascade logic running.
 * 
 * Usage:
 *   node cleanup-orphaned-tasks.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting orphaned tasks cleanup...\n');

    try {
        // ─── Find and delete orphaned inquiry_tasks ───
        console.log('📋 Checking for orphaned inquiry_tasks...');
        
        const orphanedInquiryTasks = await prisma.$queryRaw`
            SELECT it.id 
            FROM inquiry_tasks it
            LEFT JOIN inquiries i ON it.inquiry_id = i.id
            WHERE i.id IS NULL
        `;

        if (orphanedInquiryTasks.length > 0) {
            console.log(`   Found ${orphanedInquiryTasks.length} orphaned inquiry_tasks`);
            
            const orphanedIds = orphanedInquiryTasks.map(row => row.id);
            
            // Delete associated inquiry_task_events first (if any exist)
            const deletedEvents = await prisma.inquiry_task_events.deleteMany({
                where: { task_id: { in: orphanedIds } }
            });
            console.log(`   Deleted ${deletedEvents.count} related inquiry_task_events`);
            
            // Delete the orphaned inquiry_tasks
            const deletedInquiryTasks = await prisma.inquiry_tasks.deleteMany({
                where: { id: { in: orphanedIds } }
            });
            console.log(`   ✅ Deleted ${deletedInquiryTasks.count} orphaned inquiry_tasks\n`);
        } else {
            console.log('   ✅ No orphaned inquiry_tasks found\n');
        }

        // ─── Find and delete orphaned project_tasks ───
        console.log('📋 Checking for orphaned project_tasks...');
        
        const orphanedProjectTasks = await prisma.$queryRaw`
            SELECT pt.id 
            FROM project_tasks pt
            LEFT JOIN projects p ON pt.project_id = p.id
            WHERE p.id IS NULL
        `;

        if (orphanedProjectTasks.length > 0) {
            console.log(`   Found ${orphanedProjectTasks.length} orphaned project_tasks`);
            
            const orphanedIds = orphanedProjectTasks.map(row => row.id);
            
            // Delete the orphaned project_tasks
            const deletedProjectTasks = await prisma.project_tasks.deleteMany({
                where: { id: { in: orphanedIds } }
            });
            console.log(`   ✅ Deleted ${deletedProjectTasks.count} orphaned project_tasks\n`);
        } else {
            console.log('   ✅ No orphaned project_tasks found\n');
        }

        console.log('✨ Cleanup complete!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
