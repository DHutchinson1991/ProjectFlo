/**
 * Seed skill-to-role mappings and backfill task_library.skills_needed + complexity_score
 *
 * This script:
 * 1. Creates global skill → job_role mappings (used by auto-generation)
 * 2. Backfills skills_needed[] and complexity_score on existing task_library entries
 *
 * Usage (from packages/backend):
 *   node scripts/seed-skill-role-mappings.js
 *
 * Idempotent — safe to run multiple times.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Skill → Role Mappings ──────────────────────────────────────────────────
// Each skill maps to a job_role name with a priority (higher = stronger match).
// The system uses these during task auto-generation to resolve which
// job_role + payment_bracket should be attached to generated project tasks.

const SKILL_ROLE_MAPPINGS = [
  // === PRODUCER SKILLS ===
  { skill_name: "Sales", job_role: "producer", priority: 2 },
  { skill_name: "Communication", job_role: "producer", priority: 2 },
  { skill_name: "Client Relations", job_role: "producer", priority: 3 },
  { skill_name: "Consultation", job_role: "producer", priority: 3 },
  { skill_name: "Presentation", job_role: "producer", priority: 2 },
  { skill_name: "Project Management", job_role: "producer", priority: 3 },
  { skill_name: "Planning", job_role: "producer", priority: 2 },
  { skill_name: "Pricing", job_role: "producer", priority: 2 },
  { skill_name: "Legal", job_role: "producer", priority: 2 },
  { skill_name: "Documentation", job_role: "producer", priority: 1 },
  { skill_name: "Scheduling", job_role: "producer", priority: 2 },
  { skill_name: "Vendor Coordination", job_role: "producer", priority: 2 },
  { skill_name: "Contract Management", job_role: "producer", priority: 3 },
  { skill_name: "Budget Management", job_role: "producer", priority: 2 },
  { skill_name: "Client Delivery", job_role: "producer", priority: 2 },
  { skill_name: "Invoicing", job_role: "producer", priority: 1 },
  { skill_name: "Archiving", job_role: "producer", priority: 1 },

  // === DIRECTOR SKILLS ===
  { skill_name: "Creative Direction", job_role: "director", priority: 3 },
  { skill_name: "Creative Vision", job_role: "director", priority: 3 },
  { skill_name: "Storytelling", job_role: "director", priority: 3 },
  { skill_name: "Shot Planning", job_role: "director", priority: 3 },
  { skill_name: "Mood Board Creation", job_role: "director", priority: 2 },
  { skill_name: "Style Guide", job_role: "director", priority: 2 },
  { skill_name: "Visual Arts", job_role: "director", priority: 2 },
  { skill_name: "Design", job_role: "director", priority: 2 },

  // === VIDEOGRAPHER SKILLS ===
  { skill_name: "Cinematography", job_role: "videographer", priority: 3 },
  { skill_name: "Camera Operation", job_role: "videographer", priority: 3 },
  { skill_name: "Lighting", job_role: "videographer", priority: 2 },
  { skill_name: "Event Coverage", job_role: "videographer", priority: 3 },
  { skill_name: "Detail Photography", job_role: "videographer", priority: 2 },
  { skill_name: "Multi-Camera", job_role: "videographer", priority: 2 },
  { skill_name: "Location Scouting", job_role: "videographer", priority: 2 },
  { skill_name: "Equipment Management", job_role: "videographer", priority: 2 },
  { skill_name: "Location Management", job_role: "videographer", priority: 1 },
  { skill_name: "Photography", job_role: "videographer", priority: 1 },
  { skill_name: "Travel", job_role: "videographer", priority: 1 },
  { skill_name: "Technical Knowledge", job_role: "videographer", priority: 1 },

  // === EDITOR SKILLS ===
  { skill_name: "Video Editing", job_role: "editor", priority: 3 },
  { skill_name: "Color Grading", job_role: "editor", priority: 3 },
  { skill_name: "Content Review", job_role: "editor", priority: 2 },
  { skill_name: "Organization", job_role: "editor", priority: 1 },
  { skill_name: "Music Sync", job_role: "editor", priority: 2 },
  { skill_name: "Music Selection", job_role: "editor", priority: 2 },
  { skill_name: "Music Licensing", job_role: "editor", priority: 1 },
  { skill_name: "Title Card Design", job_role: "editor", priority: 2 },
  { skill_name: "Motion Graphics", job_role: "editor", priority: 2 },
  { skill_name: "Rough Cut Editing", job_role: "editor", priority: 3 },
  { skill_name: "Final Export", job_role: "editor", priority: 2 },
  { skill_name: "Quality Control", job_role: "editor", priority: 2 },
  { skill_name: "Media Rendering", job_role: "editor", priority: 2 },
  { skill_name: "Gallery Setup", job_role: "editor", priority: 1 },

  // === SOUND ENGINEER SKILLS ===
  { skill_name: "Audio Engineering", job_role: "sound_engineer", priority: 3 },
  { skill_name: "Sound Design", job_role: "sound_engineer", priority: 3 },
  { skill_name: "Audio Recording", job_role: "sound_engineer", priority: 3 },
  { skill_name: "Audio Enhancement", job_role: "sound_engineer", priority: 3 },
  { skill_name: "Technical Skills", job_role: "sound_engineer", priority: 1 },

  // === CROSS-ROLE SKILLS (lower priority as fallbacks) ===
  // Communication can also be relevant for director (client-facing)
  { skill_name: "Communication", job_role: "director", priority: 1 },
  // Storytelling is also an editor skill
  { skill_name: "Storytelling", job_role: "editor", priority: 2 },
  // Planning is also a director skill (shot planning, creative planning)
  { skill_name: "Planning", job_role: "director", priority: 1 },
];

// ─── Task Library Skill & Complexity Backfill ───────────────────────────────
// Maps task names to their skills_needed[] and complexity_score.
// complexity_score 1-2 → Junior/Trainee bracket
// complexity_score 3-4 → Mid bracket
// complexity_score 5-6 → Senior bracket
// complexity_score 7-8 → Lead bracket
// complexity_score 9-10 → Executive/Principal bracket

const TASK_SKILLS = {
  // LEAD PHASE — Sales/administrative work, low complexity
  "Lead Qualification": {
    skills_needed: ["Sales", "Communication", "Client Relations"],
    complexity_score: 2,
  },
  "Lead Follow-up": {
    skills_needed: ["Sales", "Communication"],
    complexity_score: 1,
  },
  "Lead Nurturing": {
    skills_needed: ["Client Relations", "Communication", "Sales"],
    complexity_score: 2,
  },

  // INQUIRY PHASE — Client-facing, mid-low complexity
  "Initial Inquiry Response": {
    skills_needed: ["Communication", "Client Relations", "Sales"],
    complexity_score: 2,
  },
  "Consultation Scheduling": {
    skills_needed: ["Scheduling", "Communication"],
    complexity_score: 1,
  },
  "Portfolio Presentation": {
    skills_needed: ["Presentation", "Client Relations", "Creative Direction"],
    complexity_score: 4,
  },
  "Requirements Discovery": {
    skills_needed: ["Consultation", "Planning", "Client Relations"],
    complexity_score: 4,
  },

  // BOOKING PHASE — Business operations
  "Quote Generation": {
    skills_needed: ["Pricing", "Documentation", "Client Relations"],
    complexity_score: 3,
  },
  "Contract Preparation": {
    skills_needed: ["Legal", "Documentation", "Contract Management"],
    complexity_score: 3,
  },
  "Contract Negotiation": {
    skills_needed: ["Legal", "Client Relations", "Communication"],
    complexity_score: 5,
  },
  "Booking Confirmation": {
    skills_needed: ["Client Relations", "Documentation", "Invoicing"],
    complexity_score: 2,
  },

  // CREATIVE DEVELOPMENT PHASE — High creative involvement
  "Creative Brief Development": {
    skills_needed: ["Creative Direction", "Communication", "Planning"],
    complexity_score: 6,
  },
  "Style Guide Creation": {
    skills_needed: ["Design", "Visual Arts", "Style Guide"],
    complexity_score: 5,
  },
  "Shot List Planning": {
    skills_needed: ["Shot Planning", "Cinematography", "Storytelling"],
    complexity_score: 6,
  },
  "Mood Board Creation": {
    skills_needed: ["Mood Board Creation", "Visual Arts", "Creative Vision"],
    complexity_score: 4,
  },
  "Creative Concept Approval": {
    skills_needed: ["Creative Direction", "Client Relations", "Presentation"],
    complexity_score: 5,
  },

  // PRE-PRODUCTION PHASE — Technical + logistics
  "Location Scouting": {
    skills_needed: ["Location Scouting", "Location Management", "Photography", "Travel"],
    complexity_score: 4,
  },
  "Equipment Preparation": {
    skills_needed: ["Equipment Management", "Technical Knowledge"],
    complexity_score: 3,
  },
  "Timeline Coordination": {
    skills_needed: ["Scheduling", "Project Management", "Communication"],
    complexity_score: 4,
  },
  "Vendor Coordination": {
    skills_needed: ["Vendor Coordination", "Communication", "Planning"],
    complexity_score: 3,
  },
  "Client Pre-Production Meeting": {
    skills_needed: ["Project Management", "Communication", "Planning"],
    complexity_score: 4,
  },

  // PRODUCTION PHASE — On-set work
  "Activity Coverage": {
    skills_needed: ["Cinematography", "Audio Recording", "Event Coverage"],
    complexity_score: 5,
  },

  // POST-PRODUCTION PHASE — Technical editing work
  "Footage Review and Selection": {
    skills_needed: ["Content Review", "Storytelling", "Organization"],
    complexity_score: 3,
  },
  "Audio Enhancement": {
    skills_needed: ["Audio Engineering", "Sound Design", "Audio Enhancement"],
    complexity_score: 5,
  },
  "Color Grading": {
    skills_needed: ["Color Grading", "Visual Arts", "Technical Skills"],
    complexity_score: 6,
  },
  "Music Selection and Licensing": {
    skills_needed: ["Music Selection", "Music Licensing", "Music Sync"],
    complexity_score: 4,
  },
  "Title Cards and Graphics": {
    skills_needed: ["Title Card Design", "Motion Graphics", "Design"],
    complexity_score: 5,
  },
  "Rough Cut": {
    skills_needed: ["Rough Cut Editing", "Video Editing", "Storytelling"],
    complexity_score: 5,
  },
  "Client Review and Revisions": {
    skills_needed: ["Video Editing", "Client Relations", "Communication"],
    complexity_score: 4,
  },

  // DELIVERY PHASE — Technical + administrative
  "Final Export and Rendering": {
    skills_needed: ["Final Export", "Media Rendering", "Quality Control"],
    complexity_score: 3,
  },
  "Quality Control Check": {
    skills_needed: ["Quality Control", "Content Review", "Technical Skills"],
    complexity_score: 4,
  },
  "USB/Physical Media Preparation": {
    skills_needed: ["Media Rendering", "Documentation"],
    complexity_score: 1,
  },
  "Online Gallery Setup": {
    skills_needed: ["Gallery Setup", "Client Delivery", "Technical Skills"],
    complexity_score: 2,
  },
  "Client Delivery Coordination": {
    skills_needed: ["Client Delivery", "Communication", "Client Relations"],
    complexity_score: 2,
  },
  "Final Invoice and Payment": {
    skills_needed: ["Invoicing", "Documentation", "Client Relations"],
    complexity_score: 2,
  },
  "Project Archive": {
    skills_needed: ["Archiving", "Documentation", "Organization"],
    complexity_score: 1,
  },
};

async function main() {
  console.log("🎯 Seeding Skill-to-Role Mappings & Task Library Backfill\n");

  // ── Step 1: Fetch existing job roles ──────────────────────────
  const roles = await prisma.job_roles.findMany({
    where: { is_active: true },
    select: { id: true, name: true, display_name: true },
  });

  const roleMap = new Map(roles.map((r) => [r.name, r]));
  console.log(`Found ${roles.length} job roles: ${roles.map((r) => r.display_name || r.name).join(", ")}\n`);

  // ── Step 2: Create skill-role mappings ────────────────────────
  console.log("📋 Creating skill-role mappings...\n");
  let mappingsCreated = 0;
  let mappingsSkipped = 0;
  let mappingsErrors = 0;

  for (const mapping of SKILL_ROLE_MAPPINGS) {
    const role = roleMap.get(mapping.job_role);
    if (!role) {
      console.log(`  ⚠️  Skipping "${mapping.skill_name}" → "${mapping.job_role}" (role not found)`);
      mappingsErrors++;
      continue;
    }

    // Prisma upsert doesn't handle NULL in compound unique constraints well
    // (SQL NULL != NULL), so we use findFirst + create/update instead.
    const existing = await prisma.skill_role_mappings.findFirst({
      where: {
        skill_name: mapping.skill_name,
        job_role_id: role.id,
        brand_id: null,
      },
    });

    if (existing) {
      await prisma.skill_role_mappings.update({
        where: { id: existing.id },
        data: { priority: mapping.priority, is_active: true },
      });
      mappingsSkipped++;
      console.log(`  ⏭️  "${mapping.skill_name}" → ${role.display_name || role.name} (updated)`);
    } else {
      await prisma.skill_role_mappings.create({
        data: {
          skill_name: mapping.skill_name,
          job_role_id: role.id,
          brand_id: null,
          priority: mapping.priority,
        },
      });
      mappingsCreated++;
      console.log(`  ✅ "${mapping.skill_name}" → ${role.display_name || role.name} (priority: ${mapping.priority})`);
    }
  }

  console.log(`\n📊 Mappings: ${mappingsCreated} created, ${mappingsSkipped} skipped, ${mappingsErrors} errors\n`);

  // ── Step 3: Backfill task_library skills_needed + complexity_score ──
  console.log("📚 Backfilling task library skills & complexity scores...\n");

  const allTasks = await prisma.task_library.findMany({
    where: { is_active: true },
    select: { id: true, name: true, skills_needed: true, complexity_score: true },
  });

  let tasksUpdated = 0;
  let tasksSkipped = 0;

  for (const task of allTasks) {
    const config = TASK_SKILLS[task.name];
    if (!config) {
      console.log(`  ⏭️  "${task.name}" — no skill mapping defined, skipping`);
      tasksSkipped++;
      continue;
    }

    const needsUpdate =
      task.skills_needed.length === 0 ||
      task.complexity_score === null ||
      task.complexity_score === 1; // Default score, worth updating

    if (needsUpdate) {
      await prisma.task_library.update({
        where: { id: task.id },
        data: {
          skills_needed: config.skills_needed,
          complexity_score: config.complexity_score,
        },
      });
      tasksUpdated++;
      console.log(`  ✅ "${task.name}" → skills: [${config.skills_needed.join(", ")}], complexity: ${config.complexity_score}`);
    } else {
      tasksSkipped++;
      console.log(`  ⏭️  "${task.name}" — already has skills & complexity`);
    }
  }

  console.log(`\n📊 Tasks: ${tasksUpdated} updated, ${tasksSkipped} skipped\n`);

  // ── Step 4: Verification ──────────────────────────────────────
  console.log("🔍 Verification Summary:\n");

  const totalMappings = await prisma.skill_role_mappings.count({ where: { is_active: true } });
  const uniqueSkills = await prisma.skill_role_mappings.groupBy({
    by: ["skill_name"],
    where: { is_active: true },
  });

  const tasksWithSkills = await prisma.task_library.count({
    where: { is_active: true, NOT: { skills_needed: { isEmpty: true } } },
  });
  const totalActiveTasks = await prisma.task_library.count({ where: { is_active: true } });

  console.log(`  📋 Total skill-role mappings:  ${totalMappings}`);
  console.log(`  🔤 Unique skills mapped:       ${uniqueSkills.length}`);
  console.log(`  📚 Tasks with skills:          ${tasksWithSkills}/${totalActiveTasks}`);

  // Show complexity distribution
  const complexityDist = await prisma.task_library.groupBy({
    by: ["complexity_score"],
    where: { is_active: true, NOT: { skills_needed: { isEmpty: true } } },
    _count: true,
    orderBy: { complexity_score: "asc" },
  });

  console.log("\n  📊 Complexity Score Distribution:");
  for (const row of complexityDist) {
    const score = row.complexity_score ?? 0;
    const level = Math.min(5, Math.max(1, Math.ceil(score / 2)));
    const levelNames = { 1: "Junior", 2: "Mid", 3: "Senior", 4: "Lead", 5: "Executive" };
    console.log(`     Score ${score} → Level ${level} (${levelNames[level]}): ${row._count} tasks`);
  }

  // Show role coverage
  console.log("\n  🎭 Role Coverage:");
  for (const [roleName, role] of roleMap) {
    const count = await prisma.skill_role_mappings.count({
      where: { job_role_id: role.id, is_active: true },
    });
    const brackets = await prisma.payment_brackets.count({
      where: { job_role_id: role.id, is_active: true },
    });
    console.log(`     ${role.display_name || roleName}: ${count} skills mapped, ${brackets} payment brackets`);
  }

  console.log("\n✨ Done! Skill-role mapping system is ready.");
  console.log("   Tasks will now auto-resolve roles & rates during project task generation.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
