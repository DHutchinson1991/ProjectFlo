# Implementation Checklist - All Phases

Track progress through all 10 phases. Update this as you complete each item.

---

## Phase 1: Database (Week 1)

### Create Prisma Migration
- [ ] Create migration with new tables
- [ ] Add enums (TrackType, SubjectCategory, etc.)
- [ ] Verify schema syntax
- [ ] Test migration locally

### Seed Templates
- [ ] Create moonrise-00-subject-templates.seed.ts (24 subjects)
- [ ] Create moonrise-01-scene-templates.seed.ts (3 scenes)
- [ ] Register new seeds in prisma/seeds/index.ts
- [ ] Test seeds run successfully
- [ ] Verify data in Prisma Studio

### Data Cleanup
- [ ] Create cleanup migration SQL
- [ ] Execute cleanup: DELETE old Coverage, LocalScene, Moment data
- [ ] Run verify-clean-slate.js script
- [ ] Confirm all old tables are empty
- [ ] Remove legacy Moonrise seed files (subjects/scenes/moments/films/coverage)
- [ ] Keep moonrise-complete-setup enabled in seed runner

### Demo Data
- [ ] Create moonrise-02-demo-film-structure.seed.ts
- [ ] Create moonrise-03-demo-subjects.seed.ts
- [ ] Create moonrise-04-demo-recording-setups.seed.ts
- [ ] Create moonrise-05-demo-music.seed.ts
- [ ] Test full seed with SEED_DEMO_DATA=true

### Backend Verification
- [ ] Run `npx prisma db push`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Verify backend starts without errors
- [ ] Verify all tables exist in database
- [ ] Create PHASE_1_VERIFICATION.md

**Total:** 35+ items

---

## Phase 2: Backend Services (Weeks 2-3)

### Subject Management
- [ ] Create src/subjects/subjects.module.ts
- [ ] Create src/subjects/subjects.service.ts
- [ ] Create src/subjects/subjects.controller.ts
- [ ] Create DTOs (create, update subject)
- [ ] Add LoggerService integration
- [ ] Write unit tests
- [ ] Test all endpoints

### Equipment & Film Config
- [ ] Update films.service.ts for equipment config
- [ ] Create equipment.module.ts (or add to films)
- [ ] Implement equipment add/remove logic
- [ ] Write unit tests
- [ ] Test film creation with equipment

### Recording Setup Management
- [ ] Create src/recording-setup/recording-setup.module.ts
- [ ] Create src/recording-setup/recording-setup.service.ts
- [ ] Create src/recording-setup/recording-setup.controller.ts
- [ ] Create DTOs (create, update recording setup)
- [ ] Add LoggerService integration
- [ ] Write unit tests

### Music Management
- [ ] Create src/music/music.module.ts
- [ ] Create src/music/music.service.ts
- [ ] Create src/music/music.controller.ts
- [ ] Handle scene-level music
- [ ] Handle moment-level music (overrides)
- [ ] Write unit tests

### Logging Infrastructure
- [ ] Create src/common/logging/logger.service.ts
- [ ] Create src/common/logging/request-logger.middleware.ts
- [ ] Integrate middleware in app.module.ts
- [ ] Test logging output
- [ ] Document log format

### Update App Module
- [ ] Import new modules
- [ ] Remove old module imports (moments, components, timeline, scenes)
- [ ] Verify app starts without errors
- [ ] Run lint: `npm run lint:fix`

### E2E Testing
- [ ] Create test/new-apis.e2e-spec.ts
- [ ] Test all new endpoints
- [ ] Test error handling
- [ ] Verify response formats

### Old Code Cleanup
- [ ] Delete src/moments/ folder
- [ ] Delete src/components/ folder
- [ ] Delete src/timeline/ folder
- [ ] Delete src/scenes/ folder (if exists)
- [ ] Run final linter
- [ ] Verify no import errors

**Total:** 50+ items

---

## Phase 3: Frontend Infrastructure (Week 4)

