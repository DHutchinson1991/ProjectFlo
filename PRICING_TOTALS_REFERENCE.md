# ProjectFlo — Pricing & Totals Reference

> **Accuracy commitment:** Every section in this document is derived directly from source code with file paths and line references. If you change any of the files listed in the _Source Files_ table, update the corresponding section here.

---

## ⚠️ Mandatory Agent Rule

Before writing, editing, or debugging any code that touches:
- Package price estimation
- Task auto-generation costs
- Estimates (creation, update, total)
- Quotes (creation, update, total)
- Payment brackets / job role rates
- Payment schedule milestones
- The Needs Assessment builder pricing flow
- The upcoming Inquiry Package Wizard

**Read this document first.**

---

## Source Files Quick Reference

| Section | Backend File | Frontend File |
|---------|-------------|---------------|
| Package price estimate | `src/business/pricing/pricing.service.ts` | `needs-assessment/page.tsx`, `SummaryScreen.tsx` |
| Inquiry price estimate | `src/business/pricing/pricing.service.ts` | `PackageScopeCard.tsx` |
| Rate audit | `src/business/pricing/pricing.controller.ts` | — |
| Task cost | `src/business/task-library/task-library.service.ts` | `EstimatesCard.tsx` (auto-generate flow) |
| Estimates total | `src/estimates/estimates.service.ts` | `_detail/_components/EstimatesCard.tsx` |
| Quotes total | `src/quotes/quotes.service.ts` | `_detail/_components/QuotesCard.tsx` |
| Payment brackets | `src/payment-brackets/payment-brackets.service.ts` | — |
| Payment schedules | `src/payment-schedules/payment-schedules.service.ts` | `EstimatesCard.tsx`, `QuotesCard.tsx` |
| Tax computation | — | `src/lib/utils/pricing.ts` (centralized) |
| Package listing pricing | `src/business/service-packages/service-packages.service.ts` | `FilledSlot.tsx` |

---

## 1. The Four Pricing Surfaces

ProjectFlo has four distinct contexts where prices are computed:

| Surface | When Used | How Total Is Computed | Stored In DB? |
|---------|-----------|----------------------|---------------|
| **Package Price Estimate** | Needs Assessment builder preview | Equipment + Crew + Tasks (3-source composite) | No — fetched on demand |
| **Inquiry Price Estimate** | Inquiry detail (PackageScopeCard) | Same as Package but uses inquiry's instance operators | No — fetched on demand |
| **Task Auto-Generation Cost** | Sub-routine of package price estimate; also EstimatesCard auto-generation | `hourly_rate × total_hours` per task | No — preview only |
| **Estimate total_amount** | Inquiry estimates (sales pipeline) | `Σ (quantity × unit_price)` per item (pre-tax) | Yes — `Decimal(10,2)` |
| **Quote total_amount** | Inquiry quotes (sales pipeline) | `Σ (quantity × unit_price)` per item (pre-tax) | Yes — `Decimal(10,2)` |

**Key rule:** Estimates and quotes store `total_amount` as a persisted DB value.
The package price estimate is ephemeral — it is never stored, only calculated on request.

### Needs Assessment Auto-Created Draft Estimates

Needs Assessment submissions that create or attach to an inquiry also attempt to auto-create a draft estimate when the inquiry has a selected package.

Current behavior:
- The estimate is built from the inquiry's live schedule snapshot, not from a flat total field.
- Crew line items follow the same grouping logic as the inquiry Estimates card: `Planning`, `Coverage`, `Post-Production`, and `Post-Production:<Film Name>`.
- Task-derived costs come from `TaskLibraryService.previewAutoGeneration()` logic, excluding `Lead`, `Inquiry`, and `Booking` phases.
- Equipment is deduplicated by `equipment_id` and added as one line item per unique item using `rental_price_per_day`.
- If no snapshot-derived items can be produced, the fallback is a single `Package` line item using `selected_package.base_price`, but only when that price is greater than 0.
- The created estimate uses the brand's default tax rate and default payment method, and applies the brand's default payment schedule template when one exists and the inquiry has an event date.

---

## 2. Package Price Estimate

### API Endpoint

```
GET /pricing/:brandId/package/:packageId
GET /pricing/:brandId/inquiry/:inquiryId
Auth: JWT required (AuthGuard('jwt'))
```

**Source:** `packages/backend/src/business/pricing/pricing.controller.ts`

### Response Shape — `PriceBreakdown` Interface

**Source:** `packages/backend/src/business/pricing/pricing.service.ts` lines 4–33

