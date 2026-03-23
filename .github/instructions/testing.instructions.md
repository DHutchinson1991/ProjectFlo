---
description: "Use when writing, running, or debugging tests. Covers backend unit/integration tests (Jest + NestJS), test file naming, mocking patterns, and coverage expectations."
applyTo:
  - "**/*.spec.ts"
  - "**/*.e2e-spec.ts"
---

# ProjectFlo — Testing Conventions

## Backend (Jest + NestJS)

### File naming & placement

- Co-locate tests with source: `feature.service.spec.ts` next to `feature.service.ts`.
- Suffix: `.spec.ts` for unit tests, `.e2e-spec.ts` for end-to-end.
- One spec file per source file. Name matches: `quotes.service.ts` → `quotes.service.spec.ts`.

### Test structure

```ts
describe('FeatureService', () => {
  let service: FeatureService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FeatureService, { provide: PrismaService, useValue: buildPrisma() }],
    }).compile();
    service = module.get(FeatureService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create and return the entity', async () => { /* ... */ });
    it('should throw NotFoundException when parent missing', async () => { /* ... */ });
  });
});
```

### Mocking

- Use `buildPrisma()` / `buildPrismaTx()` helpers from test utilities for Prisma mocks.
- Mock only direct dependencies — do not mock internals of the class under test.
- For transactions: mock `prisma.$transaction` to invoke the callback with a mock tx client.

### What to test

| Layer | Must test | Can skip |
|-------|-----------|----------|
| Service | Business logic, validation errors, edge cases, transaction rollback | Prisma query building |
| Controller | Guard application, param parsing, DTO validation | Delegation to service (simple pass-through) |
| Mapper | Correct field mapping, null/undefined handling | — |

### Assertions

- Test both happy path and error paths (throw `NotFoundException`, `BadRequestException`).
- Use `toEqual` for object shape, `toHaveBeenCalledWith` for verifying service calls.
- Avoid snapshot tests for dynamic data.

## Frontend

No frontend test framework is currently configured. When frontend tests are added, follow:

- Framework: Jest + React Testing Library.
- Files: `ComponentName.test.tsx` co-located with component.
- Focus on user interaction and rendered output, not implementation details.

## Running tests

```bash
# From root
pnpm test

# Backend only (from packages/backend)
npm test
npm run test:e2e

# Single file
npm test -- --testPathPattern="quotes.service"
```
