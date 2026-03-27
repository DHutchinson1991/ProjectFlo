---
description: Use when adding a new Prisma model, database table, or entity — covers the full workflow from schema design through to API endpoint and frontend type.
applyTo: packages/backend/src/**
---

# New Prisma Model — End-to-End Workflow

Follow this checklist sequentially. Every step must be completed before moving to the next.

---

## Checklist

### 1. Schema Design (`packages/backend/prisma/schema.prisma`)

- [ ] Add the new model following snake_case table/column naming
- [ ] Add brand scoping: all tenant-scoped models must have a relation path to `brands`
- [ ] Add `created_at DateTime @default(now())` and `updated_at DateTime @updatedAt` on all models
- [ ] Add indexes on every FK, and on any column used in a `WHERE` or `ORDER BY` in anticipated queries
- [ ] Soft deletes: add `deleted_at DateTime?` if records must be recoverable
- [ ] See `database-design.instructions.md` for full schema rules

**Example pattern:**
```prisma
model equipment_items {
  id          Int      @id @default(autoincrement())
  brand_id    Int
  name        String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  brand       brands   @relation(fields: [brand_id], references: [id])

  @@index([brand_id])
}
```

### 2. Generate Prisma Client

```bash
pnpm db:generate
```

Verify: no TypeScript errors in `PrismaService` usages.

### 3. Create Migration

```bash
pnpm db:migrate
# When prompted, name it: add-<model-name>  (e.g. add-equipment-items)
```

- Never use `pnpm db:push` for a model that will go to production — always create a migration file
- See `migrations.instructions.md` for naming conventions and seeding migrations

### 4. Backend — Service Layer (`packages/backend/src/<bucket>/<feature>/`)

Place the module in the correct domain bucket:

| Model type | Bucket |
|-----------|--------|
| Auth, users, contacts, roles, activity logs | `platform` |
| Brands, packages, task library, wedding types, event types | `catalog` |
| Inquiries, proposals, estimates, quotes, contracts, projects | `workflow` |
| Films, scenes, moments, beats, music, subjects, schedule | `content` |
| Invoices, payments, billing | `finance` |

Create standard files:
```
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
└── README.md
```

Rules:
- `PrismaService` injected into service — never instantiated directly
- Always filter by `brandId` at the service layer — never in the controller
- See `backend-architecture.instructions.md` for service size limits and split rules

### 5. Backend — DTOs (`dto/`)

- Decorate all properties with `class-validator` decorators
- Use `PartialType(CreateDto)` for update DTOs
- See `validation.instructions.md` for full validation rules

```ts
// create-<feature>.dto.ts
export class CreateEquipmentItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  brand_id: number;
}

// update-<feature>.dto.ts
export class UpdateEquipmentItemDto extends PartialType(CreateEquipmentItemDto) {}
```

### 6. Backend — Controller & Routes

```ts
@Controller('api/<feature>')
@UseGuards(AuthGuard('jwt'))
export class EquipmentItemsController {
  constructor(private readonly service: EquipmentItemsService) {}

  @Get()
  findAll(@Headers('x-brand-context') brandId: string) { ... }
  
  @Post()
  create(@Headers('x-brand-context') brandId: string, @Body() dto: CreateEquipmentItemDto) { ... }
}
```

- All routes **must** start with `/api/` — no exceptions (see `api-design.instructions.md`)
- All routes require `@UseGuards(AuthGuard('jwt'))` at controller level
- Brand context comes from `x-brand-context` header, not the request body

### 7. Backend — Register Module in `app.module.ts`

```ts
import { EquipmentItemsModule } from './catalog/equipment-items/equipment-items.module';

@Module({
  imports: [
    // ...existing modules
    EquipmentItemsModule,
  ],
})
export class AppModule {}
```

### 8. Seed Data (if needed)

Only create seed data if the model requires reference/demo data:
- Place seed file in `packages/backend/prisma/seeds/`
- Name it `<descriptive-name>.seed.ts`
- Register in `moonrise-complete-setup.seed.ts` or `layer5-complete-setup.seed.ts` as appropriate
- See `seed-data.instructions.md` for the full seed authoring guide

### 9. Frontend — API Binding

Add the new endpoint binding in **the feature's own `api/` folder**:

```ts
// features/catalog/equipment-items/api/equipment-items.api.ts
export const createEquipmentItemsApi = (client: ApiClient) => ({
  getAll: (brandId: string): Promise<EquipmentItem[]> =>
    client.get(`/api/equipment-items`, { headers: { 'x-brand-context': brandId } }),
  create: (brandId: string, data: CreateEquipmentItemData): Promise<EquipmentItem> =>
    client.post(`/api/equipment-items`, data, { headers: { 'x-brand-context': brandId } }),
});
```

### 10. Frontend — Types

Add types in **the feature's own `types/` folder** — NOT in `src/lib/types/` (legacy-frozen):

```ts
// features/catalog/equipment-items/types/index.ts
export interface EquipmentItem {
  id: number;
  brand_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentItemData {
  name: string;
  brand_id: number;
}
```

### 11. Frontend — React Query Hook

```ts
// features/catalog/equipment-items/hooks/useEquipmentItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';

const equipmentItemKeys = {
  all: (brandId: string) => ['equipment-items', brandId] as const,
  lists: (brandId: string) => [...equipmentItemKeys.all(brandId), 'list'] as const,
  detail: (brandId: string, id: number) => [...equipmentItemKeys.all(brandId), id] as const,
};

export const useEquipmentItems = () => {
  const { currentBrandId } = useBrand();
  return useQuery({
    queryKey: equipmentItemKeys.lists(currentBrandId),
    queryFn: () => equipmentItemsApi.getAll(currentBrandId),
    enabled: !!currentBrandId,
  });
};
```

See `react-query.instructions.md` for full React Query conventions.

### 12. Write a Feature README

Every new feature folder **must** have a `README.md`.  
See `feature-readmes.instructions.md` for the required README structure.

---

## Quick Verification

After completing all steps, run:

```bash
pnpm db:generate   # Prisma client is up to date
```

Then use `get_errors` tool (not `pnpm build`) to check for TypeScript errors.
