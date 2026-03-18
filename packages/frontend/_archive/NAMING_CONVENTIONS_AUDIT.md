# 🚨 Naming Conventions Audit - ContentBuilder Components

## The Problem

You're right—there are **inconsistencies between file names and export names** that create confusion. Example:
- **File**: `SceneDragPreview.tsx`
- **Export**: `export function DragOverlayScene()`
- **Result**: ???

This violates a fundamental principle: **file names should match the primary export name**.

---

## Issues Found

### 1. **Mismatched Default Exports** (HIGH PRIORITY)

| File Name | Default Export | Status | Fix |
|-----------|---|---|---|
| `ScenesGrid.tsx` | `SceneGrid` | ❌ Mismatch | Rename to `ScenesGrid` |
| `ScenesCategoryFilter.tsx` | `SceneCategories` | ❌ Mismatch | Rename to `ScenesCategoryFilter` |
| `ScenesSearch.tsx` | `SceneSearch` | ❌ Mismatch | Rename to `ScenesSearch` |
| `ScenesBrowser.tsx` | `ContentBuilderScenesLibrary` | ❌ VERY confusing | Rename to `ScenesBrowser` |
| `MomentEditorFields.tsx` | `MomentFormFields` | ⚠️ Inconsistent suffix | Standardize to `MomentEditorFields` |
| `SceneMomentsTrack.tsx` | Object with 3 sub-exports | ❌ No main export | Export main component or rename file |

### 2. **Named vs Default Export Inconsistency**

Some files use **named exports**:
```tsx
// ✅ GOOD - Named export matches file name
export const TimelinePanel: React.FC = () => { }
export const SceneActions: React.FC = () => { }
export const MomentsContainer: React.FC = () => { }
```

Others use **default exports** with different names:
```tsx
// ❌ BAD - Default export doesn't match file name
export default SceneGrid;  // From ScenesGrid.tsx
export default SceneSearch;  // From ScenesSearch.tsx
```

### 3. **Mixed Naming Patterns**

**Infrastructure (mostly consistent)**:
- ✅ `Grid.tsx` → `export default Grid`
- ✅ `Timeline.tsx` → `export default Timeline`
- ✅ `Playhead.tsx` → `export default Playhead`

**Scenes (inconsistent)**:
- ✅ `SceneCard.tsx` → `export default SceneCard`
- ❌ `ScenesGrid.tsx` → `export default SceneGrid` (off by an 's')
- ❌ `ScenesBrowser.tsx` → `export default ContentBuilderScenesLibrary` (completely different!)
- ❌ `ScenesSearch.tsx` → `export default SceneSearch` (off by an 's')
- ❌ `ScenesCategoryFilter.tsx` → `export default SceneCategories` (totally different)

**Moments (mostly consistent)**:
- ✅ `MomentsRenderer.tsx` → `export default MomentsRenderer`
- ✅ `MomentsHeader.tsx` → `export default MomentsHeader`
- ⚠️ `MomentEditorFields.tsx` → `export const MomentFormFields` (naming drift)

---

## Best Practices (React/TypeScript)

### ✅ **Rule 1: File Name = Default Export Name**

```tsx
// ScenesGrid.tsx
export default ScenesGrid;  // ✅ CORRECT

// ScenesBrowser.tsx
export default ScenesBrowser;  // ✅ CORRECT

// ❌ WRONG - Don't do this:
// ScenesGrid.tsx
export default SceneGrid;  // Confusing!
```

**Why?** When someone imports:
```tsx
import ScenesGrid from './ScenesGrid';  // They expect ScenesGrid component
```

### ✅ **Rule 2: Use Named Exports for Consistency**

Option A - **Named exports throughout** (recommended for this codebase):
```tsx
// ScenesGrid.tsx
export const ScenesGrid: React.FC = () => { }

// Import
import { ScenesGrid } from './scenes';
```

Option B - **Default exports only** (simpler imports):
```tsx
// ScenesGrid.tsx
export default ScenesGrid;

// Import
import ScenesGrid from './scenes';
```

**Current state**: Mixed (messy)

### ✅ **Rule 3: Consistent Suffixes**

Use consistent suffixes across domains:

```tsx
// ✅ GOOD - Consistent pattern
Timeline/
  ├─ ScenesHeader.tsx      // "Scene" container
  ├─ SceneBlock.tsx        // Single item
  ├─ SceneActions.tsx      // Scene actions

MomentsRenderer.tsx         // Multiple items renderer
MomentsHeader.tsx           // Multiple items header
MomentEditor.tsx            // Single item editor
MomentEditorFields.tsx      // Editor sub-component (suffix should be Editor, not Form)
```

