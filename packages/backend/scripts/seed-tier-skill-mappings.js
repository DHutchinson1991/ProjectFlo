/**
 * Seed Tier-Specific Skill-Role Mappings
 *
 * Assigns skills to specific payment bracket tiers.
 * Lower tiers get basic/foundational skills.
 * Higher tiers get advanced/specialized skills.
 *
 * Resolution logic: the highest bracket tier with matching skills is picked.
 * So a task requiring "Creative Direction" (Senior Director tier) gets assigned
 * to a Senior Director bracket, while a task needing only "Planning" (Junior Director)
 * gets a Junior Director bracket.
 *
 * Run: node scripts/seed-tier-skill-mappings.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🎯 Seeding tier-specific skill-role mappings...\n");

  // Fetch roles and brackets
  const roles = await prisma.job_roles.findMany({ where: { is_active: true } });
  const brackets = await prisma.payment_brackets.findMany({
    where: { is_active: true },
    orderBy: [{ job_role_id: "asc" }, { level: "asc" }],
  });

  const roleMap = {};
  for (const r of roles) roleMap[r.name] = r;

  // Build role -> level -> bracket lookup
  const bracketLookup = {}; // { roleName: { level: bracket } }
  for (const b of brackets) {
    const role = roles.find((r) => r.id === b.job_role_id);
    if (!role) continue;
    if (!bracketLookup[role.name]) bracketLookup[role.name] = {};
    bracketLookup[role.name][b.level] = b;
  }

  // Helper
  const getBracketId = (roleName, level) => {
    const b = bracketLookup[roleName]?.[level];
    if (!b) {
      console.warn(`  ⚠ No bracket found for ${roleName} level ${level}`);
      return null;
    }
    return b.id;
  };

  // ═══════════════════════════════════════════════════════════════
  // TIER-SPECIFIC SKILL ASSIGNMENTS
  //
  // Each skill is assigned to the tier where it FIRST becomes available.
  // Higher tiers inherit lower-tier skills implicitly via the resolution
  // algorithm (it picks the highest matching bracket).
  // ═══════════════════════════════════════════════════════════════

  const tierSkills = [
    // ─── DIRECTOR: 4 tiers (Junior L1 → Lead L4) ──────────────
    // Junior Director: foundational planning & communication
    { role: "director", level: 1, skill: "Planning", priority: 1 },
    { role: "director", level: 1, skill: "Communication", priority: 1 },
    // Mid Director: creative planning & visual foundations
    { role: "director", level: 2, skill: "Shot Planning", priority: 2 },
    { role: "director", level: 2, skill: "Mood Board Creation", priority: 2 },
    { role: "director", level: 2, skill: "Design", priority: 2 },
    // Senior Director: creative leadership & style
    { role: "director", level: 3, skill: "Creative Direction", priority: 3 },
    { role: "director", level: 3, skill: "Style Guide", priority: 3 },
    { role: "director", level: 3, skill: "Visual Arts", priority: 2 },
    // Lead Director: strategic vision & narrative mastery
    { role: "director", level: 4, skill: "Storytelling", priority: 3 },
    { role: "director", level: 4, skill: "Creative Vision", priority: 3 },

    // ─── VIDEOGRAPHER: 5 tiers (Trainee L1 → Lead L5) ─────────
    // Trainee Videographer: equipment basics & travel
    { role: "videographer", level: 1, skill: "Equipment Management", priority: 1 },
    { role: "videographer", level: 1, skill: "Technical Knowledge", priority: 1 },
    { role: "videographer", level: 1, skill: "Travel", priority: 1 },
    // Junior Videographer: camera operation & location work
    { role: "videographer", level: 2, skill: "Camera Operation", priority: 2 },
    { role: "videographer", level: 2, skill: "Photography", priority: 1 },
    { role: "videographer", level: 2, skill: "Location Management", priority: 1 },
    // Mid Videographer: lighting, detail & scouting
    { role: "videographer", level: 3, skill: "Lighting", priority: 2 },
    { role: "videographer", level: 3, skill: "Detail Photography", priority: 2 },
    { role: "videographer", level: 3, skill: "Location Scouting", priority: 2 },
    // Senior Videographer: event coverage & multi-cam
    { role: "videographer", level: 4, skill: "Cinematography", priority: 3 },
    { role: "videographer", level: 4, skill: "Event Coverage", priority: 3 },
    { role: "videographer", level: 4, skill: "Multi-Camera", priority: 2 },

    // ─── EDITOR: 4 tiers (Junior L1 → Lead L4) ────────────────
    // Junior Editor: basic organization & media handling
    { role: "editor", level: 1, skill: "Organization", priority: 1 },
    { role: "editor", level: 1, skill: "Gallery Setup", priority: 1 },
    { role: "editor", level: 1, skill: "Media Rendering", priority: 1 },
    // Mid Editor: core editing skills
    { role: "editor", level: 2, skill: "Video Editing", priority: 2 },
    { role: "editor", level: 2, skill: "Rough Cut Editing", priority: 2 },
    { role: "editor", level: 2, skill: "Final Export", priority: 2 },
    { role: "editor", level: 2, skill: "Quality Control", priority: 2 },
    // Senior Editor: advanced creative editing
    { role: "editor", level: 3, skill: "Color Grading", priority: 3 },
    { role: "editor", level: 3, skill: "Music Sync", priority: 3 },
    { role: "editor", level: 3, skill: "Content Review", priority: 2 },
    { role: "editor", level: 3, skill: "Storytelling", priority: 2 },
    // Lead Editor: specialized creative work
    { role: "editor", level: 4, skill: "Motion Graphics", priority: 3 },
    { role: "editor", level: 4, skill: "Title Card Design", priority: 2 },
    { role: "editor", level: 4, skill: "Music Selection", priority: 2 },
    { role: "editor", level: 4, skill: "Music Licensing", priority: 1 },

    // ─── PRODUCER: 5 tiers (Assistant L1 → Executive L5) ──────
    // Assistant Producer: documentation & admin
    { role: "producer", level: 1, skill: "Documentation", priority: 1 },
    { role: "producer", level: 1, skill: "Archiving", priority: 1 },
    // Junior Producer: basic coordination
    { role: "producer", level: 2, skill: "Communication", priority: 1 },
    { role: "producer", level: 2, skill: "Planning", priority: 1 },
    { role: "producer", level: 2, skill: "Scheduling", priority: 2 },
    // Mid Producer: client & vendor management
    { role: "producer", level: 3, skill: "Client Relations", priority: 3 },
    { role: "producer", level: 3, skill: "Budget Management", priority: 2 },
    { role: "producer", level: 3, skill: "Vendor Coordination", priority: 2 },
    { role: "producer", level: 3, skill: "Presentation", priority: 2 },
    // Senior Producer: project leadership & legal
    { role: "producer", level: 4, skill: "Project Management", priority: 3 },
    { role: "producer", level: 4, skill: "Contract Management", priority: 3 },
    { role: "producer", level: 4, skill: "Legal", priority: 2 },
    { role: "producer", level: 4, skill: "Client Delivery", priority: 2 },
    // Executive Producer: business strategy
    { role: "producer", level: 5, skill: "Consultation", priority: 3 },
    { role: "producer", level: 5, skill: "Sales", priority: 2 },
    { role: "producer", level: 5, skill: "Pricing", priority: 2 },
    { role: "producer", level: 5, skill: "Invoicing", priority: 1 },

    // ─── SOUND ENGINEER: 5 tiers (Trainee L1 → Lead L5) ───────
    // Trainee Sound Engineer: basics
    { role: "sound_engineer", level: 1, skill: "Technical Skills", priority: 1 },
    // Junior Sound Engineer: recording
    { role: "sound_engineer", level: 2, skill: "Audio Recording", priority: 2 },
    // Mid Sound Engineer: enhancement & processing
    { role: "sound_engineer", level: 3, skill: "Audio Enhancement", priority: 3 },
    // Senior Sound Engineer: creative sound design
    { role: "sound_engineer", level: 4, skill: "Sound Design", priority: 3 },
    // Lead Sound Engineer: mastery
    { role: "sound_engineer", level: 5, skill: "Audio Engineering", priority: 3 },
  ];

  // Step 1: Clear existing mappings (all have payment_bracket_id = null)
  const deleted = await prisma.skill_role_mappings.deleteMany({});
  console.log(`🗑  Cleared ${deleted.count} old role-level skill mappings`);

  // Step 2: Create tier-specific mappings
  let created = 0;
  let skipped = 0;

  for (const entry of tierSkills) {
    const role = roleMap[entry.role];
    if (!role) {
      console.warn(`  ⚠ Role "${entry.role}" not found, skipping`);
      skipped++;
      continue;
    }

    const bracketId = getBracketId(entry.role, entry.level);
    if (!bracketId) {
      skipped++;
      continue;
    }

    // Normalize skill name to Title Case
    const skillName = entry.skill
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    try {
      // Use findFirst + create/update pattern for null-safe upsert
      const existing = await prisma.skill_role_mappings.findFirst({
        where: {
          skill_name: skillName,
          job_role_id: role.id,
          payment_bracket_id: bracketId,
          brand_id: null,
        },
      });

      if (existing) {
        await prisma.skill_role_mappings.update({
          where: { id: existing.id },
          data: { priority: entry.priority, is_active: true },
        });
      } else {
        await prisma.skill_role_mappings.create({
          data: {
            skill_name: skillName,
            job_role_id: role.id,
            payment_bracket_id: bracketId,
            brand_id: null,
            priority: entry.priority,
          },
        });
      }
      created++;
    } catch (err) {
      console.error(`  ✗ Failed: "${skillName}" → ${entry.role} L${entry.level}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Created/updated ${created} tier-specific skill mappings`);
  if (skipped > 0) console.log(`⚠  Skipped ${skipped}`);

  // Step 3: Verify distribution
  console.log("\n📊 Tier skill distribution:");
  const allMappings = await prisma.skill_role_mappings.findMany({
    where: { is_active: true },
    include: {
      job_role: { select: { name: true, display_name: true } },
      payment_bracket: { select: { name: true, level: true } },
    },
    orderBy: [{ job_role_id: "asc" }, { payment_bracket_id: "asc" }, { priority: "desc" }],
  });

  const byRoleTier = new Map();
  for (const m of allMappings) {
    const roleName = m.job_role.display_name || m.job_role.name;
    const tierName = m.payment_bracket ? `L${m.payment_bracket.level} (${m.payment_bracket.name})` : "General";
    const key = `${roleName} → ${tierName}`;
    if (!byRoleTier.has(key)) byRoleTier.set(key, []);
    byRoleTier.get(key).push(m.skill_name);
  }

  for (const [key, skills] of byRoleTier.entries()) {
    console.log(`  ${key}: ${skills.join(", ")}`);
  }

  console.log(`\n🎯 Total: ${allMappings.length} tier-specific mappings`);
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
