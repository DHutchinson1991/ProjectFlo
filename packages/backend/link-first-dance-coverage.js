const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function linkFirstDanceComponentsToCoverageScene() {
    console.log('🎬 Linking First Dance components to Coverage Scene...');

    try {
        // First, find the First Dance coverage scene
        const firstDanceCoverageScene = await prisma.coverage_scenes.findFirst({
            where: { name: "First Dance" }
        });

        if (!firstDanceCoverageScene) {
            console.error('❌ First Dance coverage scene not found!');
            return;
        }

        console.log(`✅ Found First Dance coverage scene (ID: ${firstDanceCoverageScene.id})`);

        // Find the First Dance components we created
        const firstDanceComponents = await prisma.componentLibrary.findMany({
            where: {
                OR: [
                    { name: "First Dance Coverage Scene" },
                    { name: "First Dance" },
                    { name: "First Dance Audio" },
                    { name: "First Dance Music" },
                    { name: "First Dance Title" },
                    { name: "Ident Outro" }
                ],
                // Get only the newer ones (avoid duplicates)
                id: { gt: 19 }
            }
        });

        console.log(`📝 Found ${firstDanceComponents.length} First Dance components to link:`);
        firstDanceComponents.forEach(comp => {
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            console.log(`   ${coverageIcon} ${comp.name} (${comp.type}) - ID: ${comp.id}`);
        });

        // Link each component to the coverage scene
        console.log('\n🔗 Linking components to coverage scene...');

        for (const component of firstDanceComponents) {
            try {
                // Check if link already exists
                const existingLink = await prisma.componentCoverageScene.findFirst({
                    where: {
                        component_id: component.id,
                        coverage_scene_id: firstDanceCoverageScene.id
                    }
                });

                if (existingLink) {
                    console.log(`⚠️  Link already exists for ${component.name}`);
                    continue;
                }

                // Create the link
                await prisma.componentCoverageScene.create({
                    data: {
                        component_id: component.id,
                        coverage_scene_id: firstDanceCoverageScene.id
                    }
                });

                console.log(`✅ Linked: ${component.name} → First Dance Coverage Scene`);
            } catch (error) {
                console.error(`❌ Failed to link ${component.name}:`, error.message);
            }
        }

        // Verify the links
        console.log('\n🔍 Verifying coverage scene links...');
        const linkedComponents = await prisma.componentCoverageScene.findMany({
            where: {
                coverage_scene_id: firstDanceCoverageScene.id
            },
            include: {
                component: true
            }
        });

        console.log('\n📊 First Dance Coverage Scene Components:');
        console.log(`🎬 Coverage Scene: ${firstDanceCoverageScene.name}`);
        console.log(`📝 Description: ${firstDanceCoverageScene.description}`);
        console.log(`🔗 Linked Components (${linkedComponents.length}):`);

        linkedComponents.forEach(link => {
            const comp = link.component;
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`   ${coverageIcon} ${comp.type.padEnd(8)} | ${duration} | ${comp.name}`);
        });

        console.log(`\n🎉 Successfully linked ${firstDanceComponents.length} components to First Dance coverage scene!`);

    } catch (error) {
        console.error('❌ Error linking components to coverage scene:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the linking function
linkFirstDanceComponentsToCoverageScene();
