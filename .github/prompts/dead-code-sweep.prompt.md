---
description: "Find and remove dead code across a feature or the entire codebase. Identifies unused exports, orphaned files, and stale imports."
---

# Dead Code Sweep

Systematically find and remove dead code in a feature or across the codebase.

## Input

The user will specify either:
- A feature path: `features/catalog/packages` — sweep that feature only
- `all` — sweep the entire frontend or backend

## Process

### 1. Discover dead code (read-only)

For each file in scope:

1. **List all exports** from the file.
2. **Search the entire codebase** for each export name. An export is dead if:
   - It is not imported by any other file, AND
   - It is not used within the same file (for non-exported functions), AND
   - It is not a barrel re-export consumed elsewhere.
3. **Check for orphaned files** — files with no imports from anywhere in the codebase.
4. **Check for stale type-only files** — type files where none of the exported types are used.
5. **Check for dead API methods** — endpoint bindings in `api/` that no hook or component calls.

Produce a **dead code report**:

```markdown
Dead code report — <scope>

Orphaned files (no imports found):
- [file path] — [what it exports]

Dead exports (exported but never imported):
- [file:export name] — [last meaningful use if in git history]

Dead API methods (bound but never called):
- [api file:method name]

Stale types (defined but never referenced):
- [type file:type name]

Safe to delete: [count] files, [count] exports
Needs verification: [list anything ambiguous]
```

Present this report and wait for approval.

### 2. Execute (after approval)

1. Delete orphaned files entirely.
2. Remove dead exports from files that have other live exports.
3. Remove dead API methods from api files.
4. Remove stale types.
5. Clean up barrel exports (`index.ts`) — remove re-exports of deleted items.
6. If a file becomes empty after removing dead exports, delete it.

### 3. Validate

1. Run `get_errors` across the affected directories.
2. Fix any broken imports.
3. Update the feature `README.md` if key files were deleted.

## Rules

- **Verify every deletion with a codebase-wide search** — never rely on IDE "find references" alone. Use `grep_search` with the exact export name.
- **Dynamic imports count as usage** — check for string-based dynamic imports (`import()`) before declaring something dead.
- **Test files count as usage** — if a function is only used in tests, flag it for the user but don't auto-delete.
- **Barrel re-exports are not usage** — if `index.ts` re-exports something that nobody imports from `index.ts`, both the re-export and the source are dead.
- Follow terminal budget: max 3 commands. Use `get_errors` for validation.
