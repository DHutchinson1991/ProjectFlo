# Phase 6 - Timeline (Week 7)

## Purpose
Replace the legacy timeline with a scene/moment-driven timeline based on the new Film → Scene → Moment structure.

## References
- Architecture: [00_ARCHITECTURE_OVERVIEW.md](.github/refactor-films/00_ARCHITECTURE_OVERVIEW.md)
- Checklist: [01_IMPLEMENTATION_CHECKLIST.md](.github/refactor-films/01_IMPLEMENTATION_CHECKLIST.md)

## Dependencies
- Film scenes and moments endpoints available.
- Recording setup UI completed.

## Goals
- Timeline reflects ordered scenes and moments.
- Users can navigate quickly between scenes.
- Timeline is the single entry point for moment edits.

## UI Deliverables

### Components
- `TimelineView`
- `TimelineSceneRow`
- `TimelineMomentCard`
- `SceneDropdown`

## UX Notes
- Scenes displayed in order with visual grouping.
- Moments within scenes are listed in sequence.
- Selecting a moment opens the new recording setup editor.

## API Usage
- Film scenes: list with moments
- Moment update (order, duration)

## Checklist
- [ ] Build `TimelineView` layout and top navigation.
- [ ] Build `SceneDropdown` for quick jumps.
- [ ] Render `TimelineSceneRow` for each scene.
- [ ] Render `TimelineMomentCard` for each moment.
- [ ] Wire moment selection to open `MomentEditPopover`.
- [ ] Add empty state for films with no scenes.
- [ ] Implement loading and error states.
- [ ] Remove legacy timeline components and routes.

## Acceptance Criteria
- Timeline displays all scenes and moments in correct order.
- Moment selection opens the new recording setup editor.
- Legacy timeline UI is fully removed.
