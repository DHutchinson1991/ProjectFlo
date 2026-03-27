---
description: "Use when refactoring code, renaming files, moving modules between buckets, changing API contracts, or removing deprecated patterns."
applyTo: "packages/{backend,frontend}/src/**"
---

# ProjectFlo — Refactoring Safety Rules

## Missing file / broken import rule (BLOCKING)

When a build error or type error reports a missing module/file:
1. **Check git** — was it previously committed? (`git log --all -- <path>`)
2. **Ask the user** before doing anything: _"This file is missing — do you want it restored from git, or should I remove all references to it?"_
3. **Never assume** which direction is correct. Do not restore code the user intentionally deleted. Do not silently strip references the user may want kept.
4. Only proceed after an explicit user answer.

The only exception: if the missing file is a clearly dead import with zero business logic (e.g. a banned no-op hook that was deleted as part of a known violation fix), removing the reference is safe without asking.

## Refactor gate (mandatory)

Use this file as the canonical source for refactor process rules. If any other instruction file overlaps, this file controls the sequence and pass/fail gates.

Before any refactor edit, all of the following are required:
1. Read `.github/copilot-instructions.md`.
2. Read this file end-to-end.
3. Read feature-specific instruction files for touched areas (examples below).
4. Run baseline `pnpm test` and record result.
5. Complete the lightweight checklist with concrete answers.
6. Execute refactor.
7. Run full validation: `pnpm test`, `pnpm build`, `pnpm lint:fix`.

If any gate fails, stop and fix the failed gate before continuing.

## Instruction handoff map (use specific docs for specific logic)

- Frontend placement, route ownership, frozen folders: `frontend-architecture.instructions.md`
- Frontend API/client patterns and no-raw-fetch rules: `frontend-conventions.instructions.md`
- Feature README requirements and template: `feature-readmes.instructions.md`
- Legacy flat-to-bucket migration flow: `feature-refactor-playbook.instructions.md`
- Brand context and tenant isolation: `brand-scoping.instructions.md`
- DB schema/query design: `database-design.instructions.md`
- Migration and backfill execution: `migrations.instructions.md`
- Error response/exception patterns: `error-handling.instructions.md`

Do not duplicate domain-specific rules in this file; enforce process here and defer detailed implementation rules to the owning instruction file.

## Core principle: zero backward compatibility

ProjectFlo does not maintain backward compatibility. When a refactor changes an interface, every consumer is updated in the same change. There are no shims, no fallbacks, no dual-path code.

## Before starting a refactor

1. **Identify all consumers.** Search the entire codebase for imports, references, and usages of the code you're changing. Use grep/search — don't rely on memory.
2. **Audit all in-scope implementations before moving anything.** Read every existing file for the feature in both target and legacy locations. Identify duplicates, stale files, obsolete types, and mismatches between backend DTOs, frontend types, and API methods.
3. **Classify what stays, what moves, what rewrites, and what gets deleted.** Do not begin editing until you know which files are source-of-truth and which are dead weight.
4. **Check the test suite.** Run `pnpm test` before you start. If tests already fail, fix them first or note the baseline.
5. **Read the feature README** for the module you're changing.
6. **If the feature README is missing, create or restore it before continuing.** Refactors and migrations are blocked until the feature has a current README.
7. **Check the error ledger** (`.github/error-ledger.md`) for past mistakes on this module.
8. **Treat subagent or tool summaries as leads, not proof.** Verify size counts, file paths, and usage claims with exact tools (`wc -l`, search, code-usage) before acting on them.

If the refactor touches frontend feature code, also read `frontend-architecture.instructions.md` first and write down the destination `features/<bucket>/<feature>` path before moving files.

If the refactor is migrating a legacy flat feature or module into a bucketed structure, also read `feature-refactor-playbook.instructions.md` before moving files.

**URL / navigation alignment check**: before finalising the checklist, verify that the URL path of every route being touched matches where the sidebar/navigation places it. If a route lives under `/manager/` but is navigated to via a "Resources" sidebar group, the URL is wrong and the route move is in scope for this refactor. Check `StudioSidebar.tsx` nav items against the actual `app/` route folder paths and include any mismatches in the route-move list.

