# 🔍 Complete ContentBuilder Audit
## Components, Hooks, Utils, and Naming Conventions

**Audit Date:** January 31, 2026  
**Scope:** Full ContentBuilder architecture + related hooks + utilities  
**Status:** COMPREHENSIVE REVIEW

---

## 📊 Overview Statistics

| Category | Count | Files | Status |
|----------|-------|-------|--------|
| **Core Components** | 1 | index.tsx, Container, Provider | ✅ Good |
| **UI Panels** | 5 | Timeline, Library, Playback, Details, Modals | ⚠️ Mixed |
| **Timeline (sub)** | 18 | Infrastructure, Scenes, Moments | ⚠️ Naming issues |
| **Library (sub)** | 6 | Scenes only | ⚠️ Naming issues |
| **Context/Config** | 5 | Context, Theme, Constants, Drag, Index | ✅ Good |
| **Utils** | 15+ | Color, Drag, Moment, Index, etc. | ⏳ TBD |
| **Hooks (Timeline)** | 20+ | Data, Interaction, Layout, Scene, Playback | ⏳ TBD |
| **Hooks (Other)** | 12+ | Films, Music, Subjects, etc. | ⏳ TBD |

**Total ContentBuilder Files: ~63 files**

---

## 📁 Directory Structure Analysis

### ✅ **GOOD: Clear Hierarchy**

```
ContentBuilder/
├── index.tsx                           ✅ Main component
├── ContentBuilderContainer.tsx         ✅ Clear naming
├── context/
│   └── ContentBuilderContext.tsx       ✅ Clear naming
├── config/
│   ├── constants.ts                    ✅ Clear
│   ├── dragConfig.ts                   ✅ Clear
│   ├── theme.ts                        ✅ Clear
│   └── index.ts                        ✅ Clear
└── utils/
    ├── colorUtils.ts                   ✅ Clear
    ├── dragDropUtils.ts                ✅ Clear
    └── ...
```

### ⚠️ **MIXED: UI Panels (Inconsistent Depth)**

```
ui/panels/
├── timeline/
│   ├── TimelinePanel.tsx               ✅ Main container - GOOD
│   ├── infrastructure/                 ✅ Sub-domain - GOOD
│   ├── scenes/                         ✅ Sub-domain - GOOD
│   ├── moments/                        ✅ Sub-domain - GOOD
│   └── ScenesHeader.tsx                ❌ DUPLICATE FILE (also in scenes/)
│
├── library/
│   ├── LibraryPanel.tsx                ✅ Main container - GOOD
│   └── scenes/                         ✅ Sub-domain - GOOD
│
├── playback/
│   ├── PlaybackPanel.tsx               ✅ Clear
│   ├── PlaybackScreen.tsx              ✅ Clear
│   ├── PlaybackControls.tsx            ✅ Clear
│   └── SaveControls.tsx                ⚠️ Naming drift (not "SavePanel")
│
├── details/
│   ├── DetailsPanel.tsx                ✅ Clear
│   └── FilmDetailsPanel.tsx            ⚠️ Redundant naming
│
└── modals/
    ├── ModalsContainer.tsx             ✅ Clear
    └── CreateSceneDialog.tsx           ✅ Clear
```

---

## 🔴 Critical Issues Found

### **Issue 1: Duplicate Files**

**Problem**: `ScenesHeader.tsx` exists in TWO locations:
```
timeline/ScenesHeader.tsx                    ❌ ROOT LEVEL
timeline/scenes/ScenesHeader.tsx            ✅ CORRECT LOCATION
```

**Solution**: Delete `timeline/ScenesHeader.tsx` (the root one is orphaned)

---

### **Issue 2: Export/File Name Mismatches (Component Level)**

See detailed analysis below in "Naming Violations" section.

---

### **Issue 3: Utils Organization**

**Current structure**:
```
utils/
├── colorUtils.ts
├── dragDropUtils.ts
├── momentTransform.ts
├── index.ts
└── (more utilities scattered)
```

**Problem**: Utilities are at same level - no domain organization

**Solution**: Organize by domain:
```
utils/
├── color/
│   ├── colorUtils.ts
│   └── index.ts
├── dragDrop/
│   ├── dragDropUtils.ts
│   └── index.ts
├── moment/
│   ├── momentTransform.ts
│   └── index.ts
└── index.ts (master barrel)
```

