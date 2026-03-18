# Phase 7 - Subjects UI (Week 8)

## Purpose
Provide full subject management for film-specific subjects derived from global templates.

## References
- Architecture: [00_ARCHITECTURE_OVERVIEW.md](.github/refactor-films/00_ARCHITECTURE_OVERVIEW.md)
- Checklist: [01_IMPLEMENTATION_CHECKLIST.md](.github/refactor-films/01_IMPLEMENTATION_CHECKLIST.md)

## Dependencies
- Subject templates and film subjects endpoints available.

## Goals
- Allow users to add, edit, and remove film subjects.
- Support category browsing and quick assignment in recording setups.

## UI Deliverables

### Components
- `FilmSubjectsPage`
- `SubjectTemplateLibrary`
- `SubjectCategoryTabs`
- `SubjectCreateDialog`
- `SubjectEditDialog`
- `SubjectBrowser`

## UX Notes
- Templates can be added to the film as editable subjects.
- Subjects are grouped by category (PEOPLE, OBJECTS, LOCATIONS).

## API Usage
- Subject templates: list
- Film subjects: list, create, update, delete

## Checklist
- [ ] Build film subjects page and route.
- [ ] Render `SubjectTemplateLibrary` for adding templates.
- [ ] Implement `SubjectCategoryTabs` for grouping.
- [ ] Implement `SubjectCreateDialog` (custom subject).
- [ ] Implement `SubjectEditDialog` (rename, category, notes).
- [ ] Build `SubjectBrowser` for quick search.
- [ ] Wire to film subjects API.
- [ ] Add loading, empty, and error states.
- [ ] Remove legacy subject/coverage UIs.

## Acceptance Criteria
- Users can manage subjects for a film.
- Subjects appear in recording setup selector.
- Templates remain immutable and reusable.