```typescript
interface PriceBreakdown {
  packageId: number;
  packageName: string;
  currency: string;           // from brands.currency, defaults to 'USD'
  equipment: {
    cameras: number;
    audio: number;
    totalItems: number;
    dailyCost: number;
    items: Array<{ name: string; category: string; dailyRate: number }>;
  };
  crew: {
    operatorCount: number;
    totalHours: number;
    totalCost: number;
    operators: Array<{ position: string; hours: number; rate: number; cost: number }>;
  };
  tasks: {
    totalTasks: number;
    totalHours: number;
    totalCost: number;
    byPhase: Record<string, { taskCount: number; hours: number; cost: number }>;
  };
  summary: {
    equipmentCost: number;
    crewCost: number;
    taskCost: number;
    subtotal: number;   // equipmentCost + crewCost + taskCost — NO tax at this stage
  };
  tax: {
    rate: number;       // from brands.default_tax_rate (Decimal 5,2), 0 if unset
    amount: number;     // subtotal × (rate / 100), rounded to 2 decimals
    totalWithTax: number; // subtotal + amount, rounded to 2 decimals
  };
  warnings: string[];   // diagnostic messages for $0 rates, missing brackets, task errors
}
```

> **Note:** `summary.subtotal` does NOT include tax. Use `tax.totalWithTax` for tax-inclusive display.
> **Note:** `warnings` collects non-fatal issues: operators with $0 rates, task preview failures, etc.

### Rate Audit Endpoint

```
GET /pricing/:brandId/package/:packageId/audit-rates
Auth: JWT required (AuthGuard('jwt'))
```

Diagnostic endpoint that shows the resolved rate and fallback tier for every operator:
```json
{
  "packageId": 1,
  "packageName": "Gold",
  "videographerFallbackRate": 15,
  "operators": [
    { "position": "Lead", "contributorId": 1, "hours": 8, "rate": 40, "isDayRate": false, "tier": "matched-role", "cost": 320 }
  ]
}
```

Possible `tier` values: `matched-role`, `matched-role-day`, `primary-role`, `primary-role-day`, `any-bracket`, `default-hourly`, `videographer-fallback`, `none`.

### 2a. Equipment Cost

**Source:** `pricing.service.ts` lines 94–115

Algorithm:
1. Iterate all `package_day_operators` → each operator's `equipment` relations
2. **Deduplication** by `equipment_id` using a `Set` — each physical piece of equipment counted once regardless of how many operators it is assigned to
3. Sum `rental_price_per_day` for each unique equipment item
4. Count `category === 'CAMERA'` and `category === 'AUDIO'` separately for display

```
totalEquipmentCost = Σ equipment.rental_price_per_day  (deduplicated by equipment_id)
```

Rounding: `Math.round(totalEquipmentCost * 100) / 100` (2 decimal places)

### 2b. Crew Cost — 4-Tier Rate Fallback

**Source:** `pricing.service.ts` lines 117–195

This is the most complex part of the pricing system. For each `package_day_operator`:

```
hours = op.hours (from PackageDayOperator)

IF contributor is assigned:
  Tier 1: Look for a contributor_job_roles entry where job_role_id === op.job_role_id
          → Use that bracket's hourly_rate (or day_rate if hourly_rate == 0)

  Tier 2: If still rate === 0, look for the contributor's primary role (is_primary: true) bracket
          → Use that bracket's hourly_rate (or day_rate if hourly_rate == 0)

  Tier 3: If still rate === 0, use the first contributor_job_roles entry that has any payment_bracket
          → Use that bracket's hourly_rate

  Tier 4: If still rate === 0, use contributor.default_hourly_rate

IF no contributor assigned:
  Fallback: Look up job_roles WHERE name = 'videographer' (case-insensitive)
            → Take the lowest active payment bracket (ordered by level ASC, take 1)
            → Use that bracket's hourly_rate
            → If no videographer role/bracket exists, rate = 0

cost = isDayRate ? rate * max(hours, 1) : rate * hours
```

**Day-rate logic:** When `day_rate > 0 AND hourly_rate == 0`, the operator is on a day rate.
`isDayRate = true` → cost = `day_rate * (hours > 0 ? hours : 1)`.

Rounding per operator: `Math.round(cost * 100) / 100`

### 2c. Task Cost

Delegated entirely to `TaskLibraryService.previewAutoGeneration()`. See Section 3.

```typescript
const preview = await this.taskLibraryService.previewAutoGeneration(packageId, brandId, userId);
taskTotalCost = preview.summary.total_estimated_cost;
```

