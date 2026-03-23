---
description: "Use when configuring tsconfig, fixing type errors, adding type annotations, or reviewing TypeScript strictness settings."
---

# ProjectFlo — TypeScript Strictness

## Current configuration

| Setting | Backend | Frontend |
|---------|---------|----------|
| `strict` | — (individual flags) | `true` |
| `noImplicitAny` | `false` ⚠️ | `true` (via strict) |
| `strictNullChecks` | `true` | `true` (via strict) |
| `strictBindCallApply` | `false` | `true` (via strict) |
| Target | `ES2023` | `ES2017` |

## Rules for new code

Regardless of the current tsconfig relaxations, all **new code** must follow strict typing:

### Backend

- **No `any`** in services, controllers, DTOs, or mappers. Use Prisma-generated types, DTOs, or explicit type aliases.
- Existing `any` usages are legacy — do not add more.
- If a third-party library lacks types, create a local declaration file (`types/library-name.d.ts`).
- Use `unknown` instead of `any` when the type is genuinely unknown, then narrow with type guards.

### Frontend

- `strict: true` is enabled — respect it fully.
- Do not add `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- Prefer explicit return types on exported functions and hooks.
- Use MUI's generic type parameters: `TextField<string>`, `Autocomplete<Option>`.

## Type assertion rules

- Avoid `as` casts. Prefer type narrowing (`if`, `in`, `instanceof`, discriminated unions).
- Never use `as any` — it hides real bugs.
- `as const` for literal arrays/objects is acceptable.

## Gradual strictness improvement

When modifying an existing backend file:
- Do not add `any` to new code.
- If you touch a function with implicit `any`, add explicit types.
- Do not refactor unrelated code in the same change — only fix types for code you're modifying.
