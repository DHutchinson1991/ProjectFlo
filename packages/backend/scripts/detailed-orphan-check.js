/**
 * Detailed Task Orphan Detection
 * 
 * Shows ALL tasks and their parent status to identify missing links
 * 
 * Usage:
 *   node detailed-orphan-check.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Detailed Orphan Detection\n');

    try {
        // ─── Find ALL inquiry_tasks with their parent status ───
        console.log('📋 All Inquiry Tasks with Parent Status:');
        
        const inquiryTasksWithParents = await prisma.$queryRaw`
            SELECT 
                it.id,
                it.inquiry_id,
                it.name,
                it.status,
                it.phase,
                i.id as parent_id,
                CASE WHEN i.id IS NULL THEN '❌ NO PARENT' ELSE '✓ HAS PARENT' END as parent_status
            FROM inquiry_tasks it
            LEFT JOIN inquiries i ON it.inquiry_id = i.id
            ORDER BY parent_status DESC, it.inquiry_id
        `;

        if (inquiryTasksWithParents.length === 0) {
            console.log('   (No inquiry_tasks found in database)\n');
        } else {
            const orphaned = inquiryTasksWithParents.filter((t) => t.parent_id === null);
            console.log(`   Total: ${inquiryTasksWithParents.length}`);
            console.log(`   With parent: ${inquiryTasksWithParents.length - orphaned.length}`);
            console.log(`   WITHOUT parent (orphaned): ${orphaned.length}\n`);

            if (orphaned.length > 0) {
                console.log('   🚨 ORPHANED INQUIRY TASKS:');
                for (const task of orphaned) {
                    console.log(`      ID ${task.id}: "${task.name}" (phase: ${task.phase}, status: ${task.status}, inquiry_id: ${task.inquiry_id})`);
                }
                console.log();
            }
        }

        // ─── Find ALL project_tasks with their parent status ───
        console.log('\n📊 All Project Tasks with Parent Status:');
        
        const projectTasksWithParents = await prisma.$queryRaw`
            SELECT 
                pt.id,
                pt.project_id,
                pt.name,
                pt.status,
                pt.phase,
                p.id as parent_id,
                CASE WHEN p.id IS NULL THEN '❌ NO PARENT' ELSE '✓ HAS PARENT' END as parent_status
            FROM project_tasks pt
            LEFT JOIN projects p ON pt.project_id = p.id
            ORDER BY parent_status DESC, pt.project_id
        `;

        if (projectTasksWithParents.length === 0) {
            console.log('   (No project_tasks found in database)\n');
        } else {
            const orphaned = projectTasksWithParents.filter((t) => t.parent_id === null);
            console.log(`   Total: ${projectTasksWithParents.length}`);
            console.log(`   With parent: ${projectTasksWithParents.length - orphaned.length}`);
            console.log(`   WITHOUT parent (orphaned): ${orphaned.length}\n`);

            if (orphaned.length > 0) {
                console.log('   🚨 ORPHANED PROJECT TASKS:');
                for (const task of orphaned) {
                    console.log(`      ID ${task.id}: "${task.name}" (phase: ${task.phase}, status: ${task.status}, project_id: ${task.project_id})`);
                }
                console.log();
            }
        }

        console.log('\n✨ Detailed check complete!');

    } catch (error) {
        console.error('❌ Error during check:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
