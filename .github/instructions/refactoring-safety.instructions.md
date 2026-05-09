---
description: "Use when refactoring code, renaming or moving files, changing API contracts, or removing deprecated patterns. Do not use for routine edits."
---

# ProjectFlo — Refactoring Safety Rules

## Required sequence
1. Read `.github/copilot-instructions.md` and the relevant domain instruction files.
2. Find all consumers before editing.
3. Run a baseline `pnpm test` for real refactors when appropriate.
4. Write a short checklist: target path, files to keep or remove, contracts to verify, and README to update.
5. Refactor.
6. Validate with `pnpm test`, `pnpm build`, and `pnpm lint:fix`.

## Missing file rule
If a missing module or import looks intentional or unclear:
- check git history
- ask the user whether to restore it or remove references
- do not guess

## Core refactor rules
- No backward-compatibility shims, fallbacks, or dual-path code.
- Update every caller in the same change.
- Remove stale imports, duplicate files, and dead code.
- Update frontend types, API bindings, DTOs, mappers, and Prisma selects together when a contract changes.
- Update the feature `README.md` when the source of truth changes.

## Anti-patterns
- re-export shims at old paths
- keeping deprecated routes “just in case”
- accepting both old and new field names
- using shell commands to write source files
- making major moves without checking real usages first

## After the refactor
- rerun validation
- search for stale imports and old path strings
- verify the main consumers still work

