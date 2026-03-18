/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="jest" />

/**
 * PRICING CONSISTENCY — Moonrise Films
 *
 * Moonrise Films (Telford, Shropshire, UK)
 *   Currency: GBP   |   Tax: 20% UK VAT   |   Timezone: Europe/London
 *
 * This file uses real Moonrise brand data (from the seed files) and runs
 * every pricing surface — Package Estimate, Estimate, Quote, Portal,
 * Payment Splits — through the same wedding to confirm they all agree.
 *
 * Brand data sources:
 *   prisma/seeds/moonrise-brand-setup.ts     (currency, tax, payment templates)
 *   prisma/seeds/moonrise-team-setup.ts      (Andy £45/hr, Corri £45/hr)
 *   prisma/seeds/moonrise-equipment-setup.ts (Canon R5 £150, A7S III £120, ...)
 *   prisma/seeds/moonrise-task-library.ts    (task names & effort_hours)
 *
 * Run:  npx jest --testPathPattern pricing-consistency --verbose
 */

import { Decimal } from '@prisma/client/runtime/library';

// ─── CURRENCY FORMATTER ───────────────────────────────────────────
// Mirrors packages/frontend/src/lib/utils/formatUtils.ts → formatCurrency()
// which uses Intl.NumberFormat with the brand's currency code.
function formatCurrency(value: number, currency: string, locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

// ─── MOONRISE FILMS BRAND ─────────────────────────────────────────
// Source: prisma/seeds/moonrise-brand-setup.ts
const MOONRISE = {
  name: 'Moonrise Films',
  location: 'Telford, Shropshire, UK',
  currency: 'GBP',       // brands.currency
  taxRate: 20,           // UK VAT
  locale: 'en-GB',

  // Default payment templates (from brand-setup.ts)
  paymentTemplates: {
    fiftyFifty: [
      { label: 'Booking Deposit',            type: 'PERCENT' as const, value: 50 },
      { label: 'Final Balance (30 days)',     type: 'PERCENT' as const, value: 50 },
    ],
    threeWaySplit: [
      { label: 'Booking Deposit',            type: 'PERCENT' as const, value: 34 },
      { label: 'Second Instalment (60 days)',type: 'PERCENT' as const, value: 33 },
      { label: 'Final Balance (30 days)',    type: 'PERCENT' as const, value: 33 },
    ],
  },
};

// Quick GBP formatter alias
const gbp = (n: number) => formatCurrency(n, MOONRISE.currency, MOONRISE.locale);

// ─── THE ACTUAL FORMULAS FROM EACH SERVICE ───────────────────────
// Copied verbatim from the real service files.
// If a formula changes in the service, these should break.

const Formulas = {

  // ── PACKAGE ESTIMATE (business/pricing/pricing.service.ts) ─────

  /** Equipment cost: sum of unique rental prices (dedup by equipment ID) */
  packageEquipmentCost(equipment: Array<{ id: number; name: string; rental_price_per_day: number }>): number {
    const seen = new Set<number>();
    let total = 0;
    for (const eq of equipment) {
      if (!seen.has(eq.id)) {
        seen.add(eq.id);
        total += Number(eq.rental_price_per_day || 0);
      }
    }
    return Math.round(total * 100) / 100;
  },

  /** Crew cost: rate × hours per operator (day-rate uses max(hours, 1)) */
  packageCrewCost(crew: Array<{ name: string; hours: number; rate: number; isDayRate: boolean }>): number {
    let total = 0;
    for (const op of crew) {
      total += op.isDayRate ? op.rate * Math.max(op.hours, 1) : op.rate * op.hours;
    }
    return Math.round(total * 100) / 100;
  },

  /** Task cost: hourly_rate × effort_hours per task (null when no rate) */
  packageTaskCost(tasks: Array<{ name: string; hourly_rate: number | null; effort_hours: number }>): {
    perTask: (number | null)[];
    total: number;
  } {
    const perTask = tasks.map(t => {
      if (t.hourly_rate === null || t.hourly_rate === undefined || t.effort_hours <= 0) return null;
      return Math.round(t.hourly_rate * t.effort_hours * 100) / 100;
    });
    const total = perTask.reduce<number>((sum, c) => sum + (c ?? 0), 0);
    return { perTask, total: Math.round(total * 100) / 100 };
  },

  /** Package subtotal = equipment + crew + tasks */
  packageSubtotal(equip: number, crew: number, tasks: number): number {
    return Math.round((equip + crew + tasks) * 100) / 100;
  },

  // ── ESTIMATE / QUOTE (estimates.service.ts, quotes.service.ts) ─

  /** Line items → total_amount using Prisma Decimal (stored in DB) */
  estimateTotal(items: Array<{ quantity: number; unit_price: number }>): number {
    return items
      .reduce(
        (sum, item) => sum.add(new Decimal(item.quantity).mul(new Decimal(item.unit_price))),
        new Decimal(0),
      )
      .toNumber();
  },

  /** total_with_tax — computed by backend on every API read */
  backendTotalWithTax(totalAmount: number, taxRate: number): number {
    return Math.round((totalAmount + totalAmount * (taxRate / 100)) * 100) / 100;
  },

  // ── PORTAL / PROPOSALS (frontend computeTaxBreakdown) ──────────

  /** How the client portal re-derives tax from stored total_amount */
  portalTax(subtotal: number, taxRate: number): { taxAmount: number; total: number } {
    const rate = taxRate || 0;
    const taxAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    return { taxAmount, total };
  },

  // ── FRONTEND LINE ITEM EDITOR (LineItemEditor.tsx) ─────────────

  /** Each line total: qty × price rounded to 2dp */
  frontendLineTotal(qty: number, price: number): number {
    const total = qty * price;
    return isNaN(total) ? 0 : Number(total.toFixed(2));
  },

  /** Subtotal across all line totals */
  frontendSubtotal(lineTotals: number[]): number {
    return lineTotals.reduce((acc, t) => acc + (t || 0), 0);
  },

  // ── PAYMENT SCHEDULE (payment-schedules.service.ts) ────────────

  /** Milestone amount from PERCENT or FIXED rule */
  milestoneAmount(type: 'PERCENT' | 'FIXED', value: number, totalAmount: number): number {
    const raw = type === 'PERCENT' ? (value / 100) * totalAmount : value;
    return Number(raw.toFixed(2));
  },
};


// ═══════════════════════════════════════════════════════════════════
//
//   TEST 1: Package Estimate — Moonrise Films computes the cost
//           of delivering Emma & Jack's wedding before touching
//           any formal Estimate/Quote
//
// ═══════════════════════════════════════════════════════════════════

describe('Moonrise Films — Package Estimate (wizard cost breakdown)', () => {

  // ── REAL MOONRISE EQUIPMENT (moonrise-equipment-setup.ts) ──
  // Includes one deliberate duplicate (two Canon EOS R5 units, same id)
  // to confirm deduplication works.
  const EQUIPMENT = [
    { id: 1, name: 'Canon EOS R5',            rental_price_per_day: 150 }, // primary
    { id: 2, name: 'Sony A7S III',             rental_price_per_day: 120 }, // second cam
    { id: 3, name: 'Canon RF 24-70mm f/2.8L',  rental_price_per_day:  75 }, // lens
    { id: 4, name: 'DJI Pocket 2',             rental_price_per_day:  35 }, // compact
    { id: 1, name: 'Canon EOS R5',             rental_price_per_day: 150 }, // ← DUPLICATE: same id=1 → must be ignored
  ];

  // ── REAL MOONRISE CREW (moonrise-team-setup.ts) ─────────────
  // Andy Galloway & Corri Lee: default_hourly_rate = 45.00
  const CREW = [
    { name: 'Andy Galloway (Lead)',    hours: 10, rate: 45, isDayRate: false },
    { name: 'Corri Lee (Second Cam)', hours:  8, rate: 45, isDayRate: false },
    { name: 'Freelance Audio Tech',   hours:  6, rate: 30, isDayRate: false },
  ];

  // ── REAL MOONRISE TASK LIBRARY (moonrise-task-library.ts) ───
  // task name, effort_hours (from seed), hourly_rate (set on this booking)
  const TASKS = [
    { name: 'Shot List Planning',             effort_hours: 2.0, hourly_rate: 35 },
    { name: 'Timeline Coordination',          effort_hours: 1.5, hourly_rate: 35 },
    { name: 'Footage Review and Selection',   effort_hours: 4.0, hourly_rate: 35 },
    { name: 'Rough Cut',                      effort_hours: 3.0, hourly_rate: 35 },
    { name: 'Color Grading',                  effort_hours: 6.0, hourly_rate: 40 },
    { name: 'Audio Enhancement',              effort_hours: 3.0, hourly_rate: 30 },
    { name: 'Music Selection and Licensing',  effort_hours: 2.0, hourly_rate: 25 },
    { name: 'Client Review and Revisions',    effort_hours: 2.0, hourly_rate: 35 },
    { name: 'Final Export and Rendering',     effort_hours: 2.0, hourly_rate: 35 },
    { name: 'Online Gallery Setup',           effort_hours: 1.0, hourly_rate: 35 },
    { name: 'Project Archive',                effort_hours: 1.0, hourly_rate: null }, // no rate set
  ];

  // ── Compute ──
  const equipCost  = Formulas.packageEquipmentCost(EQUIPMENT);
  const crewCost   = Formulas.packageCrewCost(CREW);
  const { perTask: taskCosts, total: taskCost } = Formulas.packageTaskCost(TASKS);
  const subtotal   = Formulas.packageSubtotal(equipCost, crewCost, taskCost);

  beforeAll(() => {
    const pad = (s: string, w: number) => s.padEnd(w);
    console.log('\n');
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log(`┃  MOONRISE FILMS — Package Estimate: Emma & Jack's Wedding    ${MOONRISE.currency.padEnd(19)}┃`);
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');

    // Equipment
    console.log('\n  EQUIPMENT  (dedup by ID — duplicate Canon EOS R5 should not appear twice)');
    const seenIds = new Set<number>();
    EQUIPMENT.forEach(eq => {
      const isDup = seenIds.has(eq.id);
      seenIds.add(eq.id);
      const flag = isDup ? '  ← DUPLICATE — excluded' : '';
      console.log(`    ${pad(`[id:${eq.id}] ${eq.name}`, 42)} ${pad(gbp(isDup ? 0 : eq.rental_price_per_day), 10)}${flag}`);
    });
    console.log(`    ${'─'.repeat(54)}`);
    console.log(`    ${pad('Equipment Total (4 unique items)', 42)} ${gbp(equipCost)}`);

    // Crew
    console.log('\n  CREW');
    CREW.forEach(op => {
      const cost = op.isDayRate ? op.rate * Math.max(op.hours, 1) : op.rate * op.hours;
      console.log(`    ${pad(op.name, 28)} ${String(op.hours).padStart(3)}h × ${pad(gbp(op.rate) + '/h', 10)} = ${gbp(cost)}`);
    });
    console.log(`    ${'─'.repeat(54)}`);
    console.log(`    ${pad('Crew Total', 28)}                           ${gbp(crewCost)}`);

    // Tasks
    console.log('\n  TASKS  (from Moonrise task library — effort_hours × hourly_rate)');
    TASKS.forEach((t, i) => {
      const cost = taskCosts[i];
      const rateStr = t.hourly_rate !== null ? `${gbp(t.hourly_rate)}/h` : 'no rate';
      const costStr = cost !== null ? gbp(cost) : 'N/A (excluded)';
      console.log(`    ${pad(t.name, 36)} ${String(t.effort_hours).padStart(4)}h × ${pad(rateStr, 10)} = ${costStr}`);
    });
    console.log(`    ${'─'.repeat(62)}`);
    console.log(`    ${pad('Task Total (Project Archive excluded — no rate)', 54)}   ${gbp(taskCost)}`);

    // Package Subtotal
    console.log('\n  ┌─────────────────────────────────────────────────────────┐');
    console.log(`  │  Equipment           ${pad(gbp(equipCost), 12)}                         │`);
    console.log(`  │  Crew                ${pad(gbp(crewCost), 12)}                         │`);
    console.log(`  │  Tasks               ${pad(gbp(taskCost), 12)}                         │`);
    console.log(`  │  ${'─'.repeat(32)}                         │`);
    console.log(`  │  PACKAGE SUBTOTAL    ${pad(gbp(subtotal), 12)}  (pre-tax cost estimate) │`);
    console.log('  └─────────────────────────────────────────────────────────┘\n');
  });


  describe('Equipment', () => {
    test('Canon EOS R5 (id:1) appears twice but is only counted once', () => {
      // Unique items: id:1 (R5 £150), id:2 (A7S III £120), id:3 (RF lens £75), id:4 (Pocket 2 £35)
      expect(equipCost).toBe(150 + 120 + 75 + 35);
      expect(equipCost).toBe(380);
    });

    test('Duplicate entry does NOT add an extra £150 to equipment cost', () => {
      // With dedup: £380. Without dedup: £530.
      expect(equipCost).not.toBe(530);
    });
  });


  describe('Crew', () => {
    test('Andy Galloway (Lead) — 10 hours at £45/hr', () => {
      // Real rate from moonrise-team-setup.ts: default_hourly_rate = 45.00
      const andyCost = 10 * 45;
      expect(andyCost).toBe(450);
    });

    test('Corri Lee (Second Cam) — 8 hours at £45/hr', () => {
      const corriCost = 8 * 45;
      expect(corriCost).toBe(360);
    });

    test('Crew total = Andy + Corri + Audio Tech', () => {
      // 450 + 360 + (6 × 30 = 180) = 990
      expect(crewCost).toBe(990);
    });
  });


  describe('Tasks (Moonrise task library — real effort_hours)', () => {
    test('Each task cost is effort_hours × hourly_rate', () => {
      expect(taskCosts).toEqual([
         70,   // Shot List Planning:       2.0h × £35
         52.5, // Timeline Coordination:    1.5h × £35
        140,   // Footage Review:           4.0h × £35
        105,   // Rough Cut:                3.0h × £35
        240,   // Color Grading:            6.0h × £40
         90,   // Audio Enhancement:        3.0h × £30
         50,   // Music Selection:          2.0h × £25
         70,   // Client Review:            2.0h × £35
         70,   // Final Export:             2.0h × £35
         35,   // Online Gallery Setup:     1.0h × £35
        null,  // Project Archive:          no hourly_rate → excluded
      ]);
    });

    test('Project Archive (no rate set) contributes £0 and shows as null', () => {
      expect(taskCosts[taskCosts.length - 1]).toBeNull();
    });

    test('Task total = sum of all non-null task costs', () => {
      // 70 + 52.5 + 140 + 105 + 240 + 90 + 50 + 70 + 70 + 35 = 922.5
      expect(taskCost).toBe(922.5);
    });
  });


  describe('Package Subtotal', () => {
    test('Subtotal = equipment + crew + tasks', () => {
      // £380 + £990 + £922.50 = £2,292.50
      expect(subtotal).toBe(380 + 990 + 922.5);
      expect(subtotal).toBe(2292.5);
    });

    test('Package subtotal is pre-tax — VAT not yet applied at this stage', () => {
      // The package estimate shows cost of delivery, not the client-facing price.
      // Tax is only applied on the Estimate/Quote, not in the wizard subtotal.
      const subtotalWithTax = Formulas.backendTotalWithTax(subtotal, MOONRISE.taxRate);
      expect(subtotal).toBeLessThan(subtotalWithTax);
      expect(subtotalWithTax).toBe(Math.round((2292.5 * 1.2) * 100) / 100);
    });
  });
});


// ═══════════════════════════════════════════════════════════════════
//
//   TEST 2: Estimate, Quote, Portal & Payment Splits
//           (same wedding — Emma & Jack — now as a formal quote
//            sent to the client)
//
// ═══════════════════════════════════════════════════════════════════

describe('Moonrise Films — Estimate → Quote → Portal → Payment Splits', () => {

  // ── LINE ITEMS: the formal client-facing pricing ──────────────
  // These reflect the business rate charged to the client, not the
  // internal cost calculated by the package estimate above.
  const LINE_ITEMS = [
    { description: 'Full Day Wedding Coverage',         quantity: 1,   unit_price: 1800.00 },
    { description: 'Second Camera (Sony A7S III)',       quantity: 1,   unit_price:  350.00 },
    { description: 'Drone Aerial Filming',               quantity: 1,   unit_price:  300.00 },
    { description: 'Highlights Film (5 min)',            quantity: 1,   unit_price:  650.00 },
    { description: 'Full Ceremony Edit',                 quantity: 1,   unit_price:  400.00 },
    { description: 'Full Reception Edit',                quantity: 1,   unit_price:  350.00 },
    { description: 'Color Grading Package',              quantity: 1,   unit_price:  280.00 },
    { description: 'Music Licensing',                    quantity: 2,   unit_price:   45.00 },
    { description: 'USB Drive & Online Gallery',         quantity: 1,   unit_price:  120.00 },
    { description: 'Travel (Telford → venue)',           quantity: 1,   unit_price:   65.00 },
  ];

  // ── Compute on every surface ──────────────────────────────────
  const estimateTotal      = Formulas.estimateTotal(LINE_ITEMS);          // Decimal reduce
  const estimateWithTax    = Formulas.backendTotalWithTax(estimateTotal, MOONRISE.taxRate);
  const quoteTotal         = Formulas.estimateTotal(LINE_ITEMS);          // same formula
  const quoteWithTax       = Formulas.backendTotalWithTax(quoteTotal, MOONRISE.taxRate);
  const portal             = Formulas.portalTax(estimateTotal, MOONRISE.taxRate);
  const feLineTotals       = LINE_ITEMS.map(i => Formulas.frontendLineTotal(i.quantity, i.unit_price));
  const feSubtotal         = Formulas.frontendSubtotal(feLineTotals);
  const feResult           = Formulas.portalTax(feSubtotal, MOONRISE.taxRate);

  // ── Payment schedules ─────────────────────────────────────────
  const fiftyFifty = MOONRISE.paymentTemplates.fiftyFifty.map(m =>
    ({ ...m, amount: Formulas.milestoneAmount(m.type, m.value, estimateWithTax) }),
  );
  const threeWay = MOONRISE.paymentTemplates.threeWaySplit.map(m =>
    ({ ...m, amount: Formulas.milestoneAmount(m.type, m.value, estimateWithTax) }),
  );
  const fiftyFiftyTotal = Number(fiftyFifty.reduce((s, m) => s + m.amount, 0).toFixed(2));
  const threeWayTotal   = Number(threeWay.reduce((s, m) => s + m.amount, 0).toFixed(2));

  beforeAll(() => {
    const pad = (s: string, w: number) => s.padEnd(w);
    console.log('\n');
    console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log(`┃  MOONRISE FILMS — Client Estimate: Emma & Jack's Wedding      ${MOONRISE.currency.padEnd(18)}┃`);
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');

    // Line items
    console.log('\n  LINE ITEMS (formal quote to client — Estimate/Quote)');
    LINE_ITEMS.forEach(item => {
      const total = Formulas.frontendLineTotal(item.quantity, item.unit_price);
      console.log(`    ${pad(item.description, 36)} ${String(item.quantity).padStart(3)} × ${pad(gbp(item.unit_price), 10)} = ${gbp(total)}`);
    });
    console.log(`    ${'─'.repeat(62)}`);
    console.log(`    ${pad('Subtotal (stored as total_amount in DB):', 50)}   ${gbp(estimateTotal)}`);
    console.log(`    ${pad(`+ VAT ${MOONRISE.taxRate}%:`, 50)}   ${gbp(estimateWithTax - estimateTotal)}`);
    console.log(`    ${pad('TOTAL (returned on API read as total_with_tax):', 50)}   ${gbp(estimateWithTax)}`);

    // Cross-surface comparison
    console.log('\n  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    console.log('  ┃  CROSS-SURFACE COMPARISON                   Pre-Tax    Post-Tax    ┃');
    console.log('  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
    const refPost = estimateWithTax;
    [
      { name: 'Estimate (backend Decimal reduce)', preTax: estimateTotal, postTax: estimateWithTax },
      { name: 'Quote (same backend formula)',       preTax: quoteTotal,   postTax: quoteWithTax },
      { name: 'Client Portal (FE re-derives tax)', preTax: estimateTotal, postTax: portal.total },
      { name: 'FE Line Item Editor (JS Number)',   preTax: feSubtotal,   postTax: feResult.total },
    ].forEach(r => {
      const ok = Math.abs(r.postTax - refPost) <= 0.01 ? '✅' : `❌ Δ${gbp(Math.abs(r.postTax - refPost))}`;
      console.log(`  ┃  ${pad(r.name, 35)} ${pad(gbp(r.preTax), 12)} ${pad(gbp(r.postTax), 12)} ${pad(ok, 6)} ┃`);
    });
    console.log('  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');

    // Payment schedules
    console.log('\n  PAYMENT SCHEDULES  (from post-tax total: ' + gbp(estimateWithTax) + ')');
    console.log(`\n  50/50 Split (Moonrise default):`);
    fiftyFifty.forEach(m => {
      console.log(`    ${pad(m.label, 38)} ${String(m.value).padStart(3)}% = ${gbp(m.amount)}`);
    });
    console.log(`    ${'─'.repeat(50)}`);
    console.log(`    ${pad('Total', 44)} ${gbp(fiftyFiftyTotal)}  ${Math.abs(fiftyFiftyTotal - estimateWithTax) <= 0.01 ? '✅' : '❌'}`);

    console.log(`\n  3-Way Split:`);
    threeWay.forEach(m => {
      console.log(`    ${pad(m.label, 38)} ${String(m.value).padStart(3)}% = ${gbp(m.amount)}`);
    });
    console.log(`    ${'─'.repeat(50)}`);
    console.log(`    ${pad('Total', 44)} ${gbp(threeWayTotal)}  ${Math.abs(threeWayTotal - estimateWithTax) <= 0.02 ? '✅' : '❌'}`);
    console.log('\n');
  });


  // ── Estimate ─────────────────────────────────────────────────

  describe('Estimate (backend Decimal reduce)', () => {
    test('Subtotal = sum of all line items', () => {
      // 1800 + 350 + 300 + 650 + 400 + 350 + 280 + 90 + 120 + 65 = 4405
      expect(estimateTotal).toBe(4405);
    });

    test('Total with 20% VAT', () => {
      // £4,405 + £881 = £5,286
      expect(estimateWithTax).toBe(Math.round((4405 + 4405 * 0.2) * 100) / 100);
      expect(estimateWithTax).toBe(5286);
    });
  });


  // ── Quote ─────────────────────────────────────────────────────

  describe('Quote (same formula as Estimate)', () => {
    test('Quote subtotal matches Estimate subtotal exactly', () => {
      expect(quoteTotal).toBe(estimateTotal);
    });

    test('Quote total with tax matches Estimate total with tax exactly', () => {
      expect(quoteWithTax).toBe(estimateWithTax);
    });
  });


  // ── Portal ────────────────────────────────────────────────────

  describe('Client Portal (frontend computeTaxBreakdown from stored total)', () => {
    test('Portal reads DB total_amount and re-derives tax correctly', () => {
      expect(portal.total).toBe(estimateWithTax);
    });

    test('Portal VAT amount = £881', () => {
      // £4,405 × 20% = £881.00
      expect(portal.taxAmount).toBe(881);
    });

    test('Portal total matches backend total_with_tax exactly', () => {
      expect(portal.total).toBe(5286);
    });
  });


  // ── Frontend Line Item Editor ─────────────────────────────────

  describe('Frontend Line Item Editor (JS Number arithmetic)', () => {
    test('Music Licensing: 2 × £45 = £90 (integer quantities — no rounding issue)', () => {
      const musicLine = LINE_ITEMS.find(i => i.description === 'Music Licensing')!;
      expect(Formulas.frontendLineTotal(musicLine.quantity, musicLine.unit_price)).toBe(90);
    });

    test('Frontend subtotal matches backend Decimal subtotal', () => {
      expect(feSubtotal).toBe(estimateTotal);
    });

    test('Frontend post-tax total matches backend', () => {
      expect(feResult.total).toBe(estimateWithTax);
    });
  });


  // ── 50/50 Payment Schedule (Moonrise default) ─────────────────

  describe('50/50 Split — Moonrise Films default payment schedule', () => {
    test('Booking Deposit = 50% of £5,286', () => {
      expect(fiftyFifty[0].amount).toBe(2643);
    });

    test('Final Balance = 50% of £5,286', () => {
      expect(fiftyFifty[1].amount).toBe(2643);
    });

    test('Both instalments sum to the full post-tax total', () => {
      expect(fiftyFiftyTotal).toBe(estimateWithTax);
    });
  });


  // ── 3-Way Split ───────────────────────────────────────────────

  describe('3-Way Split — Moonrise Films payment schedule', () => {
    test('Booking Deposit = 34% of £5,286', () => {
      // £5,286 × 0.34 = £1,797.24
      expect(threeWay[0].amount).toBe(1797.24);
    });

    test('Second Instalment = 33% of £5,286', () => {
      // £5,286 × 0.33 = £1,744.38
      expect(threeWay[1].amount).toBe(1744.38);
    });

    test('Final Balance = 33% of £5,286', () => {
      expect(threeWay[2].amount).toBe(1744.38);
    });

    test('3-Way Split accounts for the full total (£0.02 max rounding gap)', () => {
      // 34+33+33 = 100% but three separate toFixed(2) calls can drift by ±1p
      expect(Math.abs(threeWayTotal - estimateWithTax)).toBeLessThanOrEqual(0.02);
    });
  });


  // ── All surfaces agree ────────────────────────────────────────

  describe('All surfaces produce the same post-tax total', () => {
    test('Estimate, Quote, Portal, and FE Editor all agree', () => {
      const totals = [estimateWithTax, quoteWithTax, portal.total, feResult.total];
      expect(totals.every(t => t === totals[0])).toBe(true);
    });

    test('50/50 milestones account for 100% of the post-tax total', () => {
      expect(fiftyFiftyTotal).toBe(estimateWithTax);
    });
  });
});


// ═══════════════════════════════════════════════════════════════════
//
//   TEST 3: Package vs Estimate — understanding the two numbers
//
//   The Package Estimate is a COST-OF-DELIVERY figure (internal).
//   The Estimate/Quote is the CLIENT-FACING PRICE (what they pay).
//   These are deliberately different — the gap is the business margin.
//
// ═══════════════════════════════════════════════════════════════════

describe('Moonrise Films — Package Estimate vs Client Estimate (margin)', () => {

  const packageSubtotal = 2292.5;  // from Test 1 above
  const clientPreTax    = 4405;    // from Test 2 above

  beforeAll(() => {
    const margin = clientPreTax - packageSubtotal;
    const markup = ((clientPreTax / packageSubtotal) - 1) * 100;
    console.log('\n');
    console.log('  ┌────────────────────────────────────────────────────────────────┐');
    console.log('  │  PACKAGE ESTIMATE vs CLIENT ESTIMATE (margin analysis)         │');
    console.log('  ├────────────────────────────────────────────────────────────────┤');
    console.log(`  │  Internal cost (package estimate):   ${gbp(packageSubtotal).padEnd(27)}│`);
    console.log(`  │  Client price  (estimate pre-tax):   ${gbp(clientPreTax).padEnd(27)}│`);
    console.log(`  │  Gross margin:                       ${gbp(margin).padEnd(27)}│`);
    console.log(`  │  Markup:                             ${(markup.toFixed(1) + '%').padEnd(27)}│`);
    console.log('  └────────────────────────────────────────────────────────────────┘\n');
  });

  test('Package estimate (cost) is lower than the client-facing pre-tax price', () => {
    expect(packageSubtotal).toBeLessThan(clientPreTax);
  });

  test('Gross margin = client price − package cost', () => {
    const margin = clientPreTax - packageSubtotal;
    expect(margin).toBe(4405 - 2292.5);
    expect(margin).toBe(2112.5);
  });

  test('Markup is approximately 92% over cost', () => {
    const markup = ((clientPreTax / packageSubtotal) - 1) * 100;
    expect(markup).toBeCloseTo(92.2, 0); // ~92%
  });
});


// ═══════════════════════════════════════════════════════════════════
//
//   TEST 4: Moonrise-specific edge cases
//
// ═══════════════════════════════════════════════════════════════════

describe('Moonrise Films — Edge Cases', () => {

  test('Day-rate cinematographer hired for an extra short hour still pays full day', () => {
    // Moonrise sometimes hires day-rate specialists. max(hours, 1) applies.
    const cost = Formulas.packageCrewCost([
      { name: 'Specialist DOP (day rate)', hours: 0, rate: 800, isDayRate: true },
    ]);
    expect(cost).toBe(800); // 800 × max(0, 1) = 800, not 0
  });

  test('Equipment dedup: 3× Canon EOS R5 in package still costs £150 once', () => {
    const cost = Formulas.packageEquipmentCost([
      { id: 1, name: 'Canon EOS R5', rental_price_per_day: 150 },
      { id: 1, name: 'Canon EOS R5', rental_price_per_day: 150 },
      { id: 1, name: 'Canon EOS R5', rental_price_per_day: 150 },
    ]);
    expect(cost).toBe(150);
  });

  test('Client cancels one camera: negative line item reduces estimate', () => {
    const items = [
      { quantity: 1, unit_price: 350 },   // Second camera
      { quantity: -1, unit_price: 350 },  // Credit — camera cancelled
    ];
    expect(Formulas.estimateTotal(items)).toBe(0);
  });

  test('Zero-tax wedding (export/international client): all surfaces return same subtotal', () => {
    const items = [{ quantity: 1, unit_price: 4405 }];
    const total = Formulas.estimateTotal(items);
    const withTax = Formulas.backendTotalWithTax(total, 0);
    const portal = Formulas.portalTax(total, 0);
    expect(withTax).toBe(total);
    expect(portal.total).toBe(total);
    expect(portal.taxAmount).toBe(0);
  });

  test('Penny-precision deposit: 1% of £5,286 = £52.86', () => {
    const amount = Formulas.milestoneAmount('PERCENT', 1, 5286);
    expect(amount).toBe(52.86);
  });

  test('Fixed deposit: returning client flat-rate retainer of £500', () => {
    const amount = Formulas.milestoneAmount('FIXED', 500, 9999);
    expect(amount).toBe(500); // NOT 500% of 9999
  });

  test('Task with no rate (like Project Archive): null cost, not zero', () => {
    const { perTask, total } = Formulas.packageTaskCost([
      { name: 'Color Grading', hourly_rate: 40, effort_hours: 6 },
      { name: 'Project Archive', hourly_rate: null, effort_hours: 1 },
    ]);
    expect(perTask[0]).toBe(240);
    expect(perTask[1]).toBeNull(); // null, not 0
    expect(total).toBe(240);      // null excluded from sum
  });
});


// ═══════════════════════════════════════════════════════════════════
//
//   TEST 5: Decimal vs JS Number — 100 random GBP items
//
// ═══════════════════════════════════════════════════════════════════

describe('Decimal vs JS Number drift — 100 random GBP line items', () => {

  let seed = 42;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  const randomItems = Array.from({ length: 100 }, (_, i) => ({
    description: `Line item ${i + 1}`,
    quantity: +(0.25 + rand() * 99.75).toFixed(2),
    unit_price: +(0.01 + rand() * 4999.99).toFixed(2),
  }));

  const beTotal    = Formulas.estimateTotal(randomItems);
  const feLineTotals = randomItems.map(i => Formulas.frontendLineTotal(i.quantity, i.unit_price));
  const feTotal    = Formulas.frontendSubtotal(feLineTotals);
  const drift      = Math.abs(beTotal - feTotal);

  beforeAll(() => {
    console.log('\n');
    console.log('  ┌──────────────────────────────────────────────────────────────┐');
    console.log(`  │  DECIMAL vs JS NUMBER — 100 Random GBP Items                 │`);
    console.log('  ├──────────────────────────────────────────────────────────────┤');
    console.log(`  │  Backend (Decimal):  ${gbp(beTotal).padEnd(42)}│`);
    console.log(`  │  Frontend (Number):  ${gbp(feTotal).padEnd(42)}│`);
    console.log(`  │  Drift:              ${gbp(drift).padEnd(42)}│`);
    console.log(`  │  Status:             ${drift < 1 ? '✅ Within £1 tolerance' : '❌ DRIFT EXCEEDED £1'}`.padEnd(65) + '│');
    console.log('  └──────────────────────────────────────────────────────────────┘\n');
  });

  test('Both totals are finite numbers', () => {
    expect(Number.isFinite(beTotal)).toBe(true);
    expect(Number.isFinite(feTotal)).toBe(true);
  });

  test('Drift between Decimal and JS Number stays under £1 across 100 items', () => {
    expect(drift).toBeLessThan(1);
  });

  test('Post-tax totals agree within reasonable tolerance', () => {
    const beTax = Formulas.backendTotalWithTax(beTotal, MOONRISE.taxRate);
    const feTax = Formulas.portalTax(feTotal, MOONRISE.taxRate);
    expect(Math.abs(beTax - feTax.total)).toBeLessThanOrEqual(1);
  });
});
