# Phase 9 - Templates (Week 9)

## Purpose
Provide UI for browsing and applying scene templates to films.

## References
- Architecture: [00_ARCHITECTURE_OVERVIEW.md](.github/refactor-films/00_ARCHITECTURE_OVERVIEW.md)
- Checklist: [01_IMPLEMENTATION_CHECKLIST.md](.github/refactor-films/01_IMPLEMENTATION_CHECKLIST.md)
- Seeding: [SEEDING_STRATEGY.md](.github/refactor-films/SEEDING_STRATEGY.md)

## Dependencies
- Scene template endpoints available.

## Goals
- Display templates with preview of scenes and moments.
- Apply templates to a film with confirmation.

## UI Deliverables

### Components
- `SceneTemplateLibrary`
- `SceneTemplatePreview`
- `ApplyTemplateDialog`

## UX Notes
- Applying a template adds scenes and moments to the film.
- Warn if film already has scenes.

## API Usage
- Scene templates: list
- Apply template: add scenes/moments to film

## Checklist
- [ ] Build template library page.
- [ ] Render template cards with summary.
- [ ] Implement `SceneTemplatePreview` modal.
- [ ] Implement `ApplyTemplateDialog` with warnings.
- [ ] Wire apply action to API.
- [ ] Add loading/empty/error states.
- [ ] Confirm applied scenes appear in timeline.

## Acceptance Criteria
- Templates are discoverable and previewable.
- Applying template creates scenes/moments correctly.
- Users are warned before overwriting existing scenes.
