# Package Setup Journey — Walkthrough Findings

## Phase 1 — Services Hub (`/packages`)

### What Loaded
- Page title: **Services** with subtitle "Manage the services your brand offers and configure your package sets."
- Two enabled service types: **Weddings** (💒) and **Birthdays** (🎂), each with emoji, description, "Enabled" badge, and "Disable" button.
- **Birthday Packages** section: 4 tier slots (Budget, Basic, Standard, Premium). 1 of 4 filled (Standard → "The Birthday Package" at £688.80). Budget/Basic/Premium are empty with "Click to browse your package library" CTA. An "Add Slot" affordance shows 4/5.
- **Wedding Packages** section: 1 tier slot (Budget) filled with "Wedding Package" at £761.38. Shows 1 of 1 slots filled, with Add Slot showing 1/5.
- Footer note: "7 packages in your library".
- **Console: 0 errors, 0 warnings.**

### UX Critique

**Positives:**
- The page is well-structured — services at the top, package sets below, clear visual hierarchy.
- Filled tier slots show rich preview cards with price, description, event-day/crew/camera/audio/location stats, and linked films. Very informative at a glance.
- Empty slots are clearly actionable ("Click to browse your package library" with a + icon).
- The tier naming (Budget → Basic → Standard → Premium) follows a natural price-progression convention.
- Emoji identifiers for service types add personality and quick scanning.
- "Open Package →" link on filled cards is a clear navigation path.

**Issues:**

| # | Issue | Suggestion | Impact |
|---|-------|------------|--------|
| 1 | No onboarding guidance for first-time users | Add an empty state illustration/tutorial when no services are enabled or no packages exist. A user landing here for the first time has no idea what "Services" or "Package Sets" mean in this context. | Medium |
| 2 | "Package Set" terminology is never explained | The heading says "Birthday Packages" / "Wedding Packages" but the concept of a "Package Set" (the tier grid) vs a "Package" (individual offering) is not clarified. Add a tooltip or info icon explaining: "A Package Set groups your offerings into tiers (Budget → Premium) for a specific service type." | Medium |
| 3 | The "Services Offered" section and the Package Sets below feel visually disconnected | There's no clear visual link between enabling "Weddings" in the top section and the "Wedding Packages" set appearing below. Consider a subtle connecting line or grouping them under foldable sections per service type. | Low |
| 4 | The Birthday Package in Standard shows 0 Crew, 0 Cameras, 0 Audio — this looks like incomplete setup but there's no warning | Surface a yellow "incomplete" badge or warning icon on packages that have 0 crew or 0 equipment, since a production package with no crew is likely a configuration error. | Medium |
| 5 | "Add Slot" placement is inconsistent — for Birthdays it appears as a distinct card at the end of the row; for Weddings it's similar but the grid row doesn't scroll horizontally in an obvious way | Ensure horizontal scroll indicators or a carousel pattern when slots exceed the viewport width. On narrower viewports, slots may overflow without obvious scrollability. | Low |
| 6 | "7 packages in your library" at the bottom is easy to miss | Move this to the top near the "Add Service" button, or make it a link to `/packages/list` for quicker access. | Low |
| 7 | No indication of which tier a new user should configure first | Consider a "Recommended: start with Standard" hint or a guided setup flow for the first package set. | Low |

### Design Observations
- Dark theme is consistent with the rest of the app.
- Tier slot cards use distinct colored headers (Budget = orange dashed, Standard = gold solid, Premium = purple dashed) — good visual language.
- The "Enabled" badge is green which works, but the "Disable" text button beside it has no confirmation dialog (from snapshot alone — should verify).
- The page requires scrolling to see both service types' package sets — Wedding Packages are below the fold.

---

## Phase 2 — Package Library (`/packages/list`)

