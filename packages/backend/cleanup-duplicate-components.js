const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateComponents() {
    console.log('🧹 Starting cleanup of duplicate and unwanted components...');

    try {
        // Components to remove by ID (duplicates and coverage-named components)
        const componentsToRemove = [
            // Duplicates (keep the newer ones, remove older IDs)
            { id: 24, name: "First Dance Title", reason: "duplicate (keeping ID 30)" },
            { id: 25, name: "Ident Outro", reason: "duplicate (keeping ID 31)" },

            // Components with "coverage" patterns that should be removed
            { id: 22, name: "First Dance with Coverage Linked (Audio)", reason: "contains 'with coverage' pattern" },
            { id: 21, name: "First Dance with Coverage Linked (Video)", reason: "contains 'with coverage' pattern" },
            { id: 20, name: "Coverage Scene - First Dance", reason: "coverage scene pattern" },
            { id: 19, name: "Test Coverage Video", reason: "test component with coverage pattern" }
        ];

        console.log(`📝 Planning to remove ${componentsToRemove.length} components...`);

        // Show what we're about to delete
        console.log('\n🗑️  Components to be removed:');
        componentsToRemove.forEach(comp => {
            console.log(`   ID ${comp.id}: "${comp.name}" - ${comp.reason}`);
        });

        // Verify these components exist before deletion
        console.log('\n🔍 Verifying components exist...');
        for (const comp of componentsToRemove) {
            const exists = await prisma.componentLibrary.findUnique({
                where: { id: comp.id }
            });

            if (exists) {
                console.log(`✅ ID ${comp.id}: "${exists.name}" exists`);
            } else {
                console.log(`⚠️  ID ${comp.id}: Component not found (may have been deleted already)`);
            }
        }

        // Perform the cleanup
        console.log('\n🧹 Starting cleanup...');
        let removedCount = 0;

        for (const comp of componentsToRemove) {
            try {
                const deleted = await prisma.componentLibrary.delete({
                    where: { id: comp.id }
                });
                console.log(`✅ Removed ID ${comp.id}: "${deleted.name}"`);
                removedCount++;
            } catch (error) {
                if (error.code === 'P2025') {
                    console.log(`⚠️  ID ${comp.id}: Already deleted or doesn't exist`);
                } else {
                    console.error(`❌ Failed to remove ID ${comp.id}:`, error.message);
                }
            }
        }

        // Show final component library status
        console.log('\n📊 Final component library status...');

        // Check remaining First Dance components
        const remainingFirstDance = await prisma.componentLibrary.findMany({
            where: {
                OR: [
                    { name: { contains: "First Dance" } },
                    { name: { contains: "Ident Outro" } }
                ]
            },
            orderBy: [{ type: 'asc' }, { name: 'asc' }]
        });

        console.log('\n🎭 Remaining First Dance components:');
        remainingFirstDance.forEach(comp => {
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`${coverageIcon} ${comp.type.padEnd(8)} | ID ${comp.id.toString().padStart(2)} | ${duration} | ${comp.name}`);
        });

        // Total component count
        const totalComponents = await prisma.componentLibrary.count();
        console.log(`\n🎉 Cleanup complete! Removed ${removedCount} components.`);
        console.log(`📈 Total components remaining: ${totalComponents}`);

        // Verify no more duplicates exist
        console.log('\n🔍 Verifying no duplicates remain...');
        const allComponents = await prisma.componentLibrary.findMany({
            select: { id: true, name: true }
        });

        const nameGroups = {};
        allComponents.forEach(comp => {
            if (!nameGroups[comp.name]) {
                nameGroups[comp.name] = [];
            }
            nameGroups[comp.name].push(comp.id);
        });

        const duplicates = Object.entries(nameGroups).filter(([name, ids]) => ids.length > 1);

        if (duplicates.length > 0) {
            console.log('⚠️  Still found duplicates:');
            duplicates.forEach(([name, ids]) => {
                console.log(`   "${name}": IDs ${ids.join(', ')}`);
            });
        } else {
            console.log('✅ No duplicates found - cleanup successful!');
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup function
cleanupDuplicateComponents();
