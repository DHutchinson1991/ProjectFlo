const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reorderTimelineLayers() {
    console.log('🔄 Starting timeline layer reordering...');

    try {
        // Define the new order: Graphics (1), Video (2), Audio (3), Music (4)
        const newOrder = [
            { name: 'Graphics', newOrderIndex: 1 },
            { name: 'Video', newOrderIndex: 2 },
            { name: 'Audio', newOrderIndex: 3 },
            { name: 'Music', newOrderIndex: 4 }
        ];

        console.log('📋 Current layer order before update:');
        const currentLayers = await prisma.timelineLayer.findMany({
            orderBy: { order_index: 'asc' }
        });
        currentLayers.forEach(layer => {
            console.log(`  ${layer.order_index}: ${layer.name} (ID: ${layer.id})`);
        });

        console.log('\n🔄 Updating layer order...');

        // Update each layer with the new order
        for (const orderUpdate of newOrder) {
            const layer = await prisma.timelineLayer.findFirst({
                where: { name: orderUpdate.name }
            });

            if (layer) {
                await prisma.timelineLayer.update({
                    where: { id: layer.id },
                    data: { order_index: orderUpdate.newOrderIndex }
                });
                console.log(`  ✅ Updated ${orderUpdate.name}: ${layer.order_index} → ${orderUpdate.newOrderIndex}`);
            } else {
                console.log(`  ❌ Layer '${orderUpdate.name}' not found`);
            }
        }

        console.log('\n📋 New layer order after update:');
        const updatedLayers = await prisma.timelineLayer.findMany({
            orderBy: { order_index: 'asc' }
        });
        updatedLayers.forEach(layer => {
            console.log(`  ${layer.order_index}: ${layer.name} (ID: ${layer.id})`);
        });

        console.log('\n✅ Timeline layer reordering completed successfully!');
        console.log('📝 New order: Graphics → Video → Audio → Music');

    } catch (error) {
        console.error('❌ Error reordering timeline layers:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the function
reorderTimelineLayers()
    .then(() => {
        console.log('\n🎉 Timeline layer reordering script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Timeline layer reordering script failed:', error);
        process.exit(1);
    });
