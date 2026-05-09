import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const filmId = 1;
  const activityId = 2;
  const sceneMomentId = 2;

  const all = await p.cameraSubjectAssignment.findMany({
    where: { recording_setup: { moment: { film_scene: { film_id: filmId } } } },
    select: { id: true, subject_ids: true, visible_subject_ids: true },
  });
  console.log(`Film ${filmId}: ${all.filter(a => a.subject_ids.length > 0).length}/${all.length} assignments have subject_ids`);
  console.log(`Film ${filmId}: ${all.filter(a => a.visible_subject_ids.length > 0).length}/${all.length} have visible_subject_ids`);

  const slots = await p.packageSpaceSlot.findMany({
    where: { package_activity_id: activityId },
    select: { id: true, name: true },
  });
  console.log('Activity space slots:', slots);
  for (const slot of slots) {
    const subj = await p.spaceSlotMomentSubject.findMany({ where: { space_slot_id: slot.id } });
    const cam = await p.spaceSlotMomentCamera.findMany({ where: { space_slot_id: slot.id } });
    console.log(`  slot ${slot.id} (${slot.name}): moment-subject overrides=${subj.length}, moment-camera overrides=${cam.length}`);
    const forMoment = subj.filter((r: any) => r.package_activity_moment_id === 19);
    console.log(`    for source moment 19 (Groom Takes Position): ${forMoment.length}`);
  }

  const sm = await p.sceneMoment.findUnique({
    where: { id: sceneMomentId },
    select: { id: true, name: true, description: true, ai_prompt: true, updated_at: true, created_at: true },
  });
  console.log('\nSceneMoment', sceneMomentId, ':');
  console.log('  name:', sm?.name);
  console.log('  ai_prompt populated?', !!sm?.ai_prompt);
  console.log('  created == updated?', sm?.created_at.getTime() === sm?.updated_at.getTime());

  await p.$disconnect();
})();
