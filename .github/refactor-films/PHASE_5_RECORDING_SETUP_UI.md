# Phase 5 - Recording Setup UI (Week 6)

## Purpose
Rebuild the Moment editing UX around `MomentRecordingSetup` and `CameraSubjectAssignment` instead of legacy coverage checkboxes.

## References
- Architecture: [00_ARCHITECTURE_OVERVIEW.md](.github/refactor-films/00_ARCHITECTURE_OVERVIEW.md)
- Checklist: [01_IMPLEMENTATION_CHECKLIST.md](.github/refactor-films/01_IMPLEMENTATION_CHECKLIST.md)
- Backend phase: [PHASE_2_BACKEND.md](.github/refactor-films/PHASE_2_BACKEND.md)
- Frontend infra: [PHASE_3_FRONTEND_INFRA.md](.github/refactor-films/PHASE_3_FRONTEND_INFRA.md)

## Dependencies
- Recording setup endpoints available.
- Film subjects endpoints available.

## Goals
- Replace coverage checkboxes with real camera assignments.
- Support audio track configuration and graphics overlay metadata.

## UI Deliverables

### Components
- `RecordingSetupEditor`
- `CameraSubjectSelector`
- `SubjectMultiSelect`
- `AudioTrackList`
- `GraphicsOverlayEditor`
- `MomentEditPopover` (rewrite)

## UX Notes
- Each camera can be assigned to multiple subjects.
- Audio tracks are configurable per moment.
- Graphics overlays are optional and tied to the moment.

## API Usage
- Recording setup: get, upsert
- Film subjects: list

## Checklist
- [ ] Replace legacy Moment edit popover content.
- [ ] Build `RecordingSetupEditor` shell with camera/audio/graphics sections.
- [ ] Build `CameraSubjectSelector` per camera.
- [ ] Build `SubjectMultiSelect` with subject search and category filter.
- [ ] Implement audio track list with add/remove.
- [ ] Implement graphics overlay editor (title, notes, asset link).
- [ ] Wire all sections to recording-setup API.
- [ ] Handle empty state (no cameras) with guidance.
- [ ] Add loading/error states.
- [ ] Remove coverage checkbox UI and related state.

## Acceptance Criteria
- Recording setup saves and reloads correctly.
- No name-based coverage matching remains.
- Camera subject assignments persist per moment.