---

### **Issue 4: Hooks - Scattered & Inconsistent**

**Current Timeline Hooks**:
```
hooks/timeline/
├── data/
│   ├── useTimelineData.ts               ✅ Follows convention
│   ├── useTimelineState.ts              ✅ Follows convention
│   ├── useSaveState.ts                  ⚠️ Generic name
│   └── useScenesLibrary.ts              ✅ Clear
├── interaction/
│   ├── useDragViewport.ts               ✅ Clear
│   ├── useTimelineDragDrop.ts           ✅ Clear
│   └── useKeyboardShortcuts.ts          ✅ Clear
├── layout/
│   └── useSceneLayout.ts                ✅ Clear
├── playback/
│   ├── usePlaybackControls.ts           ✅ Clear
│   ├── usePlaybackScreen.ts             ✅ Clear
│   └── useCurrentScene.ts               ✅ Clear
├── scene/
│   ├── useMomentForm.ts                 ⚠️ Should be useMomentEditor
│   ├── useMomentOperations.ts           ✅ Clear
│   ├── useSceneCoverage.ts              ✅ Clear
│   ├── useSceneGrouping.ts              ✅ Clear
│   └── useSceneOperations.ts            ✅ Clear
├── viewport/
│   ├── useViewportState.ts              ✅ Clear
│   └── useViewportManager.ts            ✅ Clear
└── utils/
    ├── momentUtils.ts                   ✅ Clear
    └── sceneCoverageUtils.ts            ✅ Clear
```

**Other Hooks** (outside timeline):
```
hooks/
├── films/
│   └── useFilms.ts                      ✅ Clear
├── music/
│   └── useMusic.ts                      ✅ Clear
├── scenes/
│   └── useSceneTemplates.ts             ✅ Clear
├── subjects/
│   └── useFilmSubjects.ts               ✅ Clear
└── recording-setup/
    └── useRecordingSetup.ts             ✅ Clear
```

---

## 🚨 Naming Violations Summary

### **Type 1: File ≠ Export Name**

| File Name | Default Export | Issue | Priority |
|-----------|---|---|---|
| `ScenesGrid.tsx` | `SceneGrid` | Missing 's' | 🔴 HIGH |
| `ScenesSearch.tsx` | `SceneSearch` | Missing 's' | 🔴 HIGH |
| `ScenesCategoryFilter.tsx` | `SceneCategories` | Complete mismatch | 🔴 HIGH |
| `ScenesBrowser.tsx` | `ContentBuilderScenesLibrary` | Way off | 🔴 CRITICAL |
| `MomentEditorFields.tsx` | `MomentFormFields` | Wrong suffix | 🟡 MEDIUM |

### **Type 2: Inconsistent Export Patterns**

**Default Exports** (60%):
```tsx
export default Grid;
export default Timeline;
export default SceneBlock;
export default MomentEditor;
```

**Named Exports** (40%):
```tsx
export const TimelinePanel: React.FC = () => { }
export const SceneActions: React.FC = () => { }
export const MomentsContainer: React.FC = () => { }
export const MomentCoverageSelector: React.FC = () => { }
```

**Problem**: No consistency → confusing imports

---

### **Type 3: Semantic Naming Drift**

| Component | Expected | Actual | Issue |
|-----------|----------|--------|-------|
| `MomentEditorFields.tsx` | `MomentEditorFields` | `MomentFormFields` | Suffix drift (Form vs Editor) |
| `SaveControls.tsx` | `SaveControlsPanel` or in playback/ | `SaveControls` | Generic name, unclear purpose |
| `FilmDetailsPanel.tsx` | `DetailsPanel` | `FilmDetailsPanel` | Redundant (parent is DetailsPanel) |
| `SceneMomentsTrack.tsx` | Single export? | Multiple sub-exports | Confused purpose |

---

## 🎯 Detailed Issues by Component Type

### **1. Timeline Components**

```
timeline/infrastructure/
├── Grid.tsx                             ✅ Default export matches
├── SnapGrid.tsx                         ✅ Default export matches
├── DropZones.tsx                        ✅ Default export matches
├── Playhead.tsx                         ✅ Default export matches
├── Track.tsx                            ✅ Default export matches
├── Toolbar.tsx                          ✅ Default export matches
├── Timeline.tsx                         ✅ Default export matches
└── index.ts                             ✅ Clean barrel exports
```

