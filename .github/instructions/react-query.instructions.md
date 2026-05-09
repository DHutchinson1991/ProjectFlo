---
description: "Use when writing or refactoring React Query hooks, query keys, cache invalidation, or migrating frontend server state away from manual fetching."
applyTo:
  - "packages/frontend/src/features/**/hooks/**"
  - "packages/frontend/src/features/**/api/**"
---

# React Query Conventions — ProjectFlo

## Core rule
Never load server data with `useEffect` + `useState` + direct API calls. Use feature hooks built with React Query.

## Required patterns
- Put `useQuery` and `useMutation` in `features/<bucket>/<feature>/hooks/`.
- Use one concern per hook: `useInquiry(id)`, `useUpdateInquiry()`, etc.
- Define a `queryKeys.ts` factory for each data-fetching feature.
- Include the current brand in every query key.
- Use `enabled` guards for required params.
- Set `staleTime` explicitly for stable data.

## Mutation rules
- After a successful mutation, invalidate both the relevant detail key and the list keys for the current brand.
- Scope invalidation to the current brand only.
- Prefer `onSuccess` unless failure cleanup is required.

## Anti-patterns
- No `useQuery` or `useMutation` directly inside UI components.
- No passthrough hooks like `useFooApi = () => fooApi`.
- No bare keys such as `['inquiries']`.
- No screen-level `await api...; setState(...); reload()` orchestration for the same resource.

## Exception
`useEffect` is fine for non-server-data work such as DOM sync, analytics, or other local-only effects.

