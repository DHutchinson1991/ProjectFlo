/**
 * Phase 2 Frontend Rename — Pass 2
 * Handles: field names, relation names, remaining type references
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'frontend', 'src');

// These are simple string replacements applied in order (longest first)
const replacements = [
  // === Snake_case field/relation renames ===
  ['contributor_job_roles', 'job_role_assignments'],
  ['contributor_id', 'crew_member_id'],
  ['assigned_contributor_id', 'assigned_crew_member_id'],
  ['default_contributor_id', 'default_crew_member_id'],
  ['default_contributor', 'default_crew_member'],
  ['assigned_contributor', 'assigned_crew_member'],
  ['project_day_operator_id', 'project_crew_slot_id'],
  ['package_day_operator_id', 'package_crew_slot_id'],
  ['package_day_operators', 'package_crew_slots'],
  ['project_day_operators', 'project_crew_slots'],
  ['user_brands', 'brand_memberships'],

  // === camelCase field renames ===
  ['assignedContributorId', 'assignedCrewMemberId'],
  ['contributorId', 'crewMemberId'],
  ['defaultContributorId', 'defaultCrewMemberId'],
  ['defaultContributor', 'defaultCrewMember'],
  ['packageDayOperators', 'packageCrewSlots'],
  ['packageDayOperatorId', 'packageCrewSlotId'],
  ['projectDayOperators', 'projectCrewSlots'],
  ['projectDayOperatorId', 'projectCrewSlotId'],
  ['contributorJobRoles', 'jobRoleAssignments'],
  ['userBrands', 'brandMemberships'],
];

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(srcDir);
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', path.relative(srcDir, file));
    count++;
  }
}

console.log(`\nPass 2 done. ${count} files updated.`);
