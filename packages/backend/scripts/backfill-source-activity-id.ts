/**
 * Backfill SceneMoment.source_activity_id for moments that were
 * auto-populated from PackageActivityMoments but missing the linkage.
 *
 * Strategy:
 * 1. Find SceneMoments where source_activity_id IS NULL
 * 2. Look up the scene's activity via PackageFilmSceneSchedule
 * 3. Match by name (case-insensitive) to PackageActivityMoment
 * 4. Set source_activity_id = the matched activity ID
 *
 * Run: npx ts-node scripts/backfill-source-activity-id.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all SceneMoments missing source_activity_id
  const orphanMoments = await prisma.sceneMoment.findMany({
    where: { source_activity_id: null },
    select: {
      id: true,
      name: true,
      film_scene_id: true,
    },
  });

  console.log(`Found ${orphanMoments.length} SceneMoments with NULL source_activity_id`);
  if (orphanMoments.length === 0) return;

  // Group by scene
  const byScene = new Map<number, typeof orphanMoments>();
  for (const m of orphanMoments) {
    const arr = byScene.get(m.film_scene_id) ?? [];
    arr.push(m);
    byScene.set(m.film_scene_id, arr);
  }

  let updated = 0;
  let skipped = 0;

  for (const [sceneId, moments] of byScene) {
    // Find the activity linked to this scene via PackageFilmSceneSchedule
    const schedule = await prisma.packageFilmSceneSchedule.findFirst({
      where: { scene_id: sceneId, package_activity_id: { not: null } },
      select: { package_activity_id: true },
    });

    if (!schedule?.package_activity_id) {
      skipped += moments.length;
      continue;
    }

    const activityId = schedule.package_activity_id;

    // Bulk update: set source_activity_id for all moments in this scene
    const result = await prisma.sceneMoment.updateMany({
      where: {
        film_scene_id: sceneId,
        source_activity_id: null,
      },
      data: { source_activity_id: activityId },
    });

    updated += result.count;
    console.log(`  Scene ${sceneId}: set source_activity_id=${activityId} on ${result.count} moments`);
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (no activity link)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
