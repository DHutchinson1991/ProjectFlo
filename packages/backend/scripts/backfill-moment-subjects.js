const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const chunk = (items, size) => {
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

const main = async () => {
  console.log("[backfill] Loading scene subjects...");
  const sceneSubjects = await prisma.filmSceneSubject.findMany({
    select: {
      scene_id: true,
      subject_id: true,
      priority: true,
      notes: true,
    },
  });

  if (sceneSubjects.length === 0) {
    console.log("[backfill] No scene subjects found. Nothing to backfill.");
    return;
  }

  console.log("[backfill] Loading moments...");
  const moments = await prisma.sceneMoment.findMany({
    select: { id: true, film_scene_id: true },
  });

  if (moments.length === 0) {
    console.log("[backfill] No moments found. Nothing to backfill.");
    return;
  }

  const subjectsByScene = new Map();
  for (const assignment of sceneSubjects) {
    if (!subjectsByScene.has(assignment.scene_id)) {
      subjectsByScene.set(assignment.scene_id, []);
    }
    subjectsByScene.get(assignment.scene_id).push(assignment);
  }

  const payload = [];
  for (const moment of moments) {
    const assignments = subjectsByScene.get(moment.film_scene_id) || [];
    if (!assignments.length) continue;
    for (const assignment of assignments) {
      payload.push({
        moment_id: moment.id,
        subject_id: assignment.subject_id,
        priority: assignment.priority,
        notes: assignment.notes || undefined,
      });
    }
  }

  if (payload.length === 0) {
    console.log("[backfill] No moment subjects to create.");
    return;
  }

  console.log(`[backfill] Creating ${payload.length} moment subject assignments (skip duplicates)...`);
  const batches = chunk(payload, 1000);
  let createdTotal = 0;

  for (const batch of batches) {
    const result = await prisma.filmSceneMomentSubject.createMany({
      data: batch,
      skipDuplicates: true,
    });
    createdTotal += result.count || 0;
  }

  console.log(`[backfill] Done. Created ${createdTotal} assignments.`);
};

main()
  .catch((error) => {
    console.error("[backfill] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
