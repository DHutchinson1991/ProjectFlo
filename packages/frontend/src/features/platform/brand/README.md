# Brand Feature (`features/platform/brand`)

## Purpose
Multi-brand context, brand switching, and brand-scoped UI for the frontend.

## Public API (via `index.ts`)
| Export | Type | Description |
|---|---|---|
| `BrandProvider` | Component | React context provider — wraps the app inside `AuthProvider` |
| `useBrand()` | Hook | Returns `{ activeBrand, brands, switchBrand, getCurrentBrandId, … }` |
| `BrandSelector` | Component | Dropdown/avatar menu for switching active brand |

## Key Dependencies
- `@/features/platform/auth` — `useAuth` (brand resolution requires authenticated user)
- `@/lib/api` — `api` instance + `setBrandContextProvider` for header injection
- `@/lib/types` — `Brand` and related types
- `@tanstack/react-query` — `userBrands` query

## File Layout
```
brand/
  BrandProvider.tsx          # Context + useBrand hook
  index.ts                   # Barrel
  components/
    BrandSelector.tsx        # Brand switching menu UI
```

## Notes
- `BrandProvider` must be nested inside `AuthProvider`.
- Brand ID is persisted to `localStorage` and sent as `X-Brand-Context` header on every API call.
- See `brand-scoping.instructions.md` for the full end-to-end brand scoping contract.
