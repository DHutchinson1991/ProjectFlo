/**
 * Phase 2 Frontend Rename — Pass 4
 * Handles: .contributor relation → .crew_member, type property contributor → crew_member
 * Also: remaining camelCase/type patterns
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'frontend', 'src');

const replacements = [
  // Type field "contributor?: {" or "contributor: {" → "crew_member?: {" or "crew_member: {"
  // Also property access .contributor → .crew_member
  // Using simple string replacements (works because these are distinct enough)

  // camelCase type names
  ['ContributorOption', 'CrewMemberOption'],
  ['currentUserContributor', 'currentUserCrewMember'],

  // Property access: .contributor? or .contributor. (relation field from API)
  ['.contributor?.', '.crew_member?.'],
  ['.contributor.', '.crew_member.'],
  ['.contributor)', '.crew_member)'],
  ['.contributor,', '.crew_member,'],
  ['.contributor)', '.crew_member)'],
  ['.contributor :', '.crew_member :'],

  // Type property definitions "contributor?:" and "contributor:"
  // Careful with indentation variations
  ['contributor?: {', 'crew_member?: {'],
  ['contributor: {', 'crew_member: {'],
  ['contributor?: CrewMember', 'crew_member?: CrewMember'],
  ['contributor: CrewMember', 'crew_member: CrewMember'],
  ['contributor: TrackOperator', 'crew_member: TrackOperator'],

  // bare .contributor references at end of expressions
  ['!op.contributor', '!op.crew_member'],
  ['op.contributor', 'op.crew_member'],
  ['m.contributor', 'm.crew_member'],
  ['o.contributor', 'o.crew_member'],
  ['track.contributor', 'track.crew_member'],
  ['attendee.contributor', 'attendee.crew_member'],

  // API response shapes
  ['contributor: track.crew_member', 'crew_member: track.crew_member'],

  // Query key naming
  ['contributorBrackets', 'crewMemberBrackets'],

  // Error messages and comments (rename concept)
  ["'Failed to update contributor:'", "'Failed to update crew member:'"],
  ["'Failed to save contributor assignment.'", "'Failed to save crew member assignment.'"],

  // function param names
  ['(contributor?:', '(crewMember?:'],

  // BackendCalendarEvent['contributor']
  ["BackendCalendarEvent['contributor']", "BackendCalendarEvent['crew_member']"],

  // contribName helper
  ['contribName(m.crew_member)', 'crewMemberName(m.crew_member)'],
  ['contribName', 'crewMemberName'],
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

console.log(`\nPass 4 done. ${count} files updated.`);
