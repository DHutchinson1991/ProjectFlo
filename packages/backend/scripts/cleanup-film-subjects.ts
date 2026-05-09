/**
 * One-off script: Restore all FilmSubjects for Moonrise films,
 * then strip the first moment of each film to only Officiant + Guests.
 *
 * Usage: cd packages/backend && npx tsx scripts/cleanup-film-subjects.ts
 */
import { PrismaClient } from '@prisma/client';

const FIRST_MOMENT_ROLES = ['Officiant', 'Guests'];

async function main() {
  const prisma = new PrismaClient();
  try {
    const brand = await prisma.brands.findFirst({
      where: { name: { contains: 'Moonrise', mode: 'insensitive' } },
    });
    if (!brand) throw new Error('Moonrise brand not found');

    // Get all subject roles for this brand
    const roles = await prisma.subjectRole.findMany({
      where: { brand_id: brand.id },
      orderBy: { order_index: 'asc' },
    });
    console.log(`Found ${roles.length} subject roles for brand ${brand.name}`);

    // Get films that should have subjects (Wedding Package Film, Ceremony Package Film)
    const films = await prisma.film.findMany({
      where: { brand_id: brand.id },
      include: { subjects: true },
    });

    for (const film of films) {
      // Only restore subjects for films that had them (film ids 9 and 10 based on seed)
      // Films with scenes that have moment subjects need FilmSubjects
      const scenes = await prisma.filmScene.findMany({
        where: { film_id: film.id },
        select: { id: true },
      });
      if (scenes.length === 0) continue;

      console.log(`\nFilm: "${film.name}" (id=${film.id}), currently ${film.subjects.length} subjects, ${scenes.length} scenes`);

      const existingNames = new Set(film.subjects.map((s) => s.name.toLowerCase()));

      // Ensure each role has a FilmSubject
      for (const role of roles) {
        if (existingNames.has(role.role_name.toLowerCase())) {
          console.log(`  ✓ Already exists: "${role.role_name}"`);
          continue;
        }
        const created = await prisma.filmSubject.create({
          data: {
            film_id: film.id,
            name: role.role_name,
            role_template_id: role.id,
          },
        });
        console.log(`  + Created: "${role.role_name}" (id=${created.id})`);
      }

      // Now get all subjects for this film
      const allSubjects = await prisma.filmSubject.findMany({
        where: { film_id: film.id },
        include: { role_template: true },
      });

      // For each scene, ensure all subjects are linked as scene subjects
      for (const scene of scenes) {
        const existingSceneSubjects = await prisma.filmSceneSubject.findMany({
          where: { scene_id: scene.id },
        });
        const existingSubIds = new Set(existingSceneSubjects.map((s) => s.subject_id));

        for (const sub of allSubjects) {
          if (existingSubIds.has(sub.id)) continue;
          await prisma.filmSceneSubject.create({
            data: {
              scene_id: scene.id,
              subject_id: sub.id,
              priority: 'BACKGROUND',
            },
          });
          console.log(`  + Linked "${sub.name}" to scene ${scene.id}`);
        }
      }

      // Get first moment of first scene
      const firstScene = await prisma.filmScene.findFirst({
        where: { film_id: film.id },
        orderBy: { order_index: 'asc' },
      });
      if (!firstScene) continue;

      const firstMoment = await prisma.sceneMoment.findFirst({
        where: { film_scene_id: firstScene.id },
        orderBy: { order_index: 'asc' },
        include: {
          subjects: {
            include: { subject: { include: { role_template: true } } },
          },
        },
      });
      if (!firstMoment) continue;

      console.log(`\n  First moment: "${firstMoment.name}" (id=${firstMoment.id}), ${firstMoment.subjects.length} moment subjects`);

      // Ensure all subjects exist on the first moment
      const existingMomentSubIds = new Set(firstMoment.subjects.map((ms) => ms.subject_id));
      for (const sub of allSubjects) {
        if (existingMomentSubIds.has(sub.id)) continue;
        await prisma.filmSceneMomentSubject.create({
          data: {
            moment_id: firstMoment.id,
            subject_id: sub.id,
            priority: 'BACKGROUND',
          },
        });
        console.log(`  + Added "${sub.name}" to first moment`);
      }

      // Now strip the first moment down to ONLY the desired roles
      const keepRoleNames = new Set(FIRST_MOMENT_ROLES.map((r) => r.toLowerCase()));
      const momentSubjects = await prisma.filmSceneMomentSubject.findMany({
        where: { moment_id: firstMoment.id },
        include: { subject: { include: { role_template: true } } },
      });

      const toRemoveFromMoment = momentSubjects.filter(
        (ms) => !keepRoleNames.has(ms.subject.role_template?.role_name?.toLowerCase() ?? ''),
      );

      if (toRemoveFromMoment.length > 0) {
        console.log(`\n  Stripping first moment to only ${FIRST_MOMENT_ROLES.join(' + ')}:`);
        for (const ms of toRemoveFromMoment) {
          console.log(`    ✗ Removing "${ms.subject.name}" from first moment`);
        }
        await prisma.filmSceneMomentSubject.deleteMany({
          where: { id: { in: toRemoveFromMoment.map((ms) => ms.id) } },
        });
      }

      // Show what remains on the first moment
      const remaining = await prisma.filmSceneMomentSubject.findMany({
        where: { moment_id: firstMoment.id },
        include: { subject: true },
      });
      console.log(`  ✓ First moment now has: ${remaining.map((ms) => ms.subject.name).join(', ')}`);
    }

    // Also restore PackageDaySubjects if they were deleted
    console.log('\n--- Restoring PackageDaySubjects ---');
    const packages = await prisma.service_packages.findMany({
      where: { brand_id: brand.id },
      include: { event_days: true, day_subjects: { include: { role_template: true } } },
    });

    for (const pkg of packages) {
      const existingRoleIds = new Set(pkg.day_subjects.map((s) => s.role_template_id));
      const weddingDay = pkg.event_days.find((d) => d.name?.toLowerCase().includes('wedding'));
      if (!weddingDay) continue;

      let created = 0;
      for (const role of roles) {
        if (existingRoleIds.has(role.id)) continue;
        await prisma.packageDaySubject.create({
          data: {
            package_id: pkg.id,
            event_day_template_id: weddingDay.id,
            name: role.role_name,
            role_template_id: role.id,
            order_index: role.order_index,
          },
        });
        created++;
      }
      if (created > 0) {
        console.log(`  Package "${pkg.name}": restored ${created} PackageDaySubjects`);
      } else {
        console.log(`  Package "${pkg.name}": all PackageDaySubjects present`);
      }
    }

    console.log('\n✅ Done. All subjects restored, first moment stripped to Officiant + Guests only.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