### What Loaded
- Title: **All Packages** — subtitle "7 packages in library".
- Table with columns: Name, Category, Price, Active, In Set, Created, and a delete action column.
- 7 packages listed (1 Birthday, 6 Wedding). All show green "Active" checkmarks.
- "In Set" column: only 2 packages are assigned to a tier slot ("The Birthday Package" → 🎂 Standard, "Wedding Package" → 💒 Budget). The other 5 show "—".
- Search box works correctly — filtering "Birthday" returns 1 result instantly, matching against name.
- All columns have sort buttons (with arrow icons).
- **Console: 0 errors.**

### UX Critique

**Positives:**
- Clean, scannable table layout. Each row shows name + description, category badge (with emoji), price with tax note, active status, tier assignment, and creation date.
- Search is instant and responsive — no loading state needed.
- Sort controls per column are well-placed.
- The "In Set" pill (e.g., "🎂 Standard") with a tooltip ("Standard slot in Birthday Packages") is informative — you can immediately see where a package is being used.
- Row-level cursor pointer indicates clickability — rows link to the detail editor.
- Delete button per row (trash icon) is present but appropriately low-key.

**Issues:**

| # | Issue | Suggestion | Impact |
|---|-------|------------|--------|
| 1 | No "Create New Package" button on this page | The user has to know to go to `/packages/new` or use the sidebar. Add a prominent "New Package" CTA button in the header area next to "All Packages". | High |
| 2 | Subtitle says "7 packages in library" but doesn't update when search filters results | Show "1 of 7 packages" when filtered, so the user knows the filter is active. | Medium |
| 3 | The "Active" column shows a green check for all packages — there's no way to deactivate a package from this list | Either add a toggle action or link to the detail page where status can be changed. If all packages are always active, remove the column. | Low |
| 4 | No bulk actions (multi-select, batch delete, batch assign to set) | Not critical now at 7 packages, but will be needed as the library grows. | Low |
| 5 | Description text in the Name cell is truncated with ellipsis — good for scannability, but there's no tooltip/hover preview | Add a title attribute or hover-expand for the full description. | Low |
| 6 | Category filter is missing — can only search by text, not filter by event type | Add a dropdown/chip filter for category (Wedding, Birthday, etc.) alongside the search box. | Medium |
| 7 | Delete has no inline confirmation visible from the snapshot — assume it uses a confirmation dialog, but should verify | Ensure the delete action has a confirmation dialog to prevent accidental deletion. | Medium |

### Design Observations
- Consistent dark theme with the Services Hub.
- The sidebar navigation correctly highlights "All Packages" within the Packages group.
- No pagination — works fine for 7 items, but will need pagination or virtual scrolling at scale.
- No empty state to evaluate (since packages exist), but would be worth testing.

---

## Phase 3 — Create a New Package (`/packages/new`)

### Wizard Overview
The wizard is a **9-step dialog** overlaid on the page. Steps:
1. **Event** — select event type (Wedding or Birthday)
2. **Days** — choose which event days to include (multi-select, shows activity/moment counts per day)
3. **Activities** — per-day activity list with start times, durations, moment counts; Select All/None controls
4. **Subjects** — who's involved (Bride, Groom, etc.) with Core/Group tags; All/None controls
5. **Locations** — simple 1-5 count picker
6. **Name** — text input, pre-populated with event type
7. **Crew** — checkbox list of available crew members
8. **Equipment** — camera and audio slot setup with dropdowns
9. **Review** — summary of all choices with "Create Package" button

### Step-by-Step Critique

**Step 1 (Event):**
- Clean, clear. Two cards with emoji, description, and day count.
- The "7 days" / "1 day" label under each event type is helpful context.
- No issues.

**Step 2 (Days):**
- Well-presented multi-select cards with activity/moment counts per day.
- "Next" button correctly disabled until at least one day is selected.
- Good use of progressive disclosure — selecting days determines what shows in Step 3.
- Minor: no "Select all" / "None" buttons here, unlike Steps 3 and 4. Would help for complex event types.

**Step 3 (Activities):**
- Most content-dense step. Activities are pre-populated from the event type template — excellent.
- Each activity shows: name, start time, duration, moment count, expandable details.
- "Select All" / "None" at the top, plus "Add Activity" per day — good flexibility.
- "18/18" counter at the top gives clear feedback on how many are selected.
- Minor: time inputs are editable inline which is powerful but could benefit from a visual timeline preview.

