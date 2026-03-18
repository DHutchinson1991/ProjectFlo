/**
 * Backfill script: auto-resolve default_contributor_id on task_library entries.
 *
 * Strategy (mirrors task-library.service.ts resolveContributorForRole):
 * 1. If task has skills → resolve the highest bracket from skill_role_mappings.
 *    If exactly 1 contributor at that bracket → assign them.
 * 2. Fallback → find the contributor at the LOWEST tier for the role.
 *    If exactly 1 person at that lowest tier → assign them (most junior first).
 * Otherwise skip (manual pick needed).
 *
 * Usage:
 *   cd packages/backend
 *   node scripts/backfill-default-contributors.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resolveBracketFromSkills(jobRoleId, skills) {
    if (!skills || skills.length === 0) return null;
    const mappings = await prisma.skill_role_mappings.findMany({
        where: {
            job_role_id: jobRoleId,
            skill_name: { in: skills, mode: 'insensitive' },
            payment_bracket_id: { not: null },
            is_active: true,
        },
        include: { payment_bracket: { select: { id: true, level: true } } },
    });
    let highest = null;
    for (const m of mappings) {
        if (!m.payment_bracket) continue;
        if (!highest || m.payment_bracket.level > highest.level) {
            highest = { id: m.payment_bracket.id, level: m.payment_bracket.level };
        }
    }
    return highest?.id ?? null;
}

async function resolveContributor(jobRoleId, bracketId, brandId) {
    const brandFilter = brandId ? {
        contributor: {
            contact: {
                OR: [
                    { brand_id: brandId },
                    { brand_id: null }, // include Global Admins
                ],
            },
        },
    } : {};

    if (bracketId != null) {
        const bracket = await prisma.payment_brackets.findUnique({
            where: { id: bracketId },
            select: { level: true },
        });
        if (bracket) {
            const eligible = await prisma.contributor_job_roles.findMany({
                where: {
                    job_role_id: jobRoleId,
                    payment_bracket: { level: { gte: bracket.level } },
                    ...brandFilter,
                },
                select: { contributor_id: true },
            });
            if (eligible.length === 1) return { contributorId: eligible[0].contributor_id, reason: `sole qualifier for level >= ${bracket.level}` };
            if (eligible.length > 1) return { contributorId: null, reason: `${eligible.length} contributors qualify for level >= ${bracket.level}` };
        }
    }

    // Fallback: if only 1 contributor has the role at all (within brand)
    const allRows = await prisma.contributor_job_roles.findMany({
        where: { job_role_id: jobRoleId, ...brandFilter },
        select: { contributor_id: true },
    });
    if (allRows.length === 1) return { contributorId: allRows[0].contributor_id, reason: 'only contributor for role' };
    return { contributorId: null, reason: `${allRows.length} contributors for role (manual pick needed)` };
}

async function main() {
    const tasks = await prisma.task_library.findMany({
        where: {
            default_job_role_id: { not: null },
        },
        select: { id: true, name: true, default_job_role_id: true, skills_needed: true, default_contributor_id: true, brand_id: true },
    });

    console.log(`Found ${tasks.length} task(s) with a role.\n`);

    let updated = 0;
    let already = 0;
    let skipped = 0;

    for (const task of tasks) {
        const bracketId = await resolveBracketFromSkills(task.default_job_role_id, task.skills_needed);
        const { contributorId, reason } = await resolveContributor(task.default_job_role_id, bracketId, task.brand_id);

        if (contributorId != null) {
            if (task.default_contributor_id === contributorId) {
                already++;
                continue;
            }
            await prisma.task_library.update({
                where: { id: task.id },
                data: { default_contributor_id: contributorId },
            });
            console.log(`  ✅ "${task.name}" → contributor ${contributorId} (${reason})`);
            updated++;
        } else {
            if (!task.default_contributor_id) {
                console.log(`  ⏭️  "${task.name}" → skipped (${reason})`);
                skipped++;
            }
        }
    }

    console.log(`\nDone: ${updated} updated, ${already} already correct, ${skipped} still need manual pick.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

