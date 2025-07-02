const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupNonFirstDanceComponents() {
    console.log('🧹 Starting cleanup of all non-First Dance wedding components...');

    try {
        // First, let's see what we have
        console.log('\n📋 Current component inventory...');
        const allComponents = await prisma.componentLibrary.findMany({
            orderBy: [{ type: 'asc' }, { name: 'asc' }]
        });

        console.log(`Total components: ${allComponents.length}`);

        // Show all components grouped by type
        const byType = {};
        allComponents.forEach(comp => {
            if (!byType[comp.type]) byType[comp.type] = [];
            byType[comp.type].push(comp);
        });

        Object.entries(byType).forEach(([type, components]) => {
            console.log(`\n${type} (${components.length}):`);
            components.forEach(comp => {
                const isFirstDance = comp.name.includes('First Dance') || comp.name.includes('Ident Outro');
                const icon = isFirstDance ? '✅' : '🗑️';
                console.log(`  ${icon} ID ${comp.id.toString().padStart(2)}: ${comp.name}`);
            });
        });

        // Identify components to keep (First Dance related)
        const componentsToKeep = allComponents.filter(comp =>
            comp.name.includes('First Dance') || comp.name.includes('Ident Outro')
        );

        // Identify components to remove (everything else)
        const componentsToRemove = allComponents.filter(comp =>
            !comp.name.includes('First Dance') && !comp.name.includes('Ident Outro')
        );

        console.log(`\n📊 Cleanup Plan:`);
        console.log(`✅ Keeping ${componentsToKeep.length} First Dance components`);
        console.log(`🗑️  Removing ${componentsToRemove.length} non-First Dance components`);

        // Show what we're keeping
        console.log(`\n✅ Components to KEEP (First Dance set):`);
        componentsToKeep.forEach(comp => {
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`   ${coverageIcon} ${comp.type.padEnd(8)} | ID ${comp.id.toString().padStart(2)} | ${duration} | ${comp.name}`);
        });

        // Show what we're removing
        if (componentsToRemove.length > 0) {
            console.log(`\n🗑️  Components to REMOVE:`);
            componentsToRemove.forEach(comp => {
                console.log(`   ID ${comp.id.toString().padStart(2)}: ${comp.name} (${comp.type})`);
            });

            // Ask for confirmation (in a real scenario)
            console.log(`\n⚠️  About to remove ${componentsToRemove.length} components. Proceeding...`);

            // Perform the cleanup
            console.log('\n🧹 Starting cleanup...');
            let removedCount = 0;

            for (const comp of componentsToRemove) {
                try {
                    await prisma.componentLibrary.delete({
                        where: { id: comp.id }
                    });
                    console.log(`✅ Removed ID ${comp.id}: "${comp.name}" (${comp.type})`);
                    removedCount++;
                } catch (error) {
                    if (error.code === 'P2025') {
                        console.log(`⚠️  ID ${comp.id}: Already deleted`);
                    } else {
                        console.error(`❌ Failed to remove ID ${comp.id}:`, error.message);
                    }
                }
            }

            console.log(`\n🎉 Successfully removed ${removedCount} components!`);
        } else {
            console.log('\n✅ No components to remove - library already clean!');
        }

        // Final verification
        console.log('\n📊 Final First Dance component library:');
        const finalComponents = await prisma.componentLibrary.findMany({
            orderBy: [{ type: 'asc' }, { name: 'asc' }]
        });

        if (finalComponents.length > 0) {
            finalComponents.forEach(comp => {
                const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
                const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
                console.log(`${coverageIcon} ${comp.type.padEnd(8)} | ID ${comp.id.toString().padStart(2)} | ${duration} | ${comp.name}`);
            });
        }

        const totalRemaining = await prisma.componentLibrary.count();
        console.log(`\n📈 Total components remaining: ${totalRemaining}`);

        // Verify we have our complete First Dance set
        const requiredComponents = [
            { type: 'VIDEO', name: 'First Dance' },
            { type: 'AUDIO', name: 'First Dance' },
            { type: 'MUSIC', name: 'First Dance Music' },
            { type: 'GRAPHICS', name: 'First Dance Title' },
            { type: 'GRAPHICS', name: 'Ident Outro' }
        ];

        console.log('\n🎭 Verifying complete First Dance set:');
        const missingComponents = [];
        for (const required of requiredComponents) {
            const found = finalComponents.find(comp =>
                comp.type === required.type && comp.name === required.name
            );
            if (found) {
                console.log(`✅ ${required.type}: ${required.name}`);
            } else {
                console.log(`❌ ${required.type}: ${required.name} - MISSING!`);
                missingComponents.push(required);
            }
        }

        if (missingComponents.length === 0) {
            console.log('\n🎉 Perfect! Complete First Dance component set confirmed!');
            console.log('🎬 Ready for First Dance timeline building!');
        } else {
            console.log(`\n⚠️  Missing ${missingComponents.length} required components. You may need to run the seed script.`);
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup function
cleanupNonFirstDanceComponents();
