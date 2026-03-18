const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Get all inquiries
        const allInquiries = await prisma.inquiries.findMany({ select: { id: true } });
        
        // Get task counts per inquiry
        const taskCounts = await prisma.$queryRaw`
            SELECT it.inquiry_id, COUNT(*) as task_count
            FROM inquiry_tasks it
            GROUP BY it.inquiry_id
            ORDER BY it.inquiry_id
        `;
        
        console.log('\n📋 Task Breakdown by Inquiry:\n');
        console.log('ID | Tasks');
        console.log('---|------');
        
        let totalWithTasks = 0;
        let totalTasks = 0;
        
        for (const inq of allInquiries) {
            const taskRow = taskCounts.find(t => t.inquiry_id === inq.id);
            const count = taskRow ? Number(taskRow.task_count) : 0;
            if (count > 0) totalWithTasks++;
            totalTasks += count;
            console.log(`${inq.id.toString().padStart(2)} | ${count}`);
        }
        
        console.log('---|------');
        console.log(`   Total: ${allInquiries.length} inquiries, ${totalWithTasks} have tasks, ${totalTasks} tasks total`);
        
        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