**Issues**:
- `MomentFormFields` should be `MomentEditorFields` (consistent with `MomentEditor`)
- Field names suggest form/input, but they're part of the editor dialog

### ✅ **Rule 4: Semantic Pluralization**

Use singular for individual items, plural for collections:

```tsx
// ✅ CORRECT PATTERN
Scene (single) → SceneBlock, SceneCard, SceneActions
Scenes (multiple) → ScenesGrid, ScenesSearch, ScenesBrowser

Moment (single) → MomentEditor, MomentCoverageSelector
Moments (multiple) → MomentsRenderer, MomentsHeader, MomentsContainer
```

---

## Recommended Fixes

### **Phase 1: Critical Renames** (Highest Impact)

1. **`ScenesGrid.tsx`**
   - Change `export default SceneGrid` → `export const ScenesGrid`

2. **`ScenesBrowser.tsx`**
   - Change `export default ContentBuilderScenesLibrary` → `export const ScenesBrowser`

3. **`ScenesSearch.tsx`**
   - Change `export default SceneSearch` → `export const ScenesSearch`

4. **`ScenesCategoryFilter.tsx`**
   - Change `export default SceneCategories` → `export const ScenesCategoryFilter`

5. **`MomentEditorFields.tsx`**
   - Change `export const MomentFormFields` → `export const MomentEditorFields`

### **Phase 2: Consistency Pass** (Mid Priority)

Decide: Should we use **all named exports or all default exports**?

**Recommendation**: **Use named exports throughout** because:
- More explicit in imports
- Easier to tree-shake
- Consistent with existing Panel components (`TimelinePanel`, `LibraryPanel`)
- Better IDE support (knows exact component name)

Convert all default exports to named:
```tsx
// Current (default)
export default Grid;

// New (named)
export const Grid: React.FC = () => { }

// Imports stay similar
import { Grid } from './infrastructure';  // Explicit
// vs
import Grid from './Grid';  // Hidden - where does it come from?
```

### **Phase 3: Documentation** (Low Priority)

Create naming convention doc:
- File names match primary export name
- Use named exports for clarity
- Singular for single items, plural for collections
- Consistent suffixes per domain

---

## Impact Analysis

### Files That Need Changes

**Barrel Exports** (will need updates):
- `timeline/infrastructure/index.ts`
- `timeline/scenes/index.ts`
- `timeline/moments/index.ts`
- `library/scenes/index.ts`
- `timeline/index.ts`
- `library/index.ts`

**Import Sites** (will need updates):
- Any file importing these components
- About 10-15 files affected

**Risk Level**: LOW (simple find-replace)

---

## Code Examples: Before vs After

### Example 1: ScenesGrid.tsx

**Before** (confusing):
```tsx
// File: ScenesGrid.tsx
export default SceneGrid;  // ❌ Doesn't match file name!

// Import
import ScenesGrid from './ScenesGrid';  // Confusing - file and import don't match!
```

**After** (clear):
```tsx
// File: ScenesGrid.tsx
export const ScenesGrid: React.FC = () => { }  // ✅ Matches file name!

// Import
import { ScenesGrid } from './scenes';  // ✅ Clear and explicit!
```

### Example 2: ScenesBrowser.tsx

**Before** (very confusing):
```tsx
// File: ScenesBrowser.tsx
export default ContentBuilderScenesLibrary;  // ❌ What?!

// Import
import ScenesBrowser from './scenes';  // WRONG - file exports ContentBuilderScenesLibrary!
```

**After** (crystal clear):
```tsx
// File: ScenesBrowser.tsx
export const ScenesBrowser: React.FC = () => { }  // ✅ Clear!

// Import
import { ScenesBrowser } from './scenes';  // ✅ Obvious!
```

---

## Summary

| Issue | Severity | Fix Complexity | Impact |
|-------|----------|---|---|
| File/export name mismatch | 🔴 HIGH | 🟢 Simple | Developer confusion, hard to find code |
| Mixed export types (named vs default) | 🟡 MEDIUM | 🟢 Simple | Inconsistent import patterns |
| Semantic pluralization drift | 🟡 MEDIUM | 🟢 Simple | Unclear what component does |
| Suffix inconsistency | 🟡 MEDIUM | 🟢 Simple | Hard to categorize components |

**Total files to fix**: ~6 primary + ~15 import sites
**Estimated time**: 15-20 minutes
**Risk**: Very low (mechanical changes)

---

## Action Items

### Should we:

1. ✅ **Fix Phase 1** (Critical renames) - RECOMMENDED
2. ✅ **Fix Phase 2** (Convert to named exports) - RECOMMENDED  
3. ✅ **Create naming guide** - RECOMMENDED
4. ✅ **Add ESLint rule** - OPTIONAL (to prevent future mismatches)

**Would you like me to implement all three phases?**