If `previewAutoGeneration()` throws (e.g. no task library entries), the error is swallowed — `taskTotalCost` remains 0. Equipment and crew costs are always valid.

### 2d. Final Summary

```
summary.subtotal = equipmentCost + crewCost + taskCost
```

All values rounded to 2 decimal places. No tax applied.

### Frontend Trigger

**Source:** `packages/frontend/src/app/(studio)/sales/needs-assessment/page.tsx` lines 274–305

```
User reaches "summary" by leaving "builder" step
  → api.servicePackages.createFromBuilder(...) saves the package
  → On success: api.servicePackages.estimatePrice(brandId, pkg.id)
  → setPriceEstimate(estimate) stored in page state
  → Passed to SummaryScreen via NACtx
  → Reset (set to null) when user navigates back to builder
```

**Frontend API method:** `packages/frontend/src/lib/api.ts` line 1623

```typescript
servicePackages.estimatePrice: (brandId: number, packageId: number) =>
  this.get(`/pricing/${brandId}/package/${packageId}`)
```

### Frontend Display

**Source:** `SummaryScreen.tsx` lines 137–149

Three rows displayed only when cost > 0:
- Equipment → `summary.equipmentCost`
- Crew → `summary.crewCost`
- Production → `summary.taskCost`
- **Total** → `summary.subtotal` (shown always)

Currency symbol derived from `priceEstimate.currency` (set from `brands.currency`).

### 2e. Inquiry Price Estimate

**Endpoint:** `GET /pricing/:brandId/inquiry/:inquiryId`

**Source:** `pricing.service.ts` — `estimateInquiryPrice()`

Identical algorithm to `estimatePackagePrice()`, but uses the inquiry's **instance operators** (`project_day_operators WHERE inquiry_id = :inquiryId`) instead of the package template operators. This ensures pricing reflects the actual crew assignments, equipment, and rates for a specific inquiry.

Key differences from template pricing:
- Operators come from `project_day_operators` (polymorphic: `inquiry_id` or `project_id`) instead of `package_day_operators`
- Equipment comes from `project_day_operator_equipment` relations
- `previewAutoGeneration()` receives `inquiryId` for inquiry-context task counts
- Tax is computed identically using `brands.default_tax_rate`

**Frontend usage:** `PackageScopeCard.tsx` calls `api.servicePackages.estimateInquiryPrice(brandId, inquiryId)` and displays `tax.totalWithTax` with an "incl. X% tax" label.

### Package Listing Pricing (findAll)

**Source:** `packages/backend/src/business/service-packages/service-packages.service.ts` — `findAll()`

**Endpoint:** `GET /service-packages/:brandId` (requires JWT auth)

The package listing endpoint now delegates pricing to `PricingService.estimatePackagePrice()` for each active package. This ensures listing cards display the same bracket-aware, task-inclusive prices as the designer and inquiry pages.

**How it works:**
1. Lightweight Prisma query fetches all active packages with operator counts and equipment categories
2. If `userId` is available (from JWT), calls `estimatePackagePrice()` per package via `Promise.allSettled`
3. Each package in the response receives: `_totalCrewCost`, `_totalEquipmentCost`, `_totalTaskCost`, `_totalCost` (pre-tax subtotal), and `_tax: { rate, amount, totalWithTax }`
4. If pricing fails for a package (allSettled rejected), that package gets zero costs and `_tax: null`
5. If no userId is present, all packages return zero costs (backwards-compatible fallback)
**Frontend usage:** `FilledSlot.tsx` reads `_tax.totalWithTax` directly from the backend response. Falls back to `_totalCost` or `base_price` if `_tax` is not present.

---

## 3. Task Cost via `previewAutoGeneration()`

**Source:** `packages/backend/src/business/task-library/task-library.service.ts`

### Method Signature

```typescript
async previewAutoGeneration(
  packageId: number,
  brandId: number,
  userId: number,
  inquiryId?: number   // optional — passed by EstimatesCard for inquiry context
): Promise<{ package, contentCounts, summary, byPhase, tasks }>
```

### Step 1 — Content Counts

The method counts package contents to determine task multipliers:

```
filmCount            = PackageFilm records for this package
eventDayCount        = PackageEventDay records
crewCount            = PackageDayOperator records
locationCount        = PackageEventDayLocation records
activityCount        = PackageActivity records
activityCrewCount    = OperatorActivityAssignment records (crew × activity)
filmSceneCount       = PackageFilmSceneSchedule records
```

### Step 2 — Task Multiplier per Trigger Type

