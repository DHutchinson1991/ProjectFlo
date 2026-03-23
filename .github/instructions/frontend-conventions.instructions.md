---
description: "Use when creating or modifying frontend components, pages, hooks, or API calls."
applyTo: "packages/frontend/src/**"
---

# ProjectFlo — Frontend Conventions

See `frontend-architecture.instructions.md` for folder placement, route ownership, feature buckets, and the target frontend tree.

## API calls

- Use typed API methods from `packages/frontend/src/lib/api.ts` — never add ad-hoc `fetch` calls.
- Auth tokens and `X-Brand-Context` header are injected automatically by `api.ts`.

## Components

- Use MUI components; avoid raw HTML for layout/inputs.
- Follow symmetric naming: file name = component name = export name.
- Use barrel exports (`index.ts`) in component folders.
- See `frontend-design-system.instructions.md` for shared components, design tokens, and the "check shared first" workflow.
- See `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md` for ContentBuilder-specific rules.

## State & data fetching

- React Query for server state. Include brand context in query keys for tenant-scoped data.
- Invalidate queries on brand switch (handled via `BrandProvider` + React Query keys).

## Brand context

- Brand is provided by `BrandProvider` (`packages/frontend/src/app/providers/BrandProvider.tsx`).
- All tenant-scoped requests must include `X-Brand-Context` header (automatic via `api.ts`).
- Do not add `brandId` query params on new endpoints.

## Timeline / ContentBuilder

- Read `SCENE_SAVE_DATA_FLOW.md` before touching save logic.
- Scene IDs remap from client IDs to DB IDs; moments saved separately; order preserved.
