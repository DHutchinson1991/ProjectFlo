/**
 * Migrate Inquiry & Booking phase tasks in the task library.
 *
 * This script:
 * 1. Removes old Lead, Inquiry, and Booking phase tasks from task_library
 * 2. Removes their skill/complexity backfill data so re-seeding is clean
 *
 * After running this, re-run the full seed + skill-role backfill:
 *   npx prisma db seed
 *   node scripts/seed-skill-role-mappings.js
 *   node scripts/backfill-default-job-roles.js   (with server running)
 *
 * Usage (from packages/backend):
 *   node scripts/migrate-inquiry-booking-tasks.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Old task names that are being removed/replaced
const OLD_TASKS = [
  // Lead phase (entire phase removed)
  "Lead Qualification",
  "Lead Follow-up",
  "Lead Nurturing",
  // Old Inquiry phase tasks (replaced with expanded set)
  "Consultation Scheduling",   // was Inquiry phase, now in Booking phase with different context
  "Requirements Discovery",    // replaced by Send/Review Needs Assessment + Discovery Call
  // Old Booking phase tasks that are renamed/restructured
  // (Quote Generation, Contract Preparation, Contract Negotiation, Booking Confirmation
  //  still exist by name but with updated descriptions — the seed will skip them
  //  since they match by name. We update them below.)
];

// Tasks whose descriptions/hours/order changed but name stayed the same
const UPDATED_TASKS = [
  {
    name: "Initial Inquiry Response",
    phase: "Inquiry",
    description: "Acknowledge inquiry, introduce yourself, and set expectations for the process",
    effort_hours: 0.5,
    order_index: 1,
  },
  {
    name: "Portfolio Presentation",
    phase: "Inquiry",
    description: "Share relevant work samples that match the client's style and vision",
    effort_hours: 0.5,
    order_index: 5,
  },
  {
    name: "Quote Generation",
    phase: "Booking",
    description: "Create formal detailed quote reflecting any changes agreed during consultation",
    effort_hours: 0.75,
    order_index: 5,
  },
  {
    name: "Contract Preparation",
    phase: "Booking",
    description: "Draft contract based on the agreed quote and terms",
    effort_hours: 0.5,
    order_index: 6,
  },
  {
    name: "Contract Negotiation",
    phase: "Booking",
    description: "Review terms with client, handle revisions, and reach final agreement",
    effort_hours: 0.75,
    order_index: 7,
  },
  {
    name: "Booking Confirmation",
    phase: "Booking",
    description: "Collect deposit, block the date, and send welcome pack to client",
    effort_hours: 0.5,
    order_index: 8,
  },
];

async function main() {
  console.log("=== Migrating Inquiry & Booking Task Library ===\n");

  // Find the Moonrise Films brand
  const brand = await prisma.brands.findUnique({
    where: { name: "Moonrise Films" },
  });

  if (!brand) {
    console.error("❌ Moonrise Films brand not found. Run seeds first.");
    process.exit(1);
  }

  const brandId = brand.id;
  console.log(`Brand: ${brand.name} (ID: ${brandId})\n`);

  // 1. Delete old tasks
  console.log("--- Removing old tasks ---");
  for (const taskName of OLD_TASKS) {
    const deleted = await prisma.task_library.deleteMany({
      where: { name: taskName, brand_id: brandId },
    });
    if (deleted.count > 0) {
      console.log(`  ✅ Deleted: ${taskName}`);
    } else {
      console.log(`  ⏭️  Not found (already removed): ${taskName}`);
    }
  }

  // 2. Update existing tasks with new descriptions/hours/order
  console.log("\n--- Updating existing tasks ---");
  for (const task of UPDATED_TASKS) {
    const updated = await prisma.task_library.updateMany({
      where: { name: task.name, brand_id: brandId },
      data: {
        description: task.description,
        effort_hours: task.effort_hours,
        order_index: task.order_index,
      },
    });
    if (updated.count > 0) {
      console.log(`  ✅ Updated: ${task.name} → order ${task.order_index}, ${task.effort_hours}h`);
    } else {
      console.log(`  ⏭️  Not found (will be created by seed): ${task.name}`);
    }
  }

  // 3. Summary
  const remaining = await prisma.task_library.findMany({
    where: {
      brand_id: brandId,
      phase: { in: ["Lead", "Inquiry", "Booking"] },
    },
    orderBy: [{ phase: "asc" }, { order_index: "asc" }],
    select: { name: true, phase: true, order_index: true, effort_hours: true },
  });

  console.log(`\n--- Remaining Lead/Inquiry/Booking tasks: ${remaining.length} ---`);
  for (const t of remaining) {
    console.log(`  ${t.phase.padEnd(10)} #${t.order_index}  ${t.name} (${t.effort_hours}h)`);
  }

  console.log("\n✅ Migration complete.");
  console.log("\nNext steps:");
  console.log("  1. npx prisma db seed                        (creates new tasks)");
  console.log("  2. node scripts/seed-skill-role-mappings.js   (backfills skills + complexity)");
  console.log("  3. node scripts/backfill-default-job-roles.js (assigns roles — needs server running)");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