## Lightweight refactor checklist

Before editing files, write a short checklist in this format and keep it accurate as work progresses:

```markdown
Refactor checklist
- Target path: `features/<bucket>/<feature>` or backend module path
- Component placement: every component gets an explicit verdict (feature component → `features/*/components/`, shared → `shared/ui/`, route shell → stays in `app/`)
- Canonical files to keep: `...`
- Legacy files to delete or replace: `...`
- Valid-but-unreferenced files to archive: `...` → `_archive/`
- Contracts to verify: DTOs, API methods, frontend types, Prisma fields
- **API binding migration**: which methods move out of `api.ts` → `features/*/api/` (see `frontend-conventions.instructions.md § API calls` for the factory template)
- **Banned import check**: search for any `import` from legacy frozen folders — replace with feature `api/` factory or feature `types/`. Zero tolerance.
- **Touched route shell check**: list every `app/**/page.tsx` or `app/**/layout.tsx` involved and name the owning feature `screens/` file or explain why the route remains a thin shell.
- **Touched provider ownership**: for every provider created, moved, or re-scoped, record whether it belongs in a feature `hooks/` folder or under `features/platform/shell/`.
- README to update: `path/to/README.md`
- Validation: `pnpm test`, `pnpm build`, `pnpm lint:fix`
```

- Keep it lightweight: one line per item.
- Do not start moving files until each line has a concrete answer.
- If any line is unknown, continue investigating instead of editing.

## During a refactor

### Renaming / moving files

- Update every import in the same change. Do not leave re-export shims at the old path.
- After moving, search for the old path string across the entire repo to catch stale references.
- Verify the build passes: `pnpm build`.

### Replacing an entire file

- When rewriting a whole file, replace the **entire previous content** or delete-and-recreate the file. Do not match only the opening imports and paste a full new body.
- After a whole-file rewrite, verify the result with an exact line count (`wc -l`) and a targeted validation step appropriate for the file type.

### Refactor terminal discipline

- If the terminal is bash on Windows, use bash commands only. Do not switch mentally to PowerShell syntax mid-session.
- **File edits belong to file-editing tools, not the terminal.** Never write, overwrite, or create source files from the terminal — this includes `cat >`, `echo >`, `tee`, `sed -i`, `node -e "fs.writeFileSync(...)"`, `node -e "require('fs')..."`, `python -c "open(...).write(...)"`, or any other shell/scripting approach. The only tool for editing source files is the file-editing tool.
- For file deletion, use the documented Node.js absolute-path delete pattern. Do not retry with shell delete commands after a policy denial.

### Changing a service method signature

- Update the controller, all tests, and any other services that call it — in the same change.
- If the method was public, search the codebase for all callers.
- Do not add an overload or default parameter to keep old callers working. Fix the callers.

### Changing a DTO / request / response shape

- Update `api.ts` method, all frontend callers, and all backend tests — in the same change.
- Establish one canonical frontend response type for the endpoint before editing callers. Refactored payloads must not be re-described independently inside pages, dialogs, or wizard components.
- If the touched API method currently returns `any` or `any[]`, remove that `any` as part of the same refactor. A response-shape refactor is not complete while the API boundary remains untyped.
- Search for duplicated inline frontend interfaces and local view models that mirror the endpoint payload. These often live inside page/components files and will not be caught by updating `api.ts` alone.
- If a deep-include property is renamed (`subject_types` → `subject_roles`, `subject_type_template` → `subject_role`, etc.), update every destructuring site, render loop, derived selector, and count computation in the same change.
- After updating the contract, validate every route/screen/wizard consumer of that endpoint with targeted checks. Do not rely on one fixed page as proof that the refactor is complete.
- Do not accept both old and new field names. Pick one shape.
- If a field is removed, remove it from the Prisma select/include, the DTO, the mapper, and the frontend type.
- Update the feature README if the canonical contract or source-of-truth files changed.

### Changing a database column / relation

