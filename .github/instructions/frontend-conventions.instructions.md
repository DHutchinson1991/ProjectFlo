---
description: "Use when creating or modifying frontend API bindings, data-fetching hooks, or feature UI that talks to the backend."
applyTo:
  - "packages/frontend/src/features/**/api/**"
  - "packages/frontend/src/features/**/hooks/**"
  - "packages/frontend/src/shared/api/client/**"
---

# ProjectFlo — Frontend Conventions

See `frontend-architecture.instructions.md` for placement and `frontend-design-system.instructions.md` for UI patterns.

## API rules
- Never add raw `fetch()` calls. Use the shared API client.
- Keep endpoint bindings in the owning feature `api/` folder.
- Export a `createXApi(client: ApiClient)` factory plus a named instantiated export.
- Import both `ApiClient` and `apiClient` from `@/shared/api/client`.
- Keep methods typed, semantic, and singular. Avoid duplicate aliases for the same endpoint.

## Data flow
- Put repeated load/save/reload logic behind feature hooks with React Query.
- Keep screens and components focused on rendering and user interaction.

## Brand context
- Import brand from `@/features/platform/brand`.
- Use header-based brand context from the shared client.
- Do not add new `brandId` query params unless the backend contract truly requires it.

## ContentBuilder note
Read `SCENE_SAVE_DATA_FLOW.md` before changing save behavior.

