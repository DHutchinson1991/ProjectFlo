# Phase 8 - Music UI (Week 9)

## Purpose
Create the music library and assignment UI for scene-level and moment-level music.

## References
- Architecture: [00_ARCHITECTURE_OVERVIEW.md](.github/refactor-films/00_ARCHITECTURE_OVERVIEW.md)
- Checklist: [01_IMPLEMENTATION_CHECKLIST.md](.github/refactor-films/01_IMPLEMENTATION_CHECKLIST.md)

## Dependencies
- Scene music and moment music endpoints available.

## Goals
- Manage music library assets.
- Assign music to scenes and override at moments.

## UI Deliverables

### Components
- `MusicLibraryPage`
- `MusicPicker`
- `SceneMusicPanel`
- `MomentMusicPanel`
- `MusicAssignmentCard`

## UX Notes
- Scene music applies to all moments unless overridden.
- Moment music can override or extend scene music.

## API Usage
- Music library: list, create, update
- Scene music: assign, update, delete
- Moment music: assign, update, delete

## Checklist
- [ ] Build music library page (list + add/edit).
- [ ] Implement `MusicPicker` for selecting tracks.
- [ ] Add `SceneMusicPanel` with assignment controls.
- [ ] Add `MomentMusicPanel` for overrides.
- [ ] Render `MusicAssignmentCard` with details.
- [ ] Wire all panels to music APIs.
- [ ] Handle loading, empty, error states.
- [ ] Remove legacy music UI if present.

## Acceptance Criteria
- Scene music assignments persist.
- Moment overrides work as expected.
- Users can browse and select music assets.
