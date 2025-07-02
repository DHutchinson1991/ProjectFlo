const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupFirstDanceComponents() {
    console.log('🧹 Cleaning up First Dance components...');

    try {
        // Find the "First Dance Coverage Scene" component to remove
        const coverageSceneComponent = await prisma.componentLibrary.findFirst({
            where: { name: "First Dance Coverage Scene" }
        });

        if (coverageSceneComponent) {
            console.log(`🗑️  Found "First Dance Coverage Scene" component (ID: ${coverageSceneComponent.id})`);

            // Remove any coverage scene links for this component
            await prisma.componentCoverageScene.deleteMany({
                where: { component_id: coverageSceneComponent.id }
            });
            console.log(`✅ Removed coverage scene links for component ${coverageSceneComponent.id}`);

            // Delete the component
            await prisma.componentLibrary.delete({
                where: { id: coverageSceneComponent.id }
            });
            console.log(`✅ Deleted "First Dance Coverage Scene" component`);
        } else {
            console.log('⚠️  "First Dance Coverage Scene" component not found');
        }

        // Find the First Dance coverage scene
        const firstDanceCoverageScene = await prisma.coverage_scenes.findFirst({
            where: { name: "First Dance" }
        });

        if (!firstDanceCoverageScene) {
            console.error('❌ First Dance coverage scene not found!');
            return;
        }

        console.log(`✅ Found First Dance coverage scene (ID: ${firstDanceCoverageScene.id})`);

        // Remove ALL existing links to the coverage scene
        await prisma.componentCoverageScene.deleteMany({
            where: { coverage_scene_id: firstDanceCoverageScene.id }
        });
        console.log('✅ Cleared all existing coverage scene links');

        // Find only the VIDEO and AUDIO components that should be linked
        const componentsToLink = await prisma.componentLibrary.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: "First Dance", type: "VIDEO" },
                            { name: "First Dance Audio", type: "AUDIO" }
                        ]
                    },
                    { id: { gt: 19 } } // Only newer components
                ]
            }
        });

        console.log(`\n🔗 Found ${componentsToLink.length} components to link to coverage scene:`);
        componentsToLink.forEach(comp => {
            console.log(`   ${comp.type.padEnd(8)} | ${comp.name} (ID: ${comp.id})`);
        });

        // Link only VIDEO and AUDIO to the coverage scene
        for (const component of componentsToLink) {
            await prisma.componentCoverageScene.create({
                data: {
                    component_id: component.id,
                    coverage_scene_id: firstDanceCoverageScene.id
                }
            });
            console.log(`✅ Linked: ${component.name} → First Dance Coverage Scene`);
        }

        // Update is_coverage_linked status
        // Set to true for VIDEO and AUDIO
        await prisma.componentLibrary.updateMany({
            where: {
                OR: [
                    { name: "First Dance", type: "VIDEO" },
                    { name: "First Dance Audio", type: "AUDIO" }
                ],
                id: { gt: 19 }
            },
            data: { is_coverage_linked: true }
        });

        // Set to false for MUSIC and GRAPHICS (they should be standalone)
        await prisma.componentLibrary.updateMany({
            where: {
                OR: [
                    { name: "First Dance Music", type: "MUSIC" },
                    { name: "First Dance Title", type: "GRAPHICS" },
                    { name: "Ident Outro", type: "GRAPHICS" }
                ],
                id: { gt: 19 }
            },
            data: { is_coverage_linked: false }
        });

        console.log('✅ Updated coverage linking status for all components');

        // Verify the final result
        console.log('\n🔍 Verifying final coverage scene setup...');
        const linkedComponents = await prisma.componentCoverageScene.findMany({
            where: {
                coverage_scene_id: firstDanceCoverageScene.id
            },
            include: {
                component: true
            }
        });

        console.log('\n📊 Final First Dance Coverage Scene Components:');
        console.log(`🎬 Coverage Scene: ${firstDanceCoverageScene.name}`);
        console.log(`📝 Description: ${firstDanceCoverageScene.description}`);
        console.log(`🔗 Linked Components (${linkedComponents.length}):`);

        linkedComponents.forEach(link => {
            const comp = link.component;
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`   🔗 ${comp.type.padEnd(8)} | ${duration} | ${comp.name}`);
        });

        // Show standalone components
        const standaloneComponents = await prisma.componentLibrary.findMany({
            where: {
                OR: [
                    { name: "First Dance Music" },
                    { name: "First Dance Title" },
                    { name: "Ident Outro" }
                ],
                id: { gt: 19 }
            }
        });

        console.log('\n📁 Standalone First Dance Components:');
        standaloneComponents.forEach(comp => {
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`   📁 ${comp.type.padEnd(8)} | ${duration} | ${comp.name}`);
        });

        console.log(`\n🎉 Cleanup completed successfully!`);
        console.log(`📈 Total components in database: ${await prisma.componentLibrary.count()}`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup function
cleanupFirstDanceComponents();
