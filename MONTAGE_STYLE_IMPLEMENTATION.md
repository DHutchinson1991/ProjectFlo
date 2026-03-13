# Montage Style System — Full Implementation Prompt

## Context

ProjectFlo is a monorepo with `packages/backend` (NestJS + Prisma + PostgreSQL) and `packages/frontend` (Next.js 14 + React + MUI). The film creation wizard lets users create films from service packages. Each film has scenes, and scenes are either REALTIME or MONTAGE.

### Core Paradigm: Moments-First

**Both REALTIME and MONTAGE scenes are built on moments.** The timeline renders identically for both — moments in the header, moment content in track containers, same drag/resize/click behavior. The only differences are:

1. **Visual badge:** Montage scenes show a yellow MovieFilterIcon + "Montage" label; realtime scenes show a green AccessTimeIcon.
2. **Moment durations:** Montage moments are proportionally scaled down from their original activity durations to fit the target montage duration.
3. **Metadata:** Montage scenes store a `montage_style` field indicating the intended editing approach.
4. **Active Shot (deferred):** A future "Active Shot" system will overlay beats/BPM/transition data on top of the moment-based timeline for both montage and realtime scenes. **Beats are not created at all in Phases 1–3.** The `montage_style` and `montage_bpm` fields are stored now so Active Shot can reference them when it ships — no `SceneBeat` records are written during wizard film creation.

**What this means in practice:**
- When user picks MONTAGE in the wizard, the scene still gets `SceneMoment` records (not just beats)
- The timeline shows moments for ALL scenes — montage and realtime alike
- Beats are generated in the background (stored for future Active Shot use) but invisible in the current timeline
- Combined montage merges moments from multiple activities, grouped by activity

### Design Decisions (Confirmed)

- One montage scene CAN use footage from multiple activities
- Same activity CAN appear in both a realtime scene and a montage scene
- Audio source can change per beat (not locked to one source per scene)
- Wizard UX must stay simple — one screen, no multi-step builder
- Launch with 3 styles only: RHYTHMIC, HIGHLIGHTS, SEQUENTIAL
- Enum includes all 6 values up front (no future migration needed), but only 3 get beat-generation logic and UI visibility initially
- BPM is NOT shown in the wizard — uses style defaults internally, editable later in timeline
- Default behavior: all activities marked MONTAGE merge into one combined montage scene. Checkbox to split into separate scenes per activity.
- Default montage style everywhere is HIGHLIGHTS (both per-activity and combined)
- All MONTAGE scenes get moments populated. Beat generation is entirely deferred — no `SceneBeat` records are created during wizard film creation in Phases 1–3.
- Combined montage moments are grouped by activity (Activity A moments, then Activity B moments, etc.)

### Key Data Model Constraints

- `PackageFilmSceneSchedule` has a `@@unique([package_film_id, scene_id])` constraint — one schedule record per scene per package film. A combined montage scene sourcing from multiple activities gets ONE schedule record with `package_activity_id = null`.
- Montage scenes have `SceneMoment` records for timeline rendering, plus `montage_style` / `montage_bpm` metadata on `FilmScene`. No `SceneBeat` records are written in Phases 1–3 — beats are entirely a future Active Shot concern.
- `SceneMoment.source_activity_id` (added in Phase 1A) stores which `PackageActivity` each montage moment was sourced from. Used for combined montage activity-group dividers in the Phase 3 timeline.

---

## Phase 1A — Schema Migration + Type Plumbing + Logging Cleanup

### 1. Prisma Schema Changes

**File:** `packages/backend/prisma/schema.prisma`

**Add new enum `MontageStyle`** (place near the existing `SceneType` enum around line 2722):

Values: `RHYTHMIC`, `IMPRESSIONISTIC`, `SEQUENTIAL`, `PARALLEL`, `HIGHLIGHTS`, `NARRATIVE_ARC`

All 6 defined now to avoid future migrations. Only RHYTHMIC, HIGHLIGHTS, SEQUENTIAL will be active in the UI initially.

**Add fields to `FilmScene` model** (around line 2375, after `duration_seconds`):

- `montage_style` — optional `MontageStyle`, nullable. Only meaningful when `mode = MONTAGE`.
- `montage_bpm` — optional `Int`, nullable. Written at creation time: 120 when style is RHYTHMIC, null for other styles. Persisted so the future Active Shot editor can read/edit it later.

**Add field to `SceneMoment` model** (after the existing base fields):

- `source_activity_id` — optional `Int`, nullable. No foreign key constraint. Stores the `PackageActivity.id` that this moment was sourced from. Only set when creating moments through the montage wizard path. Used to detect activity-group boundaries in the combined montage timeline (Phase 3 dividers) and available to the Active Shot system for future source tracking.

`SceneBeat` field additions (`transition_type`, `playback_speed`) are deferred to the Active Shot phase.

**Run migration:** Name it `add_montage_style_fields`.

After migration, run `npx prisma generate`.

### 2. Backend DTO Updates

**File:** `packages/backend/src/content/scenes/dto/create-scene.dto.ts`

Add two optional validated fields to `CreateSceneDto`:
- `montage_style` — optional string (validated against the enum values)
- `montage_bpm` — optional integer, minimum 40, maximum 240

**File:** `packages/backend/src/content/scenes/dto/update-scene.dto.ts`

Add the same two optional fields to `UpdateSceneDto`.

Beat DTO changes (`transition_type`, `playback_speed` on `CreateBeatDto` / `UpdateBeatDto`) are deferred to the Active Shot phase.

### 3. Backend Service Updates

**File:** `packages/backend/src/content/scenes/scenes.service.ts`

In the `create` method, pass through the new `montage_style` and `montage_bpm` fields to the Prisma create call. Cast `montage_style` to the Prisma `MontageStyle` enum type.

