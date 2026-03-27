/**
 * Phase 2 Frontend Rename — Pass 6
 * Handles: remaining type names and field properties
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'frontend', 'src');

const replacements = [
  // Type names
  ['BracketContributorAssignment', 'BracketCrewMemberAssignment'],

  // contributor?: any → crew_member?: any (in type definitions)
  ['contributor?: any', 'crew_member?: any'],

  // local variable renames in ProfileSettings
  ['[contributor, setContributor]', '[crewMember, setCrewMember]'],
  ['if (!contributor)', 'if (!crewMember)'],
  ['contributor.id', 'crewMember.id'],
  ['contributor.contact_id', 'crewMember.contact_id'],
  ['!contributor)', '!crewMember)'],
  ['getUserInitials(contributor)', 'getUserInitials(crewMember)'],
  ['getUserDisplayName(contributor)', 'getUserDisplayName(crewMember)'],
  ['contributor.role?.', 'crewMember.role?.'],
  ['contributor.contact?.', 'crewMember.contact?.'],
  ['loadError || !contributor', 'loadError || !crewMember'],

  // contributorData variable name
  ['contributorData', 'crewMemberData'],

  // ContributorSelector file import path (keep the slash)
  ["from './ContributorSelector'", "from './CrewMemberSelector'"],
  ["from '../ContributorSelector'", "from '../CrewMemberSelector'"],
  ["{ ContributorSelector }", "{ CrewMemberSelector }"],
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

console.log(`\nPass 6 done. ${count} files updated.`);
