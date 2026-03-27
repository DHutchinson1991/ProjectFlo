---
description: "Use when migrating old flat frontend features or backend modules into bucketed folders, splitting catch-all feature/module internals, or planning a safe structure refactor."
---

# ProjectFlo — Feature Refactor Playbook

Use this playbook when moving a legacy flat feature or module into the current bucketed architecture.

## Goal

Migrate to the correct destination structure without leaving behind shims, duplicate source-of-truth files, or half-moved internals.

## Playbook

1. **Name the destination first.** Write down the exact target path before editing: `features/<bucket>/<feature>` for frontend or `<bucket>/<module>` for backend.
2. **Read the whole feature/module before moving files.** Audit current files, README, consumers, DTOs, types, API bindings, and tests. Decide what stays, what moves, what rewrites, and what gets deleted.
3. **Move ownership, not just files.** Put UI in `components/` or `screens/`, hooks in `hooks/`, API methods in feature `api/`, backend logic in `services/`, DTOs in `dto/`, mapping in `mappers/`, and feature/module types in `types/`.
4. **Split by concern while moving.** If the feature or module owns multiple surfaces or workflows, create concern folders during the migration instead of recreating one flat `components/` or `services/` layer in the new location.
5. **Keep routes and controllers thin.** Frontend routes become shells that render screens. Backend controllers stay request-facing; orchestration lives in services.
6. **Update every consumer in the same change.** Fix imports, barrel exports, API bindings, tests, and README references immediately. Do not leave re-export shims or fallback paths behind.
7. **Delete stale duplicates.** If two files claim the same responsibility, keep one canonical implementation and remove the other. If code is valid but intentionally inactive, move it to `_archive/` only when the existing rules allow it.
8. **Verify the end state, not just the move.** Run the required search/build/test steps, then confirm the destination folder has a clear public surface and no leftover references to the old structure.

## Guardrails

- Do not move files into the new location and postpone cleanup for later.
- Do not preserve the old path with barrel re-exports or compatibility wrappers.
- Do not recreate a flat catch-all folder in the destination.
- Do not leave README updates, API migrations, or import cleanup for a follow-up change.