/**
 * Backfill default_job_role_id for task_library entries
 * 
 * For each task that has skills_needed but no default_job_role_id,
 * this script fetches skill-role mappings and picks the best matching role.
 * 
 * Usage:
 *   1. Make sure the backend server is running (http://localhost:3002)
 *   2. Run: node scripts/backfill-default-job-roles.js
 */

const BASE_URL = 'http://localhost:3002';

async function main() {
    console.log('=== Backfill default_job_role_id for task library entries ===\n');

    // 1. Fetch all job roles
    const rolesRes = await fetch(`${BASE_URL}/job-roles`);
    if (!rolesRes.ok) throw new Error(`Failed to fetch job roles: ${rolesRes.status}`);
    const jobRoles = await rolesRes.json();
    console.log(`Found ${jobRoles.length} job roles`);

    // 2. Fetch all skill-role mappings
    const mappingsRes = await fetch(`${BASE_URL}/skill-role-mappings`);
    if (!mappingsRes.ok) throw new Error(`Failed to fetch mappings: ${mappingsRes.status}`);
    const allMappings = await mappingsRes.json();
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

    // 3. Fetch all tasks (grouped by phase)
    const tasksRes = await fetch(`${BASE_URL}/task-library/grouped`);
    if (!tasksRes.ok) throw new Error(`Failed to fetch tasks: ${tasksRes.status}`);
    const tasksByPhase = await tasksRes.json();

    // Flatten tasks
    const allTasks = Object.values(tasksByPhase).flat();
    console.log(`Found ${allTasks.length} total tasks\n`);

    // 4. For each task with skills_needed but no default_job_role_id, resolve the best role
    let updated = 0;
    let skippedAlreadySet = 0;
    let skippedNoSkills = 0;
    let skippedNoMatch = 0;

    for (const task of allTasks) {
        // Skip if already has a role assigned
        if (task.default_job_role_id) {
            skippedAlreadySet++;
            continue;
        }

        // Skip if no skills
        if (!task.skills_needed || task.skills_needed.length === 0) {
            skippedNoSkills++;
            continue;
        }

        // Count role occurrences across all skills
        const roleCounts = new Map(); // job_role_id → { count, name }
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

        // Update via API
        const updateRes = await fetch(`${BASE_URL}/task-library/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ default_job_role_id: bestRoleId }),
        });

        if (updateRes.ok) {
            updated++;
            console.log(`  ✅ "${task.name}" → ${bestName} (${bestCount}/${task.skills_needed.length} skills matched)`);
        } else {
            console.log(`  ❌ Failed to update "${task.name}": ${updateRes.status}`);
        }
    }

    console.log('\n=== Summary ===');
    console.log(`  Updated:            ${updated}`);
    console.log(`  Already set:        ${skippedAlreadySet}`);
    console.log(`  No skills:          ${skippedNoSkills}`);
    console.log(`  No match found:     ${skippedNoMatch}`);
    console.log(`  Total tasks:        ${allTasks.length}`);
}

main().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