### TypeScript Types
- [ ] Create src/types/film.ts
- [ ] Create src/types/subjects.ts
- [ ] Create src/types/recording-setup.ts
- [ ] Create src/types/music.ts
- [ ] Create src/types/equipment.ts
- [ ] Export from src/types/index.ts

### API Client
- [ ] Update lib/api.ts with new endpoints
- [ ] Create lib/api/subjects.api.ts
- [ ] Create lib/api/recording-setup.api.ts
- [ ] Create lib/api/music.api.ts
- [ ] Create lib/api/equipment.api.ts
- [ ] Test all API calls against backend

### Logging Setup
- [ ] Create lib/logging/api-logger.ts
- [ ] Create lib/logging/request-interceptor.ts
- [ ] Create lib/logging/utils.ts
- [ ] Test logging in browser console

### Dev Console Component
- [ ] Create components/dev-console/DevConsole.tsx
- [ ] Create components/dev-console/DevConsole.module.css
- [ ] Create lib/debug/dev-console-store.ts
- [ ] Integrate in app/layout.tsx
- [ ] Test real-time API monitoring
- [ ] Verify development-only behavior

### Custom Hooks
- [ ] Create hooks/useFilms.ts
- [ ] Create hooks/useFilmSubjects.ts
- [ ] Create hooks/useRecordingSetup.ts
- [ ] Create hooks/useSceneTemplates.ts
- [ ] Create hooks/useMusic.ts
- [ ] Add logging to all hooks
- [ ] Write hook tests

### Old Code Cleanup
- [ ] Delete components/FilmCoverage/ folder
- [ ] Delete components/SceneCoverage/ folder
- [ ] Delete components/LocalSceneEditor/ folder
- [ ] Delete components/MomentsList/ folder
- [ ] Delete components/ComponentLibrary/ folder
- [ ] Delete components/TimelineLayer/ folder
- [ ] Delete types/coverage.ts
- [ ] Delete types/sceneComponent.ts
- [ ] Delete types/timelineLayer.ts
- [ ] Delete old hooks (useCoverage, useLocalScene)
- [ ] Run linter: `npm run lint:fix`
- [ ] Verify no import errors

**Total:** 45+ items

---

## Phase 4: Film Management UI (Week 5)

- [ ] Create components/films/FilmCreate.tsx
- [ ] Create components/films/FilmCreateWizard.tsx
- [ ] Create components/films/EquipmentConfig.tsx
- [ ] Create components/films/FilmList.tsx
- [ ] Create components/films/FilmDetail.tsx
- [ ] Create components/films/FilmEdit.tsx
- [ ] Wire up navigation and routing
- [ ] Test film creation flow end-to-end
- [ ] Test equipment configuration
- [ ] Verify data saves to backend

**Total:** 10+ items

---

## Phase 5: Recording Setup UI (Week 6)

- [ ] Rewrite components/moments/MomentEditPopover.tsx
- [ ] Create components/recording-setup/RecordingSetupEditor.tsx
- [ ] Create components/recording-setup/CameraSubjectSelector.tsx
- [ ] Create components/recording-setup/SubjectMultiSelect.tsx
- [ ] Integrate into moment edit dialog
- [ ] Test subject selection and assignment
- [ ] Test camera track assignment
- [ ] Test UI updates on save

**Total:** 8+ items

---

## Phase 6: Timeline Enhancements (Week 7)

- [ ] Rewrite components/timeline/Timeline.tsx
- [ ] Create components/timeline/TimelineTrack.tsx
- [ ] Create components/timeline/TimelineScene.tsx
- [ ] Create components/timeline/SceneDropdown.tsx
- [ ] Implement flat film → scenes → moments structure
- [ ] Test drag-and-drop scene adding
- [ ] Test moment visualization
- [ ] Test moment editing integration

**Total:** 8+ items

---

## Phase 7: Subject Management UI (Week 8)

