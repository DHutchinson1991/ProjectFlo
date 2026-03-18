/**
 * One-shot script: update all payment brackets to NLW base + £5/hr increments,
 * and update all equipment rental prices to bare minimum values.
 *
 * Run from packages/backend:
 *   node scripts/update-brackets-and-equipment.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// T1 = £12.21 | T2 = £13.46 | T3 = £14.71 | T4 = £15.96 | T5 = £17.21 (total £5 spread)
const T = {
  1: { h: 12.21, d: parseFloat((12.21 * 8).toFixed(2)), o: parseFloat((12.21 * 1.5).toFixed(2)) },
  2: { h: 13.46, d: parseFloat((13.46 * 8).toFixed(2)), o: parseFloat((13.46 * 1.5).toFixed(2)) },
  3: { h: 14.71, d: parseFloat((14.71 * 8).toFixed(2)), o: parseFloat((14.71 * 1.5).toFixed(2)) },
  4: { h: 15.96, d: parseFloat((15.96 * 8).toFixed(2)), o: parseFloat((15.96 * 1.5).toFixed(2)) },
  5: { h: 17.21, d: parseFloat((17.21 * 8).toFixed(2)), o: parseFloat((17.21 * 1.5).toFixed(2)) },
};

// Map tier name -> tier number (same for all categories)
const TIER_LEVEL_MAP = {
  trainee:   1,
  assistant: 1,
  junior:    2,
  mid:       3,
  senior:    4,
  lead:      5,
  executive: 5,
};

// Equipment rental price overrides keyed by item_code
const EQUIPMENT_RENTAL = {
  "CAM-R5-001":      12.00,
  "CAM-A7S3-001":    10.00,
  "CAM-POCKET2-001":  3.00,
  "CAM-XA60-001":     8.00,
  "CAM-XA60-002":     8.00,
  "CAM-XA60-003":     8.00,
  "CAM-XA60-004":     8.00,
  "CAM-XA60-005":     8.00,
  "LENS-RF2470-001":  7.00,
  "LENS-FE85-001":    5.00,
  "AUD-H6-001":       3.00,
  "AUD-MKE600-001":   2.00,
  "AUD-WGOII-001":    3.00,
  "LIGHT-S30C-001":   5.00,
  "LIGHT-300D-001":   4.00,
  "GRIP-504HD-001":   3.00,
  "GRIP-RSC-001":     4.00,
  "PWR-TITON90-001":  2.00,
  "STOR-CFX-001":     1.00,
  "ACC-CAGE-001":     1.00,
  "BG-ELGATO-001":    2.00,
};

async function main() {
  console.log("🔄 Updating payment brackets to NLW base + £5/hr increments...\n");

  const brackets = await prisma.payment_brackets.findMany({
    where: { is_active: true },
  });

  let bracketUpdated = 0;
  for (const bracket of brackets) {
    const tierNum = TIER_LEVEL_MAP[bracket.name] ?? bracket.level ?? 1;
    const rates = T[Math.min(tierNum, 5)] ?? T[1];

    await prisma.payment_brackets.update({
      where: { id: bracket.id },
      data: {
        hourly_rate: rates.h,
        day_rate: rates.d,
        overtime_rate: rates.o,
      },
    });
    bracketUpdated++;
    console.log(`  ✅ ${bracket.display_name ?? bracket.name} (${bracket.name}) → £${rates.h}/hr`);
  }

  console.log(`\n✨ Updated ${bracketUpdated} payment brackets.\n`);

  // ── Equipment ───────────────────────────────────────────────────────────────
  console.log("🔄 Updating equipment rental prices...\n");

  let equipUpdated = 0;
  for (const [code, price] of Object.entries(EQUIPMENT_RENTAL)) {
    const result = await prisma.equipment.updateMany({
      where: { item_code: code },
      data: { rental_price_per_day: price },
    });
    if (result.count > 0) {
      console.log(`  ✅ ${code} → £${price.toFixed(2)}/day`);
      equipUpdated += result.count;
    } else {
      console.log(`  ⏭️  ${code} — not found, skipped`);
    }
  }

  console.log(`\n✨ Updated ${equipUpdated} equipment records.`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
