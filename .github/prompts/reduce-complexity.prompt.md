---
description: "Reduce complexity in anything from a single file to a full feature directory. Measures complexity, audits cross-file issues (dead code, duplicates, type bloat), proposes standard fixes AND creative options that push past baseline rules."
---

# Reduce Complexity

Simplify anything from a single bloated file to an entire feature directory — then brainstorm creative simplifications the user can opt into.

## Input

The user will specify either:
- **A file path**, e.g. `features/catalog/packages/screens/PackageDetailScreen.tsx`
- **A feature/directory path**, e.g. `features/catalog/packages` or `features/workflow/scheduling`
- **A backend path**, e.g. `packages/backend/src/workflow/projects/`

## Process

### 1. Analyze (read-only — no edits yet)

1. Read the nearest `README.md` in the tree.
2. Load constraints: attach `refactoring-safety.instructions.md` and, based on scope, `frontend-architecture.instructions.md` (frontend) or `backend-architecture.instructions.md` (backend). Follow their rules throughout — do not re-state them here.
3. If the input is a **directory**:
   - List all files recursively.
   - **If the directory contains >15 files**, stop here — present a scoped analysis plan (propose batching by sub-folder or concern) and wait for the user to confirm scope before proceeding.
4. Read the target file(s) and nearby files to understand the full picture.
5. Search the **entire codebase** for imports from this feature/file to build an accurate consumer map. Use `grep_search` with the feature's import path.

#### File-level metrics (apply to every file in scope)

**Frontend:**
- **Line count** — files >300 lines are candidates for splitting.
- **State count** — count `useState`, `useReducer`, `useRef` calls. >8 state variables = too much.
- **Prop count** — components receiving >10 props need decomposition.
- **Nesting depth** — JSX nesting >5 levels deep = extract sub-components.
- **Effect count** — >3 `useEffect` calls = consider a custom hook.
- **Branching** — count ternaries, conditional renders, and `if/switch` blocks in a single function.
- **Data transforms** — count `.map`, `.filter`, `.reduce` chains that could be derived server-side or via `useMemo`.

**Backend:**
- **Line count** — service files >300 lines are candidates for splitting into focused sub-services.
- **Method count** — services with >10 public methods are likely doing too much.
- **God service** — a service that imports from 5+ other services/modules.
- **Controller bloat** — controllers with business logic that belongs in a service.
- **DTO duplication** — create/update DTOs that are nearly identical (consider `PartialType`).
- **Prisma query duplication** — the same `include` shape repeated across multiple methods.

#### Feature-level audit (apply when input is a directory)

For each file, determine:
- **Dead code**: exported but never imported anywhere outside the file.
- **Duplicate logic**: two files doing the same thing (e.g., two API wrappers for the same endpoint, two hooks with overlapping queries).
- **Over-engineering**: abstractions used only once, wrapper components that add no value, unnecessary context providers.
- **Type bloat**: types defined inline that duplicate a shared type, overly complex generics with only one usage.
- **Barrel bloat**: `index.ts` re-exporting items with no external consumers.

### 2. Report (present to user — no edits yet)

Produce TWO sections:

#### A. Standard fixes (rule-compliant)

These follow all existing instruction rules and are safe to apply. Present as two clearly separated blocks:

```markdown
Complexity report — <path>

## File metrics
| File | Lines | State | Props | Effects | Nesting | Notes |
|------|-------|-------|-------|---------|---------|-------|
| ... | ... | ... | ... | ... | ... | ... |

## Structural issues (feature/directory scope only)
- Files to delete (dead): [list]
- Files to merge (duplicates): [source → target]
- Types to consolidate: [inline type → shared type]
- Exports to remove from barrel: [list]

## Consumers
[list files that import from this feature/file]

## Standard fixes
1. [Extract: sub-component or hook → new file]
2. [Inline: unnecessary abstraction → remove]
3. [Consolidate state: multiple useState → single custom hook]
4. [Remove: dead props, unused state, unreachable code, dead files]
5. [Merge: duplicate files → canonical file + import updates]
6. [Simplify: effect chains or redundant dependencies]
```

#### B. Creative ideas (push past baseline — opt-in)

Think laterally about THIS specific code. Generate **3–5 ideas that are genuinely relevant to what you found** — do not just pick from the examples below. The examples exist to inspire the kind of thinking required, not to be used as a template checklist.

Examples of the *kind* of thinking to apply:
- Collapse a screen that's pure glue into a direct route render
- Replace `useState` that mirrors server data with `useMemo` or inline derivation
- Delete a 1:1 mapper and change the backend DTO to match the frontend shape
- Merge 3+ micro-hooks into one feature hook
- Move client-side filter/sort to a backend `WHERE`/`ORDER BY`
- Replace `useEffect` watching a mutation result with `onSuccess`
- Flatten 3+ dialog open states into `activeDialog: string | null`
- Delete defensive null guards that React Query's `enabled` already prevents
- Merge near-identical create/edit forms into one component with a `mode` prop
- Inline a sub-component that is <15 lines and used exactly once
- Move an inlined pricing/formatting calculation to `packages/shared/src/`
- Split a backend God service into two focused sub-services
- Replace repeated Prisma `include` shapes with a shared `const` or Prisma view

Present each idea as:

```markdown
Creative ideas (opt-in — pick any or skip all):

💡 A. [Short name] — [one sentence describing the change, specific to this code]
   Impact: removes ~X lines / eliminates Y state variables / deletes Z files
   Trade-off: [what convention it bends or what risk it carries]

💡 B. ...
```

---

> **Waiting for approval. State which standard fixes and creative ideas (if any) to apply before proceeding.**

---

### 3. Execute (after approval)

1. **Before any deletion**: re-run `grep_search` for every item on the deletion list to confirm zero active consumers. Never delete based on the earlier read — verify again immediately before editing.
2. Apply approved standard fixes first, then creative ideas.
3. For each change:
   - **Frontend**: Extract sub-components into `components/`, custom hooks into `hooks/`, consolidate state into hooks or reducers, clean `index.ts` barrel exports.
   - **Backend**: Extract sub-services into a `services/` subdirectory, move business logic out of controllers, deduplicate DTOs with `PartialType`, extract shared Prisma `include` shapes to a const.
   - Merge duplicate files — keep the canonical one, update all imports.
   - Update all consumer imports across the codebase.
4. If a creative idea touches both frontend and backend (e.g., moving a filter server-side), implement both sides in the same change.
5. **One concern per file** — if merging creates a file >200 lines, split by concern instead.

### 4. Validate

1. Run `get_errors` on the modified files and all consumer directories.
2. Fix any errors introduced by the changes.
3. Update the nearest `README.md` to reflect the simplified structure.
4. Follow terminal budget: max 3 commands. Use `get_errors` instead of `pnpm build`/`pnpm typecheck`.

## Rules

> Placement, file-naming, consumer-verification, and terminal-budget rules are defined in the attached instruction files. The rules below are specific to this prompt's workflow and are not covered elsewhere.

- **Analyze before fixing.** Never start editing without presenting the full report and waiting for explicit approval.
- **Max file size after refactor: 250 lines.** If the result is still >250 lines, keep extracting.
- **Creative ideas are specific, not generic.** Each idea must reference actual code found in this analysis — not a recycled example from the prompt. Always state the trade-off. Never apply without explicit user approval.