Each `task_library` entry has a `trigger_type`. The multiplier determines how many task instances the task generates:

| trigger_type | Multiplier |
|---|---|
| `always` | 1 |
| `per_film` | filmCount |
| `per_event_day` | eventDayCount |
| `per_crew_member` | crewCount |
| `per_location` | locationCount |
| `per_activity` | activityCount |
| `per_activity_crew` | activityCrewCount |
| `per_film_scene` | filmSceneCount |
| `per_film_with_music` | count of films where `has_music = true` |
| `per_film_with_graphics` | count of films where `has_graphics = true` |

`total_hours = multiplier × task.effort_hours`

### Step 3 — Rate Resolution per Task

**Source:** `task-library.service.ts` lines 843–911

Rate is resolved in this order:

```
1. contributorBracketMap: if a crew member is assigned to this task's role,
   look up "contributorId-roleId" → bracket level
   → bracketRateMap["roleId-level"] → hourly_rate

2. If no crew bracket match:
   → roleFallbackRate[roleId] = lowest-level active bracket's hourly_rate

3. task.hourly_rate (the task library entry's own rate field) — final fallback

4. If none of the above → hourly_rate = null → estimated_cost = null
```

`bracketRateMap` and `roleFallbackRate` are populated by fetching all active `payment_brackets` for the roles present in this package's tasks:
```
SELECT job_role_id, level, hourly_rate FROM payment_brackets WHERE is_active = true
bracketRateMap["roleId-level"] = hourly_rate
roleFallbackRate[roleId] = hourly_rate of lowest-level entry (first after ORDER BY level ASC)
```

### Step 4 — Cost per Task

**Source:** `task-library.service.ts` lines 1327–1331

```typescript
const estimated_cost = (hourly_rate !== null && hourly_rate !== undefined && total_hours > 0)
  ? Math.round(hourly_rate * total_hours * 100) / 100
  : null;
```

Tasks with `total_instances === 0` are filtered out (e.g. `per_film_with_music` when no films have music).

### Step 5 — Summary Totals

**Source:** `task-library.service.ts` lines 1340–1364

```typescript
const totalTasks = tasksWithCost.reduce((sum, t) => sum + t.total_instances, 0);
const totalHours = tasksWithCost.reduce((sum, t) => sum + t.total_hours, 0);
const totalCost  = tasksWithCost.reduce((sum, t) => sum + (t.estimated_cost ?? 0), 0);

// Returned as:
summary: {
  total_library_tasks: tasks.length,
  total_generated_tasks: totalTasks,
  total_estimated_hours: Math.round(totalHours * 100) / 100,
  total_estimated_cost: Math.round(totalCost * 100) / 100,
}
```

### EstimatesCard Usage of `previewAutoGeneration`

**Source:** `EstimatesCard.tsx` lines 164–243

When EstimatesCard auto-generates line items, it calls:
```typescript
api.taskLibrary.previewAutoGeneration(packageId, brandId, inquiry.id)
```

It uses `taskPreview.tasks` to group by role → build line items where:
- `quantity` = `Math.round(entry.hours * 100) / 100`
- `unit_price` = `entry.rate` (the resolved hourly_rate from bracket resolution)
- `total` = `quantity × unit_price` (computed locally in the UI before save)

These become the draft `lineItems` that the user can edit before submitting the estimate.

---

## 4. Estimates — `total_amount`

### API Endpoints

```
POST   /api/inquiries/:inquiryId/estimates          → create
GET    /api/inquiries/:inquiryId/estimates          → list all
GET    /api/inquiries/:inquiryId/estimates/:id      → single
PATCH  /api/inquiries/:inquiryId/estimates/:id      → update
DELETE /api/inquiries/:inquiryId/estimates/:id      → delete
POST   /api/inquiries/:inquiryId/estimates/:id/send → send to client
```

### How `total_amount` Is Calculated — Backend

**Source:** `packages/backend/src/estimates/estimates.service.ts` lines 64–65 (create), lines 192–193 (update)

**On create:**
```typescript
// Uses Decimal accumulation for monetary precision
const totalAmount = createEstimateDto.items
  .reduce((sum, item) => sum.add(new Decimal(item.quantity).mul(new Decimal(item.unit_price))), new Decimal(0))
  .toNumber();
// Stored as: new Decimal(totalAmount)
```

**On update (only if `items` array is included in the PATCH body):**
```typescript
totalAmount = updateEstimateDto.items
  .reduce((sum, item) => sum.add(new Decimal(item.quantity || 0).mul(new Decimal(item.unit_price || 0))), new Decimal(0))
  .toNumber();
```

