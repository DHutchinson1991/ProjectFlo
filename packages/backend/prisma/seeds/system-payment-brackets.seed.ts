// System Payment Brackets Seed
// Seeds industry-standard payment tiers for all active job roles.
// Run after global-job-roles so all roles exist first.
import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.INFRASTRUCTURE);

// ── UK NLW base + £1.25/hr increments (total £5 spread from trainee to lead) ───────
// T1 = £12.21 | T2 = £13.46 | T3 = £14.71 | T4 = £15.96 | T5 = £17.21
const T: Record<number, { h: number; d: number; o: number }> = {
    1: { h: 12.21, d: parseFloat((12.21 * 8).toFixed(2)), o: parseFloat((12.21 * 1.5).toFixed(2)) },
    2: { h: 13.46, d: parseFloat((13.46 * 8).toFixed(2)), o: parseFloat((13.46 * 1.5).toFixed(2)) },
    3: { h: 14.71, d: parseFloat((14.71 * 8).toFixed(2)), o: parseFloat((14.71 * 1.5).toFixed(2)) },
    4: { h: 15.96, d: parseFloat((15.96 * 8).toFixed(2)), o: parseFloat((15.96 * 1.5).toFixed(2)) },
    5: { h: 17.21, d: parseFloat((17.21 * 8).toFixed(2)), o: parseFloat((17.21 * 1.5).toFixed(2)) },
};

const TIERS: Record<string, {
    name: string;
    display_name: string;
    level: number;
    hourly_rate: number;
    day_rate: number;
    overtime_rate: number;
    color: string;
    description: string;
}[]> = {
    // Creative roles (directors, DPs, etc.)
    creative: [
        { name: 'junior',  display_name: 'Junior',      level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: '#66BB6A', description: 'Entry-level, assisting senior crew' },
        { name: 'mid',     display_name: 'Mid-Level',    level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: '#42A5F5', description: 'Independently competent' },
        { name: 'senior',  display_name: 'Senior',       level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: '#AB47BC', description: 'Lead creative, mentors juniors' },
        { name: 'lead',    display_name: 'Lead / Head',  level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: '#FF7043', description: 'Department lead, full creative ownership' },
    ],
    // Technical roles (videographers, sound engineers, etc.)
    technical: [
        { name: 'trainee', display_name: 'Trainee',          level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: '#78909C', description: 'In training, shadowing experienced crew' },
        { name: 'junior',  display_name: 'Junior',           level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: '#66BB6A', description: 'Entry-level operator' },
        { name: 'mid',     display_name: 'Mid-Level',        level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: '#42A5F5', description: 'Solid all-round operator' },
        { name: 'senior',  display_name: 'Senior',           level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: '#AB47BC', description: 'Expert operator, complex setups' },
        { name: 'lead',    display_name: 'Lead / Principal', level: 5, hourly_rate: T[5].h, day_rate: T[5].d, overtime_rate: T[5].o, color: '#FF7043', description: 'Technical lead, oversees full kit & crew' },
    ],
    // Production roles (producers, coordinators, etc.)
    production: [
        { name: 'assistant',  display_name: 'Assistant',  level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: '#78909C', description: 'Production assistant' },
        { name: 'junior',     display_name: 'Junior',     level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: '#66BB6A', description: 'Junior producer / coordinator' },
        { name: 'mid',        display_name: 'Mid-Level',  level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: '#42A5F5', description: 'Experienced producer' },
        { name: 'senior',     display_name: 'Senior',     level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: '#AB47BC', description: 'Senior producer, client-facing lead' },
        { name: 'executive',  display_name: 'Executive',  level: 5, hourly_rate: T[5].h, day_rate: T[5].d, overtime_rate: T[5].o, color: '#FF7043', description: 'Executive producer, full project ownership' },
    ],
    // Post-production roles (editors, colourists, motion designers, etc.)
    'post-production': [
        { name: 'junior',  display_name: 'Junior',              level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: '#66BB6A', description: 'Assist edits, basic assembly' },
        { name: 'mid',     display_name: 'Mid-Level',           level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: '#42A5F5', description: 'Independent editor, standard deliverables' },
        { name: 'senior',  display_name: 'Senior',              level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: '#AB47BC', description: 'Senior editor, complex multi-cam / VFX' },
        { name: 'lead',    display_name: 'Lead / Supervising',  level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: '#FF7043', description: 'Post-production supervisor' },
    ],
    // Fallback for uncategorised roles
    _default: [
        { name: 'junior',  display_name: 'Junior',    level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: '#66BB6A', description: 'Entry-level' },
        { name: 'mid',     display_name: 'Mid-Level', level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: '#42A5F5', description: 'Independent contributor' },
        { name: 'senior',  display_name: 'Senior',    level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: '#AB47BC', description: 'Expert level' },
        { name: 'lead',    display_name: 'Lead',      level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: '#FF7043', description: 'Team lead' },
    ],
};

