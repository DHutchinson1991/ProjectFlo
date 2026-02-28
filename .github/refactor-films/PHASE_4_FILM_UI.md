# Phase 4 - Film UI (Week 5)

## Purpose
Build the core Film user experience: create, list, view, edit, and configure equipment. This phase wires the frontend UI to the Film APIs and replaces legacy film/scene screens.

## References
- Architecture: [00_ARCHITECTURE_OVERVIEW.md](.github/refactor-films/00_ARCHITECTURE_OVERVIEW.md)
- Checklist: [01_IMPLEMENTATION_CHECKLIST.md](.github/refactor-films/01_IMPLEMENTATION_CHECKLIST.md)
- Backend phase: [PHASE_2_BACKEND.md](.github/refactor-films/PHASE_2_BACKEND.md)
- Frontend infra: [PHASE_3_FRONTEND_INFRA.md](.github/refactor-films/PHASE_3_FRONTEND_INFRA.md)

## Dependencies
- Film endpoints available.
- Equipment endpoints available.
- Frontend types, API client, and hooks in place.

## Goals
- Users can create a film and configure equipment.
- Users can list and open films.
- Users can edit film metadata and equipment after creation.

## UI Deliverables

### Pages
- Film List
- Film Create Wizard
- Film Detail
- Film Edit

### Components
- `FilmListPage`
- `FilmCard`
- `FilmCreatePage`
- `FilmWizard`
- `FilmWizardStepBasics`
- `FilmWizardStepEquipment`
- `FilmWizardStepScenes`
- `FilmDetailPage`
- `FilmEditPage`
- `EquipmentConfigPanel`

## UX Notes
- Equipment names are auto-generated (Camera 1-3, Audio 1-2, Graphics 1, Music 1).
- Wizard enforces required steps before progressing.
- Edit screen supports equipment add/remove with warnings when data exists.

## API Usage
- Films: create, list, detail, update
- Equipment: get for film, add/remove

## Checklist
- [ ] Build film list page with `FilmCard` summary.
- [ ] Wire list page to `useFilms()` hook.
- [ ] Build create wizard shell (`FilmWizard`).
- [ ] Implement `FilmWizardStepBasics` (name, date, location).
- [ ] Implement `FilmWizardStepEquipment` (count inputs + preview names).
- [ ] Implement `FilmWizardStepScenes` (select scene template, optional).
- [ ] Submit wizard to create film + equipment.
- [ ] Build film detail page (summary, equipment list, scenes list).
- [ ] Build film edit page with metadata update.
- [ ] Add `EquipmentConfigPanel` for add/remove equipment.
- [ ] Display warning when removing equipment with existing assignments.
- [ ] Add loading, error, and empty states.
- [ ] Replace legacy film/scene list navigation with new pages.

## Acceptance Criteria
- New Film flow works end-to-end.
- Film list loads quickly and shows all films.
- Equipment config accurately reflects backend data.
- No legacy Film/Scene UI remains accessible.
