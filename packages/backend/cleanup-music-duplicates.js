const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupFirstDanceMusicDuplicates() {
    console.log('🎵 Cleaning up First Dance music component duplicates...');

    try {
        // Get all First Dance music components
        const musicComponents = await prisma.componentLibrary.findMany({
            where: {
                AND: [
                    { name: { contains: "First Dance" } },
                    { type: "MUSIC" }
                ]
            },
            orderBy: { id: 'asc' }
        });

        console.log('\n🎼 Found First Dance music components:');
        musicComponents.forEach(comp => {
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`   ID ${comp.id}: "${comp.name}" - ${duration} - ${comp.base_task_hours}h`);
        });

        if (musicComponents.length > 1) {
            // Keep the one with the best name and specifications
            // "First Dance Music" seems most appropriate
            const keepComponent = musicComponents.find(comp => comp.name === "First Dance Music");
            const removeComponents = musicComponents.filter(comp => comp.name !== "First Dance Music");

            if (keepComponent && removeComponents.length > 0) {
                console.log(`\n✅ Keeping: ID ${keepComponent.id} - "${keepComponent.name}"`);
                console.log('🗑️  Removing duplicates:');

                for (const comp of removeComponents) {
                    console.log(`   ID ${comp.id}: "${comp.name}"`);

                    try {
                        await prisma.componentLibrary.delete({
                            where: { id: comp.id }
                        });
                        console.log(`   ✅ Removed ID ${comp.id}: "${comp.name}"`);
                    } catch (error) {
                        console.error(`   ❌ Failed to remove ID ${comp.id}:`, error.message);
                    }
                }
            }
        }

        // Final verification
        console.log('\n📊 Final First Dance components after music cleanup:');
        const finalFirstDance = await prisma.componentLibrary.findMany({
            where: {
                OR: [
                    { name: { contains: "First Dance" } },
                    { name: { contains: "Ident Outro" } }
                ]
            },
            orderBy: [{ type: 'asc' }, { name: 'asc' }]
        });

        finalFirstDance.forEach(comp => {
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`${coverageIcon} ${comp.type.padEnd(8)} | ID ${comp.id.toString().padStart(2)} | ${duration} | ${comp.name}`);
        });

        const totalComponents = await prisma.componentLibrary.count();
        console.log(`\n🎉 Music cleanup complete! Total components: ${totalComponents}`);

    } catch (error) {
        console.error('❌ Error during music cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup function
cleanupFirstDanceMusicDuplicates();
