const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function renameFirstDanceComponents() {
    console.log('✏️  Renaming First Dance components for cleaner names...');

    try {
        // Components to rename - remove redundant type indicators
        const renameOperations = [
            {
                id: 28,
                currentName: "First Dance Audio",
                newName: "First Dance",
                type: "AUDIO",
                reason: "Remove redundant 'Audio' since type field indicates this"
            }
        ];

        console.log(`📝 Planning to rename ${renameOperations.length} component(s)...`);

        // Show current state
        console.log('\n📋 Current First Dance components:');
        const currentComponents = await prisma.componentLibrary.findMany({
            where: {
                name: { contains: "First Dance" }
            },
            orderBy: [{ type: 'asc' }, { name: 'asc' }]
        });

        currentComponents.forEach(comp => {
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`${coverageIcon} ${comp.type.padEnd(8)} | ID ${comp.id.toString().padStart(2)} | ${duration} | ${comp.name}`);
        });

        // Check for potential naming conflicts
        console.log('\n🔍 Checking for naming conflicts...');
        for (const operation of renameOperations) {
            const existingComponent = await prisma.componentLibrary.findFirst({
                where: {
                    name: operation.newName,
                    type: operation.type
                }
            });

            if (existingComponent && existingComponent.id !== operation.id) {
                console.log(`⚠️  WARNING: Component with name "${operation.newName}" and type "${operation.type}" already exists (ID ${existingComponent.id})`);
                console.log(`   This would create a duplicate. Skipping rename operation.`);
                continue;
            }
        }

        // Perform the renames
        console.log('\n✏️  Starting rename operations...');
        let renamedCount = 0;

        for (const operation of renameOperations) {
            try {
                // Check if there's already a component with the same name and type
                const conflict = await prisma.componentLibrary.findFirst({
                    where: {
                        name: operation.newName,
                        type: operation.type,
                        NOT: { id: operation.id }
                    }
                });

                if (conflict) {
                    console.log(`⚠️  Skipping ID ${operation.id}: Would create duplicate with ID ${conflict.id}`);
                    continue;
                }

                const updated = await prisma.componentLibrary.update({
                    where: { id: operation.id },
                    data: { name: operation.newName }
                });

                console.log(`✅ Renamed ID ${operation.id}: "${operation.currentName}" → "${updated.name}"`);
                console.log(`   Reason: ${operation.reason}`);
                renamedCount++;
            } catch (error) {
                console.error(`❌ Failed to rename ID ${operation.id}:`, error.message);
            }
        }

        // Show final state
        console.log('\n📊 Final First Dance components:');
        const finalComponents = await prisma.componentLibrary.findMany({
            where: {
                name: { contains: "First Dance" }
            },
            orderBy: [{ type: 'asc' }, { name: 'asc' }]
        });

        finalComponents.forEach(comp => {
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`${coverageIcon} ${comp.type.padEnd(8)} | ID ${comp.id.toString().padStart(2)} | ${duration} | ${comp.name}`);
        });

        console.log(`\n🎉 Rename complete! Updated ${renamedCount} component(s).`);

        // Verify clean naming convention
        console.log('\n✅ Naming convention summary:');
        console.log('   • VIDEO: "First Dance" (primary video)');
        console.log('   • AUDIO: "First Dance" (audio capture)');
        console.log('   • MUSIC: "First Dance Music" (specific music track)');
        console.log('   • GRAPHICS: "First Dance Title" (title graphic)');
        console.log('   • GRAPHICS: "Ident Outro" (outro graphic)');

    } catch (error) {
        console.error('❌ Error during rename:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the rename function
renameFirstDanceComponents();
