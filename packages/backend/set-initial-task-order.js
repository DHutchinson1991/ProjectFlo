/**
 * Set initial order_index values for existing task_library records
 * Orders tasks by name within each phase and brand
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setInitialTaskOrder() {
    console.log('🚀 Setting initial order_index for task_library records...');

    try {
        // Get all tasks grouped by brand_id and phase
        const tasks = await prisma.task_library.findMany({
            orderBy: [
                { brand_id: 'asc' },
                { phase: 'asc' },
                { name: 'asc' }
            ]
        });

        console.log(`📋 Found ${tasks.length} task_library records`);

        // Group tasks by brand_id and phase
        const groupedTasks = {};

        tasks.forEach(task => {
            const key = `${task.brand_id}-${task.phase}`;
            if (!groupedTasks[key]) {
                groupedTasks[key] = [];
            }
            groupedTasks[key].push(task);
        });

        console.log(`📊 Found ${Object.keys(groupedTasks).length} unique brand-phase combinations`);

        // Update each group with order_index starting from 1
        let totalUpdated = 0;

        for (const [key, groupTasks] of Object.entries(groupedTasks)) {
            const [brandId, phase] = key.split('-');
            console.log(`\n📝 Processing Brand ${brandId}, Phase: ${phase} (${groupTasks.length} tasks)`);

            for (let i = 0; i < groupTasks.length; i++) {
                const task = groupTasks[i];
                const newOrderIndex = i + 1; // Start from 1

                await prisma.task_library.update({
                    where: { id: task.id },
                    data: { order_index: newOrderIndex }
                });

                console.log(`   ✅ ${task.name} -> order_index: ${newOrderIndex}`);
                totalUpdated++;
            }
        }

        console.log(`\n🎉 Successfully updated ${totalUpdated} task_library records with order_index`);

    } catch (error) {
        console.error('❌ Error setting initial task order:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
setInitialTaskOrder()
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
