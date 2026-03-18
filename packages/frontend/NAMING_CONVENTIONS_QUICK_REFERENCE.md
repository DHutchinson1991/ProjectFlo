# ContentBuilder Naming Conventions - Quick Reference

## The Golden Rule

**File Name = Component Name = Export Name**

This single rule eliminates 99% of naming confusion.

---

## Examples

### ✅ CORRECT Patterns

```typescript
// File: ScenesHeader.tsx
const ScenesHeader: React.FC<ScenesHeaderProps> = ({ ... }) => { ... };
export default ScenesHeader;

// File: SceneCard.tsx
const SceneCard: React.FC<SceneCardProps> = ({ ... }) => { ... };
export { SceneCard };

// File: MomentEditor.tsx
const MomentEditor: React.FC<MomentEditorProps> = ({ ... }) => { ... };
export default MomentEditor;
```

### ❌ WRONG Patterns (Don't Do This!)

```typescript
// ❌ File: ScenesGrid.tsx, Export: SceneGrid
const ScenesGrid: React.FC = ({ ... }) => { ... };
export default SceneGrid;  // WRONG! Doesn't match file or function

// ❌ File: ScenesBrowser.tsx, Export: ContentBuilderScenesLibrary
const ScenesBrowser: React.FC = ({ ... }) => { ... };
export default ContentBuilderScenesLibrary;  // WRONG! Completely different

// ❌ File: MomentEditorFields.tsx, Export: MomentFormFields
const MomentEditorFields: React.FC = ({ ... }) => { ... };
export const MomentFormFields = ({ ... }) => { ... };  // WRONG! Doesn't match file
```

---

## Singular vs Plural

### Use **Plural** for:
- Container components that manage multiple items
- Grid/list components
- Header components showing collections

```typescript
ScenesHeader.tsx      // Shows multiple scenes
ScenesGrid.tsx        // Grid of scenes
MomentsRenderer.tsx   // Renders multiple moments
MomentsContainer.tsx  // Contains multiple moments
```

### Use **Singular** for:
- Individual item components
- Detail/edit components
- Single-purpose utilities

```typescript
SceneCard.tsx         // Single scene card
SceneBlock.tsx        // Single timeline block
MomentEditor.tsx      // Edits one moment
```

---

## Props Interface Naming

```typescript
// ✅ CORRECT
interface ScenesHeaderProps { ... }      // Matches component
interface SceneCardProps { ... }         // Matches component
interface MomentEditorProps { ... }      // Matches component

// ❌ WRONG
interface Props { ... }                  // Too generic
interface ScenesLibraryHeaderProps { ... }  // Doesn't match component
```

---

## Domain-Based Naming

Components are named based on their domain/feature:

```
Timeline Domain:
- timeline/infrastructure/Grid.tsx
- timeline/infrastructure/Track.tsx
- timeline/scenes/ScenesHeader.tsx
- timeline/scenes/SceneBlock.tsx
- timeline/moments/MomentsRenderer.tsx
- timeline/moments/MomentEditor.tsx

Library Domain:
- library/scenes/ScenesBrowser.tsx
- library/scenes/ScenesGrid.tsx
- library/scenes/SceneCard.tsx

Playback Domain:
- playback/PlaybackControls.tsx
- playback/SaveControls.tsx
```

---

## Export Patterns

### Pattern 1: Default Export (via barrel)

```typescript
// Component file
const ScenesHeader: React.FC<ScenesHeaderProps> = ({ ... }) => { ... };
export default ScenesHeader;

// Barrel export (index.ts)
export { default as ScenesHeader } from './ScenesHeader';

// Usage
import { ScenesHeader } from './scenes';
```

### Pattern 2: Named Export

```typescript
// Component file
const ScenesBrowser: React.FC<ScenesBrowserProps> = ({ ... }) => { ... };
export { ScenesBrowser };

// Barrel export (index.ts)
export { ScenesBrowser } from './ScenesBrowser';

// Usage
import { ScenesBrowser } from './library/scenes';
```

Both patterns are acceptable. The important part is **consistency within a folder**.

---

## Common Mistakes & Fixes

### Mistake 1: Export name doesn't match file

```typescript
// ❌ WRONG
// File: ScenesGrid.tsx
export default SceneGrid;

// ✅ FIX
// File: ScenesGrid.tsx
export default ScenesGrid;
```

### Mistake 2: Interface name doesn't match component

```typescript
// ❌ WRONG
interface SceneGridProps { ... }
const ScenesGrid: React.FC<SceneGridProps> = ({ ... }) => { ... };

// ✅ FIX
interface ScenesGridProps { ... }
const ScenesGrid: React.FC<ScenesGridProps> = ({ ... }) => { ... };
```

### Mistake 3: Component name doesn't match file

```typescript
// ❌ WRONG
// File: ScenesCategoryFilter.tsx
const SceneCategories: React.FC = ({ ... }) => { ... };

// ✅ FIX
// File: ScenesCategoryFilter.tsx
const ScenesCategoryFilter: React.FC = ({ ... }) => { ... };
```

---

## Verification Checklist

Before committing a new component:

- [ ] File name uses PascalCase
- [ ] Component function name matches file name exactly
- [ ] Export name matches file name exactly
- [ ] Props interface is named `{ComponentName}Props`
- [ ] Barrel export exists in parent folder's `index.ts`
- [ ] No underscores or hyphens in names (use PascalCase)

---

## ESLint Rules

The project enforces naming conventions via ESLint:

```javascript
// eslint.config.mjs
const contentBuilderNamingConfig = {
    files: ['packages/frontend/src/app/(studio)/designer/components/ContentBuilder/ui/**/*.tsx'],
    rules: {
        '@typescript-eslint/naming-convention': [
            'warn',
            {
                selector: 'variable',
                format: ['PascalCase'],
                // Enforces PascalCase for React components
            },
        ],
    },
};
```

---

## Quick Decision Tree

```
Creating a new component?
├─ Is it showing multiple items? → Use plural (ScenesGrid, MomentsRenderer)
├─ Is it showing one item? → Use singular (SceneCard, MomentEditor)
├─ Is it infrastructure? → Use descriptive name (Grid, Track, Playhead)
└─ Is it a utility? → Use {Domain}Utils pattern (colorUtils, dragDropUtils)

Naming the file?
└─ Use component name + .tsx extension

Naming the interface?
└─ Use component name + Props

Exporting?
├─ Default export: export default ComponentName;
└─ Named export: export { ComponentName };

Adding to barrel?
├─ Default: export { default as ComponentName } from './ComponentName';
└─ Named: export { ComponentName } from './ComponentName';
```

---

## Real Examples from Codebase

### Infrastructure Components
```
Grid.tsx → const Grid → export default Grid → export { default as Grid }
Track.tsx → const Track → export default Track → export { default as Track }
Playhead.tsx → const Playhead → export default Playhead → export { default as Playhead }
```

### Scene Components
```
ScenesHeader.tsx → const ScenesHeader → export default ScenesHeader
SceneBlock.tsx → const SceneBlock → export default SceneBlock
SceneCard.tsx → const SceneCard → export default SceneCard
```

### Moment Components
```
MomentsRenderer.tsx → const MomentsRenderer → export default MomentsRenderer
MomentEditor.tsx → const MomentEditor → export default MomentEditor
MomentEditorFields.tsx → const MomentEditorFields → export { MomentEditorFields }
```

---

## Summary

**Remember the Golden Rule:**

> **File Name = Component Name = Export Name**

If you follow this one rule consistently, you'll never have naming confusion again! 🎯

