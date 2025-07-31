import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGlobalJobRoles() {
    console.log('🎬 Seeding global job roles...');

    const globalJobRoles = [
        {
            name: 'videographer',
            display_name: 'Videographer',
            description: 'Operates cameras and captures video footage according to the creative vision',
            category: 'technical',
            is_active: true
        },
        {
            name: 'editor',
            display_name: 'Editor',
            description: 'Assembles and edits video footage, adds effects, transitions, and ensures smooth storytelling',
            category: 'post-production',
            is_active: true
        },
        {
            name: 'producer',
            display_name: 'Producer',
            description: 'Oversees the entire production process, manages budgets, schedules, and coordinates between different departments',
            category: 'production',
            is_active: true
        },
        {
            name: 'director',
            display_name: 'Director',
            description: 'Creative leader responsible for the overall vision and artistic direction of the project',
            category: 'creative',
            is_active: true
        },
        {
            name: 'sound_engineer',
            display_name: 'Sound Engineer',
            description: 'Records and manages audio during production, operates sound equipment',
            category: 'technical',
            is_active: true
        }
    ];

    console.log('🎭 Creating global job roles...');

    for (const roleData of globalJobRoles) {
        const jobRole = await prisma.job_roles.upsert({
            where: { name: roleData.name },
            update: {
                display_name: roleData.display_name,
                description: roleData.description,
                category: roleData.category,
                is_active: roleData.is_active,
                updated_at: new Date()
            },
            create: {
                ...roleData,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        console.log(`✅ Global job role created/updated: ${jobRole.display_name} (${jobRole.name})`);
    }

    console.log('🎭 Global job roles seeding completed!');
    console.log(`📊 Total job roles: ${globalJobRoles.length}`);
}

export default seedGlobalJobRoles;

// Allow running this file directly
if (require.main === module) {
    seedGlobalJobRoles()
        .catch((error) => {
            console.error('❌ Error seeding global job roles:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
