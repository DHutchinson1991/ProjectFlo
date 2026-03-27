# Content Bucket

**Path:** `packages/backend/src/content/`

## Responsibility

The `content` bucket owns all creative-production entities — the hierarchical film structure (films → scenes → moments → beats), assignments (subjects, locations, music, audio), instance copies, and the schedule system that links them to inquiries and packages.

## Sub-modules

| Module | Purpose |
|--------|---------|
| [`films/`](films/README.md) | Film CRUD, timeline tracks, equipment assignments |
| [`scenes/`](scenes/README.md) | FilmScene CRUD, recording setup, scene templates |
| [`moments/`](moments/README.md) | SceneMoment CRUD, recording setup, reorder |
| [`beats/`](beats/README.md) | Beat CRUD for MONTAGE-mode scenes |
| [`subjects/`](subjects/README.md) | Film subjects, scene/moment assignments, subject roles |
| [`music/`](music/README.md) | Scene and moment music assignments (one-to-one) |
| [`instance-films/`](instance-films/README.md) | Project-level instance copies of film structures |
| [`schedule/`](schedule/README.md) | Preset library, package templates, project/inquiry instances, schedule diff |
| [`film-locations/`](film-locations/README.md) | Location CRUD and scene/moment location assignments |
| [`film-structure-templates/`](film-structure-templates/README.md) | Library film templates for rapid project setup |
| [`montage-presets/`](montage-presets/README.md) | Montage beat presets for MONTAGE-mode scenes |
| [`scene-audio-sources/`](scene-audio-sources/README.md) | Audio source tags per scene |
| [`audit/`](audit/README.md) | Read-only audit trail queries for film content changes |
| [`coverage/`](coverage/README.md) | Scene/moment coverage status tracking |

## Architecture conventions

- Every controller uses `api/` route prefix and class-level `@UseGuards(AuthGuard('jwt'))`.
- Services are ≤250 lines; controllers ≤200 lines; methods ≤60 lines.
- One DTO class per file; barrel `index.ts` files for re-export when needed.
- No raw `any` — Prisma payload types live in `<module>/types/*.type.ts`.
- All modules registered in `ContentModule` (`content.module.ts`).

## Related buckets

- `platform/` — users, brands, auth
- `catalog/` — equipment library, job roles, event types
- `workflow/` — inquiries, tasks, proposals
- `finance/` — estimates, quotes, payments
