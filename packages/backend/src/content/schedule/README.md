# Schedule Module

Manages schedule configuration at every level: library presets, package templates, project instances, and inquiry instances.

## Architecture

```
schedule/
├── constants/
│   └── default-moments.ts          # Wedding activity default moments
├── controllers/
│   ├── schedule-preset.controller.ts        # Library presets, event day templates, activity presets, moments
│   ├── schedule-package.controller.ts       # Package event days, films, activities, moments
│   ├── schedule-package-resource.controller.ts  # Package subjects, locations, location slots
│   ├── schedule-project.controller.ts       # Project event days, films, activities, init-from-package, resolved schedule, diff
│   ├── schedule-instance.controller.ts      # Inquiry event days, activities, films, instance moments
│   └── schedule-instance-resource.controller.ts # Instance subjects, location slots, crew slots, enhanced endpoints, diff
├── dto/                             # One DTO class per file (47 files + index.ts barrel)
├── types/
│   └── schedule-content.types.ts    # Shared Prisma payload types for schedule services
├── services/
│   ├── schedule-preset.service.ts           # Brand presets, event day templates, activity presets, moments CRUD
│   ├── schedule-film.service.ts             # Film scene schedules, resolved schedule (inheritance chain)
│   ├── schedule-package.service.ts          # Package summary, event days, films, film scene schedules
│   ├── schedule-package-activity.service.ts # Package activities + reorder, moments + bulk + reorder
│   ├── schedule-package-resource.service.ts # Package subjects + assignments, locations, location slots
│   ├── schedule-project.service.ts          # Project CRUD + initializeProjectFromPackage
│   ├── schedule-instance.service.ts         # Instance event days, activities, moments (PrismaService only)
│   ├── schedule-instance-resource.service.ts # Instance subjects (with contact resolution), location slots, films
│   ├── schedule-instance-crew-slots.service.ts # Instance crew slots, equipment, crew assignment (uses InquiryTasksService)
│   └── schedule-diff.service.ts             # Schedule diff builder (event days, activities, subjects, crew slots, locations)
└── schedule.module.ts
```

## Key concepts

- **Preset** — Brand-level schedule library (event day templates, activity presets, moments).
- **Package** — Event-type package schedule template; activities reference presets.
- **Project/Inquiry instance** — Concrete schedule materialized from a package via `initializeProjectFromPackage`.
- **Resolved schedule** — Inheritance chain: film → package film → project film scene schedules.
- **Schedule diff** — Compares package template vs instance to surface additions, removals, and changes.

## External consumers

- `InquiriesController` imports `ScheduleService` → `getScheduleDiff()`.
- `ProjectsController` imports `ScheduleService` → `getScheduleDiff()`.

## Migration status

- **Split services**: All 10 registered in `schedule.module.ts` ✅
- **Split controllers**: All 6 registered in `schedule.module.ts` ✅ (prefixed with `api/schedule`, guarded)
- **Legacy `schedule.service.ts`**: Still active (2919 lines). External consumers depend on it. Will be thinned to a facade once all consumers migrate to split services.
- **Legacy `schedule.controller.ts`**: Still active (prefix `schedule`, no `api/`). Frontend calls these routes. Will be deprecated once frontend migrates to split controller routes.