**Step 4 (Subjects):**
- 17 subjects with Core/Group role labels. All pre-selected from template.
- "All" / "None" toggle. Clean layout.
- Minor: "Birthday Person" appears in a Wedding package's subjects — this seems like a data issue (subjects should be filtered by event type).

**Step 5 (Locations):**
- Very simple — just 1-5 icons. Clean and no complaints.
- Minor: no default selection shown initially (might confuse users — what if they press Next without picking?).

**Step 6 (Name):**
- Pre-fills "Wedding Package" — good. Placeholder shows "e.g., Premium Wedding Package".
- Helper text: "This name will be visible to your clients. You can change it later." — reassuring.
- No validation errors visible (would need to test empty name).

**Step 7 (Crew):**
- **Major UX gap.** Only shows checkboxes + names. No role selection is visible.
- The subtitle says "Select crew and choose the role they'll fill on this project" but there are no role dropdowns.
- There are only 3 crew members — no search/filter for larger rosters.
- Missing: crew member skill info, rate info, or any detail beyond the name and avatar initial.
- **Clicking a crew member doesn't seem to expand a role picker** — the UI matches the subtitle's promise poorly.

**Step 8 (Equipment):**
- Shows 1 camera slot by default with "Select camera..." dropdown and crew assignment ("No crew yet" since none were selected).
- Audio section starts at 0 slots with "Add Audio" button.
- Good: "Add Camera" and "Add Audio" buttons for adding slots.
- Issue: Camera slot auto-created at 1 — should this default to 0 and let the user decide?

**Step 9 (Review):**
- Excellent summary — stats (2 Days, 18 Activities, 65 Moments, etc.), full activity breakdown per day with times/durations/moments, subjects list with role tags, location slots.
- "Create Package" button prominently placed at bottom-right.
- **Issue:** After clicking "Create Package", observed a brief flash where the wizard appeared to reset to Step 1 before the URL navigated to `/packages/8`. This is a **race condition** — the wizard resets its state before the navigation completes. Users might think the creation failed and try again, creating duplicates.

### Package Created Successfully
- Redirected to `/packages/8` — "The Walkthrough Test Package"
- Price auto-calculated: Crew £1,389.00 + Equipment £0.00 + Tax £69.45 = **£1,458.45**
- All activities, subjects, locations copied from wizard selections.
- **Console: 0 errors.**

### Issues Summary

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | Crew step promises role selection but doesn't deliver it | Major | Step 7 |
| 2 | "Birthday Person" appears in Wedding package subjects | Minor | Step 4 |
| 3 | Wizard briefly flashes Step 1 after create before navigating | Minor (confusing) | Step 9 |
| 4 | No back-navigation breadcrumbs or step indicators you can click to jump | Minor | All steps |
| 5 | Equipment auto-creates 1 camera slot — may not match user intent | Low | Step 8 |

---

## Phase 4 — Package Detail Editor (`/packages/8`)

### What Loaded
URL `/packages/8` — "The Walkthrough Test Package". Page consists of a multi-card layout:

### Summary Bar (top-right)
- **Crew £1,389.00** + **Equipment £0.00** + **Tax £69.45** = **Total £1,458.45**
- Clearly broken down with icons and labels. Tax percentage implied but not shown.
- Price seems **high for 0 crew and 0 equipment** — this is auto-calculated from task generation (35 tasks × hourly rates), not from assigned crew. This could confuse users who expect price = crew + equipment.
- Breadcrumb: "Packages / The Walkthrough Test Package" with back arrow. Package name is editable inline (textbox). Version History button present.

### Schedule Card
- **Day tabs:** "DAY 1: Getting Ready (6)" and "DAY 2: Wedding Day (12)" with "+ Add Day".
- **Visual timeline** below: horizontal bar chart showing activities as colored blocks on a time axis (7 AM – 11 AM range for Getting Ready).
- "~3.8h approx. filming" label with time range summary.
- **Excellent visualization.** The timeline gives immediate spatial understanding of the day's schedule.

