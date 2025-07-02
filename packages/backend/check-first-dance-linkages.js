const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFirstDanceLinkages() {
    try {
        // Find the First Dance coverage scene
        const coverageScene = await prisma.coverageScene.findUnique({
            where: { id: 8 },
            include: {
                components: {
                    include: {
                        component: true
                    }
                }
            }
        });

        console.log('First Dance Coverage Scene:');
        console.log(JSON.stringify(coverageScene, null, 2));

        // Also check all components that are marked as coverage_linked
        const linkedComponents = await prisma.componentLibrary.findMany({
            where: {
                is_coverage_linked: true
            }
        });

        console.log('\nAll components marked as coverage_linked:');
        console.log(JSON.stringify(linkedComponents, null, 2));

        // Check all component-coverage relationships
        const relationships = await prisma.componentCoverageScene.findMany({
            include: {
                component: true,
                coverage_scene: true
            }
        });

        console.log('\nAll component-coverage relationships:');
        console.log(JSON.stringify(relationships, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkFirstDanceLinkages();