In `mapToResponseDto`, include the two new fields in the response.

In any `update` method, pass through the new fields.

Beat service changes (`transition_type`, `playback_speed` pass-through) are deferred to the Active Shot phase.

### 4. Frontend Type Updates

**File:** `packages/frontend/src/lib/types/domains/scenes.ts`

Add a new `MontageStyle` enum with all 6 values: RHYTHMIC, IMPRESSIONISTIC, SEQUENTIAL, PARALLEL, HIGHLIGHTS, NARRATIVE_ARC.

Add `montage_style?: MontageStyle | null` and `montage_bpm?: number | null` to the `FilmScene` interface.

Add the same two optional fields to `CreateFilmSceneDto` and `UpdateFilmSceneDto` (if they exist, otherwise add to whatever DTO is used for scene creation).

Beat type updates (`transition_type`, `playback_speed`) are deferred to the Active Shot phase.

### 5. Update `ActivitySceneConfig` Interface

**File:** `packages/frontend/src/components/schedule/film-wizard/FilmCreationWizard.tsx`

The `ActivitySceneConfig` interface (around line 92) currently has `mode` and `montageDurationSeconds`. Add:

- `montageStyle` — optional, type `MontageStyle` (imported from the types). Defaults to `HIGHLIGHTS` when initializing configs.
- `montageBpm` — optional number. Set to 120 when style is RHYTHMIC, undefined otherwise.

### 6. Pass New Fields Through Scene Creation

**File:** `packages/frontend/src/components/schedule/film-wizard/FilmCreationWizard.tsx`

In the FEATURE film creation path (around line 456), when creating a MONTAGE scene via `api.films.localScenes.create`, include the new fields from the config:
- `montage_style` from `config.montageStyle`  
- `montage_bpm` from `config.montageBpm` (should be 120 when style is RHYTHMIC, undefined otherwise)

### 7. Remove Debug Console Logs  

**File:** `packages/frontend/src/components/schedule/film-wizard/FilmCreationWizard.tsx`

Remove all `console.log` and `console.error` statements that were added for debugging the montage bug. These include lines starting with `[FilmCreationWizard]`, `[canGoNext]`, `[handleNext]`, `[handleCreate]`, `[FEATURE Film Creation]`, `[MONTAGE Scene Beat]`, `[FilmTypeChange]`.

**File:** `packages/frontend/src/components/schedule/film-wizard/steps/SceneConfigStep.tsx`

Remove all `console.log` statements (the `[SceneConfigStep]` debug logs in the useEffect, `getConfig`, and `updateConfig` functions).

---

## Phase 1B — Wizard UX + Moment-Based Montage Creation

### 1. Mode Explainer + Style Selection in SceneConfigStep

**File:** `packages/frontend/src/components/schedule/film-wizard/steps/SceneConfigStep.tsx`

**Props change:** Add `montageStyle` and `montageBpm` to what the component reads from `ActivitySceneConfig`. No new props needed since these fields are already on the config object.

#### A. Mode Explainer Text

When the user toggles between REALTIME and MONTAGE, show a brief contextual description below the toggle:

- **REALTIME selected:** Typography below the toggle: "Full timeline — each moment gets its own adjustable timeline segment." Font: 11px, color `rgba(255,255,255,0.45)`, italic.
- **MONTAGE selected:** "Highlight reel — moments are scaled to fit a shorter duration. Choose a style for editing guidance." Same styling.

This replaces the current behavior where switching modes shows zero context about what each mode means.

#### B. Activity Intelligence Hints

Always visible on each activity card — regardless of whether REALTIME or MONTAGE mode is selected. Add a subtle suggestion chip based on activity characteristics:

- Activity has ≤ 2 moments: Show a small `Chip`: "Great for montage" in soft purple (`rgba(123,97,255,0.15)` background, `rgba(123,97,255,0.7)` text). Icon: `AutoAwesomeIcon` (12px). Font: 10px.
- Activity has 10+ moments: Show: "Rich timeline — {n} moments" in soft blue (`rgba(30,136,229,0.15)` background). Icon: `ViewTimelineIcon` (12px). Font: 10px.
- Activities with 3-9 moments: No hint shown — both modes work well.

Place hints below the moment count chip, inline with existing metadata.

#### C. Style Selection Cards (replaces simple dropdown)

When an activity's mode is MONTAGE, instead of a plain `Select` dropdown, render **3 small style cards** in a horizontal row below the mode toggle:

Each card is a small clickable `Box` (approximately 120px wide × 56px tall):

- **Layout:** Icon (top-left, 16px) + Name (bold, 11px) + 1-line description (9px, muted)
- **Idle state:** `bgcolor: rgba(255,255,255,0.03)`, `border: 1px solid rgba(52,58,68,0.3)`, `borderRadius: 1`
- **Selected state:** `bgcolor: rgba(123,97,255,0.1)`, `border: 1px solid rgba(123,97,255,0.5)`, small purple dot indicator (top-right corner, 6px)
- **Hover state:** `bgcolor: rgba(123,97,255,0.06)`, slight border brighten

Card content:

| Style | Icon | Description |
|---|---|---|
| RHYTHMIC | `MusicNoteIcon` | "Even tempo-driven cuts" |
| HIGHLIGHTS | `AutoAwesomeIcon` | "Hero moments + dramatic pacing" |
| SEQUENTIAL | `ViewTimelineIcon` | "Chronological story flow" |

Default selection: HIGHLIGHTS (pre-selected on entering MONTAGE mode).

Clicking a card calls `updateConfig(activityId, { montageStyle: selectedValue })`. No BPM input shown anywhere. If RHYTHMIC is selected, BPM defaults to 120 internally (set `montageBpm: 120` in the config). If user switches away from RHYTHMIC, clear `montageBpm`.

