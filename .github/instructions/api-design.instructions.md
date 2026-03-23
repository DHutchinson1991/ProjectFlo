---
description: "Use when creating new API endpoints, controllers, route patterns, response shapes, or adding pagination."
applyTo: "packages/backend/src/**/*.controller.ts"
---

# ProjectFlo — API Design Conventions

## Route structure

### Pattern: nested resources under `/api/`

```
GET    /api/inquiries/:inquiryId/estimates
POST   /api/inquiries/:inquiryId/estimates
GET    /api/inquiries/:inquiryId/estimates/:id
PATCH  /api/inquiries/:inquiryId/estimates/:id
DELETE /api/inquiries/:inquiryId/estimates/:id
```

### Controller prefix

```ts
@Controller('api/inquiries/:inquiryId/estimates')
@UseGuards(AuthGuard('jwt'))
export class EstimatesController { }
```

- All routes start with `api/`.
- Use nested resource paths when the child entity is always accessed through a parent.
- Use flat paths (`api/equipment`, `api/roles`) for top-level entities.

### Action endpoints

For non-CRUD operations, use POST with a verb suffix:

```
POST /api/inquiries/:inquiryId/estimates/:id/send
POST /api/inquiries/:inquiryId/estimates/:id/refresh
POST /api/inquiries/:inquiryId/estimates/:id/revise
```

Do not use GET for state-changing operations.

## Parameter parsing

Always use `ParseIntPipe` for numeric path params:

```ts
@Get(':id')
findOne(
  @Param('inquiryId', ParseIntPipe) inquiryId: number,
  @Param('id', ParseIntPipe) id: number,
) { }
```

## Response conventions

### Success responses

- Return the entity directly (no wrapper) for single-resource endpoints.
- Return an array for list endpoints.
- Return `{ id, status }` minimum for mutation endpoints if the full entity is expensive.

### Error responses

NestJS default shape — do not override:
```json
{ "statusCode": 400, "message": "Description", "error": "Bad Request" }
```

See `error-handling.instructions.md` for exception patterns.

## Guards & decorators

- Apply `@UseGuards(AuthGuard('jwt'))` at the controller level (not per-route).
- Use `@Body(ValidationPipe)` for request body validation.
- Use `@Query(ValidationPipe)` for query parameter validation.

## Naming

| HTTP method | Controller method | Service method |
|-------------|-------------------|----------------|
| GET (list) | `findAll()` | `findAll()` |
| GET (single) | `findOne()` | `findOne()` |
| POST (create) | `create()` | `create()` |
| PATCH (update) | `update()` | `update()` |
| DELETE | `remove()` | `remove()` |
| POST (action) | `send()`, `refresh()` | `send()`, `refresh()` |
