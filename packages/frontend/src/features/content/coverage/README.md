# content/coverage

Reusable coverage library — video shots and audio setups that can be assigned to scenes.

## Key files

| File | Purpose |
|------|---------|
| `api/index.ts` | `coverageApi` endpoint bindings (CRUD + type filter) |
| `hooks/useCoverage.ts` | Query hooks: `useCoverageList`, `useCoverageByType`, `useCoverage` |
| `hooks/useCoverageMutations.ts` | Mutation hooks: `useCreateCoverage`, `useUpdateCoverage`, `useDeleteCoverage` |
| `constants/query-keys.ts` | `coverageKeys` factory — brand-scoped |
| `types/index.ts` | `Coverage`, `CreateCoverageDto`, `UpdateCoverageDto`, enums |
| `components/VideoCoverageTable.tsx` | Draggable video coverage table |
| `components/AudioCoverageTable.tsx` | Draggable audio coverage table |
| `components/CreateCoverageDialog.tsx` | CRUD dialog for coverage items |
| `components/TemplateCustomizationDialog.tsx` | Template-based coverage creation |

## Business rules

- Coverage items are either `VIDEO` or `AUDIO` type.
- Video coverage includes shot type, camera movement, lens, aperture, and video style.
- Audio coverage includes equipment type, pattern, and frequency response.
- Coverage can be assigned to scenes via `SceneCoverage` join records (scene-coverage endpoints live under `content/scenes`).
- Delete is soft-delete (`is_active = false`).
- Coverage can be templates (`is_template = true`) for reuse.

## Backend

- Controller: `packages/backend/src/content/coverage/coverage.controller.ts`
- Service: `packages/backend/src/content/coverage/coverage.service.ts`
- Endpoints: `POST/GET/PATCH/DELETE /api/coverage`

## Related modules

- `content/scenes` — scene-coverage assignment endpoints
- `content/films` — coverage aggregated at film level
