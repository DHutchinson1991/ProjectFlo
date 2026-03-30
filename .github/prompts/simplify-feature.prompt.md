---
description: "Refactor a frontend feature to reduce complexity and minimize code. Removes dead code, consolidates duplicates, simplifies hooks, and tightens the public surface."
---

# Simplify Feature

Reduce a frontend feature to its minimal necessary code. Remove dead code, consolidate duplicates, simplify over-engineered hooks, and tighten the public API surface.

## Input

The user will specify a feature path, e.g. `features/catalog/packages` or `features/workflow/scheduling`.

## Process

### 1. Audit (read-only — no edits yet)

1. Read the feature's `README.md` first.
2. Read `refactoring-safety.instructions.md` and `frontend-architecture.instructions.md`.
3. List all files in the feature directory recursively.
4. For each file, determine:
   - **Dead code**: exported but never imported anywhere outside the file.
   - **Duplicate logic**: two files doing the same thing (e.g., two API wrappers for the same endpoint, two hooks with overlapping queries).
   - **Over-engineering**: abstractions used only once, wrapper components that add no value, unnecessary context providers.
   - **Type bloat**: types defined inline that duplicate a shared type, overly complex generics with only one usage.
5. Search the **entire codebase** for imports from this feature to build an accurate consumer map. Use `grep_search` with the feature's import path.
6. Produce a **simplification checklist** with concrete line items before making any edits:

```markdown
Simplification checklist — features/<bucket>/<feature>
- Files to delete (dead): [list]
- Files to merge (duplicates): [source → target]
- Hooks to simplify: [hook name → what changes]
- Types to consolidate: [inline type → shared type]
- Exports to remove from barrel: [list]
- Consumers to update: [file → what changes]
- README update needed: yes/no
```

Present this checklist to the user and wait for approval before proceeding.

### 2. Execute (after approval)

1. Work through the checklist item by item using the todo list.
2. Delete dead files.
3. Merge duplicate files — keep the canonical one, update all imports.
4. Simplify hooks: remove unnecessary abstractions, inline one-use helpers, collapse trivial wrappers.
5. Consolidate types: move inline types to `types/` folder, remove duplicates.
6. Clean barrel exports (`index.ts`) — remove re-exports of deleted/merged items.
7. Update all consumer imports across the codebase.

### 3. Validate

1. Run `get_errors` on the feature directory and all consumer directories.
2. If errors exist, fix them.
3. Update the feature `README.md` to reflect the simplified structure.

## Rules

- **Never delete code that has active consumers** — verify with grep before every deletion.
- **One concern per file** — if merging creates a file >200 lines, split by concern instead.
- **Preserve the public API surface unless explicitly removing it** — callers outside the feature should not need changes unless dead code is being removed.
- Follow terminal budget: max 3 commands. Use `get_errors` instead of `pnpm build`/`pnpm typecheck`.
- Update the feature README in the same pass — do not defer.
