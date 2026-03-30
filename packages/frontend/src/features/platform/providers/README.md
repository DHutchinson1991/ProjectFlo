# App Providers

## What this module does
Root provider composition for the frontend app. Wraps the entire application in the required context providers in the correct nesting order.

## Key files
| File | Purpose |
|------|---------|
| `AppProviders.tsx` | Composes ThemeProvider → QueryClientProvider → AuthProvider → BrandProvider |

## Business rules / invariants
- Provider nesting order matters: Theme → React Query → Auth → Brand.
- `QueryClient` is a singleton with 60s `staleTime` default.
- This is a `"use client"` component — used in the root layout.

## Related modules
- **Frontend**: `platform/auth` — provides AuthProvider
- **Frontend**: `platform/brand` — provides BrandProvider
- **Frontend**: `shared/theme` — provides ThemeProvider
