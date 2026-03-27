---
description: Use when writing, consuming, or refactoring React Query (TanStack Query) hooks, query keys, mutations, cache invalidation, or server state in the frontend.
applyTo: packages/frontend/src/**
---

# React Query Conventions — ProjectFlo

## Hard ban: `useEffect` + `useState` for server data

**Never** use `useEffect` + `useState` + `fetch`/`api.xyz()` to load server data. This is the #1 recurring agent mistake.

Why it's banned in ProjectFlo specifically:
- No brand-scoped cache keys → data leaks across brand switches
- No automatic refetch on brand change
- No request deduplication when multiple components mount
- No stale-while-revalidate → unnecessary loading spinners
- No cache invalidation after mutations

```ts
// ❌ BANNED — never do this
const [data, setData] = useState(null);
useEffect(() => { api.inquiries.getById(id).then(setData); }, [id]);

// ✅ REQUIRED — always use React Query hooks
const { data } = useInquiry(id);
```

The only exception is one-time effects that are **not** data fetching (e.g., analytics pings, DOM measurements).

## Hook Placement

- All `useQuery` / `useMutation` calls go in **hook files** in `features/<bucket>/<feature>/hooks/`
- **Never** call `useQuery` or `useMutation` directly inside a component
- One hook = one concern: `useInquiry(id)`, `useUpdateInquiry()`, not a giant `useInquiryData()`
- Export hooks via `features/<bucket>/<feature>/hooks/index.ts`
- Components should not implement repeated `await api...; setState(...); reload()` orchestration for the same resource. If a screen, dialog, or wizard performs that pattern, extract feature hooks and query-key factories instead of growing ad-hoc imperative API logic.

### No passthrough / no-op hooks

Never create a hook that simply returns a static API object:

```ts
// ❌ BANNED — adds indirection with zero value
export const useFooApi = () => fooApi;
```

If a feature has an `api/` folder, the `hooks/` folder must contain **real React Query hooks** (`useQuery`/`useMutation`) with:
1. A `queryKeys.ts` factory scoped to the feature
2. Individual hooks per concern: `useFoos()`, `useFoo(id)`, `useCreateFoo()`, etc.
3. Proper `enabled` guards and cache invalidation

If a feature isn't ready for hooks yet (no UI consumers), **don't create a `hooks/` folder at all** — just export the API client from the barrel. Add hooks when the first consumer needs them.

---

## Query Key Factory

Every feature must define a **query key factory** alongside its hooks:

```ts
// features/workflow/inquiries/hooks/queryKeys.ts
export const inquiryKeys = {
  all: (brandId: string) => ['inquiries', brandId] as const,
  lists: (brandId: string) => [...inquiryKeys.all(brandId), 'list'] as const,
  list: (brandId: string, filters?: Record<string, unknown>) =>
    [...inquiryKeys.lists(brandId), filters] as const,
  detail: (brandId: string, id: number) =>
    [...inquiryKeys.all(brandId), 'detail', id] as const,
};
```

**Rules:**
- Always include the current `brandId` as the first segment after the resource name
- Use the `useBrand()` hook to get `brandId` inside hooks
- Do NOT use bare string keys like `['inquiries']` — brand-unscoped keys leak data across brands

---

## Standard `useQuery` Pattern

```ts
import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { inquiryKeys } from './queryKeys';

export const useInquiry = (id: number) => {
  const { currentBrandId } = useBrand();

  return useQuery({
    queryKey: inquiryKeys.detail(currentBrandId, id),
    queryFn: () => api.inquiries.getById(id),
    enabled: !!currentBrandId && !!id,
    staleTime: 1000 * 60 * 5,   // 5 minutes — adjust per resource freshness needs
  });
};
```

- Use `enabled: !!brandId && !!<id>` to prevent queries from firing without required params
- Set `staleTime` explicitly; default `0` causes re-fetches on every mount
- Use `select` to transform/pick data at the query level, not in the component

---

## Standard `useMutation` Pattern

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { inquiryKeys } from './queryKeys';

export const useUpdateInquiry = () => {
  const { currentBrandId } = useBrand();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInquiryDto }) =>
      api.inquiries.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate the specific detail
      queryClient.invalidateQueries({ queryKey: inquiryKeys.detail(currentBrandId, id) });
      // Invalidate all lists for this brand
      queryClient.invalidateQueries({ queryKey: inquiryKeys.lists(currentBrandId) });
    },
  });
};
```

**Invalidation rules:**
- After a mutation, **always** invalidate both the list AND the specific detail
- Use `invalidateQueries` (async refetch) not `removeQueries` unless you want to clear cache
- Prefer `onSuccess` over `onSettled` unless cleanup is needed on failure too

---

## Brand-Scoped Invalidation

When operating on a resource, always scope invalidation to the current brand:

```ts
// ✅ Correct
queryClient.invalidateQueries({ queryKey: ['inquiries', currentBrandId] });

// ❌ Wrong — invalidates ALL brands
queryClient.invalidateQueries({ queryKey: ['inquiries'] });
```

---

## Loading & Error States

Use the standard destructured pattern; expose loading/error for consistent UX:

```ts
const { data, isLoading, isError, error } = useInquiry(id);
```

- Map `isLoading` → skeleton/spinner
- Map `isError` → error boundary or inline alert (see `error-handling.instructions.md`)
- Never use `status === 'loading'` — use `isLoading`, `isPending`, `isFetching` booleans

---

## List Queries with Filters

Pass filter objects as part of the query key so filtered/unfiltered results cache separately:

```ts
export const useInquiries = (filters?: InquiryFilters) => {
  const { currentBrandId } = useBrand();

  return useQuery({
    queryKey: inquiryKeys.list(currentBrandId, filters),
    queryFn: () => api.inquiries.getAll({ brandId: currentBrandId, ...filters }),
    enabled: !!currentBrandId,
  });
};
```

Apply the same rule to catalog data: package lists, package sets, event types, and similar setup resources need feature hooks and query keys instead of direct screen-level API calls.

---

## Prefetching

Use `queryClient.prefetchQuery` in page-level components (not in hooks) when navigating to a detail view:

```ts
const queryClient = useQueryClient();
queryClient.prefetchQuery({
  queryKey: inquiryKeys.detail(currentBrandId, id),
  queryFn: () => api.inquiries.getById(id),
});
```

---

## Do / Don't

| Do | Don't |
|----|-------|
| Put `useQuery`/`useMutation` in `features/.../hooks/` | Call `useQuery` directly in a component |
| Include `brandId` in every query key | Use bare `['resource']` keys |
| Use a query key factory object | Scatter inline arrays throughout hooks |
| `invalidateQueries` after every mutation | Manually update cache with `setQueryData` (unless optimistic update) |
| Use `enabled` to gate queries | Let queries fire with `undefined` params |
| Use `select` for data transformation | Transform data inside component render |
| Use `staleTime` to reduce unnecessary refetches | Rely on default `staleTime: 0` for stable data |
