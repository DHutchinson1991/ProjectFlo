import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.INFRASTRUCTURE);

async function seedGlobalJobRoles(): Promise<SeedSummary> {
    logger.sectionHeader('Global Job Roles', 'STEP 3/6: Job Roles');
    logger.startTimer('job-roles-seed');

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const globalJobRoles = [
        {
            name: 'videographer',
            display_name: 'Videographer',
            description: 'Operates cameras and captures video footage according to the creative vision',
            category: 'technical',
            on_site: true,
            is_active: true
        },
        {
            name: 'editor',
            display_name: 'Editor',
            description: 'Assembles and edits video footage, adds effects, transitions, and ensures smooth storytelling',
            category: 'post-production',
            on_site: false,
            is_active: true
        },
        {
            name: 'producer',
            display_name: 'Producer',
            description: 'Oversees the entire production process, manages budgets, schedules, and coordinates between different departments',
            category: 'production',
            on_site: false,
            is_active: true
        },
        {
            name: 'director',
            display_name: 'Director',
            description: 'Creative leader responsible for the overall vision and artistic direction of the project',
            category: 'creative',
            on_site: false,
            is_active: true
        },
        {
            name: 'sound_engineer',
            display_name: 'Sound Engineer',
            description: 'Records and manages audio during production, operates sound equipment',
            category: 'technical',
            on_site: true,
            is_active: true
        }
    ];

    logger.processing('Creating global job roles...');

    let rolesCreated = 0;
    let rolesUpdated = 0;

    for (const roleData of globalJobRoles) {
        const existing = await prisma.job_roles.findUnique({ where: { name: roleData.name } });
        if (existing) {
            await prisma.job_roles.update({
                where: { name: roleData.name },
                data: {
                    display_name: roleData.display_name,
                    description: roleData.description,
                    category: roleData.category,
                    on_site: roleData.on_site,
                    is_active: roleData.is_active,
                    updated_at: new Date()
                }
            });
            rolesUpdated++;
            logger.skipped(`Job role "${roleData.display_name}"`, 'already exists, updated', 'verbose');
        } else {
            await prisma.job_roles.create({
                data: {
                    ...roleData,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            rolesCreated++;
            logger.created(`Job role "${roleData.display_name}"`, undefined, 'verbose');
        }
    }

    logger.summary('Global job roles', { created: rolesCreated, updated: rolesUpdated, skipped: globalJobRoles.length - (rolesCreated + rolesUpdated), total: globalJobRoles.length });
    totalCreated += rolesCreated;
    totalUpdated += rolesUpdated;
    totalSkipped += (globalJobRoles.length - rolesCreated - rolesUpdated);

    logger.success('Global job roles seeding completed!');
    logger.info('Job Roles Available:', 'verbose');
    logger.info('  • Videographer - Camera operation and footage capture', 'verbose');
    logger.info('  • Editor - Video editing and post-production', 'verbose');
    logger.info('  • Producer - Project management and coordination', 'verbose');
    logger.info('  • Director - Creative direction and vision', 'verbose');
    logger.info('  • Sound Engineer - Audio recording and mixing', 'verbose');
    logger.endTimer('job-roles-seed', 'Job roles seeding');

    return {
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
        total: totalCreated + totalUpdated + totalSkipped
    };
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