**Status**: ✅ GOOD - Infrastructure components are consistent

---

```
timeline/scenes/
├── ScenesHeader.tsx      →  export default ScenesHeader       ✅ Matches
├── SceneBlock.tsx        →  export default SceneBlock         ✅ Matches
├── SceneActions.tsx      →  export const SceneActions         ⚠️ Named (inconsistent with others)
├── SceneMomentsTrack.tsx →  export default {...}             ❌ Multiple exports, no main export
└── index.ts              →  Proper barrel exports            ✅
```

**Status**: ⚠️ MIXED - Some inconsistency

---

```
timeline/moments/
├── MomentsRenderer.tsx   →  export default MomentsRenderer    ✅ Matches
├── MomentsContainer.tsx  →  export const MomentsContainer     ⚠️ Named (inconsistent)
├── MomentsHeader.tsx     →  export default MomentsHeader      ✅ Matches
├── MomentEditor.tsx      →  export default MomentEditor       ✅ Matches
├── MomentEditorFields.tsx→  export const MomentFormFields    ❌ MISMATCH
├── MomentCoverageSelector.tsx → export const MomentCoverageSelector ⚠️ Named
└── index.ts             →  Proper barrel exports            ✅
```

**Status**: 🔴 PROBLEMATIC - Multiple naming issues

---

### **2. Library Components**

```
library/scenes/
├── ScenesBrowser.tsx           →  export default ContentBuilderScenesLibrary  ❌ CRITICAL
├── ScenesGrid.tsx              →  export default SceneGrid                     ❌ Missing 's'
├── ScenesSearch.tsx            →  export default SceneSearch                   ❌ Missing 's'
├── ScenesCategoryFilter.tsx    →  export default SceneCategories               ❌ Wrong name
├── SceneCard.tsx               →  export default SceneCard                     ✅ Matches
└── index.ts                    →  Imports mismatch (deleted SceneDragPreview) ✅
```

**Status**: 🔴 CRITICAL - Major naming issues

---

### **3. Hooks - Timeline**

```
hooks/timeline/
├── data/useSaveState.ts           ❌ Generic - what does it save?
├── data/useScenesLibrary.ts       ✅ Clear
├── scene/useMomentForm.ts         ❌ Should be useMomentEditor (consistency)
├── scene/useMomentOperations.ts   ✅ Clear
└── ... (mostly good)
```

**Status**: 🟡 MEDIUM - Two naming issues, rest good

---

### **4. Utils - Scattered Organization**

**Location**: `ContentBuilder/utils/`

**Current Files**:
```
colorUtils.ts          ✅ Clear purpose
dragDropUtils.ts       ✅ Clear purpose
momentTransform.ts     ✅ Clear purpose
(others scattered)     ⚠️ No organization
```

**Problem**: No domain organization like hooks have

**Best Practice**: Organize by domain like hooks do

---

### **5. Context & Config**

```
context/
├── ContentBuilderContext.tsx       ✅ Excellent - clear naming
│   ├── ContentBuilderProvider      ✅ Matches file name
│   ├── useContentBuilder hook      ✅ Matches convention
│   └── Comprehensive types         ✅ Well organized

config/
├── constants.ts                    ✅ Clear
├── dragConfig.ts                   ✅ Clear
├── theme.ts                        ✅ Clear
└── index.ts                        ✅ Barrel export
```

**Status**: ✅ GOOD - Well organized

---

## 📋 Recommendations Summary

### **Phase 1: Critical Fixes (1-2 hours)**

| Issue | Files | Complexity | Impact |
|-------|-------|-----------|--------|
| Delete duplicate `timeline/ScenesHeader.tsx` | 1 | Simple | High |
| Rename library component exports | 4 | Simple | High |
| Fix `MomentEditorFields` naming | 1 | Simple | Medium |
| Standardize export pattern (named vs default) | 26 | Medium | Very High |

### **Phase 2: Organization (2-3 hours)**

| Task | Scope | Complexity | Benefit |
|------|-------|-----------|---------|
| Organize utils by domain | 15 files | Medium | Maintainability |
| Fix hook naming (`useMomentForm` → `useMomentEditor`) | 1 file | Simple | Consistency |
| Add naming documentation | - | Simple | Prevents future issues |

### **Phase 3: Cleanup (1 hour)**

