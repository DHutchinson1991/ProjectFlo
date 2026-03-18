const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const inquiries = await prisma.inquiries.findMany({
        select: { id: true, status: true, created_at: true, wedding_date: true },
        orderBy: { created_at: 'desc' }
    });
    
    console.log('\n📋 All Inquiries (by creation date):\n');
    console.log('ID | Status           | Created At           | Wedding Date');
    console.log('---|------------------|----------------------|----------------------');
    
    for (const inq of inquiries) {
        const createdAt = new Date(inq.created_at).toISOString().split('T')[0];
        const weddingDate = inq.wedding_date ? new Date(inq.wedding_date).toISOString().split('T')[0] : 'N/A';
        console.log(`${inq.id.toString().padStart(2)} | ${inq.status.padEnd(16)} | ${createdAt} | ${weddingDate}`);
    }
    
    await prisma.$disconnect();
}
main();
