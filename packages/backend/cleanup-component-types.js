const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupComponentTypes() {
    console.log('🧹 Starting component type cleanup...');

    try {
        // Step 1: Check current component types
        const components = await prisma.componentLibrary.findMany({
            select: { id: true, name: true, type: true }
        });

        console.log('\n📊 Current component distribution:');
        const typeCounts = {};
        components.forEach(comp => {
            typeCounts[comp.type] = (typeCounts[comp.type] || 0) + 1;
        });
        console.table(typeCounts);

        // Step 2: Find EDIT and COVERAGE_LINKED components
        const editComponents = components.filter(c => c.type === 'EDIT');
        const coverageComponents = components.filter(c => c.type === 'COVERAGE_LINKED');

        console.log(`\n🎬 Found ${editComponents.length} EDIT components to remove`);
        console.log(`📹 Found ${coverageComponents.length} COVERAGE_LINKED components to remove`);

        if (editComponents.length > 0) {
            console.log('\nEDIT components:');
            editComponents.forEach(comp => console.log(`- ${comp.name} (ID: ${comp.id})`));
        }

        if (coverageComponents.length > 0) {
            console.log('\nCOVERAGE_LINKED components:');
            coverageComponents.forEach(comp => console.log(`- ${comp.name} (ID: ${comp.id})`));
        }

        // Step 3: Remove EDIT and COVERAGE_LINKED components
        const componentsToRemove = [...editComponents, ...coverageComponents];

        if (componentsToRemove.length > 0) {
            console.log(`\n🗑️  Removing ${componentsToRemove.length} obsolete components...`);

            for (const comp of componentsToRemove) {
                try {
                    await prisma.componentLibrary.delete({
                        where: { id: comp.id }
                    });
                    console.log(`✅ Removed: ${comp.name} (${comp.type})`);
                } catch (error) {
                    console.log(`❌ Error removing ${comp.name}: ${error.message}`);
                }
            }
        } else {
            console.log('\n✨ No obsolete components found to remove');
        }

        // Step 4: Final verification
        const finalComponents = await prisma.componentLibrary.findMany({
            select: { type: true }
        });

        const finalCounts = {};
        finalComponents.forEach(comp => {
            finalCounts[comp.type] = (finalCounts[comp.type] || 0) + 1;
        });

        console.log('\n📊 Final component distribution:');
        console.table(finalCounts);

        console.log('\n✅ Component type cleanup completed successfully!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupComponentTypes()
    .catch((error) => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    });
