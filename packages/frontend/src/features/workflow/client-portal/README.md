# Client Portal

## What this module does
API bindings for the public-facing client portal. Provides unauthenticated, token-based access for clients to view inquiry details, browse package options, submit package requests, and respond to proposals.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Endpoint bindings: token-based public portal operations |

## API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/client-portal/{token}` | Get portal data by token |
| POST | `/api/inquiries/{inquiryId}/portal-token` | Generate portal token |
| GET | `/api/client-portal/{token}/packages` | Get available packages |
| POST | `/api/client-portal/{token}/package-request` | Submit package request |
| POST | `/api/client-portal/{token}/proposal-respond` | Respond to proposal |

## Business rules / invariants
- All endpoints use `skipBrandContext: true` and `skipAuth: true` — public, unauthenticated access.
- Access is controlled by portal token, not JWT auth.
- Response types are `Record<string, unknown>` — not yet strongly typed.

## Related modules
- **Backend**: `workflow/inquiries` — `public-client-portal.controller.ts`, `client-portal.service.ts`
- **Frontend**: `workflow/inquiries` — inquiry management (internal side)