If update does NOT include `items`, `total_amount` is not recalculated — it keeps its existing value.

### Tax, Deposit, and Installments

These fields are stored alongside `total_amount` but are **NOT included in the `total_amount` stored value**:

| Field | Type | Role |
|---|---|---|
| `tax_rate` | `Decimal(5,2)` default 0 | Display/reporting only — not added to total in DB |
| `deposit_required` | `Decimal(10,2)` nullable | Display/reporting — not subtracted from total in DB |
| `installments` | `Int` default 1 | Count of payment installments — not a price field |
| `currency` | `String?(3)` default `"USD"` | ISO currency code, resolved from brand on create |

> **Critical:** `total_amount` in the DB = pure line items sum (pre-tax). Tax is stored separately as `tax_rate` and computed for display only in the frontend. The frontend does **NOT** send `total_amount` to the backend — only `items[]` is sent, and the backend recalculates `total_amount` from those items.

### Computed `total_with_tax`

All GET responses (findAll, findOne, update return, send return) now include a **computed** `total_with_tax` field:
```typescript
total_with_tax = Math.round((totalAmount + totalAmount * (taxRate / 100)) * 100) / 100;
```
This is NOT stored in the database — it is computed on read. Use it in the frontend instead of recalculating.

### Frontend Total Display

**Source:** `EstimatesCard.tsx` lines 624–627

```typescript
import { computeTaxBreakdown } from '@/lib/utils/pricing';

const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
const subtotal = calculateSubtotal();
const { taxAmount, total: totalAmount } = computeTaxBreakdown(subtotal, taxRate);
```

All frontend tax computation uses the centralized `computeTaxBreakdown()` utility from `@/lib/utils/pricing`. This function rounds to 2 decimal places and is used consistently across EstimatesCard, QuotesCard, portal, and proposals pages.

The frontend sends only `items[]` (with `quantity` and `unit_price`) plus `tax_rate` in the save payload. There is **no** `total_amount` field in the request DTO. The backend recalculates `total_amount = Σ(qty × unit_price)` from the items — this stored value is **pre-tax**.

The post-tax `totalAmount` computed in the UI is used only for:
- Display in the editor
- Passing to `applyToEstimate()` for payment milestone calculation

> **Consistency note:** DB `total_amount` = pre-tax line items sum. Frontend `totalAmount` = pre-tax + tax (display only). Milestone amounts resolve from the post-tax value passed to `applyToEstimate()`.

### Primary Estimate Logic

Each inquiry can have one `is_primary` estimate:
- On create with `is_primary: true` → all other estimates for the inquiry are set to `is_primary: false`
- Auto-promotion: if no primary exists, the newest estimate (by `updated_at`) is promoted automatically

### Estimate Number Format

Auto-generated as `EST-XXXX` (letter-digit-letter-digit, no I/O/0/1). Collision-checked with up to 50 attempts before falling back to `EST-<timestamp>`.

---

## 5. Quotes — `total_amount`

### API Endpoints

```
POST   /api/inquiries/:inquiryId/quotes          → create
GET    /api/inquiries/:inquiryId/quotes          → list all
GET    /api/inquiries/:inquiryId/quotes/:id      → single
PATCH  /api/inquiries/:inquiryId/quotes/:id      → update
DELETE /api/inquiries/:inquiryId/quotes/:id      → delete
POST   /api/inquiries/:inquiryId/quotes/:id/send → send to client
```

### How `total_amount` Is Calculated — Backend

**Source:** `packages/backend/src/quotes/quotes.service.ts` lines 18–19 (create), lines 174–175 (update)

Identical formula to Estimates (using Decimal accumulation):
```typescript
// Create:
const totalAmount = createQuoteDto.items
  .reduce((sum, item) => sum.add(new Decimal(item.quantity).mul(new Decimal(item.unit_price))), new Decimal(0))
  .toNumber();

// Update (only if items included):
totalAmount = updateQuoteDto.items
  .reduce((sum, item) => sum.add(new Decimal(item.quantity || 0).mul(new Decimal(item.unit_price || 0))), new Decimal(0))
  .toNumber();
```

### Frontend Total Display

**Source:** `QuotesCard.tsx` lines 392–395

Identical to EstimatesCard — uses the centralized tax utility:
```typescript
import { computeTaxBreakdown } from '@/lib/utils/pricing';

const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
const subtotal = calculateSubtotal();
const { taxAmount, total: totalAmount } = computeTaxBreakdown(subtotal, taxRate);
```

