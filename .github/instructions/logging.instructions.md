---
description: "Use when adding log statements, debugging with logs, or reviewing logging practices in backend services or frontend code."
---

# ProjectFlo — Logging Conventions

## Backend

### Use LoggerService, not console.log

```ts
import { LoggerService } from '../platform/logging/logger.service';

@Injectable()
export class FeatureService {
  private readonly logger = new LoggerService(FeatureService.name);

  async create(dto: CreateFeatureDto) {
    this.logger.log('Creating feature', { dto });
    // ...
    this.logger.error('Failed to create feature', error.stack, { dto });
  }
}
```

- Service located at `packages/backend/src/platform/logging/logger.service.ts`.
- Accepts structured context as the last argument.
- Auto-formats: coloured console in dev, JSON in production.

### Log levels

| Level | Method | When to use |
|-------|--------|-------------|
| Info | `this.logger.log()` | Successful operations, state transitions |
| Warning | `this.logger.warn()` | Recoverable issues, deprecation notices |
| Error | `this.logger.error()` | Failures, include `error.stack` |
| Debug | `this.logger.debug()` | Development-only detail (stripped in prod) |

### What to log

- Service method entry for mutations (create, update, delete) with key identifiers.
- Errors with stack traces and relevant context (entity ID, user ID).
- State transitions (status changes, workflow steps).

### What NOT to log

- Sensitive data: passwords, tokens, full request bodies with PII.
- High-frequency read operations (list, findAll) — only log on error.
- Emoji debug markers (`🔍`, `🔧`, `✅`) — remove before committing.

## Frontend

### API logging

- `packages/frontend/src/lib/logging/api-logger.ts` handles API request/response logging.
- Do not add manual `console.log` for API calls — use the existing logger.

### Error logging

- Use `console.error()` only for genuinely unexpected errors.
- Remove all `console.log()` debug statements before committing.

## HTTP request logging

`RequestLoggerMiddleware` (auto-applied) logs all inbound HTTP requests:
- Method, URL, status code, response time.
- 4xx → warn level, 5xx → error level.

Do not duplicate this logging in controllers.

## Clean-up rule

Before committing, search for and remove:
- `console.log` in backend services (use LoggerService instead).
- Temporary debug emoji lines (`🔍`, `🔧`, `✅`, `🚨`).
- Commented-out log statements.
