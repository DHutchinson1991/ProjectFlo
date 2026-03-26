# Auth Feature (`features/platform/auth`)

## Purpose
Authentication context, route guards, and session management for the frontend.

## Public API (via `index.ts`)
| Export | Type | Description |
|---|---|---|
| `AuthProvider` | Component | React context provider — wraps the app in `providers.tsx` |
| `useAuth()` | Hook | Returns `{ user, token, login, logout, isAuthenticated, … }` |
| `ProtectedRoute` | Component | Wraps a page to require authentication |
| `AdminRoute` | Component | `ProtectedRoute` restricted to admin role |
| `AuthenticatedRoute` | Component | `ProtectedRoute` for any authenticated user |
| `UnauthorizedPage` | Component | Rendered when access is denied |

## Key Dependencies
- `@/lib/api` — `authService` for login/logout/refresh calls
- `@/shared/api/client` — `setTokenProvider` for attaching JWT to requests
- `@/lib/types` — shared type definitions

## File Layout
```
auth/
  AuthProvider.tsx       # Context + useAuth hook + SessionExpiredOverlay
  index.ts               # Barrel
  components/
    ProtectedRoute/
      ProtectedRoute.tsx  # Auth gate component
      RouteHelpers.tsx    # AdminRoute, AuthenticatedRoute wrappers
      index.ts
    UnauthorizedPage/
      UnauthorizedPage.tsx
      index.ts
```

## Notes
- `AuthProvider` must wrap `BrandProvider` (brand resolution depends on auth state).
- JWT refresh is handled internally; consumers only need `useAuth()`.