Same as estimates: the frontend sends `items[]` only. The backend recalculates `total_amount` (pre-tax) from items. Post-tax `totalAmount` is passed to `applyToQuote()` for milestone calculation. Both estimates and quotes also return `total_with_tax` as a computed field in GET responses.

### Quotes vs. Estimates — Key Differences

| Aspect | Estimates | Quotes |
|--------|-----------|--------|
| Extra fields | `schedule_template_id`, `payment_milestones` | `consultation_notes`, `schedule_template_id`, `payment_milestones` |
| Payment milestones | `estimate_payment_milestones` table + `applyToEstimate()` | `quote_payment_milestones` table + `applyToQuote()` |
| Invoices | — | Has `invoices` relation |
| Auto-complete inquiry task | No | Yes — triggers `autoCompleteByName(inquiryId, 'Generate Quote')` on create |
| Import from estimate | No | Yes — QuotesCard has import dropdown |
| Number format | Auto-generated `EST-XXXX` | Provided by caller (`quote_number`) |
| Version | `version` (auto-incremented on content changes) | `version` (auto-incremented on content changes) |

---

## 6. Payment Brackets

### Schema

```
payment_brackets
  id             Int
  job_role_id    Int        → FK to job_roles
  name           String     (e.g. "Junior", "Mid", "Senior", "Lead")
  display_name   String?    (optional UI display override)
  level          Int        → tier level (1=lowest/junior, higher=senior)
  hourly_rate    Decimal(8,2)
  day_rate       Decimal(8,2)?
  overtime_rate  Decimal(8,2)?
  description    String?
  color          String?    (hex color for UI)
  is_active      Boolean    default true

contributor_job_roles
  contributor_id       Int  → FK to contributors
  job_role_id          Int  → FK to job_roles
  payment_bracket_id   Int? → FK to payment_brackets (nullable)
  is_primary           Boolean
```

### How Rates Are Selected — Summary Rules

1. A contributor can have multiple job role assignments (`contributor_job_roles`)
2. Each assignment optionally links to one `payment_bracket`
3. The bracket supplies `hourly_rate` and optionally `day_rate`
4. **Day rate vs hourly:** `day_rate > 0 AND hourly_rate == 0` → treat as day rate. Otherwise use `hourly_rate`.
5. The 4-tier fallback (Sections 2b and 3) resolves which bracket wins

### Used In

- `pricing.service.ts` — crew cost for package price estimate
- `task-library.service.ts` — rate resolution for task cost in `previewAutoGeneration()`
- Both respect `is_active = true` filter

---

## 7. Payment Schedules & Milestones

### Schema

```
payment_schedule_templates
  id          Int
  brand_id    Int
  name        String
  is_default  Boolean
  is_active   Boolean
  rules       payment_schedule_rules[]

payment_schedule_rules
  template_id   Int
  label         String         (e.g. "Deposit", "Balance")
  amount_type   String         'PERCENT' | 'FIXED'
  amount_value  Decimal(10,2)  e.g. 50 for 50% or 500.00 for £500 fixed
  trigger_type  String         'AFTER_BOOKING' | 'BEFORE_EVENT' | 'AFTER_EVENT'
  trigger_days  Int?           days offset from trigger
  order_index   Int

estimate_payment_milestones
  estimate_id  Int
  label        String
  amount       Decimal(10,2)  → RESOLVED amount (not a percentage)
  due_date     DateTime
  status       String         'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED'
  notes        String?
  order_index  Int
```

### How Milestones Are Computed

**Source:** `payment-schedules.service.ts` lines 131–170 (`applyToEstimate`)

```typescript
// For each rule:
const amount = rule.amount_type === 'PERCENT'
  ? (Number(rule.amount_value) / 100) * total_amount   // e.g. 50/100 * 2000 = 1000
  : Number(rule.amount_value);                          // fixed amount as-is

// due_date computed from trigger:
'AFTER_BOOKING'  → bookingDate + trigger_days
'BEFORE_EVENT'   → eventDate - trigger_days
'AFTER_EVENT'    → eventDate + trigger_days
```

Validation: sum of PERCENT rules must not exceed 100% (throws `BadRequestException` if > 100%).

### Application

- Applied via `POST /payment-schedules/apply-to-estimate` (or apply-to-quote)
- Replaces all existing milestones for that estimate (full replace, not append)
- Links `schedule_template_id` on the estimate record
- `applyToQuote()` follows the identical pattern but targets `quote_payment_milestones`

### Frontend Display

