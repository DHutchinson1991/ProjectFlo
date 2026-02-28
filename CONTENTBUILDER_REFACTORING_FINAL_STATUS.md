# ContentBuilder Refactoring Status

## Completed Objectives

### 1. Hook Extraction ("The Core Logic")
Logic successfully extracted from the "God Components" into reusable custom hooks:
- **`useSceneLayout`**: Handles layout and positioning calculations.
- **`useSceneCoverage`**: Handles complex coverage mapping and track filtering.
- **`useMomentOperations`**: Manages moment creation, deletion, and updates.
- **`useMomentForm`**: Manages form state and validation for the Moment Edit Popover.

### 2. Component Decomposition ("Split the Giants")
Large monolithic components were broken down into smaller, focused sub-components.

#### `TimelineSceneElement` Refactor
| Original | New Component Structure |
| :--- | :--- |
| `TimelineSceneElement.tsx` (~600 lines) | **`TimelineSceneElement.tsx`** (Layout & Composition) |
| | **`TimelineMomentsContainer.tsx`** (Rendering Moments) |
| | **`TimelineSceneControls.tsx`** (UI Overlay & Interaction) |

#### `MomentEditPopover` Refactor
| Original | New Component Structure |
| :--- | :--- |
| `MomentEditPopover.tsx` (~564 lines) | **`MomentEditPopover.tsx`** (Dialog Layout & Hook data wiring) |
| | **`MomentFormFields.tsx`** (Input Fields) |
| | **`MomentCoverageSelector.tsx`** (Complex Track Selection UI) |

### 3. Utility Extraction
Pure logic moved to utility files for better testability.
- **`features/timeline/utils/momentUtils.ts`**: Coverage comparison and equality checks.
- **`hooks/timeline/utils/sceneUtils.ts`**: Parsing and mapping of raw coverage data.

## File Locations

### Components
- `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/features/timeline/components/`
    - `TimelineSceneElement.tsx`
    - `TimelineMomentsContainer.tsx`
    - `TimelineSceneControls.tsx`
    - `MomentEditPopover.tsx`
    - `MomentFormFields.tsx`
    - `MomentCoverageSelector.tsx`

### Hooks
- `packages/frontend/src/hooks/timeline/` (Shared)
    - `scene/useSceneCoverage.ts`
    - `scene/useMomentOperations.ts`
    - `scene/useMomentForm.ts`
    - `layout/useSceneLayout.ts`
    - `utils/sceneCoverageUtils.ts` (Renamed from sceneUtils.ts)
    - `utils/momentUtils.ts` (Moved from features folder)

### Utils
- `packages/frontend/src/hooks/timeline/utils/momentUtils.ts`

## Next Steps
- Verify the application runs correctly with these changes.
- Consider adding unit tests for `sceneUtils.ts` and `momentUtils.ts`.