- [ ] Create components/subjects/SubjectManagement.tsx
- [ ] Create components/subjects/SubjectList.tsx
- [ ] Create components/subjects/SubjectCreate.tsx
- [ ] Create components/subjects/SubjectEdit.tsx
- [ ] Create components/subjects/SubjectCategory.tsx
- [ ] Create components/subjects/SubjectBrowser.tsx
- [ ] Implement template vs custom distinction
- [ ] Test add/edit/delete subjects
- [ ] Test category filtering

**Total:** 9+ items

---

## Phase 8: Music Management UI (Week 9)

- [ ] Create components/music/MusicLibrary.tsx
- [ ] Create components/music/MusicAssignment.tsx
- [ ] Create components/music/SceneMusic.tsx
- [ ] Create components/music/MomentMusic.tsx
- [ ] Create components/music/MusicBrowser.tsx
- [ ] Implement scene-level background music
- [ ] Implement moment-level overrides
- [ ] Test music assignment
- [ ] Test spanning logic

**Total:** 9+ items

---

## Phase 9: Scene Templates Library (Week 9)

- [ ] Create components/templates/SceneTemplateLibrary.tsx
- [ ] Create components/templates/TemplatePreview.tsx
- [ ] Create components/templates/TemplateSelector.tsx
- [ ] Implement template browsing
- [ ] Implement template selection in film
- [ ] Implement moment duplication from template
- [ ] Test template application

**Total:** 7+ items

---

## Phase 10: Testing & Polish (Week 10)

### E2E Testing
- [ ] Create test/refactor-e2e.spec.ts
- [ ] Test complete film creation
- [ ] Test adding scenes from templates
- [ ] Test moment recording setup editing
- [ ] Test subject management
- [ ] Test music assignment
- [ ] Test timeline operations

### Data Validation
- [ ] Test invalid inputs rejected
- [ ] Test required fields enforced
- [ ] Test unique constraints
- [ ] Test cascading deletes
- [ ] Test orphaned data cleanup

### Performance Testing
- [ ] Test timeline with 20+ scenes
- [ ] Test moment edit dialog
- [ ] Test subject multi-select (50+ subjects)
- [ ] Profile API response times
- [ ] Optimize slow queries if needed

### Code Quality
- [ ] Run `npm run lint:fix` (both packages)
- [ ] Run all unit tests
- [ ] Run all E2E tests
- [ ] Code review all changes
- [ ] Check test coverage (aim for >80%)
- [ ] Document deviations from spec

### Documentation
- [ ] Update README.md
- [ ] Create DEVELOPER_GUIDE.md
- [ ] Create API_DOCUMENTATION.md
- [ ] Update database diagram
- [ ] Create user guide for new features
- [ ] Document logging formats

### Final Cleanup
- [ ] Remove all TODO comments
- [ ] Remove console.logs
- [ ] Remove commented code
- [ ] Run final lint
- [ ] Verify no build warnings
- [ ] Check bundle size

### Deployment Prep
- [ ] Create migration guide
- [ ] Plan data migration from old schema
- [ ] Create rollback procedure
- [ ] Document staging setup
- [ ] Plan production deployment
- [ ] Create post-deployment checklist

**Total:** 60+ items

---

## Summary

- **Phase 0:** 8 items
- **Phase 1:** 35+ items
- **Phase 2:** 50+ items
- **Phase 3:** 45+ items
- **Phase 4:** 10+ items
- **Phase 5:** 8+ items
- **Phase 6:** 8+ items
- **Phase 7:** 9+ items
- **Phase 8:** 9+ items
- **Phase 9:** 7+ items
- **Phase 10:** 60+ items

**Total: 309+ checkboxes across 11 weeks**

---

## Progress Tracking

```bash
# Count completed items
grep -c "- \[x\]" 01_IMPLEMENTATION_CHECKLIST.md

# See percentage
echo "Completed: $(grep -c '- \[x\]' 01_IMPLEMENTATION_CHECKLIST.md) / 309"
```
