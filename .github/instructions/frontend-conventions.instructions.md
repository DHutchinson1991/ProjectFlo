---
description: "Use when creating or modifying frontend components, pages, hooks, or API calls."
applyTo: "packages/frontend/src/**"
---

# ProjectFlo — Frontend Conventions

See `frontend-architecture.instructions.md` for folder placement, route ownership, feature buckets, and the target frontend tree.

## API calls

The API layer has two parts:

1. **Shared client infrastructure** (`shared/api/client/`) — `BaseApiClient`, auth headers, `X-Brand-Context`, token refresh. All requests must flow through this client.
2. **Feature endpoint bindings** (`features/<bucket>/<feature>/api/`) — typed functions that call the shared client for specific endpoints.

- Never add raw `fetch()` calls — always go through the shared API client (authenticated or public methods).
- Auth tokens and `X-Brand-Context` header are injected automatically by the shared client.
- Feature `api/index.ts` files must export a `createXApi(client: ApiClient)` factory plus a named instantiated export (for example `export const inquiriesApi = createInquiriesApi(apiClient)`). Do not ship new or migrated feature APIs as plain object literals.
- New or migrated feature API files must import both `apiClient` and `ApiClient` from `@/shared/api/client`, never from `shared/types/api-client.types`.
- Do not call shared low-level helpers like `request()` from domain feature code when the endpoint belongs to an existing feature API surface. Add or extend the owning feature API instead.
- Do not mix brand transport styles inside one feature API without a backend reason. Prefer header-based brand context from the shared client. If the backend still requires a path param, keep it explicit; do not introduce new `brandId` query params in migrated frontend code.
- Keep feature API method names semantic and singular. Avoid aliases for the same operation (`getOne` + `getById`) unless there is a real contract distinction.
- When a screen or dialog reads/writes server state more than once, move those reads/writes behind feature hooks rather than scattering direct API calls across components.

## Components

- Use MUI components; avoid raw HTML for layout/inputs.
- Follow symmetric naming: file name = component name = export name.
- Use barrel exports (`index.ts`) in component folders.
- See `frontend-design-system.instructions.md` for shared components, design tokens, and the "check shared first" workflow.
- See `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md` for ContentBuilder-specific rules.

## State & data fetching

- React Query for server state. Include brand context in query keys for tenant-scoped data.
- Invalidate queries on brand switch (handled via `BrandProvider` + React Query keys).
- Screens, dialogs, and wizards should not own repeated API orchestration logic. If a component performs load/save/reload cycles for the same resource, that logic belongs in feature hooks with React Query.

## Brand context

- Brand is provided by `BrandProvider` (canonical location: `features/platform/brand/`, shim at `app/providers/BrandProvider.tsx`).
- **Always import brand from `@/features/platform/brand`** — never from `@/app/providers/BrandProvider`.
- All tenant-scoped requests must include `X-Brand-Context` header (automatic via shared API client).
- Do not add `brandId` query params on new endpoints.
- During migrations, remove stale frontend-side brand query construction when the shared client header already provides brand context.

## Timeline / ContentBuilder

- Read `SCENE_SAVE_DATA_FLOW.md` before touching save logic.
- Scene IDs remap from client IDs to DB IDs; moments saved separately; order preserved.
