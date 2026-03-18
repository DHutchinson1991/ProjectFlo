/**
 * Task Integrity Check
 * 
 * Verifies that all inquiry_tasks and project_tasks are properly linked
 * to their parent inquiry or project records.
 * 
 * Usage:
 *   node check-task-integrity.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Task Integrity Check\n');

    try {
        // ─── Check inquiry_tasks ───
        console.log('📋 Inquiry Tasks Summary:');
        
        const inquiryTaskCount = await prisma.inquiry_tasks.count();
        console.log(`   Total inquiry_tasks: ${inquiryTaskCount}`);

        const inquiryCount = await prisma.inquiries.count();
        console.log(`   Total inquiries: ${inquiryCount}`);

        // Get tasks grouped by status
        const tasksByStatus = await prisma.inquiry_tasks.groupBy({
            by: ['status'],
            _count: true,
        });
        console.log('   Tasks by status:');
        for (const group of tasksByStatus) {
            console.log(`     - ${group.status}: ${group._count}`);
        }

        // Get tasks grouped by phase
        const tasksByPhase = await prisma.inquiry_tasks.groupBy({
            by: ['phase'],
            _count: true,
        });
        console.log('   Tasks by phase:');
        for (const group of tasksByPhase) {
            console.log(`     - ${group.phase}: ${group._count}`);
        }

        // ─── Check project_tasks ───
        console.log('\n📊 Project Tasks Summary:');
        
        const projectTaskCount = await prisma.project_tasks.count();
        console.log(`   Total project_tasks: ${projectTaskCount}`);

        const projectCount = await prisma.projects.count();
        console.log(`   Total projects: ${projectCount}`);

        // Get tasks grouped by status
        const projectTasksByStatus = await prisma.project_tasks.groupBy({
            by: ['status'],
            _count: true,
        });
        console.log('   Tasks by status:');
        for (const group of projectTasksByStatus) {
            console.log(`     - ${group.status}: ${group._count}`);
        }

        // Get tasks grouped by phase
        const projectTasksByPhase = await prisma.project_tasks.groupBy({
            by: ['phase'],
            _count: true,
        });
        console.log('   Tasks by phase:');
        for (const group of projectTasksByPhase) {
            console.log(`     - ${group.phase}: ${group._count}`);
        }

        // ─── Verify referential integrity ───
        console.log('\n✅ Referential Integrity:');

        const orphanedInquiryTasks = await prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM inquiry_tasks it
            LEFT JOIN inquiries i ON it.inquiry_id = i.id
            WHERE i.id IS NULL
        `;
        const orphanedInquiryCount = orphanedInquiryTasks[0]?.count || 0;
        console.log(`   Orphaned inquiry_tasks: ${orphanedInquiryCount}`);

        const orphanedProjectTasks = await prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM project_tasks pt
            LEFT JOIN projects p ON pt.project_id = p.id
            WHERE p.id IS NULL
        `;
        const orphanedProjectCount = orphanedProjectTasks[0]?.count || 0;
        console.log(`   Orphaned project_tasks: ${orphanedProjectCount}`);

        console.log('\n✨ Integrity check complete!');
        if (orphanedInquiryCount === 0 && orphanedProjectCount === 0) {
            console.log('💚 All tasks are properly linked to their parents.');
        }

    } catch (error) {
        console.error('❌ Error during check:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
