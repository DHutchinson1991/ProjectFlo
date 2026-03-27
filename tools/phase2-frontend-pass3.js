/**
 * Phase 2 Frontend Rename — Pass 3
 * Handles: Contributor interface/type → CrewMember (careful — avoid string literals and variable names)
 * Also handles: transformContributor function name, .contributor relation fields
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'packages', 'frontend', 'src');

// Regex replacements: [pattern, replacement]
// These use word boundaries and context to avoid false positives
const regexReplacements = [
  // Type imports/exports: "import type { Contributor }" or "export type { Contributor }"
  [/\bContributor\b(?=\s*[,}\]>]|\s*$)/gm, 'CrewMember'],
  // Type annotations: ": Contributor" or ": Contributor[]" or "as Contributor"
  [/(?<=:\s*)Contributor\b/g, 'CrewMember'],
  [/(?<=as\s+)Contributor\b/g, 'CrewMember'],
  // Generic type params: "<Contributor" or "Contributor>"
  [/(?<=<)Contributor\b/g, 'CrewMember'],
  // Interface/type declaration
  [/(?<=interface\s+)Contributor\b/g, 'CrewMember'],
  [/(?<=type\s+)Contributor\b/g, 'CrewMember'],
  // "Contributor[]" as standalone type in function params
  [/\bContributor\[\]/g, 'CrewMember[]'],
  // Import from patterns
  [/\bContributor\b(?=\s*(?:,|\})\s*from)/g, 'CrewMember'],

  // .contributor relation field → .crew_member (API response shape)
  // Match property access: obj.contributor (but not .contributors or .crew_member_id etc)
  // Be careful: only in API response / type contexts, not in local variable accesses
];

// Simple string replacements (safe partial words)
const simpleReplacements = [
  // Function/variable name renames that are clearly about the old "contributor" concept
  ['transformContributor', 'transformCrewMember'],
  // Type/re-export patterns
  ["export type { Contributor }", "export type { CrewMember }"],
  ["import type { Contributor }", "import type { CrewMember }"],
  // "Contributor" in type position in generics
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

  // Apply simple string replacements first
  for (const [from, to] of simpleReplacements) {
    content = content.replaceAll(from, to);
  }

  // Apply regex replacements
  for (const [pattern, replacement] of regexReplacements) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', path.relative(srcDir, file));
    count++;
  }
}

console.log(`\nPass 3 done. ${count} files updated.`);
