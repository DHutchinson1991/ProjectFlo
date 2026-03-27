const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'frontend', 'src');

// Ordered: longest/most specific patterns first to avoid partial matches
const replacements = [
  // Type/interface names (longest first)
  ['ContributorApiResponse', 'CrewMemberApiResponse'],
  ['ContributorJobRole', 'CrewMemberJobRole'],
  ['NewContributorData', 'NewCrewMemberData'],
  ['UpdateContributorDto', 'UpdateCrewMemberDto'],
  ['ContributorRecord', 'CrewMemberRecord'],
  ['ContributorPickerProps', 'CrewMemberPickerProps'],
  ['ContributorPicker', 'CrewMemberPicker'],
  // Function/mapper names
  ['mapContributorResponse', 'mapCrewMemberResponse'],
  // API object names
  ['contributorsApi', 'crewMembersApi'],
  // Hook names
  ['useContributors', 'useCrewMembers'],
  // PackageDayOperator types (longest first)
  ['PackageDayOperatorEquipmentRecord', 'PackageCrewSlotEquipmentRecord'],
  ['PackageDayOperatorRecord', 'PackageCrewSlotRecord'],
  ['PackageDayOperator', 'PackageCrewSlot'],
  // ProjectDayOperator
  ['ProjectDayOperatorRecord', 'ProjectCrewSlotRecord'],
  ['ProjectDayOperator', 'ProjectCrewSlot'],
  // UserBrand
  ['UserBrandRecord', 'BrandMemberRecord'],
  ['UserBrand', 'BrandMember'],
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

console.log(`\nPass 1 done. ${count} files updated.`);
