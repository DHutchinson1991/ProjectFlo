// System Platform Seed — Job Roles, Skill-Role Mappings, Skill-Tier Mappings
// Run after system-admin. Run before system-finance (skill-tier needs brackets).
import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedType, SeedSummary, sumSummaries } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.SYSTEM);

// ─────────────────────────────────────────────────────────────────────────────
// JOB ROLES
// ─────────────────────────────────────────────────────────────────────────────
async function seedJobRoles(): Promise<SeedSummary> {
    logger.startTimer('job-roles');
    let created = 0;
    let updated = 0;

    const globalJobRoles = [
        { name: 'videographer',  display_name: 'Videographer',    description: 'Operates cameras and captures video footage according to the creative vision',                                                              category: 'technical',        on_site: true,  is_active: true },
        { name: 'editor',        display_name: 'Editor',           description: 'Assembles and edits video footage, adds effects, transitions, and ensures smooth storytelling',                                               category: 'post-production',  on_site: false, is_active: true },
        { name: 'producer',      display_name: 'Producer',         description: 'Oversees the entire production process, manages budgets, schedules, and coordinates between different departments',                           category: 'production',       on_site: false, is_active: true },
        { name: 'director',      display_name: 'Director',         description: 'Creative leader responsible for the overall vision and artistic direction of the project',                                                     category: 'creative',         on_site: false, is_active: true },
        { name: 'sound_engineer', display_name: 'Sound Engineer',  description: 'Records and manages audio during production, operates sound equipment',                                                                        category: 'technical',        on_site: true,  is_active: true },
    ];

    logger.processing('Creating global job roles...');
    for (const roleData of globalJobRoles) {
        const existing = await prisma.job_roles.findUnique({ where: { name: roleData.name } });
        if (existing) {
            await prisma.job_roles.update({ where: { name: roleData.name }, data: { ...roleData, updated_at: new Date() } });
            updated++;
            logger.skipped(`Job role "${roleData.display_name}"`, 'updated', 'verbose');
        } else {
            await prisma.job_roles.create({ data: { ...roleData, created_at: new Date(), updated_at: new Date() } });
            created++;
            logger.created(`Job role "${roleData.display_name}"`, undefined, 'verbose');
        }
    }

    logger.smartSummary('Job roles', created, updated, globalJobRoles.length);
    logger.endTimer('job-roles', 'Job roles');
    return { created, updated, skipped: globalJobRoles.length - created - updated, total: globalJobRoles.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL-ROLE MAPPINGS
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_ROLE_MAPPINGS = [
    // === PRODUCER ===
    { skill_name: 'Sales',              job_role: 'producer', priority: 2 },
    { skill_name: 'Communication',      job_role: 'producer', priority: 2 },
    { skill_name: 'Client Relations',   job_role: 'producer', priority: 3 },
    { skill_name: 'Consultation',       job_role: 'producer', priority: 3 },
    { skill_name: 'Presentation',       job_role: 'producer', priority: 2 },
    { skill_name: 'Project Management', job_role: 'producer', priority: 3 },
    { skill_name: 'Planning',           job_role: 'producer', priority: 2 },
    { skill_name: 'Pricing',            job_role: 'producer', priority: 2 },
    { skill_name: 'Legal',              job_role: 'producer', priority: 2 },
    { skill_name: 'Documentation',      job_role: 'producer', priority: 1 },
    { skill_name: 'Scheduling',         job_role: 'producer', priority: 2 },
    { skill_name: 'Vendor Coordination',job_role: 'producer', priority: 2 },
    { skill_name: 'Contract Management',job_role: 'producer', priority: 3 },
    { skill_name: 'Budget Management',  job_role: 'producer', priority: 2 },
    { skill_name: 'Client Delivery',    job_role: 'producer', priority: 2 },
    { skill_name: 'Invoicing',          job_role: 'producer', priority: 1 },
    { skill_name: 'Archiving',          job_role: 'producer', priority: 1 },
    // === DIRECTOR ===
    { skill_name: 'Creative Direction', job_role: 'director', priority: 3 },
    { skill_name: 'Creative Vision',    job_role: 'director', priority: 3 },
    { skill_name: 'Storytelling',       job_role: 'director', priority: 3 },
    { skill_name: 'Shot Planning',      job_role: 'director', priority: 3 },
    { skill_name: 'Mood Board Creation',job_role: 'director', priority: 2 },
    { skill_name: 'Style Guide',        job_role: 'director', priority: 2 },
    { skill_name: 'Visual Arts',        job_role: 'director', priority: 2 },
    { skill_name: 'Design',             job_role: 'director', priority: 2 },
    // === VIDEOGRAPHER ===
    { skill_name: 'Cinematography',     job_role: 'videographer', priority: 3 },
    { skill_name: 'Camera Operation',   job_role: 'videographer', priority: 3 },
    { skill_name: 'Lighting',           job_role: 'videographer', priority: 2 },
    { skill_name: 'Event Coverage',     job_role: 'videographer', priority: 3 },
    { skill_name: 'Detail Photography', job_role: 'videographer', priority: 2 },
    { skill_name: 'Multi-Camera',       job_role: 'videographer', priority: 2 },
    { skill_name: 'Location Scouting',  job_role: 'videographer', priority: 2 },
    { skill_name: 'Equipment Management',job_role: 'videographer', priority: 2 },
    { skill_name: 'Location Management',job_role: 'videographer', priority: 1 },
    { skill_name: 'Photography',        job_role: 'videographer', priority: 1 },
    { skill_name: 'Travel',             job_role: 'videographer', priority: 1 },
    { skill_name: 'Technical Knowledge',job_role: 'videographer', priority: 1 },
    // === EDITOR ===
    { skill_name: 'Video Editing',      job_role: 'editor', priority: 3 },
    { skill_name: 'Color Grading',      job_role: 'editor', priority: 3 },
    { skill_name: 'Content Review',     job_role: 'editor', priority: 2 },
    { skill_name: 'Organization',       job_role: 'editor', priority: 1 },
    { skill_name: 'Music Sync',         job_role: 'editor', priority: 2 },
    { skill_name: 'Music Selection',    job_role: 'editor', priority: 2 },
    { skill_name: 'Music Licensing',    job_role: 'editor', priority: 1 },
    { skill_name: 'Title Card Design',  job_role: 'editor', priority: 2 },
    { skill_name: 'Motion Graphics',    job_role: 'editor', priority: 2 },
    { skill_name: 'Rough Cut Editing',  job_role: 'editor', priority: 3 },
    { skill_name: 'Final Export',       job_role: 'editor', priority: 2 },
    { skill_name: 'Quality Control',    job_role: 'editor', priority: 2 },
    { skill_name: 'Media Rendering',    job_role: 'editor', priority: 2 },
    { skill_name: 'Gallery Setup',      job_role: 'editor', priority: 1 },
    // === SOUND ENGINEER ===
    { skill_name: 'Audio Engineering',     job_role: 'sound_engineer', priority: 3 },
    { skill_name: 'Sound Design',          job_role: 'sound_engineer', priority: 3 },
    { skill_name: 'Audio Recording',       job_role: 'sound_engineer', priority: 3 },
    { skill_name: 'Audio Enhancement',     job_role: 'sound_engineer', priority: 3 },
    { skill_name: 'Live Audio Recording',  job_role: 'sound_engineer', priority: 3 },
    { skill_name: 'Sound Engineering',     job_role: 'sound_engineer', priority: 3 },
    { skill_name: 'Technical Skills',      job_role: 'sound_engineer', priority: 1 },
    // === CROSS-ROLE ===
    { skill_name: 'Communication',      job_role: 'director', priority: 1 },
    { skill_name: 'Storytelling',       job_role: 'editor',   priority: 2 },
    { skill_name: 'Planning',           job_role: 'director', priority: 1 },
];

async function seedSkillRoleMappings(): Promise<SeedSummary> {
    logger.startTimer('skill-role-mappings');
    logger.processing('Creating skill-role mappings...');

    const roles = await prisma.job_roles.findMany({ where: { is_active: true }, select: { id: true, name: true, display_name: true } });
    const roleMap = new Map(roles.map((r) => [r.name, r]));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const mapping of SKILL_ROLE_MAPPINGS) {
        const role = roleMap.get(mapping.job_role);
        if (!role) { skipped++; continue; }

        const existing = await prisma.skill_role_mappings.findFirst({
            where: { skill_name: mapping.skill_name, job_role_id: role.id, brand_id: null },
        });

        if (existing) {
            await prisma.skill_role_mappings.update({ where: { id: existing.id }, data: { priority: mapping.priority, is_active: true } });
            updated++;
        } else {
            await prisma.skill_role_mappings.create({ data: { skill_name: mapping.skill_name, job_role_id: role.id, brand_id: null, priority: mapping.priority } });
            created++;
        }
    }

    logger.smartSummary('Skill-role mappings', created, updated, SKILL_ROLE_MAPPINGS.length);
    logger.endTimer('skill-role-mappings', 'Skill-role mappings');
    return { created, updated, skipped, total: SKILL_ROLE_MAPPINGS.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL-TIER MAPPINGS  (requires payment_brackets — run after system-finance)
// ─────────────────────────────────────────────────────────────────────────────
const TIER_SKILLS = [
    // DIRECTOR (4 tiers)
    { role: 'director', level: 1, skill: 'Planning',          priority: 1 },
    { role: 'director', level: 1, skill: 'Communication',     priority: 1 },
    { role: 'director', level: 2, skill: 'Shot Planning',     priority: 2 },
    { role: 'director', level: 2, skill: 'Mood Board Creation',priority: 2 },
    { role: 'director', level: 2, skill: 'Design',            priority: 2 },
    { role: 'director', level: 3, skill: 'Creative Direction',priority: 3 },
    { role: 'director', level: 3, skill: 'Style Guide',       priority: 3 },
    { role: 'director', level: 3, skill: 'Visual Arts',       priority: 2 },
    { role: 'director', level: 4, skill: 'Storytelling',      priority: 3 },
    { role: 'director', level: 4, skill: 'Creative Vision',   priority: 3 },
    // VIDEOGRAPHER (5 tiers)
    { role: 'videographer', level: 1, skill: 'Equipment Management', priority: 1 },
    { role: 'videographer', level: 1, skill: 'Technical Knowledge',  priority: 1 },
    { role: 'videographer', level: 1, skill: 'Travel',               priority: 1 },
    { role: 'videographer', level: 2, skill: 'Camera Operation',     priority: 2 },
    { role: 'videographer', level: 2, skill: 'Photography',          priority: 1 },
    { role: 'videographer', level: 2, skill: 'Location Management',  priority: 1 },
    { role: 'videographer', level: 3, skill: 'Lighting',             priority: 2 },
    { role: 'videographer', level: 3, skill: 'Detail Photography',   priority: 2 },
    { role: 'videographer', level: 3, skill: 'Location Scouting',    priority: 2 },
    { role: 'videographer', level: 4, skill: 'Cinematography',       priority: 3 },
    { role: 'videographer', level: 4, skill: 'Event Coverage',       priority: 3 },
    { role: 'videographer', level: 4, skill: 'Multi-Camera',         priority: 2 },
    // EDITOR (4 tiers)
    { role: 'editor', level: 1, skill: 'Organization',       priority: 1 },
    { role: 'editor', level: 1, skill: 'Gallery Setup',       priority: 1 },
    { role: 'editor', level: 1, skill: 'Media Rendering',    priority: 1 },
    { role: 'editor', level: 2, skill: 'Video Editing',      priority: 2 },
    { role: 'editor', level: 2, skill: 'Rough Cut Editing',  priority: 2 },
    { role: 'editor', level: 2, skill: 'Final Export',       priority: 2 },
    { role: 'editor', level: 2, skill: 'Quality Control',    priority: 2 },
    { role: 'editor', level: 3, skill: 'Color Grading',      priority: 3 },
    { role: 'editor', level: 3, skill: 'Music Sync',         priority: 3 },
    { role: 'editor', level: 3, skill: 'Content Review',     priority: 2 },
    { role: 'editor', level: 3, skill: 'Storytelling',       priority: 2 },
    { role: 'editor', level: 4, skill: 'Motion Graphics',    priority: 3 },
    { role: 'editor', level: 4, skill: 'Title Card Design',  priority: 2 },
    { role: 'editor', level: 4, skill: 'Music Selection',    priority: 2 },
    { role: 'editor', level: 4, skill: 'Music Licensing',    priority: 1 },
    // PRODUCER (5 tiers)
    { role: 'producer', level: 1, skill: 'Documentation',      priority: 1 },
    { role: 'producer', level: 1, skill: 'Archiving',          priority: 1 },
    { role: 'producer', level: 2, skill: 'Communication',      priority: 1 },
    { role: 'producer', level: 2, skill: 'Planning',           priority: 1 },
    { role: 'producer', level: 2, skill: 'Scheduling',         priority: 2 },
    { role: 'producer', level: 3, skill: 'Client Relations',   priority: 3 },
    { role: 'producer', level: 3, skill: 'Budget Management',  priority: 2 },
    { role: 'producer', level: 3, skill: 'Vendor Coordination',priority: 2 },
    { role: 'producer', level: 3, skill: 'Presentation',       priority: 2 },
    { role: 'producer', level: 4, skill: 'Project Management', priority: 3 },
    { role: 'producer', level: 4, skill: 'Contract Management',priority: 3 },
    { role: 'producer', level: 4, skill: 'Legal',              priority: 2 },
    { role: 'producer', level: 4, skill: 'Client Delivery',    priority: 2 },
    { role: 'producer', level: 5, skill: 'Consultation',       priority: 3 },
    { role: 'producer', level: 5, skill: 'Sales',              priority: 2 },
    { role: 'producer', level: 5, skill: 'Pricing',            priority: 2 },
    { role: 'producer', level: 5, skill: 'Invoicing',          priority: 1 },
    // SOUND ENGINEER (5 tiers)
    { role: 'sound_engineer', level: 1, skill: 'Technical Skills',  priority: 1 },
    { role: 'sound_engineer', level: 2, skill: 'Audio Recording',   priority: 2 },
    { role: 'sound_engineer', level: 3, skill: 'Audio Enhancement', priority: 3 },
    { role: 'sound_engineer', level: 4, skill: 'Sound Design',      priority: 3 },
    { role: 'sound_engineer', level: 5, skill: 'Audio Engineering', priority: 3 },
];

async function seedSkillTierMappings(): Promise<SeedSummary> {
    logger.startTimer('skill-tier-mappings');
    logger.processing('Creating skill-tier mappings...');

    const roles = await prisma.job_roles.findMany({ where: { is_active: true } });
    const brackets = await prisma.payment_brackets.findMany({ where: { is_active: true } });

    if (brackets.length === 0) {
        logger.info('No payment brackets found — skipping skill-tier mappings (run system-finance first)', 'normal');
        return { created: 0, updated: 0, skipped: TIER_SKILLS.length, total: TIER_SKILLS.length };
    }

    const roleMap: Record<string, typeof roles[0]> = {};
    for (const r of roles) roleMap[r.name] = r;

    const bracketLookup: Record<string, Record<number, typeof brackets[0]>> = {};
    for (const b of brackets) {
        const role = roles.find((r) => r.id === b.job_role_id);
        if (!role) continue;
        if (!bracketLookup[role.name]) bracketLookup[role.name] = {};
        bracketLookup[role.name][b.level] = b;
    }

    // Clear existing global mappings before re-seeding
    await prisma.skill_role_mappings.deleteMany({ where: { payment_bracket_id: { not: null }, brand_id: null } });

    let created = 0;
    let skipped = 0;

    for (const entry of TIER_SKILLS) {
        const role = roleMap[entry.role];
        if (!role) { skipped++; continue; }

        const bracket = bracketLookup[entry.role]?.[entry.level];
        if (!bracket) { skipped++; logger.info(`  ⚠ No bracket for ${entry.role} L${entry.level}`, 'verbose'); continue; }

        const skillName = entry.skill.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        const existing = await prisma.skill_role_mappings.findFirst({
            where: { skill_name: skillName, job_role_id: role.id, payment_bracket_id: bracket.id, brand_id: null },
        });

        if (existing) {
            await prisma.skill_role_mappings.update({ where: { id: existing.id }, data: { priority: entry.priority, is_active: true } });
        } else {
            await prisma.skill_role_mappings.create({ data: { skill_name: skillName, job_role_id: role.id, payment_bracket_id: bracket.id, brand_id: null, priority: entry.priority } });
        }
        created++;
    }

    logger.smartSummary('Skill-tier mappings', created, 0, TIER_SKILLS.length);
    logger.endTimer('skill-tier-mappings', 'Skill-tier mappings');
    return { created, updated: 0, skipped, total: TIER_SKILLS.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
async function main(db: PrismaClient): Promise<SeedSummary> {
    prisma = db;
    logger.sectionHeader('System Platform');
    logger.startTimer('system-platform');

    const s1 = await seedJobRoles();
    logger.sectionDivider('Skill-Role Mappings');
    const s2 = await seedSkillRoleMappings();
    logger.sectionDivider('Skill-Tier Mappings');
    const s3 = await seedSkillTierMappings();

    const total = sumSummaries(s1, s2, s3);
    logger.success(`System Platform done — Created: ${total.created}, Updated: ${total.updated}`);
    logger.endTimer('system-platform', 'System Platform');
    return total;
}

export default main;