- Follow `migrations.instructions.md` for the migration itself.
- Update every backend service, mapper, and DTO that references the old column — in the same change as the migration.
- **Full-project sweep required**: when removing or renaming a column/enum, search the entire `packages/backend/src` and `packages/backend/prisma/seeds` trees for the old name — not just the files identified in the initial blast radius. Include services, mappers, DTOs, seeds, scripts, and Prisma `select`/`include` objects. A missed reference in a distant service (e.g., `scenes.service.ts`, `client-portal.service.ts`, `proposals.service.ts`) will silently compile until `prisma generate` catches it or a runtime error surfaces.
- Update the frontend type and API call — in the same change.
- Run `npx prisma generate` and verify the build passes.
- Update the affected feature README(s) in the same change so the new schema-backed source of truth is documented.

### Removing a feature / endpoint

- Delete the route, controller method, service method, DTO, and frontend API method.
- Remove all frontend UI that called the endpoint.
- Remove the test file or update it to reflect the removal.
- Search for dead imports and remove them.

## Deleting vs archiving unreferenced code

During a refactor you will find code with no current consumers. Classify it before acting:

| Code state | Action |
|------------|--------|
| **Stale / wrong shape** — types don't match backend, uses deprecated patterns | Delete immediately |
| **Duplicate** — superseded by a newer implementation | Delete immediately |
| **Valid but unreferenced** — correct types, matches a real endpoint, just not wired up yet | Move to `_archive/` inside the feature folder |

- Each feature folder may have an `_archive/` subfolder for valid-but-unreferenced code.
- `_archive/` files are excluded from barrel exports and not imported anywhere.
- When wiring up archived code, move it out of `_archive/` into the active folder and add imports.
- Periodically review `_archive/` folders — delete anything that stays archived for 2+ feature cycles without being wired up.

## Deleting type files

Type files are high-risk deletions because they are often imported indirectly through barrels, re-exports, and the centralized `api.ts` class.

Before deleting any type file:
1. Search the entire repo for the type file path AND every exported type name from that file.
2. Check `api.ts` imports — the legacy centralized client imports domain types and will break if they disappear.
3. Check barrel/index files (`index.ts`, `domains/index.ts`) that may re-export the types.
4. Update or remove every importer in the same change.
5. Run `pnpm build` to verify — type deletions that break the build are never acceptable.

## After a refactor

1. **Run the full test suite**: `pnpm test`. All tests must pass.
2. **Run the build**: `pnpm build`. Both packages must compile.
3. **Run lint**: `pnpm lint:fix`. No new violations.
4. **Run targeted consumer validation**: for renamed contracts, verify every known route/screen/dialog/wizard consumer of the endpoint, not just the file you were editing.
5. **Search for dead code**: look for imports of moved/deleted files, unused variables, orphaned type definitions, duplicate feature types, and stale legacy files that survived the refactor.
6. **Check for fallback patterns you may have introduced**: search for `|| defaultValue`, `?? fallback`, `try { old } catch { new }`, or any dual-path logic. Remove them.

## Anti-patterns (never do these)

- **Re-export shim**: `export { Thing } from '../new-location/thing'` at the old path. Delete the old file.
- **Dual-path fallback**: `const val = newWay() ?? oldWay()`. Pick one.
- **Optional new field with old default**: adding `newField?: string = oldFieldValue` to maintain compat. Make it required, update all callers.
- **Version-negotiated response**: checking a query param or header to decide which response shape to return. One shape, one version.
- **Keeping a deprecated route alive**: "just in case" something still calls it. Search, remove, test.
- **Acting on unverified subagent estimates**: splitting files or moving code based on approximate counts without checking `wc -l` or exact usages first.
- **Shell-written source files**: rewriting source with `cat >`, `echo >`, `tee`, `node -e "fs.writeFileSync(...)"`, or any terminal command instead of file-editing tools. This includes one-liner scripts that create re-export shims.

## Cleanup mandate

If you encounter any of these anti-patterns while working on a file (even if you weren't asked to refactor), remove them in your change and add a test verifying the old path no longer works.
