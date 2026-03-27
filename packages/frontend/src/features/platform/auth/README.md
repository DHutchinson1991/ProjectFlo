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
| `LoginModal` | Component | Full-screen login overlay (used by `ProtectedRoute` when session expires) |
| `LoginScreen` | Component | Standalone `/login` page |

## Key Dependencies
- `@/shared/api/client` — token storage, 401 handling, and JWT attachment
- `@/features/platform/auth/api` — typed auth endpoint bindings (`createAuthApi`)
- `@/features/platform/auth/types` — canonical auth types (`UserProfile`, `LoginCredentials`, etc.)

## File Layout
```
auth/
  index.ts               # Barrel
  api/
    index.ts             # createAuthApi factory + authApi instance
  components/
    AuthProvider/
      AuthProvider.tsx   # Context + useAuth hook + SessionExpiredOverlay
      index.ts
    LoginForm/
      LoginForm.tsx      # Shared email/password form (used by LoginModal + LoginScreen)
      index.ts
    LoginModal/
      LoginModal.tsx     # Full-screen overlay shown when session expires mid-session
      index.ts
    ProtectedRoute/
      ProtectedRoute.tsx  # Auth gate component
      RouteHelpers.tsx    # AdminRoute, AuthenticatedRoute wrappers
      index.ts
    UnauthorizedPage/
      UnauthorizedPage.tsx
      index.ts
  screens/
    LoginScreen.tsx       # Standalone /login page
    index.ts
  types/
    index.ts             # UserProfile, LoginCredentials, AuthContextType, etc.
```

## Notes
- `AuthProvider` must wrap `BrandProvider` (brand resolution depends on auth state).
- JWT refresh is handled internally every 45 minutes; consumers only need `useAuth()`.
- `ProtectedRoute` accepts both `requiredRole` (singular) and `requiredRoles` (array); they are merged before evaluation.
- `LoginForm` owns all form state and submit logic. `LoginModal` and `LoginScreen` are layout shells only.