EstimatesCard and QuotesCard display milestones inline:
- Display amount: `Number(m.amount)` — already resolved (not %)
- Percentage display: `Math.round((m.amount / totalAmount) * 100)` (calculated client-side for display only)
- Preview milestones (before applying): `(rule.amount_value / 100) * totalAmount`

---

## 8. Frontend Price Display Points — All Locations

| Location | File | What Is Shown |
|---|---|---|
| Needs Assessment Summary | `SummaryScreen.tsx` | Equipment / Crew / Production / Total (from PriceBreakdown) |
| Package designer summary bar | `SummaryCard.tsx` | Crew + Equipment = Total, with tax-inclusive display when `taxRate > 0` |
| Package listing cards | `FilledSlot.tsx` | Tax-inclusive total via backend `_tax.totalWithTax` (from PricingService), "incl. X% tax" label |
| Inquiry PackageScopeCard | `PackageScopeCard.tsx` | `tax.totalWithTax` from backend inquiry pricing endpoint, "incl. X% tax" label |
| Inquiry deal value pill | `CommandCenterHeader.tsx` | Tax-inclusive value via `computeTaxBreakdown()`, "incl. X% tax" label |
| Inquiry deal value KPI | `KpiMetricsStrip.tsx` | Tax-inclusive deal value (optional `taxRate` prop) |
| Inquiry Estimate editor | `EstimatesCard.tsx` | Line items, subtotal, tax, total, milestones |
| Inquiry Quote editor | `QuotesCard.tsx` | Line items, subtotal, tax, total, milestones |
| Inquiry Estimates list | `EstimatesCard.tsx` lines 713, 820 | `estimate.total_with_tax ?? estimate.total_amount` — shows tax-inclusive total; "incl. X% tax" label when tax > 0 |
| Inquiry Quotes list | `QuotesCard.tsx` lines 478, 581 | `quote.total_with_tax ?? quote.total_amount` — shows tax-inclusive total; "incl. X% tax" label when tax > 0 |
| Quote: import estimate picker | `QuotesCard.tsx` line 710 | `est.total_with_tax ?? est.total_amount` — tax-inclusive total for consistency |
| Package cards (designer) | `CreatePackageSetDialog.tsx` | Verify separately — may use stored price fields |
| Client portal | `(portal)/portal/[token]/page.tsx` | Uses `computeTaxBreakdown()` for `itemsSubtotal`, `taxAmount`, and `grandTotal` |
| Proposals | `(portal)/proposals/[token]/page.tsx` | Uses `computeTaxBreakdown()` for tax and Total Investment display |

---

## 9. Upcoming: Inquiry Package Wizard Integration

When building the Inquiry Package Wizard:

### Recommended Pattern

1. **Mirror the Needs Assessment flow:**
   - Build/select a package → `POST /api/service-packages/from-builder` or select existing
   - Fetch price estimate → `GET /pricing/:brandId/package/:packageId`
   - Display PriceBreakdown summary to the user

2. **For auto-generating estimate line items:**
   - Call `api.taskLibrary.previewAutoGeneration(packageId, brandId, inquiryId)`
   - Use `taskPreview.tasks` to group by role and build draft line items
   - Present for user edit before saving the estimate

3. **Payment bracket linking:**
   - When assigning crew to operators in the wizard, the rate resolution is automatic via the 4-tier fallback
   - No manual rate entry needed unless all tiers resolve to 0

### Integration Points Already Available

- `previewAutoGeneration()` already accepts `inquiryId` — pass it when calling from inquiry context
- `api.servicePackages.estimatePrice(brandId, packageId)` — no changes needed
- `api.estimates.create(inquiryId, data)` — accepts `items[]` with quantity + unit_price

---

## 10. Data Model — Pricing-Relevant Fields Only

### `service_packages`
```
id, brand_id, name, currency
package_day_operators → (see below)
```

### `package_day_operators`
```
id, package_id, contributor_id (nullable), job_role_id (nullable)
position_name, hours
equipment → package_day_operator_equipment → equipment
```

### `equipment`
```
id, item_name, category ('CAMERA' | 'AUDIO' | ...), rental_price_per_day
```

### `contributors`
```
id, default_hourly_rate
contributor_job_roles → payment_bracket → hourly_rate / day_rate
```

### `payment_brackets`
```
id, job_role_id, name, display_name?, level, hourly_rate (Decimal 8,2), day_rate? (Decimal 8,2),
overtime_rate? (Decimal 8,2), description?, color?, is_active
```

### `task_library`
```
id, brand_id, phase, name, trigger_type, effort_hours, hourly_rate
default_job_role_id → job_roles
```

