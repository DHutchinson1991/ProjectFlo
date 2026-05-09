import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  // Restore SceneMoment durations from PackageActivityMoment template
  const pam = await p.packageActivityMoment.findMany({
    where: { package_activity_id: 69 },
    orderBy: { order_index: 'asc' },
    select: { id: true, name: true, duration_seconds: true, order_index: true },
  });

  const moments = await p.sceneMoment.findMany({
    where: { film_scene: { film_id: 10 } },
    orderBy: { order_index: 'asc' },
  });

  console.log(`Restoring ${moments.length} SceneMoment durations from ${pam.length} PackageActivityMoments...`);

  for (const m of moments) {
    // Match by order_index
    const template = pam.find(t => t.order_index === m.order_index);
    if (template && template.duration_seconds !== m.duration) {
      await p.sceneMoment.update({
        where: { id: m.id },
        data: { duration: template.duration_seconds },
      });
      console.log(`  ${m.name}: ${m.duration}s → ${template.duration_seconds}s`);
    } else if (template) {
      console.log(`  ${m.name}: already correct (${m.duration}s)`);
    } else {
      console.log(`  ${m.name}: no matching template (kept ${m.duration}s)`);
    }
  }

  const updated = await p.sceneMoment.findMany({
    where: { film_scene: { film_id: 10 } },
    orderBy: { order_index: 'asc' },
    select: { id: true, name: true, duration: true },
  });
  const totalDur = updated.reduce((s, m) => s + (m.duration ?? 0), 0);
  console.log(`\nDone! Total duration: ${totalDur}s (${Math.round(totalDur / 60)}min)`);
}
main().catch(console.error).finally(() => p.$disconnect());
