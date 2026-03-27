# Prisma

## What this module does
Provides the shared `PrismaService` and `PrismaModule` for database access across all backend modules. Wraps `@prisma/client` with NestJS lifecycle hooks.

## Key files
| File | Purpose |
|------|---------|
| `prisma.service.ts` | PrismaClient wrapper with `onModuleInit()` |
| `prisma.module.ts` | Global NestJS module exporting PrismaService |

## Business rules / invariants
- PrismaModule is global — imported once in PlatformModule, available everywhere.
- All DB access must go through PrismaService; no direct `new PrismaClient()`.

## Related modules
- **Backend**: Every service that queries the database depends on PrismaService.
- **Schema**: `prisma/schema.prisma` defines the data model.
