const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDeliverables() {
    console.log('🔍 Checking current deliverables in database...');

    try {
        // Get all deliverables
        const allDeliverables = await prisma.deliverables.findMany({
            orderBy: { id: 'asc' }
        });

        console.log(`Total deliverables: ${allDeliverables.length}`);

        if (allDeliverables.length > 0) {
            console.log('\n📋 Current deliverables:');
            allDeliverables.forEach(deliverable => {
                const isFirstDance = deliverable.name.includes('First Dance');
                const icon = isFirstDance ? '✅' : '🗑️';
                console.log(`  ${icon} ID ${deliverable.id.toString().padStart(2)}: ${deliverable.name} (${deliverable.type})`);
            });
        } else {
            console.log('No deliverables found in database.');
        }

    } catch (error) {
        console.error('❌ Error checking deliverables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
checkDeliverables();
