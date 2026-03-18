/**
 * Backfill default_job_role_id for task_library entries
 *
 * For each task that has skills_needed but no default_job_role_id,
 * this script uses skill-role mappings to pick the best matching role.
 *
 * Uses Prisma directly — no running server required.
 *
 * Usage (from packages/backend):
 *   node scripts/backfill-default-job-roles.js
 *
 * Idempotent — safe to run multiple times.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log('=== Backfill default_job_role_id for task library entries ===\n');

    // 1. Fetch all job roles
    const jobRoles = await prisma.job_roles.findMany();
    console.log(`Found ${jobRoles.length} job roles`);

    // 2. Fetch all skill-role mappings with their job_role relation
    const allMappings = await prisma.skill_role_mappings.findMany({
        include: { job_role: true },
    });
    console.log(`Found ${allMappings.length} skill-role mappings`);

    // Build lookup: skill_name (lowercase) → [{ job_role_id, job_role_name }]
    const skillToRoles = new Map();
    for (const m of allMappings) {
        const key = m.skill_name.toLowerCase();
        if (!skillToRoles.has(key)) skillToRoles.set(key, []);
        skillToRoles.get(key).push({
            job_role_id: m.job_role_id,
            job_role_name: m.job_role?.name || `Role ${m.job_role_id}`,
        });
    }

    // 3. Fetch all tasks
    const allTasks = await prisma.task_library.findMany({
        orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
    });
    console.log(`Found ${allTasks.length} total tasks\n`);

    // 4. For each task with skills_needed but no default_job_role_id, resolve the best role
    let updated = 0;
    let skippedAlreadySet = 0;
    let skippedNoSkills = 0;
    let skippedNoMatch = 0;

    for (const task of allTasks) {
        if (task.default_job_role_id) {
            skippedAlreadySet++;
            continue;
        }

        if (!task.skills_needed || task.skills_needed.length === 0) {
            skippedNoSkills++;
            continue;
        }

        // Count role occurrences across all skills
        const roleCounts = new Map();
        for (const skill of task.skills_needed) {
            const entries = skillToRoles.get(skill.toLowerCase()) || [];
            for (const entry of entries) {
                const existing = roleCounts.get(entry.job_role_id) || { count: 0, name: entry.job_role_name };
                existing.count++;
                roleCounts.set(entry.job_role_id, existing);
            }
        }

        if (roleCounts.size === 0) {
            skippedNoMatch++;
            console.log(`  ⚠ No role match for task "${task.name}" (skills: ${task.skills_needed.join(', ')})`);
            continue;
        }

        // Pick the role with the most skill matches
        let bestRoleId = null;
        let bestCount = 0;
        let bestName = '';
        for (const [roleId, data] of roleCounts) {
            if (data.count > bestCount) {
                bestCount = data.count;
                bestRoleId = roleId;
                bestName = data.name;
            }
        }

        // Update directly via Prisma
        await prisma.task_library.update({
            where: { id: task.id },
            data: { default_job_role_id: bestRoleId },
        });

        updated++;
        console.log(`  ✅ "${task.name}" → ${bestName} (${bestCount}/${task.skills_needed.length} skills matched)`);
    }

    console.log('\n=== Summary ===');
    console.log(`  Updated:            ${updated}`);
    console.log(`  Already set:        ${skippedAlreadySet}`);
    console.log(`  No skills:          ${skippedNoSkills}`);
    console.log(`  No match found:     ${skippedNoMatch}`);
    console.log(`  Total tasks:        ${allTasks.length}`);
}

main()
    .catch(err => {
        console.error('Backfill failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