**Full activity card layout when MONTAGE:**

```
[Scene N — Activity Name]  [5 moments • 3:20]
[Activity hint chip: "Great for montage" or "Rich timeline"]
[Mode Toggle: REALTIME | MONTAGE]
[MONTAGE explainer text: "Highlight reel — moments are scaled..."]
[Style Card] [Style Card] [Style Card]
[Duration slider ——————————————————— 60s]
```

**When combined montage is active (see section 2 below) and this activity is included in the combined montage:**
- The style cards, duration slider are HIDDEN.
- Instead show a small label: "Included in montage" in muted purple text.
- The REALTIME/MONTAGE toggle remains functional — user can flip back to REALTIME to remove from the combined montage.

### 2. Combined Montage Section

**File:** `packages/frontend/src/components/schedule/film-wizard/steps/SceneConfigStep.tsx`

Below the per-activity cards, if 2 or more activities are set to MONTAGE mode AND `combineMontage` is true, render a combined montage summary section.

#### A. Combined Section Layout

- **Header row:** "Montage Scene" with `AutoAwesomeMotionIcon` + style accent color (matching the selected style, or default purple)
- **Source activity chips:** Each montage activity name as a small `Chip` (purple scheme). Each chip shows the moment count: "Ceremony (5)", "Reception (8)", "First Dance (3)".
- **Activity proportion bar:** A thin horizontal bar (6px tall, full width, border-radius 3px) showing each activity's proportional contribution by moment count.
  - Each segment is colored from a small palette: `['#F59E0B', '#14B8A6', '#EC4899', '#8B5CF6', '#06B6D4']`
  - Each activity gets a consistent color based on array position
  - Segments are labeled on hover (Tooltip: activity name + moment count)
  - This visualizes "how much of the montage comes from each activity" at a glance
- **Shared style cards:** Same 3-card layout as the per-activity cards (RHYTHMIC, HIGHLIGHTS, SEQUENTIAL). Default HIGHLIGHTS.
- **Shared duration slider:** Initialized to sum of individual montage durations, capped at max 600 seconds. Slider range: min=10, max=600. 5-second increments.
- **Split checkbox:** "Create separate montage per activity instead" — unchecked by default.

If `combineMontage` is false (checkbox checked), the combined section collapses to just the checkbox + a brief note: "Each activity will get its own montage scene with individual settings." The individual activity cards re-show their own style cards and duration sliders.

When there's only 1 montage activity, the combined section does NOT render — that activity's inline controls suffice. That single activity still gets moments populated (2-pass proportional scaling, `source_activity_id` set). No beats created in Phases 1–3.

#### B. Smart Style Suggestion

When the combined montage section first appears (or when the set of montage activities changes), auto-select a style based on the moment pool:

- If all source activities have similar moment counts (max differs from min by ≤ 2): suggest SEQUENTIAL
- If any single moment's `duration_seconds` is ≥ 3x the average moment duration: suggest HIGHLIGHTS (one dominant moment → hero treatment works well)
- If total moment count across all activities is ≥ 15: suggest RHYTHMIC (many short beats work best at tempo)
- Default fallback: HIGHLIGHTS

Show the suggestion as a subtle label below the style cards: "Suggested based on your moments" in 10px muted text. Only visible when the auto-suggested style is still selected; disappears if user manually picks a different style.

#### C. State Management

Add new state fields to `FilmCreationWizard.tsx`:
- `combineMontage` — boolean state, default `true`
- `combinedMontageStyle` — optional MontageStyle state, default `HIGHLIGHTS`
- `combinedMontageDuration` — optional number state, initialized to sum of individual montage durations (capped at 600)

Pass these down to `SceneConfigStep` as new props: `combineMontage`, `combinedMontageStyle`, `combinedMontageDuration`, and callbacks `onCombineMontageChange`, `onCombinedStyleChange`, `onCombinedDurationChange`.

**Style inheritance on toggle:** When `combineMontage` toggles off, each individual montage activity inherits the combined style as its own `montageStyle`. When `combineMontage` toggles on, the combined style becomes the most common style among the individual activities (or HIGHLIGHTS if tied).

#### D. Creation Summary Box

At the very bottom of the SceneConfigStep (below the combined montage section and below all activity cards), render a summary box showing what will be created:

- Background: `rgba(30,136,229,0.08)`, border: `1px solid rgba(30,136,229,0.2)`, border-radius 8px, padding 12px
- Icon: `InfoOutlinedIcon` in blue
- Text examples:
  - "Will create: 3 Realtime scenes + 1 Montage scene (Highlights, 90s)"
  - "Will create: 5 Realtime scenes" (no montage activities)
  - "Will create: 1 Montage scene (Rhythmic, 120s)" (all montage, combined)
  - "Will create: 3 separate Montage scenes" (all montage, split)
- Font: 12px, color: `rgba(255,255,255,0.7)`

This gives users confidence about what the "Create" button will produce — removing the guesswork.

### 3. Update Film Creation Logic: Montage Scenes Get Moments

**File:** `packages/frontend/src/components/schedule/film-wizard/FilmCreationWizard.tsx`

In the FEATURE film creation path (around line 441), replace the current "one scene per selected activity" loop with logic that handles both modes:

**Step 1: Separate activities into two groups:**
- `realtimeActivities` — activities with config.mode === 'REALTIME'
- `montageActivities` — activities with config.mode === 'MONTAGE'

**Step 2: Create REALTIME scenes** (unchanged from current behavior):
- One scene per realtime activity with `mode: 'MOMENTS'`
- Populate moments from activity (original durations)
- Link scene to activity via schedule upsert

**Step 3: Create MONTAGE scene(s) — NOW WITH MOMENTS:**

