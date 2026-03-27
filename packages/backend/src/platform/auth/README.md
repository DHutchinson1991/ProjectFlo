# auth

## What this module does
Handles JWT sign-in, token refresh, user profile lookup, and shared auth decorators/guards used by backend controllers.

## Key files
| File | Purpose |
|------|---------|
| `auth.service.ts` | Login and refresh-token business logic |
| `auth.controller.ts` | Auth endpoints for login, refresh, and profile |
| `jwt.strategy.ts` | JWT validation and authenticated user payload shaping |
| `decorators/brand-id.decorator.ts` | Shared brand-context header decorator |
| `guards/roles.guard.ts` | Role-based authorization guard |

## Business rules / invariants
- JWT auth uses the configured `JWT_SECRET` and bearer tokens.
- Authenticated user payload is derived from contributor, contact, and role records.
- Brand context should be read through `BrandId`, not ad-hoc header/query parsing.
- Invalid credentials fail fast with `UnauthorizedException`.

## Related modules
- **Backend**: `../users/contributors` — contributor identity data for auth
- **Backend**: `../users/roles` — contributor role resolution
- **Frontend**: `packages/frontend/src/app/providers/AuthProvider.tsx` — auth state and token lifecycle
