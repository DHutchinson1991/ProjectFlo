const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const inquiryCount = await prisma.inquiries.count();
    const taskCount = await prisma.inquiry_tasks.count();
    
    console.log('📊 Current State:');
    console.log('   Inquiries in DB:', inquiryCount);
    console.log('   Inquiry Tasks in DB:', taskCount);
    
    // Get unique inquiry_ids from tasks
    const uniqueInquiryIds = await prisma.$queryRaw`
        SELECT DISTINCT inquiry_id FROM inquiry_tasks ORDER BY inquiry_id
    `;
    
    console.log('   Unique inquiry_ids referenced in tasks:', uniqueInquiryIds.length);
    
    // Find tasks pointing to non-existent inquiries
    const orphanedByInquiryId = await prisma.$queryRaw`
        SELECT DISTINCT it.inquiry_id, COUNT(*) as task_count
        FROM inquiry_tasks it
        LEFT JOIN inquiries i ON it.inquiry_id = i.id
        WHERE i.id IS NULL
        GROUP BY it.inquiry_id
    `;
    
    if (orphanedByInquiryId.length > 0) {
        console.log('   ');
        console.log('🚨 Tasks pointing to deleted inquiries:');
        for (const row of orphanedByInquiryId) {
            console.log(`      Inquiry ID ${row.inquiry_id}: ${row.task_count} tasks`);
        }
    }
    
    await prisma.$disconnect();
}

main();