**When `combineMontage` is true and montageActivities.length >= 2:**
1. Create ONE combined MONTAGE scene with:
   - `name`: concatenation of activity names joined by " + " if ≤ 3 activities (e.g., "Ceremony + Reception + First Dance"), otherwise just "Montage"
   - `mode: 'MONTAGE'`
   - `duration_seconds`: from `combinedMontageDuration`
   - `montage_style`: from `combinedMontageStyle`
   - `montage_bpm`: 120 if style is RHYTHMIC, undefined otherwise
   - `order_index`: after the last realtime scene
2. **Populate moments from ALL source activities, grouped by activity:**
   - For each montage activity (in order), iterate its `activity.moments[]`
   - **Proportional Scaling Algorithm (2-pass, min-3s enforcement):**
     - Let `D_source_total` = sum of `duration_seconds` across all source moments (chronological order across all montage activities for combined; single activity's moments for individual)
     - **Pass 1 — raw proportional durations:** For each moment `i`: `d_raw[i] = (d_source[i] / D_source_total) × D_target`
     - **Separate into groups:** `clamped_set` = moments where `d_raw[i] < 3`; `free_set` = the rest
     - **Pass 2 — redistribute remaining budget over `free_set`:** `D_remaining = D_target - (clamped_set.length × 3)`. For each moment `i` in `free_set`: `d_final[i] = Math.round((d_source[i] / D_free_source_total) × D_remaining)` where `D_free_source_total = sum(d_source[i] for i in free_set)`. Clamped moments get exactly 3s.
     - **Round-off fix:** `d_final[last] = D_target − sum(d_final[all except last])` — ensures total is exactly `D_target`
     - **Overflow edge case:** If `clamped_set.length × 3 > D_target` (more moments than will fit at 3s each), drop moments from the end until `count × 3 ≤ D_target`, log a `console.warn`, then apply the algorithm to the trimmed list
   - Create each moment via `api.moments.create(scene.id, { name, duration, order_index, source_activity_id })` — **always set `source_activity_id` to the originating `PackageActivity.id`** on every montage moment. This is required for Phase 3 activity-group dividers.
   - Activities with 0 moments still contribute 1 synthetic moment: `name = activity.name`, `duration = proportional share of D_target (minimum 3s)`, `source_activity_id = activity.id`
3. Create ONE schedule upsert linking the combined scene to the package film, with `package_activity_id: null`

**When `combineMontage` is false OR montageActivities.length === 1:**
- One scene per montage activity, each with `mode: 'MONTAGE'`, `montage_style`, `duration_seconds`, `montage_bpm`
- **Populate moments from that activity's moments, scaled to the montage duration:**
  - Apply the same 2-pass proportional scaling algorithm described above, with `D_target = montageDuration` and `D_source_total` from this activity's moments only
  - Set `source_activity_id = activity.id` on every created moment
  - Activities with 0 moments get 1 synthetic moment with `source_activity_id = activity.id`
- One schedule upsert per scene linking to its activity

**Remove entirely:** The existing single-beat creation block (the try/catch around `api.beats.create` at approximately line 495). Montage scenes now only create moments — no beats.

> **Beat generation deferred to Active Shot:** The `generateMontageBeats` backend endpoint, all beat generation algorithms (RHYTHMIC / HIGHLIGHTS / SEQUENTIAL and advanced styles), and the `api.beats.generateMontage` frontend method are moved to the "Future: Active Shot System" section at the bottom of this document. No `SceneBeat` records are created during wizard film creation.

### 4. Fix Timeline: Montage Scenes Render Moments Not Beats

This is the critical change that makes montage scenes look identical to realtime in the timeline.

#### A. Update `enrichScenesWithBeats`

**File:** `packages/frontend/src/hooks/films/enrichScenesWithBeats.ts`

The current enrichment logic sends montage scenes down the beats path (empty moments, populated beats). Change this so montage scenes with moments use the moments path:

In the enrichment output (around line 95):
- Change `moments: isMomentsScene ? momentsList : []` → `moments: (isMomentsScene || isMontageScene) ? momentsList : []`
- Keep beats populated for both types (they'll be used by future Active Shot): `beats: beatsList` (always pass through, regardless of scene type)

In the type inference logic: When a scene has BOTH moments and beats (which montage scenes now will), moments take priority for rendering. The `isMontageScene` flag should NOT override the moments path.

Also pass through `montage_style` and `montage_bpm` from the raw scene data to the enriched output object.

#### B. Update `SceneGroupHeader` isMontage Detection

**File:** `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/scenes/SceneGroupHeader.tsx`

The current `isMontageScene` detection (lines 110-122) treats any scene with beats or without moments as montage, causing it to render `BeatsHeader`. Change this:

The detection should check `scene_template_type` or `scene_mode` for the explicit MONTAGE flag, but the **rendering path** should always be `MomentsHeader` when moments exist:

```
// Detection for visual badge (icon + label)
const isMontageScene = primaryScene?.scene_template_type === "MONTAGE"
    || primaryScene?.scene_mode === "MONTAGE";

// Rendering decision: always prefer moments when they exist
const useMomentsView = hasMoments;
const useBeatsView = !hasMoments && hasBeats;
```

Rendering dispatch (lines 280-295):
- When `useMomentsView`: render `<MomentsHeader>` (same as realtime)
- When `useBeatsView`: render `<BeatsHeader>` (fallback for legacy montage scenes without moments)
- The montage badge (yellow MovieFilterIcon + "Montage" text) still renders based on `isMontageScene` — it's a visual indicator, not a rendering path selector

#### C. Update `SceneBlock` isMontage Detection

**File:** `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/scenes/SceneBlock.tsx`

Same change as SceneGroupHeader. The block rendering dispatch (lines 386-422) should use the same logic:

```
const useMomentsView = hasMoments;
const useBeatsView = !hasMoments && hasBeats;
```

- When `useMomentsView && !isMontageScene`: render `<MomentsContainer>` (realtime)
- When `useMomentsView && isMontageScene`: render `<MomentsContainer>` (montage — same component, identical rendering)
- When `useBeatsView && !isMusicTrack`: render `<BeatsContainer>` (legacy fallback)

This means montage scenes with moments render through `MomentsContainer` — identical to realtime. The only visual difference is the scene header badge.

### 5. Wizard UX Polish

#### A. Step Description Context

**File:** `packages/frontend/src/components/schedule/film-wizard/steps/SceneConfigStep.tsx`

Update the header description (currently generic) to be mode-aware and instructional:

- Replace the current description text with: "Choose **Realtime** for full moment-by-moment coverage, or **Montage** for a condensed highlight reel. You can mix both modes across activities."
- Render in 12px, `rgba(255,255,255,0.5)`, with bold text using `<strong>` for the mode names.

#### B. Empty State for Zero Activities

If no activities were selected (edge case — user navigated back and deselected), show an empty state instead of an empty card list:

- Icon: `MovieFilterIcon` (48px, `rgba(255,255,255,0.15)`)
- Text: "Select activities in the previous step to configure scenes."
- Font: 13px, `rgba(255,255,255,0.4)`, centered

#### C. Duration Slider Refinement

The current slider uses 5-second increments with `valueLabelFormat: formatDuration`. Improve:

- Add MUI `marks` at common durations: 30s, 60s, 120s, 300s (shows small tick marks on the slider track)
- Show the currently selected value as a persistent small `Typography` to the right of the slider (not just on hover tooltip)
- For montage durations ≤ 30s, show a warning `Chip` below: "Very short — moments will be heavily compressed" in amber (`rgba(245,158,11,0.2)` background)
- For montage durations ≥ 300s, show a note: "Long montage — consider splitting into separate scenes" in muted blue

#### D. Total Duration Summary Enhancement

The existing blue info box at the bottom of SceneConfigStep shows total duration. Enhance it to break down by mode:

- "Total: 8m 30s — 6m 10s Realtime (4 scenes) + 2m 20s Montage (1 scene)"
- Use inline color coding: blue text for Realtime portion, purple text for Montage portion
- If no montage activities exist, just show: "Total: 6m 10s — 4 Realtime scenes"
- If no realtime activities exist, just show: "Total: 2m 20s — 1 Montage scene"

### 6. Update `ActivitySceneConfig` Interface

**File:** `packages/frontend/src/components/schedule/film-wizard/FilmCreationWizard.tsx`

The `ActivitySceneConfig` interface (around line 92) currently has `mode` and `montageDurationSeconds`. Add:

- `montageStyle` — optional, type `MontageStyle` (imported from the types). Defaults to `HIGHLIGHTS` when initializing configs.
- `montageBpm` — optional number. Set to 120 when style is RHYTHMIC, undefined otherwise.

### 7. Pass New Fields Through Scene Creation

**File:** `packages/frontend/src/components/schedule/film-wizard/FilmCreationWizard.tsx`

In the FEATURE film creation path, when creating a MONTAGE scene via `api.films.localScenes.create`, include the new fields from the config:
- `montage_style` from `config.montageStyle`
- `montage_bpm` from `config.montageBpm` (should be 120 when style is RHYTHMIC, undefined otherwise)

### 8. Remove Debug Console Logs

**File:** `packages/frontend/src/components/schedule/film-wizard/FilmCreationWizard.tsx`

Remove all `console.log` and `console.error` statements that were added for debugging the montage bug. These include lines starting with `[FilmCreationWizard]`, `[canGoNext]`, `[handleNext]`, `[handleCreate]`, `[FEATURE Film Creation]`, `[MONTAGE Scene Beat]`, `[FilmTypeChange]`.

**File:** `packages/frontend/src/components/schedule/film-wizard/steps/SceneConfigStep.tsx`

Remove all `console.log` statements (the `[SceneConfigStep]` debug logs in the useEffect, `getConfig`, and `updateConfig` functions).

---

## Phase 2 — Add Remaining Montage Styles (Backend Only)

No schema changes needed — the `MontageStyle` enum already includes all 6 values. This phase adds beat-generation algorithms for 3 new styles. Since beats are stored for future Active Shot but not rendered in the timeline, this is purely backend work + wizard UI expansion.

### 1. Show All 6 Styles in the Wizard

**File:** `packages/frontend/src/components/schedule/film-wizard/steps/SceneConfigStep.tsx`

Update the style selection cards from 3 to 6. The existing row of 3 cards becomes two rows of 3, or a responsive grid (3 columns on wide viewports, 2 on narrow).

Add a subtle group label above each row:
- Row 1: "Core Styles" (10px, muted, uppercase)
- Row 2: "Advanced Styles" (10px, muted, uppercase)

New card content:

| Style | Icon | Description |
|---|---|---|
| RHYTHMIC | `MusicNoteIcon` | "Even tempo-driven cuts" |
| HIGHLIGHTS | `AutoAwesomeIcon` | "Hero moments + dramatic pacing" |
| SEQUENTIAL | `ViewTimelineIcon` | "Chronological story flow" |
| PARALLEL | `SwapHorizIcon` | "Cross-cut between activities" |
| IMPRESSIONISTIC | `BlurOnIcon` | "Dreamy, emotional montage" |
| NARRATIVE_ARC | `ShowChartIcon` | "Story arc: setup → climax → resolution" |

The PARALLEL card should only be selectable when 2+ source activities are available (in combined montage, this is always true; for individual activities, PARALLEL is disabled with a tooltip: "Requires multiple activities").

> **Beat generation algorithms deferred to Active Shot:** The PARALLEL, IMPRESSIONISTIC, and NARRATIVE_ARC beat generation algorithms are part of the Active Shot specification. See "Future: Active Shot System" at the bottom of this document.

### 2. Extend Smart Style Suggestion

**File:** `packages/frontend/src/components/schedule/film-wizard/steps/SceneConfigStep.tsx`

Extend the combined montage smart suggestion logic:

- If 3+ source activities with balanced moment counts (max − min ≤ 2): suggest PARALLEL
- If source moments are heavily weighted toward one large-duration moment (any moment ≥ 3x average): suggest NARRATIVE_ARC
- Keep existing rules for SEQUENTIAL, HIGHLIGHTS, RHYTHMIC as fallbacks

---

## Phase 3 — Montage Scene Visual Differentiation in Timeline

Since montage scenes now render moments identically to realtime, this phase adds subtle visual cues so users can distinguish montage scenes at a glance. No beat rendering — just scene-level badges and styling.

### 1. Scene Header Montage Badge

**File:** `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/scenes/SceneGroupHeader.tsx`

The current behavior already shows a yellow `MovieFilterIcon` for montage scenes. Enhance with:

- **Style name label:** When `primaryScene.montage_style` exists, show a small text label after the icon: "Rhythmic", "Highlights", "Sequential", etc.
  - Font: 9px, weight 700, uppercase, letter-spacing 0.5px
  - Color: `#FFB020` (same as montage icon color)
  - Only render when `montage_style` is truthy

- **Source count badge:** For combined montage scenes (those with moments from multiple activities), show a small count after the style name: "· 3 activities"
  - Detect by counting unique `source_activity_id` values on the scene's beats (if available) or by checking if the scene name contains " + "
  - Font: 9px, weight 500, color: `rgba(255,255,255,0.4)`

### 2. Combined Montage Activity Group Dividers

**File:** `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/moments/MomentsHeader.tsx`

For montage scenes with moments from multiple activities (combined montage), add subtle visual separators between activity groups in the moment header:

- Detect activity boundaries: If the scene has schedule data or if moments have metadata indicating source activity, insert a thin visual divider between activity groups.
- **Divider styling:** 2px wide, color `rgba(255,255,255,0.15)`, full height of the header, positioned between the last moment of one activity and the first moment of the next.
- **Activity label:** Above each group, show a tiny label: activity name in 8px, `rgba(255,255,255,0.3)`, truncated to fit.

If activity grouping information is not available on the moments (since `SceneMoment` doesn't have a `source_activity_id` field), this can be deferred until Phase 1A adds that field. For now, if the information isn't available, skip the dividers — the moments still render correctly without them.

**Alternative approach if source tracking is needed:** Add an optional `source_activity_id` field to `SceneMoment` in the Prisma schema during Phase 1A. When creating moments for montage scenes, set this field to the originating activity's ID. This would enable the MomentsHeader to detect activity boundaries.

### 3. Montage Duration Indicator

**File:** `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/scenes/SceneGroupHeader.tsx`

For montage scenes, show a small duration badge in the scene header actions area:

- Display: "{duration}s" (e.g., "90s") in a small pill
- Styling: 8px, monospace, `rgba(255,176,32,0.15)` background, `rgba(255,176,32,0.7)` text, border-radius 4px, padding 1px 6px
- Only show for montage scenes (realtime scene duration is implicit from moments)

This helps users quickly see how long the condensed montage is.

---

## Future: Active Shot System (Deferred)

Nothing in Phases 1–3 creates `SceneBeat` records. The Active Shot phase will introduce beat creation alongside a dedicated editing UI. The full beat generation spec that was previously in Phases 1B and 2 lives here.

### Beat Generation Backend

Build `POST /beats/scenes/:sceneId/generate-montage` (controller: `beats.controller.ts`) with `@UseGuards(JwtAuthGuard)`.

**DTO** (`generate-montage-beats.dto.ts`):
- `source_activity_ids` — `@IsArray()`, `@IsInt({ each: true })`, `@ArrayMinSize(1)`
- `style` — `@IsString()`, `@IsNotEmpty()`
- `target_duration_seconds` — `@IsInt()`, `@Min(5)`
- `bpm` — `@IsOptional()`, `@IsInt()`, `@Min(40)`, `@Max(240)`

**Service method** `generateMontageBeats(sceneId, dto)` in `beats.service.ts`:
1. Validate scene exists and `mode === 'MONTAGE'`. Throw `NotFoundException` / `BadRequestException` accordingly.
2. **Edit-marker guard:** Check if any existing beat on the scene has `is_edit_marker = true` (a future field indicating the beat was manually placed as an edit point, not auto-generated). If any exist, throw `409 ConflictException`: "Cannot regenerate — scene has manual edit markers. Remove them first."
3. Fetch `PackageActivityMoment` records for `source_activity_ids`, ordered by `PackageActivity.start_time` asc then `order_index` asc. Include parent activity for `source_activity_id`.
4. `prisma.$transaction()`: delete existing `SceneBeat` records → bulk-create new beats.
5. Return beats mapped through `mapToResponseDto`.

**Fallback for zero-moment activities:** Synthesize 1 virtual moment: `name = activity.name`, `duration_seconds = 60`, `source_moment_id = null`.

**Beat generation rules** (all styles must produce beats summing exactly to `target_duration_seconds`):

- **RHYTHMIC:** `beatDuration = (60 / bpm) × 4` (bar-length beats). `N = Math.round(target / beatDuration)`, min 2. Source assigned round-robin. Transition: "cut". Speed: 1.0.
- **HIGHLIGHTS:** Sort moments desc by `duration_seconds`. Select top `N = min(count, ceil(target/6))`, min 3. Hero beats (top 30%, min 1): 60% of total time, transition "dissolve", speed 0.8. Rest: 40%, "cut", 1.0. Re-order chronologically after assigning durations.
- **SEQUENTIAL:** All moments chronologically. Apply the same 2-pass min-3s scaling algorithm (see Phase 1B §3). Transition: "cut". Speed: 1.0.
- **PARALLEL:** Group moments by activity. Interleave round-robin: A1, B1, A2, B2… Transition: "dissolve" on activity change, "cut" within same activity. Degrades to SEQUENTIAL for a single source activity.
- **IMPRESSIONISTIC:** Seeded LCG shuffle (`seed = sceneId`). `N = ceil(target/3)`, min 4. Duration multipliers: seeded random ×0.5–1.5, normalized, clamped 1.5–8s, re-normalized. Transitions: 70% dissolve / 20% fade / 10% cut (seeded). Speeds from weighted set `[0.5, 0.7, 0.8, 1.0, 1.0, 1.0, 1.2]` (seeded).
- **NARRATIVE_ARC:** Divide chronological moments by count into Setup 20% / Build 30% / Climax 20% / Resolution 30%. Duration budget: 15% / 30% / 25% / 30%. Boundary transitions: dissolve (Setup→Build, Build→Climax), fade (Climax→Resolution). Climax beats: 0.7x, dissolve. Resolution: 0.85x, dissolve.

Also add `transition_type?: string | null` and `playback_speed?: number | null` to `SceneBeat` in schema + DTOs + frontend types when this phase ships.

**Frontend:** Add `beats.generateMontage(sceneId, data)` to `api.ts` → `POST /beats/scenes/${sceneId}/generate-montage`. The wizard can optionally call this in a background try/catch after scene + moment creation — failure must not block film creation.

### Planned Active Shot UI Features
- **Beat overlay on timeline:** An "Active Shot" toggle that shows beat divisions overlaid on the moment-based timeline — for both montage AND realtime scenes
- **BPM control:** Editable BPM for RHYTHMIC style, visible in the scene header
- **Beat editor panel:** Slide-out panel for editing individual beat properties (duration, transition, speed)
- **Beat resize by drag:** Drag edges to redistribute beat duration
- **Transition indicators:** Visual hints between beats showing dissolve, fade, whip_pan
- **Speed badges:** Playback speed indicators on beats
- **Source activity indicator row:** Colored bars showing which activity each beat comes from
- **Keyboard shortcuts:** Quick-access keys for beat editing

These features will build on the existing beat data and the moment-based timeline foundation established in Phases 1-3.

---

## File Change Summary

### Backend Files Modified
| File | Changes |
|---|---|
| `prisma/schema.prisma` | Add `MontageStyle` enum, 2 fields on `FilmScene`, 1 field on `SceneMoment` (`source_activity_id`) |
| `src/content/scenes/dto/create-scene.dto.ts` | Add `montage_style`, `montage_bpm` |
| `src/content/scenes/dto/update-scene.dto.ts` | Add `montage_style`, `montage_bpm` |
| `src/content/scenes/scenes.service.ts` | Pass through new fields in create/update/response |

> Beat-related backend changes (`beats.service.ts` `generateMontageBeats` method, `beats.controller.ts` endpoint, beat DTOs with `transition_type`/`playback_speed`, `generate-montage-beats.dto.ts`) are deferred to the Active Shot phase. No new backend beat files created in Phases 1–3.

### Frontend Files Modified

**Phase 1A (Schema):**

| File | Changes |
|---|---|
| `src/lib/types/domains/scenes.ts` | Add `MontageStyle` enum (6 values), 2 fields on `FilmScene` interface and DTOs |

> `src/lib/types/domains/beats.ts` beat field additions (`transition_type`, `playback_speed`) are deferred to the Active Shot phase.

**Phase 1B (Wizard + Moment-Based Montage + Timeline Fix):**

| File | Changes |
|---|---|
| `src/components/schedule/film-wizard/FilmCreationWizard.tsx` | Add combined montage state, **create SceneMoments for montage scenes** (2-pass proportional scaling, min-3s, `source_activity_id` on every moment), remove ALL debug console.logs, update `ActivitySceneConfig` interface |
| `src/components/schedule/film-wizard/steps/SceneConfigStep.tsx` | Mode explainer text, activity intelligence hints, style selection cards (3), combined montage with proportion bar + smart suggestions + creation summary, "Included in montage" label, duration slider refinements, remove ALL debug console.logs |
| `src/hooks/films/enrichScenesWithBeats.ts` | **Critical fix:** Montage scenes with moments now use moments path (not beats path). Pass through `montage_style`, `montage_bpm` in enriched output |
| `src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/scenes/SceneGroupHeader.tsx` | **Critical fix:** Montage scenes with moments render `MomentsHeader` (not `BeatsHeader`). Montage badge remains visual-only |
| `src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/scenes/SceneBlock.tsx` | **Critical fix:** Montage scenes with moments render `MomentsContainer` (not `BeatsContainer`) |

**Phase 2 (Remaining Styles — Wizard Expansion):**

| File | Changes |
|---|---|
| `src/components/schedule/film-wizard/steps/SceneConfigStep.tsx` | Expand style cards from 3 to 6 (2 rows), update smart suggestion for new styles |

**Phase 3 (Visual Differentiation):**

| File | Changes |
|---|---|
| `src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/scenes/SceneGroupHeader.tsx` | Style name badge after montage icon, source count badge for combined, duration indicator pill |
| `src/app/(studio)/designer/components/ContentBuilder/ui/panels/timeline/moments/MomentsHeader.tsx` | Activity group dividers for combined montage scenes (if source_activity_id available on moments) |

### Frontend Files Created
None. All changes are modifications to existing files.

### Migration
| Action | Command |
|---|---|
| Create migration | `npx prisma migrate dev --name add_montage_style_fields` |
| Generate client | `npx prisma generate` |

---

## Edge Cases & Behavior Reference

| Scenario | Expected Behavior |
|---|---|
| 1 activity set to MONTAGE | No combined section shown. Inline style dropdown + duration slider. Creates moments (2-pass proportional scaling, min-3s). No beats created in Phases 1–3. |
| 2+ activities MONTAGE, combine ON | Combined section shown. Individual cards show "Included in montage". One scene created with moments grouped by activity. Schedule upsert has `package_activity_id: null`. |
| 2+ activities MONTAGE, combine OFF | No combined section. Each activity gets its own montage scene with its own moments. No beats created. |
| ALL activities set to MONTAGE | Valid. Zero realtime scenes. No warning. Combined montage (or split montages) created with moments. |
| User flips activity back to REALTIME while in combined montage | Activity drops out of combined montage. If only 1 montage activity remains, combined section disappears and that activity gets inline controls. |
| Activity has zero PackageActivityMoments | Virtual moment synthesized: `name = activity.name`, `duration = 60s`, `source_moment_id = null`. At least 1 moment created in scene. |
| Montage scene has moments (Phases 1–3) | Timeline renders moments. No `SceneBeat` records created. When Active Shot ships it will add beats on top of the moment foundation. |
| Montage scene has beats but NO moments (legacy data) | Falls back to beats path in enrichScenesWithBeats — backwards compatible. |
| Scene name for combined montage (≤ 3 activities) | "Ceremony + Reception + First Dance" |
| Scene name for combined montage (4+ activities) | "Montage" |
| `combinedMontageDuration` initialization | Sum of individual montage durations, capped at 600s. Slider range: 10–600. |
| Moment scaling minimum | Each moment gets at least 3 seconds in montage. If too many moments for the target duration, excess moments are dropped (keep first N that fit). |
| Combined montage moment ordering | Moments grouped by activity (Activity A moments first, then Activity B, etc.), each group maintains internal order. |

---

## Testing Checklist

After implementation, verify:

### Phase 1A (Schema + Migration)
1. Migration runs cleanly with no errors
2. Existing REALTIME scenes are unaffected (no regressions)
3. `montage_style` and `montage_bpm` fields on `FilmScene` accept correct enum values / numbers
4. `source_activity_id` on `SceneMoment` accepts integer values and `null` (no FK constraint violation)
5. `npx prisma generate` produces matching client types

### Phase 1B (Wizard + Moment-Based Montage + Timeline Fix)

**Wizard UX:**
6. Mode explainer text appears below toggle: "Full timeline..." for REALTIME, "Highlight reel..." for MONTAGE
7. Activity intelligence hints appear on ALL activity cards regardless of mode: ≤2 moments shows "Great for montage" chip, 10+ moments shows "Rich timeline" chip, 3–9 moments shows nothing
8. Style selection cards (3 visual cards) appear when mode is MONTAGE, default to HIGHLIGHTS
9. Combined montage section appears when 2+ activities set MONTAGE: shows activity chips, proportion bar, shared style cards, shared duration slider
10. Smart style suggestion auto-selects based on moment pool characteristics
11. Creation summary box at bottom accurately describes what will be created

**Moment Creation for Montage Scenes:**
12. Creating a MONTAGE scene produces SceneMoments
13. Moment durations pass the 2-pass proportional scaling algorithm: proportional to source durations, minimum 3s each, total sums exactly to target duration
14. Single-activity montage: moments in same order as PackageActivityMoments; `source_activity_id` set on each moment
15. Combined montage: moments grouped by activity (all Activity A moments, then Activity B, etc.); `source_activity_id` set on every moment
16. Creating with 3+ activities where 2 are MONTAGE: combined scene has moments from both activities; schedule record has `package_activity_id: null`
17. Unchecking "Create separate montage per activity instead" creates individual montage scenes with their own moments
18. Activities with 0 moments still create scene (1 synthetic moment with `source_activity_id = activity.id`)
19. Overflow edge case: if target duration cannot fit all moments at 3s each, excess moments dropped from end with `console.warn` logged

**Timeline Rendering Fix (Critical):**
20. Montage scenes with moments render `MomentsHeader` (not `BeatsHeader`) in the timeline
21. Montage scenes with moments render `MomentsContainer` (not `BeatsContainer`) in the timeline
22. Montage scenes still show yellow `MovieFilterIcon` badge in scene header (visual-only)
23. Realtime scenes are completely unaffected by timeline changes
24. Legacy montage scenes (beats but no moments) still fall back to beats rendering path
25. `enrichScenesWithBeats` correctly passes through `montage_style` and `montage_bpm`

**Cleanup:**
26. All debug `console.log` statements removed from FilmCreationWizard.tsx and SceneConfigStep.tsx
27. Duration slider shows tick marks at 30s/60s/120s/300s, short/long warnings display correctly
28. Total duration summary breaks down Realtime vs Montage with color coding
29. Empty state renders when no activities are selected

### Phase 2 (Remaining Styles — Wizard Expansion)
30. Style selection cards expand to 6 (2 rows: Core + Advanced) with correct icons and descriptions
31. PARALLEL card is disabled for individual (single-activity) montage scenes with tooltip explanation
32. Smart style suggestion extended for PARALLEL (3+ balanced activities) and NARRATIVE_ARC (dominant moment)

### Phase 3 (Visual Differentiation)
33. Style name badge ("Rhythmic", "Highlights", etc.) appears next to the montage icon in the scene header
34. Combined montage scenes show source count badge ("· 3 activities") after the style name
35. Montage duration indicator pill ("90s") appears in scene header for montage scenes
36. Activity group dividers appear in MomentsHeader for combined montage scenes (`source_activity_id` used to detect group boundaries)
37. All visual changes fall back gracefully when `montage_style` is null/undefined (no visual regressions)
