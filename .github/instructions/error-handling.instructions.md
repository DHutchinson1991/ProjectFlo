---
description: "Use when handling errors, throwing exceptions, building error responses, or adding error boundaries in frontend or backend code."
---

# ProjectFlo — Error Handling Conventions

## Backend (NestJS)

### Exceptions

Use NestJS built-in exception classes — do not create custom exception classes unless you need a new HTTP status code:

| Situation | Exception |
|-----------|-----------|
| Entity not found | `NotFoundException` |
| Invalid input / business rule violation | `BadRequestException` |
| Unauthorized access | `UnauthorizedException` |
| Forbidden (auth OK but not permitted) | `ForbiddenException` |
| Duplicate / conflict | `ConflictException` |

### Throwing pattern

```ts
const entity = await this.prisma.feature.findUnique({ where: { id } });
if (!entity) throw new NotFoundException(`Feature #${id} not found`);
```

- Throw in **services**, not controllers. Controllers delegate; services enforce rules.
- Include a human-readable message with the entity name and ID.
- Fail fast — throw at the top of the method, not deep inside nested logic.

### Transaction errors

- Throw inside `prisma.$transaction()` to trigger automatic rollback.
- Do not catch and swallow errors inside transactions — let them propagate.

### Response shape

NestJS default exception filter produces:
```json
{ "statusCode": 400, "message": "Description", "error": "Bad Request" }
```
Do not override this shape. All frontend API code expects it.

## Frontend

### API error handling

- `api.ts` handles auth errors (401 → token refresh, 403 → redirect) automatically.
- For other errors, use try/catch around API calls and display via MUI `Alert` or snackbar.
- Never show raw error objects to users — extract `error.message` or provide a fallback.

### Error boundaries

- `ErrorBoundary` component exists at `packages/frontend/src/app/components/layout/ErrorBoundary/`.
- Wrap route-level page content in `ErrorBoundary` to catch render errors.
- Do not use error boundaries for expected/recoverable errors (form validation, API 400s).

### Pattern

```tsx
try {
  await api.features.create(data);
} catch (err) {
  const message = err instanceof Error ? err.message : 'Something went wrong';
  setError(message); // display in Alert component
}
```

## Anti-patterns

- Do not use `console.error()` as the only error handling — always surface to the user.
- Do not catch exceptions just to re-throw them without adding context.
- Do not return `null` / `undefined` from service methods to signal failure — throw instead.
