---
description: "Use when working on brand-scoped or multi-tenant features, X-Brand-Context header, BrandProvider, or tenant data isolation."
---

# ProjectFlo — Brand Scoping Rules

## Transport

- Canonical header: `X-Brand-Context`. Never introduce `X-Brand-Id` or other variants.
- `brandId` query params are legacy compatibility only — do not add to new endpoints.

## Frontend

- `BrandProvider` (`packages/frontend/src/app/providers/BrandProvider.tsx`) sets brand context.
- `api.ts` injects `X-Brand-Context` automatically on all requests.
- React Query keys must include brand context so cache invalidates on brand switch.

## Backend

- Controllers resolve brand ID consistently using one shared pattern.
- Do not reimplement header/query fallback logic differently in each controller.
- Services must apply brand filter on all tenant-scoped queries.
- Tenant-scoped list endpoints must fail fast if brand scope is missing, or explicitly document why it's optional.

## Safety checklist (before merging)

- [ ] Frontend request includes `Authorization` and `X-Brand-Context` for tenant-scoped endpoints.
- [ ] No new `brandId` query parameters added.
- [ ] Backend controller resolves brand ID via shared pattern.
- [ ] Backend service query applies brand filter.
- [ ] Header name is `X-Brand-Context` (not variants).
- [ ] Query cache invalidation considers brand-switch behavior.
