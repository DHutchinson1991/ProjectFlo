/**
 * Phase 2 Frontend Rename — Pass 7
 * Final cleanup: PickerContributor, use-contributors file rename, comments update
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'frontend', 'src');

const replacements = [
  ['PickerContributor', 'PickerCrewMember'],
  // Remaining import path references that might still point to old names
  ["'./ContributorPicker'", "'./CrewMemberPicker'"],
  ["'../ContributorPicker'", "'../CrewMemberPicker'"],
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

console.log(`\nPass 7 done. ${count} files updated.`);