async function seedPaymentBrackets(): Promise<SeedSummary> {
    logger.sectionHeader('System Payment Brackets', 'STEP 3.5: Payment Tiers');
    logger.startTimer('payment-brackets-seed');

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const roles = await prisma.job_roles.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
    });

    logger.processing(`Seeding payment brackets for ${roles.length} active job roles...`);

    for (const role of roles) {
        const category = (role.category || '').toLowerCase();
        const tiers = TIERS[category] ?? TIERS._default;
        const roleLabel = role.display_name || role.name;

        logger.info(`  📋 ${roleLabel} (${category || 'uncategorised'}) — ${tiers.length} tiers`, 'verbose');

        for (const tier of tiers) {
            const displayName = `${tier.display_name} ${roleLabel}`;

            const existing = await prisma.payment_brackets.findUnique({
                where: { job_role_id_name: { job_role_id: role.id, name: tier.name } },
            });

            const bracketData = {
                job_role_id: role.id,
                name: tier.name,
                display_name: displayName,
                level: tier.level,
                hourly_rate: tier.hourly_rate,
                day_rate: tier.day_rate,
                overtime_rate: tier.overtime_rate,
                description: tier.description,
                color: tier.color,
                is_active: true,
            };

            if (existing) {
                await prisma.payment_brackets.update({
                    where: { job_role_id_name: { job_role_id: role.id, name: tier.name } },
                    data: {
                        hourly_rate: tier.hourly_rate,
                        day_rate: tier.day_rate,
                        overtime_rate: tier.overtime_rate,
                        level: tier.level,
                        display_name: displayName,
                        description: tier.description,
                        color: tier.color,
                    },
                });
                totalUpdated++;
                logger.created(`Payment bracket "${displayName}" — £${tier.hourly_rate.toFixed(2)}/hr (updated)`, undefined, 'verbose');
            } else {
                await prisma.payment_brackets.create({ data: bracketData });
                totalCreated++;
                logger.created(`Payment bracket "${displayName}" — £${tier.hourly_rate.toFixed(2)}/hr`, undefined, 'verbose');
            }
        }
    }

    const totalBrackets = roles.reduce((sum, role) => {
        const cat = (role.category || '').toLowerCase();
        return sum + (TIERS[cat] ?? TIERS._default).length;
    }, 0);

    logger.summary('Payment brackets', {
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
        total: totalBrackets,
    });

    logger.success('Payment brackets seeding complete!');
    logger.endTimer('payment-brackets-seed', 'Payment brackets seeding');

    return {
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
        total: totalBrackets,
    };
}

export default seedPaymentBrackets;

// Allow running directly
if (require.main === module) {
    seedPaymentBrackets()
        .then((summary) => {
            console.log('Payment brackets seed completed:', summary);
        })
        .catch((e) => {
            console.error('❌ Payment brackets seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
