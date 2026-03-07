/**
 * Seed industry-standard payment bracket levels for all active job roles.
 *
 * Usage (from packages/backend):
 *   node scripts/seed-payment-brackets.js
 *
 * This is idempotent — it skips brackets that already exist for a role+name combo.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Industry-standard tiers per role category ───────────────────────────────
//    Rates in GBP. Adjust to your market.

const TIERS = {
  // Creative roles
  creative: [
    { name: "junior",  display_name: "Junior",       level: 1, hourly_rate: 15.00, day_rate: 120.00, overtime_rate: 22.50, color: "#66BB6A", description: "Entry-level, assisting senior crew" },
    { name: "mid",     display_name: "Mid-Level",     level: 2, hourly_rate: 22.50, day_rate: 180.00, overtime_rate: 33.75, color: "#42A5F5", description: "Independently competent" },
    { name: "senior",  display_name: "Senior",        level: 3, hourly_rate: 35.00, day_rate: 280.00, overtime_rate: 52.50, color: "#AB47BC", description: "Lead creative, mentors juniors" },
    { name: "lead",    display_name: "Lead / Head",   level: 4, hourly_rate: 50.00, day_rate: 400.00, overtime_rate: 75.00, color: "#FF7043", description: "Department lead, full creative ownership" },
  ],
  // Technical roles
  technical: [
    { name: "trainee", display_name: "Trainee",       level: 1, hourly_rate: 12.00, day_rate: 96.00,  overtime_rate: 18.00, color: "#78909C", description: "In training, shadowing experienced crew" },
    { name: "junior",  display_name: "Junior",         level: 2, hourly_rate: 15.00, day_rate: 120.00, overtime_rate: 22.50, color: "#66BB6A", description: "Entry-level operator" },
    { name: "mid",     display_name: "Mid-Level",      level: 3, hourly_rate: 20.00, day_rate: 160.00, overtime_rate: 30.00, color: "#42A5F5", description: "Solid all-round operator" },
    { name: "senior",  display_name: "Senior",         level: 4, hourly_rate: 30.00, day_rate: 240.00, overtime_rate: 45.00, color: "#AB47BC", description: "Expert operator, complex setups" },
    { name: "lead",    display_name: "Lead / Principal",level: 5, hourly_rate: 40.00, day_rate: 320.00, overtime_rate: 60.00, color: "#FF7043", description: "Technical lead, oversees full kit & crew" },
  ],
  // Production roles
  production: [
    { name: "assistant",display_name: "Assistant",     level: 1, hourly_rate: 13.00, day_rate: 104.00, overtime_rate: 19.50, color: "#78909C", description: "Production assistant" },
    { name: "junior",   display_name: "Junior",        level: 2, hourly_rate: 18.00, day_rate: 144.00, overtime_rate: 27.00, color: "#66BB6A", description: "Junior producer / coordinator" },
    { name: "mid",      display_name: "Mid-Level",     level: 3, hourly_rate: 28.00, day_rate: 224.00, overtime_rate: 42.00, color: "#42A5F5", description: "Experienced producer" },
    { name: "senior",   display_name: "Senior",        level: 4, hourly_rate: 40.00, day_rate: 320.00, overtime_rate: 60.00, color: "#AB47BC", description: "Senior producer, client-facing lead" },
    { name: "executive",display_name: "Executive",     level: 5, hourly_rate: 55.00, day_rate: 440.00, overtime_rate: 82.50, color: "#FF7043", description: "Executive producer, full project ownership" },
  ],
  // Post-production roles
  "post-production": [
    { name: "junior",  display_name: "Junior",         level: 1, hourly_rate: 14.00, day_rate: 112.00, overtime_rate: 21.00, color: "#66BB6A", description: "Assist edits, basic assembly" },
    { name: "mid",     display_name: "Mid-Level",      level: 2, hourly_rate: 22.00, day_rate: 176.00, overtime_rate: 33.00, color: "#42A5F5", description: "Independent editor, standard deliverables" },
    { name: "senior",  display_name: "Senior",         level: 3, hourly_rate: 35.00, day_rate: 280.00, overtime_rate: 52.50, color: "#AB47BC", description: "Senior editor, complex multi-cam / VFX" },
    { name: "lead",    display_name: "Lead / Supervising",level: 4,hourly_rate: 45.00, day_rate: 360.00, overtime_rate: 67.50, color: "#FF7043", description: "Post-production supervisor" },
  ],
  // Fallback for uncategorized roles
  _default: [
    { name: "junior",  display_name: "Junior",        level: 1, hourly_rate: 14.00, day_rate: 112.00, overtime_rate: 21.00, color: "#66BB6A", description: "Entry-level" },
    { name: "mid",     display_name: "Mid-Level",     level: 2, hourly_rate: 22.00, day_rate: 176.00, overtime_rate: 33.00, color: "#42A5F5", description: "Independent contributor" },
    { name: "senior",  display_name: "Senior",        level: 3, hourly_rate: 35.00, day_rate: 280.00, overtime_rate: 52.50, color: "#AB47BC", description: "Expert level" },
    { name: "lead",    display_name: "Lead",          level: 4, hourly_rate: 45.00, day_rate: 360.00, overtime_rate: 67.50, color: "#FF7043", description: "Team lead" },
  ],
};

async function main() {
  console.log("🎬 Seeding industry-standard payment brackets...\n");

  const roles = await prisma.job_roles.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${roles.length} active job roles.\n`);

  let created = 0;
  let skipped = 0;

  for (const role of roles) {
    const category = (role.category || "").toLowerCase();
    const tiers = TIERS[category] || TIERS._default;

    console.log(`  📋 ${role.display_name || role.name} (${category || "uncategorized"}) — ${tiers.length} tiers`);

    for (const tier of tiers) {
      // Build a role-specific display name, e.g. "Junior Videographer"
      const roleLabel = role.display_name || role.name;
      const displayName = `${tier.display_name} ${roleLabel}`;

      try {
        await prisma.payment_brackets.upsert({
          where: {
            job_role_id_name: {
              job_role_id: role.id,
              name: tier.name,
            },
          },
          update: {}, // Don't overwrite if already exists
          create: {
            job_role_id: role.id,
            name: tier.name,
            display_name: displayName,
            level: tier.level,
            hourly_rate: tier.hourly_rate,
            day_rate: tier.day_rate,
            overtime_rate: tier.overtime_rate,
            description: tier.description,
            color: tier.color,
            is_active: true,
          },
        });
        created++;
        console.log(`    ✅ Tier ${tier.level}: ${displayName} — £${tier.hourly_rate.toFixed(2)}/hr`);
      } catch (err) {
        if (err.code === "P2002") {
          skipped++;
          console.log(`    ⏭️  Tier ${tier.level}: ${displayName} — already exists`);
        } else {
          throw err;
        }
      }
    }
    console.log("");
  }

  console.log(`\n✨ Done! Created ${created} brackets, skipped ${skipped} (already existed).`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