### Activities & Moments Card
- Table with: Activity name, moment count (badge), % progress bar (e.g., "94%", "77%"), Start, End, Duration, Edit/Delete actions.
- The percentage represents moment coverage (e.g., "85m 0s of 1h 30m planned" = 94%).
- "+ Add Activity" at the bottom.
- **Well-designed.** Sortable, editable, with clear action buttons.

### Deliverables Card
- Shows "No items yet" with "Add Film" and "Add Service" buttons.
- Clean empty state.

### Subjects Card
- Lists all 17 subjects inherited from wizard. Scoped to "Getting Ready" (per day tab).
- Group subjects (Parents, Close Friends, Bridesmaids, Groomsmen, Guests) have ±increment controls for count (default 4 each).
- Core subjects have individual delete buttons.
- "+ Add Custom Subject" at bottom.
- Total count "32" shown in card header.

### Locations Card
- "Location 1" and "Location 2" with location pins. "+ Add Location" button.
- Simple and functional.

### Crew Card
- Shows "Getting Ready" scope label. "+ Add Crew" button and "Manage" link (to /equipment).
- No crew currently — clean empty state.

### Equipment Card
- Shows "Getting Ready · Event Day" scope.
- "No equipment added yet" with "Add Camera" / "Add Audio" buttons.
- "Add Equipment" and "Manage Equipment" links.
- The "Manage Equipment" link goes to `/equipment` — **good cross-linking**.

### Task Auto-Generation Card
- **Most impressive feature.** Shows:
  - Stats: **35 tasks, 94h est. hours, £1,389.00 est. cost**
  - Grouped by phase: Creative Development (5), Pre-Production (5), Post-Production (18), Delivery (7)
  - Each row: task count, roles (e.g., "2 roles"), crew assignment ("—" since none), cost, hours
  - Expandable rows (arrow icons)
  - "Refresh preview" button in header
- **This is a standout feature.** Auto-generating tasks with cost estimates from a package template is powerful. However, the £1,389.00 cost here drives the "Total Cost" but the user hasn't assigned any crew — the cost comes from default role rates applied to generated tasks. This connection is not obvious.

### UX Critique

| # | Issue | Suggestion | Impact |
|---|-------|------------|--------|
| 1 | Price of £1,458.45 shows with 0 crew and 0 equipment — confusing | Add a tooltip or info icon explaining: "Cost is estimated from task generation using default role rates." Or show "Estimated" vs "Actual" labels. | High |
| 2 | Day-scoped sections (Subjects, Locations, Crew, Equipment per day) may confuse users | Make it clearer that these sections change when switching day tabs. Add a visual indicator like a tab-content transition or a "Day 1: Getting Ready" header per section. | Medium |
| 3 | No auto-save indicator visible | If auto-save is active, show a "Saved" / "Saving..." badge. If not, add a "Save" button. Users can't tell if their changes are persisted. | Medium |
| 4 | Timeline only shows for the currently selected day tab | Consider a multi-day timeline view that shows the full event schedule across days side-by-side. | Low |
| 5 | Activity % progress bars are hard to interpret | Add tooltip explaining what % means (moment duration coverage). Labels like "94%" alone don't convey meaning. | Medium |
| 6 | "Manage" link in Crew card goes to `/equipment` — wrong page | Should go to `/crew` or a crew management page, not equipment. Bug. | Major |
| 7 | Equipment card shows "Add Equipment" button separate from "Add Camera"/"Add Audio" — redundant | Consolidate into one action or clarify the difference. | Low |

### Design Observations
- The multi-column card layout (Activities/Deliverables on left, Subjects/Locations in middle, Crew/Equipment/Tasks on right) is well-balanced and scannable without too much scrolling.
- Timeline visualization is a highlight — gives immediate spatial context to the day's schedule.
- Consistent card design language with headers, count badges, and action buttons.
- The page is dense but well-organized. A new user would need time to understand all sections, but an experienced user can scan quickly.

