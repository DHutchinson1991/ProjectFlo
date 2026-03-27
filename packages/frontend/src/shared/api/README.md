# Shared API

HTTP client infrastructure that all feature `api/` folders consume.

## Key files
| File | Purpose |
|------|---------|
| `client/api-client.ts` | Typed HTTP methods (`get`, `post`, `patch`, `put`, `delete`) |
| `client/request.ts` | Low-level fetch wrapper; builds auth headers + `X-Brand-Context` |
| `client/token-provider.ts` | Decoupled auth token source; `AuthProvider` wires at boot |
| `client/types.ts` | `ApiClient`, `ApiClientOptions`, `PublicApiClient` interfaces |

## Business rules
- All authenticated calls go through `apiClient` — never raw `fetch()`.
- `X-Brand-Context` header injected automatically unless `skipBrandContext` is set.
- Token provider must be wired by `AuthProvider` before any API call fires.

## Related modules
- `features/platform/auth/` — wires token provider at boot
- `brand-scoping.instructions.md` — brand context rules
