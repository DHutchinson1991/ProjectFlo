# Spatial Engine

## What this module does
Loads floorplan spatial data from the database, projects 2D floor positions into camera-relative frame coordinates, generates ControlNet conditioning SVGs, and produces debug spatial overlay visualisations. All operations are deterministic (no LLM calls).

## Key files
| File | Purpose |
|------|---------|
| `spatial-engine.module.ts` | NestJS module — exports all 4 services |
| `services/floorplan-data.service.ts` | Prisma queries: camera positions, subject positions, floor objects |
| `services/spatial-translator.service.ts` | Camera projection math: floor → frame coordinates. Central type hub (`FloorSubject`, `FloorCamera`, `FrameSubject`, `SpatialFrame`) |
| `services/dynamic-controlnet.service.ts` | Generates ControlNet-ready SVG composition guides from spatial frame data |
| `services/spatial-overlay.service.ts` | Debug SVG overlay with rule-of-thirds grid, subject labels, camera FOV |

## Business rules / invariants
- `SpatialTranslatorService` is the canonical type hub — all spatial interfaces (`FloorSubject`, `FloorCamera`, `FrameSubject`, `SpatialFrame`, etc.) are defined and exported from it.
- Projection is purely geometric; no LLM involvement.
- ControlNet SVGs are white-on-black, matching ComfyUI's expected input format.
- `FloorplanDataService` uses `GenerateShotPreviewDto` from `scene-preparation/dto/`.

## Related modules
- **Backend**: `content/scene-preparation/` — uses spatial data + ControlNet during scene prep.
- **Backend**: `content/frame-rendering/` — uses spatial data + ControlNet during image generation.
- **Frontend**: `features/content/shot-previews` — consumes spatial overlays via controller endpoints.