---

## Phase 5 — Assign to Tier Slot

### Slot Assignment Flow
1. On the Services Hub, clicked "Add Slot" on Wedding Packages → new empty "Basic" slot appeared (2/5).
2. Clicked the empty Basic slot → **"Fill Slot" dialog** appeared.
3. Dialog offered two paths: **"Pick from library"** (7 Wedding packages available) or **"Create new package"** (start from scratch). Smart design.
4. Clicking "Pick from library" opened a full package list, sorted by price ascending, each showing: category badge, price, name, description, and stat miniatures (event days, crew, cameras, audio, locations).
5. Selected "The Walkthrough Test Package" (£1,458.45).
6. Dialog closed, slot immediately populated with package card showing full details.
7. **Console: 0 errors throughout.**

### Package Picker UX Critique

| # | Issue | Suggestion | Impact |
|---|-------|------------|--------|
| 1 | Package picker shows all packages regardless of whether they're already in other slots | Add a "Currently in: Budget" label or dim/disable packages already assigned elsewhere to prevent confusion. | Medium |
| 2 | No search or filter in the package picker | With 7 packages it's manageable, but at scale (20+) a search box or category filter would be essential. | Medium |
| 3 | Price in the picker doesn't indicate how it compares to other tiers | Consider highlighting which package is the cheapest/most expensive, or adding a recommended badge based on the tier name (e.g., "Budget" should suggest the cheapest package). | Low |
| 4 | After assigning, the tier name "Basic" doesn't match the package price (£1,458.45 is higher than "Budget" at £761.38) | The naming scheme implies price ordering but doesn't enforce it. Consider warning when a higher tier has a cheaper package, or auto-sorting. | Medium |
| 5 | The "Fill Slot" dialog title is functional but could be more descriptive | "Choose a package for the Basic tier" would be clearer. | Low |

### What Works Well
- The two-path dialog (pick from library vs. create new) is excellent — reduces friction for both workflows.
- Immediate visual feedback after assignment — the card populates instantly.
- Rich package preview in the picker with price and stats helps compare options.
- Slot management controls (Swap, Clear, Remove) appear on hover — clean and non-cluttering.

---

## Phase 6 — Final Assessment

### Errors Found

| Location | Type | Severity | Description |
|----------|------|----------|-------------|
| Detail Page `/packages/[id]` Crew card | Render / Link | Major | "Manage" link in the Crew card points to `/equipment` instead of `/crew`. Wrong destination. |
| Wizard Step 9 → Create | Render | Minor | After clicking "Create Package", the wizard briefly flashes back to Step 1 before navigation completes. Creates impression that creation failed. |
| Wizard Step 4 Subjects | Data | Minor | "Birthday Person" subject appears in Wedding package subject list. Subjects should be filtered by event type. |

**No console errors observed at any point throughout the entire walkthrough.** Zero JS errors, zero network failures.

### UX Issues

| Location | Issue | Suggestion | Impact |
|----------|-------|------------|--------|
| Services Hub | No onboarding or explanation of "Package Set" vs "Package" concept | Add tooltip on first visit or info icon explaining the tier model | Medium |
| Services Hub | Birthday Package shows 0 Crew, 0 Cameras, 0 Audio with no warning | Surface a yellow "incomplete setup" badge on packages missing crew/equipment | Medium |
| Package Library | No "Create New Package" button on the list page | Add a prominent CTA button in the header | High |
| Package Library | No category filter (only text search) | Add dropdown/chip filter for event type category | Medium |
| Package Library | Search doesn't update the "X packages in library" counter | Show "1 of 7 packages" when filtered | Low |
| Wizard Step 7 (Crew) | Subtitle promises role selection but UI only shows checkboxes | Either add role pickers or update the subtitle copy | Major |
| Wizard Step 7 (Crew) | No skill/rate info shown for crew members | Add role, hourly rate, or specialization labels | Medium |
| Detail Page | Total Cost of £1,458.45 calculated from tasks with 0 crew assigned — confusing | Label as "Estimated" or explain that cost comes from task auto-generation, not crew assignment | High |
| Detail Page | Activity % progress bars unlabeled | Add tooltip: "Moment coverage: 85m of 1h 30m planned" | Medium |
| Detail Page | No auto-save indicator | Show "Saved" / "Saving..." or explicit "Save" button | Medium |
| Package Picker | No search/filter in picker dialog | Add search box for large libraries | Medium |
| Package Picker | No indication a package is already assigned to another slot | Dim or label "Already in Budget" to prevent confusion | Medium |
| Tier Slots | Price ordering not enforced (Budget can be more expensive than Basic) | Warn or auto-sort when tiers are price-inverted | Medium |

