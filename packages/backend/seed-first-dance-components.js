const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFirstDanceComponents() {
    console.log('🎬 Seeding First Dance specific components...');

    try {
        // First Dance Coverage Scene Components
        const firstDanceComponents = [
            {
                name: "First Dance Coverage Scene",
                description: "Complete coverage scene capturing the first dance from multiple angles with cinematic storytelling",
                type: "VIDEO",
                complexity_score: 8,
                estimated_duration: 240, // 4 minutes
                base_task_hours: 12,
                is_coverage_linked: true
            },
            {
                name: "First Dance",
                description: "Primary video capture of the first dance with linked coverage angles and storytelling elements",
                type: "VIDEO",
                complexity_score: 7,
                estimated_duration: 240, // 4 minutes
                base_task_hours: 10,
                is_coverage_linked: true
            },
            {
                name: "First Dance Audio",
                description: "Audio capture and mixing for the first dance with ambient sound and music balancing",
                type: "AUDIO",
                complexity_score: 6,
                estimated_duration: 240, // 4 minutes
                base_task_hours: 6,
                is_coverage_linked: true
            },
            {
                name: "First Dance Music",
                description: "The chosen music track for the first dance, professionally mixed and timed",
                type: "MUSIC",
                complexity_score: 4,
                estimated_duration: 210, // 3:30 minutes
                base_task_hours: 3,
                is_coverage_linked: false
            },
            {
                name: "First Dance Title",
                description: "Opening title graphic introducing the first dance sequence",
                type: "GRAPHICS",
                complexity_score: 5,
                estimated_duration: 15, // 15 seconds
                base_task_hours: 2,
                is_coverage_linked: false
            },
            {
                name: "Ident Outro",
                description: "Closing identity/brand outro graphic for the first dance sequence",
                type: "GRAPHICS",
                complexity_score: 4,
                estimated_duration: 15, // 15 seconds
                base_task_hours: 1.5,
                is_coverage_linked: false
            }
        ];

        console.log(`📝 Creating ${firstDanceComponents.length} First Dance components...`);

        for (const component of firstDanceComponents) {
            try {
                const created = await prisma.componentLibrary.create({
                    data: component
                });
                console.log(`✅ Created: ${created.name} (${created.type}) - ${created.estimated_duration}s`);
            } catch (error) {
                console.error(`❌ Failed to create ${component.name}:`, error.message);
            }
        }

        // Verify the components were created
        console.log('\n🔍 Verifying First Dance components...');
        const firstDanceComps = await prisma.componentLibrary.findMany({
            where: {
                OR: [
                    { name: { contains: "First Dance" } },
                    { name: { contains: "Coverage Scene" } },
                    { name: { contains: "Ident Outro" } }
                ]
            },
            orderBy: { type: 'asc' }
        });

        console.log('\n📊 First Dance Components Summary:');
        firstDanceComps.forEach(comp => {
            const coverageIcon = comp.is_coverage_linked ? '🔗' : '📁';
            const duration = `${Math.floor(comp.estimated_duration / 60)}:${(comp.estimated_duration % 60).toString().padStart(2, '0')}`;
            console.log(`${coverageIcon} ${comp.type.padEnd(8)} | ${duration} | ${comp.name}`);
        });

        console.log(`\n🎉 Successfully seeded ${firstDanceComponents.length} First Dance components!`);
        console.log(`📈 Total components in database: ${await prisma.componentLibrary.count()}`);

    } catch (error) {
        console.error('❌ Error seeding First Dance components:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
seedFirstDanceComponents();