| Task | Impact |
|------|--------|
| Update all import statements | Required |
| Update barrel exports | Required |
| Add ESLint rules for naming | Optional but recommended |

---

## 🏆 Best Practices Checklist

### **For Components**
- [ ] File name matches primary export name
- [ ] Use consistent export pattern (prefer named exports)
- [ ] Domain organization (panels → sub-domains → components)
- [ ] Singular for single items, plural for collections
- [ ] No orphaned files in wrong locations

### **For Hooks**
- [ ] Naming follows `use[Domain][Operation]` pattern
- [ ] Organized by responsibility (data, layout, interaction, etc.)
- [ ] Clear purpose from name alone
- [ ] Consistent with other hooks in same domain

### **For Utils**
- [ ] Organized by domain or feature
- [ ] Clear naming (verb + noun: `colorUtils`, `dragDropUtils`)
- [ ] Barrel exports for clean imports
- [ ] Related functions grouped together

### **For Naming**
- [ ] File names match exports
- [ ] Semantic pluralization (Scenes* for collections)
- [ ] Consistent suffixes (Editor, Container, Panel, etc.)
- [ ] No abbreviations or unclear acronyms

---

## 🔗 Related Audit: Global Hooks & Utils

### **Global App Hooks** (outside ContentBuilder)
```
hooks/timeline/
├── interaction/          ✅ Good organization
├── layout/              ✅ Good organization
├── playback/            ✅ Good organization
├── scene/               ✅ Good organization
├── viewport/            ✅ Good organization
└── data/                ✅ Good organization
```

**Status**: ✅ EXCELLENT - Timeline hooks well organized

### **Other App Hooks**
```
hooks/
├── calendar/useContributors.ts          ✅ Clear
├── films/useFilms.ts                    ✅ Clear
├── music/useMusic.ts                    ✅ Clear
├── scenes/useSceneTemplates.ts          ✅ Clear
└── subjects/useFilmSubjects.ts          ✅ Clear
```

**Status**: ✅ GOOD - All clearly named

---

## 🎯 Action Items

### **Immediate** (This Session)
- [ ] Delete `timeline/ScenesHeader.tsx` (duplicate)
- [ ] Fix 4 library component exports
- [ ] Update related imports

### **Short Term** (Next 1-2 hours)
- [ ] Standardize component export pattern
- [ ] Fix `MomentEditorFields` naming
- [ ] Update hook naming (`useMomentForm`)

### **Medium Term** (Next session)
- [ ] Reorganize utils by domain
- [ ] Add naming convention documentation
- [ ] Add ESLint rules

### **Long Term** (Best Practice)
- [ ] Code review checklist includes naming
- [ ] Team training on naming conventions
- [ ] Regular audits (monthly/quarterly)

---

## 📊 Priority Matrix

```
         HIGH IMPACT
              |
        CRITICAL      HIGH
              |      |
    __________|______|________
    |                        |
    |    Duplicate Files     |
    |    Export Mismatches   |
    |                        |
    |  Library Export Names  |
    |  Standardize Exports   |
    |                        |
LOW |_____|________________|HIGH
   LOW EFFORT           EFFORT
```

**Recommended Order**:
1. **Delete duplicate file** → 5 min
2. **Fix library exports** → 15 min  
3. **Standardize export pattern** → 1 hour
4. **Organize utils** → 2 hours
5. **Add documentation** → 1 hour

---

## ✅ Validation Checklist

After implementing changes, verify:

- [ ] All files have matching export names
- [ ] All imports are updated correctly
- [ ] Barrel exports include all components
- [ ] No TypeScript errors
- [ ] No unused imports
- [ ] Naming follows conventions consistently
- [ ] Utils organized by domain
- [ ] Hooks follow naming pattern
- [ ] Documentation updated

---

## 📞 Questions for Team

1. Should we use **all named exports** or **all default exports**? → Recommend **named exports**
2. Should component names be **singular or plural**? → Recommend **plural for collections** (ScenesGrid, MomentsRenderer)
3. Should we add **ESLint rules** to enforce naming? → Strongly recommend **yes**
4. Can we refactor exports in **one session** or spread across **multiple sessions**? → Recommend **one session** (low risk)

---

**Total Estimated Work**: 4-5 hours for complete refactoring  
**Risk Level**: LOW (mechanical changes, no logic changes)  
**Test Required**: Basic build + import verification