### Design Observations

**Consistency:**
- Dark theme is consistently applied across all pages. Card design language is uniform (header + content + action footer).
- Tier slot colors (Budget=orange dashed, Basic=blue dashed, Standard=gold, Premium=purple) are consistent.
- Icon usage (event days, crew, cameras, audio, locations) is consistent between Services Hub cards, Package Picker, and Detail Page.

**Mobile/Responsive Readiness:**
- At 2560x1440b viewport, layout is spacious with good use of horizontal space.
- The detail page's 3-column card layout would likely need to stack on mobile — not tested but structure suggests it would collapse.
- Tier slot horizontal scrolling on narrower viewports may need scroll indicators.

**Accessibility Gaps:**
- Contrast appears adequate on dark theme (white text on dark backgrounds).
- Many controls are icon-only without visible labels (e.g., tier slot action buttons: Swap, Clear, Remove are icon-only with title/tooltip).
- The timeline visualization in the detail page likely needs alt text or screen reader annotations.
- Focus states not explicitly tested but MUI components generally handle keyboard nav.

**Loading States:**
- No loading spinners observed — data loads fast (likely cached React Query).
- Wizard step transitions are instant — no loading between steps.
- Package creation shows no "Creating..." state — just an immediate flash and redirect.

**Error States:**
- Not tested (would require simulating network failure or invalid data).
- No visible error boundaries or retry mechanisms observed.

### What Works Well

1. **Task Auto-Generation** — The standout feature. Generating 35 tasks with cost estimates from a package template is genuinely powerful and differentiating.
2. **Timeline Visualization** — The horizontal activity bar chart per event day gives immediate spatial understanding of the schedule.
3. **Services Hub Layout** — The tier slot grid with rich preview cards is an excellent information architecture for comparing packages.
4. **Package Picker "Fill Slot" Dialog** — Two-path design (pick from library / create new) is elegant and reduces friction.
5. **Wizard Review Step** — Comprehensive summary with full activity breakdown, subjects, and locations before creation.
6. **Activity Management** — Per-activity editing with start time, duration, moment counts, and percentage coverage is deeply thought out.
7. **Data Richness** — The amount of structured data presented per package (event days, crew, cameras, audio, locations, guests, films, subjects, tasks) is impressive without feeling overwhelming.
8. **Zero Console Errors** — The entire flow completed without a single JavaScript error. Solid engineering.

### Top 5 Quick Wins

| Rank | Change | Effort | Impact |
|------|--------|--------|--------|
| 1 | **Add "New Package" button to `/packages/list`** — currently the only way to create is via URL or wizard redirect. One button in the header, links to `/packages/new`. | Tiny | High |
| 2 | **Fix "Manage" link in Crew card** — currently goes to `/equipment`, should go to `/crew`. One href change. | Tiny | Major (bug fix) |
| 3 | **Add "Estimated" label to Total Cost** on detail page when no crew is assigned — prevents confusion about where £1,458.45 comes from. | Small | High |
| 4 | **Filter cross-event-type subjects** — remove "Birthday Person" from Wedding package subjects. Likely a seed data or template filtering fix. | Small | Medium |
| 5 | **Add auto-save indicator** to detail page — "Saved ✓" or "Saving..." badge near the package name. | Small | Medium |
