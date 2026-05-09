---
mode: 'agent'
description: 'Visualize a backend+frontend feature — generates diagrams + opens in browser'
---

# Visualize Feature

Analyze the feature at the path provided (`bucket/feature` format, e.g. `content/moments`).

## Step 1: Generate & Open

Run the visualization script:

```
node tools/visualize-feature.js $ARGUMENTS
```

Then **open the generated HTML in the browser** using the `open_browser_page` tool with the file URI:
`file:///C:/Users/works/Documents/Code Projects/ProjectFlo/docs/feature-diagrams/{bucket}-{feature}.html`

Replace `{bucket}` and `{feature}` with the actual values from `$ARGUMENTS` (e.g. `content/moments` → `content-moments`).

## Step 2: Deep Logic Analysis

After the structure diagram is generated, read the actual source files for the feature and create an enhanced analysis file at `docs/feature-diagrams/{bucket}-{feature}-analysis.md`.

Include these sections:

### Request Flow Sequences
Create Mermaid **sequence diagrams** for the 2-3 most important user operations. Show the exact method calls at each layer with real function/method names from the source.

Example format:
```
sequenceDiagram
    participant UI as SceneTimeline
    participant H as useMomentOperations
    participant A as momentsApi.update
    participant C as MomentsController.update
    participant S as MomentsCrudService.update
    participant DB as prisma.sceneMoment

    UI->>H: handleSaveMoment(data)
    H->>A: update(momentId, data)
    A->>C: PATCH /api/moments/:id
    C->>S: update(id, dto)
    S->>DB: update({ where: { id }, data })
    DB-->>S: updated moment
    S-->>C: moment with relations
    C-->>A: JSON response
    A-->>H: typed SceneMoment
    H-->>UI: onMomentsUpdate(updated)
```

### Business Logic Notes
Document non-obvious logic:
- Validation rules beyond basic type checking
- Side effects (auto-creation of related records, cascading updates)
- Conditional branching in services
- Error handling patterns (what happens on 404, duplicates, etc.)

### State Management Flow
How frontend state flows: which hooks depend on which, what React Query cache keys are used, optimistic updates, state synchronization patterns.

### Data Transformation Map
How data changes shape at each layer: DTO → Service result → Controller response → API client → Hook return → Component props. Note any field renaming, filtering, or enrichment.

## Architecture Context

This is a NestJS + Next.js monorepo:
- **Backend**: Controller → Service → PrismaService (PostgreSQL)
- **Frontend**: Components → Hooks (React Query) → API bindings (typed fetch via ApiClient)
- Feature modules grouped under: `platform`, `catalog`, `workflow`, `content`, `finance`
- Backend path: `packages/backend/src/{bucket}/{feature}/`
- Frontend path: `packages/frontend/src/features/{bucket}/{feature}/`
- Prisma schema: `packages/backend/prisma/schema.prisma`
- Brand context flows via `X-Brand-Context` header
- Auth is JWT-based (passport-jwt)

## Output

Write the enhanced analysis to `docs/feature-diagrams/{bucket}-{feature}-analysis.md`, using the feature's actual code and real method names.
