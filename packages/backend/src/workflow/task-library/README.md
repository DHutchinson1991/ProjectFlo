# Task Library

## What this module does
Manages reusable task templates that define the work items for a project. Provides CRUD, preview (cost estimation), and auto-generation (creating project tasks from templates). Split into four focused services.

## Key files
| File | Purpose |
|------|---------|
| `task-library.module.ts` | NestJS module — registers all services and controllers |
| `task-library.controller.ts` | REST endpoints for task template CRUD, preview, and execution |
| `task-library.service.ts` | Facade delegating to split services; exports `TaskLibraryService` for external consumers |
| `services/task-library-crud.service.ts` | Create, read, update, delete task templates |
| `services/task-library-execute.service.ts` | Auto-generate project tasks from templates |
| `services/task-library-preview.service.ts` | Preview cost/hour estimation before generating |
| `services/task-library-access.service.ts` | Brand-access guards and role/bracket resolution helpers |
| `utils/task-library-gen.functions.ts` | Pure helper functions for bracket mapping, crew matching |

## Business rules / invariants
- Each task template belongs to exactly one brand.
- Preview and execute share the same resolution logic (roles → brackets → rates).
- External consumers (pricing, estimates, inquiry-wizard) call `previewAutoGeneration` / `previewAutoGenerationForSystem` via the facade `TaskLibraryService`.

## Related modules
- **Catalog**: `../catalog/skill-role-mappings` — provides role resolution via `SkillRoleMappingsResolverService`
- **Catalog**: `../catalog/pricing` — consumes `TaskLibraryService.previewAutoGeneration` for cost calculations
- **Finance**: `../../finance/estimates` — consumes `TaskLibraryService.previewAutoGenerationForSystem`
