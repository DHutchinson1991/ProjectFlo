---
description: "Use when adding input validation, creating DTOs, writing form validation, or applying ValidationPipe in controllers."
---

# ProjectFlo — Validation Conventions

## Backend (class-validator + ValidationPipe)

### DTO decorators

All incoming request bodies and query params must be validated via DTOs with `class-validator` decorators.

```ts
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeatureDto {
  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  unit_price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(StatusEnum)
  status: StatusEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedItemDto)
  items: NestedItemDto[];
}
```

### Applying validation

Use `ValidationPipe` in controllers on `@Body()` and `@Query()`:

```ts
@Post()
create(@Body(new ValidationPipe({ transform: true })) dto: CreateFeatureDto) { }

@Get()
findAll(@Query(new ValidationPipe({ transform: true })) query: FeatureQueryDto) { }
```

- `transform: true` enables automatic type conversion (string → number for query params).
- One DTO class per file: `create-feature.dto.ts`, `update-feature.dto.ts`, `feature-query.dto.ts`.

### DTO rules

- Every field must have at least one validation decorator.
- Optional fields: `@IsOptional()` first, then type decorator.
- Nested objects: `@ValidateNested()` + `@Type(() => NestedDto)`.
- Numeric fields from query strings: `@Type(() => Number)` + `@IsNumber()`.
- Do not use `any` in DTO properties.

### Business rule validation

- DTO decorators handle shape/type validation.
- Business rules (e.g., "estimate total must match line items") belong in **services**, not DTOs.
- Throw `BadRequestException` from services for business rule violations.

## Frontend

### Current pattern

Frontend uses manual validation with state and conditionals:

```tsx
const errors: Record<string, string> = {};
if (!form.title.trim()) errors.title = 'Title is required';
if (form.amount <= 0) errors.amount = 'Amount must be positive';
setValidationErrors(errors);
```

### Rules

- Validate required fields before submitting API calls.
- Display field-level errors next to the relevant input (use MUI TextField `error` + `helperText`).
- Do not silently discard invalid input — show the user what's wrong.
- Keep validation logic in a separate function, not inline in the submit handler.
