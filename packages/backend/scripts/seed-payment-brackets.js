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

// ── UK NLW base + £1.25/hr increments (total £5 spread from trainee to lead) ───────
// T1 = £12.21 | T2 = £13.46 | T3 = £14.71 | T4 = £15.96 | T5 = £17.21
const T = {
  1: { h: 12.21, d: parseFloat((12.21 * 8).toFixed(2)), o: parseFloat((12.21 * 1.5).toFixed(2)) },
  2: { h: 13.46, d: parseFloat((13.46 * 8).toFixed(2)), o: parseFloat((13.46 * 1.5).toFixed(2)) },
  3: { h: 14.71, d: parseFloat((14.71 * 8).toFixed(2)), o: parseFloat((14.71 * 1.5).toFixed(2)) },
  4: { h: 15.96, d: parseFloat((15.96 * 8).toFixed(2)), o: parseFloat((15.96 * 1.5).toFixed(2)) },
  5: { h: 17.21, d: parseFloat((17.21 * 8).toFixed(2)), o: parseFloat((17.21 * 1.5).toFixed(2)) },
};

const TIERS = {
  // Creative roles
  creative: [
    { name: "junior",  display_name: "Junior",       level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: "#66BB6A", description: "Entry-level, assisting senior crew" },
    { name: "mid",     display_name: "Mid-Level",     level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: "#42A5F5", description: "Independently competent" },
    { name: "senior",  display_name: "Senior",        level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: "#AB47BC", description: "Lead creative, mentors juniors" },
    { name: "lead",    display_name: "Lead / Head",   level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: "#FF7043", description: "Department lead, full creative ownership" },
  ],
  // Technical roles
  technical: [
    { name: "trainee", display_name: "Trainee",        level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: "#78909C", description: "In training, shadowing experienced crew" },
    { name: "junior",  display_name: "Junior",         level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: "#66BB6A", description: "Entry-level operator" },
    { name: "mid",     display_name: "Mid-Level",      level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: "#42A5F5", description: "Solid all-round operator" },
    { name: "senior",  display_name: "Senior",         level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: "#AB47BC", description: "Expert operator, complex setups" },
    { name: "lead",    display_name: "Lead / Principal",level: 5, hourly_rate: T[5].h, day_rate: T[5].d, overtime_rate: T[5].o, color: "#FF7043", description: "Technical lead, oversees full kit & crew" },
  ],
  // Production roles
  production: [
    { name: "assistant",display_name: "Assistant",     level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: "#78909C", description: "Production assistant" },
    { name: "junior",   display_name: "Junior",        level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: "#66BB6A", description: "Junior producer / coordinator" },
    { name: "mid",      display_name: "Mid-Level",     level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: "#42A5F5", description: "Experienced producer" },
    { name: "senior",   display_name: "Senior",        level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: "#AB47BC", description: "Senior producer, client-facing lead" },
    { name: "executive",display_name: "Executive",     level: 5, hourly_rate: T[5].h, day_rate: T[5].d, overtime_rate: T[5].o, color: "#FF7043", description: "Executive producer, full project ownership" },
  ],
  // Post-production roles
  "post-production": [
    { name: "junior",  display_name: "Junior",            level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: "#66BB6A", description: "Assist edits, basic assembly" },
    { name: "mid",     display_name: "Mid-Level",         level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: "#42A5F5", description: "Independent editor, standard deliverables" },
    { name: "senior",  display_name: "Senior",            level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: "#AB47BC", description: "Senior editor, complex multi-cam / VFX" },
    { name: "lead",    display_name: "Lead / Supervising",level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: "#FF7043", description: "Post-production supervisor" },
  ],
  // Fallback for uncategorized roles
  _default: [
    { name: "junior",  display_name: "Junior",    level: 1, hourly_rate: T[1].h, day_rate: T[1].d, overtime_rate: T[1].o, color: "#66BB6A", description: "Entry-level" },
    { name: "mid",     display_name: "Mid-Level", level: 2, hourly_rate: T[2].h, day_rate: T[2].d, overtime_rate: T[2].o, color: "#42A5F5", description: "Independent contributor" },
    { name: "senior",  display_name: "Senior",    level: 3, hourly_rate: T[3].h, day_rate: T[3].d, overtime_rate: T[3].o, color: "#AB47BC", description: "Expert level" },
    { name: "lead",    display_name: "Lead",      level: 4, hourly_rate: T[4].h, day_rate: T[4].d, overtime_rate: T[4].o, color: "#FF7043", description: "Team lead" },
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
          update: {
            hourly_rate: tier.hourly_rate,
            day_rate: tier.day_rate,
            overtime_rate: tier.overtime_rate,
            level: tier.level,
            display_name: displayName,
            description: tier.description,
            color: tier.color,
          },
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