### `estimates` / `quotes`
```
id, inquiry_id, total_amount (Decimal 10,2) — PRE-TAX (pure items sum)
total_with_tax — COMPUTED ON READ (not stored): total_amount + total_amount × (tax_rate / 100)
tax_rate (Decimal 5,2) — stored separately, frontend computes post-tax display
currency (String 3) — ISO currency code, defaults to "USD", resolved from brand on create
deposit_required (Decimal 10,2) — display only
schedule_template_id — FK to payment_schedule_templates
version — auto-incremented on content changes
items: estimate_items / quote_items
  → quantity (Decimal 10,2), unit_price (Decimal 10,2)
payment_milestones: estimate_payment_milestones / quote_payment_milestones
  → label, amount (Decimal 10,2), due_date, status, order_index
```

### FK Chain for Rate Lookup
```
contributors
  └─ contributor_job_roles (is_primary, job_role_id, payment_bracket_id)
       └─ payment_brackets (level, hourly_rate, day_rate)
            └─ job_roles (id, name)
```

---

## 11. Invariants & Rules for All Agents

1. **Never compute `total_amount` client-side and treat it as the source of truth.**
   The backend recalculates on every create/update that includes `items[]`.

2. **`total_amount` stored in DB is PRE-TAX** (pure line items sum: `Σ qty × unit_price`).
   Tax rate is stored separately. Frontend computes post-tax display values client-side.
   Do not assume the stored value includes tax.

3. **`summary.subtotal` in PriceBreakdown does NOT include tax.** It is a pre-tax estimate only.
   Use `tax.totalWithTax` for tax-inclusive display.

4. **`tax` field in PriceBreakdown contains `rate`, `amount`, and `totalWithTax`.**
   These are computed from `brands.default_tax_rate`. If no tax rate is set, `tax.rate = 0` and `tax.totalWithTax = summary.subtotal`.

5. **Crew cost = task cost. Tasks ARE the work crew does.**
   `summary.crewCost` = sum of `previewAutoGeneration().tasks` **excluding** the sales-pipeline phases `Lead`, `Inquiry`, and `Booking`.
   These admin phases are not production work and must NOT contribute to the package price.
   Backend constant: `PricingService.PRICING_EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking'])`.
   Frontend mirror: `CREW_COST_EXCLUDED_PHASES` in `selectors.ts`.
   There is NO separate raw `operator_rate × operator_hours` cost added to the total.
   Do not compute `rate × hours` per operator and add it to the subtotal — that double-counts.

6. **`summary.subtotal` = `equipmentCost + crewCost` only.**
   There is no separate `taskCost` component in the summary. Task cost IS crew cost.

7. **Payment milestone amounts are stored as resolved values** (not percentages).
   Do not multiply milestone `amount` by `total_amount` — it is already the currency amount.

8. **`previewAutoGeneration()` is the canonical source for crew/task cost.**
   Do not manually calculate `effort_hours × rate` outside this method.

9. **The 4-tier rate fallback is used by `previewAutoGeneration` and `auditRates` only.**
   It is NOT used in `estimatePackagePrice` or `estimateInquiryPrice` for crew cost — those delegate entirely to `previewAutoGeneration`.

10. **Equipment cost is deduplicated by `equipment_id`.**
    Shared equipment across operators is counted once.

11. **`task_library.hourly_rate` is only a final fallback.**
    Bracket-resolved rates always take precedence for task cost.

12. **When updating an estimate/quote without sending `items[]`, `total_amount` is preserved as-is.**
    Include the full items array when you intend to recalculate the total.

13. **Payment schedule rules must sum to ≤ 100% (PERCENT type).**
    Server validates this and throws `BadRequestException` if exceeded.

14. **All frontend tax computation must use `computeTaxBreakdown()` from `@/lib/utils/pricing`.**
    Do not inline `subtotal * (taxRate / 100)`. The utility ensures consistent 2-decimal rounding.

15. **`total_with_tax` is a computed read-only field on Estimate/Quote responses.**
    Never store it in the database. It is recomputed on every GET.

16. **Estimates/quotes use Decimal accumulation for `total_amount` calculation.**
    All `items.reduce()` calls use `Decimal.add()` and `Decimal.mul()`, not floating-point arithmetic.

17. **The `currency` field on estimates/quotes is resolved from the brand on create.**
    Path: `inquiry → contact → brand → currency`. Defaults to `"USD"`.

18. **PriceBreakdown `warnings[]` surfaces non-fatal issues.**
    Check this array for missing equipment rates, task preview failures, etc.
